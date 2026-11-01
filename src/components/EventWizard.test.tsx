import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "jest-axe";
import { EventWizard } from "./EventWizard";

describe("EventWizard Component", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    isSubmitting: false,
  };

  it("renders Step 1 with text-based progress and visible labels", () => {
    render(<EventWizard {...defaultProps} />);

    // Text-based progress indicator
    expect(screen.getByText(/Step 1 of 4: Event Type & Basics/i)).toBeInTheDocument();

    // Inputs with visible labels
    expect(screen.getByLabelText(/Event Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Event Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Event Archetype/i)).toBeInTheDocument();
  });

  it("validates required inputs on Step 1 and displays error linked via aria-describedby", () => {
    render(<EventWizard {...defaultProps} />);

    const nextBtn = screen.getByRole("button", { name: /Next Step/i });
    fireEvent.click(nextBtn);

    // Error is rendered and linked
    const titleInput = screen.getByLabelText(/Event Title/i);
    expect(titleInput).toHaveAttribute("aria-invalid", "true");
    expect(titleInput).toHaveAttribute("aria-describedby", "wizard-title-error");
    expect(screen.getAllByText(/Event title is required/i).length).toBeGreaterThanOrEqual(
      1,
    );
  });

  it("advances through all 4 wizard steps and manages heading focus", async () => {
    render(<EventWizard {...defaultProps} />);

    // Fill Step 1
    fireEvent.change(screen.getByLabelText(/Event Title/i), {
      target: { value: "Maya & Alex's Wedding" },
    });
    fireEvent.change(screen.getByLabelText(/Event Date/i), {
      target: { value: "2027-11-20" },
    });

    const nextBtn = screen.getByRole("button", { name: /Next Step/i });
    fireEvent.click(nextBtn);

    // Verify Step 2 rendered and heading focused
    expect(
      screen.getByText(/Step 2 of 4: Scale, Budget & Location/i),
    ).toBeInTheDocument();
    const step2Heading = screen.getByRole("heading", {
      name: /2\. Scale, Budget & Location/i,
    });
    expect(document.activeElement).toBe(step2Heading);

    // Fill Step 2
    fireEvent.change(screen.getByLabelText(/Expected Guest Count/i), {
      target: { value: "150" },
    });
    fireEvent.change(screen.getByLabelText(/Total Budget/i), {
      target: { value: "40000" },
    });
    fireEvent.change(screen.getByLabelText(/Location \/ Venue/i), {
      target: { value: "Carmel Valley, CA" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Next Step/i }));

    // Verify Step 3 rendered and heading focused
    expect(
      screen.getByText(/Step 3 of 4: Aesthetics & Inclusivity/i),
    ).toBeInTheDocument();
    const step3Heading = screen.getByRole("heading", {
      name: /3\. Aesthetics & Inclusivity Constraints/i,
    });
    expect(document.activeElement).toBe(step3Heading);

    // Check a dietary option and accessibility option
    fireEvent.click(screen.getByLabelText(/Vegan/i));
    fireEvent.click(screen.getByLabelText(/Wheelchair Accessible/i));
    fireEvent.click(screen.getByLabelText(/Kid-friendly event/i));

    fireEvent.click(screen.getByRole("button", { name: /Next Step/i }));

    // Verify Step 4 (Review) rendered and heading focused
    expect(
      screen.getByText(/Step 4 of 4: Review & Create Blueprint/i),
    ).toBeInTheDocument();
    const step4Heading = screen.getByRole("heading", {
      name: /4\. Review & Create Blueprint/i,
    });
    expect(document.activeElement).toBe(step4Heading);

    // Verify Review values
    expect(screen.getByText("Maya & Alex's Wedding")).toBeInTheDocument();
    expect(screen.getByText("150 guests")).toBeInTheDocument();
    expect(screen.getByText("$40,000")).toBeInTheDocument();

    // Submit final form
    const submitBtn = screen.getByRole("button", { name: /Create Event Blueprint/i });
    fireEvent.click(submitBtn);

    expect(defaultProps.onSubmit).toHaveBeenCalledWith({
      eventType: "wedding",
      title: "Maya & Alex's Wedding",
      date: "2027-11-20",
      guestCount: 150,
      totalBudget: 40000,
      location: "Carmel Valley, CA",
      theme: undefined,
      constraints: {
        dietary: ["vegan"],
        accessibility: ["wheelchair_accessible"],
        kidFriendly: true,
      },
    });
  });

  it("closes dialog when Escape key is pressed", () => {
    const onClose = vi.fn();
    render(<EventWizard {...defaultProps} onClose={onClose} />);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("allows navigating backward via Back button", () => {
    render(<EventWizard {...defaultProps} />);

    fireEvent.change(screen.getByLabelText(/Event Title/i), {
      target: { value: "Community Gala" },
    });
    fireEvent.change(screen.getByLabelText(/Event Date/i), {
      target: { value: "2027-12-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Next Step/i }));

    expect(screen.getByText(/Step 2 of 4/i)).toBeInTheDocument();

    const backBtn = screen.getByRole("button", { name: /Back/i });
    fireEvent.click(backBtn);

    expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument();
  });

  it("has zero accessibility violations (jest-axe) across wizard dialog", async () => {
    const { container } = render(<EventWizard {...defaultProps} />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
