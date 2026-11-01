import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  saveStoredPlan,
  loadStoredPlan,
  clearStoredPlan,
  migratePlan,
  exportPlanToJson,
  STORAGE_KEY,
  CURRENT_STORAGE_VERSION,
  ActiveEventState
} from "./storageService";

describe("Storage Service & Versioned Migrations", () => {
  let mockStorageStore: Record<string, string> = {};

  const mockStorage: Storage = {
    getItem: vi.fn((key: string) => mockStorageStore[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      mockStorageStore[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorageStore[key];
    }),
    clear: vi.fn(() => {
      mockStorageStore = {};
    }),
    length: 0,
    key: vi.fn(() => null)
  };

  const sampleValidPlan: ActiveEventState = {
    eventType: "wedding",
    title: "Emma & James Vineyard Wedding",
    date: "2027-08-15",
    guestCount: 120,
    totalBudget: 35000,
    location: "Sonoma, CA",
    theme: "Rustic Vineyard",
    constraints: {
      dietary: ["vegan"],
      accessibility: ["wheelchair_accessible"],
      kidFriendly: false
    },
    budgetItems: [
      {
        id: "b-1",
        category: "venue_catering",
        name: "Vineyard Estate",
        allocatedAmount: 18000,
        actualAmount: 17500,
        isPaid: true
      }
    ],
    milestones: [
      {
        id: "m-1",
        phase: "concept_budget",
        title: "Secure Venue",
        description: "Sign estate lease",
        priority: "high",
        targetDaysBeforeEvent: 200,
        targetDate: "2027-01-27",
        isCompleted: true
      }
    ],
    runOfShow: [
      {
        id: "ros-1",
        time: "15:00",
        activity: "Ceremony Welcome",
        leadPerson: "Officiant",
        location: "Arbor Lawn",
        isCompleted: false
      }
    ],
    vendors: [
      {
        id: "v-1",
        category: "venue",
        title: "Estate Venue",
        vendorName: "Sonoma Grove",
        status: "booked",
        estimatedCost: 18000,
        contactInfo: "sonoma@example.com",
        contractSigned: true,
        notes: "Deposit secured"
      }
    ],
    aiSuggestions: {
      overview: "Vineyard sunset celebration",
      themeIdeas: [
        {
          title: "Warm Earth Tones",
          description: "Terracotta and olive linens",
          colorPalette: ["#FAF6F0", "#3D5A40", "#B5835A"]
        },
        {
          title: "Sunlit Rose",
          description: "Soft blush and brass",
          colorPalette: ["#F9F4F0", "#D4AF37", "#E0BFB8"]
        }
      ],
      customTimelineTips: [
        {
          title: "Golden Hour Photos",
          tip: "Take photos at 18:30",
          phase: "Day-of"
        },
        {
          title: "Acoustic Transition",
          tip: "Switch music indoors by 22:00",
          phase: "Evening"
        }
      ],
      budgetOptimizationTips: [
        {
          category: "Decor",
          savingStrategy: "Repurpose flowers",
          estimatedImpact: "Saves $500"
        },
        {
          category: "Bar",
          savingStrategy: "Offer local wine",
          estimatedImpact: "Saves $400"
        }
      ],
      contingencyPlan: {
        riskScenario: "High winds",
        mitigation: "Secure marquee sides",
        backupOption: "Indoor wine cellar"
      },
      activities: [
        {
          name: "Wine Tasting Tour",
          description: "Private tasting for guests",
          targetAudience: "Adults",
          durationMinutes: 60
        },
        {
          name: "Acoustic Lawn Set",
          description: "Live guitarist during cocktails",
          targetAudience: "All",
          durationMinutes: 90
        }
      ],
      menus: [
        {
          course: "Appetizer",
          dishName: "Bruschetta",
          description: "Heirloom tomatoes",
          dietaryTags: ["vegan"]
        },
        {
          course: "Main",
          dishName: "Truffle Risotto",
          description: "Wild mushrooms",
          dietaryTags: ["vegetarian"]
        }
      ],
      decorations: [
        {
          focalArea: "Archway",
          materials: "Birch and olive branches",
          diyBudgetFriendlyTip: "Move to reception table"
        },
        {
          focalArea: "Tables",
          materials: "Amber bud vases",
          diyBudgetFriendlyTip: "Use thrifted glassware"
        }
      ]
    }
  };

  const fallbackPlan: ActiveEventState = {
    ...sampleValidPlan,
    title: "Fallback Default Wedding"
  };

  beforeEach(() => {
    mockStorageStore = {};
    vi.clearAllMocks();
  });

  describe("Save and Load Happy Paths", () => {
    it("successfully saves and reloads a valid event plan with version envelope", () => {
      const saved = saveStoredPlan(sampleValidPlan, mockStorage);
      expect(saved).toBe(true);
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.stringContaining(`"version":${CURRENT_STORAGE_VERSION}`)
      );

      const loaded = loadStoredPlan(fallbackPlan, mockStorage);
      expect(loaded.title).toBe("Emma & James Vineyard Wedding");
      expect(loaded.totalBudget).toBe(35000);
      expect(loaded.guestCount).toBe(120);
    });

    it("returns fallback state when storage is empty", () => {
      const loaded = loadStoredPlan(fallbackPlan, mockStorage);
      expect(loaded.title).toBe("Fallback Default Wedding");
    });
  });

  describe("Corrupted Storage & Tampering Defense", () => {
    it("safely falls back to default state when storage contains malformed JSON", () => {
      mockStorageStore[STORAGE_KEY] = "{ corrupted-json: invalid <<<";

      const loaded = loadStoredPlan(fallbackPlan, mockStorage);
      expect(loaded.title).toBe("Fallback Default Wedding");
    });

    it("safely falls back when storage data contains invalid schema types (tampering)", () => {
      mockStorageStore[STORAGE_KEY] = JSON.stringify({
        version: 2,
        updatedAt: new Date().toISOString(),
        payload: {
          ...sampleValidPlan,
          totalBudget: -99999, // Invalid: negative budget
          guestCount: 0 // Invalid: min is 1
        }
      });

      const loaded = loadStoredPlan(fallbackPlan, mockStorage);
      expect(loaded.title).toBe("Fallback Default Wedding");
    });

    it("safely falls back when version number is missing or unrecognized", () => {
      mockStorageStore[STORAGE_KEY] = JSON.stringify({
        version: 999,
        payload: sampleValidPlan
      });

      const loaded = loadStoredPlan(fallbackPlan, mockStorage);
      expect(loaded.title).toBe("Fallback Default Wedding");
    });
  });

  describe("Versioned Migration (V1 -> V2)", () => {
    it("correctly migrates legacy Version 1 stored data to Version 2", () => {
      const legacyV1Payload = {
        eventType: "wedding",
        title: "Legacy Stored Wedding",
        date: "2027-09-10",
        guestCount: 80,
        totalBudget: 22000,
        location: "Oakland, CA",
        constraints: {
          dietary: ["gluten_free"],
          accessibility: [],
          kidFriendly: true
        },
        budgetItems: [
          {
            id: "legacy-b1",
            category: "venue_catering",
            name: "Community Hall",
            allocatedAmount: 10000,
            actualAmount: 9500
            // isPaid missing in V1 legacy
          }
        ],
        milestones: sampleValidPlan.milestones,
        runOfShow: sampleValidPlan.runOfShow,
        vendors: [
          {
            id: "legacy-v1",
            category: "venue",
            title: "Community Hall",
            vendorName: "Oakland Center",
            status: "booked",
            estimatedCost: 10000,
            contactInfo: "hall@example.com"
            // contractSigned missing in V1 legacy
          }
        ],
        aiSuggestions: sampleValidPlan.aiSuggestions
      };

      const legacyV1Storage = {
        version: 1,
        payload: legacyV1Payload
      };

      mockStorageStore[STORAGE_KEY] = JSON.stringify(legacyV1Storage);

      const loaded = loadStoredPlan(fallbackPlan, mockStorage);
      expect(loaded.title).toBe("Legacy Stored Wedding");
      expect(loaded.budgetItems[0].isPaid).toBe(false); // default filled
      expect(loaded.vendors[0].contractSigned).toBe(false); // default filled

      // Should automatically upgrade to V2 envelope in storage
      const reSaved = JSON.parse(mockStorageStore[STORAGE_KEY]);
      expect(reSaved.version).toBe(2);
      expect(reSaved.payload.title).toBe("Legacy Stored Wedding");
    });

    it("returns null in migratePlan when data is null or unparseable", () => {
      expect(migratePlan(null)).toBeNull();
      expect(migratePlan("not-an-object")).toBeNull();
      expect(migratePlan({ version: 1, payload: { invalid: true } })).toBeNull();
    });
  });

  describe("Clear Stored Plan", () => {
    it("removes storage key when clearStoredPlan is called", () => {
      saveStoredPlan(sampleValidPlan, mockStorage);
      expect(mockStorageStore[STORAGE_KEY]).toBeDefined();

      const cleared = clearStoredPlan(mockStorage);
      expect(cleared).toBe(true);
      expect(mockStorageStore[STORAGE_KEY]).toBeUndefined();
    });
  });

  describe("Export Plan to JSON", () => {
    it("generates valid exported JSON string with metadata", () => {
      const json = exportPlanToJson(sampleValidPlan);
      const parsed = JSON.parse(json);

      expect(parsed.planPalExportVersion).toBe("2.0.0");
      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.event.title).toBe("Emma & James Vineyard Wedding");
      expect(parsed.event.totalBudget).toBe(35000);
    });
  });
});
