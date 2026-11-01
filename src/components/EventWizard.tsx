import React, { useState, useEffect, useRef } from "react";
import {
  EventPlanInput,
  EventType,
  DietaryConstraint,
  AccessibilityConstraint,
} from "@/domain";

export interface EventWizardProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (input: EventPlanInput) => void;
  readonly isSubmitting: boolean;
}

const STEP_TITLES = [
  "Event Type & Basics",
  "Scale, Budget & Location",
  "Aesthetics & Inclusivity",
  "Review & Create Blueprint",
] as const;

const DIETARY_OPTIONS: readonly { id: DietaryConstraint; label: string }[] = [
  { id: "vegan", label: "🌱 Vegan" },
  { id: "vegetarian", label: "🥗 Vegetarian" },
  { id: "gluten_free", label: "🌾 Gluten-Free" },
  { id: "nut_free", label: "🥜 Nut-Free" },
  { id: "halal", label: "🍖 Halal" },
  { id: "kosher", label: "✡️ Kosher" },
  { id: "dairy_free", label: "🥛 Dairy-Free" },
];

const ACCESSIBILITY_OPTIONS: readonly { id: AccessibilityConstraint; label: string }[] = [
  { id: "wheelchair_accessible", label: "♿ Wheelchair Accessible" },
  { id: "asl_interpreter", label: "🤟 ASL Interpreter" },
  { id: "quiet_space", label: "🤫 Quiet Sensory Room" },
  { id: "service_animal_friendly", label: "🐕 Service Animal Friendly" },
];

