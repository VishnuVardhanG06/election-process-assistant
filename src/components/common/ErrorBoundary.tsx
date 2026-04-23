"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./Button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    console.error("[ErrorBoundary]", error);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          role="alert"
          className="glass-card"
          style={{
            padding: "var(--space-8)",
            textAlign: "center",
            maxWidth: 480,
            margin: "var(--space-8) auto",
          }}
        >
          <p style={{ fontSize: "2.5rem", marginBottom: "var(--space-4)" }}>😕</p>
          <h2 style={{ marginBottom: "var(--space-3)", fontSize: "var(--text-xl)" }}>
            Something went wrong
          </h2>
          <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-6)" }}>
            {this.state.error?.message ?? "An unexpected error occurred."}
          </p>
          <Button onClick={this.reset} variant="secondary">
            Try Again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
