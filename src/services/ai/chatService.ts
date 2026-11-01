import { buildGroundingContext } from "./promptBuilder";
import {
  ChatRequest,
  ChatRequestSchema,
  ChatResponse,
  ChatResponseSchema,
} from "./types";
import { answerQuestion } from "./aiService";

/**
 * Heuristic grounded answer resolver for development, testing, and offline modes.
 * Formulates specific answers using the active plan metrics.
 *
 * @param request - Validated ChatRequest.
 * @returns Candidate ChatResponse object.
 */
function generateDeterministicChatReply(request: ChatRequest): unknown {
  const { currentProfile, budgetSummary, messages } = request;
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const query = (lastUserMsg?.content || "").toLowerCase();

  const dietaryNote =
    currentProfile.constraints.dietary.length > 0
      ? ` Given your ${currentProfile.constraints.dietary.join(" and ")} catering requirement, ensure menu tastings explicitly include separate prep areas.`
      : "";

  const accessibilityNote =
    currentProfile.constraints.accessibility.length > 0
      ? ` Also keeping in mind your ${currentProfile.constraints.accessibility.join(" and ")} accommodation, verify step-free entrances and accessible restrooms.`
      : "";

  if (
    query.includes("budget") ||
    query.includes("cut") ||
    query.includes("save") ||
    query.includes("cost")
  ) {
    const remainingFormatted = `$${budgetSummary.remainingBudget.toLocaleString()}`;
    return {
      reply: `Based on your ${currentProfile.eventType} plan with a total budget of $${budgetSummary.totalBudget.toLocaleString()}, you currently have ${remainingFormatted} remaining (${budgetSummary.isOverBudget ? "currently over budget" : "within limits"}). To optimize costs without sacrificing quality, consider repurposing ceremony florals onto reception tables and offering signature mocktails/cocktails instead of an open top-shelf bar.${dietaryNote}`,
      suggestedFollowUps: [
        "How can I cut $1,000 from floral and decor?",
        "What are typical payment schedules for vendors?",
        "Should I allocate a larger emergency buffer?",
      ],
      groundedReferences: [
        `Total Budget: $${budgetSummary.totalBudget.toLocaleString()}`,
        `Remaining: ${remainingFormatted}`,
        `Spent: $${budgetSummary.totalSpent.toLocaleString()}`,
      ],
    };
  }

  if (
    query.includes("rain") ||
    query.includes("weather") ||
    query.includes("contingency") ||
    query.includes("backup")
  ) {
    return {
      reply: `For your event in ${currentProfile.location} on ${currentProfile.date}, outdoor weather risk is best mitigated by securing an auxiliary tent deposit or indoor hall option with a 72-hour cancellation clause. Designate an on-site lead to monitor weather forecasts starting 5 days out.${accessibilityNote}`,
      suggestedFollowUps: [
        "What should our run-of-show look like if it rains?",
        "How much extra does an all-weather marquee tent cost?",
        "Can we relocate sound and lighting gear quickly?",
      ],
      groundedReferences: [
        `Location: ${currentProfile.location}`,
        `Event Date: ${currentProfile.date}`,
        `Guest Count: ${currentProfile.guestCount}`,
      ],
    };
  }

  if (query.includes("kid") || query.includes("child") || query.includes("family")) {
    return {
      reply: currentProfile.constraints.kidFriendly
        ? `Since your ${currentProfile.eventType} is marked as kid-friendly for ${currentProfile.guestCount} guests, we recommend setting up a dedicated activity station with lawn games, coloring placemats, and a quiet recharge corner. Stagger high-energy games to keep younger attendees engaged.`
        : `Your current plan is configured with adult-focused pacing for ${currentProfile.guestCount} guests. If children will be attending, consider adding kid-friendly meal options and a designated family lounge area.`,
      suggestedFollowUps: [
        "What are top kid-friendly menu ideas?",
        "How should we pace activities for mixed ages?",
        "Do we need extra supervision or entertainers?",
      ],
      groundedReferences: [
        `Guest Count: ${currentProfile.guestCount}`,
        `Kid-friendly: ${currentProfile.constraints.kidFriendly ? "Yes" : "No"}`,
      ],
    };
  }

  // Default grounded response
  return {
    reply: `Looking at your plan for "${currentProfile.title}" (${currentProfile.eventType}) on ${currentProfile.date} in ${currentProfile.location}: You have ${budgetSummary.remainingBudget >= 0 ? `$${budgetSummary.remainingBudget.toLocaleString()} in remaining budget` : "an over-budget status"} for ${currentProfile.guestCount} guests.${dietaryNote}${accessibilityNote} What aspect of your timeline, vendors, or creative styling would you like to explore next?`,
    suggestedFollowUps: [
      "Review our budget breakdown and savings",
      "Check milestone timeline priorities",
      "Suggest personalized activities and theme decor",
    ],
    groundedReferences: [
      `Event: ${currentProfile.title}`,
      `Date: ${currentProfile.date}`,
      `Guests: ${currentProfile.guestCount}`,
    ],
  };
}

/**
 * Executes a conversational assistant turn grounded strictly in the active event plan.
 * Validates request and response schemas, strips PII, and bounds token context.
 *
 * @param rawInput - Untrusted user chat payload.
 * @returns Validated, grounded ChatResponse.
 */
export async function answerGroundedChat(rawInput: unknown): Promise<ChatResponse> {
  const parsedRequest = ChatRequestSchema.parse(rawInput);
  const groundingContext = buildGroundingContext(parsedRequest);
  const lastUserMsg = [...parsedRequest.messages]
    .reverse()
    .find((m) => m.role === "user");
  const query = lastUserMsg?.content || "";

  if (process.env.GEMINI_API_KEY) {
    try {
      const qResult = await answerQuestion(
        parsedRequest.currentProfile,
        groundingContext,
        query,
      );
      return ChatResponseSchema.parse({
        reply: qResult.answer,
        suggestedFollowUps: qResult.suggestedFollowUps,
        groundedReferences: qResult.groundedReferences,
      });
    } catch {
      // Fallback to deterministic grounded generator on transient AI failure
    }
  }

  const candidate = generateDeterministicChatReply(parsedRequest);
  return ChatResponseSchema.parse(candidate);
}
