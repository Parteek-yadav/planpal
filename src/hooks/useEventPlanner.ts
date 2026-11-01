import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import {
  EventType,
  EventPlanInput,
  Constraints,
  BudgetItem,
  TimelineMilestone,
  RunOfShowItem,
  VendorChecklistItem,
  VendorStatus,
  BudgetSummary,
  calculateDefaultBudgetAllocation,
  summarizeBudget,
  updateBudgetItem,
  generateMilestones,
  generateDefaultRunOfShow,
  toggleMilestoneStatus,
  generateVendorChecklist,
  updateVendorStatus,
  updateVendorDetails,
} from "@/domain";
import {
  AiPlanSuggestion,
  loadStoredPlan,
  saveStoredPlan,
  clearStoredPlan,
  exportPlanToJson,
  triggerPrintPlan,
} from "@/services";
import { apiClient } from "@/utils/apiClient";

export type TabKey = "ai_plan" | "budget" | "timeline" | "vendors";
export type ColorTheme = "light" | "dark" | "system";

export interface ActiveEventState {
  readonly eventType: EventType;
  readonly title: string;
  readonly date: string;
  readonly guestCount: number;
  readonly totalBudget: number;
  readonly location: string;
  readonly theme?: string;
  readonly constraints: Constraints;
  readonly budgetItems: readonly BudgetItem[];
  readonly milestones: readonly TimelineMilestone[];
  readonly runOfShow: readonly RunOfShowItem[];
  readonly vendors: readonly VendorChecklistItem[];
  readonly aiSuggestions: AiPlanSuggestion;
}

