import { describe, it, expect } from "vitest";
import { buildGroundingContext, trimChatHistory } from "./promptBuilder";
import { ChatRequest, ChatMessage } from "./types";

describe("Prompt Builder & Grounding Engine", () => {
  const mockRequest: ChatRequest = {
    messages: [{ id: "1", role: "user", content: "Hello", timestamp: "2027-01-01" }],
    currentProfile: {
      eventType: "wedding",
      title: "Liam & Emma's Wedding",
      date: "2027-08-14",
      guestCount: 120,
      totalBudget: 40000,
      location: "Carmel Valley Estate",
      theme: "Coastal Vineyard",
      constraints: {
        dietary: ["vegan", "gluten_free"],
        accessibility: ["wheelchair_accessible"],
        kidFriendly: false,
      },
    },
    budgetSummary: {
      totalBudget: 40000,
      totalAllocated: 38000,
      totalSpent: 15000,
      remainingBudget: 25000,
      unallocatedBudget: 2000,
      isOverBudget: false,
      variancePercentage: -62.5,
    },
    bookedVendorsCount: 3,
    completedMilestonesCount: 4,
  };

  it("builds concise grounding context containing remaining budget and constraints", () => {
    const context = buildGroundingContext(mockRequest);
    expect(context).toContain("WEDDING");
    expect(context).toContain("Liam & Emma's Wedding");
    expect(context).toContain("Remaining: $25,000");
    expect(context).toContain("vegan, gluten_free");
    expect(context).toContain("wheelchair_accessible");
    expect(context).toContain("Adult-focused event");
  });

  it("redacts PII from profile title and location in grounding context", () => {
    const piiRequest: ChatRequest = {
      ...mockRequest,
      currentProfile: {
        ...mockRequest.currentProfile,
        title: "Call 555-123-4567 for Emma's Wedding",
        location: "Reach john.planner@gmail.com",
      },
    };

    const context = buildGroundingContext(piiRequest);
    expect(context).not.toContain("555-123-4567");
    expect(context).not.toContain("john.planner@gmail.com");
    expect(context).toContain("[REDACTED_PHONE]");
    expect(context).toContain("[REDACTED_EMAIL]");
  });

  it("trims chat history to sliding window and sanitizes messages", () => {
    const manyMessages: ChatMessage[] = Array.from({ length: 10 }).map((_, i) => ({
      id: `msg-${i}`,
      role: i % 2 === 0 ? "user" : "assistant",
      content: `Question or answer ${i} with email user${i}@mail.com`,
      timestamp: "2027-01-01",
    }));

    const trimmed = trimChatHistory(manyMessages, 4);
    expect(trimmed.length).toBe(4);
    expect(trimmed[0].id).toBe("msg-6");
    expect(trimmed[3].id).toBe("msg-9");
    expect(trimmed[0].content).toContain("[REDACTED_EMAIL]");
  });
});
