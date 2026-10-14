"use client";

import React from "react";

interface State {
  hasError: boolean;
  isHmrError: boolean;
}

/**
 * Catches webpack HMR "Element type is invalid. Received a promise that
 * resolves to: undefined" errors and auto-reloads instead of crashing.
 * These happen briefly during hot module replacement when a module handle
 * is momentarily undefined while being re-evaluated.
 */
export class HmrErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, isHmrError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const msg = error?.message || "";
    const isHmrError =
      msg.includes("Element type is invalid") ||
      msg.includes("Lazy element type must resolve") ||
      msg.includes("Received a promise that resolves to: undefined");
    return { hasError: true, isHmrError };
  }

  componentDidCatch(error: Error) {
    const msg = error?.message || "";
    if (
      msg.includes("Element type is invalid") ||
      msg.includes("Lazy element type must resolve") ||
      msg.includes("Received a promise that resolves to: undefined")
    ) {
      // Auto-recover after a brief pause to let HMR finish
      setTimeout(() => {
        this.setState({ hasError: false, isHmrError: false });
      }, 800);
    }
  }

  render() {
    if (this.state.hasError && !this.state.isHmrError) {
      // Real error — show minimal fallback
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "#09090B",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "16px",
            color: "#FFFFFF",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: "40px", color: "#F5CF68" }}>✦</span>
          <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Something went wrong</h2>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 24px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #FFF6D6 0%, #F5CF68 50%, #D4AF37 100%)",
              color: "#0A0A0C",
              fontWeight: 800,
              cursor: "pointer",
              fontSize: "14px",
              boxShadow: "0 4px 14px rgba(245, 207, 104, 0.4)",
            }}
          >
            Reload
          </button>
        </div>
      );
    }

    if (this.state.hasError && this.state.isHmrError) {
      // HMR flicker — show transparent loading overlay, auto-recovers
      return (
        <div style={{ minHeight: "100vh", background: "#09090B" }}>
          {/* Blank screen while HMR module re-evaluates */}
        </div>
      );
    }

    return this.props.children;
  }
}
