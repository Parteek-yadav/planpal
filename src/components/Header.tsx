import React from "react";
import { EventType } from "@/domain";
import { ColorTheme } from "@/hooks/useEventPlanner";

interface HeaderProps {
  readonly currentEventType: EventType;
  readonly eventTitle: string;
  readonly eventDate: string;
  readonly guestCount: number;
  readonly totalBudget: number;
  readonly onOpenNewEventModal: () => void;
  readonly onSwitchPreset: (type: EventType) => void;
  readonly theme?: ColorTheme;
  readonly onThemeChange?: (theme: ColorTheme) => void;
  readonly onExportJson?: () => void;
  readonly onPrintPlan?: () => void;
  readonly onOpenClearModal?: () => void;
}

/**
 * Top application header presenting branding, event summary chips,
 * theme toggle controls, and quick-switch preset buttons for event archetypes.
 */
export function Header({
  currentEventType,
  eventTitle,
  eventDate,
  guestCount,
  totalBudget,
  onOpenNewEventModal,
  onSwitchPreset,
  theme = "system",
  onThemeChange,
  onExportJson,
  onPrintPlan,
  onOpenClearModal,
}: HeaderProps): React.JSX.Element {
  const badgeClass =
    currentEventType === "wedding"
      ? "badge badge-wedding"
      : currentEventType === "birthday"
        ? "badge badge-birthday"
        : "badge badge-community";

  return (
    <header role="banner" className="glass-panel" style={{ marginBottom: "2rem" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1.25rem",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "0.5rem",
            }}
          >
            <span
              style={{
                fontSize: "1.75rem",
                fontWeight: "900",
                letterSpacing: "-0.03em",
                color: "var(--accent-purple)",
              }}
            >
              PlanPal
            </span>
            <span className={badgeClass}>{currentEventType}</span>
          </div>
          <h1
            id="event-main-title"
            style={{
              fontSize: "1.5rem",
              fontWeight: "800",
              color: "var(--text-primary)",
              marginBottom: "0.35rem",
            }}
          >
            {eventTitle}
          </h1>
          <p
            style={{
              fontSize: "0.95rem",
              color: "var(--text-secondary)",
              display: "flex",
              flexWrap: "wrap",
              gap: "1.25rem",
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
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            {/* Theme Switcher */}
            {onThemeChange && (
              <div
                role="group"
                aria-label="Color theme selection"
                style={{
                  display: "inline-flex",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "8px",
                  padding: "2px",
                }}
              >
                <button
                  type="button"
                  onClick={() => onThemeChange("light")}
                  className="btn"
                  style={{
                    padding: "0.35rem 0.65rem",
                    fontSize: "0.85rem",
                    minHeight: "40px",
                    background:
                      theme === "light" ? "var(--accent-purple)" : "transparent",
                    color: theme === "light" ? "#ffffff" : "var(--text-muted)",
                  }}
                  aria-pressed={theme === "light"}
                  aria-label="Switch to light theme"
                >
                  ☀️ Light
                </button>
                <button
                  type="button"
                  onClick={() => onThemeChange("dark")}
                  className="btn"
                  style={{
                    padding: "0.35rem 0.65rem",
                    fontSize: "0.85rem",
                    minHeight: "40px",
                    background: theme === "dark" ? "var(--accent-purple)" : "transparent",
                    color: theme === "dark" ? "#ffffff" : "var(--text-muted)",
                  }}
                  aria-pressed={theme === "dark"}
                  aria-label="Switch to dark theme"
                >
                  🌙 Dark
                </button>
                <button
                  type="button"
                  onClick={() => onThemeChange("system")}
                  className="btn"
                  style={{
                    padding: "0.35rem 0.65rem",
                    fontSize: "0.85rem",
                    minHeight: "40px",
                    background:
                      theme === "system" ? "var(--accent-purple)" : "transparent",
                    color: theme === "system" ? "#ffffff" : "var(--text-muted)",
                  }}
                  aria-pressed={theme === "system"}
                  aria-label="Use system color theme"
                >
                  💻 Auto
                </button>
              </div>
            )}

            <button
              id="btn-new-event-modal"
              type="button"
              className="btn btn-primary"
              onClick={onOpenNewEventModal}
              aria-haspopup="dialog"
              style={{ minHeight: "44px" }}
            >
              ✨ Plan New Event
            </button>
          </div>

          {/* Data Management & Export Toolbar */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              alignItems: "center",
              flexWrap: "wrap",
            }}
            role="group"
            aria-label="Plan export and data management"
          >
            {onExportJson && (
              <button
                id="btn-export-json"
                type="button"
                className="btn btn-secondary"
                onClick={onExportJson}
                style={{
                  padding: "0.35rem 0.75rem",
                  fontSize: "0.85rem",
                  minHeight: "44px",
                }}
                aria-label="Export plan as JSON file"
              >
                📥 Export JSON
              </button>
            )}
            {onPrintPlan && (
              <button
                id="btn-print-plan"
                type="button"
                className="btn btn-secondary"
                onClick={onPrintPlan}
                style={{
                  padding: "0.35rem 0.75rem",
                  fontSize: "0.85rem",
                  minHeight: "44px",
                }}
                aria-label="Print event plan or save as PDF"
              >
                🖨️ Print View
              </button>
            )}
            {onOpenClearModal && (
              <button
                id="btn-clear-data"
                type="button"
                className="btn btn-secondary"
                onClick={onOpenClearModal}
                style={{
                  padding: "0.35rem 0.75rem",
                  fontSize: "0.85rem",
                  minHeight: "44px",
                  borderColor: "var(--status-error-border)",
                  color: "var(--status-error-text)",
                }}
                aria-label="Clear all stored event data with confirmation"
              >
                🗑️ Clear All
              </button>
            )}
          </div>

          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              alignItems: "center",
              flexWrap: "wrap",
            }}
            role="group"
            aria-label="Switch sample event preset"
          >
            <span
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                fontWeight: "500",
              }}
            >
              Sample Presets:
            </span>
            <button
              id="btn-preset-wedding"
              type="button"
              className="btn btn-secondary"
              style={{
                padding: "0.35rem 0.65rem",
                fontSize: "0.85rem",
                minHeight: "44px",
                borderColor:
                  currentEventType === "wedding" ? "var(--accent-rose)" : undefined,
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
                fontSize: "0.85rem",
                minHeight: "44px",
                borderColor:
                  currentEventType === "birthday" ? "var(--accent-amber)" : undefined,
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
                fontSize: "0.85rem",
                minHeight: "44px",
                borderColor:
                  currentEventType === "community" ? "var(--accent-emerald)" : undefined,
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

export default Header;
