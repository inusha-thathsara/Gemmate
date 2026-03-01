"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Dumbbell, ChevronDown, ChevronUp, Loader2,
    AlertTriangle, RefreshCw, Sparkles, Plus, X, FileDown, Lightbulb,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { exportQuestionAsPdf } from "../utils/exportPdf";

interface PracticeCardProps {
    coreConcepts: string[];
    theTrap: string[];
}

interface QuestionItem {
    id: string;
    state: "loading" | "done" | "error";
    markdown: string;
    error: string;
    expanded: boolean;
    controller: AbortController | null;
    hints: string[];
    hintsLoading: boolean;
    hintsOpen: boolean;
}

async function fetchQuestion(
    coreConcepts: string[],
    theTrap: string[],
    signal: AbortSignal
): Promise<string> {
    const res = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ core_concepts: coreConcepts, the_trap: theTrap }),
        signal,
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(body.error ?? `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.markdown ?? "";
}

async function fetchHint(question: string, existingHints: string[]): Promise<string> {
    const res = await fetch("/api/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, existing_hints: existingHints }),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(body.error ?? `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.hint ?? "";
}

export default function PracticeCard({ coreConcepts, theTrap }: PracticeCardProps) {
    const [questions, setQuestions] = useState<QuestionItem[]>([]);
    const contentRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    const setRef = useCallback((id: string) => (node: HTMLDivElement | null) => {
        if (node) contentRefs.current.set(id, node);
        else contentRefs.current.delete(id);
    }, []);

    const handleExport = (id: string, number: number) => {
        const node = contentRefs.current.get(id);
        if (!node) return;
        exportQuestionAsPdf(node.innerHTML, number);
    };

    const addHint = async (id: string) => {
        const q = questions.find((q) => q.id === id);
        if (!q || q.hintsLoading || q.hints.length >= 3) return;

        setQuestions((prev) =>
            prev.map((q) => q.id === id ? { ...q, hintsLoading: true, hintsOpen: true } : q)
        );
        try {
            const hint = await fetchHint(q.markdown, q.hints);
            setQuestions((prev) =>
                prev.map((q) => q.id === id ? { ...q, hints: [...q.hints, hint], hintsLoading: false } : q)
            );
        } catch {
            setQuestions((prev) =>
                prev.map((q) => q.id === id ? { ...q, hintsLoading: false } : q)
            );
        }
    };

    const toggleHints = (id: string) =>
        setQuestions((prev) =>
            prev.map((q) => q.id === id ? { ...q, hintsOpen: !q.hintsOpen } : q)
        );

    const addQuestion = async () => {
        const id = crypto.randomUUID();
        const controller = new AbortController();

        const initial: QuestionItem = {
            id, state: "loading", markdown: "", error: "", expanded: true, controller,
            hints: [], hintsLoading: false, hintsOpen: false,
        };
        setQuestions((prev) => [...prev, initial]);

        try {
            const markdown = await fetchQuestion(coreConcepts, theTrap, controller.signal);
            setQuestions((prev) =>
                prev.map((q) => q.id === id ? { ...q, state: "done", markdown, controller: null } : q)
            );
        } catch (err: unknown) {
            if ((err as { name?: string }).name === "AbortError") {
                setQuestions((prev) => prev.filter((q) => q.id !== id));
                return;
            }
            const error = err instanceof Error ? err.message : "Something went wrong.";
            setQuestions((prev) =>
                prev.map((q) => q.id === id ? { ...q, state: "error", error, controller: null } : q)
            );
        }
    };

    const cancelQuestion = (id: string) => {
        setQuestions((prev) => {
            const q = prev.find((q) => q.id === id);
            q?.controller?.abort();
            return prev; // will be removed by AbortError handler above
        });
    };

    const regenerateQuestion = async (id: string) => {
        const controller = new AbortController();

        setQuestions((prev) =>
            prev.map((q) => q.id === id ? { ...q, state: "loading", markdown: "", error: "", controller } : q)
        );

        try {
            const markdown = await fetchQuestion(coreConcepts, theTrap, controller.signal);
            setQuestions((prev) =>
                prev.map((q) => q.id === id ? { ...q, state: "done", markdown, controller: null } : q)
            );
        } catch (err: unknown) {
            if ((err as { name?: string }).name === "AbortError") return;
            const error = err instanceof Error ? err.message : "Something went wrong.";
            setQuestions((prev) =>
                prev.map((q) => q.id === id ? { ...q, state: "error", error, controller: null } : q)
            );
        }
    };

    const removeQuestion = (id: string) => {
        setQuestions((prev) => {
            const q = prev.find((q) => q.id === id);
            q?.controller?.abort();
            return prev.filter((q) => q.id !== id);
        });
    };

    const toggleExpand = (id: string) =>
        setQuestions((prev) =>
            prev.map((q) => q.id === id ? { ...q, expanded: !q.expanded } : q)
        );

    const questionNumber = (id: string) =>
        questions.findIndex((q) => q.id === id) + 1;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55, ease: [0.22, 1, 0.36, 1] }} style={{ marginTop: 20 }}>

            {/* Section divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                <span style={{ color: "var(--text-3)", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    Practice Mode
                </span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>

            {/* Existing question cards */}
            <AnimatePresence initial={false}>
                {questions.map((q) => (
                    <motion.div
                        key={q.id}
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: "auto", marginBottom: 12 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                        style={{ overflow: "hidden" }}
                    >
                        <div style={{
                            background: "var(--surface)",
                            border: "1px solid rgba(167,139,250,0.2)",
                            borderRadius: 18, overflow: "hidden",
                            boxShadow: "0 0 0 1px var(--border), inset 0 0 30px rgba(124,58,237,0.04)",
                        }}>
                            {/* Gradient top bar */}
                            <div style={{ height: 3, background: "linear-gradient(90deg,#7c3aed,#a78bfa,#ec4899)" }} />

                            {/* Card header */}
                            <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: q.expanded ? "1px solid var(--border)" : "none" }}>
                                {/* Toggle expand */}
                                <button onClick={() => toggleExpand(q.id)} style={{ flex: 1, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, textAlign: "left" }}>
                                    <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(167,139,250,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <Dumbbell size={13} color="#a78bfa" />
                                    </div>
                                    <span style={{ color: "var(--text-1)", fontWeight: 700, fontSize: 13.5 }}>
                                        Practice Question {questionNumber(q.id)}
                                    </span>
                                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(167,139,250,0.2)", color: "#a78bfa" }}>
                                        AI Generated
                                    </span>
                                    <div style={{ marginLeft: "auto", color: "var(--text-3)" }}>
                                        {q.expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </div>
                                </button>

                                {/* Action buttons */}
                                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                                    {q.state === "loading" ? (
                                        /* Cancel while loading */
                                        <button onClick={() => cancelQuestion(q.id)} title="Cancel"
                                            style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--red)" }}>
                                            <X size={13} />
                                        </button>
                                    ) : (
                                        <>
                                            {/* Export PDF — only when done */}
                                            {q.state === "done" && (
                                                <button onClick={() => handleExport(q.id, questionNumber(q.id))} title="Export as PDF"
                                                    style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#34d399" }}>
                                                    <FileDown size={12} />
                                                </button>
                                            )}
                                            {/* Regenerate */}
                                            <button onClick={() => regenerateQuestion(q.id)} title="Regenerate"
                                                style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(167,139,250,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#a78bfa" }}>
                                                <RefreshCw size={12} />
                                            </button>
                                            {/* Remove */}
                                            <button onClick={() => removeQuestion(q.id)} title="Remove"
                                                style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--red)" }}>
                                                <X size={12} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Body */}
                            <AnimatePresence initial={false}>
                                {q.expanded && (
                                    <motion.div key="body" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} style={{ overflow: "hidden" }}>
                                        {/* Inner state crossfade */}
                                        <AnimatePresence mode="wait" initial={false}>
                                            {q.state === "loading" && (
                                                <motion.div key="loading"
                                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 20px" }}>
                                                    <Loader2 size={16} color="#a78bfa" className="spin" />
                                                    <span style={{ color: "var(--text-3)", fontSize: 13 }}>Generating question…</span>
                                                </motion.div>
                                            )}
                                            {q.state === "error" && (
                                                <motion.div key="error"
                                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.25 }}
                                                    style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "16px 18px", color: "var(--red)" }}>
                                                    <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                                                    <p style={{ fontSize: 13 }}>{q.error}</p>
                                                </motion.div>
                                            )}
                                            {q.state === "done" && (
                                                <motion.div key="done"
                                                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                                                    {/* Question content */}
                                                    <div
                                                        ref={setRef(q.id)}
                                                        className="practice-md"
                                                        style={{ padding: "18px 20px 4px" }}
                                                    >
                                                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                            {q.markdown}
                                                        </ReactMarkdown>
                                                    </div>

                                                    {/* ── Hints section ─────────────────── */}
                                                    <div style={{ padding: "0 16px 18px" }}>
                                                        {/* Divider + toggle header */}
                                                        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "10px 0 12px" }}>
                                                            <div style={{ flex: 1, height: 1, background: "rgba(251,191,36,0.15)" }} />
                                                            {q.hints.length > 0 && (
                                                                <button onClick={() => toggleHints(q.id)} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", color: "#fbbf24", fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase" }}>
                                                                    <Lightbulb size={12} />
                                                                    Hints ({q.hints.length})
                                                                    {q.hintsOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                                                </button>
                                                            )}
                                                            <div style={{ flex: 1, height: 1, background: "rgba(251,191,36,0.15)" }} />
                                                        </div>

                                                        {/* Revealed hints */}
                                                        <AnimatePresence initial={false}>
                                                            {q.hintsOpen && q.hints.map((hint, i) => (
                                                                <motion.div
                                                                    key={i}
                                                                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                                                    animate={{ opacity: 1, height: "auto", marginBottom: 10 }}
                                                                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                                                    transition={{ duration: 0.32, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                                                                    style={{ overflow: "hidden" }}
                                                                >
                                                                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "11px 14px", background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.18)", borderRadius: 11 }}>
                                                                        <span style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)", color: "#fbbf24", fontSize: 10, fontWeight: 800 }}>
                                                                            {i + 1}
                                                                        </span>
                                                                        <div style={{ color: "var(--text-2)", fontSize: 13, lineHeight: 1.65 }} className="practice-md">
                                                                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                                                {hint}
                                                                            </ReactMarkdown>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            ))}
                                                        </AnimatePresence>

                                                        {/* Get hint button */}
                                                        {q.hints.length < 3 && (
                                                            <motion.button
                                                                onClick={() => addHint(q.id)}
                                                                disabled={q.hintsLoading}
                                                                whileHover={{ scale: q.hintsLoading ? 1 : 1.02 }}
                                                                whileTap={{ scale: q.hintsLoading ? 1 : 0.97 }}
                                                                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px 16px", borderRadius: 11, background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24", fontSize: 13, fontWeight: 700, cursor: q.hintsLoading ? "not-allowed" : "pointer" }}
                                                            >
                                                                {q.hintsLoading
                                                                    ? <><Loader2 size={13} className="spin" /> Getting hint…</>
                                                                    : <><Lightbulb size={13} /> {q.hints.length === 0 ? "Get a Hint" : "Get Another Hint"}</>
                                                                }
                                                            </motion.button>
                                                        )}
                                                        {q.hints.length >= 3 && (
                                                            <p style={{ textAlign: "center", color: "var(--text-3)", fontSize: 12, fontStyle: "italic" }}>
                                                                Maximum hints reached — try solving it now!
                                                            </p>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}

                                        </AnimatePresence>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Generate / Generate Another button */}
            <motion.button
                onClick={addQuestion}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
                style={{
                    width: "100%",
                    background: "linear-gradient(135deg,#7c3aed 0%,#a78bfa 50%,#ec4899 100%)",
                    border: "none", borderRadius: 16, padding: "15px 20px",
                    color: "#fff", fontSize: 15, fontWeight: 800, letterSpacing: -0.2,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                    boxShadow: "0 0 30px rgba(124,58,237,0.3), 0 4px 20px rgba(0,0,0,0.35)",
                    position: "relative", overflow: "hidden",
                }}
            >
                <motion.div
                    style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)", backgroundSize: "200% 100%" }}
                    animate={{ backgroundPosition: ["-200% center", "200% center"] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
                />
                {questions.length === 0 ? (
                    <><Dumbbell size={17} /> Generate Practice Question <Sparkles size={14} style={{ opacity: 0.7 }} /></>
                ) : (
                    <><Plus size={16} /> Generate Another Question</>
                )}
            </motion.button>
        </motion.div>
    );
}
