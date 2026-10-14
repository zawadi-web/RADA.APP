"use client";

import { useEffect } from "react";

// Global error boundary for Next.js 16
// Catches the "Element type is invalid / Lazy element" HMR error
// that occurs in WASM webpack mode during hot module replacement.
// Auto-reloads the page so the user never sees it.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // If it's the known WASM/HMR lazy module error, auto-recover silently
    const isLazyError =
      error?.message?.includes("Element type is invalid") ||
      error?.message?.includes("Lazy element type") ||
      error?.message?.includes("promise that resolves to: undefined");

    if (isLazyError) {
      try {
        const count = Number(sessionStorage.getItem("rada_lazy_reloads") || "0");
        if (count < 2) {
          sessionStorage.setItem("rada_lazy_reloads", String(count + 1));
          const t = setTimeout(() => {
            window.location.reload();
          }, 300);
          return () => clearTimeout(t);
        }
      } catch { /* ignore */ }
    }

    // For real errors, log them
    console.error("[Rada] Global error:", error);
  }, [error, reset]);

  const isLazyError =
    error?.message?.includes("Element type is invalid") ||
    error?.message?.includes("Lazy element type") ||
    error?.message?.includes("promise that resolves to: undefined");

  // For the HMR glitch, show nothing (auto-reloads in 150ms)
  if (isLazyError) {
    return (
      <html>
        <body style={{ background: "#0D0520", margin: 0 }} />
      </html>
    );
  }

  // For real errors, show a minimal recovery UI
  return (
    <html>
      <body style={{
        background: "#09090B", margin: 0, display: "flex",
        alignItems: "center", justifyContent: "center",
        minHeight: "100vh", fontFamily: "system-ui, sans-serif",
      }}>
        <div style={{ textAlign: "center", color: "#FFFFFF", padding: "24px" }}>
          <div style={{ fontSize: "40px", marginBottom: "16px", color: "#C59B27" }}>✦</div>
          <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 8px" }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", margin: "0 0 20px" }}>
            Rada ran into an issue. Try reloading.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: "12px 24px", borderRadius: "12px", border: "none",
              background: "linear-gradient(135deg, #E5C158, #C59B27)",
              color: "#0A0A0C", fontSize: "14px", fontWeight: 700, cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
