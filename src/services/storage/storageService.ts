import { z } from "zod";
import {
  EventTypeSchema,
  ConstraintsSchema,
  BudgetItemSchema,
  TimelineMilestoneSchema,
  RunOfShowItemSchema,
  VendorChecklistItemSchema,
  EventType,
  Constraints,
  BudgetItem,
  TimelineMilestone,
  RunOfShowItem,
  VendorChecklistItem
} from "@/domain";
import { AiPlanSuggestion } from "@/services/ai/types";

export const STORAGE_KEY = "planpal_stored_event_state";
export const CURRENT_STORAGE_VERSION = 2;

/**
 * Full domain event plan state schema for runtime validation.
 */
export const ActiveEventStateSchema = z.object({
  eventType: EventTypeSchema,
  title: z.string().trim().min(1).max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  guestCount: z.number().int().min(1).max(5000),
  totalBudget: z.number().positive("Budget must be positive"),
  location: z.string().trim().min(1).max(150),
  theme: z.string().trim().max(100).optional(),
  constraints: ConstraintsSchema,
  budgetItems: z.array(BudgetItemSchema),
  milestones: z.array(TimelineMilestoneSchema),
  runOfShow: z.array(RunOfShowItemSchema),
  vendors: z.array(VendorChecklistItemSchema),
  aiSuggestions: z.record(z.string(), z.unknown())
});

export interface ActiveEventState {
  readonly eventType: EventType;
  readonly title: string;
  readonly date: string;
  readonly guestCount: number;
  readonly totalBudget: number;
  readonly location: string;
  readonly theme?: string;
  readonly constraints: Constraints;
  readonly budgetItems: readonly BudgetItem[];
  readonly milestones: readonly TimelineMilestone[];
  readonly runOfShow: readonly RunOfShowItem[];
  readonly vendors: readonly VendorChecklistItem[];
  readonly aiSuggestions: AiPlanSuggestion;
}

/**
 * Storage Version 1 Schema (Legacy format without updatedAt, looser constraints).
 */
export const StoredPlanV1Schema = z.object({
  version: z.literal(1),
  payload: z.object({
    eventType: EventTypeSchema,
    title: z.string().min(1),
    date: z.string(),
    guestCount: z.number(),
    totalBudget: z.number(),
    location: z.string(),
    theme: z.string().optional(),
    constraints: z
      .object({
        dietary: z.array(z.string()).default([]),
        accessibility: z.array(z.string()).default([]),
        kidFriendly: z.boolean().default(false),
        customNotes: z.string().optional()
      })
      .passthrough(),
    budgetItems: z.array(z.record(z.string(), z.unknown())),
    milestones: z.array(z.record(z.string(), z.unknown())),
    runOfShow: z.array(z.record(z.string(), z.unknown())),
    vendors: z.array(z.record(z.string(), z.unknown())),
    aiSuggestions: z.record(z.string(), z.unknown())
  })
});

export type StoredPlanV1 = z.infer<typeof StoredPlanV1Schema>;

/**
 * Storage Version 2 Schema (Current validated format).
 */
export const StoredPlanV2Schema = z.object({
  version: z.literal(2),
  updatedAt: z.string(),
  payload: ActiveEventStateSchema
});

export interface StoredPlanV2 {
  version: 2;
  updatedAt: string;
  payload: ActiveEventState;
}

/**
 * Safely migrates raw stored JSON data across schema versions.
 * Returns valid ActiveEventState or null if data is corrupt or tampered with.
 *
 * @param rawData - Parsed JSON object from storage.
 * @returns Validated ActiveEventState or null on failure.
 */
