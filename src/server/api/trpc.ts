import { initTRPC, TRPCError } from "@trpc/server";
import { type NextRequest } from "next/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth";
import { db } from "../db";
import { getAuthenticatedUser } from "@/lib/jwt";

export const createTRPCContext = async (opts: { req: NextRequest }) => {
  let session = await getServerSession(authOptions);

  if (!session?.user && opts?.req) {
    const authUser = await getAuthenticatedUser(opts.req);
    if (authUser) {
      session = {
        user: {
          id: authUser.userId || authUser.id || authUser.sub,
          name: authUser.name || authUser.fullName,
          email: authUser.email,
          role: authUser.role,
        },
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      } as any;
    }
  }

  return {
    db,
    session,
    req: opts.req,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
