"use client";

import NextImage from "next/image";
import dynamic from "next/dynamic";
import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Plus,
  AlertTriangle,
  ArrowRight,
  X,
  Volume2,
  Cpu,
  ShieldCheck,
  WifiOff,
  Coins,
  Code2,
  FileText,
  Image as ImageIcon,
  HeartHandshake,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
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
type InputTab = "image" | "text";

const SAMPLE_QUESTIONS = [
  {
    title: "OS Deadlock Trap",
    text: "A system has 3 processes (P1, P2, P3) competing for 3 resources (R1, R2, R3). R1 has 2 instances, R2 has 1 instance, and R3 has 2 instances. P1 holds R1 and requests R2. P2 holds R2 and requests R3. P3 holds R3 and requests R1. Is the system in a deadlock? Prove why a cycle does not guarantee deadlock here.",
  },
  {
    title: "Calculus L'Hôpital Trap",
    text: "Evaluate the limit as x approaches infinity of (x + sin(x)) / (x - cos(x)). If you apply L'Hôpital's Rule directly, what happens to the oscillating derivative terms, and what is the correct algebraic attack plan?",
  },
  {
    title: "DSA Array Trap",
    text: "Given an array of integers where every element appears twice except for two distinct numbers that appear only once, find those two elements in O(n) time and O(1) space. Why does naive XORing fail to distinguish between the two individual unique numbers?",
  },
];

