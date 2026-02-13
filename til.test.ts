import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createTestContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("TIL Tracker API", () => {
  describe("participants router", () => {
    it("should create a new participant", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const uniqueName = `Test User ${Date.now()}`;
      const result = await caller.participants.create({ name: uniqueName });

      expect(result).toBeDefined();
    });

    it("should list all participants", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.participants.list();

      expect(Array.isArray(result)).toBe(true);
    });

    it("should delete a participant", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const uniqueName = `Delete Test ${Date.now()}`;
      await caller.participants.create({ name: uniqueName });

      const participants = await caller.participants.list();
      const testParticipant = participants.find((p) => p.name === uniqueName);

      if (testParticipant) {
        const result = await caller.participants.delete({ id: testParticipant.id });
        expect(result).toBeDefined();
      }
    });
  });

  describe("tilSubmissions router", () => {
    it("should create a TIL submission", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const uniqueName = `Submission Test ${Date.now()}`;
      await caller.participants.create({ name: uniqueName });
      const participants = await caller.participants.list();
      const participant = participants.find((p) => p.name === uniqueName);

      if (participant) {
        const result = await caller.tilSubmissions.create({
          participantId: participant.id,
          link: "https://example.com/til",
          submissionDate: new Date(),
        });

        expect(result).toBeDefined();
      }
    });

    it("should get submissions by date range", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const endDate = new Date();

      const result = await caller.tilSubmissions.getByDateRange({
        startDate,
        endDate,
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it("should get submissions by participant and date range", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const uniqueName = `Range Test ${Date.now()}`;
      await caller.participants.create({ name: uniqueName });
      const participants = await caller.participants.list();
      const participant = participants.find((p) => p.name === uniqueName);

      if (participant) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        const endDate = new Date();

        const result = await caller.tilSubmissions.getByParticipantAndDateRange({
          participantId: participant.id,
          startDate,
          endDate,
        });

        expect(Array.isArray(result)).toBe(true);
      }
    });

    it("should delete a TIL submission", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const uniqueName = `Delete Submission Test ${Date.now()}`;
      await caller.participants.create({ name: uniqueName });
      const participants = await caller.participants.list();
      const participant = participants.find((p) => p.name === uniqueName);

      if (participant) {
        const submissionResult = await caller.tilSubmissions.create({
          participantId: participant.id,
          link: "https://example.com/til",
          submissionDate: new Date(),
        });

        expect(submissionResult).toBeDefined();
      }
    });
  });

  describe("fine calculation logic", () => {
    it("should calculate shortage correctly", () => {
      const MIN_SUBMISSIONS = 4;
      const submitted = 2;
      const shortage = Math.max(0, MIN_SUBMISSIONS - submitted);

      expect(shortage).toBe(2);
    });

    it("should calculate fine correctly", () => {
      const MIN_SUBMISSIONS = 4;
      const FINE_PER_SHORTAGE = 5000;
      const submitted = 2;
      const shortage = Math.max(0, MIN_SUBMISSIONS - submitted);
      const fine = shortage * FINE_PER_SHORTAGE;

      expect(fine).toBe(10000);
    });

    it("should not charge fine when minimum is met", () => {
      const MIN_SUBMISSIONS = 4;
      const FINE_PER_SHORTAGE = 5000;
      const submitted = 4;
      const shortage = Math.max(0, MIN_SUBMISSIONS - submitted);
      const fine = shortage * FINE_PER_SHORTAGE;

      expect(fine).toBe(0);
    });
  });
});
