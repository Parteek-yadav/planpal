import { describe, it, expect } from "vitest";
import {
  getDefaultVendorChecklist,
  generateVendorChecklist,
  updateVendorStatus,
  updateVendorDetails,
  getVendorChecklistSummary,
  VendorStatusSchema,
  VendorCategorySchema,
  VendorChecklistItemSchema,
  VendorStatus,
  VendorChecklistItem,
} from "./vendors";

describe("vendors Domain Module", () => {
  describe("Vendor Schemas & Enums", () => {
    it("validates all supported VendorStatus enum values", () => {
      const validStatuses: VendorStatus[] = [
        "researching",
        "contacted",
        "proposal_received",
        "booked",
        "declined",
      ];

      for (const s of validStatuses) {
        expect(VendorStatusSchema.parse(s)).toBe(s);
      }
    });

    it("rejects invalid vendor status values", () => {
      expect(() => VendorStatusSchema.parse("hired")).toThrow();
      expect(() => VendorStatusSchema.parse("confirmed")).toThrow();
      expect(() => VendorStatusSchema.parse("")).toThrow();
    });

    it("validates supported VendorCategory enum values", () => {
      const categories = [
        "venue",
        "catering",
        "photography",
        "entertainment",
        "decor",
        "attire",
        "cake",
        "permits_insurance",
        "other",
      ];

      for (const cat of categories) {
        expect(VendorCategorySchema.parse(cat)).toBe(cat);
      }

      expect(() => VendorCategorySchema.parse("invalid_cat")).toThrow();
    });

    it("validates VendorChecklistItemSchema with defaults", () => {
      const item = VendorChecklistItemSchema.parse({
        id: "v-1",
        category: "venue",
        title: "Main Ballroom",
      });

      expect(item.status).toBe("researching");
      expect(item.vendorName).toBe("");
      expect(item.estimatedCost).toBe(0);
      expect(item.contractSigned).toBe(false);
      expect(item.notes).toBe("");
    });
  });

  describe("getDefaultVendorChecklist - All Three Event Types", () => {
    it("generates default wedding vendor checklist with 8 categories", () => {
      const checklist = getDefaultVendorChecklist("wedding");
      expect(checklist.length).toBe(8);

      const categories = checklist.map((c) => c.category);
      expect(categories).toContain("venue");
      expect(categories).toContain("catering");
      expect(categories).toContain("photography");
      expect(categories).toContain("entertainment");
      expect(categories).toContain("decor");
      expect(categories).toContain("attire");
      expect(categories).toContain("cake");
      expect(categories).toContain("other");

      expect(checklist.every((i) => i.status === "researching")).toBe(true);
      expect(checklist.every((i) => i.contractSigned === false)).toBe(true);
    });

    it("generates default birthday vendor checklist with 6 categories", () => {
      const checklist = getDefaultVendorChecklist("birthday");
      expect(checklist.length).toBe(6);

      const categories = checklist.map((c) => c.category);
      expect(categories).toContain("venue");
      expect(categories).toContain("catering");
      expect(categories).toContain("cake");
      expect(categories).toContain("entertainment");
      expect(categories).toContain("decor");
      expect(categories).toContain("photography");
    });

    it("generates default community vendor checklist with permits & safety", () => {
      const checklist = getDefaultVendorChecklist("community");
      expect(checklist.length).toBe(6);

      const categories = checklist.map((c) => c.category);
      expect(categories).toContain("permits_insurance");
      expect(categories).toContain("entertainment");
      expect(categories).toContain("catering");
      expect(categories).toContain("venue");
      expect(categories).toContain("other");
    });

    it("supports generateVendorChecklist alias", () => {
      const checklist = generateVendorChecklist("wedding");
      expect(checklist.length).toBe(8);
    });

    it("throws Error on unsupported event type", () => {
      expect(() =>
        getDefaultVendorChecklist("corporate" as unknown as "wedding"),
      ).toThrow(/Unsupported event type/);
    });
  });

  describe("updateVendorStatus - Pure Immutable Mutation", () => {
    it("immutably updates the status of targeted item", () => {
      const initial = getDefaultVendorChecklist("wedding");
      const targetId = initial[0].id;

      const updated = updateVendorStatus(initial, targetId, "contacted");

      expect(updated[0].status).toBe("contacted");
      // Initial is not mutated
      expect(initial[0].status).toBe("researching");
      // Remaining items are preserved
      expect(updated[1].status).toBe("researching");
    });

    it("rejects invalid status updates", () => {
      const checklist = getDefaultVendorChecklist("wedding");
      expect(() =>
        updateVendorStatus(
          checklist,
          checklist[0].id,
          "nonexistent" as unknown as VendorStatus,
        ),
      ).toThrow();
    });

    it("returns unchanged checklist if id does not match", () => {
      const checklist = getDefaultVendorChecklist("wedding");
      const updated = updateVendorStatus(checklist, "non-existent-id", "booked");
      expect(updated).toEqual(checklist);
    });
  });

  describe("updateVendorDetails - Pure Immutable Mutation", () => {
    it("immutably updates details of targeted vendor item", () => {
      const initial = getDefaultVendorChecklist("wedding");
      const targetId = initial[0].id;

      const updated = updateVendorDetails(initial, {
        id: targetId,
        vendorName: "Grand Palace Hotel",
        estimatedCost: 6500,
        contactInfo: "events@grandpalace.com",
        contractSigned: true,
        notes: "Deposit paid",
      });

      expect(updated[0].vendorName).toBe("Grand Palace Hotel");
      expect(updated[0].estimatedCost).toBe(6500);
      expect(updated[0].contactInfo).toBe("events@grandpalace.com");
      expect(updated[0].contractSigned).toBe(true);
      expect(updated[0].notes).toBe("Deposit paid");

      // Verify immutability
      expect(initial[0].vendorName).toBe("");
      expect(initial[0].estimatedCost).toBe(0);
    });

    it("returns unchanged items if id does not match", () => {
      const checklist = getDefaultVendorChecklist("wedding");
      const updated = updateVendorDetails(checklist, {
        id: "missing-id",
        vendorName: "Test",
      });
      expect(updated).toEqual(checklist);
    });
  });

  describe("getVendorChecklistSummary - Progress Aggregations", () => {
    it("summarizes an initial untouched checklist", () => {
      const checklist = getDefaultVendorChecklist("wedding");
      const summary = getVendorChecklistSummary(checklist);

      expect(summary.totalVendors).toBe(8);
      expect(summary.bookedCount).toBe(0);
      expect(summary.pendingCount).toBe(8);
      expect(summary.totalCommittedCost).toBe(0);
      expect(summary.allContractsSigned).toBe(true); // No booked vendors without contracts
    });

    it("summarizes partially booked checklist with committed costs", () => {
      let checklist = getDefaultVendorChecklist("wedding");

      // Book vendor 1: 5000 with contract signed
      checklist = updateVendorStatus(checklist, checklist[0].id, "booked");
      checklist = updateVendorDetails(checklist, {
        id: checklist[0].id,
        estimatedCost: 5000,
        contractSigned: true,
      });

      // Book vendor 2: 2500 WITHOUT contract signed
      checklist = updateVendorStatus(checklist, checklist[1].id, "booked");
      checklist = updateVendorDetails(checklist, {
        id: checklist[1].id,
        estimatedCost: 2500,
        contractSigned: false,
      });

      // Vendor 3: declined
      checklist = updateVendorStatus(checklist, checklist[2].id, "declined");

      const summary = getVendorChecklistSummary(checklist);

      expect(summary.totalVendors).toBe(8);
      expect(summary.bookedCount).toBe(2);
      expect(summary.pendingCount).toBe(6);
      expect(summary.totalCommittedCost).toBe(7500);
      expect(summary.allContractsSigned).toBe(false); // vendor 2 has contractSigned: false
    });

    it("returns allContractsSigned: true when all booked vendors have signed contracts", () => {
      let checklist = getDefaultVendorChecklist("birthday");

      checklist = updateVendorStatus(checklist, checklist[0].id, "booked");
      checklist = updateVendorDetails(checklist, {
        id: checklist[0].id,
        estimatedCost: 1500,
        contractSigned: true,
      });

      const summary = getVendorChecklistSummary(checklist);
      expect(summary.bookedCount).toBe(1);
      expect(summary.allContractsSigned).toBe(true);
    });

    it("handles empty checklist edge case", () => {
      const summary = getVendorChecklistSummary([]);
      expect(summary.totalVendors).toBe(0);
      expect(summary.bookedCount).toBe(0);
      expect(summary.pendingCount).toBe(0);
      expect(summary.totalCommittedCost).toBe(0);
      expect(summary.allContractsSigned).toBe(false);

      // Item without estimatedCost defined
      const itemWithoutCost = {
        id: "v-test",
        category: "venue" as const,
        title: "Test Venue",
        vendorName: "Venue Co",
        status: "booked" as const,
        contactInfo: "",
        contractSigned: true,
        notes: "",
      } as unknown as VendorChecklistItem;
      const partialSummary = getVendorChecklistSummary([itemWithoutCost]);
      expect(partialSummary.totalCommittedCost).toBe(0);
    });
  });
});
