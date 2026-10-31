import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  EventPlanInputSchema,
  calculateDefaultBudgetAllocation,
  summarizeBudget,
  generateMilestones,
  generateDefaultRunOfShow,
  generateVendorChecklist
} from "@/domain";
import { generateEventPlanSuggestions } from "@/services";

/**
 * Thin route handler to generate a complete event blueprint with AI suggestions.
 * Input is strictly validated with Zod. Business logic is completely delegated.
 *
 * @param request - NextRequest containing JSON event intake payload.
 * @returns NextResponse with generated event plan or 400 Bad Request.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const jsonBody: unknown = await request.json();
    const validatedInput = EventPlanInputSchema.parse(jsonBody);

    const [aiSuggestions, defaultBudgetItems, milestones, runOfShow, vendors] =
      await Promise.all([
        generateEventPlanSuggestions(validatedInput),
        Promise.resolve(
          calculateDefaultBudgetAllocation(
            validatedInput.eventType,
            validatedInput.totalBudget
          )
        ),
        Promise.resolve(
          generateMilestones(validatedInput.eventType, validatedInput.date)
        ),
        Promise.resolve(generateDefaultRunOfShow(validatedInput.eventType)),
        Promise.resolve(generateVendorChecklist(validatedInput.eventType))
      ]);

    const budgetSummary = summarizeBudget(
      validatedInput.totalBudget,
      defaultBudgetItems
    );

    const eventPlan = {
      id: `event-${Date.now()}`,
      ...validatedInput,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      budget: {
        items: defaultBudgetItems,
        summary: budgetSummary
      },
      timeline: {
        milestones,
        runOfShow
      },
      vendors,
      aiSuggestions
    };

    return NextResponse.json(eventPlan, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error occurred while generating event plan" },
      { status: 500 }
    );
  }
}
