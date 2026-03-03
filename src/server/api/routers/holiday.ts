import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { supabaseAdmin } from "@/lib/supabase";

export const holidayRouter = createTRPCRouter({
  // Get all holidays (public - for checking disabled dates)
  list: publicProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      let query = supabaseAdmin
        .from('holidays')
        .select('*')
        .eq('is_active', true)
        .order('date', { ascending: true });

      if (input?.startDate) {
        query = query.gte('date', input.startDate);
      }

      if (input?.endDate) {
        query = query.lte('date', input.endDate);
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

  // Get all holidays including inactive (admin)
  listAll: protectedProcedure.query(async () => {
    const { data, error } = await supabaseAdmin
      .from('holidays')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }

    return data;
  }),

  // Get holiday by ID (admin)
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const { data, error } = await supabaseAdmin
        .from('holidays')
        .select('*')
        .eq('id', input.id)
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Holiday not found",
        });
      }

      return data;
    }),

  // Create holiday (admin)
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        date: z.string(), // ISO date string (YYYY-MM-DD)
        isRecurring: z.boolean().default(false),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { data, error } = await supabaseAdmin
        .from('holidays')
        .insert({
          title: input.title,
          date: input.date,
          is_recurring: input.isRecurring,
          description: input.description,
          is_active: true,
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

  // Update holiday (admin)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        date: z.string().optional(),
        isRecurring: z.boolean().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;

      const dbUpdate: any = { updated_at: new Date().toISOString() };
      if (updateData.title !== undefined) dbUpdate.title = updateData.title;
      if (updateData.date !== undefined) dbUpdate.date = updateData.date;
      if (updateData.isRecurring !== undefined) dbUpdate.is_recurring = updateData.isRecurring;
      if (updateData.description !== undefined) dbUpdate.description = updateData.description;
      if (updateData.isActive !== undefined) dbUpdate.is_active = updateData.isActive;

      const { data, error } = await supabaseAdmin
        .from('holidays')
        .update(dbUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: error ? "INTERNAL_SERVER_ERROR" : "NOT_FOUND",
          message: error?.message || "Holiday not found",
        });
      }

      return data;
    }),

  // Delete holiday (admin)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const { error } = await supabaseAdmin
        .from('holidays')
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

  // Check if a date is a holiday (public)
  isHoliday: publicProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ input }) => {
      const { data, error } = await supabaseAdmin
        .from('holidays')
        .select('*')
        .eq('date', input.date)
        .eq('is_active', true)
        .limit(1);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return {
        isHoliday: data && data.length > 0,
        holiday: data && data.length > 0 ? data[0] : null,
      };
    }),
});
