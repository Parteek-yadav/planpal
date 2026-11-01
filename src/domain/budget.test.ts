import { describe, it, expect } from "vitest";
import {
  allocateBudget,
  getBudgetStatus,
  trackSpend,
  EVENT_BUDGET_RULES,
} from "./budget";
import type { EventType } from "./eventProfile";

describe("budget Domain Module", () => {
  describe("EVENT_BUDGET_RULES Consistency", () => {
    it("ensures wedding rules contain the exact required categories and sum to 100%", () => {
      const weddingRules = EVENT_BUDGET_RULES.wedding;
      const categories = weddingRules.map((r) => r.category);

      // weddings: venue, catering, photography, attire, decor, music, misc
      expect(categories).toEqual([
        "venue",
        "catering",
        "photography",
        "attire",
        "decor",
        "music",
        "misc",
      ]);

      const sumPercentages = weddingRules.reduce((sum, r) => sum + r.percentage, 0);
      expect(sumPercentages).toBe(100);
    });

    it("ensures birthday rules sum to 100%", () => {
      const birthdayRules = EVENT_BUDGET_RULES.birthday;
      const categories = birthdayRules.map((r) => r.category);
      expect(categories).toContain("venue");
      expect(categories).toContain("catering");
      expect(categories).toContain("cake");
      expect(categories).toContain("entertainment");

      const sumPercentages = birthdayRules.reduce((sum, r) => sum + r.percentage, 0);
      expect(sumPercentages).toBe(100);
    });

    it("ensures community rules sum to 100%", () => {
      const communityRules = EVENT_BUDGET_RULES.community;
      const categories = communityRules.map((r) => r.category);
      expect(categories).toContain("permits");
      expect(categories).toContain("venue");
      expect(categories).toContain("catering");

      const sumPercentages = communityRules.reduce((sum, r) => sum + r.percentage, 0);
      expect(sumPercentages).toBe(100);
    });
  });

  describe("allocateBudget - Event Archetypes & Structure", () => {
    it("allocates wedding budget with all categories, ratios, and percentages", () => {
      const allocation = allocateBudget({
        eventType: "wedding",
        budget: 20000,
      });

      expect(allocation.totalBudget).toBe(20000);
      expect(allocation.percentages.venue).toBe(25);
      expect(allocation.percentages.catering).toBe(25);
      expect(allocation.percentages.photography).toBe(12);
      expect(allocation.percentages.attire).toBe(10);
      expect(allocation.percentages.decor).toBe(10);
      expect(allocation.percentages.music).toBe(8);
      expect(allocation.percentages.misc).toBe(10);

      // Direct property access
      expect(allocation.venue?.amount).toBe(5000);
      expect(allocation.catering?.amount).toBe(5000);
      expect(allocation.photography?.amount).toBe(2400);
      expect(allocation.attire?.amount).toBe(2000);
      expect(allocation.decor?.amount).toBe(2000);
      expect(allocation.music?.amount).toBe(1600);
      expect(allocation.misc?.amount).toBe(2000);

      // Items array and iterable
      expect(allocation.items.length).toBe(7);
      const iterated = [...allocation];
      expect(iterated.length).toBe(7);
      expect(iterated[0].category).toBe("venue");
    });

    it("allocates birthday budget with its distinct category set", () => {
      const allocation = allocateBudget({
        eventType: "birthday",
        budget: 5000,
      });

      expect(allocation.totalBudget).toBe(5000);
      expect(allocation.percentages.venue).toBe(30);
      expect(allocation.venue?.amount).toBe(1500);
      expect(allocation.cake?.amount).toBe(500);
      expect(allocation.entertainment?.amount).toBe(750);
    });

    it("allocates community event budget with permits and volunteer supplies", () => {
      const allocation = allocateBudget({
        eventType: "community",
        budget: 12000,
      });

      expect(allocation.totalBudget).toBe(12000);
      expect(allocation.permits?.amount).toBe(3000);
      expect(allocation.venue?.amount).toBe(3000);
      expect(allocation.catering?.amount).toBe(2400);
      expect(allocation.marketing?.amount).toBe(1200);
    });

    it("accepts totalBudget property as alias", () => {
      const allocation = allocateBudget({
        eventType: "wedding",
        totalBudget: 15000,
      });
      expect(allocation.totalBudget).toBe(15000);
      expect(allocation.venue?.amount).toBe(3750);
    });
  });

  describe("Exhaustive Rounding Tests (Sum Exactly Equals Total)", () => {
    const testBudgets = [
      0.01, 0.02, 0.03, 0.07, 0.99, 1.0, 2.5, 7.77, 33.33, 99.99, 100.0, 333.33, 777.77,
      1234.56, 9876.54, 10000.0, 25000.0, 100000.0, 1234567.89, 10000000.0,
    ];

    it("guarantees allocations sum to EXACT total for wedding across all boundary budgets", () => {
      for (const budget of testBudgets) {
        const allocation = allocateBudget({ eventType: "wedding", budget });
        const sumAmounts = allocation.items.reduce((sum, item) => sum + item.amount, 0);
        const roundedSum = Math.round(sumAmounts * 100) / 100;
        expect(roundedSum).toBe(budget);
      }
    });

    it("guarantees allocations sum to EXACT total for birthday across all boundary budgets", () => {
      for (const budget of testBudgets) {
        const allocation = allocateBudget({ eventType: "birthday", budget });
        const sumAmounts = allocation.items.reduce((sum, item) => sum + item.amount, 0);
        const roundedSum = Math.round(sumAmounts * 100) / 100;
        expect(roundedSum).toBe(budget);
      }
    });

    it("guarantees allocations sum to EXACT total for community events across all boundary budgets", () => {
      for (const budget of testBudgets) {
        const allocation = allocateBudget({ eventType: "community", budget });
        const sumAmounts = allocation.items.reduce((sum, item) => sum + item.amount, 0);
        const roundedSum = Math.round(sumAmounts * 100) / 100;
        expect(roundedSum).toBe(budget);
      }
    });
  });

  describe("Zero, Negative & Invalid Inputs", () => {
    it("throws RangeError when budget is zero", () => {
      expect(() => allocateBudget({ eventType: "wedding", budget: 0 })).toThrow(
        RangeError,
      );
    });

    it("throws RangeError when budget is negative", () => {
      expect(() => allocateBudget({ eventType: "wedding", budget: -0.01 })).toThrow(
        RangeError,
      );
      expect(() => allocateBudget({ eventType: "wedding", budget: -5000 })).toThrow(
        RangeError,
      );
    });

    it("throws TypeError when budget is NaN, undefined, or null", () => {
      expect(() => allocateBudget({ eventType: "wedding", budget: NaN })).toThrow(
        TypeError,
      );
      expect(() =>
        allocateBudget({ eventType: "wedding" } as unknown as {
          eventType: EventType;
          budget: number;
        }),
      ).toThrow(TypeError);
      expect(() =>
        allocateBudget({ eventType: "wedding", budget: null as unknown as number }),
      ).toThrow(TypeError);
    });

    it("throws Error when eventType is unsupported", () => {
      expect(() =>
        allocateBudget({
          eventType: "unsupported" as unknown as EventType,
          budget: 1000,
        }),
      ).toThrow(/Unsupported event type/);
    });
  });

  describe("getBudgetStatus - Single Category and Multi-Category", () => {
    it("returns 'ok' when spend is well below warning threshold (<80%)", () => {
      expect(getBudgetStatus(1000, 0)).toBe("ok");
      expect(getBudgetStatus(1000, 500)).toBe("ok");
      expect(getBudgetStatus(1000, 799.99)).toBe("ok");
      expect(getBudgetStatus(1000, -10)).toBe("ok"); // negative spend / refund
    });

    it("returns 'warning' when spend is between warning threshold and 100%", () => {
      expect(getBudgetStatus(1000, 800)).toBe("warning"); // exactly 80%
      expect(getBudgetStatus(1000, 900)).toBe("warning");
      expect(getBudgetStatus(1000, 1000)).toBe("warning"); // exactly 100%
    });

    it("returns 'over' when spend exceeds 100%", () => {
      expect(getBudgetStatus(1000, 1000.01)).toBe("over");
      expect(getBudgetStatus(1000, 1500)).toBe("over");
    });

    it("supports custom warningThreshold parameter", () => {
      // With threshold 0.90 (90%)
      expect(getBudgetStatus(1000, 850, 0.9)).toBe("ok");
      expect(getBudgetStatus(1000, 900, 0.9)).toBe("warning");
      expect(getBudgetStatus(1000, 1050, 0.9)).toBe("over");
    });

    it("handles zero allocated amount edge cases", () => {
      expect(getBudgetStatus(0, 0)).toBe("ok");
      expect(getBudgetStatus(0, 1)).toBe("over");
      expect(getBudgetStatus(0, -5)).toBe("ok");
    });

    it("evaluates getBudgetStatus for multiple categories via BudgetAllocation", () => {
      const allocation = allocateBudget({ eventType: "wedding", budget: 10000 });
      // venue allocated: 2500, catering allocated: 2500, photography allocated: 1200
      const spendMap = {
        venue: 1500, // 60% -> ok
        catering: 2100, // 84% -> warning
        photography: 1300, // > 100% -> over
      };

      const statuses = getBudgetStatus(allocation, spendMap);

      expect(statuses.venue).toBe("ok");
      expect(statuses.catering).toBe("warning");
      expect(statuses.photography).toBe("over");
      expect(statuses.attire).toBe("ok"); // 0 spent -> ok
    });

    it("evaluates getBudgetStatus with SpendEntry array", () => {
      const simpleAlloc = {
        venue: 1000,
        music: 500,
      };

      const entries = [
        { category: "venue", amount: 400 },
        { category: "venue", amount: 450 }, // total venue 850 -> warning
        { category: "music", amount: 600 }, // total music 600 -> over
      ];

      const statuses = getBudgetStatus(simpleAlloc, entries);
      expect(statuses.venue).toBe("warning");
      expect(statuses.music).toBe("over");
    });

    it("flags categories spent with no allocation as 'over'", () => {
      const allocation = { venue: 1000 };
      const spend = { venue: 500, unexpectedCategory: 200 };
      const statuses = getBudgetStatus(allocation, spend);
      expect(statuses.venue).toBe("ok");
      expect(statuses.unexpectedCategory).toBe("over");
    });
  });

  describe("trackSpend - Pure Side-Effect-Free Function", () => {
    it("performs incremental spend tracking immutably", () => {
      const initial = { venue: 500, catering: 300 };
      const updated = trackSpend(initial, "venue", 250);

      expect(updated).toEqual({ venue: 750, catering: 300 });
      // Verify initial was not mutated
      expect(initial.venue).toBe(500);

      const addedNewCategory = trackSpend(updated, "music", 150);
      expect(addedNewCategory.music).toBe(150);
    });

    it("generates comprehensive TrackSpendSummary with status, remaining, and percentages", () => {
      const allocation = allocateBudget({ eventType: "wedding", budget: 10000 });
      // venue: 2500, catering: 2500, photography: 1200
      const expenses = {
        venue: 1800, // ok
        catering: 2200, // warning
        photography: 1500, // over
      };

      const report = trackSpend(allocation, expenses);

      expect(report.totalAllocated).toBe(10000);
      expect(report.totalSpent).toBe(5500);
      expect(report.remainingBudget).toBe(4500);
      expect(report.isOverBudget).toBe(false);
      expect(report.overallStatus).toBe("ok");

      // Per-category metrics
      expect(report.categories.venue.status).toBe("ok");
      expect(report.categories.venue.spent).toBe(1800);
      expect(report.categories.venue.remaining).toBe(700);

      expect(report.categories.catering.status).toBe("warning");
      expect(report.categories.photography.status).toBe("over");
      expect(report.categories.photography.remaining).toBe(-300);

      // Direct property access
      expect(report.venue?.status).toBe("ok");
      expect(report.catering?.status).toBe("warning");

      // Iteration
      const items = [...report];
      expect(items.length).toBeGreaterThanOrEqual(7);
    });

    it("tracks spend from SpendEntry array with multiple charges to same category", () => {
      const allocation = {
        venue: 2000,
        catering: 1000,
      };

      const expenses = [
        { category: "venue", amount: 1000 },
        { category: "venue", amount: 1200 }, // sum 2200 -> over
        { category: "catering", amount: 200 }, // sum 200 -> ok
      ];

      const report = trackSpend(allocation, expenses);
      expect(report.totalSpent).toBe(2400);
      expect(report.categories.venue.spent).toBe(2200);
      expect(report.categories.venue.status).toBe("over");
      expect(report.categories.catering.spent).toBe(200);
      expect(report.categories.catering.status).toBe("ok");
    });

    it("handles unexpected spend categories in tracking report", () => {
      const allocation = { venue: 1000, totalBudget: 1000 };
      const expenses = { fireworks: 500 };
      const report = trackSpend(allocation, expenses);

      expect(report.categories.fireworks.spent).toBe(500);
      expect(report.categories.fireworks.status).toBe("over");
      expect(report.categories.fireworks.remaining).toBe(-500);

      const statusMap = getBudgetStatus(allocation, { venue: 500 });
      expect(statusMap.venue).toBe("ok");
    });

    it("correctly identifies overall over-budget condition", () => {
      const allocation = { venue: 1000 };
      const expenses = { venue: 1500 };
      const report = trackSpend(allocation, expenses);

      expect(report.isOverBudget).toBe(true);
      expect(report.overallStatus).toBe("over");
      expect(report.remainingBudget).toBe(-500);
    });
  });
});
