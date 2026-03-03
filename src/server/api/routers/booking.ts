import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { storage } from "@/server/storage";
import { sendBookingConfirmationEmail, sendCancellationEmail } from "@/lib/email";

export const bookingRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.db.booking.findMany({
        where: {
          eventType: {
            userId: ctx.session.user.id,
          },
        },
        include: {
          eventType: true,
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      // Fallback to in-memory storage
      return storage.getBookings(ctx.session.user.id);
    }
  }),

  create: publicProcedure
    .input(
      z.object({
        eventTypeId: z.string(),
        startTime: z.date(),
        endTime: z.date(),
        attendeeName: z.string().min(1),
        attendeeEmail: z.string().email(),
        attendeeTimezone: z.string(),
        attendeeNotes: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Get event type with user info
        const eventType = await ctx.db.eventType.findUnique({
          where: { id: input.eventTypeId },
          include: { user: true },
        });

        if (!eventType) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Event type not found",
          });
        }

        // Create booking
        const booking = await ctx.db.booking.create({
          data: {
            eventTypeId: input.eventTypeId,
            startTime: input.startTime,
            endTime: input.endTime,
            attendeeName: input.attendeeName,
            attendeeEmail: input.attendeeEmail,
            attendeeTimezone: input.attendeeTimezone,
            attendeeNotes: input.attendeeNotes || null,
            status: "ACCEPTED",
          },
          include: {
            eventType: {
              include: {
                user: true,
              },
            },
          },
        });

        // Send confirmation email
        try {
          await sendBookingConfirmationEmail({
            attendeeName: booking.attendeeName,
            attendeeEmail: booking.attendeeEmail,
            eventTitle: eventType.title,
            startTime: booking.startTime,
            endTime: booking.endTime,
            organizerName: eventType.user.name || eventType.user.username,
            organizerEmail: eventType.user.email,
            notes: booking.attendeeNotes || undefined,
          });
        } catch (error) {
          console.error("Failed to send confirmation email:", error);
        }

        return booking;
      } catch (error) {
        // Fallback to in-memory storage
        const eventType = storage.getEventType(input.eventTypeId);
        if (!eventType) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Event type not found",
          });
        }

        const booking = storage.createBooking({
          eventTypeId: input.eventTypeId,
          userId: eventType.userId,
          startTime: input.startTime,
          endTime: input.endTime,
          attendeeName: input.attendeeName,
          attendeeEmail: input.attendeeEmail,
          attendeeTimezone: input.attendeeTimezone,
          attendeeNotes: input.attendeeNotes || null,
        });

        // Send confirmation email
        try {
          await sendBookingConfirmationEmail({
            attendeeName: booking.attendeeName,
            attendeeEmail: booking.attendeeEmail,
            eventTitle: eventType.title,
            startTime: booking.startTime,
            endTime: booking.endTime,
            organizerName: "Demo Admin",
            organizerEmail: "admin@calclone.com",
            notes: booking.attendeeNotes || undefined,
          });
        } catch (error) {
          console.error("Failed to send confirmation email:", error);
        }

        return booking;
      }
    }),

  cancel: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify ownership
        const booking = await ctx.db.booking.findUnique({
          where: { id: input.id },
          include: {
            eventType: {
              include: {
                user: true,
              },
            },
          },
        });

        if (!booking || booking.eventType.userId !== ctx.session.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized",
          });
        }

        // Update booking
        const updated = await ctx.db.booking.update({
          where: { id: input.id },
          data: {
            status: "CANCELLED",
            cancelReason: input.reason || "Cancelled by organizer",
          },
          include: {
            eventType: true,
          },
        });

        // Send cancellation email
        try {
          await sendCancellationEmail({
            attendeeName: booking.attendeeName,
            attendeeEmail: booking.attendeeEmail,
            eventTitle: booking.eventType.title,
            startTime: booking.startTime,
            endTime: booking.endTime,
            organizerName: booking.eventType.user.name || booking.eventType.user.username,
            organizerEmail: booking.eventType.user.email,
            cancelReason: input.reason || "Cancelled by organizer",
          });
        } catch (error) {
          console.error("Failed to send cancellation email:", error);
        }

        return updated;
      } catch (error) {
        // Fallback to in-memory storage
        const booking = storage.getBooking(input.id);
        if (!booking) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Booking not found",
          });
        }

        const eventType = storage.getEventType(booking.eventTypeId);
        if (!eventType || eventType.userId !== ctx.session.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized",
          });
        }

        const updated = storage.cancelBooking(
          input.id,
          input.reason || "Cancelled by organizer"
        );

        // Send cancellation email
        try {
          if (booking.eventType) {
            await sendCancellationEmail({
              attendeeName: booking.attendeeName,
              attendeeEmail: booking.attendeeEmail,
              eventTitle: booking.eventType.title,
              startTime: booking.startTime,
              endTime: booking.endTime,
              organizerName: "Demo Admin",
              organizerEmail: "admin@example.com",
              cancelReason: input.reason || "Cancelled by organizer",
            });
          }
        } catch (error) {
          console.error("Failed to send cancellation email:", error);
        }

        return updated;
      }
    }),
});
