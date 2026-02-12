import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  getAllParticipants,
  createParticipant,
  getParticipantById,
  deleteParticipant,
  updateParticipantEmoji,
  createTILSubmission,
  getTILSubmissionsByDate,
  getTILSubmissionsByParticipantAndDate,
  deleteTILSubmission,
  getLatestSubmissions,
  getAllSubmissionsByParticipant,
} from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  participants: router({
    list: publicProcedure.query(() => getAllParticipants()),
    create: publicProcedure
      .input(z.object({ name: z.string().min(1) }))
      .mutation(({ input }) => createParticipant(input.name)),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteParticipant(input.id)),
    updateEmoji: publicProcedure
      .input(z.object({ id: z.number(), emoji: z.string() }))
      .mutation(({ input }) => updateParticipantEmoji(input.id, input.emoji)),
  }),

  tilSubmissions: router({
    create: publicProcedure
      .input(
        z.object({
          participantId: z.number(),
          link: z.string().url(),
          submissionDate: z.date(),
        })
      )
      .mutation(({ input }) =>
        createTILSubmission(input.participantId, input.link, input.submissionDate)
      ),
    getByDateRange: publicProcedure
      .input(
        z.object({
          startDate: z.date(),
          endDate: z.date(),
        })
      )
      .query(({ input }) =>
        getTILSubmissionsByDate(input.startDate, input.endDate)
      ),
    getByParticipantAndDateRange: publicProcedure
      .input(
        z.object({
          participantId: z.number(),
          startDate: z.date(),
          endDate: z.date(),
        })
      )
      .query(({ input }) =>
        getTILSubmissionsByParticipantAndDate(
          input.participantId,
          input.startDate,
          input.endDate
        )
      ),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteTILSubmission(input.id)),
    getLatest: publicProcedure
      .input(z.object({ limit: z.number().default(5) }))
      .query(({ input }) => getLatestSubmissions(input.limit)),
    getAllByParticipant: publicProcedure
      .input(z.object({ participantId: z.number() }))
      .query(({ input }) => getAllSubmissionsByParticipant(input.participantId)),
  }),
});

export type AppRouter = typeof appRouter;
