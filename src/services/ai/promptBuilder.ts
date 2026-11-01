import { sanitizePii } from "../security/piiSanitizer";
import { escapeDelimiters } from "./sanitization";
import { ChatRequest, ChatMessage } from "./types";

/**
 * Serializes the user's active event plan into a concise, token-budgeted markdown block
 * for grounding LLM generation and follow-up Q&A.
 *
 * @param request - Validated ChatRequest containing profile and state metrics.
 * @returns Clean grounding context string stripped of PII.
 */
export function buildGroundingContext(request: ChatRequest): string {
  const { currentProfile, budgetSummary, bookedVendorsCount, completedMilestonesCount } =
    request;

  const sanitizedTitle = escapeDelimiters(sanitizePii(currentProfile.title));
  const sanitizedLocation = escapeDelimiters(sanitizePii(currentProfile.location));
  const dietaryList =
    currentProfile.constraints.dietary.length > 0
      ? escapeDelimiters(currentProfile.constraints.dietary.join(", "))
      : "None";
  const accessList =
    currentProfile.constraints.accessibility.length > 0
      ? escapeDelimiters(currentProfile.constraints.accessibility.join(", "))
      : "Standard accessibility";
  const kidsLabel = currentProfile.constraints.kidFriendly
    ? "Kid-friendly activities required"
    : "Adult-focused event";

  return `[ACTIVE EVENT GROUNDING CONTEXT]
- Archetype: ${currentProfile.eventType.toUpperCase()}
- Title: "${sanitizedTitle}"
- Target Date: ${currentProfile.date}
- Guest Count: ${currentProfile.guestCount} attendees
- Total Budget: $${budgetSummary.totalBudget.toLocaleString()}
- Current Spending: $${budgetSummary.totalSpent.toLocaleString()} (Remaining: $${budgetSummary.remainingBudget.toLocaleString()})
- Over-Budget: ${budgetSummary.isOverBudget ? "YES" : "NO"}
- Location: ${sanitizedLocation}
- Theme: ${currentProfile.theme ? escapeDelimiters(sanitizePii(currentProfile.theme)) : "Flexible"}
- Dietary Constraints: ${dietaryList}
- Accessibility Accommodations: ${accessList}
- Family Style: ${kidsLabel}
- Progress: ${completedMilestonesCount} milestones completed, ${bookedVendorsCount} vendors confirmed`;
}

/**
 * Truncates chat history to a sliding window of the most recent turns to maintain token efficiency.
 *
 * @param messages - Array of ChatMessages.
 * @param maxTurns - Maximum number of messages to retain (default 6).
 * @returns Sliced array of sanitized ChatMessages.
 */
export function trimChatHistory(
  messages: readonly ChatMessage[],
  maxTurns = 6,
): ChatMessage[] {
  const sliced = messages.slice(-maxTurns);
  return sliced.map((m) => ({
    ...m,
    content: escapeDelimiters(sanitizePii(m.content)),
  }));
}
