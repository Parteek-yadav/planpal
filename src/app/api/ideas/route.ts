import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { EventTypeSchema } from "@/domain";
import { generateIdeas } from "@/services";
import { parseAndValidateRequest, mapServiceErrorToResponse } from "../routeUtils";

/**
 * Strict request schema for idea generation. Rejects all unknown fields.
 */
export const IdeasRequestSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(100, "Title cannot exceed 100 characters"),
    eventType: EventTypeSchema,
    date: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
      .refine(
        (val) => {
          const d = new Date(val);
          return !isNaN(d.getTime()) && d > new Date();
        },
        { message: "Event date must be in the future" },
      ),
    guestCount: z
      .number()
      .int("Guest count must be an integer")
      .min(1, "Guest count must be at least 1")
      .max(5000, "Guest count cannot exceed 5,000"),
    budget: z.number().positive("Budget must be greater than 0"),
    location: z.string().trim().max(120).optional(),
    theme: z.string().trim().max(80).optional(),
    description: z.string().trim().max(500).optional(),
    notes: z.string().trim().max(300).optional(),
    constraints: z
      .object({
        dietary: z.array(z.string()).default([]),
        accessibility: z.array(z.string()).default([]),
        kidFriendly: z.boolean().default(false),
        customNotes: z.string().trim().max(300).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export type IdeasRequest = z.infer<typeof IdeasRequestSchema>;

/**
 * Thin route handler: Generates creative event ideas.
 * Strictly validates body, enforces body limits, applies per-IP rate limiting,
 * calls service layer, and returns formatted result with Cache-Control.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const validation = await parseAndValidateRequest(req, IdeasRequestSchema);
  if (!validation.ok) {
    return validation.response;
  }

  try {
    const ideas = await generateIdeas(validation.data);
    return NextResponse.json(ideas, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    return mapServiceErrorToResponse(error);
  }
}
