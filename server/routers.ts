import { COURSE_OFFER, findLesson } from "@shared/course";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createCourseCheckout } from "./stripe";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie("webdev_app_session", { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  academy: router({
    offer: publicProcedure.query(() => COURSE_OFFER),
    status: protectedProcedure.query(async ({ ctx }) => {
      const [enrolled, completedLessonIds, purchases] = await Promise.all([
        db.hasActiveAccess(ctx.user.id, COURSE_OFFER.slug),
        db.getCompletedLessonIds(ctx.user.id, COURSE_OFFER.slug),
        db.getPaymentsForUser(ctx.user.id),
      ]);
      return { enrolled, completedLessonIds, purchases };
    }),
    checkout: protectedProcedure.mutation(async ({ ctx }) => {
      const enrolled = await db.hasActiveAccess(ctx.user.id, COURSE_OFFER.slug);
      if (enrolled) throw new TRPCError({ code: "CONFLICT", message: "Votre accès est déjà actif." });
      const url = await createCourseCheckout(ctx.user, ctx.req);
      return { url };
    }),
    completeLesson: protectedProcedure.input(z.object({ lessonId: z.string().min(1).max(96) })).mutation(async ({ ctx, input }) => {
      const lesson = findLesson(input.lessonId);
      if (!lesson) throw new TRPCError({ code: "NOT_FOUND", message: "Leçon introuvable." });
      const enrolled = await db.hasActiveAccess(ctx.user.id, COURSE_OFFER.slug);
      if (!enrolled) throw new TRPCError({ code: "FORBIDDEN", message: "Cet accès est réservé aux apprenants." });
      await db.markLessonCompleted(ctx.user.id, COURSE_OFFER.slug, lesson.id);
      return { success: true, lessonId: lesson.id };
    }),
  }),
});

export type AppRouter = typeof appRouter;
