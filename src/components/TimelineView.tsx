import React, { useState, memo } from "react";
import { TimelineMilestone, RunOfShowItem, calculatePlanningProgress } from "@/domain";

interface TimelineViewProps {
  readonly milestones: readonly TimelineMilestone[];
  readonly runOfShow: readonly RunOfShowItem[];
  readonly onToggleMilestone: (id: string) => void;
  readonly onToggleRunOfShowItem: (id: string) => void;
}

const MilestoneItemRow = memo(function MilestoneItemRow({
  milestone,
  onToggle,
}: {
  readonly milestone: TimelineMilestone;
  readonly onToggle: (id: string) => void;
}) {
  const priorityBadge =
    milestone.priority === "high"
      ? "badge badge-wedding"
      : milestone.priority === "medium"
        ? "badge badge-birthday"
        : "badge badge-community";

  const isOverdue =
    !milestone.isCompleted &&
    typeof (milestone as unknown as { isOverdue?: boolean }).isOverdue === "boolean"
      ? (milestone as unknown as { isOverdue: boolean }).isOverdue
      : false;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "1rem",
        padding: "1rem",
        background: milestone.isCompleted
          ? "var(--status-success-bg)"
          : "var(--bg-input)",
        border: "1px solid",
        borderColor: milestone.isCompleted
          ? "var(--status-success-border)"
          : "var(--border-subtle)",
        borderRadius: "10px",
        minHeight: "44px",
      }}
    >
      <label
        htmlFor={`milestone-check-${milestone.id}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          minHeight: "44px",
          minWidth: "44px",
          cursor: "pointer",
          margin: "-0.5rem 0 -0.5rem -0.5rem",
          padding: "0.5rem",
        }}
      >
        <input
          id={`milestone-check-${milestone.id}`}
          type="checkbox"
          checked={milestone.isCompleted}
          onChange={() => onToggle(milestone.id)}
          style={{
            width: "22px",
            height: "22px",
            cursor: "pointer",
            accentColor: "var(--accent-purple)",
          }}
          aria-label={`Mark "${milestone.title}" as completed`}
        />
      </label>

      <div style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.5rem",
            marginBottom: "0.25rem",
          }}
        >
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: "700",
              color: milestone.isCompleted ? "var(--text-muted)" : "var(--text-primary)",
              textDecoration: milestone.isCompleted ? "line-through" : "none",
            }}
          >
            {milestone.title}
          </h3>

          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {isOverdue && (
              <span className="badge badge-wedding" role="alert">
                ⚠️ Overdue
              </span>
            )}
            <span className={priorityBadge}>
              {milestone.priority === "high"
                ? "🔥 High Priority"
                : milestone.priority === "medium"
                  ? "⚡ Medium"
                  : "✓ Low"}
            </span>
            <span
              style={{
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                fontWeight: "600",
              }}
            >
              📅 {milestone.targetDate} ({milestone.targetDaysBeforeEvent}d before)
            </span>
          </div>
        </div>

        <p
          style={{
            fontSize: "0.9rem",
            color: "var(--text-secondary)",
            lineHeight: "1.4",
          }}
        >
          {milestone.description}
        </p>
      </div>
    </div>
  );
});

/**
 * Interactive Timeline & Run-of-Show component with milestone progress tracking,
 * calendar dates, priority indicators, and minute-level day-of coordination.
 */
export function TimelineView({
  milestones,
  runOfShow,
  onToggleMilestone,
  onToggleRunOfShowItem,
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
          gap: "1rem",
        }}
      >
        <div
          role="group"
          aria-label="Timeline display view"
          style={{
            display: "inline-flex",
            background: "var(--bg-input)",
            padding: "0.25rem",
            borderRadius: "8px",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <button
            id="btn-view-milestones"
            type="button"
            className="btn"
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.9rem",
              minHeight: "44px",
              background:
                subView === "milestones" ? "var(--accent-purple)" : "transparent",
              color: subView === "milestones" ? "#ffffff" : "var(--text-secondary)",
            }}
            onClick={() => setSubView("milestones")}
            aria-pressed={subView === "milestones"}
          >
            📅 Long-term Milestones ({milestones.length})
          </button>
          <button
            id="btn-view-run-of-show"
            type="button"
            className="btn"
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.9rem",
              minHeight: "44px",
              background:
                subView === "run_of_show" ? "var(--accent-purple)" : "transparent",
              color: subView === "run_of_show" ? "#ffffff" : "var(--text-secondary)",
            }}
            onClick={() => setSubView("run_of_show")}
            aria-pressed={subView === "run_of_show"}
          >
            ⏱️ Day-Of Run-of-Show ({runOfShow.length})
          </button>
        </div>

        {subView === "milestones" && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              Progress: <strong>{progressPercent}%</strong> Completed
            </span>
            <div
              style={{
                width: "140px",
                height: "10px",
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "5px",
                overflow: "hidden",
              }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Planning milestones progress"
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: "100%",
                  background: "var(--accent-purple)",
                  borderRadius: "5px",
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
            {milestones.map((m) => (
              <MilestoneItemRow key={m.id} milestone={m} onToggle={onToggleMilestone} />
            ))}
          </div>
        </section>
      ) : (
        /* View 2: Run-of-Show Minute-by-Minute Schedule */
        <section className="glass-panel" aria-labelledby="ros-heading">
          <h2
            id="ros-heading"
            style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "1rem" }}
          >
            ⏱️ Day-Of Master Run-of-Show
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {runOfShow.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "0.85rem 1rem",
                  background: item.isCompleted
                    ? "var(--status-success-bg)"
                    : "var(--bg-input)",
                  border: "1px solid",
                  borderColor: item.isCompleted
                    ? "var(--status-success-border)"
                    : "var(--border-subtle)",
                  borderRadius: "8px",
                  minHeight: "44px",
                }}
              >
                <label
                  htmlFor={`ros-check-${item.id}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    minHeight: "44px",
                    minWidth: "44px",
                    cursor: "pointer",
                    margin: "-0.5rem 0 -0.5rem -0.5rem",
                    padding: "0.5rem",
                  }}
                >
                  <input
                    id={`ros-check-${item.id}`}
                    type="checkbox"
                    checked={item.isCompleted}
                    onChange={() => onToggleRunOfShowItem(item.id)}
                    style={{
                      width: "20px",
                      height: "20px",
                      cursor: "pointer",
                      accentColor: "var(--accent-purple)",
                    }}
                    aria-label={`Mark "${item.activity}" at ${(item as unknown as { time?: string; startTime?: string }).time || (item as unknown as { startTime?: string }).startTime || ""} as completed`}
                  />
                </label>

                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    color: "var(--accent-cyan)",
                    minWidth: "110px",
                  }}
                >
                  {(item as unknown as { time?: string }).time ||
                    `${(item as unknown as { startTime?: string }).startTime || ""} - ${(item as unknown as { endTime?: string }).endTime || ""}`}
                </div>

                <div style={{ flex: 1 }}>
                  <span
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: "600",
                      color: item.isCompleted
                        ? "var(--text-muted)"
                        : "var(--text-primary)",
                      textDecoration: item.isCompleted ? "line-through" : "none",
                    }}
                  >
                    {item.activity}
                  </span>
                  {((item as unknown as { leadPerson?: string }).leadPerson ||
                    (item as unknown as { leadContact?: string }).leadContact) && (
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                        marginLeft: "0.5rem",
                      }}
                    >
                      (
                      {(item as unknown as { leadPerson?: string }).leadPerson ||
                        (item as unknown as { leadContact?: string }).leadContact}
                      )
                    </span>
                  )}
                </div>

                {item.location && (
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                      background: "rgba(255, 255, 255, 0.05)",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "4px",
                    }}
                  >
                    📍 {item.location}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default TimelineView;
