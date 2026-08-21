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

export const desktopRouter = createTRPCRouter({
  // Get all desktops (admin)
  list: protectedProcedure.query(async () => {
    try {
      const desktopsCol = await getCollection(Collections.DESKTOPS);
      const typesCol = await getCollection(Collections.DESKTOP_TYPES);

      const desktops = await desktopsCol.find({}).sort({ created_at: -1, createdAt: -1 }).toArray();
      const types = await typesCol.find({}).toArray();

      const typeMap = new Map();
      for (const t of types) {
        const formatted = formatDoc(t);
        if (t.id !== undefined) typeMap.set(String(t.id), formatted);
        if (t.Id !== undefined) typeMap.set(String(t.Id), formatted);
        if (t._id !== undefined) typeMap.set(String(t._id), formatted);
      }

      const enriched = desktops.map((d) => {
        const typeId = String(d.desktop_type_id || d.desktopTypeId || "");
        const dName = d.desktop_name || d.desktopName || d.name || "";
        return {
          ...formatDoc(d),
          desktop_name: dName,
          desktopName: dName,
          name: dName,
          desktop_type: typeMap.get(typeId) || null,
        };
      });

      return enriched;
    } catch (error: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }
  }),

  // Get available desktops (public) - filtered by type
  listAvailable: publicProcedure
    .input(
      z
        .object({
          typeId: z.string().optional(),
          date: z.string().optional(), // ISO date string for checking availability
          time: z.string().optional(), // Time in HH:MM format
          durationMinutes: z.number().optional().default(60),
          showAll: z.boolean().optional().default(true), // Show all desktops including booked ones
        })
        .optional(),
    )
    .query(async ({ input }) => {
      try {
        const desktopsCol = await getCollection(Collections.DESKTOPS);
        const typesCol = await getCollection(Collections.DESKTOP_TYPES);
        const allocationsCol = await getCollection(
          Collections.DESKTOP_ALLOCATIONS,
        );

        const filter: any = {
          $or: [
            { status: "available" },
            { status: { $exists: false } },
            { status: null },
          ],
          is_active: { $ne: false },
        };

        if (input?.typeId) {
          filter.$or = [
            { desktop_type_id: input.typeId },
            { desktopTypeId: input.typeId },
          ];
        }

        const desktops = await desktopsCol.find(filter).sort({ desktop_name: 1, desktopName: 1 }).toArray();
        const types = await typesCol.find({}).toArray();
        const typeMap = new Map();
        for (const t of types) {
          const formatted = formatDoc(t);
          if (t.id !== undefined) typeMap.set(String(t.id), formatted);
          if (t.Id !== undefined) typeMap.set(String(t.Id), formatted);
          if (t._id !== undefined) typeMap.set(String(t._id), formatted);
        }

        const formattedDesktops = desktops.map((d) => {
          const typeId = String(d.desktop_type_id || d.desktopTypeId || "");
          const dName = d.desktop_name || d.desktopName || d.name || "";
          return {
            ...formatDoc(d),
            desktop_name: dName,
            desktopName: dName,
            name: dName,
            desktop_type: typeMap.get(typeId) || null,
          };
        });

        // Filter by weekly_hours if date is provided
        let filteredBySchedule = formattedDesktops;
        if (input?.date) {
          const dayOfWeek = new Date(input.date)
            .toLocaleDateString("en-US", { weekday: "long" })
            .toLowerCase();

          filteredBySchedule = formattedDesktops.filter((desktop: any) => {
            const hours = typeof desktop.weekly_hours === "object" ? desktop.weekly_hours : typeof desktop.weeklyHours === "object" ? desktop.weeklyHours : null;
            if (!hours) return true;
            const daySchedule = hours[dayOfWeek];
            return daySchedule?.available !== false;
          });
        }

        // Check booking status for each desktop if date and time are provided
        if (input?.date && input?.time) {
          const startDateTime = new Date(`${input.date}T${input.time}:00`);
          const endDateTime = new Date(
            startDateTime.getTime() + (input.durationMinutes || 60) * 60000,
          );

          const allBookings = await allocationsCol
            .find({
              status: "active",
              $and: [
                {
                  $or: [
                    { end_time: { $gte: startDateTime.toISOString() } },
                    { endTime: { $gte: startDateTime.toISOString() } },
                    { end_time: { $gte: startDateTime } },
                    { endTime: { $gte: startDateTime } },
                  ],
                },
                {
                  $or: [
                    { start_time: { $lte: endDateTime.toISOString() } },
                    { startTime: { $lte: endDateTime.toISOString() } },
                    { start_time: { $lte: endDateTime } },
                    { startTime: { $lte: endDateTime } },
                  ],
                },
              ],
            })
            .toArray();

          const desktopsWithStatus = filteredBySchedule.map((desktop: any) => {
            const hasConflict = allBookings?.some((booking: any) => {
              const bDesktopId = booking.desktop_id || booking.desktopId;
              if (bDesktopId !== desktop.id) return false;

              const bookingStart = new Date(booking.start_time || booking.startTime);
              const bookingEnd = new Date(booking.end_time || booking.endTime);

              return (
                (startDateTime >= bookingStart && startDateTime < bookingEnd) ||
                (endDateTime > bookingStart && endDateTime <= bookingEnd) ||
                (startDateTime <= bookingStart && endDateTime >= bookingEnd)
              );
            });

            return {
              ...desktop,
              isBooked: hasConflict,
              bookingStatus: hasConflict ? "booked" : "available",
            };
          });

          if (input.showAll) {
            return desktopsWithStatus;
          } else {
            return desktopsWithStatus.filter((d: any) => !d.isBooked);
          }
        }

        return filteredBySchedule;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  // Get desktop by ID (public)
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const desktopsCol = await getCollection(Collections.DESKTOPS);
        const typesCol = await getCollection(Collections.DESKTOP_TYPES);

        const desktop = await desktopsCol.findOne({
          $or: [
            { id: input.id },
            ...(ObjectId.isValid(input.id) ? [{ _id: new ObjectId(input.id) }] : []),
          ],
        });

        if (!desktop) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Desktop not found",
          });
        }

        const typeId = desktop.desktop_type_id || desktop.desktopTypeId;
        let desktopType = null;
        if (typeId) {
          desktopType = await typesCol.findOne({
            $or: [
              { id: typeId },
              ...(ObjectId.isValid(typeId) ? [{ _id: new ObjectId(typeId) }] : []),
            ],
          });
        }

        return {
          ...formatDoc(desktop),
          desktop_type: desktopType ? formatDoc(desktopType) : null,
        };
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  // Get desktop types (public)
  getTypes: publicProcedure.query(async () => {
    try {
      const typesCol = await getCollection(Collections.DESKTOP_TYPES);
      const types = await typesCol
        .find({
          $or: [{ isActive: { $ne: false } }, { is_active: { $ne: false } }],
        })
        .sort({ display_name: 1, displayName: 1 })
        .toArray();

      return types.map((t) => {
        const formatted = formatDoc(t);
        const nameVal = t.displayName || t.display_name || t.name || t.category || "";
        return {
          ...formatted,
          display_name: nameVal,
          displayName: nameVal,
          name: nameVal,
          is_active: t.is_active !== undefined ? t.is_active : t.isActive,
          isActive: t.isActive !== undefined ? t.isActive : t.is_active,
        };
      });
    } catch (error: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }
  }),

  // Get booking settings (public)
  getSettings: publicProcedure.query(async () => {
    try {
      const settingsCol = await getCollection(Collections.BOOKING_SETTINGS);
      const settings = await settingsCol.findOne({ is_active: { $ne: false } });

      if (!settings) {
        return {
          slot_duration_minutes: 30,
          max_hours_per_day: 4,
          max_sessions_per_day: 2,
          days_ahead_booking: 1,
          business_hours_start: "09:00",
          business_hours_end: "19:00",
        };
      }

      return formatDoc(settings);
    } catch (error) {
      return {
        slot_duration_minutes: 30,
        max_hours_per_day: 4,
        max_sessions_per_day: 2,
        days_ahead_booking: 1,
        business_hours_start: "09:00",
        business_hours_end: "19:00",
      };
    }
  }),

  // Create desktop (admin)
  create: protectedProcedure
    .input(
      z.object({
        desktopName: z.string().min(1),
        desktopTypeId: z.string(),
        branchId: z.string().optional(),
        status: z
          .enum(["available", "occupied", "maintenance", "reserved"])
          .default("available"),
        specifications: z.any().optional(),
        weeklyHours: z.any().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const desktopsCol = await getCollection(Collections.DESKTOPS);
        const now = new Date();
        const newId = randomUUID();

        const newDesktop = {
          id: newId,
          desktop_name: input.desktopName,
          desktopName: input.desktopName,
          desktop_type_id: input.desktopTypeId,
          desktopTypeId: input.desktopTypeId,
          branch_id: input.branchId || null,
          branchId: input.branchId || null,
          status: input.status,
          specifications: input.specifications || {},
          is_active: true,
          weekly_hours: input.weeklyHours || {
            monday: { available: true, start: "09:00", end: "19:00" },
            tuesday: { available: true, start: "09:00", end: "19:00" },
            wednesday: { available: true, start: "09:00", end: "19:00" },
            thursday: { available: true, start: "09:00", end: "19:00" },
            friday: { available: true, start: "09:00", end: "19:00" },
            saturday: { available: true, start: "09:00", end: "19:00" },
            sunday: { available: false },
          },
          created_at: now,
          createdAt: now,
          updated_at: now,
          updatedAt: now,
        };

        await desktopsCol.insertOne(newDesktop as any);
        return formatDoc(newDesktop);
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  // Update desktop (admin)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        desktopName: z.string().min(1).optional(),
        desktopTypeId: z.string().optional(),
        status: z
          .enum(["available", "occupied", "maintenance", "reserved"])
          .optional(),
        specifications: z.any().optional(),
        weeklyHours: z.any().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const desktopsCol = await getCollection(Collections.DESKTOPS);
        const { id, ...updateData } = input;

        const dbUpdate: any = {
          updated_at: new Date(),
          updatedAt: new Date(),
        };

        if (updateData.desktopName) {
          dbUpdate.desktop_name = updateData.desktopName;
          dbUpdate.desktopName = updateData.desktopName;
        }
        if (updateData.desktopTypeId) {
          dbUpdate.desktop_type_id = updateData.desktopTypeId;
          dbUpdate.desktopTypeId = updateData.desktopTypeId;
        }
        if (updateData.status) dbUpdate.status = updateData.status;
        if (updateData.specifications !== undefined)
          dbUpdate.specifications = updateData.specifications;
        if (updateData.weeklyHours !== undefined) {
          dbUpdate.weekly_hours = updateData.weeklyHours;
          dbUpdate.weeklyHours = updateData.weeklyHours;
        }

        const result = await desktopsCol.findOneAndUpdate(
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
            message: "Desktop not found",
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

  // Delete desktop (admin)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const desktopsCol = await getCollection(Collections.DESKTOPS);
        await desktopsCol.deleteOne({
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
});
