import { describe, it, expect } from "vitest";
import { generateEventPlanSuggestions, generatePersonalizedIdeas } from "./aiService";
import { AiPlanSuggestionSchema } from "./types";
import { PersonalizedIdeasSchema } from "@/domain/ideas/types";

describe("AI Event Planning Service", () => {
  it("generates validated suggestions for a wedding with constraints", async () => {
    const weddingRequest = {
      eventType: "wedding" as const,
      title: "Liam & Emma's Wedding",
      date: "2027-08-14",
      guestCount: 120,
      totalBudget: 40000,
      location: "Carmel Valley Estate",
      theme: "Coastal Vineyard",
      constraints: {
        dietary: ["vegan" as const, "nut_free" as const],
        accessibility: ["wheelchair_accessible" as const],
        kidFriendly: false,
      },
    };

    const suggestions = await generateEventPlanSuggestions(weddingRequest);

    // Validate against strict Zod schema
    const parseResult = AiPlanSuggestionSchema.safeParse(suggestions);
    expect(parseResult.success).toBe(true);

    expect(suggestions.overview).toContain("wedding");
    expect(suggestions.themeIdeas.length).toBeGreaterThanOrEqual(2);
    expect(suggestions.themeIdeas[0].colorPalette.length).toBeGreaterThanOrEqual(3);
    expect(suggestions.activities.length).toBeGreaterThanOrEqual(2);
    expect(suggestions.menus.length).toBeGreaterThanOrEqual(2);
    expect(suggestions.decorations.length).toBeGreaterThanOrEqual(2);
  });

  it("generates validated personalized ideas object", async () => {
    const request = {
      eventType: "birthday" as const,
      title: "Maya's 30th Birthday Bash",
      date: "2027-04-20",
      guestCount: 40,
      totalBudget: 3500,
      location: "Skyline Rooftop Lounge",
      theme: "Glow in the Dark",
      constraints: {
        dietary: [],
        accessibility: [],
        kidFriendly: true,
      },
    };

    const ideas = await generatePersonalizedIdeas(request);
    const parseResult = PersonalizedIdeasSchema.safeParse(ideas);
    expect(parseResult.success).toBe(true);
    expect(ideas.themes.length).toBeGreaterThanOrEqual(2);
    expect(ideas.activities.length).toBeGreaterThanOrEqual(2);
    expect(ideas.menus.length).toBeGreaterThanOrEqual(2);
    expect(ideas.decorations.length).toBeGreaterThanOrEqual(2);
  });

  it("redacts PII from prompt inputs before generating suggestions", async () => {
    const piiRequest = {
      eventType: "birthday" as const,
      title: "Party with host john.doe@secret.com",
      date: "2027-05-10",
      guestCount: 25,
      totalBudget: 1200,
      location: "Call 555-432-1098 for entrance code",
      constraints: {
        dietary: [],
        accessibility: [],
        kidFriendly: false,
      },
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
      location: "",
    };

    await expect(generateEventPlanSuggestions(invalidRequest)).rejects.toThrow();
  });
});
