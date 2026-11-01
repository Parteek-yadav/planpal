import { describe, it, expect } from "vitest";
import { EventPlanInputSchema } from "./types";

describe("EventPlanInputSchema with Constraints", () => {
  it("successfully parses valid wedding intake input with constraints", () => {
    const raw = {
      title: "Sarah & Alex Wedding",
      eventType: "wedding",
      date: "2027-06-15",
      guestCount: 150,
      totalBudget: 35000,
      location: "San Francisco Botanical Garden",
      theme: "Rustic Romance",
      constraints: {
        dietary: ["vegan", "gluten_free"],
        accessibility: ["wheelchair_accessible"],
        kidFriendly: true,
        customNotes: "Please ensure clear ramps for senior guests.",
      },
    };

    const parsed = EventPlanInputSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.title).toBe("Sarah & Alex Wedding");
      expect(parsed.data.constraints.dietary).toContain("vegan");
      expect(parsed.data.constraints.accessibility).toContain("wheelchair_accessible");
      expect(parsed.data.constraints.kidFriendly).toBe(true);
    }
  });

  it("applies default empty constraints if omitted", () => {
    const raw = {
      title: "Simple Birthday Party",
      eventType: "birthday",
      date: "2027-07-20",
      guestCount: 30,
      totalBudget: 1500,
      location: "Local Community Park",
    };

    const parsed = EventPlanInputSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.constraints.dietary).toEqual([]);
      expect(parsed.data.constraints.accessibility).toEqual([]);
      expect(parsed.data.constraints.kidFriendly).toBe(false);
    }
  });

  it("rejects invalid date format", () => {
    const raw = {
      title: "Invalid Date Event",
      eventType: "birthday",
      date: "06/15/2027",
      guestCount: 20,
      totalBudget: 1500,
      location: "Local Community Park",
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
      location: "Home",
    };

    expect(EventPlanInputSchema.safeParse(invalidGuests).success).toBe(false);

    const negativeBudget = {
      title: "Negative Budget Event",
      eventType: "community",
      date: "2027-07-20",
      guestCount: 50,
      totalBudget: -100,
      location: "Town Hall",
    };

    expect(EventPlanInputSchema.safeParse(negativeBudget).success).toBe(false);
  });
});
