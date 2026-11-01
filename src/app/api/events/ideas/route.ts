import { NextRequest, NextResponse } from "next/server";
import { EventPlanInputSchema } from "@/domain";
import { generatePersonalizedIdeas } from "@/services";
import { parseAndValidateRequest, mapServiceErrorToResponse } from "../../routeUtils";

/**
 * Thin route handler for generating personalized event ideas
 * (themes, activities, menus, decorations) tailored to the event constraints.
 *
 * @param request - NextRequest with EventPlanInput JSON payload.
 * @returns NextResponse with PersonalizedIdeas or 400 Bad Request.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const validation = await parseAndValidateRequest(request, EventPlanInputSchema);
  if (!validation.ok) {
    return validation.response;
  }

  try {
    const ideas = await generatePersonalizedIdeas(validation.data);
    return NextResponse.json(ideas, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    return mapServiceErrorToResponse(error);
  }
}
