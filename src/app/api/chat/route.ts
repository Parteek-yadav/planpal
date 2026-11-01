import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { answerQuestion } from "@/services";
import { IdeasRequestSchema } from "../ideas/route";
import { parseAndValidateRequest, mapServiceErrorToResponse } from "../routeUtils";

/**
 * Strict request schema for grounded Q&A chat. Rejects all unknown fields.
 */
export const ChatApiRequestSchema = z
  .object({
    profile: IdeasRequestSchema,
    plan: z.record(z.string(), z.unknown()).default({}),
    question: z
      .string()
      .trim()
      .min(1, "Question cannot be empty")
      .max(500, "Question cannot exceed 500 characters"),
  })
  .strict();

export type ChatApiRequest = z.infer<typeof ChatApiRequestSchema>;

/**
 * Thin route handler: Answers event planning questions grounded in the active plan.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const validation = await parseAndValidateRequest(req, ChatApiRequestSchema);
  if (!validation.ok) {
    return validation.response;
  }

  try {
    const result = await answerQuestion(
      validation.data.profile,
      validation.data.plan,
      validation.data.question,
    );
    return NextResponse.json(result, {
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
