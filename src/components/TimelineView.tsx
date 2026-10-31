import React, { useState } from "react";
import { TimelineMilestone, RunOfShowItem, calculatePlanningProgress } from "@/domain";

interface TimelineViewProps {
  readonly milestones: readonly TimelineMilestone[];
  readonly runOfShow: readonly RunOfShowItem[];
  readonly onToggleMilestone: (id: string) => void;
  readonly onToggleRunOfShowItem: (id: string) => void;
}

/**
 * Interactive Timeline & Run-of-Show component with milestone progress tracking,
 * calendar dates, priority indicators, and minute-level day-of coordination.
 */
export function TimelineView({
  milestones,
  runOfShow,
  onToggleMilestone,
  onToggleRunOfShowItem
}: TimelineViewProps): React.JSX.Element {
  const [subView, setSubView] = useState<"milestones" | "run_of_show">("milestones");
  const progressPercent = calculatePlanningProgress(milestones);

  return (
    <div
      id="tabpanel-timeline"
      role="tabpanel"
      aria-labelledby="tab-timeline"
      tabIndex={0}
      style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
    >
      {/* Sub-navigation pill toggle */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem"
        }}
      >
        <div
          role="group"
          aria-label="Timeline display view"
          style={{
            display: "inline-flex",
            background: "rgba(255, 255, 255, 0.05)",
            padding: "0.25rem",
            borderRadius: "8px",
            border: "1px solid var(--border-subtle)"
          }}
        >
          <button
            id="btn-view-milestones"
            type="button"
            className="btn"
            style={{
              padding: "0.45rem 1rem",
              fontSize: "0.875rem",
              background: subView === "milestones" ? "var(--accent-purple)" : "transparent",
              color: subView === "milestones" ? "#ffffff" : "var(--text-secondary)"
            }}
            onClick={() => setSubView("milestones")}
          >
            📅 Long-term Milestones ({milestones.length})
          </button>
          <button
            id="btn-view-run-of-show"
            type="button"
            className="btn"
            style={{
              padding: "0.45rem 1rem",
              fontSize: "0.875rem",
              background: subView === "run_of_show" ? "var(--accent-purple)" : "transparent",
              color: subView === "run_of_show" ? "#ffffff" : "var(--text-secondary)"
            }}
            onClick={() => setSubView("run_of_show")}
          >
            ⏱️ Day-Of Run-of-Show ({runOfShow.length})
          </button>
        </div>

        {subView === "milestones" && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              Progress: <strong>{progressPercent}%</strong> Completed
            </span>
            <div
              style={{
                width: "120px",
                height: "8px",
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "4px",
                overflow: "hidden"
              }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: "100%",
                  background: "var(--accent-purple)",
                  borderRadius: "4px"
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* View 1: Milestones Checklist */}
      {subView === "milestones" ? (
        <section className="glass-panel" aria-labelledby="milestones-heading">
          <h2 id="milestones-heading" className="visually-hidden">
            Planning Milestones
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {milestones.map((m) => {
              const priorityColor =
                m.priority === "high"
                  ? "var(--accent-rose)"
                  : m.priority === "medium"
                    ? "var(--accent-amber)"
                    : "var(--accent-cyan)";

              return (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "1rem",
                    padding: "1rem",
                    background: m.isCompleted
                      ? "rgba(16, 185, 129, 0.05)"
                      : "rgba(255, 255, 255, 0.02)",
                    border: "1px solid",
                    borderColor: m.isCompleted ? "rgba(16, 185, 129, 0.2)" : "var(--border-subtle)",
                    borderRadius: "10px",
                    transition: "all var(--transition-fast)"
                  }}
                >
                  <input
                    id={`milestone-check-${m.id}`}
                    type="checkbox"
                    checked={m.isCompleted}
                    onChange={() => onToggleMilestone(m.id)}
                    style={{
                      width: "20px",
                      height: "20px",
                      marginTop: "0.2rem",
                      cursor: "pointer",
                      accentColor: "var(--accent-purple)"
                    }}
                    aria-label={`Mark "${m.title}" as completed`}
                  />

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                        marginBottom: "0.25rem"
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "1rem",
                          fontWeight: "600",
                          color: m.isCompleted ? "var(--text-muted)" : "var(--text-primary)",
                          textDecoration: m.isCompleted ? "line-through" : "none"
                        }}
                      >
                        {m.title}
                      </h3>

                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.15rem 0.45rem",
                            borderRadius: "4px",
                            color: priorityColor,
                            border: `1px solid ${priorityColor}`,
                            textTransform: "uppercase"
                          }}
                        >
                          {m.priority}
                        </span>
                        <span
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--text-secondary)",
                            fontWeight: "500"
                          }}
                        >
                          📅 {m.targetDate} ({m.targetDaysBeforeEvent}d before)
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                      {m.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        /* View 2: Run-of-Show Minute-by-Minute Schedule */
        <section className="glass-panel" aria-labelledby="ros-heading">
          <h2 id="ros-heading" style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "1rem" }}>
            Day-Of Minute Schedule & Assignments
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {runOfShow.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1.25rem",
                  padding: "0.85rem 1rem",
                  background: item.isCompleted
                    ? "rgba(16, 185, 129, 0.05)"
                    : "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "8px"
                }}
              >
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "700",
                    color: "var(--accent-purple)",
                    minWidth: "65px"
                  }}
                >
                  {item.time}
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: "600",
                      color: item.isCompleted ? "var(--text-muted)" : "var(--text-primary)",
                      textDecoration: item.isCompleted ? "line-through" : "none"
                    }}
                  >
                    {item.activity}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>
                    <span>👤 Lead: <strong>{item.leadPerson}</strong></span>
                    <span style={{ margin: "0 0.5rem" }}>•</span>
                    <span>📍 <strong>{item.location}</strong></span>
                  </div>
                </div>

                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    color: item.isCompleted ? "var(--status-success-text)" : "var(--text-muted)"
                  }}
                >
                  <input
                    id={`ros-check-${item.id}`}
                    type="checkbox"
                    checked={item.isCompleted}
                    onChange={() => onToggleRunOfShowItem(item.id)}
                    style={{
                      width: "18px",
                      height: "18px",
                      cursor: "pointer",
                      accentColor: "var(--accent-purple)"
                    }}
                    aria-label={`Mark "${item.activity}" completed`}
                  />
                  <span>Done</span>
                </label>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
