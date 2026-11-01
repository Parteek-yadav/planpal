import { EventType } from "./event/types";
import { EventProfile } from "./eventProfile";

/**
 * Status of spend relative to allocated budget for a category or total event.
 */
export type BudgetStatus = "ok" | "warning" | "over";

/**
 * Single category budget allocation detail.
 */
export interface CategoryAllocation {
  readonly category: string;
  readonly percentage: number; // e.g. 25 for 25%
  readonly ratio: number; // e.g. 0.25
  readonly amount: number; // exact currency amount
  readonly allocatedAmount: number; // alias for amount
}

/**
 * Allocation configuration rule per category.
 */
export interface CategoryRule {
  readonly category: string;
  readonly percentage: number;
}

/**
 * Canonical percentage allocations by event type.
 * Weddings: venue, catering, photography, attire, decor, music, misc
 * Birthdays and community events get their own distinct category sets.
 * Every set sums to exactly 100%.
 */
export const EVENT_BUDGET_RULES: Record<EventType, readonly CategoryRule[]> = {
  wedding: [
    { category: "venue", percentage: 25 },
    { category: "catering", percentage: 25 },
    { category: "photography", percentage: 12 },
    { category: "attire", percentage: 10 },
    { category: "decor", percentage: 10 },
    { category: "music", percentage: 8 },
    { category: "misc", percentage: 10 },
  ],
  birthday: [
    { category: "venue", percentage: 30 },
    { category: "catering", percentage: 25 },
    { category: "entertainment", percentage: 15 },
    { category: "decor", percentage: 12 },
    { category: "cake", percentage: 10 },
    { category: "photography", percentage: 5 },
    { category: "misc", percentage: 3 },
  ],
  community: [
    { category: "permits", percentage: 25 },
    { category: "venue", percentage: 25 },
    { category: "catering", percentage: 20 },
    { category: "entertainment", percentage: 15 },
    { category: "marketing", percentage: 10 },
    { category: "misc", percentage: 5 },
  ],
};

/**
 * Complete result of allocating budget across categories.
 */
export interface BudgetAllocation {
  readonly totalBudget: number;
  readonly percentages: Record<string, number>;
  readonly allocations: Record<string, CategoryAllocation>;
  readonly categories: Record<string, CategoryAllocation>;
  readonly items: CategoryAllocation[];
  [Symbol.iterator](): Iterator<CategoryAllocation>;
  readonly venue?: CategoryAllocation;
  readonly catering?: CategoryAllocation;
  readonly photography?: CategoryAllocation;
  readonly attire?: CategoryAllocation;
  readonly decor?: CategoryAllocation;
  readonly music?: CategoryAllocation;
  readonly cake?: CategoryAllocation;
  readonly entertainment?: CategoryAllocation;
  readonly permits?: CategoryAllocation;
  readonly marketing?: CategoryAllocation;
  readonly misc?: CategoryAllocation;
  readonly [category: string]:
    | CategoryAllocation
    | number
    | Record<string, number>
    | Record<string, CategoryAllocation>
    | CategoryAllocation[]
    | (() => Iterator<CategoryAllocation>)
    | undefined;
}

/**
 * Spend tracking entry input.
 */
export interface SpendEntry {
  readonly category: string;
  readonly amount: number;
}

/**
 * Category spend analysis detail.
 */
export interface CategorySpendReport {
  readonly category: string;
  readonly allocated: number;
  readonly spent: number;
  readonly remaining: number;
  readonly percentageSpent: number;
  readonly status: BudgetStatus;
}

/**
 * Comprehensive spend tracking summary result.
 */
export interface TrackSpendSummary {
  readonly totalAllocated: number;
  readonly totalSpent: number;
  readonly remainingBudget: number;
  readonly isOverBudget: boolean;
  readonly overallStatus: BudgetStatus;
  readonly categories: Record<string, CategorySpendReport>;
  readonly items: CategorySpendReport[];
  [Symbol.iterator](): Iterator<CategorySpendReport>;
  readonly venue?: CategorySpendReport;
  readonly catering?: CategorySpendReport;
  readonly photography?: CategorySpendReport;
  readonly attire?: CategorySpendReport;
  readonly decor?: CategorySpendReport;
  readonly music?: CategorySpendReport;
  readonly cake?: CategorySpendReport;
  readonly entertainment?: CategorySpendReport;
  readonly permits?: CategorySpendReport;
  readonly marketing?: CategorySpendReport;
  readonly misc?: CategorySpendReport;
  readonly [category: string]:
    | CategorySpendReport
    | number
    | boolean
    | BudgetStatus
    | Record<string, CategorySpendReport>
    | CategorySpendReport[]
    | (() => Iterator<CategorySpendReport>)
    | undefined;
}

