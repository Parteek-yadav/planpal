import React from "react";

/**
 * Short, accessible privacy notice informing the user that plan data
 * is stored entirely on-device except for transient text queries sent to Gemini AI.
 */
export function PrivacyNotice(): React.JSX.Element {
  return (
    <footer
      role="contentinfo"
      className="glass-panel"
      style={{
        marginTop: "3rem",
        padding: "1.25rem 1.5rem",
        borderTop: "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "flex-start",
        gap: "1rem",
        fontSize: "0.875rem",
        color: "var(--text-secondary)"
      }}
    >
      <span
        style={{
          fontSize: "1.25rem",
          color: "var(--status-info-text)",
          marginTop: "0.1rem"
        }}
        aria-hidden="true"
      >
        🔒
      </span>
      <div>
        <strong style={{ color: "var(--text-primary)", display: "block", marginBottom: "0.25rem" }}>
          On-Device Privacy & Data Security
        </strong>
        <p style={{ lineHeight: "1.5", margin: 0 }}>
          Your event details, budget allocations, vendor lists, and timelines remain securely stored on
          your personal device in local browser storage. PlanPal does not host your personal plans on an
          external database. The only information transmitted off-device is the prompt text sent to the
          Google Gemini API to generate tailored blueprints and chat responses.
        </p>
      </div>
    </footer>
  );
}

export default PrivacyNotice;

