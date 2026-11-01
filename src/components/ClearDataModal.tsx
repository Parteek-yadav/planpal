import React, { useEffect, useRef } from "react";

interface ClearDataModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
}

/**
 * Accessible confirmation dialog for clearing all local client storage.
 * Follows WAI-ARIA alertdialog pattern with focus containment and keyboard cancellation.
 */
export function ClearDataModal({
  isOpen,
  onClose,
  onConfirm
}: ClearDataModalProps): React.JSX.Element | null {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus cancel button by default for safety
    cancelBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="clear-dialog-title"
      aria-describedby="clear-dialog-desc"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "1rem"
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "var(--bg-surface)",
          border: "2px solid var(--status-error-border)",
          borderRadius: "14px",
          padding: "1.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          boxShadow: "var(--shadow-lg)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.75rem" }} aria-hidden="true">
            ⚠️
          </span>
          <h2
            id="clear-dialog-title"
            style={{
              fontSize: "1.3rem",
              fontWeight: "800",
              color: "var(--text-primary)"
            }}
          >
            Clear All Local Data?
          </h2>
        </div>

        <p
          id="clear-dialog-desc"
          style={{
            fontSize: "0.95rem",
            color: "var(--text-secondary)",
            lineHeight: "1.5"
          }}
        >
          This action will permanently delete your stored event plan, budget items, vendor checklist,
          and timeline milestones from your browser storage. Your workspace will reset to the default
          wedding preset.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
            marginTop: "0.5rem"
          }}
        >
          <button
            ref={cancelBtnRef}
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ minHeight: "44px" }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{
              minHeight: "44px",
              background: "var(--status-error-border)",
              color: "#ffffff",
              border: "1px solid var(--status-error-border)",
              fontWeight: "700"
            }}
          >
            🗑️ Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClearDataModal;

