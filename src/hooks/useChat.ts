"use client";

import { useState, useCallback, useRef } from "react";
import { Message, UserContext, DisclosureLevel, SuggestedAction } from "@/types";
import { v4 as uuidv4 } from "uuid";

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => void;
  setDisclosureLevel: (level: DisclosureLevel) => void;
  disclosureLevel: DisclosureLevel;
}

export function useChat(userContext: UserContext): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disclosureLevel, setDisclosureLevel] = useState<DisclosureLevel>("brief");
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      // Add user message
      const userMsg: Message = {
        id: uuidv4(),
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setError(null);

      // Cancel any in-flight request
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            context: { ...userContext, disclosureLevel },
            history: messages.slice(-10), // last 10 for context
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error ?? `Request failed (${res.status})`);
        }

        const data = await res.json() as {
          content: string;
          intent: string;
          suggestedActions: SuggestedAction[];
        };

        const assistantMsg: Message = {
          id: uuidv4(),
          role: "assistant",
          content: data.content,
          timestamp: new Date(),
          intent: data.intent,
          suggestedActions: data.suggestedActions,
          disclosureLevel,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const msg = err instanceof Error ? err.message : "Something went wrong";
        setError(msg);
        const errMsg: Message = {
          id: uuidv4(),
          role: "assistant",
          content: `⚠️ ${msg}. Please try again.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, userContext, disclosureLevel]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearChat, setDisclosureLevel, disclosureLevel };
}
