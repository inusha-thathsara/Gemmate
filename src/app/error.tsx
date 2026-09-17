"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 560,
          width: "100%",
          border: "1px solid var(--border)",
          borderRadius: 20,
          background: "var(--surface)",
          padding: 24,
        }}
      >
        <p
          style={{
            textTransform: "uppercase",
            letterSpacing: 1,
            fontSize: 12,
            color: "var(--text-3)",
            marginBottom: 10,
          }}
        >
          Something went wrong
        </p>
        <h1 style={{ color: "var(--text-1)", fontSize: 24, marginBottom: 12 }}>
          We could not load this screen.
        </h1>
        <p
          style={{ color: "var(--text-2)", lineHeight: 1.7, marginBottom: 20 }}
        >
          The issue has been reported. You can retry now or refresh the page.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            background:
              "linear-gradient(135deg,#4f8eff 0%,#6366f1 55%,#a78bfa 100%)",
            color: "#fff",
            border: "none",
            borderRadius: 14,
            padding: "12px 18px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
