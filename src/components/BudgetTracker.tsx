import React, { useState, Suspense, lazy, memo } from "react";
import { BudgetItem, BudgetSummary } from "@/domain";

const LazyBudgetChart = lazy(() => import("./BudgetChart"));

interface BudgetTrackerProps {
  readonly summary: BudgetSummary;
  readonly items: readonly BudgetItem[];
  readonly onUpdateItemActual: (id: string, actualAmount: number) => void;
  readonly onTogglePaid: (id: string) => void;
}

interface BudgetItemRowProps {
  readonly item: BudgetItem;
  readonly isEditing: boolean;
  readonly editValue: string;
  readonly onStartEdit: (item: BudgetItem) => void;
  readonly onEditChange: (val: string) => void;
  readonly onSaveEdit: (id: string) => void;
  readonly onCancelEdit: () => void;
  readonly onTogglePaid: (id: string) => void;
}

const BudgetItemRow = memo(function BudgetItemRow({
  item,
  isEditing,
  editValue,
  onStartEdit,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  onTogglePaid,
}: BudgetItemRowProps) {
  const isOver = item.actualAmount > item.allocatedAmount;
  const isApproaching =
    !isOver &&
    item.allocatedAmount > 0 &&
    item.actualAmount >= item.allocatedAmount * 0.9;

  let statusText = "✓ On Track";
  let statusBadgeClass = "badge badge-community";
  if (isOver) {
    statusText = "❌ Over Budget";
    statusBadgeClass = "badge badge-wedding";
  } else if (isApproaching) {
    statusText = "⚠️ Near Limit";
    statusBadgeClass = "badge badge-birthday";
  }

  return (
    <tr
      key={item.id}
      style={{
        borderBottom: "1px solid var(--border-subtle)",
        backgroundColor: isOver ? "var(--status-error-bg)" : undefined,
      }}
    >
      <th
        scope="row"
        style={{
          padding: "0.85rem 0.75rem",
          textAlign: "left",
          fontWeight: "600",
          color: "var(--text-primary)",
        }}
      >
        <div>{item.name}</div>
        <span
          style={{
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            textTransform: "capitalize",
            fontWeight: "normal",
          }}
        >
          {item.category.replace(/_/g, " & ")}
        </span>
      </th>

      <td style={{ padding: "0.85rem 0.75rem", color: "var(--text-secondary)" }}>
        ${item.allocatedAmount.toLocaleString()}
      </td>

      <td style={{ padding: "0.85rem 0.75rem" }}>
        {isEditing ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label htmlFor={`input-actual-${item.id}`} className="visually-hidden">
              Actual cost for {item.name}
            </label>
            <input
              id={`input-actual-${item.id}`}
              type="number"
              min="0"
              step="10"
              value={editValue}
              onChange={(e) => onEditChange(e.target.value)}
              className="form-input"
              style={{ width: "120px", minHeight: "44px", padding: "0.35rem 0.5rem" }}
              aria-label={`Actual cost for ${item.name}`}
              autoFocus
            />
          </div>
        ) : (
          <span
            style={{
              fontWeight: "700",
              color: isOver ? "var(--status-error-text)" : "var(--text-primary)",
            }}
          >
            ${item.actualAmount.toLocaleString()}
          </span>
        )}
      </td>

      {/* Status never conveyed by color alone: Icon + Text */}
      <td style={{ padding: "0.85rem 0.75rem" }}>
        <span className={statusBadgeClass}>{statusText}</span>
      </td>

      {/* Paid Status with Checkbox + Label (min 44px touch target) */}
      <td style={{ padding: "0.85rem 0.75rem" }}>
        <label
          htmlFor={`paid-toggle-${item.id}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            cursor: "pointer",
            minHeight: "44px",
            fontSize: "0.9rem",
            color: "var(--text-primary)",
          }}
        >
          <input
            id={`paid-toggle-${item.id}`}
            type="checkbox"
            checked={item.isPaid}
            onChange={() => onTogglePaid(item.id)}
            style={{
              width: "20px",
              height: "20px",
              cursor: "pointer",
              accentColor: "var(--accent-purple)",
            }}
            aria-label={`Toggle paid status for ${item.name}: currently ${item.isPaid ? "Paid" : "Unpaid"}`}
          />
          <span>{item.isPaid ? "✅ Paid" : "⏳ Unpaid"}</span>
        </label>
      </td>

      <td style={{ padding: "0.85rem 0.75rem", textAlign: "right" }}>
        {isEditing ? (
          <div style={{ display: "inline-flex", gap: "0.5rem" }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{
                minHeight: "44px",
                padding: "0.4rem 0.75rem",
                fontSize: "0.85rem",
              }}
              onClick={() => onSaveEdit(item.id)}
              aria-label={`Save cost for ${item.name}`}
            >
              Save
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{
                minHeight: "44px",
                padding: "0.4rem 0.75rem",
                fontSize: "0.85rem",
              }}
              onClick={onCancelEdit}
              aria-label={`Cancel editing cost for ${item.name}`}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-secondary"
            style={{ minHeight: "44px", padding: "0.4rem 0.75rem", fontSize: "0.85rem" }}
            onClick={() => onStartEdit(item)}
            aria-label={`Edit Cost for ${item.name}`}
          >
            ✏️ Edit Cost
          </button>
        )}
      </td>
    </tr>
  );
});

/**
 * Interactive Budget Tracker displaying allocation metrics, spending progress,
 * a lazy-loaded visual chart, and an equivalent accessible data table.
 */
export function BudgetTracker({
  summary,
  items,
  onUpdateItemActual,
  onTogglePaid,
}: BudgetTrackerProps): React.JSX.Element {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const percentSpent =
    summary.totalBudget > 0
      ? Math.min(100, Math.round((summary.totalSpent / summary.totalBudget) * 100))
      : 0;

  const handleStartEdit = (item: BudgetItem) => {
    setEditingItemId(item.id);
    setEditValue(item.actualAmount.toString());
  };

  const handleSaveEdit = (id: string) => {
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdateItemActual(id, parsed);
    }
    setEditingItemId(null);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
  };

  return (
    <div
      id="tabpanel-budget"
      role="tabpanel"
      aria-labelledby="tab-budget"
      tabIndex={0}
      style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}
    >
      {/* 4 Summary Metrics Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
        }}
        role="region"
        aria-label="Budget Key Summary Metrics"
      >
        <div className="glass-panel" style={{ padding: "1.25rem" }}>
          <span
            style={{
              fontSize: "0.85rem",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              fontWeight: "600",
            }}
          >
            Total Budget
          </span>
          <p
            style={{
              fontSize: "1.75rem",
              fontWeight: "800",
              color: "var(--text-primary)",
              marginTop: "0.25rem",
            }}
          >
            ${summary.totalBudget.toLocaleString()}
          </p>
        </div>

        <div className="glass-panel" style={{ padding: "1.25rem" }}>
          <span
            style={{
              fontSize: "0.85rem",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              fontWeight: "600",
            }}
          >
            Planned Allocation
          </span>
          <p
            style={{
              fontSize: "1.75rem",
              fontWeight: "800",
              color: "var(--accent-purple)",
              marginTop: "0.25rem",
            }}
          >
            ${summary.totalAllocated.toLocaleString()}
          </p>
        </div>

        <div className="glass-panel" style={{ padding: "1.25rem" }}>
          <span
            style={{
              fontSize: "0.85rem",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              fontWeight: "600",
            }}
          >
            Actual Spent
          </span>
          <p
            style={{
              fontSize: "1.75rem",
              fontWeight: "800",
              color: summary.isOverBudget
                ? "var(--status-error-text)"
                : "var(--status-warning-text)",
              marginTop: "0.25rem",
            }}
          >
            ${summary.totalSpent.toLocaleString()}
          </p>
        </div>

        <div className="glass-panel" style={{ padding: "1.25rem" }}>
          <span
            style={{
              fontSize: "0.85rem",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              fontWeight: "600",
            }}
          >
            Remaining Balance
          </span>
          <p
            style={{
              fontSize: "1.75rem",
              fontWeight: "800",
              color:
                summary.remainingBudget >= 0
                  ? "var(--status-success-text)"
                  : "var(--status-error-text)",
              marginTop: "0.25rem",
            }}
          >
            ${summary.remainingBudget.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Spending Progress & Status Alert */}
      <section className="glass-panel" aria-labelledby="budget-progress-title">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.75rem",
            marginBottom: "0.75rem",
          }}
        >
          <h2
            id="budget-progress-title"
            style={{ fontSize: "1.1rem", fontWeight: "700" }}
          >
            Spending Progress: {percentSpent}%
          </h2>
          {summary.isOverBudget ? (
            <span
              className="badge badge-wedding"
              role="alert"
              style={{ fontSize: "0.85rem" }}
            >
              ⚠️ Over budget by ${Math.abs(summary.remainingBudget).toLocaleString()} (
              {summary.variancePercentage}%)
            </span>
          ) : (
            <span className="badge badge-community" style={{ fontSize: "0.85rem" }}>
              ✓ On budget (${summary.remainingBudget.toLocaleString()} remaining)
            </span>
          )}
        </div>

        <div
          style={{
            width: "100%",
            height: "14px",
            background: "rgba(255, 255, 255, 0.08)",
            borderRadius: "7px",
            overflow: "hidden",
          }}
          role="progressbar"
          aria-valuenow={percentSpent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Budget consumption percentage"
        >
          <div
            style={{
              width: `${percentSpent}%`,
              height: "100%",
              background: summary.isOverBudget
                ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                : "linear-gradient(90deg, #10b981, #06b6d4)",
              borderRadius: "7px",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </section>

      {/* Lazy-Loaded Visual Chart */}
      <section className="glass-panel" aria-labelledby="budget-chart-section-title">
        <h2
          id="budget-chart-section-title"
          style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "0.75rem" }}
        >
          Visual Budget Allocation Chart
        </h2>
        <Suspense
          fallback={
            <div className="skeleton-card" role="status" aria-live="polite">
              <span>📊 Rendering budget allocation chart...</span>
            </div>
          }
        >
          <LazyBudgetChart summary={summary} items={items} />
        </Suspense>
      </section>

      {/* Equivalent Accessible Data Table */}
      <section className="glass-panel" aria-labelledby="budget-items-title">
        <h2
          id="budget-items-title"
          style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "1rem" }}
        >
          Line Item Breakdown & Spending Status
        </h2>

        <div style={{ overflowX: "auto", width: "100%" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "0.95rem",
            }}
          >
            <caption className="visually-hidden">
              Complete breakdown of event budget line items with allocated amounts, actual
              costs, status warnings, and payment toggles.
            </caption>
            <thead>
              <tr
                style={{
                  borderBottom: "2px solid var(--border-subtle)",
                  color: "var(--text-secondary)",
                }}
              >
                <th scope="col" style={{ padding: "0.75rem" }}>
                  Category & Name
                </th>
                <th scope="col" style={{ padding: "0.75rem" }}>
                  Allocated
                </th>
                <th scope="col" style={{ padding: "0.75rem" }}>
                  Actual Cost
                </th>
                <th scope="col" style={{ padding: "0.75rem" }}>
                  Budget Status
                </th>
                <th scope="col" style={{ padding: "0.75rem" }}>
                  Payment
                </th>
                <th scope="col" style={{ padding: "0.75rem", textAlign: "right" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <BudgetItemRow
                  key={item.id}
                  item={item}
                  isEditing={editingItemId === item.id}
                  editValue={editValue}
                  onStartEdit={handleStartEdit}
                  onEditChange={setEditValue}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onTogglePaid={onTogglePaid}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default BudgetTracker;
