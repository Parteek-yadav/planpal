"use client";

import React, { useState, useTransition } from "react";
import {
  EventType,
  EventPlanInput,
  BudgetItem,
  TimelineMilestone,
  RunOfShowItem,
  VendorChecklistItem,
  calculateDefaultBudgetAllocation,
  summarizeBudget,
  updateBudgetItem,
  generateMilestones,
  generateDefaultRunOfShow,
  toggleMilestoneStatus,
  generateVendorChecklist,
  updateVendorStatus,
  updateVendorDetails
} from "@/domain";
import { AiPlanSuggestion } from "@/services";
import {
  Header,
  NavigationTabs,
  TabKey,
  AiIdeasPanel,
  BudgetTracker,
  TimelineView,
  VendorChecklistView,
  EventIntakeModal
} from "@/components";

interface ActiveEventState {
  readonly eventType: EventType;
  readonly title: string;
  readonly date: string;
  readonly guestCount: number;
  readonly totalBudget: number;
  readonly location: string;
  readonly theme?: string;
  readonly budgetItems: readonly BudgetItem[];
  readonly milestones: readonly TimelineMilestone[];
  readonly runOfShow: readonly RunOfShowItem[];
  readonly vendors: readonly VendorChecklistItem[];
  readonly aiSuggestions: AiPlanSuggestion;
}

/**
 * Builds initial mock state for an event archetype.
 *
 * @param eventType - Event archetype (wedding, birthday, community).
 * @returns Fully populated ActiveEventState object.
 */
