import { ZodType, ZodError } from "zod";
import type { EventProfile } from "@/domain";
import { AiProvider, GeminiApiProvider, AiServiceError } from "./provider";
import { EVENT_ASSISTANT_SYSTEM_PROMPT } from "./sanitization";
import { buildIdeasPromptV1 } from "./prompts/ideas.v1";
import { buildBudgetPromptV1 } from "./prompts/budget.v1";
import { buildQaPromptV1 } from "./prompts/qa.v1";
import { LruCache, hashNormalizedProfile } from "./cache";
import {
  GeneratedIdeas,
  GeneratedIdeasSchema,
  BudgetAdvice,
  BudgetAdviceSchema,
  AnswerQuestionResult,
  AnswerQuestionSchema,
} from "./schemas";
import {
  AiPlanRequest,
  AiPlanRequestSchema,
  AiPlanSuggestion,
  AiPlanSuggestionSchema,
} from "./types";
import { PersonalizedIdeas, PersonalizedIdeasSchema } from "@/domain/ideas/types";
import { sanitizePii } from "../security/piiSanitizer";

/**
 * Global provider instance.
 */
let globalAiProvider: AiProvider | null = null;

/**
 * Returns the currently active AI provider, initializing default GeminiApiProvider if needed.
 */
export function getAiProvider(): AiProvider {
  if (!globalAiProvider) {
    globalAiProvider = new GeminiApiProvider();
  }
  return globalAiProvider;
}

/**
 * Overrides the active AI provider (primarily for unit testing and dependency injection).
 */
export function setAiProvider(provider: AiProvider): void {
  globalAiProvider = provider;
}

/**
 * Resets the active AI provider back to default.
 */
export function resetAiProvider(): void {
  globalAiProvider = null;
}

/**
 * Global LRU cache for idea generation, keyed by hash of normalized event profile.
 */
const ideasLruCache = new LruCache<string, GeneratedIdeas>(100);

export function getIdeasCache(): LruCache<string, GeneratedIdeas> {
  return ideasLruCache;
}

export function resetIdeasCache(): void {
  ideasLruCache.clear();
}

/**
 * Cleans markdown code fences (```json ... ```) wrapping JSON text from LLM outputs.
 */
export function extractJsonText(rawText: string): string {
  if (!rawText) return "";
  let text = rawText.trim();
  if (text.startsWith("```json")) {
    text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (text.startsWith("```")) {
    text = text.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  return text.trim();
}

export interface ServiceCallExecutionOptions {
  readonly provider?: AiProvider;
  readonly timeoutMs?: number;
  readonly maxOutputTokens?: number;
  readonly temperature?: number;
}

/**
 * Core structured AI execution routine:
 * - Calls the AI provider
 * - Strips fences and parses JSON
 * - Validates against strict Zod schema
 * - On validation failure (JSON syntax or Zod validation), retries exactly ONCE with corrective reminder
 * - If still invalid, throws typed AiServiceError (never passes unvalidated output to UI)
 * - NEVER logs prompt or response contents containing user data
 */
export async function executeStructuredAiCall<T>(params: {
  prompt: string;
  schema: ZodType<T>;
  systemInstruction?: string;
  options?: ServiceCallExecutionOptions;
}): Promise<T> {
  const provider = params.options?.provider || getAiProvider();
  const systemInstruction = params.systemInstruction || EVENT_ASSISTANT_SYSTEM_PROMPT;
  const timeoutMs = params.options?.timeoutMs ?? 10000;
  const maxOutputTokens = params.options?.maxOutputTokens ?? 2048;
  const temperature = params.options?.temperature ?? 0.2;

  let lastError: unknown;

  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      const activePrompt =
        attempt === 0
          ? params.prompt
          : `${params.prompt}\n\nIMPORTANT: Your previous output failed JSON validation. Please return strictly valid raw JSON with no markdown formatting matching the requested schema.`;

      const response = await provider.generateContent({
        prompt: activePrompt,
        systemInstruction,
        timeoutMs,
        maxOutputTokens,
        temperature,
        responseMimeType: "application/json",
      });

      const cleanedJson = extractJsonText(response.text);
      const parsedRaw: unknown = JSON.parse(cleanedJson);
      return params.schema.parse(parsedRaw);
    } catch (error) {
      lastError = error;

      // If it's a timeout error or abort, propagate immediately
      if (error instanceof AiServiceError && error.code === "TIMEOUT_ERROR") {
        throw error;
      }

      if (attempt === 0) {
        // Retry once on validation/JSON parsing failure
        continue;
      }
    }
  }

  // If validation failed after retry, throw typed AiServiceError
  if (lastError instanceof ZodError) {
    throw new AiServiceError(
      "AI response failed schema validation after retry",
      "VALIDATION_ERROR",
      lastError,
      1,
    );
  }

  if (lastError instanceof SyntaxError) {
    throw new AiServiceError(
      "AI response returned malformed JSON after retry",
      "VALIDATION_ERROR",
      lastError,
      1,
    );
  }

  if (lastError instanceof AiServiceError) {
    throw lastError;
  }

  throw new AiServiceError(
    "Failed to produce valid structured AI response",
    "VALIDATION_ERROR",
    lastError,
    1,
  );
}

