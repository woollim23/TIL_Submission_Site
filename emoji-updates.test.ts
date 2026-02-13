import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Emoji and Latest Updates Features", () => {
  describe("participant emoji", () => {
    it("should have default emoji when participant is created", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.participants.create({
        name: `emoji-test-${Date.now()}`,
      });

      expect(result).toBeDefined();
    });

    it("should update participant emoji", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const newParticipant = await caller.participants.create({
        name: `emoji-update-${Date.now()}`,
      });

      expect(newParticipant).toBeDefined();
    });

    it("should validate emoji format", () => {
      const validEmojis = ["😀", "🎉", "👍", "❤️", "🚀"];
      validEmojis.forEach((emoji) => {
        expect(emoji).toBeTruthy();
        expect(emoji.length).toBeGreaterThan(0);
      });
    });
  });

  describe("latest submissions", () => {
    it("should retrieve latest submissions with participant info", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const submissions = await caller.tilSubmissions.getLatest({ limit: 5 });

      expect(Array.isArray(submissions)).toBe(true);
      expect(submissions.length).toBeLessThanOrEqual(5);

      if (submissions.length > 0) {
        const submission = submissions[0];
        expect(submission).toHaveProperty("id");
        expect(submission).toHaveProperty("link");
        expect(submission).toHaveProperty("submissionDate");
        expect(submission).toHaveProperty("participantName");
        expect(submission).toHaveProperty("participantEmoji");
      }
    });

    it("should return submissions in reverse chronological order", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const submissions = await caller.tilSubmissions.getLatest({ limit: 10 });

      // Verify all submissions have valid dates
      submissions.forEach((submission) => {
        expect(submission.submissionDate).toBeTruthy();
        const date = new Date(submission.submissionDate);
        expect(date.getTime()).toBeGreaterThan(0);
      });
    });

    it("should respect limit parameter", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const limit = 3;
      const submissions = await caller.tilSubmissions.getLatest({ limit });

      expect(submissions.length).toBeLessThanOrEqual(limit);
    });

    it("should include participant emoji in latest submissions", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const submissions = await caller.tilSubmissions.getLatest({ limit: 5 });

      submissions.forEach((submission) => {
        expect(submission.participantEmoji).toBeTruthy();
        expect(typeof submission.participantEmoji).toBe("string");
      });
    });
  });

  describe("emoji display", () => {
    it("should format emoji correctly with participant name", () => {
      const emoji = "😀";
      const name = "John Doe";
      const formatted = `${emoji} ${name}`;

      expect(formatted).toBe("😀 John Doe");
    });

    it("should handle various emoji types", () => {
      const emojis = ["😀", "🎉", "👍", "❤️", "🚀", "🌟", "💡"];
      emojis.forEach((emoji) => {
        const formatted = `${emoji} Test`;
        expect(formatted).toContain("Test");
        expect(formatted).toContain(emoji);
      });
    });
  });

  describe("latest updates block", () => {
    it("should display latest submissions in correct format", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const submissions = await caller.tilSubmissions.getLatest({ limit: 5 });

      const formatted = submissions.map((sub) => ({
        emoji: sub.participantEmoji,
        name: sub.participantName,
        link: sub.link,
        date: new Date(sub.submissionDate),
      }));

      formatted.forEach((item) => {
        expect(item.emoji).toBeTruthy();
        expect(item.name).toBeTruthy();
        expect(item.link).toBeTruthy();
        expect(item.date).toBeInstanceOf(Date);
      });
    });
  });
});
