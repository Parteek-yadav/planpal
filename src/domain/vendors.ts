import { z } from "zod";
import type { EventType } from "./event/types";

/**
 * Standard vendor procurement categories.
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
  "other",
]);
export type VendorCategory = z.infer<typeof VendorCategorySchema>;

/**
 * Status enum for vendor procurement lifecycle.
 */
export const VendorStatusSchema = z.enum([
  "researching",
  "contacted",
  "proposal_received",
  "booked",
  "declined",
]);
export type VendorStatus = z.infer<typeof VendorStatusSchema>;

/**
 * Zod schema for an individual vendor checklist line item.
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
  notes: z.string().trim().max(300).default(""),
});

export type VendorChecklistItem = z.infer<typeof VendorChecklistItemSchema>;

/**
 * Metrics summary schema for vendor procurement progress.
 */
export const VendorSummarySchema = z.object({
  totalVendors: z.number().int().nonnegative(),
  bookedCount: z.number().int().nonnegative(),
  pendingCount: z.number().int().nonnegative(),
  totalCommittedCost: z.number().nonnegative(),
  allContractsSigned: z.boolean(),
});

export type VendorSummary = z.infer<typeof VendorSummarySchema>;

interface VendorTemplate {
  readonly category: VendorCategory;
  readonly title: string;
}

export const WEDDING_VENDOR_TEMPLATES: readonly VendorTemplate[] = [
  { category: "venue", title: "Ceremony & Reception Venue" },
  { category: "catering", title: "Caterer & Bar Service" },
  { category: "photography", title: "Lead Photographer & Videographer" },
  { category: "entertainment", title: "DJ / Live Wedding Band" },
  { category: "decor", title: "Florist & Event Designer" },
  { category: "attire", title: "Bridal Gown & Groom Suit Tailoring" },
  { category: "cake", title: "Wedding Cake & Dessert Baker" },
  { category: "other", title: "Hair & Makeup Artist" },
];

export const BIRTHDAY_VENDOR_TEMPLATES: readonly VendorTemplate[] = [
  { category: "venue", title: "Party Hall / Venue Rental" },
  { category: "catering", title: "Food Catering / Pizza & Drink Bar" },
  { category: "cake", title: "Custom Birthday Cake Bakery" },
  { category: "entertainment", title: "Entertainer (DJ, Magician, or Face Painter)" },
  { category: "decor", title: "Balloon & Banner Stylist" },
  { category: "photography", title: "Event Photographer" },
];

export const COMMUNITY_VENDOR_TEMPLATES: readonly VendorTemplate[] = [
  {
    category: "permits_insurance",
    title: "Municipal Parks Department & Insurance Carrier",
  },
  { category: "entertainment", title: "Audio / Visual Equipment & Sound Technician" },
  { category: "catering", title: "Food Truck Operators & Refreshment Providers" },
  { category: "venue", title: "Canopy, Table & Chair Rental Supplier" },
  { category: "other", title: "Portable Restrooms & Sanitation Services" },
  { category: "other", title: "First Aid & Event Security Personnel" },
];

export const VENDOR_TEMPLATES_BY_EVENT: Record<EventType, readonly VendorTemplate[]> = {
  wedding: WEDDING_VENDOR_TEMPLATES,
  birthday: BIRTHDAY_VENDOR_TEMPLATES,
  community: COMMUNITY_VENDOR_TEMPLATES,
};

/**
 * Pure function: Generates default vendor procurement checklist for the given event archetype.
 *
 * @param eventType - Event archetype (wedding, birthday, community).
 * @returns Array of initialized VendorChecklistItem records.
 */
export function getDefaultVendorChecklist(eventType: EventType): VendorChecklistItem[] {
  const templates = VENDOR_TEMPLATES_BY_EVENT[eventType];
  if (!templates) {
    throw new Error(`Unsupported event type: ${eventType}`);
  }

  return templates.map((t, idx) => ({
    id: `vendor-${eventType}-${idx + 1}`,
    category: t.category,
    title: t.title,
    vendorName: "",
    status: "researching" as VendorStatus,
    estimatedCost: 0,
    contactInfo: "",
    contractSigned: false,
    notes: "",
  }));
}

/**
 * Alias for getDefaultVendorChecklist for backward compatibility.
 */
export const generateVendorChecklist = getDefaultVendorChecklist;

/**
 * Pure function: Immutably updates the status of a targeted vendor checklist item.
 *
 * @param checklist - Read-only array of vendor items.
 * @param id - Unique identifier of the vendor item.
 * @param newStatus - New VendorStatus enum value.
 * @returns New array with updated status.
 */
export function updateVendorStatus(
  checklist: readonly VendorChecklistItem[],
  id: string,
  newStatus: VendorStatus,
): VendorChecklistItem[] {
  // Validate status against schema
  VendorStatusSchema.parse(newStatus);

  return checklist.map((item) =>
    item.id === id ? { ...item, status: newStatus } : item,
  );
}

/**
 * Pure function: Immutably patches details of a targeted vendor item.
 *
 * @param checklist - Read-only array of vendor items.
 * @param update - Patch containing target id and field updates.
 * @returns New array with updated vendor details.
 */
export function updateVendorDetails(
  checklist: readonly VendorChecklistItem[],
  update: Partial<VendorChecklistItem> & { id: string },
): VendorChecklistItem[] {
  return checklist.map((item) => {
    if (item.id !== update.id) return item;
    return {
      ...item,
      ...update,
    };
  });
}

/**
 * Pure function: Aggregates vendor procurement progress metrics.
 *
 * @param checklist - Read-only array of vendor items.
 * @returns Consolidated VendorSummary metrics.
 */
export function getVendorChecklistSummary(
  checklist: readonly VendorChecklistItem[],
): VendorSummary {
  const totalVendors = checklist.length;
  const bookedCount = checklist.filter((item) => item.status === "booked").length;
  const pendingCount = totalVendors - bookedCount;
  const totalCommittedCost = checklist
    .filter((item) => item.status === "booked")
    .reduce((sum, item) => sum + (item.estimatedCost ?? 0), 0);
  const allContractsSigned =
    totalVendors > 0 &&
    checklist.every((item) => item.status !== "booked" || item.contractSigned);

  return {
    totalVendors,
    bookedCount,
    pendingCount,
    totalCommittedCost: Math.round(totalCommittedCost * 100) / 100,
    allContractsSigned,
  };
}
