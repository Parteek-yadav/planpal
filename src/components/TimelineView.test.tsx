import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TimelineView } from "./TimelineView";
import { TimelineMilestone, RunOfShowItem } from "@/domain";

describe("TimelineView Component", () => {
  const mockMilestones: TimelineMilestone[] = [
    {
      id: "m-1",
      phase: "concept_budget",
      title: "Reserve Wedding Venue",
      description: "Secure ballroom deposit",
      targetDaysBeforeEvent: 180,
      targetDate: "2027-02-01",
      isCompleted: false,
      priority: "high",
    },
  ];

  const mockRunOfShow: RunOfShowItem[] = [
    {
      id: "ros-1",
      time: "16:00",
      activity: "Ceremony Procession",
      leadPerson: "Officiant",
      location: "Sanctuary",
      isCompleted: false,
    },
  ];

  it("renders milestones and calls onToggleMilestone when checked", () => {
    const handleToggle = vi.fn();
    render(
      <TimelineView
        milestones={mockMilestones}
        runOfShow={mockRunOfShow}
        onToggleMilestone={handleToggle}
        onToggleRunOfShowItem={vi.fn()}
      />,
    );

    expect(screen.getByText("Reserve Wedding Venue")).toBeInTheDocument();
    const checkbox = screen.getByLabelText(/Mark "Reserve Wedding Venue" as completed/i);
    fireEvent.click(checkbox);
    expect(handleToggle).toHaveBeenCalledWith("m-1");
  });

  it("switches to Day-Of Run-of-Show subview when clicked", () => {
    render(
      <TimelineView
        milestones={mockMilestones}
        runOfShow={mockRunOfShow}
        onToggleMilestone={vi.fn()}
        onToggleRunOfShowItem={vi.fn()}
      />,
    );

    const rosBtn = screen.getByRole("button", { name: /Day-Of Run-of-Show/i });
    fireEvent.click(rosBtn);

    expect(screen.getByText("Ceremony Procession")).toBeInTheDocument();
    expect(screen.getByText("16:00")).toBeInTheDocument();
  });
});
