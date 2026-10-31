import { z } from "zod";
import { EventTypeSchema } from "@/domain/event/types";

/**
 * Strict schema for AI planning requests.
 */
export const AiPlanRequestSchema = z.object({
  eventType: EventTypeSchema,
  title: z.string().trim().min(2).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guestCount: z.number().int().positive().max(10000),
  totalBudget: z.number().positive().max(10000000),
  location: z.string().trim().min(2).max(120),
  theme: z.string().trim().max(100).optional(),
  dietaryPreferences: z.array(z.string().trim()).default([]),
  specialNotes: z.string().trim().max(500).optional()
});

export type AiPlanRequest = z.infer<typeof AiPlanRequestSchema>;

/**
 * Single theme concept idea suggested by AI.
 */
export const ThemeIdeaSchema = z.object({
  title: z.string().min(1).max(80),
  description: z.string().min(1).max(300),
  colorPalette: z.array(z.string().min(1)).min(3).max(6)
});

/**
 * Timeline tip customized for the event.
 */
export const CustomTimelineTipSchema = z.object({
  title: z.string().min(1).max(100),
  tip: z.string().min(1).max(300),
  phase: z.string().min(1).max(50)
});

/**
 * Budget efficiency / saving tip suggested by AI.
 */
export const BudgetOptimizationTipSchema = z.object({
  category: z.string().min(1).max(60),
  savingStrategy: z.string().min(1).max(250),
  estimatedImpact: z.string().min(1).max(100)
});

/**
 * Risk and contingency mitigation strategy.
 */
export const ContingencyPlanSchema = z.object({
  riskScenario: z.string().min(1).max(120),
  mitigation: z.string().min(1).max(300),
  backupOption: z.string().min(1).max(300)
});

/**
 * Structured suggestion output schema validated with Zod.
 */
export const AiPlanSuggestionSchema = z.object({
  overview: z.string().min(1).max(400),
  themeIdeas: z.array(ThemeIdeaSchema).min(2).max(5),
  customTimelineTips: z.array(CustomTimelineTipSchema).min(2).max(6),
  budgetOptimizationTips: z.array(BudgetOptimizationTipSchema).min(2).max(6),
  contingencyPlan: ContingencyPlanSchema
});

export type AiPlanSuggestion = z.infer<typeof AiPlanSuggestionSchema>;
