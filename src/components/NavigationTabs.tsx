import React, { useRef } from "react";

export type TabKey = "ai_plan" | "budget" | "timeline" | "vendors";

interface TabDefinition {
  readonly key: TabKey;
  readonly label: string;
  readonly icon: string;
  readonly badge?: number | string;
}

interface NavigationTabsProps {
  readonly activeTab: TabKey;
  readonly onTabChange: (tab: TabKey) => void;
  readonly budgetItemCount?: number;
  readonly milestoneCount?: number;
  readonly vendorCount?: number;
}

/**
 * Accessible ARIA TabList navigation component supporting full keyboard navigation.
 */
export function NavigationTabs({
  activeTab,
  onTabChange,
  budgetItemCount,
  milestoneCount,
  vendorCount,
}: NavigationTabsProps): React.JSX.Element {
  const tabListRef = useRef<HTMLDivElement>(null);

  const tabs: readonly TabDefinition[] = [
    {
      key: "ai_plan",
      label: "GenAI Blueprint & Ideas",
      icon: "✨",
    },
    {
      key: "budget",
      label: "Smart Budget Tracker",
      icon: "💰",
      badge: budgetItemCount,
    },
    {
      key: "timeline",
      label: "Milestones & Run-of-Show",
      icon: "⏱️",
      badge: milestoneCount,
    },
    {
      key: "vendors",
      label: "Vendor Procurement",
      icon: "📋",
      badge: vendorCount,
    },
  ];

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let newIndex = -1;
    if (e.key === "ArrowRight") {
      newIndex = (index + 1) % tabs.length;
    } else if (e.key === "ArrowLeft") {
      newIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      newIndex = 0;
    } else if (e.key === "End") {
      newIndex = tabs.length - 1;
    }

    if (newIndex >= 0) {
      e.preventDefault();
      const targetTab = tabs[newIndex];
      onTabChange(targetTab.key);
      const buttons =
        tabListRef.current?.querySelectorAll<HTMLButtonElement>("button[role='tab']");
      buttons?.[newIndex]?.focus();
    }
  };

  return (
    <nav aria-label="Event Planning Sections">
      <div
        ref={tabListRef}
        role="tablist"
        aria-orientation="horizontal"
        className="tabs-nav"
      >
        {tabs.map((tab, idx) => {
          const isSelected = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              id={`tab-${tab.key}`}
              role="tab"
              type="button"
              aria-selected={isSelected}
              aria-controls={`tabpanel-${tab.key}`}
              tabIndex={isSelected ? 0 : -1}
              className="tab-btn"
              onClick={() => onTabChange(tab.key)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.15rem 0.45rem",
                    borderRadius: "9999px",
                    background: isSelected
                      ? "var(--accent-purple)"
                      : "rgba(255, 255, 255, 0.1)",
                    color: "#ffffff",
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
