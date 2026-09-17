"use client";

import { motion } from "framer-motion";
import { Lightbulb, Skull, Swords } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export interface TriageData {
  coreConcepts: string[];
  theTrap: string[];
  attackPlan: string[];
}

const CARDS = [
  {
    key: "concepts" as const,
    title: "Core Concepts",
    icon: Lightbulb,
    gradient: "linear-gradient(120deg,#4f8eff,#6366f1)",
    glow: "rgba(79,142,255,0.12)",
    borderGlow: "rgba(79,142,255,0.25)",
    iconColor: "#4f8eff",
    delay: 0.05,
  },
  {
    key: "trap" as const,
    title: "The Trap",
    icon: Skull,
    gradient: "linear-gradient(120deg,#fbbf24,#f87171)",
    glow: "rgba(251,191,36,0.10)",
    borderGlow: "rgba(251,191,36,0.2)",
    iconColor: "#fbbf24",
    delay: 0.2,
  },
  {
    key: "plan" as const,
    title: "Attack Plan",
    icon: Swords,
    gradient: "linear-gradient(120deg,#34d399,#06b6d4)",
    glow: "rgba(52,211,153,0.10)",
    borderGlow: "rgba(52,211,153,0.2)",
    iconColor: "#34d399",
    delay: 0.35,
  },
];

const MD_PLUGINS = {
  remark: [remarkMath] as Parameters<typeof ReactMarkdown>[0]["remarkPlugins"],
  rehype: [rehypeKatex] as Parameters<typeof ReactMarkdown>[0]["rehypePlugins"],
};

export default function ResultCards({ data }: { data: TriageData }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
      {CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.55,
              delay: card.delay,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{
              background: "var(--surface)",
              borderRadius: 20,
              overflow: "hidden",
              position: "relative",
              border: `1px solid ${card.borderGlow}`,
              boxShadow: `0 0 0 1px var(--border), inset 0 0 0 1px ${card.glow}`,
            }}
          >
            {/* Gradient top bar */}
            <div style={{ height: 3, background: card.gradient }} />

            {/* Inner ambient glow */}
            <div
              style={{
                position: "absolute",
                top: -40,
                left: -30,
                width: 180,
                height: 180,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${card.glow} 0%, transparent 70%)`,
                pointerEvents: "none",
              }}
            />

            <div style={{ padding: "18px 20px 22px", position: "relative" }}>
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: card.glow,
                    border: `1px solid ${card.borderGlow}`,
                  }}
                >
                  <Icon size={18} color={card.iconColor} />
                </div>
                <h3
                  style={{
                    color: "var(--text-1)",
                    fontWeight: 800,
                    fontSize: 15,
                    letterSpacing: -0.4,
                  }}
                >
                  {card.key === "trap"
                    ? data.theTrap.length > 1
                      ? "The Traps"
                      : "The Trap"
                    : card.title}
                </h3>
              </div>

              {/* Content */}
              {card.key === "concepts" && (
                <ul
                  aria-label="Core concepts"
                  style={{ display: "flex", flexDirection: "column", gap: 9 }}
                >
                  {data.coreConcepts.map((concept, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: card.delay + 0.3 + i * 0.06 }}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        color: "var(--text-2)",
                        fontSize: 13.5,
                        lineHeight: 1.6,
                      }}
                    >
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: card.iconColor,
                          flexShrink: 0,
                          marginTop: 7,
                          boxShadow: `0 0 6px ${card.iconColor}80`,
                        }}
                      />
                      {concept}
                    </motion.li>
                  ))}
                </ul>
              )}

              {card.key === "trap" && (
                <div
                  aria-label="Common traps"
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {data.theTrap.map((trap, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: card.delay + 0.3 + i * 0.08 }}
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                      }}
                    >
                      {data.theTrap.length > 1 && (
                        <span
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 8,
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "rgba(251,191,36,0.12)",
                            border: "1px solid rgba(251,191,36,0.25)",
                            color: "#fbbf24",
                            fontSize: 11,
                            fontWeight: 800,
                            marginTop: 14,
                          }}
                        >
                          {i + 1}
                        </span>
                      )}
                      {/* ── Render trap as Markdown so bold/italic/LaTeX work ── */}
                      <div
                        style={{
                          flex: 1,
                          padding: "12px 14px",
                          background: "rgba(251,191,36,0.05)",
                          border: "1px solid rgba(251,191,36,0.14)",
                          borderRadius: 11,
                        }}
                        className="practice-md"
                      >
                        <ReactMarkdown
                          remarkPlugins={MD_PLUGINS.remark}
                          rehypePlugins={MD_PLUGINS.rehype}
                        >
                          {trap}
                        </ReactMarkdown>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {card.key === "plan" && (
                <div
                  aria-label="Attack plan"
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {data.attackPlan.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: card.delay + 0.3 + i * 0.07 }}
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                      }}
                    >
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 8,
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "rgba(52,211,153,0.12)",
                          border: "1px solid rgba(52,211,153,0.25)",
                          color: "#34d399",
                          fontSize: 11,
                          fontWeight: 800,
                          marginTop: 1,
                        }}
                      >
                        {i + 1}
                      </span>
                      <p
                        style={{
                          color: "var(--text-2)",
                          fontSize: 13.5,
                          lineHeight: 1.65,
                          flex: 1,
                        }}
                      >
                        {step}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
