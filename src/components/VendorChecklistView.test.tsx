import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VendorChecklistView } from "./VendorChecklistView";
import { VendorChecklistItem } from "@/domain";

describe("VendorChecklistView Component", () => {
  const mockVendors: VendorChecklistItem[] = [
    {
      id: "v-1",
      category: "catering",
      title: "Caterer & Bar Service",
      vendorName: "",
      status: "researching",
      estimatedCost: 3000,
      contactInfo: "",
      contractSigned: false,
      notes: "",
    },
  ];

  it("renders vendor checklist item and updates status when changed", () => {
    const handleStatus = vi.fn();
    render(
      <VendorChecklistView
        checklist={mockVendors}
        onUpdateStatus={handleStatus}
        onUpdateDetails={vi.fn()}
      />,
    );

    expect(screen.getByText("Caterer & Bar Service")).toBeInTheDocument();
    const select = screen.getByRole("combobox", { name: /Procurement Status/i });
    fireEvent.change(select, { target: { value: "booked" } });
    expect(handleStatus).toHaveBeenCalledWith("v-1", "booked");
  });

  it("calls onUpdateDetails when contract signed checkbox is toggled", () => {
    const handleDetails = vi.fn();
    render(
      <VendorChecklistView
        checklist={mockVendors}
        onUpdateStatus={vi.fn()}
        onUpdateDetails={handleDetails}
      />,
    );

    const contractCheckbox = screen.getByLabelText(/Contract Signed/i);
    fireEvent.click(contractCheckbox);
    expect(handleDetails).toHaveBeenCalledWith("v-1", { contractSigned: true });
  });
});
