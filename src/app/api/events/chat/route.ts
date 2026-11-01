import { NextRequest, NextResponse } from "next/server";
import { ChatRequestSchema, answerGroundedChat } from "@/services";
import { parseAndValidateRequest, mapServiceErrorToResponse } from "../../routeUtils";

/**
 * Thin route handler for grounded chat follow-up questions.
 * Input is strictly validated with Zod. Assistant logic is completely delegated.
 *
 * @param request - NextRequest with ChatRequest JSON payload.
 * @returns NextResponse with ChatResponse or 400 Bad Request.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const validation = await parseAndValidateRequest(request, ChatRequestSchema);
  if (!validation.ok) {
    return validation.response;
  }

  try {
    const reply = await answerGroundedChat(validation.data);
    return NextResponse.json(reply, {
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
