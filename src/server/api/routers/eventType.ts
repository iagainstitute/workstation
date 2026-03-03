import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { storage } from "@/server/storage";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export const eventTypeRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.db.eventType.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      // Fallback to in-memory storage
      return storage.getEventTypes(ctx.session.user.id);
    }
  }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const eventType = await ctx.db.eventType.findUnique({
          where: { id: input.id },
          include: { user: { select: { username: true, name: true, avatar: true } } },
        });

        if (!eventType) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Event type not found",
          });
        }

        return eventType;
      } catch (error) {
        // Fallback to in-memory storage
        const eventType = storage.getEventType(input.id);
        if (!eventType) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Event type not found",
          });
        }
        return eventType;
      }
    }),

  getBySlug: publicProcedure
    .input(z.object({ username: z.string(), slug: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const eventType = await ctx.db.eventType.findFirst({
          where: {
            slug: input.slug,
            user: {
              username: input.username,
            },
          },
          include: { user: { select: { username: true, name: true, avatar: true } } },
        });

        if (!eventType) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Event type not found",
          });
        }

        return eventType;
      } catch (error) {
        // Fallback to in-memory storage
        // For demo, we use fixed user ID
        const eventType = storage.getEventTypeBySlug("demo-user-id", input.slug);
        if (!eventType) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Event type not found",
          });
        }
        return eventType;
      }
    }),

  listByUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.db.eventType.findMany({
          where: {
            user: {
              username: input.username,
            },
          },
          orderBy: { createdAt: "desc" },
          include: { user: { select: { username: true, name: true, avatar: true } } },
        });
      } catch (error) {
        // Fallback to in-memory storage
        // For demo, we use fixed user ID
        return storage.getEventTypes("demo-user-id");
      }
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        slug: z.string().optional(),
        duration: z.number().min(5).max(1440),
        description: z.string().optional().nullable(),
        location: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const slug = input.slug || generateSlug(input.title);

      try {
        // Check if slug already exists for this user
        const existing = await ctx.db.eventType.findFirst({
          where: {
            userId: ctx.session.user.id,
            slug: slug,
          },
        });

        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An event with this URL already exists",
          });
        }

        return await ctx.db.eventType.create({
          data: {
            title: input.title,
            slug,
            duration: input.duration,
            description: input.description || null,
            location: input.location || null,
            userId: ctx.session.user.id,
          },
        });
      } catch (error) {
        // Fallback to in-memory storage
        const existing = storage.getEventTypeBySlug(ctx.session.user.id, slug);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An event with this URL already exists",
          });
        }

        return storage.createEventType({
          title: input.title,
          slug,
          duration: input.duration,
          description: input.description || null,
          location: input.location || null,
          userId: ctx.session.user.id,
        });
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        slug: z.string().optional(),
        duration: z.number().min(5).max(1440).optional(),
        description: z.string().optional().nullable(),
        location: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      try {
        // Verify ownership
        const eventType = await ctx.db.eventType.findUnique({
          where: { id },
        });

        if (!eventType || eventType.userId !== ctx.session.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized",
          });
        }

        return await ctx.db.eventType.update({
          where: { id },
          data,
        });
      } catch (error) {
        // Fallback to in-memory storage
        const eventType = storage.getEventType(id);
        if (!eventType || eventType.userId !== ctx.session.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized",
          });
        }

        const updated = storage.updateEventType(id, data);
        if (!updated) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Event type not found",
          });
        }
        return updated;
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify ownership
        const eventType = await ctx.db.eventType.findUnique({
          where: { id: input.id },
        });

        if (!eventType || eventType.userId !== ctx.session.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized",
          });
        }

        await ctx.db.eventType.delete({
          where: { id: input.id },
        });

        return { success: true };
      } catch (error) {
        // Fallback to in-memory storage
        const eventType = storage.getEventType(input.id);
        if (!eventType || eventType.userId !== ctx.session.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized",
          });
        }

        storage.deleteEventType(input.id);
        return { success: true };
      }
    }),
});
