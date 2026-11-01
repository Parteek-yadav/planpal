import React, { useState, useRef, useEffect } from "react";
import { EventPlanInput, BudgetSummary } from "@/domain";
import { ChatMessage, ChatResponse } from "@/services";
import { apiClient } from "@/utils/apiClient";

export interface ChatAssistantProps {
  readonly currentProfile: EventPlanInput;
  readonly budgetSummary: BudgetSummary;
  readonly bookedVendorsCount: number;
  readonly completedMilestonesCount: number;
}

const QUICK_QUESTIONS: readonly string[] = [
  "How can we optimize our budget right now?",
  "What is our weather backup contingency?",
  "Suggest interactive activities for our guest count",
  "How should we pace our vendor bookings?",
];

/**
 * Grounded AI chat assistant panel answering questions strictly within
 * the context of the active event's budget, dates, and constraints.
 */
export function ChatAssistant({
  currentProfile,
  budgetSummary,
  bookedVendorsCount,
  completedMilestonesCount,
}: ChatAssistantProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome-1",
      role: "assistant",
      content: `Hello! I am your PlanPal AI assistant, grounded in your plan for "${currentProfile.title}". You have $${budgetSummary.remainingBudget.toLocaleString()} remaining for ${currentProfile.guestCount} guests. What would you like guidance on?`,
      timestamp: "2027-01-01T00:00:00Z",
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [suggestedFollowUps, setSuggestedFollowUps] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messageSeqRef = useRef(2);

  const scrollToBottom = () => {
    if (typeof messagesEndRef.current?.scrollIntoView === "function") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isThinking) return;

    const userSeq = messageSeqRef.current;
    messageSeqRef.current += 1;

    const userMsg: ChatMessage = {
      id: `msg-user-${userSeq}`,
      role: "user",
      content: textToSend.trim(),
      timestamp: `turn-${userSeq}`,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInputQuery("");
    setIsThinking(true);

    try {
      const data = await apiClient.request<ChatResponse>("/api/events/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextHistory,
          currentProfile,
          budgetSummary,
          bookedVendorsCount,
          completedMilestonesCount,
        }),
        dedupeKey: `chat-${currentProfile.title}`,
        cancelPrevious: true,
      });

      const replySeq = messageSeqRef.current;
      messageSeqRef.current += 1;

      const assistantMsg: ChatMessage = {
        id: `msg-asst-${replySeq}`,
        role: "assistant",
        content: data.reply,
        timestamp: `turn-${replySeq}`,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setSuggestedFollowUps(data.suggestedFollowUps || []);
    } catch {
      const fallbackSeq = messageSeqRef.current;
      messageSeqRef.current += 1;

      const fallbackMsg: ChatMessage = {
        id: `msg-asst-${fallbackSeq}`,
        role: "assistant",
        content: `Based on your ${currentProfile.eventType} plan with $${budgetSummary.remainingBudget.toLocaleString()} remaining: We recommend prioritizing your booked vendors and keeping within your allocated category ceilings.`,
        timestamp: `turn-${fallbackSeq}`,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <aside
      aria-label="Grounded Event Planning Chat Assistant"
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        zIndex: 50,
        maxWidth: "400px",
        width: "calc(100vw - 3rem)",
      }}
    >
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="btn btn-primary"
          style={{
            borderRadius: "9999px",
            padding: "0.85rem 1.5rem",
            boxShadow: "var(--shadow-lg)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            minHeight: "44px",
            minWidth: "44px",
          }}
          aria-expanded="false"
          aria-label="Ask AI Assistant for event advice"
        >
          <span aria-hidden="true" style={{ fontSize: "1.25rem" }}>
            🤖
          </span>
          <span>Ask AI Assistant</span>
        </button>
      ) : (
        <div
          className="glass-panel"
          style={{
            display: "flex",
            flexDirection: "column",
            height: "520px",
            maxHeight: "80vh",
            padding: "1rem",
            background: "var(--bg-surface)",
            border: "2px solid var(--border-strong)",
            boxShadow: "var(--shadow-lg)",
            borderRadius: "16px",
          }}
        >
          {/* Panel Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid var(--border-subtle)",
              paddingBottom: "0.75rem",
              marginBottom: "0.75rem",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "1rem",
                  fontWeight: "700",
                  color: "var(--text-primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                🤖 Grounded PlanPal Assistant
              </h2>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  display: "block",
                }}
              >
                {currentProfile.title} • Left: $
                {budgetSummary.remainingBudget.toLocaleString()}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="btn btn-secondary"
              style={{
                padding: "0.35rem 0.65rem",
                fontSize: "0.85rem",
                minHeight: "44px",
                minWidth: "44px",
              }}
              aria-label="Close chat window"
            >
              ✕
            </button>
          </div>

          {/* Message List */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              paddingRight: "0.25rem",
              marginBottom: "0.75rem",
            }}
            tabIndex={0}
            role="log"
            aria-live="polite"
            aria-label="Chat messages history"
          >
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: isUser ? "flex-end" : "flex-start",
                    maxWidth: "85%",
                    padding: "0.75rem 1rem",
                    borderRadius: isUser ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                    background: isUser ? "var(--accent-purple)" : "var(--bg-input)",
                    color: "var(--text-primary)",
                    border: `1px solid ${isUser ? "var(--border-focus)" : "var(--border-subtle)"}`,
                    fontSize: "0.9rem",
                    lineHeight: "1.45",
                  }}
                >
                  {msg.content}
                </div>
              );
            })}
            {isThinking && (
              <div
                role="status"
                aria-live="polite"
                style={{
                  alignSelf: "flex-start",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "8px",
                  background: "var(--bg-input)",
                  border: "1px dashed var(--border-subtle)",
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                }}
              >
                Thinking grounded in your plan...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Follow-ups */}
          {(suggestedFollowUps.length > 0 || messages.length === 1) && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.35rem",
                marginBottom: "0.5rem",
              }}
              role="region"
              aria-label="Suggested quick questions"
            >
              {(suggestedFollowUps.length > 0
                ? suggestedFollowUps
                : QUICK_QUESTIONS.slice(0, 2)
              ).map((q, idx) => (
                <button
                  key={`q-${idx}`}
                  type="button"
                  onClick={() => handleSendMessage(q)}
                  style={{
                    background: "var(--status-info-bg)",
                    border: "1px solid var(--status-info-border)",
                    borderRadius: "12px",
                    padding: "0.35rem 0.65rem",
                    fontSize: "0.8rem",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    textAlign: "left",
                    minHeight: "44px",
                  }}
                >
                  💡 {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Form with Visible Label */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputQuery);
            }}
            style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}
          >
            <label
              htmlFor="input-chat-query"
              className="form-label"
              style={{ fontSize: "0.8rem" }}
            >
              Ask a question
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                id="input-chat-query"
                type="text"
                placeholder="Ask about budget, timeline, vendors..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                className="form-input"
                style={{ minHeight: "44px", fontSize: "0.9rem", flex: 1 }}
                disabled={isThinking}
              />
              <button
                id="btn-send-chat"
                type="submit"
                className="btn btn-primary"
                style={{ minHeight: "44px", padding: "0.5rem 1rem", fontSize: "0.9rem" }}
                disabled={isThinking || !inputQuery.trim()}
                aria-label="Send message"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </aside>
  );
}

export default ChatAssistant;
