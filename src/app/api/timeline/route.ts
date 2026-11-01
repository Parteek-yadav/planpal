import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { EventTypeSchema, generateTimeline } from "@/domain";
import { parseAndValidateRequest, mapServiceErrorToResponse } from "../routeUtils";

/**
 * Strict request schema for timeline milestones generation. Rejects all unknown fields.
 */
export const TimelineApiRequestSchema = z
  .object({
    eventType: EventTypeSchema,
    date: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  })
  .strict();

export type TimelineApiRequest = z.infer<typeof TimelineApiRequestSchema>;

/**
 * Thin route handler: Generates planning milestones scheduled backwards from event date.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const validation = await parseAndValidateRequest(req, TimelineApiRequestSchema);
  if (!validation.ok) {
    return validation.response;
  }

  try {
    const milestones = generateTimeline({
      eventType: validation.data.eventType,
      date: validation.data.date,
    });

    return NextResponse.json(
      { milestones },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    return mapServiceErrorToResponse(error);
  }
}
