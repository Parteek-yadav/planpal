import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import {
  BudgetItemSchema,
  summarizeBudget,
  calculateCategorySubtotals
} from "@/domain";

const RecalculateBudgetRequestSchema = z.object({
  totalBudget: z.number().nonnegative("Total budget must be non-negative"),
  items: z.array(BudgetItemSchema)
});

/**
 * Thin route handler for budget calculations and variance analytics.
 * Delegates pure calculations to domain functions.
 *
 * @param request - NextRequest with budget calculation payload.
 * @returns NextResponse with computed summary and category breakdowns.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rawBody: unknown = await request.json();
    const { totalBudget, items } = RecalculateBudgetRequestSchema.parse(rawBody);

    const summary = summarizeBudget(totalBudget, items);
    const categorySubtotals = calculateCategorySubtotals(items);

    return NextResponse.json({ summary, categorySubtotals }, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to recalculate budget metrics" },
      { status: 500 }
    );
  }
}
