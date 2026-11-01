import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { EventTypeSchema, getDefaultVendorChecklist } from "@/domain";
import { parseAndValidateRequest, mapServiceErrorToResponse } from "../routeUtils";

/**
 * Strict request schema for vendor checklist generation. Rejects all unknown fields.
 */
export const VendorsApiRequestSchema = z
  .object({
    eventType: EventTypeSchema,
  })
  .strict();

export type VendorsApiRequest = z.infer<typeof VendorsApiRequestSchema>;

/**
 * Thin route handler: Generates default vendor procurement checklist by archetype.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const validation = await parseAndValidateRequest(req, VendorsApiRequestSchema);
  if (!validation.ok) {
    return validation.response;
  }

  try {
    const vendors = getDefaultVendorChecklist(validation.data.eventType);

    return NextResponse.json(
      { vendors },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      },
    );
  } catch (error) {
    return mapServiceErrorToResponse(error);
  }
}
