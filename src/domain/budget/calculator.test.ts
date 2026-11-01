import { describe, it, expect } from "vitest";
import {
  calculateDefaultBudgetAllocation,
  summarizeBudget,
  updateBudgetItem,
  calculateCategorySubtotals,
} from "./calculator";
import { BudgetItem } from "./types";

describe("Budget Calculator Domain Functions", () => {
  describe("calculateDefaultBudgetAllocation", () => {
    it("allocates correct proportions for wedding archetype", () => {
      const items = calculateDefaultBudgetAllocation("wedding", 50000);
      const venueItem = items.find((i) => i.category === "venue_catering");
      expect(venueItem).toBeDefined();
      expect(venueItem?.allocatedAmount).toBe(22500); // 45% of 50,000

      const photographyItem = items.find((i) => i.category === "photography_video");
      expect(photographyItem?.allocatedAmount).toBe(6000); // 12% of 50,000

      const totalAllocated = items.reduce((s, i) => s + i.allocatedAmount, 0);
      expect(totalAllocated).toBe(50000);
    });

    it("allocates correct proportions for birthday archetype", () => {
      const items = calculateDefaultBudgetAllocation("birthday", 2000);
      const foodItem = items.find((i) => i.category === "venue_catering");
      expect(foodItem?.allocatedAmount).toBe(1000); // 50% of 2,000

      const cakeItem = items.find((i) => i.category === "cake_dessert");
      expect(cakeItem?.allocatedAmount).toBe(200); // 10% of 2,000
    });

    it("allocates correct proportions for community archetype", () => {
      const items = calculateDefaultBudgetAllocation("community", 10000);
      const permitsItem = items.find((i) => i.category === "permits_insurance");
      expect(permitsItem?.allocatedAmount).toBe(3500); // 35% of 10,000
    });
  });

  describe("summarizeBudget", () => {
    const mockItems: BudgetItem[] = [
      {
        id: "b1",
        category: "venue_catering",
        name: "Banquet Hall",
        allocatedAmount: 10000,
        actualAmount: 9500,
        isPaid: true,
      },
      {
        id: "b2",
        category: "photography_video",
        name: "Photographer",
        allocatedAmount: 3000,
        actualAmount: 3200,
        isPaid: false,
      },
    ];

    it("calculates totals, remaining budget, and under-budget status correctly", () => {
      const summary = summarizeBudget(15000, mockItems);
      expect(summary.totalBudget).toBe(15000);
      expect(summary.totalAllocated).toBe(13000);
      expect(summary.totalSpent).toBe(12700);
      expect(summary.remainingBudget).toBe(2300);
      expect(summary.unallocatedBudget).toBe(2000);
      expect(summary.isOverBudget).toBe(false);
    });

    it("detects over-budget condition and calculates positive variance percentage", () => {
      const overspentItems: BudgetItem[] = [
        {
          id: "b1",
          category: "venue_catering",
          name: "Luxury Estate",
          allocatedAmount: 10000,
          actualAmount: 12000,
          isPaid: true,
        },
      ];

      const summary = summarizeBudget(10000, overspentItems);
      expect(summary.isOverBudget).toBe(true);
      expect(summary.remainingBudget).toBe(-2000);
      expect(summary.variancePercentage).toBe(20);
    });
  });

  describe("updateBudgetItem", () => {
    const initialItems: BudgetItem[] = [
      {
        id: "b1",
        category: "cake_dessert",
        name: "Custom Birthday Cake",
        allocatedAmount: 300,
        actualAmount: 0,
        isPaid: false,
      },
    ];

    it("updates item values immutably", () => {
      const updated = updateBudgetItem(initialItems, {
        id: "b1",
        actualAmount: 325,
        isPaid: true,
        notes: "Deposit paid",
      });

      expect(updated).not.toBe(initialItems);
      expect(updated[0].actualAmount).toBe(325);
      expect(updated[0].isPaid).toBe(true);
      expect(updated[0].notes).toBe("Deposit paid");
      expect(initialItems[0].actualAmount).toBe(0);
    });

    it("leaves other items unchanged", () => {
      const multiItems: BudgetItem[] = [
        {
          id: "b1",
          category: "decor_floral",
          name: "Flowers",
          allocatedAmount: 500,
          actualAmount: 400,
          isPaid: true,
        },
        {
          id: "b2",
          category: "music_entertainment",
          name: "Band",
          allocatedAmount: 1200,
          actualAmount: 1200,
          isPaid: true,
        },
      ];

      const updated = updateBudgetItem(multiItems, { id: "b1", actualAmount: 450 });
      expect(updated[0].actualAmount).toBe(450);
      expect(updated[1].actualAmount).toBe(1200);
    });
  });

  describe("calculateCategorySubtotals", () => {
    it("groups allocations and spending by category", () => {
      const items: BudgetItem[] = [
        {
          id: "1",
          category: "venue_catering",
          name: "Venue",
          allocatedAmount: 5000,
          actualAmount: 4800,
          isPaid: true,
        },
        {
          id: "2",
          category: "venue_catering",
          name: "Catering",
          allocatedAmount: 3000,
          actualAmount: 3200,
          isPaid: true,
        },
        {
          id: "3",
          category: "decor_floral",
          name: "Balloons",
          allocatedAmount: 400,
          actualAmount: 380,
          isPaid: true,
        },
      ];

      const subtotals = calculateCategorySubtotals(items);
      expect(subtotals.venue_catering.allocated).toBe(8000);
      expect(subtotals.venue_catering.spent).toBe(8000);
      expect(subtotals.decor_floral.allocated).toBe(400);
      expect(subtotals.decor_floral.spent).toBe(380);
      expect(subtotals.contingency.allocated).toBe(0);
    });
  });
});
