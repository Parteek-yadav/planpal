import React, { useState } from "react";
import { BudgetItem, BudgetSummary } from "@/domain";

interface BudgetTrackerProps {
  readonly summary: BudgetSummary;
  readonly items: readonly BudgetItem[];
  readonly onUpdateItemActual: (id: string, actualAmount: number) => void;
  readonly onTogglePaid: (id: string) => void;
}

/**
 * Interactive Budget Tracker displaying allocation cards, spending progress bar,
 * variance alerts, and accessible line-item updates.
 */
export function BudgetTracker({
  summary,
  items,
  onUpdateItemActual,
  onTogglePaid
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
      style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
    >
      {/* 4 Metrics Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem"
        }}
      >
        <div className="glass-panel" style={{ padding: "1.25rem" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Total Budget
          </span>
          <p style={{ fontSize: "1.75rem", fontWeight: "700", color: "var(--text-primary)", marginTop: "0.25rem" }}>
            ${summary.totalBudget.toLocaleString()}
          </p>
        </div>

        <div className="glass-panel" style={{ padding: "1.25rem" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Planned Allocation
          </span>
          <p style={{ fontSize: "1.75rem", fontWeight: "700", color: "var(--accent-purple)", marginTop: "0.25rem" }}>
            ${summary.totalAllocated.toLocaleString()}
          </p>
        </div>

        <div className="glass-panel" style={{ padding: "1.25rem" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Actual Spent
          </span>
          <p
            style={{
              fontSize: "1.75rem",
              fontWeight: "700",
              color: summary.isOverBudget ? "var(--status-error-text)" : "var(--status-warning-text)",
              marginTop: "0.25rem"
            }}
          >
            ${summary.totalSpent.toLocaleString()}
          </p>
        </div>

        <div className="glass-panel" style={{ padding: "1.25rem" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Remaining Funds
          </span>
          <p
            style={{
              fontSize: "1.75rem",
              fontWeight: "700",
              color: summary.remainingBudget >= 0 ? "var(--status-success-text)" : "var(--status-error-text)",
              marginTop: "0.25rem"
            }}
          >
            ${summary.remainingBudget.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Progress Bar & Alert */}
      <section className="glass-panel" aria-labelledby="budget-progress-title">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.5rem"
          }}
        >
          <h2 id="budget-progress-title" style={{ fontSize: "1rem", fontWeight: "600" }}>
            Spending Progress: {percentSpent}%
          </h2>
          {summary.isOverBudget && (
            <span
              style={{
                fontSize: "0.8rem",
                color: "var(--status-error-text)",
                fontWeight: "600",
                background: "var(--status-error-bg)",
                padding: "0.25rem 0.5rem",
                borderRadius: "4px"
              }}
              role="alert"
            >
              ⚠️ Over budget by ${Math.abs(summary.remainingBudget).toLocaleString()} ({summary.variancePercentage}%)
            </span>
          )}
        </div>

        <div
          style={{
            width: "100%",
            height: "12px",
            background: "rgba(255, 255, 255, 0.08)",
            borderRadius: "6px",
            overflow: "hidden"
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
              borderRadius: "6px",
              transition: "width 0.3s ease"
            }}
          />
        </div>
      </section>

      {/* Line Items Table */}
      <section className="glass-panel" aria-labelledby="budget-items-title">
        <h2 id="budget-items-title" style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "1rem" }}>
          Line Item Breakdown
        </h2>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "0.9rem"
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
                <th style={{ padding: "0.75rem 0.5rem" }}>Category & Name</th>
                <th style={{ padding: "0.75rem 0.5rem" }}>Allocated</th>
                <th style={{ padding: "0.75rem 0.5rem" }}>Actual Cost</th>
                <th style={{ padding: "0.75rem 0.5rem" }}>Paid Status</th>
                <th style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                    backgroundColor: item.actualAmount > item.allocatedAmount ? "rgba(244, 63, 94, 0.04)" : undefined
                  }}
                >
                  <td style={{ padding: "0.85rem 0.5rem" }}>
                    <div style={{ fontWeight: "600", color: "var(--text-primary)" }}>{item.name}</div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "capitalize" }}>
                      {item.category.replace("_", " & ")}
                    </span>
                  </td>

                  <td style={{ padding: "0.85rem 0.5rem", color: "var(--text-secondary)" }}>
                    ${item.allocatedAmount.toLocaleString()}
                  </td>

                  <td style={{ padding: "0.85rem 0.5rem" }}>
                    {editingItemId === item.id ? (
                      <input
                        id={`input-actual-${item.id}`}
                        type="number"
                        min="0"
                        step="10"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="form-input"
                        style={{ width: "120px", padding: "0.35rem 0.5rem" }}
                        aria-label={`Actual cost for ${item.name}`}
                        autoFocus
                      />
                    ) : (
                      <span
                        style={{
                          fontWeight: "600",
                          color: item.actualAmount > item.allocatedAmount ? "var(--status-error-text)" : "var(--text-primary)"
                        }}
                      >
                        ${item.actualAmount.toLocaleString()}
                      </span>
                    )}
                  </td>

                  <td style={{ padding: "0.85rem 0.5rem" }}>
                    <label
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        color: item.isPaid ? "var(--status-success-text)" : "var(--text-muted)"
                      }}
                    >
                      <input
                        id={`checkbox-paid-${item.id}`}
                        type="checkbox"
                        checked={item.isPaid}
                        onChange={() => onTogglePaid(item.id)}
                        style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--accent-purple)" }}
                      />
                      <span>{item.isPaid ? "Paid" : "Pending"}</span>
                    </label>
                  </td>

                  <td style={{ padding: "0.85rem 0.5rem", textAlign: "right" }}>
                    {editingItemId === item.id ? (
                      <div style={{ display: "inline-flex", gap: "0.35rem" }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
                          onClick={() => handleSaveEdit(item.id)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        id={`btn-edit-${item.id}`}
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: "0.3rem 0.65rem", fontSize: "0.8rem" }}
                        onClick={() => handleStartEdit(item)}
                      >
                        ✏️ Edit Cost
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
