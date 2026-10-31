import { describe, it, expect } from "vitest";
import {
  computeTargetCalendarDate,
  generateMilestones,
  generateDefaultRunOfShow,
  toggleMilestoneStatus,
  calculatePlanningProgress
} from "./scheduler";
import { TimelineMilestone } from "./types";

describe("Timeline Scheduler Domain Functions", () => {
  describe("computeTargetCalendarDate", () => {
    it("correctly subtracts days across months and years", () => {
      // 2027-06-15 minus 15 days = 2027-05-31
      expect(computeTargetCalendarDate("2027-06-15", 15)).toBe("2027-05-31");
      // 2027-01-10 minus 20 days = 2026-12-21
      expect(computeTargetCalendarDate("2027-01-10", 20)).toBe("2026-12-21");
      // Day of event (0 days before)
      expect(computeTargetCalendarDate("2027-08-20", 0)).toBe("2027-08-20");
    });
  });

  describe("generateMilestones", () => {
    it("generates wedding milestones with valid chronological target dates", () => {
      const milestones = generateMilestones("wedding", "2027-10-01");
      expect(milestones.length).toBeGreaterThanOrEqual(6);

      const first = milestones[0];
      expect(first.targetDaysBeforeEvent).toBe(270);
      expect(first.targetDate).toBe("2027-01-04");
      expect(first.isCompleted).toBe(false);
    });

    it("generates birthday milestones with appropriate lead time", () => {
      const milestones = generateMilestones("birthday", "2027-05-10");
      expect(milestones.length).toBeGreaterThanOrEqual(4);
      expect(milestones.some((m) => m.title.includes("Cake"))).toBe(true);
    });

    it("generates community milestones with permits focus", () => {
      const milestones = generateMilestones("community", "2027-09-12");
      expect(milestones.some((m) => m.title.includes("Permits"))).toBe(true);
    });
  });

  describe("generateDefaultRunOfShow", () => {
    it("produces wedding schedule in chronological order", () => {
      const ros = generateDefaultRunOfShow("wedding");
      expect(ros.length).toBe(8);
      expect(ros[0].activity).toContain("Hair");
      expect(ros[ros.length - 1].activity).toContain("Send-Off");
    });

    it("produces community event schedule", () => {
      const ros = generateDefaultRunOfShow("community");
      expect(ros.length).toBe(5);
      expect(ros[0].activity).toContain("Load-In");
    });
  });

  describe("toggleMilestoneStatus & calculatePlanningProgress", () => {
    const mockMilestones: TimelineMilestone[] = [
      {
        id: "m-1",
        phase: "concept_budget",
        title: "Task 1",
        description: "Desc 1",
        targetDaysBeforeEvent: 30,
        targetDate: "2027-05-01",
        isCompleted: false,
        priority: "high"
      },
      {
        id: "m-2",
        phase: "vendor_booking",
        title: "Task 2",
        description: "Desc 2",
        targetDaysBeforeEvent: 20,
        targetDate: "2027-05-11",
        isCompleted: false,
        priority: "medium"
      }
    ];

    it("calculates 0% progress initially", () => {
      expect(calculatePlanningProgress(mockMilestones)).toBe(0);
    });

    it("toggles completion and updates progress", () => {
      const updated = toggleMilestoneStatus(mockMilestones, "m-1");
      expect(updated[0].isCompleted).toBe(true);
      expect(updated[1].isCompleted).toBe(false);
      expect(calculatePlanningProgress(updated)).toBe(50);

      const allCompleted = toggleMilestoneStatus(updated, "m-2");
      expect(calculatePlanningProgress(allCompleted)).toBe(100);
    });

    it("handles empty milestone arrays safely", () => {
      expect(calculatePlanningProgress([])).toBe(0);
    });
  });
});
