import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

describe("POST /api/events/ideas Route Handler", () => {
  it("returns 200 and personalized ideas for valid payload", async () => {
    const payload = {
      title: "Community Harvest Gathering",
      eventType: "community",
      date: "2027-10-10",
      guestCount: 250,
      totalBudget: 8000,
      location: "Town Center Green",
      constraints: {
        dietary: ["vegetarian"],
        accessibility: ["wheelchair_accessible"],
        kidFriendly: true,
      },
    };

    const req = new NextRequest("http://localhost:3000/api/events/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = (await res.json()) as {
      themes: unknown[];
      activities: unknown[];
      menus: unknown[];
      decorations: unknown[];
    };

    expect(data.themes.length).toBeGreaterThanOrEqual(2);
    expect(data.activities.length).toBeGreaterThanOrEqual(2);
    expect(data.menus.length).toBeGreaterThanOrEqual(2);
    expect(data.decorations.length).toBeGreaterThanOrEqual(2);
  });

  it("returns 400 Bad Request when required title is missing", async () => {
    const invalidPayload = {
      eventType: "community",
    };

    const req = new NextRequest("http://localhost:3000/api/events/ideas", {
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