function createPresetState(eventType: EventType): ActiveEventState {
  if (eventType === "wedding") {
    const totalBudget = 38000;
    const date = "2027-09-20";
    const budgetItems = calculateDefaultBudgetAllocation("wedding", totalBudget);
    const milestones = generateMilestones("wedding", date);
    const runOfShow = generateDefaultRunOfShow("wedding");
    const vendors = generateVendorChecklist("wedding");

    const aiSuggestions: AiPlanSuggestion = {
      overview:
        'A romantic vineyard wedding plan for "Sarah & David\'s Vineyard Wedding" in Napa Valley, CA, budgeted at $38,000 for 130 guests ($292/guest). Blends elegant olive-groove ceremony seating with celebratory sunset dinner.',
      themeIdeas: [
        {
          title: "Tuscan Sunlit Vineyard",
          description:
            "Rustic wood barrels, natural linen runners, wild olive branches, and ambient warm bistro lighting.",
          colorPalette: ["#3D5A40", "#E8D8C8", "#B5835A", "#FAF6F0"]
        },
        {
          title: "Modern Champagne & Rose",
          description:
            "Monochromatic cream florals, gold tableware accents, tapered candles, and sheer draping.",
          colorPalette: ["#F9F4F0", "#D4AF37", "#E0BFB8", "#1F2421"]
        }
      ],
      customTimelineTips: [
        {
          title: "Golden Hour Photo Buffer",
          tip: "Schedule couple portraits 45 minutes prior to sunset during the vineyard cocktail transition.",
          phase: "Day-of Schedule"
        },
        {
          title: "Acoustic Noise Curfew",
          tip: "Transition amplified live music indoors by 22:00 in accordance with Napa County ordinances.",
          phase: "Vendor Booking"
        }
      ],
      budgetOptimizationTips: [
        {
          category: "Floral & Decor",
          savingStrategy:
            "Repurpose ceremony arbor florals onto the bridal party head table for the reception.",
          estimatedImpact: "Saves $500 - $900"
        },
        {
          category: "Stationery",
          savingStrategy:
            "Opt for digital RSVP tracking alongside elegant printed ceremony invitations.",
          estimatedImpact: "Saves $250 - $400"
        }
      ],
      contingencyPlan: {
        riskScenario: "Unseasonal rain or wind in outdoor ceremony vineyard lawn",
        mitigation:
          "Include a rain clause with local marquee supplier with confirmation cutoff 72 hours prior.",
        backupOption:
          "Relocate ceremony to the winery barrel cellar with candlelight aisle illumination."
      }
    };

    return {
      eventType: "wedding",
      title: "Sarah & David's Vineyard Wedding",
      date,
      guestCount: 130,
      totalBudget,
      location: "St. Helena, Napa Valley, CA",
      theme: "Tuscan Sunlit Vineyard",
      budgetItems,
      milestones,
      runOfShow,
      vendors,
      aiSuggestions
    };
  }

  if (eventType === "birthday") {
    const totalBudget = 2500;
    const date = "2027-06-12";
    const budgetItems = calculateDefaultBudgetAllocation("birthday", totalBudget);
    const milestones = generateMilestones("birthday", date);
    const runOfShow = generateDefaultRunOfShow("birthday");
    const vendors = generateVendorChecklist("birthday");

    const aiSuggestions: AiPlanSuggestion = {
      overview:
        'An energetic celebration for "Leo\'s 10th Birthday Adventure" in Austin, TX, accommodating 35 guests within a $2,500 budget ($71/guest).',
      themeIdeas: [
        {
          title: "Retro Arcade & Pixel Glow",
          description:
            "8-bit graphics, custom neon glow sticks, joystick cake topper, and retro synth arcade tunes.",
          colorPalette: ["#00F5D4", "#7B2CBF", "#F72585", "#101018"]
        },
        {
          title: "Outdoor Forest Explorer Quest",
          description:
            "Scavenger hunt maps, compass favors, campfire s'mores station, and canvas explorer tents.",
          colorPalette: ["#2B9348", "#E9D8A6", "#9B2226", "#001219"]
        }
      ],
      customTimelineTips: [
        {
          title: "Staggered Games Timing",
          tip: "Keep high-energy group activities under 30 minutes to maintain high engagement.",
          phase: "Day-of Schedule"
        },
        {
          title: "Cake Spotlight",
          tip: "Bring out cake directly following the main tournament awards ceremony.",
          phase: "Day-of Schedule"
        }
      ],
      budgetOptimizationTips: [
        {
          category: "Decor & Favors",
          savingStrategy:
            "Build an arcade photo booth backdrop using balloons rather than rented cardboard stands.",
          estimatedImpact: "Saves $150 - $250"
        },
        {
          category: "Catering",
          savingStrategy:
            "Order artisanal sheet pizzas and a DIY slider bar rather than individual catering boxes.",
          estimatedImpact: "Saves $200 - $400"
        }
      ],
      contingencyPlan: {
        riskScenario: "Sudden thunderstorm impacting outdoor party lawn",
        mitigation:
          "Reserve indoor community center auxiliary game room as backup venue.",
        backupOption:
          "Pivot to indoor VR arcade tournament and board game stations."
      }
    };

    return {
      eventType: "birthday",
      title: "Leo's 10th Birthday Adventure",
      date,
      guestCount: 35,
      totalBudget,
      location: "Zilker Park Clubhouse, Austin, TX",
      theme: "Retro Arcade & Pixel Glow",
      budgetItems,
      milestones,
      runOfShow,
      vendors,
      aiSuggestions
    };
  }

  const totalBudget = 18000;
  const date = "2027-07-24";
  const budgetItems = calculateDefaultBudgetAllocation("community", totalBudget);
  const milestones = generateMilestones("community", date);
  const runOfShow = generateDefaultRunOfShow("community");
  const vendors = generateVendorChecklist("community");

  const aiSuggestions: AiPlanSuggestion = {
    overview:
      'A community-wide festival plan for "Oakridge Summer Festival" in Portland, OR, welcoming 600 attendees with an allocated municipal budget of $18,000.',
    themeIdeas: [
      {
        title: "Roots & Green Community Harvest",
        description:
          "Open-air pavilion layout featuring neighborhood maker booths, acoustic stage, and lawn games.",
        colorPalette: ["#1B5E20", "#F57F17", "#0277BD", "#FAFAFA"]
      },
      {
        title: "Artisans in the Park",
        description:
          "Local craft stalls, chalk art walkway, interactive mural painting, and community folk band.",
        colorPalette: ["#E76F51", "#2A9D8F", "#E9C46A", "#264653"]
      }
    ],
    customTimelineTips: [
      {
        title: "Staggered Volunteer Shifts",
        tip: "Divide volunteer shifts into 2-hour rotations to keep team members energized.",
        phase: "Volunteer Operations"
      },
      {
        title: "Municipal Sound Permitting",
        tip: "Ensure all live audio sound checks conclude by 09:15 before public admission.",
        phase: "Permits & Tech Check"
      }
    ],
    budgetOptimizationTips: [
      {
        category: "Equipment & Stage",
        savingStrategy:
          "Partner with local high school for audio PA system and canopy loan agreements.",
        estimatedImpact: "Saves $800 - $1,500"
      },
      {
        category: "Promotion",
        savingStrategy:
          "Distribute announcements via municipal newsletters and neighborhood associations.",
        estimatedImpact: "Saves $400 - $800"
      }
    ],
    contingencyPlan: {
      riskScenario: "Extreme summer heat advisory exceeding 95°F",
      mitigation:
        "Erect 4 additional misting tents and distribute complimentary electrolyte water bottles.",
      backupOption:
        "Open adjacent air-conditioned community recreation center as public cooling station."
    }
  };

  return {
    eventType: "community",
    title: "Oakridge Summer Festival",
    date,
    guestCount: 600,
    totalBudget,
    location: "Oakridge Park & Pavilion, Portland, OR",
    theme: "Roots & Green Community Harvest",
    budgetItems,
    milestones,
    runOfShow,
    vendors,
    aiSuggestions
  };
}

