import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { supabaseAdmin } from "@/lib/supabase";

export const allocationRouter = createTRPCRouter({
  // Get all allocations (admin)
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(['pending', 'active', 'completed', 'cancelled', 'no_show']).optional(),
        desktopId: z.string().optional(),
        studentId: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      let query = supabaseAdmin
        .from('desktop_allocations')
        .select(`
          *,
          desktop:desktops(*),
          student:profiles!student_id(*)
        `)
        .order('start_time', { ascending: false });

      if (input?.status) {
        query = query.eq('status', input.status);
      }

      if (input?.desktopId) {
        query = query.eq('desktop_id', input.desktopId);
      }

      if (input?.studentId) {
        query = query.eq('student_id', input.studentId);
      }

      if (input?.startDate) {
        query = query.gte('start_time', input.startDate);
      }

      if (input?.endDate) {
        query = query.lte('start_time', input.endDate);
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return data;
    }),

  // Get allocation by ID (public)
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const { data, error } = await supabaseAdmin
        .from('desktop_allocations')
        .select(`
          *,
          desktop:desktops(*),
          student:profiles!student_id(*)
        `)
        .eq('id', input.id)
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Allocation not found",
        });
      }

      return data;
    }),

  // Get student's usage for a specific day (public)
  getStudentDailyUsage: publicProcedure
    .input(
      z.object({
        studentId: z.string(),
        date: z.string(), // ISO date string (YYYY-MM-DD)
      })
    )
    .query(async ({ input }) => {
      const startOfDay = new Date(input.date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(input.date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabaseAdmin
        .from('desktop_allocations')
        .select('*')
        .eq('student_id', input.studentId)
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
        .eq('status', 'active');

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      // Calculate total minutes and sessions
      const totalMinutes = data.reduce((sum, alloc) => sum + (alloc.duration_minutes || 0), 0);
      const totalSessions = data.length;

      return {
        totalMinutes,
        totalHours: totalMinutes / 60,
        totalSessions,
        allocations: data,
      };
    }),

  // Check availability (public)
  checkAvailability: publicProcedure
    .input(
      z.object({
        desktopId: z.string(),
        startTime: z.string(), // ISO string
        durationMinutes: z.number().min(15).max(480),
        studentId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const startTime = new Date(input.startTime);
      const endTime = new Date(startTime.getTime() + input.durationMinutes * 60000);

      // 1. Check desktop exists and is available
      const { data: desktop, error: desktopError } = await supabaseAdmin
        .from('desktops')
        .select('*')
        .eq('id', input.desktopId)
        .single();

      if (desktopError || !desktop) {
        return {
          isAvailable: false,
          reason: "Desktop not found",
        };
      }

      if (desktop.status !== 'available') {
        return {
          isAvailable: false,
          reason: `Desktop is ${desktop.status}`,
        };
      }

      // 2. Check weekly hours
      const dayOfWeek = startTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      if (desktop.weekly_hours && desktop.weekly_hours[dayOfWeek]) {
        const daySchedule = desktop.weekly_hours[dayOfWeek];
        if (!daySchedule.available) {
          return {
            isAvailable: false,
            reason: `Desktop is not available on ${dayOfWeek}`,
          };
        }

        // Check time range
        if (daySchedule.start && daySchedule.end) {
          const [startHour, startMin] = daySchedule.start.split(':').map(Number);
          const [endHour, endMin] = daySchedule.end.split(':').map(Number);

          const scheduleStart = new Date(startTime);
          scheduleStart.setHours(startHour, startMin, 0, 0);

          const scheduleEnd = new Date(startTime);
          scheduleEnd.setHours(endHour, endMin, 0, 0);

          if (startTime < scheduleStart || endTime > scheduleEnd) {
            return {
              isAvailable: false,
              reason: `Desktop is only available from ${daySchedule.start} to ${daySchedule.end}`,
            };
          }
        }
      }

      // 3. Check for conflicting allocations
      const { data: conflicts, error: conflictError } = await supabaseAdmin
        .from('desktop_allocations')
        .select('*')
        .eq('desktop_id', input.desktopId)
        .eq('status', 'active')
        .or(`start_time.lt.${endTime.toISOString()},end_time.gt.${startTime.toISOString()}`);

      if (conflictError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: conflictError.message,
        });
      }

      // Check for actual time overlaps
      const hasConflict = conflicts?.some((alloc) => {
        const allocStart = new Date(alloc.start_time);
        const allocEnd = new Date(alloc.end_time);
        return (
          (startTime >= allocStart && startTime < allocEnd) ||
          (endTime > allocStart && endTime <= allocEnd) ||
          (startTime <= allocStart && endTime >= allocEnd)
        );
      });

      if (hasConflict) {
        return {
          isAvailable: false,
          reason: "Desktop is already booked for this time",
        };
      }

      // 4. Check student daily limits (if studentId provided)
      if (input.studentId) {
        const dateStr = startTime.toISOString().split('T')[0];
        const startOfDay = new Date(dateStr);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(dateStr);
        endOfDay.setHours(23, 59, 59, 999);

        // Get booking settings
        const { data: settings } = await supabaseAdmin
          .from('booking_settings')
          .select('*')
          .eq('is_active', true)
          .limit(1)
          .single();

        const maxHoursPerDay = settings?.max_hours_per_day || 3;
        const maxSessionsPerDay = settings?.max_sessions_per_day || 3;

        // Get student's existing bookings for this day
        const { data: studentBookings } = await supabaseAdmin
          .from('desktop_allocations')
          .select('*')
          .eq('student_id', input.studentId)
          .gte('start_time', startOfDay.toISOString())
          .lte('start_time', endOfDay.toISOString())
          .eq('status', 'active');

        if (studentBookings) {
          // Check session count
          if (studentBookings.length >= maxSessionsPerDay) {
            return {
              isAvailable: false,
              reason: `You can only book ${maxSessionsPerDay} sessions per day`,
            };
          }

          // Check total hours
          const totalMinutes = studentBookings.reduce((sum, b) => sum + (b.duration_minutes || 0), 0);
          const totalHours = totalMinutes / 60;
          const requestedHours = input.durationMinutes / 60;

          if (totalHours + requestedHours > maxHoursPerDay) {
            const remainingHours = maxHoursPerDay - totalHours;
            return {
              isAvailable: false,
              reason: `You can only book ${maxHoursPerDay} hours per day. You have ${remainingHours.toFixed(1)} hours remaining.`,
            };
          }
        }
      }

      return {
        isAvailable: true,
        desktopId: input.desktopId,
      };
    }),

  // Create allocation (public)
  create: publicProcedure
    .input(
      z.object({
        desktopId: z.string(),
        studentId: z.string(),
        startTime: z.string(), // ISO string
        durationMinutes: z.number().min(15).max(480),
        purpose: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const startTime = new Date(input.startTime);
      const endTime = new Date(startTime.getTime() + input.durationMinutes * 60000);

      // Re-check availability
      const availabilityCheck = await allocationRouter
        .createCaller({} as any)
        .checkAvailability({
          desktopId: input.desktopId,
          startTime: input.startTime,
          durationMinutes: input.durationMinutes,
          studentId: input.studentId,
        });

      if (!availabilityCheck.isAvailable) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: availabilityCheck.reason || "Desktop is not available",
        });
      }

      // Create allocation
      const { data, error } = await supabaseAdmin
        .from('desktop_allocations')
        .insert({
          desktop_id: input.desktopId,
          student_id: input.studentId,
          allocated_by: input.studentId, // Student is booking for themselves
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          duration_minutes: input.durationMinutes,
          status: 'active',
          purpose: input.purpose,
          notes: input.notes,
        })
        .select(`
          *,
          desktop:desktops(*),
          student:profiles!student_id(*)
        `)
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      // TODO: Send email notification to student

      return data;
    }),

  // Cancel allocation (public - with allocation ID)
  cancel: publicProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string().optional(),
        cancelledBy: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { data, error } = await supabaseAdmin
        .from('desktop_allocations')
        .update({
          status: 'cancelled',
          cancellation_reason: input.reason || "Cancelled by user",
          cancelled_at: new Date().toISOString(),
          cancelled_by: input.cancelledBy,
        })
        .eq('id', input.id)
        .select()
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: error ? "INTERNAL_SERVER_ERROR" : "NOT_FOUND",
          message: error?.message || "Allocation not found",
        });
      }

      // TODO: Send cancellation email to student

      return data;
    }),

  // Update allocation status (admin)
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['pending', 'active', 'completed', 'cancelled', 'no_show']),
        actualStartTime: z.string().optional(),
        actualEndTime: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const updateData: any = {
        status: input.status,
      };

      if (input.actualStartTime) {
        updateData.actual_start_time = input.actualStartTime;
      }

      if (input.actualEndTime) {
        updateData.actual_end_time = input.actualEndTime;
      }

      const { data, error } = await supabaseAdmin
        .from('desktop_allocations')
        .update(updateData)
        .eq('id', input.id)
        .select()
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: error ? "INTERNAL_SERVER_ERROR" : "NOT_FOUND",
          message: error?.message || "Allocation not found",
        });
      }

      return data;
    }),
});
