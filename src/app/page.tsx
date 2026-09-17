"use client";

import dynamic from "next/dynamic";
import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Plus, AlertTriangle, ArrowRight, X } from "lucide-react";
import ImageUpload, { ImageEntry } from "./components/ImageUpload";
import SkeletonLoader from "./components/SkeletonLoader";
import type { TriageData } from "./components/ResultCards";
import { getIdToken } from "../../lib/firebaseClient";

const ResultCards = dynamic(() => import("./components/ResultCards"), {
  ssr: false,
});

const PracticeCard = dynamic(() => import("./components/PracticeCard"), {
  ssr: false,
});

type Phase = "idle" | "loading" | "result";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [imageEntries, setImageEntries] = useState<ImageEntry[]>([]);
  const [result, setResult] = useState<TriageData | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Clear image requirement error as soon as images are uploaded
  useEffect(() => {
    if (
      imageEntries.length > 0 &&
      apiError === "Please upload at least one image before triaging."
    ) {
      setApiError(null);
    }
  }, [imageEntries.length, apiError]);

  const handleImagesChange = (entries: ImageEntry[]) => {
    setImageEntries(entries);
    if (
      entries.length > 0 &&
      apiError === "Please upload at least one image before triaging."
    ) {
      setApiError(null);
    }
  };

  const handleTriage = async () => {
    if (phase === "loading") return;
    if (imageEntries.length === 0) {
      setApiError("Please upload at least one image before triaging.");
      return;
    }
    setPhase("loading");
    setResult(null);
    setApiError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const base64Images = imageEntries.map((e) => e.base64);
      const idToken = await getIdToken();
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ images: base64Images }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res
          .json()
          .catch(() => ({ error: res.statusText }));
        throw new Error(errBody.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json();
      setResult({
        coreConcepts: data.core_concepts ?? [],
        theTrap: Array.isArray(data.the_trap)
          ? data.the_trap
          : data.the_trap
            ? [data.the_trap]
            : [],
        attackPlan: data.attack_plan ?? [],
      });
      setPhase("result");
    } catch (err: unknown) {
      if ((err as { name?: string }).name === "AbortError") {
        setPhase("idle");
        return;
      }
      setApiError(err instanceof Error ? err.message : "Something went wrong.");
      setPhase("idle"); // stay on idle — show inline alert, not error screen
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    // phase will be set to idle inside the catch block
  };

  const handleReset = () => {
    setPhase("idle");
    setImageEntries([]);
    setResult(null);
    setApiError(null);
  };

  return (
    <>
      <div className="ambient-bg" />
      <main
        aria-labelledby="triage-heading"
        style={{
          background: "transparent",
          minHeight: "100dvh",
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ── Header ───────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            borderBottom: "1px solid var(--border)",
            background: "rgba(5,7,15,0.8)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "linear-gradient(135deg,#4f8eff,#a78bfa)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 20px rgba(79,142,255,0.4)",
              }}
            >
              <Zap size={17} color="#fff" fill="#fff" />
            </div>
            <span
              style={{
                color: "var(--text-1)",
                fontWeight: 900,
                fontSize: 18,
                letterSpacing: -0.6,
              }}
            >
              Triage
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0.8,
                padding: "2px 7px",
                borderRadius: 5,
                background: "rgba(79,142,255,0.12)",
                border: "1px solid rgba(79,142,255,0.25)",
                color: "#4f8eff",
                textTransform: "uppercase",
              }}
            >
              AI
            </span>
          </div>

          <AnimatePresence>
            {phase === "result" && (
              <motion.button
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReset}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  borderRadius: 10,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text-2)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Plus size={14} /> New
              </motion.button>
            )}
          </AnimatePresence>
        </motion.header>

        {/* ── Body ─────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            maxWidth: 520,
            width: "100%",
            margin: "0 auto",
            padding: "28px 20px 140px",
          }}
        >
          {/* Hero / phase label */}
          <AnimatePresence mode="wait">
            {phase === "idle" && (
              <motion.div
                key="hero"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.45 }}
                style={{ marginBottom: 32 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 12px",
                    borderRadius: 20,
                    background: "rgba(79,142,255,0.1)",
                    border: "1px solid rgba(79,142,255,0.2)",
                    marginBottom: 16,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#4f8eff",
                      boxShadow: "0 0 8px #4f8eff",
                    }}
                  />
                  <span
                    style={{ color: "#4f8eff", fontSize: 12, fontWeight: 600 }}
                  >
                    Powered by Gemini 3.8 Flash
                  </span>
                </motion.div>
                <h1
                  id="triage-heading"
                  className="glow-text"
                  style={{
                    fontSize: "clamp(28px,8vw,40px)",
                    fontWeight: 900,
                    letterSpacing: -1.5,
                    lineHeight: 1.15,
                    marginBottom: 14,
                    color: "var(--text-1)",
                  }}
                >
                  Crack your exam
                  <br />
                  <span className="grad-blue">question instantly.</span>
                </h1>
                <p
                  style={{
                    color: "var(--text-2)",
                    fontSize: 14.5,
                    lineHeight: 1.7,
                    maxWidth: 400,
                  }}
                >
                  Upload your question · Triage breaks it down into core
                  concepts, the hidden trap, and a step-by-step attack plan.
                </p>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    marginTop: 20,
                  }}
                >
                  {[
                    "Core Concepts",
                    "Hidden Trap",
                    "Attack Plan",
                    "Practice Q",
                  ].map((tag, i) => (
                    <motion.span
                      key={tag}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + i * 0.07 }}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        color: "var(--text-3)",
                      }}
                    >
                      {tag}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}

            {phase === "result" && (
              <motion.div
                key="result-label"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 22,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#34d399",
                    boxShadow: "0 0 10px #34d399",
                  }}
                />
                <span
                  style={{
                    color: "var(--text-3)",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  Triage Complete
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Inline error alert ───────────────────────── */}
          <AnimatePresence>
            {apiError && phase === "idle" && (
              <motion.div
                key="alert"
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                style={{ overflow: "hidden", marginBottom: 16 }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "13px 16px",
                    borderRadius: 14,
                    background: "rgba(251,191,36,0.07)",
                    border: "1px solid rgba(251,191,36,0.25)",
                  }}
                >
                  <AlertTriangle
                    size={16}
                    style={{ color: "#fbbf24", flexShrink: 0, marginTop: 1 }}
                  />
                  <p
                    style={{
                      color: "var(--text-2)",
                      fontSize: 13.5,
                      flex: 1,
                      lineHeight: 1.5,
                    }}
                  >
                    {apiError}
                  </p>
                  <button
                    onClick={() => setApiError(null)}
                    type="button"
                    aria-label="Dismiss error message"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-3)",
                      padding: 2,
                      flexShrink: 0,
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upload section */}
          <AnimatePresence>
            {phase === "idle" && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                transition={{ duration: 0.35 }}
                style={{ marginBottom: 24 }}
              >
                <label
                  style={{
                    color: "var(--text-3)",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: 12,
                  }}
                >
                  Question Images
                </label>
                <ImageUpload
                  images={imageEntries}
                  onImagesChange={handleImagesChange}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dynamic content */}
          <AnimatePresence mode="wait">
            {phase === "loading" && (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <SkeletonLoader />
              </motion.div>
            )}
            {phase === "result" && result && (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <ResultCards data={result} />
                <PracticeCard
                  coreConcepts={result.coreConcepts}
                  theTrap={result.theTrap}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Fixed CTA ────────────────────────────────── */}
        <AnimatePresence>
          {(phase === "idle" || phase === "loading") && (
            <motion.div
              initial={{ y: 120, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 120, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "20px 20px 36px",
                background:
                  "linear-gradient(to top, var(--bg) 55%, rgba(5,7,15,0) 100%)",
                zIndex: 40,
              }}
            >
              <div
                style={{
                  maxWidth: 520,
                  margin: "0 auto",
                  display: "flex",
                  gap: 10,
                }}
              >
                {/* Cancel button — only while loading */}
                <AnimatePresence>
                  {phase === "loading" && (
                    <motion.button
                      key="cancel"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 52 }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.25 }}
                      onClick={handleCancel}
                      type="button"
                      aria-label="Cancel triage request"
                      title="Cancel request"
                      style={{
                        flexShrink: 0,
                        height: 56,
                        borderRadius: 16,
                        background: "var(--surface-3)",
                        border: "1px solid var(--border-bright)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--red)",
                        cursor: "pointer",
                        overflow: "hidden",
                      }}
                    >
                      <X size={18} />
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Main button */}
                <motion.button
                  onClick={handleTriage}
                  type="button"
                  disabled={phase === "loading"}
                  aria-describedby="triage-help"
                  whileTap={{ scale: 0.97 }}
                  style={{
                    flex: 1,
                    background:
                      phase === "loading"
                        ? "var(--surface-2)"
                        : "linear-gradient(135deg,#4f8eff 0%,#6366f1 55%,#a78bfa 100%)",
                    border: "none",
                    borderRadius: 16,
                    padding: "18px 24px",
                    color: phase === "loading" ? "var(--text-3)" : "#fff",
                    fontSize: 16,
                    fontWeight: 800,
                    letterSpacing: -0.3,
                    cursor: phase === "loading" ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    boxShadow:
                      phase === "loading"
                        ? "none"
                        : "0 0 40px rgba(79,142,255,0.35), 0 4px 24px rgba(0,0,0,0.4)",
                    transition: "all 0.25s ease",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {phase !== "loading" && (
                    <motion.div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)",
                        backgroundSize: "200% 100%",
                      }}
                      animate={{
                        backgroundPosition: ["-200% center", "200% center"],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  )}
                  {phase === "loading" ? (
                    <>
                      <motion.div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          border: "2px solid var(--border-bright)",
                          borderTopColor: "#4f8eff",
                        }}
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 0.85,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                      Triaging…
                    </>
                  ) : (
                    <>
                      <Zap size={18} fill="#fff" />
                      Triage Question
                      <ArrowRight size={16} style={{ marginLeft: 4 }} />
                    </>
                  )}
                </motion.button>
              </div>
              <p id="triage-help" className="sr-only">
                Upload one or more question images, then start the triage
                analysis.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
