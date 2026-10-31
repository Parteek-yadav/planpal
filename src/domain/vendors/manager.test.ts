import { describe, it, expect } from "vitest";
import {
  generateVendorChecklist,
  updateVendorStatus,
  updateVendorDetails,
  getVendorChecklistSummary
} from "./manager";
import { VendorChecklistItem } from "./types";

describe("Vendor Manager Domain Functions", () => {
  describe("generateVendorChecklist", () => {
    it("creates essential wedding vendors", () => {
      const checklist = generateVendorChecklist("wedding");
      expect(checklist.length).toBe(8);
      expect(checklist.some((v) => v.category === "venue")).toBe(true);
      expect(checklist.some((v) => v.category === "photography")).toBe(true);
      expect(checklist.every((v) => v.status === "researching")).toBe(true);
    });

    it("creates community vendors with permits and sanitation", () => {
      const checklist = generateVendorChecklist("community");
      expect(checklist.some((v) => v.category === "permits_insurance")).toBe(true);
      expect(checklist.some((v) => v.title.includes("Sanitation"))).toBe(true);
    });
  });

  describe("updateVendorStatus and updateVendorDetails", () => {
    const mockList: VendorChecklistItem[] = [
      {
        id: "v-1",
        category: "catering",
        title: "Catering",
        vendorName: "Gourmet Bites",
        status: "researching",
        estimatedCost: 4000,
        contactInfo: "gourmet@example.com",
        contractSigned: false,
        notes: ""
      }
    ];

    it("updates status immutably", () => {
      const updated = updateVendorStatus(mockList, "v-1", "booked");
      expect(updated[0].status).toBe("booked");
      expect(mockList[0].status).toBe("researching");
    });

    it("updates vendor details immutably", () => {
      const updated = updateVendorDetails(mockList, {
        id: "v-1",
        vendorName: "Artisan Kitchen",
        estimatedCost: 4500,
        contractSigned: true
      });

      expect(updated[0].vendorName).toBe("Artisan Kitchen");
      expect(updated[0].estimatedCost).toBe(4500);
      expect(updated[0].contractSigned).toBe(true);
    });
  });

  describe("getVendorChecklistSummary", () => {
    it("summarizes booked counts and costs accurately", () => {
      const items: VendorChecklistItem[] = [
        {
          id: "1",
          category: "venue",
          title: "Venue",
          vendorName: "Grand Plaza",
          status: "booked",
          estimatedCost: 5000,
          contactInfo: "",
          contractSigned: true,
          notes: ""
        },
        {
          id: "2",
          category: "photography",
          title: "Photo",
          vendorName: "Lens Craft",
          status: "proposal_received",
          estimatedCost: 2000,
          contactInfo: "",
          contractSigned: false,
          notes: ""
        }
      ];

      const summary = getVendorChecklistSummary(items);
      expect(summary.totalVendors).toBe(2);
      expect(summary.bookedCount).toBe(1);
      expect(summary.pendingCount).toBe(1);
      expect(summary.totalCommittedCost).toBe(5000);
      expect(summary.allContractsSigned).toBe(true); // only booked item has signed contract
    });
  });
});
