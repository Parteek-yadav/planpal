import { EventType } from "../event/types";
import {
  VendorCategory,
  VendorChecklistItem,
  VendorStatus,
  VendorSummary
} from "./types";

interface VendorTemplate {
  readonly category: VendorCategory;
  readonly title: string;
}

const WEDDING_VENDOR_TEMPLATES: readonly VendorTemplate[] = [
  { category: "venue", title: "Ceremony & Reception Venue" },
  { category: "catering", title: "Caterer & Bar Service" },
  { category: "photography", title: "Lead Photographer & Videographer" },
  { category: "entertainment", title: "DJ / Live Wedding Band" },
  { category: "decor", title: "Florist & Event Designer" },
  { category: "attire", title: "Bridal Gown & Groom Suit Tailoring" },
  { category: "cake", title: "Wedding Cake & Dessert Baker" },
  { category: "other", title: "Hair & Makeup Artist" }
];

const BIRTHDAY_VENDOR_TEMPLATES: readonly VendorTemplate[] = [
  { category: "venue", title: "Party Hall / Venue Rental" },
  { category: "catering", title: "Food Catering / Pizza & Drink Bar" },
  { category: "cake", title: "Custom Birthday Cake Bakery" },
  { category: "entertainment", title: "Entertainer (DJ, Magician, or Face Painter)" },
  { category: "decor", title: "Balloon & Banner Stylist" },
  { category: "photography", title: "Event Photographer" }
];

const COMMUNITY_VENDOR_TEMPLATES: readonly VendorTemplate[] = [
  { category: "permits_insurance", title: "Municipal Parks Department & Insurance Carrier" },
  { category: "entertainment", title: "Audio / Visual Equipment & Sound Technician" },
  { category: "catering", title: "Food Truck Operators & Refreshment Providers" },
  { category: "venue", title: "Canopy, Table & Chair Rental Supplier" },
  { category: "other", title: "Portable Restrooms & Sanitation Services" },
  { category: "other", title: "First Aid & Event Security Personnel" }
];

/**
 * Generates an initial vendor procurement checklist for the given event archetype.
 *
 * @param eventType - Event archetype (wedding, birthday, community).
 * @returns Array of initialized VendorChecklistItem records.
 */
export function generateVendorChecklist(eventType: EventType): VendorChecklistItem[] {
  const templates =
    eventType === "wedding"
      ? WEDDING_VENDOR_TEMPLATES
      : eventType === "birthday"
        ? BIRTHDAY_VENDOR_TEMPLATES
        : COMMUNITY_VENDOR_TEMPLATES;

  return templates.map((t, idx) => ({
    id: `vendor-${eventType}-${idx + 1}`,
    category: t.category,
    title: t.title,
    vendorName: "",
    status: "researching",
    estimatedCost: 0,
    contactInfo: "",
    contractSigned: false,
    notes: ""
  }));
}

/**
 * Immutably updates the status of a targeted vendor checklist item.
 *
 * @param checklist - Read-only array of vendor items.
 * @param id - Unique identifier of the vendor item.
 * @param newStatus - New VendorStatus.
 * @returns New array with updated status.
 */
export function updateVendorStatus(
  checklist: readonly VendorChecklistItem[],
  id: string,
  newStatus: VendorStatus
): VendorChecklistItem[] {
  return checklist.map((item) =>
    item.id === id ? { ...item, status: newStatus } : item
  );
}

/**
 * Immutably patches details of a targeted vendor item.
 *
 * @param checklist - Read-only array of vendor items.
 * @param update - Patch containing target id and field updates.
 * @returns New array with updated vendor details.
 */
export function updateVendorDetails(
  checklist: readonly VendorChecklistItem[],
  update: Partial<VendorChecklistItem> & { id: string }
): VendorChecklistItem[] {
  return checklist.map((item) => {
    if (item.id !== update.id) return item;
    return {
      ...item,
      ...update
    };
  });
}

/**
 * Aggregates vendor procurement progress metrics.
 *
 * @param checklist - Read-only array of vendor items.
 * @returns Consolidated VendorSummary metrics.
 */
export function getVendorChecklistSummary(
  checklist: readonly VendorChecklistItem[]
): VendorSummary {
  const totalVendors = checklist.length;
  const bookedCount = checklist.filter((item) => item.status === "booked").length;
  const pendingCount = totalVendors - bookedCount;
  const totalCommittedCost = checklist
    .filter((item) => item.status === "booked")
    .reduce((sum, item) => sum + item.estimatedCost, 0);
  const allContractsSigned =
    totalVendors > 0 &&
    checklist.every((item) => item.status !== "booked" || item.contractSigned);

  return {
    totalVendors,
    bookedCount,
    pendingCount,
    totalCommittedCost: Math.round(totalCommittedCost * 100) / 100,
    allContractsSigned
  };
}
