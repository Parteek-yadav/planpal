import { sanitizeAndCap, wrapUserData } from "../sanitization";
import type { EventProfile } from "@/domain";

/**
 * Version 1 Prompt Template for generating personalized event ideas.
 * Kept concise to minimize token usage while guaranteeing structured JSON outputs.
 */
export const IDEAS_PROMPT_VERSION = "v1.0";

export function buildIdeasPromptV1(
  profile: EventProfile | Record<string, unknown>,
): string {
  const p = profile as Record<string, unknown>;
  const eventType = sanitizeAndCap(p.eventType, 30);
  const title = sanitizeAndCap(p.title, 100);
  const date = sanitizeAndCap(p.date || p.eventDate, 15);
  const guestCount = typeof p.guestCount === "number" ? p.guestCount : 100;
  const budget =
    typeof p.budget === "number" ? p.budget : (p.totalBudget as number) || 10000;
  const location = sanitizeAndCap(p.location, 100);
  const theme = sanitizeAndCap(p.theme, 80);
  const description = sanitizeAndCap(p.description, 200);

  const constraintsObj = (p.constraints as Record<string, unknown>) || {};
  const dietary = Array.isArray(constraintsObj.dietary)
    ? constraintsObj.dietary.join(", ")
    : "none";
  const accessibility = Array.isArray(constraintsObj.accessibility)
    ? constraintsObj.accessibility.join(", ")
    : "standard";
  const kidFriendly = constraintsObj.kidFriendly ? "yes" : "no";

  const userDataContent = `Event Type: ${eventType}
Title: ${title}
Date: ${date}
Guests: ${guestCount}
Budget: $${budget}
Location: ${location || "unspecified"}
Theme: ${theme || "flexible"}
Description: ${description || "none"}
Dietary: ${dietary}
Accessibility: ${accessibility}
Kid-Friendly: ${kidFriendly}`;

  return `Generate creative, cohesive event planning ideas for the event data below.

${wrapUserData(userDataContent)}

Return pure JSON matching this exact schema:
{
  "eventSummary": string,
  "themes": [{"title": string, "description": string, "colorPalette": [string]}],
  "activities": [{"name": string, "description": string, "targetAudience": string, "durationMinutes": number}],
  "menus": [{"course": string, "dishName": string, "description": string, "dietaryTags": [string]}],
  "decorations": [{"focalArea": string, "materials": string, "diyBudgetFriendlyTip": string}]
}`;
}
