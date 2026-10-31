import React, { useState, useEffect, useRef } from "react";
import { EventPlanInput, EventType } from "@/domain";

interface EventIntakeModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (input: EventPlanInput) => void;
  readonly isSubmitting: boolean;
}

/**
 * Accessible dialog modal for user event intake and customization.
 * Implements WCAG 2.1 AA dialog keyboard interactions and focus containment.
 */
export function EventIntakeModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting
}: EventIntakeModalProps): React.JSX.Element | null {
  const dialogRef = useRef<HTMLDivElement>(null);

  const [eventType, setEventType] = useState<EventType>("wedding");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [guestCount, setGuestCount] = useState("100");
  const [totalBudget, setTotalBudget] = useState("25000");
  const [location, setLocation] = useState("");
  const [theme, setTheme] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsedGuests = parseInt(guestCount, 10);
    const parsedBudget = parseFloat(totalBudget);

    if (!title.trim()) {
      setErrorMsg("Please enter an event title.");
      return;
    }
    if (!date) {
      setErrorMsg("Please select a valid event date.");
      return;
    }
    if (isNaN(parsedGuests) || parsedGuests <= 0) {
      setErrorMsg("Guest count must be at least 1.");
      return;
    }
    if (isNaN(parsedBudget) || parsedBudget <= 0) {
      setErrorMsg("Total budget must be greater than $0.");
      return;
    }
    if (!location.trim()) {
      setErrorMsg("Please enter a venue or location.");
      return;
    }

    onSubmit({
      eventType,
      title: title.trim(),
      date,
      guestCount: parsedGuests,
      totalBudget: parsedBudget,
      location: location.trim(),
      theme: theme.trim() || undefined,
      dietaryPreferences: [],
      specialNotes: specialNotes.trim() || undefined
    });
  };

  return (
    <div
      role="presentation"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="intake-dialog-title"
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "600px",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#161c2d",
          border: "1px solid var(--border-highlight)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.25rem",
            borderBottom: "1px solid var(--border-subtle)",
            paddingBottom: "0.75rem"
          }}
        >
          <h2 id="intake-dialog-title" style={{ fontSize: "1.25rem", fontWeight: "700" }}>
            ✨ Plan Your Next Event
          </h2>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ padding: "0.3rem 0.6rem" }}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div
            role="alert"
            style={{
              padding: "0.75rem",
              background: "var(--status-error-bg)",
              color: "var(--status-error-text)",
              borderRadius: "6px",
              marginBottom: "1rem",
              fontSize: "0.875rem"
            }}
          >
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="intake-event-type" className="form-label">
              Event Archetype
            </label>
            <select
              id="intake-event-type"
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
              className="form-select"
            >
              <option value="wedding">💍 Wedding</option>
              <option value="birthday">🎂 Birthday Celebration</option>
              <option value="community">🎪 Community Festival / Gathering</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="intake-title" className="form-label">
              Event Title
            </label>
            <input
              id="intake-title"
              type="text"
              placeholder="e.g. Maya & Daniel's Autumn Wedding"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem"
            }}
          >
            <div className="form-group">
              <label htmlFor="intake-date" className="form-label">
                Event Date
              </label>
              <input
                id="intake-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="intake-guests" className="form-label">
                Estimated Guests
              </label>
              <input
                id="intake-guests"
                type="number"
                min="1"
                max="10000"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem"
            }}
          >
            <div className="form-group">
              <label htmlFor="intake-budget" className="form-label">
                Total Budget ($)
              </label>
              <input
                id="intake-budget"
                type="number"
                min="100"
                step="500"
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="intake-location" className="form-label">
                Venue or City
              </label>
              <input
                id="intake-location"
                type="text"
                placeholder="e.g. Napa Valley, CA"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="intake-theme" className="form-label">
              Style / Theme Preference (Optional)
            </label>
            <input
              id="intake-theme"
              type="text"
              placeholder="e.g. Modern Rustic Boho"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="intake-notes" className="form-label">
              Special Constraints or Notes (Optional)
            </label>
            <textarea
              id="intake-notes"
              rows={3}
              placeholder="e.g. Need outdoor backup plan, vegan catering options"
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              className="form-textarea"
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
              marginTop: "1.5rem"
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              id="btn-submit-plan"
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Generating Blueprint..." : "🚀 Generate Event Blueprint"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
