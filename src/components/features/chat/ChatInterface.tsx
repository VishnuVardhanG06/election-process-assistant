"use client";

import React, { useState, useRef, useEffect, FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChat } from "@/hooks/useChat";
import { useUserContext } from "@/contexts/UserContext";
import { Message, SuggestedAction, DisclosureLevel } from "@/types";
import { Button } from "@/components/common/Button";
import { LiveRegion } from "@/components/common/Accessibility";

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const time = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <article
      aria-label={`${isUser ? "You" : "Assistant"} at ${time}`}
      className={`message-bubble ${isUser ? "user" : "assistant"} animate-fade-in-up`}
    >
      {isUser ? (
        <p style={{ margin: 0 }}>{message.content}</p>
      ) : (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p style={{ margin: "0 0 0.5rem", color: "inherit" }}>{children}</p>,
            strong: ({ children }) => <strong style={{ color: "var(--color-text-primary)" }}>{children}</strong>,
            a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
            ul: ({ children }) => <ul style={{ paddingLeft: "1.2rem", margin: "0.25rem 0" }}>{children}</ul>,
            li: ({ children }) => <li style={{ marginBottom: "0.2rem" }}>{children}</li>,
            h2: ({ children }) => <h2 style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-bold)", margin: "0.75rem 0 0.25rem" }}>{children}</h2>,
            h3: ({ children }) => <h3 style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)", margin: "0.5rem 0 0.2rem" }}>{children}</h3>,
            blockquote: ({ children }) => (
              <blockquote style={{ borderLeft: "3px solid var(--color-warning)", paddingLeft: "0.75rem", margin: "0.5rem 0", color: "var(--color-warning)" }}>
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div style={{ overflowX: "auto", margin: "0.5rem 0" }}>
                <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "var(--text-xs)" }}>{children}</table>
              </div>
            ),
            th: ({ children }) => <th style={{ padding: "4px 8px", background: "var(--color-bg-overlay)", textAlign: "left", fontWeight: "var(--font-semibold)" }}>{children}</th>,
            td: ({ children }) => <td style={{ padding: "4px 8px", borderBottom: "1px solid var(--color-border)" }}>{children}</td>,
          }}
        >
          {message.content}
        </ReactMarkdown>
      )}
      <p className="message-timestamp" aria-hidden="true">{time}</p>
    </article>
  );
}

function ThinkingBubble() {
  return (
    <div className="message-thinking" aria-label="Assistant is thinking">
      <span className="thinking-dot" />
      <span className="thinking-dot" />
      <span className="thinking-dot" />
      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginLeft: 4 }}>
        Thinking…
      </span>
    </div>
  );
}

function SuggestedActions({
  actions,
  onSelect,
}: {
  actions: SuggestedAction[];
  onSelect: (query: string) => void;
}) {
  if (!actions.length) return null;
  return (
    <nav aria-label="Suggested follow-up actions" className="suggested-actions">
      {actions.map((a) => (
        <button
          key={a.id}
          className="suggested-chip"
          onClick={() => onSelect(a.query)}
          aria-label={`Ask: ${a.label}`}
        >
          {a.icon && <span aria-hidden="true">{a.icon} </span>}
          {a.label}
        </button>
      ))}
    </nav>
  );
}

function DisclosureControl({
  level,
  onChange,
}: {
  level: DisclosureLevel;
  onChange: (l: DisclosureLevel) => void;
}) {
  const levels: { value: DisclosureLevel; label: string }[] = [
    { value: "brief", label: "Brief" },
    { value: "detailed", label: "Detailed" },
    { value: "complete", label: "Complete" },
  ];
  return (
    <div
      role="group"
      aria-label="Response detail level"
      className="disclosure-toggle"
      style={{ marginBottom: "var(--space-2)" }}
    >
      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", alignSelf: "center" }}>
        Detail:
      </span>
      {levels.map((l) => (
        <button
          key={l.value}
          onClick={() => onChange(l.value)}
          className={`suggested-chip${level === l.value ? " active" : ""}`}
          aria-pressed={level === l.value}
          style={
            level === l.value
              ? { background: "var(--color-accent-subtle)", color: "var(--color-accent-primary)", borderColor: "var(--color-border-accent)" }
              : {}
          }
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

interface ChatInterfaceProps {
  initialMessage?: string;
  compact?: boolean;
}

export function ChatInterface({ initialMessage, compact = false }: ChatInterfaceProps) {
  const { userContext } = useUserContext();
  const { messages, isLoading, sendMessage, clearChat, setDisclosureLevel, disclosureLevel } =
    useChat(userContext);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [statusMsg, setStatusMsg] = useState("");

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const hasSentInitial = useRef(false);

  // Send initial message on mount (only when explicitly provided)
  useEffect(() => {
    if (initialMessage && !hasSentInitial.current) {
      hasSentInitial.current = true;
      sendMessage(initialMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async (text = input) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    setStatusMsg("Sending message…");
    await sendMessage(trimmed);
    setStatusMsg("Response received");
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");

  const containerStyle = compact
    ? { height: "480px", borderRadius: "var(--radius-xl)", overflow: "hidden", border: "1px solid var(--color-border)" }
    : {};

  return (
    <div className="chat-container" style={containerStyle}>
      <LiveRegion message={statusMsg} />

      {/* Messages */}
      <section
        className="chat-messages"
        aria-label="Conversation"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.length === 0 && !isLoading && (
          <div style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-text-muted)" }}>
            <p style={{ fontSize: "2rem", marginBottom: "var(--space-4)" }}>🗳️</p>
            <p>Start by asking a question about elections, registration, or voting.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id}>
            <MessageBubble message={msg} />
            {msg.role === "assistant" && msg.suggestedActions?.length ? (
              <SuggestedActions
                actions={msg.suggestedActions}
                onSelect={(q) => handleSend(q)}
              />
            ) : null}
          </div>
        ))}

        {isLoading && <ThinkingBubble />}
        <div ref={messagesEndRef} aria-hidden="true" />
      </section>

      {/* Input area */}
      <div className="chat-input-area">
        <DisclosureControl level={disclosureLevel} onChange={setDisclosureLevel} />
        <form
          onSubmit={(e: FormEvent) => { e.preventDefault(); handleSend(); }}
          aria-label="Send a message"
        >
          <div className="chat-input-row">
            <label htmlFor="chat-input" className="sr-only">
              Ask a question about elections
            </label>
            <textarea
              id="chat-input"
              ref={textareaRef}
              className="chat-textarea"
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about elections…"
              rows={1}
              aria-label="Your message"
              disabled={isLoading}
            />
            <Button
              type="submit"
              variant="primary"
              size="icon"
              isLoading={isLoading}
              aria-label="Send message"
              disabled={!input.trim() || isLoading}
            >
              {!isLoading && "➤"}
            </Button>
          </div>
        </form>

        <div className="flex-between" style={{ marginTop: "var(--space-2)" }}>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            💡 Non-partisan · General information only
          </p>
          {messages.length > 0 && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={clearChat}
              style={{ fontSize: "var(--text-xs)" }}
            >
              Clear Chat
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
