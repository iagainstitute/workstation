import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

interface Availability {
  id: string;
  userId: string;
  days: string; // Comma-separated days
  startTime: string;
  endTime: string;
  date: Date | null;
}

interface Booking {
  id: string;
  startTime: Date;
  endTime: Date;
  status: string;
}

export const slotRouter = createTRPCRouter({
  getAvailableSlots: publicProcedure
    .input(
      z.object({
        username: z.string(),
        eventTypeSlug: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        timezone: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Find user
      const user = await ctx.db.user.findUnique({
        where: { username: input.username },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Find event type
      const eventType = await ctx.db.eventType.findUnique({
        where: {
          userId_slug: {
            userId: user.id,
            slug: input.eventTypeSlug,
          },
        },
      });

      if (!eventType) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event type not found",
        });
      }

      // Get user's availability
      const availability = await ctx.db.availability.findMany({
        where: {
          userId: user.id,
          date: null,
        },
      });

      // Get existing bookings in this range
      const startDateTime = dayjs(input.startDate).tz(input.timezone).startOf("day").toDate();
      const endDateTime = dayjs(input.endDate).tz(input.timezone).endOf("day").toDate();

      const existingBookings = await ctx.db.booking.findMany({
        where: {
          userId: user.id,
          status: { in: ["ACCEPTED", "PENDING"] },
          startTime: {
            gte: startDateTime,
            lte: endDateTime,
          },
        },
      });

      // Generate slots
      const slots: { date: string; slots: string[] }[] = [];
      let currentDate = dayjs(input.startDate).tz(input.timezone);
      const endDate = dayjs(input.endDate).tz(input.timezone);

      while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, "day")) {
        const dayOfWeek = currentDate.day();
        const dateStr = currentDate.format("YYYY-MM-DD");

        // Find availability for this day
        const dayAvailability = availability.filter((a: Availability) =>
          a.days.split(',').map(Number).includes(dayOfWeek)
        );

        const daySlots: string[] = [];

        for (const avail of dayAvailability) {
          const [startHour, startMinute] = avail.startTime.split(":").map(Number);
          const [endHour, endMinute] = avail.endTime.split(":").map(Number);

          let slotTime = currentDate
            .hour(startHour)
            .minute(startMinute)
            .second(0)
            .millisecond(0);

          const endTime = currentDate.hour(endHour).minute(endMinute).second(0).millisecond(0);

          // Generate time slots
          while (slotTime.isBefore(endTime)) {
            const slotEnd = slotTime.add(eventType.duration, "minute");

            // Check if slot end time exceeds availability end time
            if (slotEnd.isAfter(endTime)) {
              break;
            }

            // Check minimum booking notice
            const now = dayjs();
            const minutesUntilSlot = slotTime.diff(now, "minute");
            if (minutesUntilSlot < eventType.minimumBookingNotice) {
              slotTime = slotTime.add(15, "minute");
              continue;
            }

            // Check for conflicts with existing bookings
            const hasConflict = existingBookings.some((booking: Booking) => {
              const bookingStart = dayjs(booking.startTime);
              const bookingEnd = dayjs(booking.endTime);

              // Apply buffer times
              const slotStartWithBuffer = slotTime.subtract(eventType.afterEventBuffer, "minute");
              const slotEndWithBuffer = slotEnd.add(eventType.beforeEventBuffer, "minute");

              return (
                (slotStartWithBuffer.isBefore(bookingEnd) &&
                  slotEndWithBuffer.isAfter(bookingStart))
              );
            });

            if (!hasConflict) {
              daySlots.push(slotTime.format("HH:mm"));
            }

            // Move to next slot (15-minute intervals by default)
            slotTime = slotTime.add(eventType.slotInterval || 15, "minute");
          }
        }

        if (daySlots.length > 0) {
          slots.push({
            date: dateStr,
            slots: daySlots,
          });
        }

        currentDate = currentDate.add(1, "day");
      }

      return slots;
    }),
});