/**
 * Generates creative event ideas (themes, activities, menus, decor) tailored to the profile.
 * Employs an in-memory LRU cache keyed by a SHA-256 hash of the normalized event profile.
 *
 * @param profile - Validated EventProfile or intake record
 * @param options - Execution options (timeout, mock provider, token caps)
 * @returns Validated GeneratedIdeas object
 */
export async function generateIdeas(
  profile: EventProfile | Record<string, unknown>,
  options?: ServiceCallExecutionOptions,
): Promise<GeneratedIdeas> {
  const profileHash = hashNormalizedProfile(profile);

  // Check LRU cache first
  const cached = ideasLruCache.get(profileHash);
  if (cached) {
    return cached;
  }

  const prompt = buildIdeasPromptV1(profile);
  const result = await executeStructuredAiCall({
    prompt,
    schema: GeneratedIdeasSchema,
    options,
  });

  // Store in LRU cache
  ideasLruCache.set(profileHash, result);
  return result;
}

/**
 * Refines budget allocation advice based on profile and actual/allocated spend metrics.
 *
 * @param profile - Validated EventProfile or intake record
 * @param spend - Category spend tracking data or record of spent amounts
 * @param options - Execution options
 * @returns Validated BudgetAdvice object
 */
export async function refineBudgetAdvice(
  profile: EventProfile | Record<string, unknown>,
  spend: Record<string, unknown>,
  options?: ServiceCallExecutionOptions,
): Promise<BudgetAdvice> {
  const prompt = buildBudgetPromptV1(profile, spend);
  return executeStructuredAiCall({
    prompt,
    schema: BudgetAdviceSchema,
    options,
  });
}

/**
 * Answers questions grounded in the active event plan, guarding against prompt injection.
 *
 * @param profile - Validated EventProfile or intake record
 * @param plan - Active plan context (milestones, vendors, run-of-show, budget)
 * @param question - User question (sanitized and length-capped)
 * @param options - Execution options
 * @returns Validated AnswerQuestionResult object
 */
export async function answerQuestion(
  profile: EventProfile | Record<string, unknown>,
  plan: unknown,
  question: string,
  options?: ServiceCallExecutionOptions,
): Promise<AnswerQuestionResult> {
  const prompt = buildQaPromptV1(profile, plan, question);
  return executeStructuredAiCall({
    prompt,
    schema: AnswerQuestionSchema,
    options,
  });
}

/**
 * Generates deterministic fallback event recommendations based on event parameters and constraints.
 */
function generateDeterministicSuggestions(request: AiPlanRequest): unknown {
  const { eventType, title, location, totalBudget, guestCount, theme, constraints } =
    request;
  const perGuestBudget = Math.round(totalBudget / guestCount);
  const dietaryStr =
    constraints.dietary.length > 0 ? ` (${constraints.dietary.join(", ")})` : "";
  const kidNote = constraints.kidFriendly
    ? " Includes dedicated family and child entertainment."
    : "";

  return {
    overview: `A bespoke ${eventType} plan for "${title}" in ${location}, budgeted at $${totalBudget.toLocaleString()} ($${perGuestBudget}/guest) for ${guestCount} guests.${dietaryStr}${kidNote} Designed to balance ceremony elegance with reception enjoyment.`,
    themeIdeas: [
      {
        title: theme ? `${theme} Luxe` : "Modern Botanical Elegance",
        description:
          "Neutral linen textures paired with soft eucalyptus greens and warm champagne accents.",
        colorPalette: ["#2D4739", "#E8DFD8", "#CBB89D", "#FAF7F2"],
      },
      {
        title: "Sunlit Tuscan Terrace",
        description:
          "Terracotta pots, olive leaf runners, natural wood farm tables, and ambient bistro string lights.",
        colorPalette: ["#A0522D", "#6B8E23", "#D2B48C", "#FFF8DC"],
      },
    ],
    customTimelineTips: [
      {
        title: "Golden Hour Buffer",
        tip: "Block out 30 minutes 45 minutes before sunset for couple portraits without rushing guests.",
        phase: "Day-of Schedule",
      },
      {
        title: "Sound & Lighting Check",
        tip: "Ensure DJ conducts wireless mic acoustic checks at the venue 90 minutes before ceremony start.",
        phase: "Vendor Booking",
      },
    ],
    budgetOptimizationTips: [
      {
        category: "Floral & Decor",
        savingStrategy:
          "Repurpose ceremony arbor florals onto the bridal party head table for the reception.",
        estimatedImpact: "Saves $400 - $800",
      },
      {
        category: "Stationery",
        savingStrategy:
          "Opt for digital RSVP tracking alongside elegant printed ceremony invitations.",
        estimatedImpact: "Saves $200 - $450",
      },
    ],
    contingencyPlan: {
      riskScenario: "Inclement weather during outdoor ceremony or cocktail hour",
      mitigation:
        "Secure an all-weather transparent marquee tent backup reservation with 72-hour notice clause.",
      backupOption:
        "Transition cocktail hour indoors into the venue gallery hallway with pre-positioned auxiliary bars.",
    },
    activities: [
      {
        name: "Lawn Games & Acoustic Duo",
        description: "Live acoustic guitar and violin duo playing during cocktail hour.",
        targetAudience: "All Guests",
        durationMinutes: 60,
      },
      {
        name: "Audio Guestbook Station",
        description:
          "Vintage rotary phone recording spoken voicemail blessings from loved ones.",
        targetAudience: "All Guests",
        durationMinutes: 180,
      },
    ],
    menus: [
      {
        course: "Appetizer Station",
        dishName: "Artisanal Canapés & Bruschetta",
        description:
          "Charred heirloom tomatoes with basil glaze and plant-based ricotta.",
        dietaryTags:
          constraints.dietary.length > 0 ? constraints.dietary : ["vegetarian"],
      },
      {
        course: "Plated Entrée",
        dishName: "Herb-Crusted Medallions or Truffle Risotto",
        description: "Seasonal root vegetables with balsamic reduction.",
        dietaryTags:
          constraints.dietary.length > 0 ? constraints.dietary : ["gluten_free"],
      },
    ],
    decorations: [
      {
        focalArea: "Welcome Entry Archway",
        materials: "Birch arch frame with cascading white wisteria and fairy lights.",
        diyBudgetFriendlyTip: "Rent frame locally and source seasonal foliage in bulk.",
      },
      {
        focalArea: "Reception Centerpieces",
        materials: "Tiered glass hurricane candleholders with floating tea lights.",
        diyBudgetFriendlyTip:
          "Buy pillar candles in bulk packs and use venue-included mirrors.",
      },
    ],
  };
}

