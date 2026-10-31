import { z } from "zod";

/**
 * Event planning lifecycle phases.
 */
export const TimelinePhaseSchema = z.enum([
  "concept_budget",
  "vendor_booking",
  "detailed_coordination",
  "final_countdown",
  "day_of"
]);
export type TimelinePhase = z.infer<typeof TimelinePhaseSchema>;

/**
 * Priority of milestone tasks.
 */
export const MilestonePrioritySchema = z.enum(["high", "medium", "low"]);
export type MilestonePriority = z.infer<typeof MilestonePrioritySchema>;

/**
 * Schema for an event milestone item scheduled relative to event date.
 */
export const TimelineMilestoneSchema = z.object({
  id: z.string().min(1),
  phase: TimelinePhaseSchema,
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(300),
  targetDaysBeforeEvent: z.number().int().nonnegative(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isCompleted: z.boolean().default(false),
  priority: MilestonePrioritySchema
});

export type TimelineMilestone = z.infer<typeof TimelineMilestoneSchema>;

/**
 * Schema for minute-by-minute day-of run-of-show items.
 */
export const RunOfShowItemSchema = z.object({
  id: z.string().min(1),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be HH:MM format"),
  activity: z.string().trim().min(1).max(150),
  leadPerson: z.string().trim().max(80),
  location: z.string().trim().max(100),
  isCompleted: z.boolean().default(false),
  notes: z.string().trim().max(250).optional()
});

export type RunOfShowItem = z.infer<typeof RunOfShowItemSchema>;
