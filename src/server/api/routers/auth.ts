import { z } from "zod";
import bcrypt from "bcryptjs";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { getCollection } from "@/lib/mongodb";
import { Collections } from "@/lib/collections";
import { signToken } from "@/lib/jwt";
import { ObjectId } from "mongodb";

function formatDoc(doc: any) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return {
    ...rest,
    id: rest.id || (_id ? _id.toString() : undefined),
  };
}

export const authRouter = createTRPCRouter({
  studentLogin: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const profilesCol = await getCollection(Collections.PROFILES);
      const user = await profilesCol.findOne({
        email: input.email.toLowerCase().trim(),
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      let isValid = false;
      if (user.password) {
        if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
          isValid = await bcrypt.compare(input.password, user.password);
        } else {
          isValid = input.password === user.password;
        }
      } else if (user.email && input.password.toLowerCase().trim() === user.email.toLowerCase().trim()) {
        isValid = true;
      }

      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      if (user.role !== "student") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only students can login here",
        });
      }

      if (user.isActive === false || user.is_active === false) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Your account has been disabled. Please contact the administrator.",
        });
      }

      const userId = user.id || user._id.toString();

      const token = await signToken({
        userId,
        email: user.email,
        role: user.role,
        branchId: user.branchId || user.branch_id || null,
      });

      const { password: _, ...userWithoutPassword } = user as any;

      return {
        success: true,
        user: {
          ...formatDoc(userWithoutPassword),
          id: userId,
        },
        token,
      };
    }),

  getProfile: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const profilesCol = await getCollection(Collections.PROFILES);
      const user = await profilesCol.findOne({
        $or: [
          { _id: input.userId as any },
          { id: input.userId },
          { Id: input.userId },
          ...(ObjectId.isValid(input.userId) ? [{ _id: new ObjectId(input.userId) }] : []),
        ],
      } as any);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const { password: _, ...userWithoutPassword } = user as any;
      return formatDoc(userWithoutPassword);
    }),
});
