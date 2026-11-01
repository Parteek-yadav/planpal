import React, { useRef, useEffect } from "react";
import { AiPlanSuggestion } from "@/services";

interface AiIdeasPanelProps {
  readonly suggestions: AiPlanSuggestion;
  readonly isLoading: boolean;
  readonly onRegenerate: () => void;
}

/**
 * Presentation panel displaying GenAI personalized concepts:
 * Themes, interactive color palettes, activities, customized menus, and decoration plans.
 * Implements accessible loading status, zero layout shift placeholders, and focus management.
 */
export function AiIdeasPanel({
  suggestions,
  isLoading,
  onRegenerate,
}: AiIdeasPanelProps): React.JSX.Element {
  const overviewHeadingRef = useRef<HTMLHeadingElement>(null);
  const wasLoadingRef = useRef<boolean>(isLoading);

  // Focus management: when AI finishes loading, shift focus to overview heading
  useEffect(() => {
    if (wasLoadingRef.current && !isLoading) {
      overviewHeadingRef.current?.focus();
    }
    wasLoadingRef.current = isLoading;
  }, [isLoading]);

  return (
    <div
      id="tabpanel-ai_plan"
      role="tabpanel"
      aria-labelledby="tab-ai_plan"
      tabIndex={0}
      style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}
    >
      {/* Live status announcement */}
      <div role="status" aria-live="polite" className="visually-hidden">
        {isLoading
          ? "AI assistant is generating personalized blueprints and budget recommendations..."
          : "AI blueprint generation completed successfully."}
      </div>

      {/* Strategy Overview Card */}
      <section className="glass-panel" aria-labelledby="section-overview-title">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div style={{ flex: 1, minWidth: "280px" }}>
            <h2
              id="section-overview-title"
              ref={overviewHeadingRef}
              tabIndex={-1}
              style={{
                fontSize: "1.35rem",
                fontWeight: "800",
                color: "var(--text-primary)",
                marginBottom: "0.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span>🤖</span> AI Event Strategy Blueprint
            </h2>
            {isLoading ? (
              <div
                className="skeleton-card"
                style={{ minHeight: "80px", justifyContent: "center" }}
                role="status"
                aria-label="Generating strategy summary"
              >
                <span>⚡ Generating strategic executive overview...</span>
              </div>
            ) : (
              <p
                style={{
                  color: "var(--text-secondary)",
                  maxWidth: "850px",
                  lineHeight: "1.6",
                  fontSize: "1rem",
                }}
              >
                {suggestions.overview}
              </p>
            )}
          </div>

          <button
            id="btn-regenerate-ai"
            type="button"
            className="btn btn-primary"
            onClick={onRegenerate}
            disabled={isLoading}
            style={{ minHeight: "44px" }}
          >
            {isLoading ? "⚡ Analyzing Data..." : "🔄 Refresh AI Insights"}
          </button>
        </div>
      </section>

      {/* 1. Theme Concepts with Color Palettes */}
      <section className="glass-panel" aria-labelledby="section-themes-title">
        <h2
          id="section-themes-title"
          style={{
            fontSize: "1.2rem",
            fontWeight: "700",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span>🎨</span> Creative Themes & Color Schemes
        </h2>

        {isLoading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.25rem",
            }}
          >
            <div
              className="skeleton-card"
              role="status"
              aria-label="Loading Theme Concept 1"
            >
              <span>🎨 Crafting custom theme palette...</span>
            </div>
            <div
              className="skeleton-card"
              role="status"
              aria-label="Loading Theme Concept 2"
            >
              <span>🎨 Designing acoustic aesthetic...</span>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {suggestions.themeIdeas.map((theme, idx) => (
              <article
                key={`theme-${idx}`}
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "10px",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <h3
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "700",
                    color: "var(--text-primary)",
                  }}
                >
                  {theme.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--text-secondary)",
                    lineHeight: "1.5",
                  }}
                >
                  {theme.description}
                </p>

                {/* Color swatches with text labels */}
                <div style={{ marginTop: "auto" }}>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    Recommended Palette
                  </span>
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      marginTop: "0.35rem",
                      flexWrap: "wrap",
                    }}
                    role="list"
                    aria-label={`Color palette for ${theme.title}`}
                  >
                    {theme.colorPalette.map((hex, colorIdx) => (
                      <div
                        key={`color-${colorIdx}`}
                        role="listitem"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          fontSize: "0.75rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        <span
                          style={{
                            width: "22px",
                            height: "22px",
                            borderRadius: "4px",
                            backgroundColor: hex,
                            border: "1px solid var(--border-strong)",
                            display: "inline-block",
                          }}
                          aria-hidden="true"
                        />
                        <span>{hex}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* 2. Personalized Activities */}
      <section className="glass-panel" aria-labelledby="section-activities-title">
        <h2
          id="section-activities-title"
          style={{
            fontSize: "1.2rem",
            fontWeight: "700",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span>🎯</span> Curated Activities & Experiences
        </h2>

        {isLoading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.25rem",
            }}
          >
            <div className="skeleton-card" role="status" aria-label="Loading Activities">
              <span>🎯 Customizing interactive games...</span>
            </div>
            <div className="skeleton-card" role="status" aria-label="Loading Activities">
              <span>🎯 Aligning guest count pacing...</span>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {suggestions.activities.map((act, idx) => (
              <article
                key={`act-${idx}`}
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "10px",
                  padding: "1.25rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "0.5rem",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.05rem",
                      fontWeight: "700",
                      color: "var(--text-primary)",
                    }}
                  >
                    {act.name}
                  </h3>
                  <span className="badge badge-community">
                    ⏱️ {act.durationMinutes} min
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--text-secondary)",
                    lineHeight: "1.5",
                  }}
                >
                  {act.description}
                </p>
                <div
                  style={{
                    marginTop: "0.75rem",
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                  }}
                >
                  Audience: <strong>{act.targetAudience}</strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* 3. Budget Optimization & Contingency */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {/* Budget Optimization */}
        <section className="glass-panel" aria-labelledby="section-budget-tips-title">
          <h2
            id="section-budget-tips-title"
            style={{
              fontSize: "1.15rem",
              fontWeight: "700",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>💡</span> Budget Optimization Strategies
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {suggestions.budgetOptimizationTips.map((tip, idx) => (
              <div
                key={`btip-${idx}`}
                style={{
                  padding: "0.85rem",
                  background: "var(--bg-input)",
                  borderRadius: "8px",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.35rem",
                  }}
                >
                  <strong style={{ fontSize: "0.95rem", color: "var(--text-primary)" }}>
                    {tip.category}
                  </strong>
                  <span className="badge badge-community">✓ {tip.estimatedImpact}</span>
                </div>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                  {tip.savingStrategy}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Contingency Plan */}
        <section className="glass-panel" aria-labelledby="section-contingency-title">
          <h2
            id="section-contingency-title"
            style={{
              fontSize: "1.15rem",
              fontWeight: "700",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>🛡️</span> Risk & Weather Contingency
          </h2>
          <div
            style={{
              padding: "1rem",
              background: "var(--status-warning-bg)",
              border: "1px solid var(--status-warning-border)",
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  color: "var(--status-warning-text)",
                }}
              >
                Identified Risk
              </span>
              <p
                style={{
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  color: "var(--text-primary)",
                }}
              >
                {suggestions.contingencyPlan.riskScenario}
              </p>
            </div>
            <div>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  color: "var(--status-warning-text)",
                }}
              >
                Mitigation Strategy
              </span>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                {suggestions.contingencyPlan.mitigation}
              </p>
            </div>
            <div>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  color: "var(--status-warning-text)",
                }}
              >
                Emergency Pivot
              </span>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                {suggestions.contingencyPlan.backupOption}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AiIdeasPanel;