export function createPresetState(eventType: EventType): ActiveEventState {
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
          colorPalette: ["#3D5A40", "#E8D8C8", "#B5835A", "#FAF6F0"],
        },
        {
          title: "Modern Champagne & Rose",
          description:
            "Monochromatic cream florals, gold tableware accents, tapered candles, and sheer draping.",
          colorPalette: ["#F9F4F0", "#D4AF37", "#E0BFB8", "#1F2421"],
        },
      ],
      customTimelineTips: [
        {
          title: "Golden Hour Photo Buffer",
          tip: "Schedule couple portraits 45 minutes prior to sunset during the vineyard cocktail transition.",
          phase: "Day-of Schedule",
        },
        {
          title: "Acoustic Noise Curfew",
          tip: "Transition amplified live music indoors by 22:00 in accordance with Napa County ordinances.",
          phase: "Vendor Booking",
        },
      ],
      budgetOptimizationTips: [
        {
          category: "Floral & Decor",
          savingStrategy:
            "Repurpose ceremony arbor florals onto the bridal party head table for the reception.",
          estimatedImpact: "Saves $500 - $900",
        },
        {
          category: "Stationery",
          savingStrategy:
            "Opt for digital RSVP tracking alongside elegant printed ceremony invitations.",
          estimatedImpact: "Saves $250 - $400",
        },
      ],
      contingencyPlan: {
        riskScenario: "Unseasonal rain or wind in outdoor ceremony vineyard lawn",
        mitigation:
          "Include a rain clause with local marquee supplier with confirmation cutoff 72 hours prior.",
        backupOption:
          "Relocate ceremony to the winery barrel cellar with candlelight aisle illumination.",
      },
      activities: [
        {
          name: "Golden Hour Vineyard Portraits & Acoustic Strings",
          description:
            "Guests enjoy signature wine tasting while couple portraits take place.",
          targetAudience: "All Guests",
          durationMinutes: 60,
        },
        {
          name: "Interactive Audio Guestbook Station",
          description: "Guests record voicemail blessings using a vintage rotary phone.",
          targetAudience: "All Guests",
          durationMinutes: 180,
        },
      ],
      menus: [
        {
          course: "Appetizer Station",
          dishName: "Artisanal Canapés & Bruschetta",
          description:
            "Charred heirloom tomatoes with basil glaze and plant-based ricotta.",
          dietaryTags: ["vegan", "gluten_free"],
        },
        {
          course: "Plated Entrée",
          dishName: "Wild Mushroom & Truffle Risotto",
          description: "Arborio rice with roasted chanterelles and crispy leeks.",
          dietaryTags: ["vegetarian", "gluten_free"],
        },
      ],
      decorations: [
        {
          focalArea: "Ceremony Archway",
          materials: "Natural birch wood, draped champagne linen, preserved eucalyptus",
          diyBudgetFriendlyTip:
            "Move ceremony archway florals to the reception head table.",
        },
        {
          focalArea: "Guest Table Centerpieces",
          materials: "Amber glass bud vases, tapered LED candles, scattered olive sprigs",
          diyBudgetFriendlyTip:
            "Cluster varying heights of thrifted glassware with tea lights.",
        },
      ],
    };

    return {
      eventType: "wedding",
      title: "Sarah & David's Vineyard Wedding",
      date,
      guestCount: 130,
      totalBudget,
      location: "St. Helena, Napa Valley, CA",
      theme: "Tuscan Sunlit Vineyard",
      constraints: {
        dietary: ["vegan", "gluten_free"],
        accessibility: ["wheelchair_accessible"],
        kidFriendly: false,
      },
      budgetItems,
      milestones,
      runOfShow,
      vendors,
      aiSuggestions,
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
        'An energetic celebration for "Leo\'s 10th Birthday Adventure" in Austin, TX, accommodating 35 guests within a $2,500 budget ($71/guest). Includes family-friendly lawn games.',
      themeIdeas: [
        {
          title: "Retro Arcade & Pixel Glow",
          description:
            "8-bit graphics, custom neon glow sticks, joystick cake topper, and retro synth arcade tunes.",
          colorPalette: ["#00F5D4", "#7B2CBF", "#F72585", "#101018"],
        },
        {
          title: "Outdoor Forest Explorer Quest",
          description:
            "Scavenger hunt maps, compass favors, campfire s'mores station, and canvas explorer tents.",
          colorPalette: ["#2B9348", "#E9D8A6", "#9B2226", "#001219"],
        },
      ],
      customTimelineTips: [
        {
          title: "Staggered Games Timing",
          tip: "Keep high-energy group activities under 30 minutes to maintain high engagement.",
          phase: "Day-of Schedule",
        },
        {
          title: "Cake Spotlight",
          tip: "Bring out cake directly following the main tournament awards ceremony.",
          phase: "Day-of Schedule",
        },
      ],
      budgetOptimizationTips: [
        {
          category: "Decor & Favors",
          savingStrategy:
            "Build an arcade photo booth backdrop using balloons rather than rented cardboard stands.",
          estimatedImpact: "Saves $150 - $250",
        },
        {
          category: "Catering",
          savingStrategy:
            "Order artisanal sheet pizzas and a DIY slider bar rather than individual catering boxes.",
          estimatedImpact: "Saves $200 - $400",
        },
      ],
      contingencyPlan: {
        riskScenario: "Sudden thunderstorm impacting outdoor party lawn",
        mitigation:
          "Reserve indoor community center auxiliary game room as backup venue.",
        backupOption: "Pivot to indoor VR arcade tournament and board game stations.",
      },
      activities: [
        {
          name: "Pixel Scavenger Hunt",
          description: "Kids solve 8-bit riddles hidden throughout the party space.",
          targetAudience: "Kids & Families",
          durationMinutes: 45,
        },
        {
          name: "Retro Gaming Tournament",
          description: "Friendly Mario Kart & arcade rounds with medal prizes.",
          targetAudience: "All Ages",
          durationMinutes: 60,
        },
      ],
      menus: [
        {
          course: "Main Buffet",
          dishName: "Artisanal Slider & Flatbread Station",
          description: "Mini burgers, veggie flatbreads, and sweet potato fries.",
          dietaryTags: ["nut_free"],
        },
        {
          course: "Dessert Bar",
          dishName: "Pixel Arcade Cake & Ice Cream Cups",
          description: "Vanilla bean cake with pixel topper and dairy-free fruit pops.",
          dietaryTags: ["dairy_free"],
        },
      ],
      decorations: [
        {
          focalArea: "Entrance Photo Wall",
          materials: "Neon neon balloon arch, foil tinsel curtains, LED pixel sign",
          diyBudgetFriendlyTip:
            "Assemble balloon arches with an electric pump 1 day prior.",
        },
        {
          focalArea: "Dessert Plinth",
          materials: "Black tablecloth, neon glow wire, retro arcade marquee signs",
          diyBudgetFriendlyTip:
            "Repurpose cardboard boxes painted with 8-bit pixel patterns.",
        },
      ],
    };

    return {
      eventType: "birthday",
      title: "Leo's 10th Birthday Adventure",
      date,
      guestCount: 35,
      totalBudget,
      location: "Zilker Park Clubhouse, Austin, TX",
      theme: "Retro Arcade & Pixel Glow",
      constraints: {
        dietary: ["nut_free"],
        accessibility: [],
        kidFriendly: true,
      },
      budgetItems,
      milestones,
      runOfShow,
      vendors,
      aiSuggestions,
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
        colorPalette: ["#1B5E20", "#F57F17", "#0277BD", "#FAFAFA"],
      },
      {
        title: "Artisans in the Park",
        description:
          "Local craft stalls, chalk art walkway, interactive mural painting, and community folk band.",
        colorPalette: ["#E76F51", "#2A9D8F", "#E9C46A", "#264653"],
      },
    ],
    customTimelineTips: [
      {
        title: "Staggered Volunteer Shifts",
        tip: "Divide volunteer shifts into 2-hour rotations to keep team members energized.",
        phase: "Volunteer Operations",
      },
      {
        title: "Municipal Sound Permitting",
        tip: "Ensure all live audio sound checks conclude by 09:15 before public admission.",
        phase: "Permits & Tech Check",
      },
    ],
    budgetOptimizationTips: [
      {
        category: "Equipment & Stage",
        savingStrategy:
          "Partner with local high school for audio PA system and canopy loan agreements.",
        estimatedImpact: "Saves $800 - $1,500",
      },
      {
        category: "Promotion",
        savingStrategy:
          "Distribute announcements via municipal newsletters and neighborhood associations.",
        estimatedImpact: "Saves $400 - $800",
      },
    ],
    contingencyPlan: {
      riskScenario: "Extreme summer heat advisory exceeding 95°F",
      mitigation:
        "Erect 4 additional misting tents and distribute complimentary electrolyte water bottles.",
      backupOption:
        "Open adjacent air-conditioned community recreation center as public cooling station.",
    },
    activities: [
      {
        name: "Community Lawn Games & Giant Jenga",
        description:
          "Open play cornhole, giant connect-four, and frisbee on the central lawn.",
        targetAudience: "Families & Kids",
        durationMinutes: 180,
      },
      {
        name: "Neighborhood Talent & Cultural Showcase",
        description:
          "Local acoustic musicians, school choirs, and community dance performers.",
        targetAudience: "All Community Members",
        durationMinutes: 120,
      },
    ],
    menus: [
      {
        course: "Food Pavilion",
        dishName: "Local Food Truck Showcase",
        description:
          "Curated partner food trucks offering diverse, affordable neighborhood bites.",
        dietaryTags: ["vegetarian", "vegan", "halal"],
      },
      {
        course: "Hydration Stations",
        dishName: "Infused Water & Seasonal Fruit Slices",
        description: "Complimentary citrus water and watermelon wedges for attendees.",
        dietaryTags: ["vegan", "gluten_free", "nut_free"],
      },
    ],
    decorations: [
      {
        focalArea: "Main Welcome & Info Tent",
        materials:
          "Burlap bunting, neighborhood landmark banners, colorful chalkboard schedules",
        diyBudgetFriendlyTip:
          "Invite local art students to illustrate chalkboard signage.",
      },
      {
        focalArea: "Central Gathering Pavilion",
        materials:
          "Overhead triangular pennant flags, solar bistro string lights, hay bale seating",
        diyBudgetFriendlyTip:
          "Borrow hay bales or picnic benches from the community recreation warehouse.",
      },
    ],
  };

  return {
    eventType: "community",
    title: "Oakridge Summer Festival",
    date,
    guestCount: 600,
    totalBudget,
    location: "Oakridge Park & Pavilion, Portland, OR",
    theme: "Roots & Green Community Harvest",
    constraints: {
      dietary: ["vegetarian", "vegan"],
      accessibility: ["wheelchair_accessible", "quiet_space"],
      kidFriendly: true,
    },
    budgetItems,
    milestones,
    runOfShow,
    vendors,
    aiSuggestions,
  };
}

