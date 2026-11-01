import { z } from "zod";

/**
 * Supported event archetypes for PlanPal.
 */
export const EventTypeSchema = z.enum(["wedding", "birthday", "community"]);
export type EventType = z.infer<typeof EventTypeSchema>;

/**
 * Dietary constraints supported by event catering modules.
 */
export const DietaryConstraintSchema = z.enum([
  "vegan",
  "vegetarian",
  "gluten_free",
  "nut_free",
  "halal",
  "kosher",
  "dairy_free",
]);
export type DietaryConstraint = z.infer<typeof DietaryConstraintSchema>;

/**
 * Accessibility accommodation options for venues and ceremonies.
 */
export const AccessibilityConstraintSchema = z.enum([
  "wheelchair_accessible",
  "asl_interpreter",
  "captioning",
  "quiet_space",
  "service_animal_friendly",
]);
export type AccessibilityConstraint = z.infer<typeof AccessibilityConstraintSchema>;

/**
 * Comprehensive constraints schema for dietary, accessibility, and family needs.
 */
export const ConstraintsSchema = z.object({
  dietary: z.array(DietaryConstraintSchema).default([]),
  accessibility: z.array(AccessibilityConstraintSchema).default([]),
  kidFriendly: z.boolean().default(false),
  customNotes: z
    .string()
    .trim()
    .max(300, "Notes cannot exceed 300 characters")
    .optional(),
});
export type Constraints = z.infer<typeof ConstraintsSchema>;

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
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
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
  theme: z.string().trim().max(80, "Theme cannot exceed 80 characters").optional(),
  constraints: ConstraintsSchema.default({
    dietary: [],
    accessibility: [],
    kidFriendly: false,
  }),
});

export type EventPlanInput = z.infer<typeof EventPlanInputSchema>;

/**
 * Complete persisted or in-memory Event entity schema.
 */
export const EventPlanSchema = EventPlanInputSchema.extend({
  id: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type EventPlan = z.infer<typeof EventPlanSchema>;
