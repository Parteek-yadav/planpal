import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BudgetTracker } from "./BudgetTracker";
import { BudgetItem, BudgetSummary } from "@/domain";

describe("BudgetTracker Component", () => {
  const mockSummary: BudgetSummary = {
    totalBudget: 10000,
    totalAllocated: 9000,
    totalSpent: 4500,
    remainingBudget: 5500,
    unallocatedBudget: 1000,
    isOverBudget: false,
    variancePercentage: -55
  };

  const mockItems: BudgetItem[] = [
    {
      id: "b-1",
      category: "venue_catering",
      name: "Banquet Hall",
      allocatedAmount: 5000,
      actualAmount: 4500,
      isPaid: true
    }
  ];

  it("renders budget metrics summary cards correctly", () => {
    render(
      <BudgetTracker
        summary={mockSummary}
        items={mockItems}
        onUpdateItemActual={vi.fn()}
        onTogglePaid={vi.fn()}
      />
    );

    expect(screen.getByText("$10,000")).toBeInTheDocument();
    expect(screen.getByText("$9,000")).toBeInTheDocument();
    expect(screen.getAllByText("$4,500").length).toBe(2);
    expect(screen.getByText("$5,500")).toBeInTheDocument();
  });

  it("calls onTogglePaid when paid status checkbox is toggled", () => {
    const handleTogglePaid = vi.fn();
    render(
      <BudgetTracker
        summary={mockSummary}
        items={mockItems}
        onUpdateItemActual={vi.fn()}
        onTogglePaid={handleTogglePaid}
      />
    );

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(handleTogglePaid).toHaveBeenCalledWith("b-1");
  });

  it("allows entering edit mode and updating actual cost", () => {
    const handleUpdate = vi.fn();
    render(
      <BudgetTracker
        summary={mockSummary}
        items={mockItems}
        onUpdateItemActual={handleUpdate}
        onTogglePaid={vi.fn()}
      />
    );

    const editBtn = screen.getByRole("button", { name: /Edit Cost/i });
    fireEvent.click(editBtn);

    const input = screen.getByLabelText(/Actual cost for Banquet Hall/i);
    fireEvent.change(input, { target: { value: "4800" } });

    const saveBtn = screen.getByRole("button", { name: /Save/i });
    fireEvent.click(saveBtn);

    expect(handleUpdate).toHaveBeenCalledWith("b-1", 4800);
  });
});