/**
 * Backward compatibility: Generates event plan suggestions.
 */
export async function generateEventPlanSuggestions(
  rawInput: unknown,
): Promise<AiPlanSuggestion> {
  const parsedInput = AiPlanRequestSchema.parse(rawInput);

  const sanitizedInput: AiPlanRequest = {
    ...parsedInput,
    title: sanitizePii(parsedInput.title),
    location: sanitizePii(parsedInput.location),
    theme: parsedInput.theme ? sanitizePii(parsedInput.theme) : undefined,
    constraints: {
      ...parsedInput.constraints,
      customNotes: parsedInput.constraints.customNotes
        ? sanitizePii(parsedInput.constraints.customNotes)
        : undefined,
    },
  };

  try {
    const ideas = await generateIdeas(sanitizedInput);
    return AiPlanSuggestionSchema.parse({
      overview: ideas.eventSummary,
      themeIdeas: ideas.themes,
      customTimelineTips: [
        {
          title: "Golden Hour Buffer",
          tip: "Block out 30 minutes 45 minutes before sunset for golden hour portraits.",
          phase: "Day-of Schedule",
        },
        {
          title: "Acoustic Check",
          tip: "Ensure DJ conducts wireless mic checks at the venue 90 minutes before start.",
          phase: "Vendor Booking",
        },
      ],
      budgetOptimizationTips: [
        {
          category: "Floral & Decor",
          savingStrategy: "Repurpose ceremony florals onto reception tables.",
          estimatedImpact: "Saves $400 - $800",
        },
        {
          category: "Stationery",
          savingStrategy: "Use digital RSVP tracking alongside printed invitations.",
          estimatedImpact: "Saves $200 - $450",
        },
      ],
      contingencyPlan: {
        riskScenario: "Inclement weather during outdoor ceremony or reception",
        mitigation:
          "Secure all-weather marquee tent backup reservation with 72-hour notice.",
        backupOption: "Transition indoors into the venue gallery hallway.",
      },
      activities: ideas.activities,
      menus: ideas.menus,
      decorations: ideas.decorations,
    });
  } catch {
    const fallback = generateDeterministicSuggestions(sanitizedInput);
    return AiPlanSuggestionSchema.parse(fallback);
  }
}

/**
 * Backward compatibility: Generates personalized ideas for event intake API.
 */
export async function generatePersonalizedIdeas(
  rawInput: unknown,
): Promise<PersonalizedIdeas> {
  try {
    const ideas = await generateIdeas(rawInput as Record<string, unknown>);
    return PersonalizedIdeasSchema.parse({
      eventSummary: ideas.eventSummary,
      themes: ideas.themes,
      activities: ideas.activities,
      menus: ideas.menus,
      decorations: ideas.decorations,
    });
  } catch {
    const plan = await generateEventPlanSuggestions(rawInput);
    return PersonalizedIdeasSchema.parse({
      eventSummary: plan.overview,
      themes: plan.themeIdeas,
      activities: plan.activities,
      menus: plan.menus,
      decorations: plan.decorations,
    });
  }
}
