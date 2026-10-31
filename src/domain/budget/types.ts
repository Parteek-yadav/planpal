import { z } from "zod";

/**
 * Budget line item category names.
 */
export const BudgetCategorySchema = z.enum([
  "venue_catering",
  "photography_video",
  "attire_beauty",
  "music_entertainment",
  "decor_floral",
  "cake_dessert",
  "permits_insurance",
  "marketing_supplies",
  "contingency",
  "other"
]);
export type BudgetCategory = z.infer<typeof BudgetCategorySchema>;

/**
 * Schema for an individual budget line item.
 */
export const BudgetItemSchema = z.object({
  id: z.string().min(1),
  category: BudgetCategorySchema,
  name: z.string().trim().min(1).max(100),
  allocatedAmount: z.number().nonnegative("Allocated amount cannot be negative"),
  actualAmount: z.number().nonnegative("Actual amount cannot be negative"),
  isPaid: z.boolean().default(false),
  notes: z.string().trim().max(300).optional()
});

export type BudgetItem = z.infer<typeof BudgetItemSchema>;

/**
 * Summary calculations for total event budget.
 */
export const BudgetSummarySchema = z.object({
  totalBudget: z.number().nonnegative(),
  totalAllocated: z.number().nonnegative(),
  totalSpent: z.number().nonnegative(),
  remainingBudget: z.number(),
  unallocatedBudget: z.number(),
  isOverBudget: z.boolean(),
  variancePercentage: z.number()
});

export type BudgetSummary = z.infer<typeof BudgetSummarySchema>;

/**
 * Update payload for a single budget item.
 */
export const BudgetItemUpdateSchema = BudgetItemSchema.partial().required({
  id: true
});
export type BudgetItemUpdate = z.infer<typeof BudgetItemUpdateSchema>;
