import { describe, it, expect } from "vitest";
import { generateEventPlanSuggestions } from "./aiService";
import { AiPlanSuggestionSchema } from "./types";

describe("AI Event Planning Service", () => {
  it("generates validated suggestions for a wedding", async () => {
    const weddingRequest = {
      eventType: "wedding" as const,
      title: "Liam & Emma's Wedding",
      date: "2027-08-14",
      guestCount: 120,
      totalBudget: 40000,
      location: "Carmel Valley Estate",
      theme: "Coastal Vineyard",
      dietaryPreferences: ["Vegan", "Nut-Free"],
      specialNotes: "Live jazz quartet for cocktail hour."
    };

    const suggestions = await generateEventPlanSuggestions(weddingRequest);

    // Validate against strict Zod schema
    const parseResult = AiPlanSuggestionSchema.safeParse(suggestions);
    expect(parseResult.success).toBe(true);

    expect(suggestions.overview).toContain("wedding");
    expect(suggestions.themeIdeas.length).toBeGreaterThanOrEqual(2);
    expect(suggestions.themeIdeas[0].colorPalette.length).toBeGreaterThanOrEqual(3);
    expect(suggestions.customTimelineTips.length).toBeGreaterThanOrEqual(2);
    expect(suggestions.budgetOptimizationTips.length).toBeGreaterThanOrEqual(2);
    expect(suggestions.contingencyPlan.riskScenario).toBeDefined();
  });

  it("generates validated suggestions for a birthday celebration", async () => {
    const birthdayRequest = {
      eventType: "birthday" as const,
      title: "Maya's 30th Birthday Bash",
      date: "2027-04-20",
      guestCount: 40,
      totalBudget: 3500,
      location: "Skyline Rooftop Lounge",
      theme: "Glow in the Dark"
    };

    const suggestions = await generateEventPlanSuggestions(birthdayRequest);
    expect(suggestions.overview).toContain("birthday");
    expect(suggestions.themeIdeas[0].title).toBe("Glow in the Dark");
  });

  it("generates validated suggestions for a community festival", async () => {
    const communityRequest = {
      eventType: "community" as const,
      title: "Maplewood Spring Festival",
      date: "2027-05-22",
      guestCount: 500,
      totalBudget: 15000,
      location: "Central Town Park"
    };

    const suggestions = await generateEventPlanSuggestions(communityRequest);
    expect(suggestions.overview).toContain("community");
    expect(suggestions.budgetOptimizationTips.some((t) => t.category.includes("Equipment"))).toBe(
      true
    );
  });

  it("redacts PII from prompt inputs before generating suggestions", async () => {
    const piiRequest = {
      eventType: "birthday" as const,
      title: "Party with host john.doe@secret.com",
      date: "2027-05-10",
      guestCount: 25,
      totalBudget: 1200,
      location: "Call 555-432-1098 for entrance code"
    };

    const suggestions = await generateEventPlanSuggestions(piiRequest);
    expect(suggestions.overview).not.toContain("john.doe@secret.com");
    expect(suggestions.overview).not.toContain("555-432-1098");
  });

  it("throws validation error for invalid input fields", async () => {
    const invalidRequest = {
      eventType: "invalid_type",
      title: "X", // too short
      date: "bad-date",
      guestCount: -5,
      totalBudget: -100,
      location: ""
    };

    await expect(generateEventPlanSuggestions(invalidRequest)).rejects.toThrow();
  });
});