export default function Home() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [inputTab, setInputTab] = useState<InputTab>("image");
  const [imageEntries, setImageEntries] = useState<ImageEntry[]>([]);
  const [questionText, setQuestionText] = useState("");
  const [result, setResult] = useState<TriageData | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showOpenInfo, setShowOpenInfo] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Clear error if input is provided
  useEffect(() => {
    if (
      (imageEntries.length > 0 || questionText.trim().length > 0) &&
      apiError === "Please provide either a question photo or question text."
    ) {
      setApiError(null);
    }
  }, [imageEntries.length, questionText, apiError]);

  const handleImagesChange = (entries: ImageEntry[]) => {
    setImageEntries(entries);
  };

  const handleTriage = async () => {
    if (phase === "loading") return;

    const hasImages = imageEntries.length > 0;
    const hasText = questionText.trim().length > 0;

    if (!hasImages && !hasText) {
      setApiError("Please provide either a question photo or question text.");
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
        body: JSON.stringify({
          images: base64Images.length > 0 ? base64Images : undefined,
          questionText: hasText ? questionText.trim() : undefined,
        }),
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
        extractedQuestion: data.extracted_question,
        modelUsed: data.model_used,
        inferenceMode: data.inference_mode,
        latencyMs: data.latency_ms,
      });
      setPhase("result");
    } catch (err: unknown) {
      if ((err as { name?: string }).name === "AbortError") {
        setPhase("idle");
        return;
      }
      setApiError(err instanceof Error ? err.message : "Something went wrong.");
      setPhase("idle");
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    abortRef.current = null;
  };

  const handleReset = () => {
    setPhase("idle");
    setImageEntries([]);
    setQuestionText("");
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
        {/* ── Top Navigation Bar ──────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            borderBottom: "1px solid var(--border)",
            background: "rgba(5,7,15,0.85)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {/* Logo & Identity */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 11,
                overflow: "hidden",
                boxShadow: "0 0 18px rgba(56,189,248,0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#080c16",
                border: "1px solid rgba(56,189,248,0.35)",
              }}
            >
              <NextImage
                src="/icon.png"
                alt="Gemmate Logo"
                width={36}
                height={36}
                style={{ objectFit: "cover" }}
                unoptimized
                priority
              />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    color: "var(--text-1)",
                    fontWeight: 900,
                    fontSize: 19,
                    letterSpacing: -0.6,
                  }}
                >
                  Gemmate
                </span>
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    letterSpacing: 0.8,
                    padding: "2px 7px",
                    borderRadius: 999,
                    background: "rgba(56,189,248,0.12)",
                    border: "1px solid rgba(56,189,248,0.3)",
                    color: "#38bdf8",
                    textTransform: "uppercase",
                  }}
                >
                  HF26
                </span>
              </div>
            </div>
          </div>

          {/* Action Pills */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {/* Why Open Innovation Matters Button */}
            <button
              onClick={() => setShowOpenInfo(true)}
              type="button"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 12px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "var(--text-2)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <HelpCircle size={13} style={{ color: "#38bdf8" }} />
              <span>Why Open AI?</span>
            </button>

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
                  padding: "6px 14px",
                  borderRadius: 10,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text-2)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Plus size={14} /> New Triage
              </motion.button>
            )}
          </div>
        </motion.header>

        {/* ── Main Container ───────────────────────────────── */}
        <div
          style={{
            flex: 1,
            maxWidth: 580,
            width: "100%",
            margin: "0 auto",
            padding: "24px 20px 140px",
          }}
        >
          {/* Hero Header */}
          <AnimatePresence mode="wait">
            {phase === "idle" && (
              <motion.div
                key="hero"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.45 }}
                style={{ marginBottom: 28 }}
              >
                {/* Friend Badge */}
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 12px",
                    borderRadius: 20,
                    background: "rgba(129,140,248,0.1)",
                    border: "1px solid rgba(129,140,248,0.25)",
                    marginBottom: 14,
                  }}
                >
                  <Sparkles size={14} style={{ color: "#818cf8" }} />
                  <span
                    style={{
                      color: "#818cf8",
                      fontSize: 11.5,
                      fontWeight: 700,
                    }}
                  >
                    Open-Weight Voice Companion · Hacktoberfest 2026
                  </span>
                </div>

                <h1
                  id="triage-heading"
                  style={{
                    fontSize: "clamp(26px,7vw,38px)",
                    fontWeight: 900,
                    letterSpacing: -1.2,
                    lineHeight: 1.15,
                    marginBottom: 12,
                    color: "var(--text-1)",
                  }}
                >
                  Crack exam traps with your{" "}
                  <span
                    style={{
                      background:
                        "linear-gradient(135deg,#38bdf8,#818cf8,#f43f5e)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    open-AI voice companion.
                  </span>
                </h1>

                <p
                  style={{
                    color: "var(--text-2)",
                    fontSize: 14,
                    lineHeight: 1.65,
                    maxWidth: 480,
                  }}
                >
                  Upload past papers or paste difficult problems. Powered by
                  Google&apos;s open-weight <strong>Gemma</strong> to unmask
                  deceptive traps, with comforting Socratic voice hints by{" "}
                  <strong>ElevenLabs</strong>.
                </p>

                {/* Tech Pills */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 7,
                    marginTop: 18,
                  }}
                >
                  {[
                    {
                      label: "Gemma Open Weights",
                      icon: Cpu,
                      color: "#38bdf8",
                    },
                    {
                      label: "ElevenLabs Voice Coach",
                      icon: Volume2,
                      color: "#34d399",
                    },
                    {
                      label: "100% Private & Local",
                      icon: ShieldCheck,
                      color: "#a78bfa",
                    },
                  ].map((pill) => {
                    const Icon = pill.icon;
                    return (
                      <span
                        key={pill.label}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "4px 10px",
                          borderRadius: 20,
                          fontSize: 11.5,
                          fontWeight: 600,
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          color: pill.color,
                        }}
                      >
                        <Icon size={12} />
                        {pill.label}
                      </span>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {phase === "result" && (
              <motion.div
                key="result-header"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 20,
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                </div>

                {result?.modelUsed && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--text-3)",
                      background: "rgba(255,255,255,0.04)",
                      padding: "3px 8px",
                      borderRadius: 6,
                      border: "1px solid var(--border)",
                    }}
                  >
                    Model: {result.modelUsed} ({result.inferenceMode})
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Error Notification ───────────────────────── */}
          <AnimatePresence>
            {apiError && phase === "idle" && (
              <motion.div
                key="alert"
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.3 }}
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
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-3)",
                      padding: 2,
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Input Section (Idle Phase) ───────────────── */}
          <AnimatePresence>
            {phase === "idle" && (
              <motion.div
                key="input-section"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                transition={{ duration: 0.35 }}
                style={{ marginBottom: 24 }}
              >
                {/* Input Mode Tabs */}
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    padding: 4,
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--border)",
                    marginBottom: 16,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setInputTab("image")}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 7,
                      padding: "8px 14px",
                      borderRadius: 9,
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      border: "none",
                      background:
                        inputTab === "image"
                          ? "rgba(56,189,248,0.15)"
                          : "transparent",
                      color: inputTab === "image" ? "#38bdf8" : "var(--text-3)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <ImageIcon size={14} />
                    <span>Upload Question Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputTab("text")}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 7,
                      padding: "8px 14px",
                      borderRadius: 9,
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      border: "none",
                      background:
                        inputTab === "text"
                          ? "rgba(129,140,248,0.15)"
                          : "transparent",
                      color: inputTab === "text" ? "#818cf8" : "var(--text-3)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <FileText size={14} />
                    <span>Type or Paste Question</span>
                  </button>
                </div>

                {inputTab === "image" ? (
                  <div>
                    <ImageUpload
                      images={imageEntries}
                      onImagesChange={handleImagesChange}
                      disabled={false}
                    />
                  </div>
                ) : (
                  <div>
                    <textarea
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      placeholder="Paste your exam question, equations, or code problem here..."
                      rows={5}
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        borderRadius: 14,
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        color: "var(--text-1)",
                        fontSize: 13.5,
                        lineHeight: 1.6,
                        resize: "vertical",
                        outline: "none",
                        fontFamily: "inherit",
                        boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2)",
                      }}
                    />

                    {/* Quick Sample Selector */}
                    <div style={{ marginTop: 12 }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "var(--text-3)",
                          textTransform: "uppercase",
                          letterSpacing: 0.8,
                          marginBottom: 8,
                        }}
                      >
                        Try a tricky sample problem:
                      </div>
                      <div
                        style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
                      >
                        {SAMPLE_QUESTIONS.map((sample) => (
                          <button
                            key={sample.title}
                            type="button"
                            onClick={() => setQuestionText(sample.text)}
                            style={{
                              fontSize: 11.5,
                              fontWeight: 600,
                              padding: "4px 10px",
                              borderRadius: 8,
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid var(--border)",
                              color: "var(--text-2)",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            {sample.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Triage Trigger Button */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{ marginTop: 24 }}
                >
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleTriage}
                    type="button"
                    style={{
                      width: "100%",
                      padding: "16px 24px",
                      borderRadius: 16,
                      background:
                        "linear-gradient(135deg,#38bdf8,#818cf8,#ec4899)",
                      border: "none",
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: 15,
                      letterSpacing: -0.3,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                      cursor: "pointer",
                      boxShadow: "0 4px 25px rgba(129,140,248,0.35)",
                    }}
                  >
                    <Sparkles size={18} />
                    <span>Triage with Gemma</span>
                    <ArrowRight size={17} />
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Loading Skeleton Phase ───────────────────── */}
          <AnimatePresence>
            {phase === "loading" && (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div style={{ marginBottom: 20 }}>
                  <SkeletonLoader onCancel={handleCancel} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Results Phase ────────────────────────────── */}
          <AnimatePresence>
            {phase === "result" && result && (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                style={{ display: "flex", flexDirection: "column", gap: 24 }}
              >
                {/* Result Diagnosis Cards with ElevenLabs Audio */}
                <ResultCards data={result} />

                {/* Practice Questions & Socratic Hints */}
                <PracticeCard
                  coreConcepts={result.coreConcepts}
                  theTrap={result.theTrap}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── "Why Open Innovation Matters" Modal ─────────── */}
        <AnimatePresence>
          {showOpenInfo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOpenInfo(false)}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 100,
                background: "rgba(0,0,0,0.75)",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
              }}
            >
              <motion.div
                initial={{ scale: 0.94, opacity: 0, y: 16 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0, y: 16 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  maxWidth: 520,
                  width: "100%",
                  background: "var(--surface)",
                  borderRadius: 22,
                  border: "1px solid var(--border)",
                  padding: "26px 28px",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
                  position: "relative",
                  maxHeight: "90vh",
                  overflowY: "auto",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: "rgba(56,189,248,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#38bdf8",
                      }}
                    >
                      <Code2 size={16} />
                    </div>
                    <h2
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: "var(--text-1)",
                      }}
                    >
                      Why Open Innovation Matters
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowOpenInfo(false)}
                    type="button"
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-3)",
                      cursor: "pointer",
                      padding: 4,
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <p
                  style={{
                    color: "var(--text-2)",
                    fontSize: 13.5,
                    lineHeight: 1.65,
                    marginBottom: 20,
                  }}
                >
                  This project was built for the{" "}
                  <strong>Hacktoberfest 2026 Challenge</strong>. Here is why an
                  open-source AI approach (Google Gemma) is fundamentally
                  superior for students:
                </p>

                <div
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}
                >
                  {[
                    {
                      icon: ShieldCheck,
                      color: "#34d399",
                      title: "100% Student Data Privacy",
                      desc: "Unpublished past papers, professor notes, and personal struggle areas never get hoovered into proprietary training clusters. Everything stays on the student's machine.",
                    },
                    {
                      icon: Coins,
                      color: "#fbbf24",
                      title: "Zero Token Cost for Students",
                      desc: "Proprietary APIs charge per token. With Gemma running on local Ollama, students can triage hundreds of questions a day without worrying about recurring API bills.",
                    },
                    {
                      icon: WifiOff,
                      color: "#38bdf8",
                      title: "Offline Campus Reliability",
                      desc: "Campus libraries, basements, and dorms often have spotty Wi-Fi. Gemmate operates completely disconnected from the cloud when running local Gemma.",
                    },
                    {
                      icon: Cpu,
                      color: "#a78bfa",
                      title: "Open Weights Sovereignty",
                      desc: "Open weights empower anyone to inspect, fine-tune, or adapt the model to specialized university syllabi without corporate gatekeeping.",
                    },
                  ].map((pillar) => {
                    const Icon = pillar.icon;
                    return (
                      <div
                        key={pillar.title}
                        style={{
                          display: "flex",
                          gap: 14,
                          padding: "12px 14px",
                          borderRadius: 12,
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: `${pillar.color}15`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            color: pillar.color,
                          }}
                        >
                          <Icon size={16} />
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 13.5,
                              fontWeight: 700,
                              color: "var(--text-1)",
                              marginBottom: 3,
                            }}
                          >
                            {pillar.title}
                          </div>
                          <div
                            style={{
                              fontSize: 12.5,
                              color: "var(--text-2)",
                              lineHeight: 1.55,
                            }}
                          >
                            {pillar.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setShowOpenInfo(false)}
                  style={{
                    width: "100%",
                    marginTop: 22,
                    padding: "10px 16px",
                    borderRadius: 12,
                    background: "rgba(56,189,248,0.12)",
                    border: "1px solid rgba(56,189,248,0.3)",
                    color: "#38bdf8",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Close & Back to Gemmate
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
