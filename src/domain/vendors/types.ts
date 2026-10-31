import { z } from "zod";

/**
 * Standard vendor categories.
 */
export const VendorCategorySchema = z.enum([
  "venue",
  "catering",
  "photography",
  "entertainment",
  "decor",
  "attire",
  "cake",
  "permits_insurance",
  "other"
]);
export type VendorCategory = z.infer<typeof VendorCategorySchema>;

/**
 * Vendor procurement lifecycle status.
 */
export const VendorStatusSchema = z.enum([
  "researching",
  "contacted",
  "proposal_received",
  "booked",
  "declined"
]);
export type VendorStatus = z.infer<typeof VendorStatusSchema>;

/**
 * Vendor checklist line item schema.
 */
export const VendorChecklistItemSchema = z.object({
  id: z.string().min(1),
  category: VendorCategorySchema,
  title: z.string().trim().min(1).max(100),
  vendorName: z.string().trim().max(100).default(""),
  status: VendorStatusSchema.default("researching"),
  estimatedCost: z.number().nonnegative().default(0),
  contactInfo: z.string().trim().max(150).default(""),
  contractSigned: z.boolean().default(false),
  notes: z.string().trim().max(300).default("")
});

export type VendorChecklistItem = z.infer<typeof VendorChecklistItemSchema>;

/**
 * Summary metrics of vendor checklist.
 */
export const VendorSummarySchema = z.object({
  totalVendors: z.number().int().nonnegative(),
  bookedCount: z.number().int().nonnegative(),
  pendingCount: z.number().int().nonnegative(),
  totalCommittedCost: z.number().nonnegative(),
  allContractsSigned: z.boolean()
});

export type VendorSummary = z.infer<typeof VendorSummarySchema>;
