import { describe, it, expect } from "vitest";
import { answerGroundedChat } from "./chatService";
import { ChatResponseSchema } from "./types";

describe("Chat Service (Grounded Assistant)", () => {
  const baseRequest = {
    messages: [
      {
        id: "msg-1",
        role: "user" as const,
        content: "How is our budget looking and how can we save on catering?",
        timestamp: "2027-01-01T12:00:00Z",
      },
    ],
    currentProfile: {
      eventType: "wedding" as const,
      title: "Sarah & David's Wedding",
      date: "2027-09-20",
      guestCount: 130,
      totalBudget: 38000,
      location: "Napa Valley, CA",
      constraints: {
        dietary: ["vegan" as const],
        accessibility: ["wheelchair_accessible" as const],
        kidFriendly: false,
      },
    },
    budgetSummary: {
      totalBudget: 38000,
      totalAllocated: 38000,
      totalSpent: 18000,
      remainingBudget: 20000,
      unallocatedBudget: 0,
      isOverBudget: false,
      variancePercentage: -47.37,
    },
    bookedVendorsCount: 2,
    completedMilestonesCount: 3,
  };

  it("answers budget question grounded in remaining funds and constraints", async () => {
    const response = await answerGroundedChat(baseRequest);

    const validated = ChatResponseSchema.safeParse(response);
    expect(validated.success).toBe(true);

    expect(response.reply).toContain("$20,000");
    expect(response.reply.toLowerCase()).toContain("vegan");
    expect(response.groundedReferences.length).toBeGreaterThan(0);
    expect(response.suggestedFollowUps.length).toBeGreaterThan(0);
  });

  it("answers weather contingency question with location awareness", async () => {
    const weatherRequest = {
      ...baseRequest,
      messages: [
        {
          id: "m-2",
          role: "user" as const,
          content: "What is our backup plan if it rains?",
          timestamp: "2027-01-01T12:00:00Z",
        },
      ],
    };

    const response = await answerGroundedChat(weatherRequest);
    expect(response.reply).toContain("Napa Valley, CA");
    expect(response.reply.toLowerCase()).toContain("weather");
  });

  it("rejects invalid request payloads with ZodError", async () => {
    const invalidRequest = {
      messages: [], // minimum 1 required
      currentProfile: {},
    };

    await expect(answerGroundedChat(invalidRequest)).rejects.toThrow();
  });
});
