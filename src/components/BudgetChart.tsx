import React, { useMemo } from "react";
import { BudgetItem, BudgetSummary } from "@/domain";

export interface BudgetChartProps {
  readonly summary: BudgetSummary;
  readonly items: readonly BudgetItem[];
}

/**
 * Accessible SVG Budget Breakdown Chart visualizing planned allocations and actual spend.
 * Designed for lazy loading with zero external chart library overhead.
 * Provides accessible SVG semantics, high contrast ratios, and pattern-backed bars.
 */
export function BudgetChart({ summary, items }: BudgetChartProps): React.JSX.Element {
  const chartData = useMemo(() => {
    return items.map((item) => {
      const pctAllocated =
        summary.totalBudget > 0
          ? Math.round((item.allocatedAmount / summary.totalBudget) * 100)
          : 0;
      const pctSpent =
        item.allocatedAmount > 0
          ? Math.round((item.actualAmount / item.allocatedAmount) * 100)
          : 0;
      const isOver = item.actualAmount > item.allocatedAmount;

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        allocatedAmount: item.allocatedAmount,
        actualAmount: item.actualAmount,
        pctAllocated,
        pctSpent,
        isOver,
      };
    });
  }, [items, summary.totalBudget]);

  const barHeight = 28;
  const barGap = 20;
  const topOffset = 40;
  const totalChartHeight = Math.max(
    160,
    topOffset + chartData.length * (barHeight + barGap) + 40,
  );

  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
        padding: "0.5rem 0",
      }}
    >
      {/* Legend with Icon + Text */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "1.5rem",
          marginBottom: "1rem",
          fontSize: "0.875rem",
          color: "var(--text-secondary)",
        }}
        role="region"
        aria-label="Chart Legend"
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              width: "16px",
              height: "16px",
              background: "var(--accent-purple)",
              borderRadius: "3px",
              display: "inline-block",
            }}
            aria-hidden="true"
          />
          <span>📊 Planned Allocation</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              width: "16px",
              height: "16px",
              background: "var(--accent-cyan)",
              borderRadius: "3px",
              display: "inline-block",
            }}
            aria-hidden="true"
          />
          <span>💳 Actual Spent (Within Budget)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              width: "16px",
              height: "16px",
              background: "var(--status-error-text)",
              borderRadius: "3px",
              display: "inline-block",
            }}
            aria-hidden="true"
          />
          <span>⚠️ Actual Spent (Over Allocation)</span>
        </div>
      </div>

      <svg
        role="img"
        aria-labelledby="budget-chart-title budget-chart-desc"
        viewBox={`0 0 680 ${totalChartHeight}`}
        style={{
          width: "100%",
          maxWidth: "100%",
          height: "auto",
          fontFamily: "inherit",
        }}
      >
        <title id="budget-chart-title">Event Budget Allocation and Spending Chart</title>
        <desc id="budget-chart-desc">
          Bar chart depicting planned allocation versus actual spend for {items.length}{" "}
          categories. Total budget: ${summary.totalBudget.toLocaleString()}, spent: $
          {summary.totalSpent.toLocaleString()}.
        </desc>

        <defs>
          <pattern
            id="diagonalHatch"
            width="8"
            height="8"
            patternTransform="rotate(45 0 0)"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="8"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="2"
            />
          </pattern>
        </defs>

        {chartData.map((d, index) => {
          const y = topOffset + index * (barHeight + barGap);
          const maxAmount = Math.max(summary.totalBudget * 0.5, 1);
          const plannedWidth = Math.min(
            320,
            Math.round((d.allocatedAmount / maxAmount) * 320),
          );
          const actualWidth = Math.min(
            320,
            Math.round((d.actualAmount / maxAmount) * 320),
          );

          return (
            <g
              key={d.id}
              transform={`translate(0, ${y})`}
              role="group"
              aria-label={`${d.name}: planned $${d.allocatedAmount}, actual $${d.actualAmount}`}
            >
              {/* Category Label */}
              <text
                x="0"
                y="12"
                fill="var(--text-primary)"
                fontSize="13"
                fontWeight="600"
              >
                {d.name.length > 22 ? `${d.name.slice(0, 20)}...` : d.name}
              </text>

              {/* Background Track */}
              <rect
                x="180"
                y="0"
                width="340"
                height={barHeight}
                rx="4"
                fill="rgba(255, 255, 255, 0.05)"
                stroke="var(--border-subtle)"
                strokeWidth="1"
              />

              {/* Planned Bar */}
              <rect
                x="180"
                y="2"
                width={Math.max(4, plannedWidth)}
                height={barHeight / 2 - 2}
                rx="3"
                fill="var(--accent-purple)"
                opacity="0.85"
              />

              {/* Actual Spent Bar */}
              <rect
                x="180"
                y={barHeight / 2 + 1}
                width={Math.max(4, actualWidth)}
                height={barHeight / 2 - 3}
                rx="3"
                fill={d.isOver ? "var(--status-error-text)" : "var(--accent-cyan)"}
              />

              {/* Text Metrics Label */}
              <text
                x="530"
                y="13"
                fill="var(--text-primary)"
                fontSize="12"
                fontWeight="600"
              >
                ${d.actualAmount.toLocaleString()} / ${d.allocatedAmount.toLocaleString()}
              </text>
              <text
                x="530"
                y="25"
                fill={d.isOver ? "var(--status-error-text)" : "var(--text-muted)"}
                fontSize="11"
              >
                {d.isOver
                  ? `⚠️ +$${(d.actualAmount - d.allocatedAmount).toLocaleString()}`
                  : `✓ ${d.pctSpent}% spent`}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default BudgetChart;