/**
 * Main application page coordinating presentation components,
 * accessible tab switches, and domain logic delegations.
 */
export default function PlanPalApp(): React.JSX.Element {
  const [eventState, setEventState] = useState<ActiveEventState>(() =>
    createPresetState("wedding")
  );
  const [activeTab, setActiveTab] = useState<TabKey>("ai_plan");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  const budgetSummary = summarizeBudget(
    eventState.totalBudget,
    eventState.budgetItems
  );

  const handleSwitchPreset = (type: EventType) => {
    startTransition(() => {
      setEventState(createPresetState(type));
    });
  };

  const handleUpdateItemActual = (id: string, actualAmount: number) => {
    const updated = updateBudgetItem(eventState.budgetItems, {
      id,
      actualAmount
    });
    setEventState((prev) => ({ ...prev, budgetItems: updated }));
  };

  const handleTogglePaid = (id: string) => {
    const target = eventState.budgetItems.find((item) => item.id === id);
    if (!target) return;
    const updated = updateBudgetItem(eventState.budgetItems, {
      id,
      isPaid: !target.isPaid
    });
    setEventState((prev) => ({ ...prev, budgetItems: updated }));
  };

  const handleToggleMilestone = (id: string) => {
    const updated = toggleMilestoneStatus(eventState.milestones, id);
    setEventState((prev) => ({ ...prev, milestones: updated }));
  };

  const handleToggleRunOfShow = (id: string) => {
    const updated = eventState.runOfShow.map((item) =>
      item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
    );
    setEventState((prev) => ({ ...prev, runOfShow: updated }));
  };

  const handleUpdateVendorStatus = (
    id: string,
    status: Parameters<typeof updateVendorStatus>[2]
  ) => {
    const updated = updateVendorStatus(eventState.vendors, id, status);
    setEventState((prev) => ({ ...prev, vendors: updated }));
  };

  const handleUpdateVendorDetails = (
    id: string,
    patch: Partial<VendorChecklistItem>
  ) => {
    const updated = updateVendorDetails(eventState.vendors, { id, ...patch });
    setEventState((prev) => ({ ...prev, vendors: updated }));
  };

  const handleRegenerateAi = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/events/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: eventState.eventType,
          title: eventState.title,
          date: eventState.date,
          guestCount: eventState.guestCount,
          totalBudget: eventState.totalBudget,
          location: eventState.location,
          theme: eventState.theme
        })
      });

      if (response.ok) {
        const data = (await response.json()) as {
          aiSuggestions: AiPlanSuggestion;
        };
        setEventState((prev) => ({
          ...prev,
          aiSuggestions: data.aiSuggestions
        }));
      }
    } catch {
      // Keep existing suggestions in case of error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitNewPlan = async (input: EventPlanInput) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/events/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
      });

      if (response.ok) {
        const data = (await response.json()) as {
          eventType: EventType;
          title: string;
          date: string;
          guestCount: number;
          totalBudget: number;
          location: string;
          theme?: string;
          budget: { items: BudgetItem[] };
          timeline: {
            milestones: TimelineMilestone[];
            runOfShow: RunOfShowItem[];
          };
          vendors: VendorChecklistItem[];
          aiSuggestions: AiPlanSuggestion;
        };

        setEventState({
          eventType: data.eventType,
          title: data.title,
          date: data.date,
          guestCount: data.guestCount,
          totalBudget: data.totalBudget,
          location: data.location,
          theme: data.theme,
          budgetItems: data.budget.items,
          milestones: data.timeline.milestones,
          runOfShow: data.timeline.runOfShow,
          vendors: data.vendors,
          aiSuggestions: data.aiSuggestions
        });
        setIsModalOpen(false);
      }
    } catch {
      // In offline/mock mode, construct client fallback
      const budgetItems = calculateDefaultBudgetAllocation(
        input.eventType,
        input.totalBudget
      );
      const milestones = generateMilestones(input.eventType, input.date);
      const runOfShow = generateDefaultRunOfShow(input.eventType);
      const vendors = generateVendorChecklist(input.eventType);
      const presetFallback = createPresetState(input.eventType);

      setEventState({
        eventType: input.eventType,
        title: input.title,
        date: input.date,
        guestCount: input.guestCount,
        totalBudget: input.totalBudget,
        location: input.location,
        theme: input.theme,
        budgetItems,
        milestones,
        runOfShow,
        vendors,
        aiSuggestions: presetFallback.aiSuggestions
      });
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main id="main-content" className="app-container">
      <Header
        currentEventType={eventState.eventType}
        eventTitle={eventState.title}
        eventDate={eventState.date}
        guestCount={eventState.guestCount}
        totalBudget={eventState.totalBudget}
        onOpenNewEventModal={() => setIsModalOpen(true)}
        onSwitchPreset={handleSwitchPreset}
      />

      <NavigationTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        budgetItemCount={eventState.budgetItems.length}
        milestoneCount={eventState.milestones.length}
        vendorCount={eventState.vendors.length}
      />

      {activeTab === "ai_plan" && (
        <AiIdeasPanel
          suggestions={eventState.aiSuggestions}
          isLoading={isSubmitting}
          onRegenerate={handleRegenerateAi}
        />
      )}

      {activeTab === "budget" && (
        <BudgetTracker
          summary={budgetSummary}
          items={eventState.budgetItems}
          onUpdateItemActual={handleUpdateItemActual}
          onTogglePaid={handleTogglePaid}
        />
      )}

      {activeTab === "timeline" && (
        <TimelineView
          milestones={eventState.milestones}
          runOfShow={eventState.runOfShow}
          onToggleMilestone={handleToggleMilestone}
          onToggleRunOfShowItem={handleToggleRunOfShow}
        />
      )}

      {activeTab === "vendors" && (
        <VendorChecklistView
          checklist={eventState.vendors}
          onUpdateStatus={handleUpdateVendorStatus}
          onUpdateDetails={handleUpdateVendorDetails}
        />
      )}

      <EventIntakeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitNewPlan}
        isSubmitting={isSubmitting}
      />
    </main>
  );
}
