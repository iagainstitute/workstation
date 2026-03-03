import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const availabilityRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.availability.findMany({
      where: { userId: ctx.session.user.id, date: null },
      orderBy: { days: "asc" },
    });
  }),

  getOverrides: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.availability.findMany({
        where: {
          userId: ctx.session.user.id,
          date: {
            gte: input.startDate,
            lte: input.endDate,
          },
        },
        orderBy: { date: "asc" },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        schedules: z.array(
          z.object({
            days: z.array(z.number().min(0).max(6)),
            startTime: z.string().regex(/^\d{2}:\d{2}$/),
            endTime: z.string().regex(/^\d{2}:\d{2}$/),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Delete existing availability schedules
      await ctx.db.availability.deleteMany({
        where: {
          userId: ctx.session.user.id,
          date: null,
        },
      });

      // Create new schedules
      const newSchedules = await Promise.all(
        input.schedules.map((schedule) =>
          ctx.db.availability.create({
            data: {
              userId: ctx.session.user.id,
              days: schedule.days,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
            },
          })
        )
      );

      return newSchedules;
    }),

  createOverride: protectedProcedure
    .input(
      z.object({
        date: z.date(),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
        available: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if override already exists for this date
      const existing = await ctx.db.availability.findFirst({
        where: {
          userId: ctx.session.user.id,
          date: input.date,
        },
      });

      if (existing) {
        // Update existing override
        return await ctx.db.availability.update({
          where: { id: existing.id },
          data: {
            startTime: input.startTime,
            endTime: input.endTime,
          },
        });
      }

      // Create new override
      return await ctx.db.availability.create({
        data: {
          userId: ctx.session.user.id,
          date: input.date,
          days: [], // Empty for date overrides
          startTime: input.startTime,
          endTime: input.endTime,
        },
      });
    }),

  deleteOverride: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.availability.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
