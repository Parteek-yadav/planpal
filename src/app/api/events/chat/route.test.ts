import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

describe("POST /api/events/chat Route Handler", () => {
  it("returns 200 and grounded answer for valid chat payload", async () => {
    const payload = {
      messages: [
        {
          id: "m-1",
          role: "user",
          content: "Can we add an extra acoustic musician with our remaining budget?",
          timestamp: "2027-01-01T12:00:00Z",
        },
      ],
      currentProfile: {
        eventType: "wedding",
        title: "Liam & Emma's Wedding",
        date: "2027-08-14",
        guestCount: 120,
        totalBudget: 40000,
        location: "Carmel Valley Estate",
        constraints: {
          dietary: [],
          accessibility: [],
          kidFriendly: false,
        },
      },
      budgetSummary: {
        totalBudget: 40000,
        totalAllocated: 35000,
        totalSpent: 12000,
        remainingBudget: 28000,
        unallocatedBudget: 5000,
        isOverBudget: false,
        variancePercentage: -70,
      },
      bookedVendorsCount: 3,
      completedMilestonesCount: 2,
    };

    const req = new NextRequest("http://localhost:3000/api/events/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = (await res.json()) as {
      reply: string;
      suggestedFollowUps: string[];
      groundedReferences: string[];
    };

    expect(data.reply.length).toBeGreaterThan(10);
    expect(data.suggestedFollowUps.length).toBeGreaterThan(0);
  });

  it("returns 400 Bad Request when messages array is empty", async () => {
    const invalidPayload = {
      messages: [],
      currentProfile: {
        eventType: "wedding",
        title: "Test",
        date: "2027-08-14",
        guestCount: 10,
        totalBudget: 1000,
        location: "Hall",
      },
      budgetSummary: {
        totalBudget: 1000,
        totalAllocated: 1000,
        totalSpent: 500,
        remainingBudget: 500,
        unallocatedBudget: 0,
        isOverBudget: false,
        variancePercentage: -50,
      },
    };

    const req = new NextRequest("http://localhost:3000/api/events/chat", {
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
