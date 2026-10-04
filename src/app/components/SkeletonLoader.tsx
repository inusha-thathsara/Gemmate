"use client";

import { motion } from "framer-motion";

function Pulse({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      className="skeleton"
      animate={{ opacity: [0.45, 0.85, 0.45] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay }}
      style={{ width: "100%", height: 13, borderRadius: 7 }}
    />
  );
}

function SkeletonCard({
  delay = 0,
  accent,
  lines = 4,
}: {
  delay?: number;
  accent: string;
  lines?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Gradient top bar */}
      <motion.div
        style={{ height: 3, background: accent, transformOrigin: "left" }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{
          duration: 0.7,
          delay: delay + 0.15,
          ease: [0.22, 1, 0.36, 1],
        }}
      />

      {/* Ambient inner glow */}
      <div
        style={{
          position: "absolute",
          top: -30,
          left: -20,
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent.includes("4f8eff") ? "rgba(79,142,255,0.06)" : accent.includes("fbbf24") ? "rgba(251,191,36,0.05)" : "rgba(52,211,153,0.05)"} 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <div style={{ padding: "20px 22px 24px" }}>
        {/* Header row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <motion.div
            className="skeleton"
            style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0 }}
            animate={{ opacity: [0.3, 0.65, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: delay + 0.1 }}
          />
          <motion.div
            className="skeleton"
            style={{ width: "45%", height: 15, borderRadius: 7 }}
            animate={{ opacity: [0.3, 0.65, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: delay + 0.15 }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Array.from({ length: lines }).map((_, i) => (
            <Pulse key={i} delay={delay + 0.2 + i * 0.07} />
          ))}
          <motion.div
            className="skeleton"
            style={{ width: "60%", height: 13, borderRadius: 7 }}
            animate={{ opacity: [0.3, 0.65, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: delay + 0.5 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

interface SkeletonLoaderProps {
  onCancel?: () => void;
}

export default function SkeletonLoader({ onCancel }: SkeletonLoaderProps) {
  const cards = [
    { accent: "linear-gradient(90deg,#4f8eff,#6366f1)", delay: 0 },
    { accent: "linear-gradient(90deg,#fbbf24,#f87171)", delay: 0.12 },
    { accent: "linear-gradient(90deg,#34d399,#06b6d4)", delay: 0.24 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
      {/* Status indicator */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 16px",
          borderRadius: 12,
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          style={{ position: "relative", width: 10, height: 10, flexShrink: 0 }}
        >
          <motion.div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: "#4f8eff",
              boxShadow: "0 0 10px #4f8eff",
            }}
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
        </div>
        <span style={{ color: "var(--text-2)", fontSize: 13, fontWeight: 500 }}>
          Reasoning with Gemma & ElevenLabs…
        </span>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {onCancel && (
            <button
              onClick={onCancel}
              type="button"
              style={{
                fontSize: 12,
                color: "var(--text-3)",
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "2px 8px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          )}
          <motion.span
            style={{ fontSize: 12, color: "var(--text-3)" }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          >
            ●●●
          </motion.span>
        </div>
      </motion.div>

      {cards.map((c, i) => (
        <SkeletonCard
          key={i}
          delay={c.delay}
          accent={c.accent}
          lines={i === 0 ? 5 : 4}
        />
      ))}
    </motion.div>
  );
}
