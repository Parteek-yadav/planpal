import { z } from "zod";

/**
 * Supported event archetypes for PlanPal.
 */
export const EventTypeSchema = z.enum(["wedding", "birthday", "community"]);
export type EventType = z.infer<typeof EventTypeSchema>;

/**
 * Zod schema for validating user event intake input.
 * Strips unexpected fields and enforces strict boundaries.
 */
export const EventPlanInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters long")
    .max(100, "Title cannot exceed 100 characters"),
  eventType: EventTypeSchema,
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  guestCount: z
    .number()
    .int("Guest count must be an integer")
    .positive("Guest count must be at least 1")
    .max(10000, "Guest count cannot exceed 10,000"),
  totalBudget: z
    .number()
    .positive("Total budget must be greater than 0")
    .max(10000000, "Budget cannot exceed $10,000,000"),
  location: z
    .string()
    .trim()
    .min(2, "Location must be at least 2 characters")
    .max(120, "Location cannot exceed 120 characters"),
  theme: z.string().trim().max(100, "Theme cannot exceed 100 characters").optional(),
  dietaryPreferences: z.array(z.string().trim().max(50)).default([]),
  specialNotes: z
    .string()
    .trim()
    .max(500, "Special notes cannot exceed 500 characters")
    .optional()
});

export type EventPlanInput = z.infer<typeof EventPlanInputSchema>;

/**
 * Complete persisted or in-memory Event entity schema.
 */
export const EventPlanSchema = EventPlanInputSchema.extend({
  id: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type EventPlan = z.infer<typeof EventPlanSchema>;
