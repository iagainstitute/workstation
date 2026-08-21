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

export const allocationRouter = createTRPCRouter({
  // Get all allocations (admin)
  list: protectedProcedure
    .input(
      z
        .object({
          status: z
            .enum(["pending", "active", "completed", "cancelled", "no_show"])
            .optional(),
          desktopId: z.string().optional(),
          studentId: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      try {
        const allocationsCol = await getCollection(Collections.DESKTOP_ALLOCATIONS);
        const desktopsCol = await getCollection(Collections.DESKTOPS);
        const profilesCol = await getCollection(Collections.PROFILES);

        const filter: any = {};

        if (input?.status) {
          filter.status = input.status;
        }

        if (input?.desktopId) {
          filter.$or = [
            { desktop_id: input.desktopId },
            { desktopId: input.desktopId },
          ];
        }

        if (input?.studentId) {
          filter.$or = [
            { student_id: input.studentId },
            { studentId: input.studentId },
          ];
        }

        if (input?.startDate) {
          filter.$and = filter.$and || [];
          filter.$and.push({
            $or: [
              { start_time: { $gte: input.startDate } },
              { startTime: { $gte: input.startDate } },
            ],
          });
        }

        if (input?.endDate) {
          filter.$and = filter.$and || [];
          filter.$and.push({
            $or: [
              { start_time: { $lte: input.endDate } },
              { startTime: { $lte: input.endDate } },
            ],
          });
        }

        const allocations = await allocationsCol
          .find(filter)
          .sort({ start_time: -1, startTime: -1 })
          .toArray();

        const allDesktops = await desktopsCol.find({}).toArray();
        const allProfiles = await profilesCol.find({}).toArray();

        const desktopMap = new Map();
        for (const d of allDesktops) {
          const formatted = formatDoc(d);
          if (d.id !== undefined) desktopMap.set(String(d.id), formatted);
          if (d.Id !== undefined) desktopMap.set(String(d.Id), formatted);
          if (d._id !== undefined) desktopMap.set(String(d._id), formatted);
        }

        const profileMap = new Map();
        for (const p of allProfiles) {
          const formatted = formatDoc(p);
          if (p.id !== undefined) profileMap.set(String(p.id), formatted);
          if (p.Id !== undefined) profileMap.set(String(p.Id), formatted);
          if (p._id !== undefined) profileMap.set(String(p._id), formatted);
        }

        const enriched = allocations.map((alloc) => {
          const dId = String(alloc.desktop_id || alloc.desktopId || "");
          const sId = String(alloc.student_id || alloc.studentId || "");

          return {
            ...formatDoc(alloc),
            desktop: desktopMap.get(dId) || null,
            student: profileMap.get(sId) || null,
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

  // Get allocation by ID (public)
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const allocationsCol = await getCollection(Collections.DESKTOP_ALLOCATIONS);
        const desktopsCol = await getCollection(Collections.DESKTOPS);
        const profilesCol = await getCollection(Collections.PROFILES);

        const allocation = await allocationsCol.findOne({
          $or: [
            { id: input.id },
            ...(ObjectId.isValid(input.id) ? [{ _id: new ObjectId(input.id) }] : []),
          ],
        });

        if (!allocation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Allocation not found",
          });
        }

        const dId = allocation.desktop_id || allocation.desktopId;
        const sId = allocation.student_id || allocation.studentId;

        const desktop = dId
          ? await desktopsCol.findOne({
              $or: [
                { id: dId },
                ...(ObjectId.isValid(dId) ? [{ _id: new ObjectId(dId) }] : []),
              ],
            })
          : null;

        const student = sId
          ? await profilesCol.findOne({
              $or: [
                { id: sId },
                ...(ObjectId.isValid(sId) ? [{ _id: new ObjectId(sId) }] : []),
              ],
            })
          : null;

        return {
          ...formatDoc(allocation),
          desktop: desktop ? formatDoc(desktop) : null,
          student: student ? formatDoc(student) : null,
        };
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  // Get student's usage for a specific day (public)
  getStudentDailyUsage: publicProcedure
    .input(
      z.object({
        studentId: z.string(),
        date: z.string(), // ISO date string (YYYY-MM-DD)
      }),
    )
    .query(async ({ input }) => {
      try {
        const startOfDay = new Date(input.date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(input.date);
        endOfDay.setHours(23, 59, 59, 999);

        const allocationsCol = await getCollection(Collections.DESKTOP_ALLOCATIONS);

        const data = await allocationsCol
          .find({
            $and: [
              {
                $or: [
                  { student_id: input.studentId },
                  { studentId: input.studentId },
                ],
              },
              {
                $or: [
                  {
                    start_time: {
                      $gte: startOfDay.toISOString(),
                      $lte: endOfDay.toISOString(),
                    },
                  },
                  {
                    startTime: {
                      $gte: startOfDay.toISOString(),
                      $lte: endOfDay.toISOString(),
                    },
                  },
                ],
              },
              { status: "active" },
            ],
          })
          .toArray();

        const formatted = data.map(formatDoc);
        const totalMinutes = formatted.reduce(
          (sum, alloc) => sum + (alloc.duration_minutes || alloc.durationMinutes || 0),
          0,
        );

        return {
          totalMinutes,
          totalHours: totalMinutes / 60,
          totalSessions: formatted.length,
          allocations: formatted,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  // Check availability (public)
  checkAvailability: publicProcedure
    .input(
      z.object({
        desktopId: z.string(),
        startTime: z.string(), // ISO string
        durationMinutes: z.number().min(15).max(480),
        studentId: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const startTime = new Date(input.startTime);
        const endTime = new Date(startTime.getTime() + input.durationMinutes * 60000);

        const desktopsCol = await getCollection(Collections.DESKTOPS);
        const allocationsCol = await getCollection(Collections.DESKTOP_ALLOCATIONS);
        const profilesCol = await getCollection(Collections.PROFILES);
        const settingsCol = await getCollection(Collections.BOOKING_SETTINGS);

        // 1. Check desktop exists and is available
        const desktop = await desktopsCol.findOne({
          $or: [
            { _id: input.desktopId },
            { id: input.desktopId },
            { Id: input.desktopId },
            ...(ObjectId.isValid(input.desktopId)
              ? [{ _id: new ObjectId(input.desktopId) }]
              : []),
          ],
        } as any);

        if (!desktop) {
          return {
            isAvailable: false,
            reason: "Desktop not found",
          };
        }

        if (desktop.status !== "available" && desktop.status !== undefined && desktop.status !== null) {
          return {
            isAvailable: false,
            reason: `Desktop is ${desktop.status}`,
          };
        }

        // 2. Check weekly hours
        const dayOfWeek = startTime
          .toLocaleDateString("en-US", { weekday: "long" })
          .toLowerCase();

        const weeklyHours = typeof desktop.weekly_hours === "object" ? desktop.weekly_hours : typeof desktop.weeklyHours === "object" ? desktop.weeklyHours : null;
        if (weeklyHours && typeof weeklyHours === "object" && weeklyHours[dayOfWeek]) {
          const daySchedule = weeklyHours[dayOfWeek];
          if (daySchedule.available === false) {
            return {
              isAvailable: false,
              reason: `Desktop is not available on ${dayOfWeek}`,
            };
          }

          if (daySchedule.start && daySchedule.end) {
            const [startHour, startMin] = daySchedule.start.split(":").map(Number);
            const [endHour, endMin] = daySchedule.end.split(":").map(Number);

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

        // 3. Check conflicting allocations
        const conflicts = await allocationsCol
          .find({
            $and: [
              {
                $or: [
                  { desktop_id: input.desktopId },
                  { desktopId: input.desktopId },
                ],
              },
              { status: "active" },
            ],
          })
          .toArray();

        const hasConflict = conflicts.some((alloc) => {
          const allocStart = new Date(alloc.start_time || alloc.startTime);
          const allocEnd = new Date(alloc.end_time || alloc.endTime);
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

        // 4. Check student daily limits
        if (input.studentId) {
          const dateStr = startTime.toISOString().split("T")[0];
          const startOfDay = new Date(dateStr);
          startOfDay.setHours(0, 0, 0, 0);

          const endOfDay = new Date(dateStr);
          endOfDay.setHours(23, 59, 59, 999);

          const studentProfile = await profilesCol.findOne({
            $or: [
              { id: input.studentId },
              ...(ObjectId.isValid(input.studentId)
                ? [{ _id: new ObjectId(input.studentId) }]
                : []),
            ],
          });

          const settings = await settingsCol.findOne({ is_active: { $ne: false } });

          const maxHoursPerDay =
            studentProfile?.daily_time_limit_hours ||
            studentProfile?.dailyTimeLimitHours ||
            settings?.max_hours_per_day ||
            settings?.maxHoursPerDay ||
            3;

          const studentBookings = await allocationsCol
            .find({
              $and: [
                {
                  $or: [
                    { student_id: input.studentId },
                    { studentId: input.studentId },
                  ],
                },
                {
                  $or: [
                    {
                      start_time: {
                        $gte: startOfDay.toISOString(),
                        $lte: endOfDay.toISOString(),
                      },
                    },
                    {
                      startTime: {
                        $gte: startOfDay.toISOString(),
                        $lte: endOfDay.toISOString(),
                      },
                    },
                  ],
                },
                { status: "active" },
              ],
            })
            .toArray();

          if (studentBookings.length > 0) {
            const totalMinutes = studentBookings.reduce(
              (sum, b) => sum + (b.duration_minutes || b.durationMinutes || 0),
              0,
            );
            const totalHours = totalMinutes / 60;
            const requestedHours = input.durationMinutes / 60;

            if (totalHours + requestedHours > maxHoursPerDay) {
              const remainingHours = maxHoursPerDay - totalHours;
              const remainingMinutes = Math.round(remainingHours * 60);
              return {
                isAvailable: false,
                reason: `Daily limit exceeded! Maximum ${maxHoursPerDay} hours per day. You have used ${totalHours.toFixed(1)} hours. Only ${remainingMinutes} minutes remaining.`,
              };
            }
          }
        }

        return {
          isAvailable: true,
          desktopId: input.desktopId,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
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
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const startTime = new Date(input.startTime);
        const endTime = new Date(startTime.getTime() + input.durationMinutes * 60000);

        const allocationsCol = await getCollection(Collections.DESKTOP_ALLOCATIONS);
        const desktopsCol = await getCollection(Collections.DESKTOPS);
        const profilesCol = await getCollection(Collections.PROFILES);

        // Check availability
        const conflicts = await allocationsCol
          .find({
            $and: [
              {
                $or: [
                  { desktop_id: input.desktopId },
                  { desktopId: input.desktopId },
                ],
              },
              { status: "active" },
            ],
          })
          .toArray();

        const hasConflict = conflicts.some((alloc) => {
          const allocStart = new Date(alloc.start_time || alloc.startTime);
          const allocEnd = new Date(alloc.end_time || alloc.endTime);
          return (
            (startTime >= allocStart && startTime < allocEnd) ||
            (endTime > allocStart && endTime <= allocEnd) ||
            (startTime <= allocStart && endTime >= allocEnd)
          );
        });

        if (hasConflict) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Desktop is already booked for this time",
          });
        }

        const desktop = await desktopsCol.findOne({
          $or: [
            { _id: input.desktopId },
            { id: input.desktopId },
            { Id: input.desktopId },
            ...(ObjectId.isValid(input.desktopId) ? [{ _id: new ObjectId(input.desktopId) }] : []),
          ],
        } as any);

        const student = await profilesCol.findOne({
          $or: [
            { _id: input.studentId },
            { id: input.studentId },
            { Id: input.studentId },
            ...(ObjectId.isValid(input.studentId) ? [{ _id: new ObjectId(input.studentId) }] : []),
          ],
        } as any);

        const dName = desktop?.desktopName || desktop?.desktop_name || desktop?.name || "PC";
        const sName = student?.fullName || student?.full_name || student?.name || "Student";

        const now = new Date();
        const newId = randomUUID();

        const newAllocation = {
          _id: newId,
          Id: newId,
          id: newId,
          desktop_id: input.desktopId,
          desktopId: input.desktopId,
          desktopName: dName,
          desktop_name: dName,
          student_id: input.studentId,
          studentId: input.studentId,
          studentName: sName,
          student_name: sName,
          allocated_by: input.studentId,
          allocatedBy: input.studentId,
          start_time: startTime.toISOString(),
          startTime: startTime.toISOString(),
          end_time: endTime.toISOString(),
          endTime: endTime.toISOString(),
          duration_minutes: input.durationMinutes,
          durationMinutes: input.durationMinutes,
          status: "active",
          purpose: input.purpose || null,
          notes: input.notes || null,
          created_at: now.toISOString(),
          createdAt: now.toISOString(),
          updated_at: now.toISOString(),
          updatedAt: now.toISOString(),
        };

        await allocationsCol.insertOne(newAllocation as any);

        // Update desktop status to allocated
        await desktopsCol.updateOne(
          {
            $or: [
              { _id: input.desktopId },
              { id: input.desktopId },
              { Id: input.desktopId },
              ...(ObjectId.isValid(input.desktopId) ? [{ _id: new ObjectId(input.desktopId) }] : []),
            ],
          } as any,
          { $set: { status: "allocated", updatedAt: now } }
        );

        return {
          ...formatDoc(newAllocation),
          desktop: desktop ? formatDoc(desktop) : null,
          student: student ? formatDoc(student) : null,
        };
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  // Cancel allocation (public - with allocation ID)
  cancel: publicProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string().optional(),
        cancelledBy: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const allocationsCol = await getCollection(Collections.DESKTOP_ALLOCATIONS);
        const now = new Date();

        const result = await allocationsCol.findOneAndUpdate(
          {
            $or: [
              { id: input.id },
              ...(ObjectId.isValid(input.id) ? [{ _id: new ObjectId(input.id) }] : []),
            ],
          },
          {
            $set: {
              status: "cancelled",
              cancellation_reason: input.reason || "Cancelled by user",
              cancellationReason: input.reason || "Cancelled by user",
              cancelled_at: now.toISOString(),
              cancelledAt: now.toISOString(),
              cancelled_by: input.cancelledBy || null,
              cancelledBy: input.cancelledBy || null,
              updated_at: now,
              updatedAt: now,
            },
          },
          { returnDocument: "after" }
        );

        if (!result) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Allocation not found",
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

  // Update allocation status (admin)
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["pending", "active", "completed", "cancelled", "no_show"]),
        actualStartTime: z.string().optional(),
        actualEndTime: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const allocationsCol = await getCollection(Collections.DESKTOP_ALLOCATIONS);
        const now = new Date();

        const updateData: any = {
          status: input.status,
          updated_at: now,
          updatedAt: now,
        };

        if (input.actualStartTime) {
          updateData.actual_start_time = input.actualStartTime;
          updateData.actualStartTime = input.actualStartTime;
        }

        if (input.actualEndTime) {
          updateData.actual_end_time = input.actualEndTime;
          updateData.actualEndTime = input.actualEndTime;
        }

        const result = await allocationsCol.findOneAndUpdate(
          {
            $or: [
              { id: input.id },
              ...(ObjectId.isValid(input.id) ? [{ _id: new ObjectId(input.id) }] : []),
            ],
          },
          { $set: updateData },
          { returnDocument: "after" }
        );

        if (!result) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Allocation not found",
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
});
