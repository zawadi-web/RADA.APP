"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Page-level error boundary for /discover (and root /)
// Silently recovers from the WASM HMR lazy-module undefined error
export default function DiscoverError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    const isWasmGlitch =
      error?.message?.includes("Element type is invalid") ||
      error?.message?.includes("Lazy element type") ||
      error?.message?.includes("promise that resolves to: undefined");

    if (isWasmGlitch) {
      // Silent recovery — retry after 200ms
      const t = setTimeout(() => reset(), 200);
      return () => clearTimeout(t);
    }

    console.error("[Rada/discover] Error:", error);
  }, [error, reset]);

  const isWasmGlitch =
    error?.message?.includes("Element type is invalid") ||
    error?.message?.includes("Lazy element type") ||
    error?.message?.includes("promise that resolves to: undefined");

  if (isWasmGlitch) {
    // Show nothing — self-heals in 200ms
    return (
      <div style={{ minHeight: "100vh", background: "#0D0520" }} />
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "var(--rada-bg)", display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "24px", color: "var(--rada-pearl)", fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{ fontSize: "40px", marginBottom: "16px", color: "var(--rada-gold)" }}>✦</div>
      <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 8px" }}>Radar glitch</h2>
      <p style={{ fontSize: "13px", color: "var(--rada-pearl-muted)", margin: "0 0 20px", textAlign: "center" }}>
        Something went wrong loading Discover. Try again.
      </p>
      <button
        onClick={() => reset()}
        style={{
          padding: "12px 24px", borderRadius: "12px", border: "none",
          background: "var(--rada-gold-gradient)",
          color: "#0A0A0C", fontSize: "14px", fontWeight: 700, cursor: "pointer",
          marginBottom: "12px",
          boxShadow: "0 4px 14px rgba(197, 155, 39, 0.3)",
        }}
      >
        Retry
      </button>
      <button
        onClick={() => router.push("/profile")}
        style={{
          background: "none", border: "none", color: "var(--rada-pearl-muted)",
          fontSize: "13px", cursor: "pointer",
        }}
      >
        Go to Profile
      </button>
    </div>
  );
}
