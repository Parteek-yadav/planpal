import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { BudgetChart } from "./BudgetChart";
import { BudgetItem, BudgetSummary } from "@/domain";

describe("BudgetChart Component", () => {
  const mockSummary: BudgetSummary = {
    totalBudget: 20000,
    totalAllocated: 18000,
    totalSpent: 9500,
    remainingBudget: 10500,
    unallocatedBudget: 2000,
    isOverBudget: false,
    variancePercentage: -47.5,
  };

  const mockItems: readonly BudgetItem[] = [
    {
      id: "b-1",
      category: "venue_catering",
      name: "Banquet Hall & Catering",
      allocatedAmount: 10000,
      actualAmount: 6000,
      isPaid: true,
    },
    {
      id: "b-2",
      category: "photography_video" as const,
      name: "Photography & Video",
      allocatedAmount: 4000,
      actualAmount: 4500,
      isPaid: false,
    },
  ];

  it("renders SVG with accessible semantics, role, title, and desc", () => {
    render(<BudgetChart summary={mockSummary} items={mockItems} />);

    const svg = screen.getByRole("img", {
      name: /Event Budget Allocation and Spending Chart/i,
    });
    expect(svg).toBeInTheDocument();

    expect(screen.getAllByText(/Planned Allocation/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Actual Spent/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Banquet Hall/i)).toBeInTheDocument();
  });

  it("has zero accessibility violations (jest-axe)", async () => {
    const { container } = render(<BudgetChart summary={mockSummary} items={mockItems} />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
