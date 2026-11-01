import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { BudgetItemSchema, summarizeBudget, calculateCategorySubtotals } from "@/domain";
import { parseAndValidateRequest, mapServiceErrorToResponse } from "../../routeUtils";

const RecalculateBudgetRequestSchema = z
  .object({
    totalBudget: z.number().nonnegative("Total budget must be non-negative"),
    items: z.array(BudgetItemSchema),
  })
  .strict();

/**
 * Thin route handler for budget calculations and variance analytics.
 * Delegates pure calculations to domain functions.
 *
 * @param request - NextRequest with budget calculation payload.
 * @returns NextResponse with computed summary and category breakdowns.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const validation = await parseAndValidateRequest(
    request,
    RecalculateBudgetRequestSchema,
  );
  if (!validation.ok) {
    return validation.response;
  }

  try {
    const { totalBudget, items } = validation.data;
    const summary = summarizeBudget(totalBudget, items);
    const categorySubtotals = calculateCategorySubtotals(items);

    return NextResponse.json(
      { summary, categorySubtotals },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "private, no-cache",
        },
      },
    );
  } catch (error) {
    return mapServiceErrorToResponse(error);
  }
}
