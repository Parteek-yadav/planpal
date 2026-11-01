import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

describe("POST /api/events/plan Route Handler", () => {
  it("returns 200 and complete plan for valid wedding input", async () => {
    const payload = {
      title: "Olivia & James Wedding",
      eventType: "wedding",
      date: "2027-09-18",
      guestCount: 140,
      totalBudget: 45000,
      location: "Meadowood Valley",
      theme: "Classic Ivory & Gold",
      constraints: {
        dietary: ["gluten_free", "halal"],
        accessibility: [],
        kidFriendly: false,
      },
    };

    const req = new NextRequest("http://localhost:3000/api/events/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = (await res.json()) as {
      id: string;
      title: string;
      budget: { items: unknown[]; summary: { totalBudget: number } };
      timeline: { milestones: unknown[]; runOfShow: unknown[] };
      vendors: unknown[];
      aiSuggestions: { overview: string };
    };

    expect(data.title).toBe("Olivia & James Wedding");
    expect(data.budget.summary.totalBudget).toBe(45000);
    expect(data.budget.items.length).toBeGreaterThan(0);
    expect(data.timeline.milestones.length).toBeGreaterThan(0);
    expect(data.timeline.runOfShow.length).toBeGreaterThan(0);
    expect(data.vendors.length).toBeGreaterThan(0);
    expect(data.aiSuggestions.overview).toBeDefined();
  });

  it("returns 400 Bad Request when required fields are missing", async () => {
    const invalidPayload = {
      title: "",
      eventType: "wedding",
    };

    const req = new NextRequest("http://localhost:3000/api/events/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invalidPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = (await res.json()) as { error: { code: string; message: string; details?: unknown[] } };
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toBe("Request body validation failed");
    expect(body.error.details).toBeDefined();
  });
});
