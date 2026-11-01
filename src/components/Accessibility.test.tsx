import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "jest-axe";
import { NavigationTabs } from "./NavigationTabs";
import { BudgetTracker } from "./BudgetTracker";
import { TimelineView } from "./TimelineView";
import { VendorChecklistView } from "./VendorChecklistView";
import { AiIdeasPanel } from "./AiIdeasPanel";
import { ChatAssistant } from "./chat/ChatAssistant";
import { EventWizard } from "./EventWizard";
import { ClearDataModal } from "./ClearDataModal";
import { PrivacyNotice } from "./PrivacyNotice";
import { EventPlanInput, BudgetSummary } from "@/domain";

describe("Accessibility Audits (jest-axe) & Keyboard Navigation", () => {
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

  it("verifies NavigationTabs has zero accessibility violations and supports arrow key navigation", async () => {
    const onTabChange = vi.fn();
    const { container } = render(
      <div>
        <NavigationTabs
          activeTab="ai_plan"
          onTabChange={onTabChange}
          budgetItemCount={6}
          milestoneCount={7}
          vendorCount={8}
        />
        <div
          id="tabpanel-ai_plan"
          role="tabpanel"
          aria-labelledby="tab-ai_plan"
          tabIndex={0}
        >
          <p>AI Blueprint</p>
        </div>
        <div
          id="tabpanel-budget"
          role="tabpanel"
          aria-labelledby="tab-budget"
          tabIndex={0}
        >
          <p>Budget</p>
        </div>
        <div
          id="tabpanel-timeline"
          role="tabpanel"
          aria-labelledby="tab-timeline"
          tabIndex={0}
        >
          <p>Timeline</p>
        </div>
        <div
          id="tabpanel-vendors"
          role="tabpanel"
          aria-labelledby="tab-vendors"
          tabIndex={0}
        >
          <p>Vendors</p>
        </div>
      </div>,
    );

    const results = await axe(container);
    expect(results.violations).toEqual([]);

    // Keyboard-only navigation tests
    const tab1 = screen.getByRole("tab", { name: /GenAI Blueprint/i });
    fireEvent.keyDown(tab1, { key: "ArrowRight" });
    expect(onTabChange).toHaveBeenCalledWith("budget");

    fireEvent.keyDown(tab1, { key: "End" });
    expect(onTabChange).toHaveBeenCalledWith("vendors");

    fireEvent.keyDown(tab1, { key: "Home" });
    expect(onTabChange).toHaveBeenCalledWith("ai_plan");
  });

  it("verifies BudgetTracker (Chart + Data Table) has zero accessibility violations", async () => {
    const mockItems = [
      {
        id: "b-1",
        category: "venue_catering" as const,
        name: "Banquet Hall",
        allocatedAmount: 5000,
        actualAmount: 4500,
        isPaid: true,
      },
    ];

    const { container } = render(
      <BudgetTracker
        summary={mockBudgetSummary}
        items={mockItems}
        onUpdateItemActual={vi.fn()}
        onTogglePaid={vi.fn()}
      />,
    );

    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it("verifies TimelineView has zero accessibility violations", async () => {
    const mockMilestones = [
      {
        id: "m-1",
        phase: "concept_budget" as const,
        title: "Book Venue",
        description: "Secure main ceremony and reception venue",
        priority: "high" as const,
        targetDaysBeforeEvent: 240,
        targetDate: "2027-02-15",
        isCompleted: false,
      },
    ];

    const mockRunOfShow = [
      {
        id: "ros-1",
        time: "09:00",
        activity: "Vendor Setup & Florals",
        leadPerson: "Coordinator",
        location: "Grand Ballroom",
        isCompleted: false,
      },
    ];

    const { container } = render(
      <TimelineView
        milestones={mockMilestones}
        runOfShow={mockRunOfShow}
        onToggleMilestone={vi.fn()}
        onToggleRunOfShowItem={vi.fn()}
      />,
    );

    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it("verifies VendorChecklistView has zero accessibility violations", async () => {
    const mockVendors = [
      {
        id: "v-1",
        category: "catering" as const,
        title: "Catering Vendor",
        vendorName: "Artisanal Kitchen",
        contactInfo: "info@example.com",
        estimatedCost: 8000,
        status: "booked" as const,
        contractSigned: true,
        notes: "Deposit paid",
      },
    ];

    const { container } = render(
      <VendorChecklistView
        checklist={mockVendors}
        onUpdateStatus={vi.fn()}
        onUpdateDetails={vi.fn()}
      />,
    );

    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it("verifies AiIdeasPanel has zero accessibility violations in normal and loading states", async () => {
    const mockSuggestions = {
      overview: "Strategic wedding overview",
      themeIdeas: [
        {
          title: "Vineyard Gold",
          description: "Rustic elegance",
          colorPalette: ["#FAF6F0", "#3D5A40"],
        },
      ],
      customTimelineTips: [],
      budgetOptimizationTips: [
        {
          category: "Decor",
          savingStrategy: "Repurpose flowers",
          estimatedImpact: "$400",
        },
      ],
      contingencyPlan: {
        riskScenario: "Rain",
        mitigation: "Tent rental",
        backupOption: "Indoor hall",
      },
      activities: [
        {
          name: "Wine Tasting",
          description: "Vineyard flight",
          targetAudience: "All",
          durationMinutes: 45,
        },
      ],
      menus: [],
      decorations: [],
    };

    // Normal state
    const { container: containerNormal } = render(
      <AiIdeasPanel
        suggestions={mockSuggestions}
        isLoading={false}
        onRegenerate={vi.fn()}
      />,
    );
    const resultsNormal = await axe(containerNormal);
    expect(resultsNormal.violations).toEqual([]);

    // Loading state with role="status"
    const { container: containerLoading } = render(
      <AiIdeasPanel
        suggestions={mockSuggestions}
        isLoading={true}
        onRegenerate={vi.fn()}
      />,
    );
    const resultsLoading = await axe(containerLoading);
    expect(resultsLoading.violations).toEqual([]);
  });

  it("verifies ChatAssistant has zero accessibility violations", async () => {
    const { container } = render(
      <ChatAssistant
        currentProfile={mockProfile}
        budgetSummary={mockBudgetSummary}
        bookedVendorsCount={2}
        completedMilestonesCount={3}
      />,
    );

    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it("verifies EventWizard has zero accessibility violations", async () => {
    const { container } = render(
      <EventWizard
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        isSubmitting={false}
      />,
    );

    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it("verifies ClearDataModal has zero accessibility violations", async () => {
    const { container } = render(
      <ClearDataModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it("verifies PrivacyNotice has zero accessibility violations", async () => {
    const { container } = render(<PrivacyNotice />);

    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
