import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NavigationTabs } from "./NavigationTabs";

describe("NavigationTabs Component", () => {
  it("renders all four primary event planning tabs", () => {
    const handleTabChange = vi.fn();
    render(
      <NavigationTabs
        activeTab="ai_plan"
        onTabChange={handleTabChange}
        budgetItemCount={6}
        milestoneCount={7}
        vendorCount={8}
      />,
    );

    expect(screen.getByRole("tab", { name: /GenAI Blueprint/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Budget Tracker/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Milestones/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Vendor Procurement/i })).toBeInTheDocument();
  });

  it("calls onTabChange when a tab is clicked", () => {
    const handleTabChange = vi.fn();
    render(<NavigationTabs activeTab="ai_plan" onTabChange={handleTabChange} />);

    const budgetTab = screen.getByRole("tab", { name: /Budget Tracker/i });
    fireEvent.click(budgetTab);
    expect(handleTabChange).toHaveBeenCalledWith("budget");
  });

  it("correctly indicates the selected tab with aria-selected", () => {
    render(<NavigationTabs activeTab="budget" onTabChange={vi.fn()} />);

    const budgetTab = screen.getByRole("tab", { name: /Budget Tracker/i });
    expect(budgetTab).toHaveAttribute("aria-selected", "true");

    const aiTab = screen.getByRole("tab", { name: /GenAI Blueprint/i });
    expect(aiTab).toHaveAttribute("aria-selected", "false");
  });
});
