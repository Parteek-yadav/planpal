import { describe, it, expect } from "vitest";
import {
  createEventProfileSchema,
  EventProfileSchema,
  validateEventProfile,
  safeValidateEventProfile,
  isValidCalendarDate,
  isDateInFuture,
} from "./eventProfile";

describe("eventProfile Domain Module", () => {
  const FIXED_NOW = new Date("2026-11-01T12:00:00.000Z");
  const testSchema = createEventProfileSchema(FIXED_NOW);

  const validWeddingInput = {
    title: "  Elena & Marcus Wedding  ",
    eventType: "wedding" as const,
    date: "2027-06-15",
    guestCount: 150,
    budget: 35000,
    location: "  Grand Oak Ballroom  ",
    theme: "  Rustic Elegance  ",
    description: "  A lovely summer evening celebration  ",
    notes: "  Check vegan dietary preferences  ",
  };

  describe("Validation & String Trimming", () => {
    it("successfully validates and trims all string fields", () => {
      const result = testSchema.parse(validWeddingInput);

      expect(result.title).toBe("Elena & Marcus Wedding");
      expect(result.location).toBe("Grand Oak Ballroom");
      expect(result.theme).toBe("Rustic Elegance");
      expect(result.description).toBe("A lovely summer evening celebration");
      expect(result.notes).toBe("Check vegan dietary preferences");
      expect(result.guestCount).toBe(150);
      expect(result.budget).toBe(35000);
      expect(result.eventType).toBe("wedding");
    });

    it("supports totalBudget and eventDate aliases interchangeably", () => {
      const aliasInput = {
        title: "Miles 30th Birthday",
        eventType: "birthday" as const,
        eventDate: "2027-04-20",
        guestCount: 40,
        totalBudget: 4000,
      };

      const result = testSchema.parse(aliasInput);
      expect(result.budget).toBe(4000);
      expect(result.totalBudget).toBe(4000);
      expect(result.date).toBe("2027-04-20");
      expect(result.eventDate).toBe("2027-04-20");
    });

    it("rejects empty title or title with only whitespace", () => {
      expect(() => testSchema.parse({ ...validWeddingInput, title: "" })).toThrow();

      expect(() => testSchema.parse({ ...validWeddingInput, title: "    " })).toThrow();
    });

    it("enforces title maximum length (100 characters)", () => {
      const exactly100 = "A".repeat(100);
      const parsed = testSchema.parse({ ...validWeddingInput, title: exactly100 });
      expect(parsed.title.length).toBe(100);

      const tooLong = "A".repeat(101);
      expect(() => testSchema.parse({ ...validWeddingInput, title: tooLong })).toThrow(
        /cannot exceed 100 characters/,
      );
    });

    it("enforces location length cap (120 characters)", () => {
      const exactly120 = "L".repeat(120);
      expect(
        testSchema.parse({ ...validWeddingInput, location: exactly120 }).location,
      ).toBe(exactly120);

      const tooLong121 = "L".repeat(121);
      expect(() =>
        testSchema.parse({ ...validWeddingInput, location: tooLong121 }),
      ).toThrow(/cannot exceed 120 characters/);
    });

    it("enforces theme length cap (80 characters)", () => {
      const exactly80 = "T".repeat(80);
      expect(testSchema.parse({ ...validWeddingInput, theme: exactly80 }).theme).toBe(
        exactly80,
      );

      const tooLong81 = "T".repeat(81);
      expect(() => testSchema.parse({ ...validWeddingInput, theme: tooLong81 })).toThrow(
        /cannot exceed 80 characters/,
      );
    });

    it("enforces description length cap (500 characters)", () => {
      const exactly500 = "D".repeat(500);
      expect(
        testSchema.parse({ ...validWeddingInput, description: exactly500 }).description,
      ).toBe(exactly500);

      const tooLong501 = "D".repeat(501);
      expect(() =>
        testSchema.parse({ ...validWeddingInput, description: tooLong501 }),
      ).toThrow(/cannot exceed 500 characters/);
    });

    it("enforces notes length cap (300 characters)", () => {
      const exactly300 = "N".repeat(300);
      expect(testSchema.parse({ ...validWeddingInput, notes: exactly300 }).notes).toBe(
        exactly300,
      );

      const tooLong301 = "N".repeat(301);
      expect(() => testSchema.parse({ ...validWeddingInput, notes: tooLong301 })).toThrow(
        /cannot exceed 300 characters/,
      );
    });
  });

  describe("Guest Count Boundary Values (1-5000)", () => {
    it("accepts minimum boundary guestCount of 1", () => {
      const parsed = testSchema.parse({ ...validWeddingInput, guestCount: 1 });
      expect(parsed.guestCount).toBe(1);
    });

    it("accepts maximum boundary guestCount of 5000", () => {
      const parsed = testSchema.parse({ ...validWeddingInput, guestCount: 5000 });
      expect(parsed.guestCount).toBe(5000);
    });

    it("rejects guestCount below boundary: 0", () => {
      expect(() => testSchema.parse({ ...validWeddingInput, guestCount: 0 })).toThrow(
        /at least 1/,
      );
    });

    it("rejects negative guest counts", () => {
      expect(() => testSchema.parse({ ...validWeddingInput, guestCount: -1 })).toThrow();
      expect(() =>
        testSchema.parse({ ...validWeddingInput, guestCount: -100 }),
      ).toThrow();
    });

    it("rejects guestCount exceeding upper boundary: 5001", () => {
      expect(() => testSchema.parse({ ...validWeddingInput, guestCount: 5001 })).toThrow(
        /cannot exceed 5,000/,
      );
    });

    it("rejects non-integer guest counts", () => {
      expect(() => testSchema.parse({ ...validWeddingInput, guestCount: 25.5 })).toThrow(
        /must be an integer/,
      );
      expect(() => testSchema.parse({ ...validWeddingInput, guestCount: NaN })).toThrow();
    });
  });

  describe("Budget Boundary Values (> 0)", () => {
    it("accepts positive minimum decimal budget (0.01)", () => {
      const parsed = testSchema.parse({ ...validWeddingInput, budget: 0.01 });
      expect(parsed.budget).toBe(0.01);
    });

    it("accepts large valid budgets within ceiling", () => {
      const parsed = testSchema.parse({ ...validWeddingInput, budget: 100000000 });
      expect(parsed.budget).toBe(100000000);
    });

    it("rejects budget of zero", () => {
      expect(() => testSchema.parse({ ...validWeddingInput, budget: 0 })).toThrow(
        /greater than 0/,
      );
    });

    it("rejects negative budgets", () => {
      expect(() => testSchema.parse({ ...validWeddingInput, budget: -0.01 })).toThrow(
        /greater than 0/,
      );
      expect(() => testSchema.parse({ ...validWeddingInput, budget: -5000 })).toThrow(
        /greater than 0/,
      );
    });

    it("rejects budgets above ceiling of 100,000,000", () => {
      expect(() => testSchema.parse({ ...validWeddingInput, budget: 100000001 })).toThrow(
        /cannot exceed \$100,000,000/,
      );
    });
  });

  describe("Event Date Future & Leap Year Enforcement", () => {
    it("accepts a date strictly in the future", () => {
      const parsed = testSchema.parse({ ...validWeddingInput, date: "2026-11-02" });
      expect(parsed.date).toBe("2026-11-02");
    });

    it("rejects an event date equal to reference today", () => {
      expect(() =>
        testSchema.parse({ ...validWeddingInput, date: "2026-11-01" }),
      ).toThrow(/must be in the future/);
    });

    it("rejects an event date in the past", () => {
      expect(() =>
        testSchema.parse({ ...validWeddingInput, date: "2026-10-31" }),
      ).toThrow(/must be in the future/);
      expect(() =>
        testSchema.parse({ ...validWeddingInput, date: "2025-01-01" }),
      ).toThrow(/must be in the future/);
    });

    it("accepts a valid leap day in a future leap year (2028-02-29)", () => {
      const parsed = testSchema.parse({ ...validWeddingInput, date: "2028-02-29" });
      expect(parsed.date).toBe("2028-02-29");
    });

    it("rejects an invalid leap day in a non-leap year (2027-02-29)", () => {
      expect(() =>
        testSchema.parse({ ...validWeddingInput, date: "2027-02-29" }),
      ).toThrow(/valid calendar date/);
    });

    it("rejects non-existent calendar dates (e.g. 2027-04-31, 2027-02-30)", () => {
      expect(() =>
        testSchema.parse({ ...validWeddingInput, date: "2027-04-31" }),
      ).toThrow(/valid calendar date/);
      expect(() =>
        testSchema.parse({ ...validWeddingInput, date: "2027-02-30" }),
      ).toThrow(/valid calendar date/);
      expect(() =>
        testSchema.parse({ ...validWeddingInput, date: "2027-13-01" }),
      ).toThrow(/valid calendar date/);
      expect(() =>
        testSchema.parse({ ...validWeddingInput, date: "invalid-date" }),
      ).toThrow();
    });
  });

  describe("Supported Event Types", () => {
    it("accepts all three supported event types: wedding, birthday, community", () => {
      const wedding = testSchema.parse({ ...validWeddingInput, eventType: "wedding" });
      expect(wedding.eventType).toBe("wedding");

      const birthday = testSchema.parse({ ...validWeddingInput, eventType: "birthday" });
      expect(birthday.eventType).toBe("birthday");

      const community = testSchema.parse({
        ...validWeddingInput,
        eventType: "community",
      });
      expect(community.eventType).toBe("community");
    });

    it("rejects unsupported event types", () => {
      expect(() =>
        testSchema.parse({
          ...validWeddingInput,
          eventType: "anniversary" as unknown as typeof validWeddingInput.eventType,
        }),
      ).toThrow();
      expect(() =>
        testSchema.parse({
          ...validWeddingInput,
          eventType: "corporate" as unknown as typeof validWeddingInput.eventType,
        }),
      ).toThrow();
    });
  });

  describe("Helper Functions & Pure Validation", () => {
    it("validates helper isValidCalendarDate correctly", () => {
      expect(isValidCalendarDate("2028-02-29")).toBe(true); // leap year
      expect(isValidCalendarDate("2027-02-29")).toBe(false); // not leap year
      expect(isValidCalendarDate("2000-02-29")).toBe(true); // 400-year leap year
      expect(isValidCalendarDate("1900-02-29")).toBe(false); // 100-year non leap year
      expect(isValidCalendarDate("2026-04-30")).toBe(true);
      expect(isValidCalendarDate("2026-04-31")).toBe(false); // April 31 does not exist
      expect(isValidCalendarDate("abc-de-fg")).toBe(false);
      expect(isValidCalendarDate("2026-00-15")).toBe(false);
      expect(isValidCalendarDate("2026-13-15")).toBe(false);
    });

    it("validates helper isDateInFuture correctly against reference dates", () => {
      const ref = new Date("2026-06-01T00:00:00.000Z");
      expect(isDateInFuture("2026-06-02", ref)).toBe(true);
      expect(isDateInFuture("2026-06-01", ref)).toBe(false);
      expect(isDateInFuture("2026-05-31", ref)).toBe(false);
      expect(isDateInFuture("invalid-date", ref)).toBe(false);
    });

    it("validates with validateEventProfile pure function", () => {
      const result = validateEventProfile(validWeddingInput, FIXED_NOW);
      expect(result.eventType).toBe("wedding");
      expect(result.title).toBe("Elena & Marcus Wedding");

      expect(() =>
        validateEventProfile({ ...validWeddingInput, guestCount: 0 }, FIXED_NOW),
      ).toThrow();
    });

    it("safely validates with safeValidateEventProfile", () => {
      const ok = safeValidateEventProfile(validWeddingInput, FIXED_NOW);
      expect(ok.success).toBe(true);
      if (ok.success) {
        expect(ok.data.title).toBe("Elena & Marcus Wedding");
      }

      const fail = safeValidateEventProfile(
        { ...validWeddingInput, guestCount: -5 },
        FIXED_NOW,
      );
      expect(fail.success).toBe(false);
    });

    it("default EventProfileSchema works with live system clock for future dates", () => {
      const futureYear = new Date().getFullYear() + 2;
      const futureDate = `${futureYear}-10-15`;
      const result = EventProfileSchema.parse({
        title: "Future Gala",
        eventType: "community",
        date: futureDate,
        guestCount: 200,
        budget: 15000,
      });
      expect(result.title).toBe("Future Gala");
      expect(result.date).toBe(futureDate);
    });

    it("handles non-object inputs gracefully in preprocess", () => {
      expect(() => testSchema.parse(null)).toThrow();
      expect(() => testSchema.parse("string")).toThrow();
      expect(() => testSchema.parse(123)).toThrow();
    });
  });
});
