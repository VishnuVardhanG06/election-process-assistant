"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ChatInterface } from "@/components/features/chat/ChatInterface";

function ChatPageContent() {
  const searchParams = useSearchParams();
  const initialQuestion = searchParams.get("q") ?? undefined;

  return (
    <div style={{ height: "calc(100vh - var(--header-height) - var(--bottom-nav-height))", display: "flex", flexDirection: "column" }}>
      <div className="container" style={{ flex: 1, display: "flex", flexDirection: "column", paddingTop: "var(--space-4)" }}>
        <div style={{ marginBottom: "var(--space-4)" }}>
          <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--space-1)" }}>Election Assistant</h1>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
            Non-partisan guidance on every step of the election process
          </p>
        </div>
        <div style={{ flex: 1 }}>
          <ChatInterface initialMessage={initialQuestion} />
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="container" style={{ paddingTop: "var(--space-8)", textAlign: "center" }}>
        <div className="spinner spinner-lg" />
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}

