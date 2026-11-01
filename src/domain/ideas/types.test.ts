import { describe, it, expect } from "vitest";
import { PersonalizedIdeasSchema } from "./types";

describe("PersonalizedIdeasSchema", () => {
  it("validates a fully formed personalized ideas object", () => {
    const rawIdeas = {
      eventSummary:
        "Rustic elegant vineyard wedding with vegan dining and acoustic sets.",
      themes: [
        {
          title: "Tuscan Sunlit Vineyard",
          description: "Olive runners and wine barrel cocktail tables.",
          colorPalette: ["#2D4739", "#E8DFD8", "#CBB89D", "#FAF7F2"],
        },
        {
          title: "Modern Botanical",
          description: "Geometric brass lanterns and eucalyptus foliage.",
          colorPalette: ["#1F2421", "#D4AF37", "#E0BFB8"],
        },
      ],
      activities: [
        {
          name: "Wine Tasting & Pairing Game",
          description:
            "Guests sample three local vineyard vintages with sommelier cards.",
          targetAudience: "Adult Guests",
          durationMinutes: 45,
        },
        {
          name: "Lawn Bocce Ball Tournament",
          description: "Casual lawn game on the vineyard grass during cocktail hour.",
          targetAudience: "All Guests",
          durationMinutes: 60,
        },
      ],
      menus: [
        {
          course: "Appetizer Station",
          dishName: "Artisanal Bruschetta & Fig Crostini",
          description: "Toasted sourdough with balsamic reduction.",
          dietaryTags: ["vegan", "dairy_free"],
        },
        {
          course: "Main Course",
          dishName: "Wild Mushroom & Truffle Risotto",
          description: "Arborio rice with roasted chanterelles and crispy leeks.",
          dietaryTags: ["gluten_free", "vegan"],
        },
      ],
      decorations: [
        {
          focalArea: "Ceremony Arbor",
          materials: "Birch wood poles, draped ivory chiffon, olive branches",
          diyBudgetFriendlyTip:
            "Move ceremony arbor florals onto the banquet head table.",
        },
        {
          focalArea: "Welcome Table",
          materials: "Vintage wood crates, framed welcome signage, brass lanterns",
          diyBudgetFriendlyTip: "Print personalized cards on heavy linen paper at home.",
        },
      ],
    };

    const parsed = PersonalizedIdeasSchema.safeParse(rawIdeas);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.themes.length).toBe(2);
      expect(parsed.data.activities.length).toBe(2);
      expect(parsed.data.menus.length).toBe(2);
      expect(parsed.data.decorations.length).toBe(2);
    }
  });

  it("rejects invalid hex colors in theme color palettes", () => {
    const invalidHex = {
      eventSummary: "Test event summary",
      themes: [
        {
          title: "Invalid Palette",
          description: "Bad hex",
          colorPalette: ["not-a-color", "#123", "blue"],
        },
        {
          title: "Second Theme",
          description: "Valid",
          colorPalette: ["#112233", "#445566", "#778899"],
        },
      ],
      activities: [
        { name: "A1", description: "D1", targetAudience: "All", durationMinutes: 30 },
        { name: "A2", description: "D2", targetAudience: "All", durationMinutes: 30 },
      ],
      menus: [
        { course: "Starter", dishName: "Soup", description: "Warm", dietaryTags: [] },
        { course: "Main", dishName: "Bowl", description: "Fresh", dietaryTags: [] },
      ],
      decorations: [
        { focalArea: "Entrance", materials: "Wood", diyBudgetFriendlyTip: "DIY" },
        { focalArea: "Stage", materials: "Lights", diyBudgetFriendlyTip: "DIY" },
      ],
    };

    expect(PersonalizedIdeasSchema.safeParse(invalidHex).success).toBe(false);
  });
});
