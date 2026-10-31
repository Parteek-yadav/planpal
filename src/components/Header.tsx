import React from "react";
import { EventType } from "@/domain";

interface HeaderProps {
  readonly currentEventType: EventType;
  readonly eventTitle: string;
  readonly eventDate: string;
  readonly guestCount: number;
  readonly totalBudget: number;
  readonly onOpenNewEventModal: () => void;
  readonly onSwitchPreset: (type: EventType) => void;
}

/**
 * Top application header presenting branding, event summary chips,
 * and quick-switch preset buttons for event archetypes.
 */
export function Header({
  currentEventType,
  eventTitle,
  eventDate,
  guestCount,
  totalBudget,
  onOpenNewEventModal,
  onSwitchPreset
}: HeaderProps): React.JSX.Element {
  const badgeClass =
    currentEventType === "wedding"
      ? "badge badge-wedding"
      : currentEventType === "birthday"
        ? "badge badge-birthday"
        : "badge badge-community";

  return (
    <header className="glass-panel" style={{ marginBottom: "2rem" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem"
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "0.5rem"
            }}
          >
            <span
              style={{
                fontSize: "1.75rem",
                fontWeight: "800",
                letterSpacing: "-0.03em",
                background: "linear-gradient(135deg, #a78bfa 0%, #f472b6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}
            >
              PlanPal
            </span>
            <span className={badgeClass}>{currentEventType}</span>
          </div>
          <h1
            id="event-main-title"
            style={{
              fontSize: "1.4rem",
              fontWeight: "700",
              color: "var(--text-primary)",
              marginBottom: "0.35rem"
            }}
          >
            {eventTitle}
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
              display: "flex",
              flexWrap: "wrap",
              gap: "1rem"
            }}
          >
            <span>📅 {eventDate}</span>
            <span>👥 {guestCount.toLocaleString()} Guests</span>
            <span>💰 ${totalBudget.toLocaleString()} Total Budget</span>
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "0.75rem"
          }}
        >
          <button
            id="btn-new-event-modal"
            type="button"
            className="btn btn-primary"
            onClick={onOpenNewEventModal}
            aria-haspopup="dialog"
          >
            ✨ Plan New Event
          </button>

          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              alignItems: "center"
            }}
            role="group"
            aria-label="Switch sample event preset"
          >
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Sample Presets:
            </span>
            <button
              id="btn-preset-wedding"
              type="button"
              className="btn btn-secondary"
              style={{
                padding: "0.35rem 0.65rem",
                fontSize: "0.8rem",
                borderColor: currentEventType === "wedding" ? "var(--accent-rose)" : undefined
              }}
              onClick={() => onSwitchPreset("wedding")}
            >
              💍 Wedding
            </button>
            <button
              id="btn-preset-birthday"
              type="button"
              className="btn btn-secondary"
              style={{
                padding: "0.35rem 0.65rem",
                fontSize: "0.8rem",
                borderColor: currentEventType === "birthday" ? "var(--accent-amber)" : undefined
              }}
              onClick={() => onSwitchPreset("birthday")}
            >
              🎂 Birthday
            </button>
            <button
              id="btn-preset-community"
              type="button"
              className="btn btn-secondary"
              style={{
                padding: "0.35rem 0.65rem",
                fontSize: "0.8rem",
                borderColor: currentEventType === "community" ? "var(--accent-emerald)" : undefined
              }}
              onClick={() => onSwitchPreset("community")}
            >
              🎪 Community
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