export function migratePlan(rawData: unknown): ActiveEventState | null {
  if (!rawData || typeof rawData !== "object") {
    return null;
  }

  const container = rawData as { version?: unknown };

  // Version 2 (Current)
  if (container.version === 2) {
    const parseResult = StoredPlanV2Schema.safeParse(rawData);
    if (parseResult.success) {
      return parseResult.data.payload as unknown as ActiveEventState;
    }
    return null;
  }

  // Version 1 (Legacy Migration Path)
  if (container.version === 1) {
    const parseV1Result = StoredPlanV1Schema.safeParse(rawData);
    if (!parseV1Result.success) {
      return null;
    }

    try {
      const v1 = parseV1Result.data.payload;

      // Migrate V1 payload to V2 requirements
      const migratedBudgetItems = v1.budgetItems.map((item, idx) => ({
        id: typeof item.id === "string" ? item.id : `b-migrated-${idx}`,
        category: (item.category as BudgetItem["category"]) || "other",
        name: typeof item.name === "string" ? item.name : `Budget Item ${idx + 1}`,
        allocatedAmount: Math.max(0, Number(item.allocatedAmount) || 0),
        actualAmount: Math.max(0, Number(item.actualAmount) || 0),
        isPaid: Boolean(item.isPaid),
        notes: typeof item.notes === "string" ? item.notes : undefined
      }));

      const migratedVendors = v1.vendors.map((vendor, idx) => ({
        id: typeof vendor.id === "string" ? vendor.id : `v-migrated-${idx}`,
        category: (vendor.category as VendorChecklistItem["category"]) || "other",
        title: typeof vendor.title === "string" ? vendor.title : `Vendor ${idx + 1}`,
        vendorName: typeof vendor.vendorName === "string" ? vendor.vendorName : "",
        status: (vendor.status as VendorChecklistItem["status"]) || "researching",
        estimatedCost: Math.max(0, Number(vendor.estimatedCost) || 0),
        contactInfo: typeof vendor.contactInfo === "string" ? vendor.contactInfo : "",
        contractSigned: Boolean(vendor.contractSigned),
        notes: typeof vendor.notes === "string" ? vendor.notes : ""
      }));

      const migratedCandidate = {
        eventType: v1.eventType as EventType,
        title: v1.title,
        date: v1.date,
        guestCount: Math.max(1, Math.min(5000, Number(v1.guestCount) || 50)),
        totalBudget: Math.max(1, Number(v1.totalBudget) || 1000),
        location: v1.location,
        theme: v1.theme,
        constraints: {
          dietary: (v1.constraints.dietary || []) as Constraints["dietary"],
          accessibility: (v1.constraints.accessibility || []) as Constraints["accessibility"],
          kidFriendly: Boolean(v1.constraints.kidFriendly),
          customNotes: v1.constraints.customNotes
        },
        budgetItems: migratedBudgetItems,
        milestones: v1.milestones as unknown as TimelineMilestone[],
        runOfShow: v1.runOfShow as unknown as RunOfShowItem[],
        vendors: migratedVendors,
        aiSuggestions: v1.aiSuggestions as unknown as AiPlanSuggestion
      };

      const validatedV2 = ActiveEventStateSchema.safeParse(migratedCandidate);
      if (validatedV2.success) {
        return validatedV2.data as unknown as ActiveEventState;
      }
      return null;
    } catch {
      return null;
    }
  }

  // Unknown or missing version
  return null;
}

/**
 * Loads stored event plan from localStorage with Zod validation and safe error handling.
 *
 * @param fallbackState - Default state returned if storage is empty, corrupted, or unavailable.
 * @param storage - Storage interface (defaults to window.localStorage).
 * @returns Validated ActiveEventState.
 */
export function loadStoredPlan(
  fallbackState: ActiveEventState,
  storage?: Storage
): ActiveEventState {
  try {
    const targetStorage =
      storage || (typeof window !== "undefined" ? window.localStorage : undefined);

    if (!targetStorage) {
      return fallbackState;
    }

    const raw = targetStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return fallbackState;
    }

    const parsedJson = JSON.parse(raw);
    const migratedState = migratePlan(parsedJson);

    if (migratedState) {
      // Re-persist in latest V2 schema if migrated from older version
      if (parsedJson?.version !== CURRENT_STORAGE_VERSION) {
        saveStoredPlan(migratedState, targetStorage);
      }
      return migratedState;
    }

    // Tampered or corrupted data: fallback safely without crashing
    return fallbackState;
  } catch {
    return fallbackState;
  }
}

/**
 * Persists an event plan to localStorage wrapped in versioned envelope.
 *
 * @param plan - Event plan to store.
 * @param storage - Storage interface (defaults to window.localStorage).
 * @returns Boolean indicating whether save succeeded.
 */
export function saveStoredPlan(
  plan: ActiveEventState,
  storage?: Storage
): boolean {
  try {
    const targetStorage =
      storage || (typeof window !== "undefined" ? window.localStorage : undefined);

    if (!targetStorage) {
      return false;
    }

    const validation = ActiveEventStateSchema.safeParse(plan);
    if (!validation.success) {
      return false;
    }

    const envelope: StoredPlanV2 = {
      version: CURRENT_STORAGE_VERSION,
      updatedAt: new Date().toISOString(),
      payload: plan
    };

    targetStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

/**
 * Clears stored event plan data from localStorage.
 *
 * @param storage - Storage interface (defaults to window.localStorage).
 * @returns Boolean indicating whether clearing succeeded.
 */
export function clearStoredPlan(storage?: Storage): boolean {
  try {
    const targetStorage =
      storage || (typeof window !== "undefined" ? window.localStorage : undefined);

    if (!targetStorage) {
      return false;
    }

    targetStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * Exports the event plan as a downloadable JSON file and returns formatted string.
 *
 * @param plan - Active event plan state.
 * @param filename - Optional custom download file name.
 * @returns Formatted JSON string.
 */
export function exportPlanToJson(
  plan: ActiveEventState,
  filename?: string
): string {
  const exportPayload = {
    planPalExportVersion: "2.0.0",
    exportedAt: new Date().toISOString(),
    event: plan
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    try {
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const safeTitle = plan.title.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
      anchor.href = url;
      anchor.download = filename || `planpal-${safeTitle}-${plan.date}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch {
      // Ignore in non-DOM or sandbox environments
    }
  }

  return jsonString;
}

/**
 * Triggers browser print-friendly view for the active event plan.
 */
export function triggerPrintPlan(): void {
  if (typeof window !== "undefined" && typeof window.print === "function") {
    window.print();
  }
}