/**
 * Pure Largest Remainder (Hare-Niemeyer) allocation algorithm.
 * Guarantees that the sum of allocated amounts in cents equals total cents EXACTLY,
 * eliminating all rounding discrepancies while maintaining exact 2-decimal precision.
 */
function distributeBudgetExact(
  totalBudget: number,
  rules: readonly CategoryRule[],
): CategoryAllocation[] {
  // Compute total in cents (integer)
  const totalCents = Math.round(totalBudget * 100);

  const rawAllocations = rules.map((rule, idx) => {
    const exactCents = (totalCents * rule.percentage) / 100;
    const floorCents = Math.floor(exactCents);
    const remainder = exactCents - floorCents;
    return {
      category: rule.category,
      percentage: rule.percentage,
      ratio: rule.percentage / 100,
      floorCents,
      remainder,
      index: idx,
    };
  });

  const allocatedFloorCents = rawAllocations.reduce((sum, r) => sum + r.floorCents, 0);
  const remainingCentsToDistribute = totalCents - allocatedFloorCents;

  // Sort by remainder descending, tie-breaking by higher percentage, then original index
  const sortedIndices = [...rawAllocations.keys()].sort((a, b) => {
    const diff = rawAllocations[b].remainder - rawAllocations[a].remainder;
    if (Math.abs(diff) > 1e-9) return diff;
    return rawAllocations[b].percentage - rawAllocations[a].percentage;
  });

  const bonusCentIndices = new Set(
    sortedIndices.slice(0, Math.max(0, remainingCentsToDistribute)),
  );

  return rawAllocations.map((item, idx) => {
    const cents = item.floorCents + (bonusCentIndices.has(idx) ? 1 : 0);
    const amount = cents / 100;
    return {
      category: item.category,
      percentage: item.percentage,
      ratio: item.ratio,
      amount,
      allocatedAmount: amount,
    };
  });
}

/**
 * Pure function: Allocates total budget into category percentages and exact currency amounts.
 *
 * @param profile - Validated EventProfile or object with eventType and budget
 * @returns Fully typed BudgetAllocation containing category percentages and amounts summing exactly to total
 */
export function allocateBudget(
  profile:
    | EventProfile
    | {
        readonly eventType: EventType;
        readonly budget?: number;
        readonly totalBudget?: number;
      },
): BudgetAllocation {
  const budgetValue = profile.budget ?? (profile as { totalBudget?: number }).totalBudget;

  if (budgetValue === undefined || budgetValue === null || Number.isNaN(budgetValue)) {
    throw new TypeError("Budget must be a valid number");
  }

  if (budgetValue <= 0) {
    throw new RangeError("Budget must be greater than 0");
  }

  const rules = EVENT_BUDGET_RULES[profile.eventType];
  if (!rules) {
    throw new Error(`Unsupported event type: ${profile.eventType}`);
  }

  const items = distributeBudgetExact(budgetValue, rules);

  const percentages: Record<string, number> = {};
  const allocationsMap: Record<string, CategoryAllocation> = {};

  for (const item of items) {
    percentages[item.category] = item.percentage;
    allocationsMap[item.category] = item;
  }

  const result: BudgetAllocation = {
    totalBudget: Math.round(budgetValue * 100) / 100,
    percentages,
    allocations: allocationsMap,
    categories: allocationsMap,
    items,
    ...allocationsMap,
    [Symbol.iterator]: function* () {
      yield* items;
    },
  };

  return result;
}

/**
 * Computes single budget status ("ok", "warning", or "over") given allocated and spent amounts.
 * Default warning threshold is 0.8 (80% of allocated budget).
 */
