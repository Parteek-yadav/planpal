import { NextRequest, NextResponse } from "next/server";
import {
  EventPlanInputSchema,
  calculateDefaultBudgetAllocation,
  summarizeBudget,
  generateMilestones,
  generateDefaultRunOfShow,
  generateVendorChecklist,
} from "@/domain";
import { generateEventPlanSuggestions } from "@/services";
import { parseAndValidateRequest, mapServiceErrorToResponse } from "../../routeUtils";

/**
 * Thin route handler to generate a complete event blueprint with AI suggestions.
 * Input is strictly validated with Zod. Business logic is completely delegated.
 *
 * @param request - NextRequest containing JSON event intake payload.
 * @returns NextResponse with generated event plan or 400 Bad Request.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const validation = await parseAndValidateRequest(request, EventPlanInputSchema);
  if (!validation.ok) {
    return validation.response;
  }

  try {
    const validatedInput = validation.data;
    const [aiSuggestions, defaultBudgetItems, milestones, runOfShow, vendors] =
      await Promise.all([
        generateEventPlanSuggestions(validatedInput),
        Promise.resolve(
          calculateDefaultBudgetAllocation(
            validatedInput.eventType,
            validatedInput.totalBudget,
          ),
        ),
        Promise.resolve(
          generateMilestones(validatedInput.eventType, validatedInput.date),
        ),
        Promise.resolve(generateDefaultRunOfShow(validatedInput.eventType)),
        Promise.resolve(generateVendorChecklist(validatedInput.eventType)),
      ]);

    const budgetSummary = summarizeBudget(validatedInput.totalBudget, defaultBudgetItems);

    const eventPlan = {
      id: `event-${Date.now()}`,
      ...validatedInput,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      budget: {
        items: defaultBudgetItems,
        summary: budgetSummary,
      },
      timeline: {
        milestones,
        runOfShow,
      },
      vendors,
      aiSuggestions,
    };

    return NextResponse.json(eventPlan, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    return mapServiceErrorToResponse(error);
  }
}
