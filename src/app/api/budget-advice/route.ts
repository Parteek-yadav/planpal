import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { refineBudgetAdvice } from "@/services";
import { IdeasRequestSchema } from "../ideas/route";
import { parseAndValidateRequest, mapServiceErrorToResponse } from "../routeUtils";

/**
 * Strict request schema for budget advice refinement. Rejects all unknown fields.
 */
export const BudgetAdviceRequestSchema = z
  .object({
    profile: IdeasRequestSchema,
    spend: z.record(z.string(), z.number()).default({}),
  })
  .strict();

export type BudgetAdviceRequest = z.infer<typeof BudgetAdviceRequestSchema>;

/**
 * Thin route handler: Refines budget allocation and cost optimization advice.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const validation = await parseAndValidateRequest(req, BudgetAdviceRequestSchema);
  if (!validation.ok) {
    return validation.response;
  }

  try {
    const advice = await refineBudgetAdvice(
      validation.data.profile,
      validation.data.spend,
    );
    return NextResponse.json(advice, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    return mapServiceErrorToResponse(error);
  }
}
