import { describe, it, expect } from "vitest";
import { EventPlanInputSchema } from "./types";

describe("EventPlanInputSchema", () => {
  it("successfully parses valid wedding intake input", () => {
    const raw = {
      title: "Sarah & Alex Wedding",
      eventType: "wedding",
      date: "2027-06-15",
      guestCount: 150,
      totalBudget: 35000,
      location: "San Francisco Botanical Garden",
      theme: "Rustic Romance",
      dietaryPreferences: ["Vegetarian", "Gluten-Free"],
      specialNotes: "Outdoor ceremony followed by indoor banquet."
    };

    const parsed = EventPlanInputSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.title).toBe("Sarah & Alex Wedding");
      expect(parsed.data.eventType).toBe("wedding");
      expect(parsed.data.guestCount).toBe(150);
    }
  });

  it("rejects invalid date format", () => {
    const raw = {
      title: "Invalid Date Event",
      eventType: "birthday",
      date: "06/15/2027",
      guestCount: 20,
      totalBudget: 1500,
      location: "Local Community Park"
    };

    const parsed = EventPlanInputSchema.safeParse(raw);
    expect(parsed.success).toBe(false);
  });

  it("rejects non-positive guest count or budget", () => {
    const invalidGuests = {
      title: "Zero Guest Party",
      eventType: "birthday",
      date: "2027-07-20",
      guestCount: 0,
      totalBudget: 500,
      location: "Home"
    };

    expect(EventPlanInputSchema.safeParse(invalidGuests).success).toBe(false);

    const negativeBudget = {
      title: "Negative Budget Event",
      eventType: "community",
      date: "2027-07-20",
      guestCount: 50,
      totalBudget: -100,
      location: "Town Hall"
    };

    expect(EventPlanInputSchema.safeParse(negativeBudget).success).toBe(false);
  });

  it("rejects unsupported event archetype", () => {
    const raw = {
      title: "Corporate Retreat",
      eventType: "corporate",
      date: "2027-08-01",
      guestCount: 50,
      totalBudget: 10000,
      location: "Convention Center"
    };

    expect(EventPlanInputSchema.safeParse(raw).success).toBe(false);
  });
});
