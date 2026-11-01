import { z } from "zod";
import { EventPlanInputSchema } from "@/domain/event/types";
import { BudgetSummarySchema } from "@/domain/budget/types";
import {
  ThemeIdeaSchema,
  ActivityIdeaSchema,
  MenuSuggestionSchema,
  DecorationConceptSchema,
} from "@/domain/ideas/types";

/**
 * Strict schema for AI planning requests.
 */
export const AiPlanRequestSchema = EventPlanInputSchema;
export type AiPlanRequest = z.infer<typeof AiPlanRequestSchema>;

/**
 * Timeline tip customized for the event.
 */
export const CustomTimelineTipSchema = z.object({
  title: z.string().min(1).max(100),
  tip: z.string().min(1).max(300),
  phase: z.string().min(1).max(50),
});

/**
 * Budget efficiency / saving tip suggested by AI.
 */
export const BudgetOptimizationTipSchema = z.object({
  category: z.string().min(1).max(60),
  savingStrategy: z.string().min(1).max(250),
  estimatedImpact: z.string().min(1).max(100),
});

/**
 * Risk and contingency mitigation strategy.
 */
export const ContingencyPlanSchema = z.object({
  riskScenario: z.string().min(1).max(120),
  mitigation: z.string().min(1).max(300),
  backupOption: z.string().min(1).max(300),
});

/**
 * Structured suggestion output schema validated with Zod.
 */
export const AiPlanSuggestionSchema = z.object({
  overview: z.string().min(1).max(400),
  themeIdeas: z.array(ThemeIdeaSchema).min(2).max(5),
  customTimelineTips: z.array(CustomTimelineTipSchema).min(2).max(6),
  budgetOptimizationTips: z.array(BudgetOptimizationTipSchema).min(2).max(6),
  contingencyPlan: ContingencyPlanSchema,
  activities: z.array(ActivityIdeaSchema).min(2).max(5).default([]),
  menus: z.array(MenuSuggestionSchema).min(2).max(6).default([]),
  decorations: z.array(DecorationConceptSchema).min(2).max(5).default([]),
});

export type AiPlanSuggestion = z.infer<typeof AiPlanSuggestionSchema>;

/**
 * Chat Assistant schemas for plan-grounded conversation.
 */
export const ChatMessageRoleSchema = z.enum(["user", "assistant", "system"]);

export const ChatMessageSchema = z.object({
  id: z.string().min(1),
  role: ChatMessageRoleSchema,
  content: z.string().trim().min(1).max(1000, "Question cannot exceed 1000 characters"),
  timestamp: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(20),
  currentProfile: EventPlanInputSchema,
  budgetSummary: BudgetSummarySchema,
  bookedVendorsCount: z.number().int().nonnegative().default(0),
  completedMilestonesCount: z.number().int().nonnegative().default(0),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const ChatResponseSchema = z.object({
  reply: z.string().min(1).max(1200),
  suggestedFollowUps: z.array(z.string().max(100)).max(3).default([]),
  groundedReferences: z.array(z.string().max(80)).max(5).default([]),
});
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