export function calculateBudgetStatus(
  allocated: number,
  spent: number,
  warningThreshold: number = 0.8,
): BudgetStatus {
  if (spent < 0) {
    return "ok";
  }

  if (allocated <= 0) {
    return spent > 0 ? "over" : "ok";
  }

  const ratio = spent / allocated;

  // Floating point tolerance check
  if (spent - allocated > 1e-6) {
    return "over";
  }

  if (ratio >= warningThreshold - 1e-9) {
    return "warning";
  }

  return "ok";
}

/**
 * Overload 1: getBudgetStatus for a single category (numbers).
 */
export function getBudgetStatus(
  allocated: number,
  spent: number,
  warningThreshold?: number,
): BudgetStatus;

/**
 * Overload 2: getBudgetStatus per category across a budget allocation or category map.
 */
export function getBudgetStatus(
  allocations:
    | BudgetAllocation
    | Record<string, number | { amount?: number; allocatedAmount?: number }>,
  spent: Record<string, number> | readonly SpendEntry[],
  warningThreshold?: number,
): Record<string, BudgetStatus>;

/**
 * Evaluates budget health status returning "ok" | "warning" | "over" per category.
 */
export function getBudgetStatus(
  allocationsOrAllocated:
    | number
    | BudgetAllocation
    | Record<string, number | { amount?: number; allocatedAmount?: number }>,
  spentOrSpentMap: number | Record<string, number> | readonly SpendEntry[],
  warningThreshold: number = 0.8,
): BudgetStatus | Record<string, BudgetStatus> {
  // Case 1: Single category numbers
  if (typeof allocationsOrAllocated === "number" && typeof spentOrSpentMap === "number") {
    return calculateBudgetStatus(
      allocationsOrAllocated,
      spentOrSpentMap,
      warningThreshold,
    );
  }

  // Case 2: Multi-category evaluation
  const spendMap: Record<string, number> = {};
  if (Array.isArray(spentOrSpentMap)) {
    for (const entry of spentOrSpentMap) {
      spendMap[entry.category] = (spendMap[entry.category] ?? 0) + entry.amount;
    }
  } else if (typeof spentOrSpentMap === "object" && spentOrSpentMap !== null) {
    Object.assign(spendMap, spentOrSpentMap);
  }

  const result: Record<string, BudgetStatus> = {};

  const allocObj = allocationsOrAllocated as Record<
    string,
    number | { amount?: number; allocatedAmount?: number }
  >;

  // If passed a BudgetAllocation object with .allocations, use .allocations
  const categoriesSource =
    "allocations" in allocObj && typeof allocObj.allocations === "object"
      ? (allocObj.allocations as Record<
          string,
          { amount?: number; allocatedAmount?: number }
        >)
      : allocObj;

  for (const [category, val] of Object.entries(categoriesSource)) {
    // Skip non-category metadata properties on BudgetAllocation
    if (
      ["totalBudget", "percentages", "allocations", "categories", "items"].includes(
        category,
      )
    ) {
      continue;
    }

    let allocatedNum = 0;
    if (typeof val === "number") {
      allocatedNum = val;
    } else if (typeof val === "object" && val !== null) {
      allocatedNum = val.amount ?? val.allocatedAmount ?? 0;
    }

    const spentNum = spendMap[category] ?? 0;
    result[category] = calculateBudgetStatus(allocatedNum, spentNum, warningThreshold);
  }

  // Also check any spend category that wasn't in allocations
  for (const [category, spentNum] of Object.entries(spendMap)) {
    if (!(category in result)) {
      result[category] = calculateBudgetStatus(0, spentNum, warningThreshold);
    }
  }

  return result;
}

/**
 * Overload 1: Incremental spend tracking adding amount to category in spend record.
 */
export function trackSpend(
  currentSpend: Record<string, number>,
  category: string,
  amount: number,
): Record<string, number>;

/**
 * Overload 2: Comprehensive spend tracking against budget allocations.
 */
export function trackSpend(
  allocation:
    | BudgetAllocation
    | Record<string, number | { amount?: number; allocatedAmount?: number }>,
  expenses: Record<string, number> | readonly SpendEntry[],
  options?: { warningThreshold?: number },
): TrackSpendSummary;

/**
 * Pure function: Tracks spend per category and across the entire budget.
 */
