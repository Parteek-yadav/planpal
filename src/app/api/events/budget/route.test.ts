import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

describe("POST /api/events/budget Route Handler", () => {
  it("calculates summary and category breakdowns successfully", async () => {
    const payload = {
      totalBudget: 20000,
      items: [
        {
          id: "item-1",
          category: "venue_catering",
          name: "Reception Hall",
          allocatedAmount: 10000,
          actualAmount: 9500,
          isPaid: true,
        },
        {
          id: "item-2",
          category: "decor_floral",
          name: "Flowers",
          allocatedAmount: 2000,
          actualAmount: 2200,
          isPaid: false,
        },
      ],
    };

    const req = new NextRequest("http://localhost:3000/api/events/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = (await res.json()) as {
      summary: { totalBudget: number; totalSpent: number; isOverBudget: boolean };
      categorySubtotals: { venue_catering: { spent: number } };
    };

    expect(data.summary.totalBudget).toBe(20000);
    expect(data.summary.totalSpent).toBe(11700);
    expect(data.summary.isOverBudget).toBe(false);
    expect(data.categorySubtotals.venue_catering.spent).toBe(9500);
  });

  it("returns 400 Bad Request for negative budget values", async () => {
    const invalidPayload = {
      totalBudget: -500,
      items: [],
    };

    const req = new NextRequest("http://localhost:3000/api/events/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invalidPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = (await res.json()) as { error: { code: string; message: string } };
    expect(data.error.code).toBe("VALIDATION_ERROR");
    expect(data.error.message).toBe("Request body validation failed");
  });
});
