import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { supabaseAdmin } from "@/lib/supabase";

export const desktopRouter = createTRPCRouter({
  // Get all desktops (admin)
  list: protectedProcedure.query(async () => {
    const { data, error } = await supabaseAdmin
      .from('desktops')
      .select(`
        *,
        desktop_type:desktop_types(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }

    return data;
  }),

  // Get available desktops (public) - filtered by type
  listAvailable: publicProcedure
    .input(
      z.object({
        typeId: z.string().optional(),
        date: z.string().optional(), // ISO date string for checking availability
        time: z.string().optional(), // Time in HH:MM format
        durationMinutes: z.number().optional().default(60),
        showAll: z.boolean().optional().default(true), // Show all desktops including booked ones
      }).optional()
    )
    .query(async ({ input }) => {
      let query = supabaseAdmin
        .from('desktops')
        .select(`
          *,
          desktop_type:desktop_types(*)
        `)
        .eq('status', 'available')
        .eq('is_active', true);

      if (input?.typeId) {
        query = query.eq('desktop_type_id', input.typeId);
      }

      const { data, error } = await query.order('desktop_name');

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      // Filter by weekly_hours if date is provided
      let filteredBySchedule = data;
      if (input?.date) {
        const dayOfWeek = new Date(input.date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

        filteredBySchedule = data.filter((desktop) => {
          if (!desktop.weekly_hours) return true; // If no schedule, assume available
          const daySchedule = desktop.weekly_hours[dayOfWeek];
          return daySchedule?.available !== false;
        });
      }

      // Check booking status for each desktop if date and time are provided
      if (input?.date && input?.time) {
        const startDateTime = new Date(`${input.date}T${input.time}:00`);
        const endDateTime = new Date(startDateTime.getTime() + (input.durationMinutes || 60) * 60000);

        // Get all active bookings that could conflict
        const { data: allBookings } = await supabaseAdmin
          .from('desktop_allocations')
          .select('desktop_id, start_time, end_time')
          .eq('status', 'active')
          .gte('end_time', startDateTime.toISOString())
          .lte('start_time', endDateTime.toISOString());

        // Add booking status to each desktop
        const desktopsWithStatus = filteredBySchedule.map((desktop) => {
          const hasConflict = allBookings?.some((booking) => {
            if (booking.desktop_id !== desktop.id) return false;

            const bookingStart = new Date(booking.start_time);
            const bookingEnd = new Date(booking.end_time);

            // Check for time overlap
            return (
              (startDateTime >= bookingStart && startDateTime < bookingEnd) ||
              (endDateTime > bookingStart && endDateTime <= bookingEnd) ||
              (startDateTime <= bookingStart && endDateTime >= bookingEnd)
            );
          });

          return {
            ...desktop,
            isBooked: hasConflict,
            bookingStatus: hasConflict ? 'booked' : 'available',
          };
        });

        // If showAll is true, return all desktops with their status
        // Otherwise, return only available ones
        if (input.showAll) {
          return desktopsWithStatus;
        } else {
          return desktopsWithStatus.filter(d => !d.isBooked);
        }
      }

      return filteredBySchedule;
    }),

  // Get desktop by ID (public)
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const { data, error } = await supabaseAdmin
        .from('desktops')
        .select(`
          *,
          desktop_type:desktop_types(*)
        `)
        .eq('id', input.id)
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Desktop not found",
        });
      }

      return data;
    }),

  // Get desktop types (public)
  getTypes: publicProcedure.query(async () => {
    const { data, error } = await supabaseAdmin
      .from('desktop_types')
      .select('*')
      .eq('is_active', true)
      .order('display_name');

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }

    return data;
  }),

  // Get booking settings (public)
  getSettings: publicProcedure.query(async () => {
    const { data, error } = await supabaseAdmin
      .from('booking_settings')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (error) {
      // Return default settings if not found
      return {
        slot_duration_minutes: 30,
        max_hours_per_day: 4,
        max_sessions_per_day: 2,
        days_ahead_booking: 1,
        business_hours_start: '09:00',
        business_hours_end: '19:00',
      };
    }

    return data;
  }),

  // Create desktop (admin)
  create: protectedProcedure
    .input(
      z.object({
        desktopName: z.string().min(1),
        desktopTypeId: z.string(),
        branchId: z.string().optional(),
        status: z.enum(["available", "occupied", "maintenance", "reserved"]).default("available"),
        specifications: z.any().optional(),
        weeklyHours: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { data, error } = await supabaseAdmin
        .from('desktops')
        .insert({
          desktop_name: input.desktopName,
          desktop_type_id: input.desktopTypeId,
          branch_id: input.branchId,
          status: input.status,
          specifications: input.specifications || {},
          is_active: true,
          weekly_hours: input.weeklyHours || {
            monday: { available: true, start: "09:00", end: "19:00" },
            tuesday: { available: true, start: "09:00", end: "19:00" },
            wednesday: { available: true, start: "09:00", end: "19:00" },
            thursday: { available: true, start: "09:00", end: "19:00" },
            friday: { available: true, start: "09:00", end: "19:00" },
            saturday: { available: false },
            sunday: { available: false },
          },
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return data;
    }),

  // Update desktop (admin)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        desktopName: z.string().min(1).optional(),
        desktopTypeId: z.string().optional(),
        status: z.enum(["available", "occupied", "maintenance", "reserved"]).optional(),
        specifications: z.any().optional(),
        weeklyHours: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;

      const dbUpdate: any = {};
      if (updateData.desktopName) dbUpdate.desktop_name = updateData.desktopName;
      if (updateData.desktopTypeId) dbUpdate.desktop_type_id = updateData.desktopTypeId;
      if (updateData.status) dbUpdate.status = updateData.status;
      if (updateData.specifications !== undefined) dbUpdate.specifications = updateData.specifications;
      if (updateData.weeklyHours !== undefined) dbUpdate.weekly_hours = updateData.weeklyHours;

      const { data, error } = await supabaseAdmin
        .from('desktops')
        .update(dbUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: error ? "INTERNAL_SERVER_ERROR" : "NOT_FOUND",
          message: error?.message || "Desktop not found",
        });
      }

      return data;
    }),

  // Delete desktop (admin)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const { error } = await supabaseAdmin
        .from('desktops')
        .delete()
        .eq('id', input.id);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return { success: true };
    }),
});