export function trackSpend(
  firstArg:
    | Record<string, number>
    | BudgetAllocation
    | Record<string, number | { amount?: number; allocatedAmount?: number }>,
  secondArg: string | Record<string, number> | readonly SpendEntry[],
  thirdArg?: number | { warningThreshold?: number },
): Record<string, number> | TrackSpendSummary {
  // Case 1: Incremental spend tracking: trackSpend(spendMap, "venue", 500)
  if (typeof secondArg === "string" && typeof thirdArg === "number") {
    const current = firstArg as Record<string, number>;
    return {
      ...current,
      [secondArg]: Math.round(((current[secondArg] ?? 0) + thirdArg) * 100) / 100,
    };
  }

  // Case 2: Comprehensive spend tracking against allocations
  const warningThreshold =
    typeof thirdArg === "object" && thirdArg?.warningThreshold !== undefined
      ? thirdArg.warningThreshold
      : 0.8;

  const spendMap: Record<string, number> = {};
  if (Array.isArray(secondArg)) {
    for (const entry of secondArg) {
      spendMap[entry.category] =
        Math.round(((spendMap[entry.category] ?? 0) + entry.amount) * 100) / 100;
    }
  } else if (typeof secondArg === "object" && secondArg !== null) {
    for (const [k, v] of Object.entries(secondArg)) {
      spendMap[k] = Math.round(Number(v) * 100) / 100;
    }
  }

  const allocObj = firstArg as Record<
    string,
    number | { amount?: number; allocatedAmount?: number }
  >;
  const categoriesSource =
    "allocations" in allocObj && typeof allocObj.allocations === "object"
      ? (allocObj.allocations as Record<
          string,
          { amount?: number; allocatedAmount?: number }
        >)
      : allocObj;

  const categoryReports: Record<string, CategorySpendReport> = {};
  const items: CategorySpendReport[] = [];

  let totalAllocated = 0;
  let totalSpent = 0;

  for (const [category, val] of Object.entries(categoriesSource)) {
    if (
      ["totalBudget", "percentages", "allocations", "categories", "items"].includes(
        category,
      )
    ) {
      continue;
    }

    let allocatedNum = 0;
    if (typeof val === "number") {
      allocatedNum = val;
    } else if (typeof val === "object" && val !== null) {
      allocatedNum = val.amount ?? val.allocatedAmount ?? 0;
    }

    const spentNum = spendMap[category] ?? 0;
    const remaining = Math.round((allocatedNum - spentNum) * 100) / 100;
    const percentageSpent =
      allocatedNum > 0
        ? Math.round((spentNum / allocatedNum) * 10000) / 100
        : spentNum > 0
          ? 100
          : 0;
    const status = calculateBudgetStatus(allocatedNum, spentNum, warningThreshold);

    const report: CategorySpendReport = {
      category,
      allocated: allocatedNum,
      spent: spentNum,
      remaining,
      percentageSpent,
      status,
    };

    categoryReports[category] = report;
    items.push(report);

    totalAllocated += allocatedNum;
    totalSpent += spentNum;
  }

  // Handle any spend for categories not in the allocation
  for (const [category, spentNum] of Object.entries(spendMap)) {
    if (!(category in categoryReports)) {
      const remaining = -spentNum;
      const status: BudgetStatus = spentNum > 0 ? "over" : "ok";
      const report: CategorySpendReport = {
        category,
        allocated: 0,
        spent: spentNum,
        remaining,
        percentageSpent: spentNum > 0 ? 100 : 0,
        status,
      };
      categoryReports[category] = report;
      items.push(report);
      totalSpent += spentNum;
    }
  }

  totalAllocated = Math.round(totalAllocated * 100) / 100;
  totalSpent = Math.round(totalSpent * 100) / 100;
  const remainingBudget = Math.round((totalAllocated - totalSpent) * 100) / 100;
  const isOverBudget = totalSpent > totalAllocated;
  const overallStatus = calculateBudgetStatus(
    totalAllocated,
    totalSpent,
    warningThreshold,
  );

  const summary: TrackSpendSummary = {
    totalAllocated,
    totalSpent,
    remainingBudget,
    isOverBudget,
    overallStatus,
    categories: categoryReports,
    items,
    ...categoryReports,
    [Symbol.iterator]: function* () {
      yield* items;
    },
  };

  return summary;
}
