import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ChatAssistant } from "./ChatAssistant";
import { EventPlanInput, BudgetSummary } from "@/domain";
import { apiClient } from "@/utils/apiClient";

describe("ChatAssistant Component", () => {
  const mockProfile: EventPlanInput = {
    eventType: "wedding",
    title: "Chloe & Noah's Wedding",
    date: "2027-10-15",
    guestCount: 110,
    totalBudget: 32000,
    location: "Saratoga Springs, CA",
    constraints: {
      dietary: ["vegan"],
      accessibility: ["wheelchair_accessible"],
      kidFriendly: true,
    },
  };

  const mockBudgetSummary: BudgetSummary = {
    totalBudget: 32000,
    totalAllocated: 30000,
    totalSpent: 12000,
    remainingBudget: 20000,
    unallocatedBudget: 2000,
    isOverBudget: false,
    variancePercentage: -62.5,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders trigger button and opens chat window upon click", () => {
    render(
      <ChatAssistant
        currentProfile={mockProfile}
        budgetSummary={mockBudgetSummary}
        bookedVendorsCount={2}
        completedMilestonesCount={3}
      />,
    );

    const openBtn = screen.getByRole("button", { name: /Ask AI Assistant/i });
    expect(openBtn).toBeInTheDocument();

    fireEvent.click(openBtn);

    expect(screen.getByText("🤖 Grounded PlanPal Assistant")).toBeInTheDocument();
    expect(screen.getAllByText(/Chloe & Noah's Wedding/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Left: \$20,000/i)).toBeInTheDocument();
  });

  it("closes chat window when close button is clicked", () => {
    render(
      <ChatAssistant
        currentProfile={mockProfile}
        budgetSummary={mockBudgetSummary}
        bookedVendorsCount={2}
        completedMilestonesCount={3}
      />,
    );

    const openBtn = screen.getByRole("button", { name: /Ask AI Assistant/i });
    fireEvent.click(openBtn);

    const closeBtn = screen.getByRole("button", { name: /Close chat window/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByText("🤖 Grounded PlanPal Assistant")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ask AI Assistant/i })).toBeInTheDocument();
  });

  it("submits a user message and renders the assistant response", async () => {
    vi.spyOn(apiClient, "request").mockResolvedValueOnce({
      reply: "You can allocate more to floral decor since your catering is under budget.",
      suggestedFollowUps: ["What about photography?"],
    });

    render(
      <ChatAssistant
        currentProfile={mockProfile}
        budgetSummary={mockBudgetSummary}
        bookedVendorsCount={2}
        completedMilestonesCount={3}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Ask AI Assistant/i }));

    const input = screen.getByLabelText(/Ask a question/i);
    fireEvent.change(input, { target: { value: "How should I reallocate catering?" } });

    const sendBtn = screen.getByRole("button", { name: /Send message/i });
    expect(sendBtn).not.toBeDisabled();
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/You can allocate more to floral decor/i),
      ).toBeInTheDocument();
    });

    // Check suggested follow-up chips
    expect(screen.getByText(/What about photography\?/i)).toBeInTheDocument();
  });

  it("triggers message send when clicking a quick question button", async () => {
    vi.spyOn(apiClient, "request").mockResolvedValueOnce({
      reply: "Here are 3 ways to optimize your wedding budget right now.",
      suggestedFollowUps: [],
    });

    render(
      <ChatAssistant
        currentProfile={mockProfile}
        budgetSummary={mockBudgetSummary}
        bookedVendorsCount={2}
        completedMilestonesCount={3}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Ask AI Assistant/i }));

    const quickBtn = screen.getByText(/How can we optimize our budget right now\?/i);
    fireEvent.click(quickBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Here are 3 ways to optimize your wedding budget right now/i),
      ).toBeInTheDocument();
    });
  });

  it("handles request failure gracefully with user-friendly message", async () => {
    vi.spyOn(apiClient, "request").mockRejectedValueOnce(new Error("Network disconnect"));

    render(
      <ChatAssistant
        currentProfile={mockProfile}
        budgetSummary={mockBudgetSummary}
        bookedVendorsCount={2}
        completedMilestonesCount={3}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Ask AI Assistant/i }));

    const input = screen.getByLabelText(/Ask a question/i);
    fireEvent.change(input, { target: { value: "Will this fail?" } });
    fireEvent.click(screen.getByRole("button", { name: /Send message/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/We recommend prioritizing your booked vendors/i),
      ).toBeInTheDocument();
    });
  });
});
