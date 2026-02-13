import { describe, expect, it } from "vitest";

const MIN_SUBMISSIONS = 4;
const FINE_PER_SHORTAGE = 5000;

describe("Fine History Logic", () => {
  describe("weekly fine calculation", () => {
    it("should calculate total fine for a week", () => {
      const participants = [
        { id: 1, name: "Alice", submissionCount: 2 },
        { id: 2, name: "Bob", submissionCount: 4 },
        { id: 3, name: "Charlie", submissionCount: 1 },
      ];

      let totalFine = 0;
      participants.forEach((p) => {
        const shortage = Math.max(0, MIN_SUBMISSIONS - p.submissionCount);
        totalFine += shortage * FINE_PER_SHORTAGE;
      });

      expect(totalFine).toBe(25000); // (2 + 0 + 3) * 5000 = 5 * 5000
    });

    it("should return zero fine when all participants meet minimum", () => {
      const participants = [
        { id: 1, name: "Alice", submissionCount: 4 },
        { id: 2, name: "Bob", submissionCount: 5 },
        { id: 3, name: "Charlie", submissionCount: 4 },
      ];

      let totalFine = 0;
      participants.forEach((p) => {
        const shortage = Math.max(0, MIN_SUBMISSIONS - p.submissionCount);
        totalFine += shortage * FINE_PER_SHORTAGE;
      });

      expect(totalFine).toBe(0);
    });
  });

  describe("participant fine tracking", () => {
    it("should track individual participant fines", () => {
      const participants = [
        { id: 1, name: "Alice", submissionCount: 2 },
        { id: 2, name: "Bob", submissionCount: 4 },
      ];

      const participantFines: Record<number, number> = {};

      participants.forEach((p) => {
        const shortage = Math.max(0, MIN_SUBMISSIONS - p.submissionCount);
        participantFines[p.id] = shortage * FINE_PER_SHORTAGE;
      });

      expect(participantFines[1]).toBe(10000); // 2 shortage * 5000
      expect(participantFines[2]).toBe(0); // 0 shortage
    });

    it("should calculate cumulative fines over multiple weeks", () => {
      const weeks = [
        { week: "01.05", fines: [10000, 0, 15000] }, // Total: 25000
        { week: "01.12", fines: [5000, 5000, 10000] }, // Total: 20000
        { week: "01.19", fines: [0, 0, 5000] }, // Total: 5000
      ];

      const totalFines = weeks.reduce((sum, week) => sum + week.fines.reduce((a, b) => a + b, 0), 0);
      expect(totalFines).toBe(50000);

      const averageFine = Math.round(totalFines / weeks.length);
      expect(averageFine).toBe(16667);
    });
  });

  describe("weekly trend analysis", () => {
    it("should identify max and min fine weeks", () => {
      const weeks = [
        { week: "01.05", totalFine: 25000 },
        { week: "01.12", totalFine: 20000 },
        { week: "01.19", totalFine: 5000 },
        { week: "01.26", totalFine: 30000 },
      ];

      const maxWeek = weeks.reduce((max, week) => (week.totalFine > max.totalFine ? week : max));
      const minWeek = weeks.reduce((min, week) => (week.totalFine < min.totalFine ? week : min));

      expect(maxWeek.totalFine).toBe(30000);
      expect(maxWeek.week).toBe("01.26");
      expect(minWeek.totalFine).toBe(5000);
      expect(minWeek.week).toBe("01.19");
    });

    it("should calculate average fine over weeks", () => {
      const weeks = [
        { week: "01.05", totalFine: 25000 },
        { week: "01.12", totalFine: 20000 },
        { week: "01.19", totalFine: 5000 },
      ];

      const totalFines = weeks.reduce((sum, week) => sum + week.totalFine, 0);
      const averageFine = Math.round(totalFines / weeks.length);

      expect(averageFine).toBe(16667);
    });
  });

  describe("date range calculations", () => {
    it("should generate correct week start and end dates", () => {
      const today = new Date("2026-02-12"); // Thursday
      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      const lastMondayStart = new Date(today);
      lastMondayStart.setDate(today.getDate() - daysToMonday - 7);

      const lastSundayEnd = new Date(lastMondayStart);
      lastSundayEnd.setDate(lastMondayStart.getDate() + 6);

      expect(lastMondayStart.getDate()).toBe(2); // Feb 2 (Monday)
      expect(lastSundayEnd.getDate()).toBe(8); // Feb 8 (Sunday)
    });

    it("should generate 12 weeks of historical data", () => {
      const today = new Date();
      const weeks = [];

      for (let i = 11; i >= 0; i--) {
        const endDate = new Date(today);
        endDate.setDate(today.getDate() - i * 7);

        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 6);

        weeks.push({
          week: `${(endDate.getMonth() + 1).toString().padStart(2, "0")}.${endDate.getDate().toString().padStart(2, "0")}`,
          startDate,
          endDate,
        });
      }

      expect(weeks).toHaveLength(12);
      expect(weeks[0].week).toBeDefined();
      expect(weeks[11].week).toBeDefined();
    });
  });
});