export function useEventPlanner() {
  const [eventState, setEventState] = useState<ActiveEventState>(() =>
    createPresetState("wedding"),
  );
  const [activeTab, setActiveTab] = useState<TabKey>("ai_plan");
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [theme, setThemeState] = useState<ColorTheme>("system");
  const [, startTransition] = useTransition();

  const isLoadedFromStorageRef = useRef(false);

  // Load persisted plan on client mount with safe corruption fallback
  useEffect(() => {
    if (!isLoadedFromStorageRef.current) {
      const stored = loadStoredPlan(createPresetState("wedding"));
      setEventState(stored);
      isLoadedFromStorageRef.current = true;
    }
  }, []);

  // Persist plan to localStorage whenever updated
  useEffect(() => {
    if (isLoadedFromStorageRef.current) {
      saveStoredPlan(eventState);
    }
  }, [eventState]);

  // Initialize and synchronize color theme
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = (currentTheme: ColorTheme) => {
      if (currentTheme === "system") {
        root.setAttribute("data-theme", mediaQuery.matches ? "dark" : "light");
      } else {
        root.setAttribute("data-theme", currentTheme);
      }
    };

    applyTheme(theme);

    const handleSystemChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, [theme]);

  const setTheme = useCallback((newTheme: ColorTheme) => {
    setThemeState(newTheme);
  }, []);

  const budgetSummary: BudgetSummary = summarizeBudget(
    eventState.totalBudget,
    eventState.budgetItems,
  );

  const handleSwitchPreset = useCallback((type: EventType) => {
    startTransition(() => {
      setEventState(createPresetState(type));
    });
  }, []);

  const handleUpdateItemActual = useCallback((id: string, actualAmount: number) => {
    setEventState((prev) => ({
      ...prev,
      budgetItems: updateBudgetItem(prev.budgetItems, { id, actualAmount }),
    }));
  }, []);

  const handleTogglePaid = useCallback((id: string) => {
    setEventState((prev) => {
      const target = prev.budgetItems.find((item) => item.id === id);
      if (!target) return prev;
      return {
        ...prev,
        budgetItems: updateBudgetItem(prev.budgetItems, {
          id,
          isPaid: !target.isPaid,
        }),
      };
    });
  }, []);

  const handleToggleMilestone = useCallback((id: string) => {
    setEventState((prev) => ({
      ...prev,
      milestones: toggleMilestoneStatus(prev.milestones, id),
    }));
  }, []);

  const handleToggleRunOfShow = useCallback((id: string) => {
    setEventState((prev) => ({
      ...prev,
      runOfShow: prev.runOfShow.map((item) =>
        item.id === id ? { ...item, isCompleted: !item.isCompleted } : item,
      ),
    }));
  }, []);

  const handleUpdateVendorStatus = useCallback((id: string, status: VendorStatus) => {
    setEventState((prev) => ({
      ...prev,
      vendors: updateVendorStatus(prev.vendors, id, status),
    }));
  }, []);

  const handleUpdateVendorDetails = useCallback(
    (id: string, patch: Partial<VendorChecklistItem>) => {
      setEventState((prev) => ({
        ...prev,
        vendors: updateVendorDetails(prev.vendors, { id, ...patch }),
      }));
    },
    [],
  );

  const handleRegenerateAi = useCallback(async () => {
    setIsAiLoading(true);
    try {
      const data = await apiClient.request<{
        aiSuggestions: AiPlanSuggestion;
      }>("/api/events/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: eventState.eventType,
          title: eventState.title,
          date: eventState.date,
          guestCount: eventState.guestCount,
          totalBudget: eventState.totalBudget,
          location: eventState.location,
          theme: eventState.theme,
          constraints: eventState.constraints,
        }),
        dedupeKey: `regenerate-${eventState.eventType}`,
        cancelPrevious: true,
      });

      setEventState((prev) => ({
        ...prev,
        aiSuggestions: data.aiSuggestions,
      }));
    } catch {
      // Keep existing suggestions on error
    } finally {
      setIsAiLoading(false);
    }
  }, [eventState]);

  const handleSubmitWizardPlan = useCallback(async (input: EventPlanInput) => {
    setIsAiLoading(true);
    try {
      const data = await apiClient.request<{
        eventType: EventType;
        title: string;
        date: string;
        guestCount: number;
        totalBudget: number;
        location: string;
        theme?: string;
        constraints: Constraints;
        budget: { items: BudgetItem[] };
        timeline: {
          milestones: TimelineMilestone[];
          runOfShow: RunOfShowItem[];
        };
        vendors: VendorChecklistItem[];
        aiSuggestions: AiPlanSuggestion;
      }>("/api/events/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        dedupeKey: "wizard-submission",
        cancelPrevious: true,
      });

      setEventState({
        eventType: data.eventType,
        title: data.title,
        date: data.date,
        guestCount: data.guestCount,
        totalBudget: data.totalBudget,
        location: data.location,
        theme: data.theme,
        constraints: data.constraints || input.constraints,
        budgetItems: data.budget.items,
        milestones: data.timeline.milestones,
        runOfShow: data.timeline.runOfShow,
        vendors: data.vendors,
        aiSuggestions: data.aiSuggestions,
      });
      setIsWizardOpen(false);
      setActiveTab("ai_plan");
      return;
    } catch {
      // Fallback
    }

    // Client fallback
    const budgetItems = calculateDefaultBudgetAllocation(
      input.eventType,
      input.totalBudget,
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
      constraints: input.constraints,
      budgetItems,
      milestones,
      runOfShow,
      vendors,
      aiSuggestions: presetFallback.aiSuggestions,
    });
    setIsWizardOpen(false);
    setActiveTab("ai_plan");
    setIsAiLoading(false);
  }, []);

  const handleExportJson = useCallback(() => {
    return exportPlanToJson(eventState);
  }, [eventState]);

  const handlePrintPlan = useCallback(() => {
    triggerPrintPlan();
  }, []);

  const handleClearAllData = useCallback(() => {
    clearStoredPlan();
    setEventState(createPresetState("wedding"));
  }, []);

  const currentProfile: EventPlanInput = {
    eventType: eventState.eventType,
    title: eventState.title,
    date: eventState.date,
    guestCount: eventState.guestCount,
    totalBudget: eventState.totalBudget,
    location: eventState.location,
    theme: eventState.theme,
    constraints: eventState.constraints,
  };

  const bookedVendorsCount = eventState.vendors.filter(
    (v) => v.status === "booked",
  ).length;
  const completedMilestonesCount = eventState.milestones.filter(
    (m) => m.isCompleted,
  ).length;

  return {
    eventState,
    budgetSummary,
    currentProfile,
    bookedVendorsCount,
    completedMilestonesCount,
    activeTab,
    setActiveTab,
    isWizardOpen,
    setIsWizardOpen,
    isClearModalOpen,
    setIsClearModalOpen,
    isAiLoading,
    theme,
    setTheme,
    handleSwitchPreset,
    handleUpdateItemActual,
    handleTogglePaid,
    handleToggleMilestone,
    handleToggleRunOfShow,
    handleUpdateVendorStatus,
    handleUpdateVendorDetails,
    handleRegenerateAi,
    handleSubmitWizardPlan,
    handleExportJson,
    handlePrintPlan,
    handleClearAllData,
  };
}
