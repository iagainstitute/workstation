import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { getCollection } from "@/lib/mongodb";
import { Collections } from "@/lib/collections";
import { ObjectId } from "mongodb";
import { randomUUID } from "node:crypto";

function formatDoc(doc: any) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return {
    ...rest,
    id: rest.id || (_id ? _id.toString() : undefined),
  };
}

export const holidayRouter = createTRPCRouter({
  // Get all holidays (public - for checking disabled dates)
  list: publicProcedure
    .input(
      z
        .object({
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      try {
        const holidaysCol = await getCollection(Collections.HOLIDAYS);
        const filter: any = {
          is_active: { $ne: false },
        };

        if (input?.startDate) {
          filter.date = filter.date || {};
          filter.date.$gte = input.startDate;
        }

        if (input?.endDate) {
          filter.date = filter.date || {};
          filter.date.$lte = input.endDate;
        }

        const holidays = await holidaysCol.find(filter).sort({ date: 1 }).toArray();
        return holidays.map(formatDoc);
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  // Get all holidays including inactive (admin)
  listAll: protectedProcedure.query(async () => {
    try {
      const holidaysCol = await getCollection(Collections.HOLIDAYS);
      const holidays = await holidaysCol.find({}).sort({ date: 1 }).toArray();
      return holidays.map(formatDoc);
    } catch (error: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }
  }),

  // Get holiday by ID (admin)
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const holidaysCol = await getCollection(Collections.HOLIDAYS);
        const holiday = await holidaysCol.findOne({
          $or: [
            { id: input.id },
            ...(ObjectId.isValid(input.id) ? [{ _id: new ObjectId(input.id) }] : []),
          ],
        });

        if (!holiday) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Holiday not found",
          });
        }

        return formatDoc(holiday);
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  // Create holiday (admin)
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        date: z.string(), // ISO date string (YYYY-MM-DD)
        isRecurring: z.boolean().default(false),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const holidaysCol = await getCollection(Collections.HOLIDAYS);
        const now = new Date();
        const newId = randomUUID();

        const newHoliday = {
          id: newId,
          title: input.title,
          date: input.date,
          is_recurring: input.isRecurring,
          isRecurring: input.isRecurring,
          description: input.description || null,
          is_active: true,
          isActive: true,
          created_at: now,
          createdAt: now,
          updated_at: now,
          updatedAt: now,
        };

        await holidaysCol.insertOne(newHoliday as any);
        return formatDoc(newHoliday);
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
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
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const holidaysCol = await getCollection(Collections.HOLIDAYS);
        const { id, ...updateData } = input;

        const dbUpdate: any = {
          updated_at: new Date(),
          updatedAt: new Date(),
        };

        if (updateData.title !== undefined) dbUpdate.title = updateData.title;
        if (updateData.date !== undefined) dbUpdate.date = updateData.date;
        if (updateData.isRecurring !== undefined) {
          dbUpdate.is_recurring = updateData.isRecurring;
          dbUpdate.isRecurring = updateData.isRecurring;
        }
        if (updateData.description !== undefined) dbUpdate.description = updateData.description;
        if (updateData.isActive !== undefined) {
          dbUpdate.is_active = updateData.isActive;
          dbUpdate.isActive = updateData.isActive;
        }

        const result = await holidaysCol.findOneAndUpdate(
          {
            $or: [
              { id },
              ...(ObjectId.isValid(id) ? [{ _id: new ObjectId(id) }] : []),
            ],
          },
          { $set: dbUpdate },
          { returnDocument: "after" }
        );

        if (!result) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Holiday not found",
          });
        }

        return formatDoc(result);
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  // Delete holiday (admin)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const holidaysCol = await getCollection(Collections.HOLIDAYS);
        await holidaysCol.deleteOne({
          $or: [
            { id: input.id },
            ...(ObjectId.isValid(input.id) ? [{ _id: new ObjectId(input.id) }] : []),
          ],
        });

        return { success: true };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  // Check if a date is a holiday (public)
  isHoliday: publicProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ input }) => {
      try {
        const holidaysCol = await getCollection(Collections.HOLIDAYS);
        const holiday = await holidaysCol.findOne({
          date: input.date,
          is_active: { $ne: false },
        });

        return {
          isHoliday: !!holiday,
          holiday: holiday ? formatDoc(holiday) : null,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),
});
