"use client";

import React, { Suspense, lazy } from "react";
import { useEventPlanner } from "@/hooks/useEventPlanner";
import {
  Header,
  NavigationTabs,
  AiIdeasPanel,
  BudgetTracker,
  TimelineView,
  VendorChecklistView,
  EventWizard,
  ClearDataModal,
  PrivacyNotice,
} from "@/components";

// Lazy-load chat panel for optimized initial bundle loading
const LazyChatAssistant = lazy(() => import("@/components/chat/ChatAssistant"));

/**
 * Main application dashboard coordinating presentational components,
 * accessible tab panels, lazy-loaded components, data persistence, and the event setup wizard.
 * All application state is cleanly encapsulated in the `useEventPlanner` custom hook.
 */
export default function PlanPalApp(): React.JSX.Element {
  const {
    eventState,
    budgetSummary,
    currentProfile,
    bookedVendorsCount,
    completedMilestonesCount,
    activeTab,
    setActiveTab,
    isWizardOpen,
    setIsWizardOpen,
    isClearModalOpen,
    setIsClearModalOpen,
    isAiLoading,
    theme,
    setTheme,
    handleSwitchPreset,
    handleUpdateItemActual,
    handleTogglePaid,
    handleToggleMilestone,
    handleToggleRunOfShow,
    handleUpdateVendorStatus,
    handleUpdateVendorDetails,
    handleRegenerateAi,
    handleSubmitWizardPlan,
    handleExportJson,
    handlePrintPlan,
    handleClearAllData,
  } = useEventPlanner();

  return (
    <div className="app-container">
      {/* Header Landmark */}
      <Header
        currentEventType={eventState.eventType}
        eventTitle={eventState.title}
        eventDate={eventState.date}
        guestCount={eventState.guestCount}
        totalBudget={eventState.totalBudget}
        onOpenNewEventModal={() => setIsWizardOpen(true)}
        onSwitchPreset={handleSwitchPreset}
        theme={theme}
        onThemeChange={setTheme}
        onExportJson={handleExportJson}
        onPrintPlan={handlePrintPlan}
        onOpenClearModal={() => setIsClearModalOpen(true)}
      />

      {/* Navigation Landmark: Tabs with ARIA tabs pattern */}
      <NavigationTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        budgetItemCount={eventState.budgetItems.length}
        milestoneCount={eventState.milestones.length}
        vendorCount={eventState.vendors.length}
      />

      {/* Main Content Landmark */}
      <main id="main-content" tabIndex={-1}>
        {activeTab === "ai_plan" && (
          <AiIdeasPanel
            suggestions={eventState.aiSuggestions}
            isLoading={isAiLoading}
            onRegenerate={handleRegenerateAi}
          />
        )}

        {activeTab === "budget" && (
          <BudgetTracker
            summary={budgetSummary}
            items={eventState.budgetItems}
            onUpdateItemActual={handleUpdateItemActual}
            onTogglePaid={handleTogglePaid}
          />
        )}

        {activeTab === "timeline" && (
          <TimelineView
            milestones={eventState.milestones}
            runOfShow={eventState.runOfShow}
            onToggleMilestone={handleToggleMilestone}
            onToggleRunOfShowItem={handleToggleRunOfShow}
          />
        )}

        {activeTab === "vendors" && (
          <VendorChecklistView
            checklist={eventState.vendors}
            onUpdateStatus={handleUpdateVendorStatus}
            onUpdateDetails={handleUpdateVendorDetails}
          />
        )}
      </main>

      {/* Multi-Step Event Setup Wizard Dialog */}
      <EventWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSubmit={handleSubmitWizardPlan}
        isSubmitting={isAiLoading}
      />

      {/* Clear All Data Confirmation Alert Dialog */}
      <ClearDataModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleClearAllData}
      />

      {/* Lazy-Loaded Grounded AI Chat Assistant */}
      <Suspense fallback={null}>
        <LazyChatAssistant
          currentProfile={currentProfile}
          budgetSummary={budgetSummary}
          bookedVendorsCount={bookedVendorsCount}
          completedMilestonesCount={completedMilestonesCount}
        />
      </Suspense>

      {/* On-Device Privacy Notice */}
      <PrivacyNotice />
    </div>
  );
}
