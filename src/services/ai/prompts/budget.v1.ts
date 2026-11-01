import { sanitizeAndCap, wrapUserData } from "../sanitization";
import type { EventProfile } from "@/domain";

/**
 * Version 1 Prompt Template for refining budget allocation advice and cost optimizations.
 */
export const BUDGET_PROMPT_VERSION = "v1.0";

export function buildBudgetPromptV1(
  profile: EventProfile | Record<string, unknown>,
  spend: Record<string, unknown>,
): string {
  const p = profile as Record<string, unknown>;
  const eventType = sanitizeAndCap(p.eventType, 30);
  const title = sanitizeAndCap(p.title, 100);
  const totalBudget =
    typeof p.budget === "number" ? p.budget : (p.totalBudget as number) || 0;
  const guestCount = typeof p.guestCount === "number" ? p.guestCount : 100;

  // Format spend breakdown cleanly
  let spendData = "";
  if (
    "categories" in spend &&
    typeof spend.categories === "object" &&
    spend.categories !== null
  ) {
    const categories = spend.categories as Record<
      string,
      { allocated?: number; spent?: number; status?: string }
    >;
    spendData = Object.entries(categories)
      .map(
        ([cat, info]) =>
          `${cat}: allocated $${info.allocated ?? 0}, spent $${info.spent ?? 0}, status ${info.status ?? "ok"}`,
      )
      .join("\n");
  } else {
    spendData = Object.entries(spend)
      .map(([k, v]) => `${k}: $${v}`)
      .join("\n");
  }

  const userDataContent = `Event Archetype: ${eventType}
Title: ${title}
Total Budget: $${totalBudget}
Guest Count: ${guestCount}
Category Breakdown:
${spendData}`;

  return `Analyze the event budget and actual spend data below to formulate actionable optimization and saving advice.

${wrapUserData(userDataContent)}

Return pure JSON matching this exact schema:
{
  "summary": string,
  "categoryRecommendations": [
    {
      "category": string,
      "status": "ok" | "warning" | "over",
      "advice": string,
      "potentialSavings": string (optional)
    }
  ],
  "savingOpportunities": [
    {
      "area": string,
      "strategy": string,
      "estimatedSavings": string
    }
  ],
  "riskAlerts": [string]
}`;
}
