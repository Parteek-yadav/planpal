import { z } from "zod";

/**
 * Structured schema for generated event planning ideas.
 */
export const GeneratedIdeasSchema = z.object({
  eventSummary: z.string().min(1).max(500),
  themes: z
    .array(
      z.object({
        title: z.string().min(1).max(100),
        description: z.string().min(1).max(300),
        colorPalette: z.array(z.string().min(1)).min(2).max(6),
      }),
    )
    .min(1)
    .max(6),
  activities: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().min(1).max(300),
        targetAudience: z.string().min(1).max(80),
        durationMinutes: z.number().int().positive(),
      }),
    )
    .min(1)
    .max(6),
  menus: z
    .array(
      z.object({
        course: z.string().min(1).max(80),
        dishName: z.string().min(1).max(100),
        description: z.string().min(1).max(250),
        dietaryTags: z.array(z.string()).default([]),
      }),
    )
    .min(1)
    .max(6),
  decorations: z
    .array(
      z.object({
        focalArea: z.string().min(1).max(80),
        materials: z.string().min(1).max(200),
        diyBudgetFriendlyTip: z.string().min(1).max(250),
      }),
    )
    .min(1)
    .max(6),
});

export type GeneratedIdeas = z.infer<typeof GeneratedIdeasSchema>;

/**
 * Structured schema for refined budget advice.
 */
export const BudgetAdviceSchema = z.object({
  summary: z.string().min(1).max(500),
  categoryRecommendations: z
    .array(
      z.object({
        category: z.string().min(1).max(80),
        status: z.enum(["ok", "warning", "over"]),
        advice: z.string().min(1).max(300),
        potentialSavings: z.string().max(100).optional(),
      }),
    )
    .min(1),
  savingOpportunities: z
    .array(
      z.object({
        area: z.string().min(1).max(100),
        strategy: z.string().min(1).max(300),
        estimatedSavings: z.string().min(1).max(100),
      }),
    )
    .min(1)
    .max(6),
  riskAlerts: z.array(z.string().min(1).max(250)).default([]),
});

export type BudgetAdvice = z.infer<typeof BudgetAdviceSchema>;

/**
 * Structured schema for plan-grounded Q&A answers.
 */
export const AnswerQuestionSchema = z.object({
  answer: z.string().min(1).max(1500),
  isOffTopic: z.boolean().default(false),
  suggestedFollowUps: z.array(z.string().max(120)).max(4).default([]),
  groundedReferences: z.array(z.string().max(100)).max(5).default([]),
});

export type AnswerQuestionResult = z.infer<typeof AnswerQuestionSchema>;
