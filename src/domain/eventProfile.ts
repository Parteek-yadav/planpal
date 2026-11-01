import { z } from "zod";
import {
  EventTypeSchema,
  type EventType,
  ConstraintsSchema,
  type Constraints,
} from "./event/types";

export type { EventType, Constraints };

/**
 * Validates whether a date string is a structurally and calendar-valid ISO date (YYYY-MM-DD).
 * Correctly validates leap years (e.g., 2028-02-29 is valid, 2027-02-29 is invalid).
 */
export function isValidCalendarDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const dateObj = new Date(Date.UTC(year, month - 1, day));
  return (
    dateObj.getUTCFullYear() === year &&
    dateObj.getUTCMonth() === month - 1 &&
    dateObj.getUTCDate() === day
  );
}

/**
 * Checks whether an event date string (YYYY-MM-DD) is strictly in the future
 * relative to the reference date (defaults to current date).
 */
export function isDateInFuture(
  dateStr: string,
  referenceDate: Date = new Date(),
): boolean {
  if (!isValidCalendarDate(dateStr)) {
    return false;
  }
  const [year, month, day] = dateStr.split("-").map(Number);
  const eventUtcMidnight = Date.UTC(year, month - 1, day);

  const refYear = referenceDate.getUTCFullYear();
  const refMonth = referenceDate.getUTCMonth();
  const refDay = referenceDate.getUTCDate();
  const refUtcMidnight = Date.UTC(refYear, refMonth, refDay);

  // If the reference has time beyond midnight, compare exact time or compare midnight calendar day
  // Strict future: the calendar date must be strictly after the reference calendar date,
  // or the event timestamp strictly greater than reference timestamp.
  return eventUtcMidnight > refUtcMidnight;
}

/**
 * Factory to create EventProfileSchema with an optional reference date provider.
 * Pure and deterministic when referenceDate is provided.
 */
export function createEventProfileSchema(
  referenceDateOrGetter: Date | (() => Date) = () => new Date(),
) {
  const getReferenceDate = (): Date =>
    typeof referenceDateOrGetter === "function"
      ? referenceDateOrGetter()
      : referenceDateOrGetter;

  const baseSchema = z.object({
    id: z.string().trim().max(100).optional(),
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(100, "Title cannot exceed 100 characters"),
    eventType: EventTypeSchema,
    date: z
      .string()
      .trim()
      .min(1, "Event date is required")
      .refine(
        (val) => isValidCalendarDate(val),
        "Event date must be a valid calendar date in YYYY-MM-DD format",
      )
      .refine(
        (val) => isDateInFuture(val, getReferenceDate()),
        "Event date must be in the future",
      ),
    eventDate: z.string().trim().optional(),
    guestCount: z
      .number()
      .int("Guest count must be an integer")
      .min(1, "Guest count must be at least 1")
      .max(5000, "Guest count cannot exceed 5,000"),
    budget: z
      .number()
      .positive("Budget must be greater than 0")
      .max(100000000, "Budget cannot exceed $100,000,000"),
    totalBudget: z.number().positive().optional(),
    location: z
      .string()
      .trim()
      .max(120, "Location cannot exceed 120 characters")
      .optional(),
    theme: z.string().trim().max(80, "Theme cannot exceed 80 characters").optional(),
    description: z
      .string()
      .trim()
      .max(500, "Description cannot exceed 500 characters")
      .optional(),
    notes: z.string().trim().max(300, "Notes cannot exceed 300 characters").optional(),
    constraints: ConstraintsSchema.optional(),
  });

  return z.preprocess((raw) => {
    if (typeof raw !== "object" || raw === null) return raw;
    const copy = { ...(raw as Record<string, unknown>) };

    // Support date or eventDate inter-compatibility
    if (!copy.date && typeof copy.eventDate === "string") {
      copy.date = copy.eventDate;
    }
    if (!copy.eventDate && typeof copy.date === "string") {
      copy.eventDate = copy.date;
    }

    // Support budget or totalBudget inter-compatibility
    if (copy.budget === undefined && typeof copy.totalBudget === "number") {
      copy.budget = copy.totalBudget;
    }
    if (copy.totalBudget === undefined && typeof copy.budget === "number") {
      copy.totalBudget = copy.budget;
    }

    return copy;
  }, baseSchema);
}

/**
 * Standard default EventProfileSchema evaluating relative to current system time.
 */
export const EventProfileSchema = createEventProfileSchema();

export type EventProfile = z.infer<typeof EventProfileSchema>;

/**
 * Validates raw input into an EventProfile entity. Throws ZodError on validation failure.
 *
 * @param input - Raw event profile data
 * @param referenceDate - Optional reference date to evaluate "future" against
 * @returns Fully validated and typed EventProfile
 */
export function validateEventProfile(input: unknown, referenceDate?: Date): EventProfile {
  const schema = referenceDate
    ? createEventProfileSchema(referenceDate)
    : EventProfileSchema;
  return schema.parse(input);
}

/**
 * Safely validates raw input without throwing.
 *
 * @param input - Raw event profile data
 * @param referenceDate - Optional reference date
 * @returns SafeParseResult
 */
export function safeValidateEventProfile(input: unknown, referenceDate?: Date) {
  const schema = referenceDate
    ? createEventProfileSchema(referenceDate)
    : EventProfileSchema;
  return schema.safeParse(input);
}
