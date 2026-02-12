import { describe, expect, it } from "vitest";

describe("Calendar Filter Logic", () => {
  describe("participant filtering", () => {
    it("should filter submissions by participant ID", () => {
      const submissions = [
        { id: 1, participantId: 1, link: "https://example.com/1", submissionDate: new Date("2026-02-12") },
        { id: 2, participantId: 2, link: "https://example.com/2", submissionDate: new Date("2026-02-12") },
        { id: 3, participantId: 1, link: "https://example.com/3", submissionDate: new Date("2026-02-13") },
      ];

      const selectedParticipantId = 1;
      const filtered = submissions.filter((sub) => sub.participantId === selectedParticipantId);

      expect(filtered).toHaveLength(2);
      expect(filtered.every((sub) => sub.participantId === 1)).toBe(true);
    });

    it("should show all submissions when no filter is applied", () => {
      const submissions = [
        { id: 1, participantId: 1, link: "https://example.com/1", submissionDate: new Date("2026-02-12") },
        { id: 2, participantId: 2, link: "https://example.com/2", submissionDate: new Date("2026-02-12") },
        { id: 3, participantId: 1, link: "https://example.com/3", submissionDate: new Date("2026-02-13") },
      ];

      const selectedParticipantId = null;
      const filtered = selectedParticipantId
        ? submissions.filter((sub) => sub.participantId === selectedParticipantId)
        : submissions;

      expect(filtered).toHaveLength(3);
    });

    it("should return empty array when participant has no submissions", () => {
      const submissions = [
        { id: 1, participantId: 1, link: "https://example.com/1", submissionDate: new Date("2026-02-12") },
        { id: 2, participantId: 2, link: "https://example.com/2", submissionDate: new Date("2026-02-12") },
      ];

      const selectedParticipantId = 3;
      const filtered = submissions.filter((sub) => sub.participantId === selectedParticipantId);

      expect(filtered).toHaveLength(0);
    });
  });

  describe("date grouping with filter", () => {
    it("should group filtered submissions by date", () => {
      const submissions = [
        { id: 1, participantId: 1, link: "https://example.com/1", submissionDate: new Date("2026-02-12") },
        { id: 2, participantId: 2, link: "https://example.com/2", submissionDate: new Date("2026-02-12") },
        { id: 3, participantId: 1, link: "https://example.com/3", submissionDate: new Date("2026-02-13") },
      ];

      const selectedParticipantId = 1;
      const filtered = submissions.filter((sub) => sub.participantId === selectedParticipantId);

      const grouped: Record<string, typeof filtered> = {};
      filtered.forEach((sub) => {
        const dateStr = new Date(sub.submissionDate).toISOString().split("T")[0];
        if (!grouped[dateStr]) {
          grouped[dateStr] = [];
        }
        grouped[dateStr].push(sub);
      });

      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped["2026-02-12"]).toHaveLength(1);
      expect(grouped["2026-02-13"]).toHaveLength(1);
    });

    it("should maintain all submissions when no filter is applied", () => {
      const submissions = [
        { id: 1, participantId: 1, link: "https://example.com/1", submissionDate: new Date("2026-02-12") },
        { id: 2, participantId: 2, link: "https://example.com/2", submissionDate: new Date("2026-02-12") },
        { id: 3, participantId: 1, link: "https://example.com/3", submissionDate: new Date("2026-02-13") },
      ];

      const selectedParticipantId = null;
      const filtered = selectedParticipantId
        ? submissions.filter((sub) => sub.participantId === selectedParticipantId)
        : submissions;

      const grouped: Record<string, typeof filtered> = {};
      filtered.forEach((sub) => {
        const dateStr = new Date(sub.submissionDate).toISOString().split("T")[0];
        if (!grouped[dateStr]) {
          grouped[dateStr] = [];
        }
        grouped[dateStr].push(sub);
      });

      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped["2026-02-12"]).toHaveLength(2);
      expect(grouped["2026-02-13"]).toHaveLength(1);
    });
  });
});
