import { EventType } from "../event/types";
import { BudgetCategory, BudgetItem, BudgetSummary, BudgetItemUpdate } from "./types";

/**
 * Standard percentage allocations per event type.
 * Each entry maps a category and user-facing name to its target budget ratio.
 */
interface AllocationRule {
  readonly category: BudgetCategory;
  readonly name: string;
  readonly ratio: number;
}

const WEDDING_ALLOCATIONS: readonly AllocationRule[] = [
  { category: "venue_catering", name: "Venue & Catering Reception", ratio: 0.45 },
  { category: "photography_video", name: "Photography & Videography", ratio: 0.12 },
  { category: "attire_beauty", name: "Attire, Rings & Hair/Makeup", ratio: 0.1 },
  { category: "music_entertainment", name: "DJ / Live Music & Sound", ratio: 0.1 },
  { category: "decor_floral", name: "Floral Arrangements & Decor", ratio: 0.1 },
  { category: "contingency", name: "Contingency / Emergency Reserve", ratio: 0.1 },
  { category: "other", name: "Stationery, Favors & Officiant", ratio: 0.03 },
];

const BIRTHDAY_ALLOCATIONS: readonly AllocationRule[] = [
  { category: "venue_catering", name: "Venue, Food & Beverages", ratio: 0.5 },
  { category: "music_entertainment", name: "Entertainment & Activities", ratio: 0.18 },
  { category: "decor_floral", name: "Theme Decor & Party Favors", ratio: 0.12 },
  { category: "cake_dessert", name: "Custom Cake & Dessert Bar", ratio: 0.1 },
  { category: "photography_video", name: "Event Photography", ratio: 0.05 },
  { category: "contingency", name: "Contingency Reserve", ratio: 0.05 },
];

const COMMUNITY_ALLOCATIONS: readonly AllocationRule[] = [
  {
    category: "permits_insurance",
    name: "Park / Venue Permits & Insurance",
    ratio: 0.35,
  },
  { category: "venue_catering", name: "Community Refreshments & Water", ratio: 0.25 },
  { category: "music_entertainment", name: "Audio System & Performers", ratio: 0.2 },
  { category: "marketing_supplies", name: "Signage, Banners & Flyers", ratio: 0.1 },
  { category: "contingency", name: "Contingency Reserve", ratio: 0.1 },
];

/**
 * Generates an initial list of budget line items allocated based on event archetype.
 *
 * @param eventType - Archetype of the event (wedding, birthday, or community).
 * @param totalBudget - Total planned financial budget.
 * @returns Array of initialized BudgetItem records.
 */
export function calculateDefaultBudgetAllocation(
  eventType: EventType,
  totalBudget: number,
): BudgetItem[] {
  const rules =
    eventType === "wedding"
      ? WEDDING_ALLOCATIONS
      : eventType === "birthday"
        ? BIRTHDAY_ALLOCATIONS
        : COMMUNITY_ALLOCATIONS;

  return rules.map((rule, idx) => {
    const allocated = Math.round(totalBudget * rule.ratio * 100) / 100;
    return {
      id: `budget-${rule.category}-${idx + 1}`,
      category: rule.category,
      name: rule.name,
      allocatedAmount: allocated,
      actualAmount: 0,
      isPaid: false,
      notes: "",
    };
  });
}

/**
 * Aggregates all line items to compute remaining funds, spent totals, and over-budget status.
 *
 * @param totalBudget - Total planned financial budget.
 * @param items - Read-only array of BudgetItem line items.
 * @returns Consolidated BudgetSummary metrics.
 */
export function summarizeBudget(
  totalBudget: number,
  items: readonly BudgetItem[],
): BudgetSummary {
  const totalAllocated = items.reduce((sum, item) => sum + item.allocatedAmount, 0);
  const totalSpent = items.reduce((sum, item) => sum + item.actualAmount, 0);
  const remainingBudget = Math.round((totalBudget - totalSpent) * 100) / 100;
  const unallocatedBudget = Math.round((totalBudget - totalAllocated) * 100) / 100;
  const isOverBudget = totalSpent > totalBudget;

  const variancePercentage =
    totalBudget > 0
      ? Math.round(((totalSpent - totalBudget) / totalBudget) * 10000) / 100
      : 0;

  return {
    totalBudget,
    totalAllocated: Math.round(totalAllocated * 100) / 100,
    totalSpent: Math.round(totalSpent * 100) / 100,
    remainingBudget,
    unallocatedBudget,
    isOverBudget,
    variancePercentage,
  };
}

/**
 * Immutably updates an existing budget item in the collection.
 *
 * @param items - Current budget items list.
 * @param update - Patch containing target ID and updated values.
 * @returns New array containing updated item.
 */
export function updateBudgetItem(
  items: readonly BudgetItem[],
  update: BudgetItemUpdate,
): BudgetItem[] {
  return items.map((item) => {
    if (item.id !== update.id) return item;
    return {
      ...item,
      ...update,
      allocatedAmount:
        update.allocatedAmount !== undefined
          ? update.allocatedAmount
          : item.allocatedAmount,
      actualAmount:
        update.actualAmount !== undefined ? update.actualAmount : item.actualAmount,
    };
  });
}

/**
 * Computes subtotals of allocated and spent amounts grouped by category.
 *
 * @param items - Current budget items list.
 * @returns Record of category totals.
 */
export function calculateCategorySubtotals(
  items: readonly BudgetItem[],
): Record<BudgetCategory, { allocated: number; spent: number }> {
  const result: Record<BudgetCategory, { allocated: number; spent: number }> = {
    venue_catering: { allocated: 0, spent: 0 },
    photography_video: { allocated: 0, spent: 0 },
    attire_beauty: { allocated: 0, spent: 0 },
    music_entertainment: { allocated: 0, spent: 0 },
    decor_floral: { allocated: 0, spent: 0 },
    cake_dessert: { allocated: 0, spent: 0 },
    permits_insurance: { allocated: 0, spent: 0 },
    marketing_supplies: { allocated: 0, spent: 0 },
    contingency: { allocated: 0, spent: 0 },
    other: { allocated: 0, spent: 0 },
  };

  for (const item of items) {
    if (result[item.category]) {
      result[item.category].allocated += item.allocatedAmount;
      result[item.category].spent += item.actualAmount;
    }
  }

  return result;
}
