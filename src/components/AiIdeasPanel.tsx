import React from "react";
import { AiPlanSuggestion } from "@/services";

interface AiIdeasPanelProps {
  readonly suggestions: AiPlanSuggestion;
  readonly isLoading: boolean;
  readonly onRegenerate: () => void;
}

/**
 * Presentation panel displaying GenAI personalized concepts,
 * color palettes, timeline tips, budget strategies, and contingency plans.
 */
export function AiIdeasPanel({
  suggestions,
  isLoading,
  onRegenerate
}: AiIdeasPanelProps): React.JSX.Element {
  return (
    <div
      id="tabpanel-ai_plan"
      role="tabpanel"
      aria-labelledby="tab-ai_plan"
      tabIndex={0}
      style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
    >
      {/* Overview Card */}
      <section className="glass-panel" aria-labelledby="section-overview-title">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "1rem"
          }}
        >
          <div>
            <h2
              id="section-overview-title"
              style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                color: "var(--text-primary)",
                marginBottom: "0.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              <span>🤖</span> AI Event Strategy Overview
            </h2>
            <p style={{ color: "var(--text-secondary)", maxWidth: "800px", lineHeight: "1.6" }}>
              {suggestions.overview}
            </p>
          </div>
          <button
            id="btn-regenerate-ai"
            type="button"
            className="btn btn-primary"
            onClick={onRegenerate}
            disabled={isLoading}
          >
            {isLoading ? "⚡ Analyzing..." : "🔄 Refresh AI Insights"}
          </button>
        </div>
      </section>

      {/* Theme Concepts with Color Palettes */}
      <section className="glass-panel" aria-labelledby="section-themes-title">
        <h2
          id="section-themes-title"
          style={{
            fontSize: "1.2rem",
            fontWeight: "700",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}
        >
          <span>🎨</span> Creative Themes & Color Schemes
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.25rem"
          }}
        >
          {suggestions.themeIdeas.map((theme, idx) => (
            <article
              key={`theme-${idx}`}
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "10px",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem"
              }}
            >
              <h3
                style={{
                  fontSize: "1.05rem",
                  fontWeight: "600",
                  color: "var(--text-primary)"
                }}
              >
                {theme.title}
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", flex: 1 }}>
                {theme.description}
              </p>
              <div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: "0.35rem"
                  }}
                >
                  Curated Palette:
                </span>
                <div
                  style={{ display: "flex", gap: "0.5rem" }}
                  role="list"
                  aria-label={`Color palette for ${theme.title}`}
                >
                  {theme.colorPalette.map((color, cIdx) => (
                    <div
                      key={`color-${idx}-${cIdx}`}
                      role="listitem"
                      title={color}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        backgroundColor: color,
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                      }}
                      aria-label={`Color ${color}`}
                    />
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Grid: Budget Optimization + Contingency Plan */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.5rem"
        }}
      >
        {/* Budget Optimization Tips */}
        <section className="glass-panel" aria-labelledby="section-budget-tips-title">
          <h2
            id="section-budget-tips-title"
            style={{
              fontSize: "1.15rem",
              fontWeight: "700",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            <span>💡</span> Budget Optimization Strategies
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {suggestions.budgetOptimizationTips.map((tip, idx) => (
              <div
                key={`opt-${idx}`}
                style={{
                  padding: "0.85rem",
                  background: "rgba(255, 255, 255, 0.02)",
                  borderRadius: "8px",
                  borderLeft: "3px solid var(--accent-emerald)"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.25rem"
                  }}
                >
                  <span
                    style={{
                      fontWeight: "600",
                      fontSize: "0.9rem",
                      color: "var(--text-primary)"
                    }}
                  >
                    {tip.category}
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--status-success-text)",
                      fontWeight: "600",
                      background: "var(--status-success-bg)",
                      padding: "0.15rem 0.45rem",
                      borderRadius: "4px"
                    }}
                  >
                    {tip.estimatedImpact}
                  </span>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  {tip.savingStrategy}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Contingency Plan & Timeline Advice */}
        <section className="glass-panel" aria-labelledby="section-contingency-title">
          <h2
            id="section-contingency-title"
            style={{
              fontSize: "1.15rem",
              fontWeight: "700",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            <span>🛡️</span> Risk & Contingency Playbook
          </h2>
          <div
            style={{
              padding: "1rem",
              background: "rgba(244, 63, 94, 0.05)",
              border: "1px solid rgba(244, 63, 94, 0.2)",
              borderRadius: "8px",
              marginBottom: "1rem"
            }}
          >
            <h3
              style={{
                fontSize: "0.95rem",
                fontWeight: "600",
                color: "var(--status-error-text)",
                marginBottom: "0.35rem"
              }}
            >
              Risk Scenario: {suggestions.contingencyPlan.riskScenario}
            </h3>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                marginBottom: "0.5rem"
              }}
            >
              <strong>Mitigation:</strong> {suggestions.contingencyPlan.mitigation}
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              <strong>Backup Plan:</strong> {suggestions.contingencyPlan.backupOption}
            </p>
          </div>

          <h3
            style={{
              fontSize: "0.95rem",
              fontWeight: "600",
              color: "var(--text-primary)",
              marginBottom: "0.5rem"
            }}
          >
            Key Timing Advice:
          </h3>
          <ul style={{ paddingLeft: "1.25rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            {suggestions.customTimelineTips.map((tip, idx) => (
              <li key={`ttip-${idx}`} style={{ marginBottom: "0.5rem" }}>
                <strong>{tip.title} ({tip.phase}):</strong> {tip.tip}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
