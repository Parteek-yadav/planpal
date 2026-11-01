import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "jest-axe";
import { ClearDataModal } from "./ClearDataModal";

describe("ClearDataModal Component", () => {
  it("renders with alertdialog role and confirms data deletion", () => {
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();

    render(
      <ClearDataModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
    );

    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(/Clear All Local Data\?/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: /Clear All Data/i });
    fireEvent.click(confirmBtn);

    expect(handleConfirm).toHaveBeenCalled();
    expect(handleClose).toHaveBeenCalled();
  });

  it("closes dialog when Escape or Cancel is clicked", () => {
    const handleClose = vi.fn();

    const { rerender } = render(
      <ClearDataModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={vi.fn()}
      />
    );

    const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(2);

    rerender(
      <ClearDataModal
        isOpen={false}
        onClose={handleClose}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("has zero accessibility violations (jest-axe)", async () => {
    const { container } = render(
      <ClearDataModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});

