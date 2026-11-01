import { describe, it, expect } from "vitest";
import {
  generateTimeline,
  computeTargetCalendarDate,
  calculateDaysBetween,
  TIMELINE_BLUEPRINTS,
} from "./timeline";

describe("timeline Domain Module", () => {
  const REF_DATE = "2026-11-01"; // Fixed deterministic test reference date

  describe("TIMELINE_BLUEPRINTS Consistency", () => {
    it("provides ordered backward blueprints for all three event types", () => {
      const types = ["wedding", "birthday", "community"] as const;

      for (const eventType of types) {
        const bps = TIMELINE_BLUEPRINTS[eventType];
        expect(bps.length).toBeGreaterThanOrEqual(5);

        // Blueprints should be in descending order of daysBefore
        for (let i = 0; i < bps.length - 1; i++) {
          expect(bps[i].daysBefore).toBeGreaterThanOrEqual(bps[i + 1].daysBefore);
          expect(bps[i].minDaysBefore).toBeGreaterThanOrEqual(bps[i + 1].minDaysBefore);
        }

        // Final milestone should be day-of (0 daysBefore)
        expect(bps[bps.length - 1].daysBefore).toBe(0);
      }
    });
  });

  describe("generateTimeline - Ample Lead Time (Nominal Schedule)", () => {
    it("generates backward scheduled wedding milestones when lead time is ample (400 days)", () => {
      // Event date 400 days in future: 2027-12-06
      const eventDate = "2027-12-06";
      const milestones = generateTimeline(
        { eventType: "wedding", date: eventDate },
        REF_DATE,
      );

      expect(milestones.length).toBe(8);

      // Verify exact backward scheduling relative to event date
      expect(milestones[0].title).toBe("Finalize Guest Count & Set Budget Cap");
      expect(milestones[0].targetDaysBeforeEvent).toBe(270);
      expect(milestones[0].targetDate).toBe(computeTargetCalendarDate(eventDate, 270));
      expect(milestones[0].isOverdue).toBe(false);
      expect(milestones[0].isCompressed).toBe(false);

      expect(milestones[1].targetDaysBeforeEvent).toBe(240);
      expect(milestones[2].targetDaysBeforeEvent).toBe(180);
      expect(milestones[3].targetDaysBeforeEvent).toBe(150);
      expect(milestones[4].targetDaysBeforeEvent).toBe(60);
      expect(milestones[5].targetDaysBeforeEvent).toBe(14);
      expect(milestones[6].targetDaysBeforeEvent).toBe(1);
      expect(milestones[7].targetDaysBeforeEvent).toBe(0);

      // Verify none are overdue when lead time is ample
      expect(milestones.every((m) => !m.isOverdue)).toBe(true);
    });

    it("generates birthday milestones backward from event date", () => {
      const eventDate = "2027-02-15"; // ~106 days lead time (>45 nominal max)
      const milestones = generateTimeline(
        { eventType: "birthday", date: eventDate },
        REF_DATE,
      );

      expect(milestones.length).toBe(5);
      expect(milestones[0].targetDaysBeforeEvent).toBe(45);
      expect(milestones[1].targetDaysBeforeEvent).toBe(30);
      expect(milestones[2].targetDaysBeforeEvent).toBe(21);
      expect(milestones[3].targetDaysBeforeEvent).toBe(7);
      expect(milestones[4].targetDaysBeforeEvent).toBe(0);
      expect(milestones.every((m) => !m.isOverdue)).toBe(true);
    });

    it("generates community event milestones backward from event date", () => {
      const eventDate = "2027-05-01"; // ~181 days lead time (>90 nominal max)
      const milestones = generateTimeline(
        { eventType: "community", eventDate },
        REF_DATE,
      );

      expect(milestones.length).toBe(5);
      expect(milestones[0].title).toContain("Permits");
      expect(milestones[0].targetDaysBeforeEvent).toBe(90);
      expect(milestones[4].targetDaysBeforeEvent).toBe(0);
      expect(milestones.every((m) => !m.isOverdue)).toBe(true);
    });
  });

  describe("Short Lead Time Graceful Compression", () => {
    it("compresses milestone intervals when lead time is shorter than nominal max", () => {
      // Nominal wedding needs 270 days, but only 60 days lead time available
      const eventDate = "2026-12-31"; // 60 days from 2026-11-01
      const milestones = generateTimeline(
        { eventType: "wedding", date: eventDate },
        REF_DATE,
      );

      expect(milestones.length).toBe(8);

      // Milestones with nominal > 60 days are compressed
      expect(milestones[0].nominalDaysBefore).toBe(270);
      expect(milestones[0].targetDaysBeforeEvent).toBeLessThan(270);
      expect(milestones[0].isCompressed).toBe(true);

      // Verify all target dates stay on or before the event date
      for (const m of milestones) {
        expect(m.targetDaysBeforeEvent).toBeLessThanOrEqual(60);
        expect(m.targetDaysBeforeEvent).toBeGreaterThanOrEqual(0);
      }
    });

    it("respects compress: false option to disable compression", () => {
      const eventDate = "2026-12-01"; // 30 days lead time
      const milestones = generateTimeline(
        { eventType: "wedding", date: eventDate },
        { currentDate: REF_DATE, compress: false },
      );

      // With compress: false, nominal daysBefore remain intact
      expect(milestones[0].targetDaysBeforeEvent).toBe(270);
      expect(milestones[0].isCompressed).toBe(false);
      // Because 270 days before 2026-12-01 is in the past, it must be overdue
      expect(milestones[0].isOverdue).toBe(true);
    });
  });

  describe("Overdue Milestone Flagging", () => {
    it("flags milestones already overdue when lead time is extremely short (e.g. 5 days)", () => {
      const eventDate = "2026-11-06"; // 5 days lead time
      const milestones = generateTimeline(
        { eventType: "wedding", date: eventDate },
        REF_DATE,
      );

      // Milestones requiring significant lead time are flagged overdue
      const overdueMilestones = milestones.filter((m) => m.isOverdue);
      expect(overdueMilestones.length).toBeGreaterThan(0);

      const guestCapMilestone = milestones.find((m) => m.phase === "concept_budget");
      expect(guestCapMilestone?.isOverdue).toBe(true);

      // Day-of milestone (0 days before event) is scheduled on 2026-11-06 (future) -> not overdue
      const dayOfMilestone = milestones[milestones.length - 1];
      expect(dayOfMilestone.targetDate).toBe("2026-11-06");
      expect(dayOfMilestone.isOverdue).toBe(false);
    });

    it("supports overdue alias property matching isOverdue", () => {
      const eventDate = "2026-11-03";
      const milestones = generateTimeline(
        { eventType: "birthday", date: eventDate },
        REF_DATE,
      );
      for (const m of milestones) {
        expect(m.overdue).toBe(m.isOverdue);
      }
    });
  });

  describe("Leap Year Handling", () => {
    it("accurately handles leap day 2028-02-29 in backward date calculations", () => {
      // Event on 2028-03-01 (in a leap year)
      // 1 day before should be exactly 2028-02-29 (leap day)
      const date1DayBefore = computeTargetCalendarDate("2028-03-01", 1);
      expect(date1DayBefore).toBe("2028-02-29");

      // In a non-leap year (2027), 1 day before 2027-03-01 is 2027-02-28
      const nonLeapDate1DayBefore = computeTargetCalendarDate("2027-03-01", 1);
      expect(nonLeapDate1DayBefore).toBe("2027-02-28");
    });

    it("computes exact day differences across leap years with calculateDaysBetween", () => {
      // Across leap day in 2028
      const diffLeap = calculateDaysBetween("2028-02-28", "2028-03-01");
      expect(diffLeap).toBe(2);

      // Across non-leap year in 2027
      const diffNonLeap = calculateDaysBetween("2027-02-28", "2027-03-01");
      expect(diffNonLeap).toBe(1);
    });

    it("schedules milestone on leap day for wedding on 2028-03-01", () => {
      const milestones = generateTimeline(
        { eventType: "wedding", date: "2028-03-01" },
        "2027-01-01",
      );

      // Rehearsal is 1 day before event -> 2028-02-29
      const rehearsal = milestones.find((m) => m.title.includes("Rehearsal"));
      expect(rehearsal?.targetDate).toBe("2028-02-29");
    });
  });

  describe("Boundary Values & Edge Cases", () => {
    it("handles event scheduled for today (0 days lead time)", () => {
      const milestones = generateTimeline(
        { eventType: "birthday", date: REF_DATE },
        REF_DATE,
      );

      // Tasks with daysBefore > 0 are overdue, day-of is today
      const dayOf = milestones[milestones.length - 1];
      expect(dayOf.targetDate).toBe(REF_DATE);
      expect(dayOf.targetDaysBeforeEvent).toBe(0);
    });

    it("throws TypeError if event date is missing or not a string", () => {
      expect(() =>
        generateTimeline(
          { eventType: "wedding" } as unknown as { eventType: "wedding"; date: string },
          REF_DATE,
        ),
      ).toThrow(TypeError);
      expect(() =>
        generateTimeline(
          { eventType: "wedding", date: "" } as unknown as {
            eventType: "wedding";
            date: string;
          },
          REF_DATE,
        ),
      ).toThrow(TypeError);
    });

    it("throws Error if eventType is unsupported", () => {
      expect(() =>
        generateTimeline(
          { eventType: "unknown" as unknown as "wedding", date: "2027-05-01" },
          REF_DATE,
        ),
      ).toThrow(/Unsupported event type/);
    });

    it("uses current date when optionsOrCurrentDate is omitted", () => {
      const futureYear = new Date().getFullYear() + 2;
      const futureDate = `${futureYear}-06-15`;
      const milestones = generateTimeline({
        eventType: "birthday",
        date: futureDate,
      });
      expect(milestones.length).toBe(5);
      expect(milestones[0].isOverdue).toBe(false);

      // Also test options object without currentDate
      const withOptionsOnly = generateTimeline(
        { eventType: "birthday", date: futureDate },
        { compress: true },
      );
      expect(withOptionsOnly.length).toBe(5);
    });

    it("accepts Date instance as reference date", () => {
      const d = new Date("2026-11-01T00:00:00.000Z");
      const milestones = generateTimeline(
        { eventType: "community", date: "2027-06-01" },
        d,
      );
      expect(milestones.length).toBe(5);
    });
  });
});