export function EventWizard({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: EventWizardProps): React.JSX.Element | null {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [eventType, setEventType] = useState<EventType>("wedding");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [guestCount, setGuestCount] = useState("100");
  const [totalBudget, setTotalBudget] = useState("25000");
  const [location, setLocation] = useState("");
  const [theme, setTheme] = useState("");
  const [dietary, setDietary] = useState<DietaryConstraint[]>([]);
  const [accessibility, setAccessibility] = useState<AccessibilityConstraint[]>([]);
  const [kidFriendly, setKidFriendly] = useState(false);

  // Errors map linked to inputs via aria-describedby
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalAnnouncement, setGlobalAnnouncement] = useState<string>("");

  const modalRef = useRef<HTMLDivElement>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);

  // Focus management on step change: shift focus to step heading
  useEffect(() => {
    if (isOpen) {
      stepHeadingRef.current?.focus();
    }
  }, [currentStep, isOpen]);

  // Keyboard trap and Escape handler
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

  const toggleDietary = (item: DietaryConstraint) => {
    setDietary((prev) =>
      prev.includes(item) ? prev.filter((d) => d !== item) : [...prev, item],
    );
  };

  const toggleAccessibility = (item: AccessibilityConstraint) => {
    setAccessibility((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item],
    );
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!title.trim()) {
        newErrors.title = "Event title is required.";
      }
      if (!date) {
        newErrors.date = "Please select an event date.";
      } else {
        const selected = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selected < today) {
          newErrors.date = "Event date must be in the future.";
        }
      }
    } else if (step === 2) {
      const parsedGuests = parseInt(guestCount, 10);
      const parsedBudget = parseFloat(totalBudget);

      if (isNaN(parsedGuests) || parsedGuests < 1 || parsedGuests > 5000) {
        newErrors.guestCount = "Guest count must be between 1 and 5,000.";
      }
      if (isNaN(parsedBudget) || parsedBudget <= 0) {
        newErrors.totalBudget = "Budget must be greater than $0.";
      }
      if (!location.trim()) {
        newErrors.location = "Event location/city is required.";
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      setGlobalAnnouncement(`Validation error: ${firstError}`);
      return false;
    }

    setGlobalAnnouncement("");
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep((prev) => prev + 1);
      }
    }
  };

  const handlePrevStep = () => {
    setErrors({});
    setGlobalAnnouncement("");
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2)) {
      return;
    }

    const payload: EventPlanInput = {
      eventType,
      title: title.trim(),
      date,
      guestCount: parseInt(guestCount, 10),
      totalBudget: parseFloat(totalBudget),
      location: location.trim(),
      theme: theme.trim() || undefined,
      constraints: {
        dietary,
        accessibility,
        kidFriendly,
      },
    };

    onSubmit(payload);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wizard-modal-title"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
      ref={modalRef}
    >
      <div
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "680px",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "var(--bg-surface)",
          border: "2px solid var(--border-strong)",
          borderRadius: "16px",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        {/* Header & Close Button */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: "1px solid var(--border-subtle)",
            paddingBottom: "1rem",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--accent-purple)",
              }}
            >
              PlanPal Event Setup Wizard
            </span>
            <h1
              id="wizard-modal-title"
              style={{
                fontSize: "1.5rem",
                fontWeight: "800",
                color: "var(--text-primary)",
                marginTop: "0.25rem",
              }}
            >
              Design Your Event Blueprint
            </h1>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            aria-label="Close setup wizard"
            style={{ minHeight: "44px", minWidth: "44px", padding: "0.5rem" }}
          >
            ✕
          </button>
        </div>

        {/* Text-based Progress Indicator (Not color alone!) */}
        <div
          style={{
            background: "var(--bg-card)",
            padding: "0.85rem 1.25rem",
            borderRadius: "8px",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div
            id="wizard-step-progress"
            aria-live="polite"
            style={{
              fontSize: "0.95rem",
              fontWeight: "700",
              color: "var(--text-primary)",
              marginBottom: "0.5rem",
            }}
          >
            Step {currentStep} of 4: {STEP_TITLES[currentStep - 1]}
          </div>

          {/* Stepper with aria-current="step" */}
          <nav aria-label="Wizard Steps Progress">
            <ol
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "0.5rem",
                listStyle: "none",
                padding: 0,
                margin: 0,
              }}
            >
              {STEP_TITLES.map((_, idx) => {
                const stepNum = idx + 1;
                const isCurrent = currentStep === stepNum;
                const isCompleted = currentStep > stepNum;

                return (
                  <li
                    key={stepNum}
                    aria-current={isCurrent ? "step" : undefined}
                    style={{
                      padding: "0.4rem 0.5rem",
                      borderRadius: "6px",
                      background: isCurrent
                        ? "var(--accent-purple)"
                        : isCompleted
                          ? "var(--status-success-bg)"
                          : "var(--bg-input)",
                      color: isCurrent
                        ? "#ffffff"
                        : isCompleted
                          ? "var(--status-success-text)"
                          : "var(--text-muted)",
                      border: `1px solid ${isCurrent ? "var(--border-focus)" : "var(--border-subtle)"}`,
                      fontSize: "0.75rem",
                      fontWeight: isCurrent ? "700" : "500",
                      textAlign: "center",
                    }}
                  >
                    <span>
                      {isCompleted ? "✓ " : isCurrent ? "● " : "○ "}
                      Step {stepNum}
                    </span>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        {/* Live Announcement Container for Screen Readers */}
        <div
          role="status"
          aria-live="polite"
          className="visually-hidden"
          id="wizard-live-announcer"
        >
          {globalAnnouncement}
        </div>

        {/* Step Content Container */}
        <form onSubmit={handleFinalSubmit} noValidate>
          {/* STEP 1: Event Type & Basics */}
          {currentStep === 1 && (
            <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
              <legend className="visually-hidden">Event Type and Basic Details</legend>
              <h2
                ref={stepHeadingRef}
                tabIndex={-1}
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "700",
                  marginBottom: "1rem",
                  color: "var(--text-primary)",
                }}
              >
                1. Event Type & Basics
              </h2>

              <div className="form-group">
                <label htmlFor="wizard-event-type" className="form-label">
                  Event Archetype
                </label>
                <select
                  id="wizard-event-type"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as EventType)}
                  className="form-select"
                >
                  <option value="wedding">💍 Wedding</option>
                  <option value="birthday">🎂 Birthday Celebration</option>
                  <option value="community">🎪 Community Festival / Gala</option>
                </select>
                <span className="form-hint">
                  Chooses specialized default budget splits, vendor rosters, and milestone
                  cadences.
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="wizard-title" className="form-label">
                  Event Title <span aria-hidden="true">*</span>
                </label>
                <input
                  id="wizard-title"
                  type="text"
                  placeholder="e.g., Sarah & David's Vineyard Wedding"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input"
                  aria-required="true"
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby={errors.title ? "wizard-title-error" : undefined}
                />
                {errors.title && (
                  <p id="wizard-title-error" role="alert" className="form-error">
                    ⚠️ {errors.title}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="wizard-date" className="form-label">
                  Event Date <span aria-hidden="true">*</span>
                </label>
                <input
                  id="wizard-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="form-input"
                  aria-required="true"
                  aria-invalid={Boolean(errors.date)}
                  aria-describedby={errors.date ? "wizard-date-error" : undefined}
                />
                {errors.date && (
                  <p id="wizard-date-error" role="alert" className="form-error">
                    ⚠️ {errors.date}
                  </p>
                )}
              </div>
            </fieldset>
          )}

          {/* STEP 2: Scale, Budget & Location */}
          {currentStep === 2 && (
            <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
              <legend className="visually-hidden">
                Scale, Budget and Location Information
              </legend>
              <h2
                ref={stepHeadingRef}
                tabIndex={-1}
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "700",
                  marginBottom: "1rem",
                  color: "var(--text-primary)",
                }}
              >
                2. Scale, Budget & Location
              </h2>

              <div className="form-group">
                <label htmlFor="wizard-guest-count" className="form-label">
                  Expected Guest Count <span aria-hidden="true">*</span>
                </label>
                <input
                  id="wizard-guest-count"
                  type="number"
                  min="1"
                  max="5000"
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  className="form-input"
                  aria-required="true"
                  aria-invalid={Boolean(errors.guestCount)}
                  aria-describedby={
                    errors.guestCount ? "wizard-guests-error" : "wizard-guests-hint"
                  }
                />
                <span id="wizard-guests-hint" className="form-hint">
                  Supports gatherings between 1 and 5,000 attendees.
                </span>
                {errors.guestCount && (
                  <p id="wizard-guests-error" role="alert" className="form-error">
                    ⚠️ {errors.guestCount}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="wizard-total-budget" className="form-label">
                  Total Budget (USD) <span aria-hidden="true">*</span>
                </label>
                <input
                  id="wizard-total-budget"
                  type="number"
                  min="100"
                  step="500"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value)}
                  className="form-input"
                  aria-required="true"
                  aria-invalid={Boolean(errors.totalBudget)}
                  aria-describedby={
                    errors.totalBudget ? "wizard-budget-error" : undefined
                  }
                />
                {errors.totalBudget && (
                  <p id="wizard-budget-error" role="alert" className="form-error">
                    ⚠️ {errors.totalBudget}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="wizard-location" className="form-label">
                  Location / Venue <span aria-hidden="true">*</span>
                </label>
                <input
                  id="wizard-location"
                  type="text"
                  placeholder="e.g., Napa Valley, CA or City Community Center"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="form-input"
                  aria-required="true"
                  aria-invalid={Boolean(errors.location)}
                  aria-describedby={errors.location ? "wizard-location-error" : undefined}
                />
                {errors.location && (
                  <p id="wizard-location-error" role="alert" className="form-error">
                    ⚠️ {errors.location}
                  </p>
                )}
              </div>
            </fieldset>
          )}

          {/* STEP 3: Aesthetics & Inclusivity */}
          {currentStep === 3 && (
            <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
              <legend className="visually-hidden">
                Event Aesthetics and Inclusivity Constraints
              </legend>
              <h2
                ref={stepHeadingRef}
                tabIndex={-1}
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "700",
                  marginBottom: "1rem",
                  color: "var(--text-primary)",
                }}
              >
                3. Aesthetics & Inclusivity Constraints
              </h2>

              <div className="form-group">
                <label htmlFor="wizard-theme" className="form-label">
                  Stylistic Theme or Concept (Optional)
                </label>
                <input
                  id="wizard-theme"
                  type="text"
                  placeholder="e.g., Rustic Tuscan Vineyard or Retro Arcade"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="form-input"
                />
              </div>

              {/* Dietary Constraints */}
              <fieldset style={{ border: "none", padding: 0, marginBottom: "1.25rem" }}>
                <legend className="form-label" style={{ marginBottom: "0.5rem" }}>
                  Dietary Accommodations
                </legend>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: "0.5rem",
                  }}
                >
                  {DIETARY_OPTIONS.map((item) => {
                    const isChecked = dietary.includes(item.id);
                    return (
                      <label
                        key={item.id}
                        htmlFor={`diet-${item.id}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.6rem 0.8rem",
                          minHeight: "44px",
                          borderRadius: "8px",
                          background: isChecked
                            ? "var(--accent-purple-glow)"
                            : "var(--bg-input)",
                          border: `1px solid ${isChecked ? "var(--border-focus)" : "var(--border-subtle)"}`,
                          cursor: "pointer",
                          fontSize: "0.875rem",
                          fontWeight: isChecked ? "600" : "500",
                          color: "var(--text-primary)",
                        }}
                      >
                        <input
                          id={`diet-${item.id}`}
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleDietary(item.id)}
                          style={{ width: "18px", height: "18px" }}
                        />
                        <span>{item.label}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {/* Accessibility Constraints */}
              <fieldset style={{ border: "none", padding: 0, marginBottom: "1.25rem" }}>
                <legend className="form-label" style={{ marginBottom: "0.5rem" }}>
                  Accessibility Needs
                </legend>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "0.5rem",
                  }}
                >
                  {ACCESSIBILITY_OPTIONS.map((item) => {
                    const isChecked = accessibility.includes(item.id);
                    return (
                      <label
                        key={item.id}
                        htmlFor={`access-${item.id}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.6rem 0.8rem",
                          minHeight: "44px",
                          borderRadius: "8px",
                          background: isChecked
                            ? "var(--accent-purple-glow)"
                            : "var(--bg-input)",
                          border: `1px solid ${isChecked ? "var(--border-focus)" : "var(--border-subtle)"}`,
                          cursor: "pointer",
                          fontSize: "0.875rem",
                          fontWeight: isChecked ? "600" : "500",
                          color: "var(--text-primary)",
                        }}
                      >
                        <input
                          id={`access-${item.id}`}
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleAccessibility(item.id)}
                          style={{ width: "18px", height: "18px" }}
                        />
                        <span>{item.label}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {/* Kid-friendly toggle */}
              <label
                htmlFor="wizard-kid-friendly"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem",
                  minHeight: "44px",
                  borderRadius: "8px",
                  background: kidFriendly
                    ? "var(--accent-purple-glow)"
                    : "var(--bg-input)",
                  border: `1px solid ${kidFriendly ? "var(--border-focus)" : "var(--border-subtle)"}`,
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  color: "var(--text-primary)",
                  width: "100%",
                }}
              >
                <input
                  id="wizard-kid-friendly"
                  type="checkbox"
                  checked={kidFriendly}
                  onChange={(e) => setKidFriendly(e.target.checked)}
                  style={{ width: "20px", height: "20px" }}
                />
                <span>
                  🎈 Kid-friendly event (includes family activities & kid meal options)
                </span>
              </label>
            </fieldset>
          )}

          {/* STEP 4: Review & Generate */}
          {currentStep === 4 && (
            <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
              <legend className="visually-hidden">Review Plan Details</legend>
              <h2
                ref={stepHeadingRef}
                tabIndex={-1}
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "700",
                  marginBottom: "1rem",
                  color: "var(--text-primary)",
                }}
              >
                4. Review & Create Blueprint
              </h2>

              <div
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "10px",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  fontSize: "0.95rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid var(--border-subtle)",
                    paddingBottom: "0.5rem",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>Type:</span>
                  <strong
                    style={{ color: "var(--text-primary)", textTransform: "capitalize" }}
                  >
                    {eventType}
                  </strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid var(--border-subtle)",
                    paddingBottom: "0.5rem",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>Title:</span>
                  <strong style={{ color: "var(--text-primary)" }}>{title}</strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid var(--border-subtle)",
                    paddingBottom: "0.5rem",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>Date:</span>
                  <strong style={{ color: "var(--text-primary)" }}>{date}</strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid var(--border-subtle)",
                    paddingBottom: "0.5rem",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>Guest Count:</span>
                  <strong style={{ color: "var(--text-primary)" }}>
                    {guestCount} guests
                  </strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid var(--border-subtle)",
                    paddingBottom: "0.5rem",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>Total Budget:</span>
                  <strong style={{ color: "var(--status-success-text)" }}>
                    ${parseFloat(totalBudget || "0").toLocaleString()}
                  </strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid var(--border-subtle)",
                    paddingBottom: "0.5rem",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>Location:</span>
                  <strong style={{ color: "var(--text-primary)" }}>{location}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Constraints:</span>
                  <span style={{ color: "var(--text-secondary)", textAlign: "right" }}>
                    {[
                      dietary.length > 0 ? `${dietary.length} dietary` : null,
                      accessibility.length > 0 ? `${accessibility.length} access` : null,
                      kidFriendly ? "kid-friendly" : null,
                    ]
                      .filter(Boolean)
                      .join(", ") || "None specified"}
                  </span>
                </div>
              </div>
            </fieldset>
          )}

          {/* Wizard Action Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "2rem",
              paddingTop: "1rem",
              borderTop: "1px solid var(--border-subtle)",
              gap: "1rem",
            }}
          >
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handlePrevStep}
                  disabled={isSubmitting}
                >
                  ← Back
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleNextStep}
                >
                  Next Step →
                </button>
              ) : (
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting
                    ? "⚡ Generating Blueprint..."
                    : "✨ Create Event Blueprint"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EventWizard;
