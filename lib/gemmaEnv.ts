import fs from "fs";
import path from "path";

/**
 * Gemmate AI Engine
 *
 * Provides unified inference for:
 * 1. Local Ollama: Open-weight Gemma (gemma3:1b, gemma4:e4b, gemma4:12b) + Moondream for visual question parsing
 * 2. Cloud Open-Weight Gemma API: (Groq gemma2-9b-it / OpenRouter google/gemma-2-9b-it)
 */

export interface TriageResult {
  core_concepts: string[];
  the_trap: string[];
  attack_plan: string[];
  extracted_question?: string;
  model_used: string;
  inference_mode: "local-ollama" | "cloud-gemma";
  latency_ms: number;
}

export interface HintResult {
  hint: string;
  model_used: string;
  inference_mode: "local-ollama" | "cloud-gemma";
  latency_ms: number;
}

export interface PracticeResult {
  markdown: string;
  model_used: string;
  inference_mode: "local-ollama" | "cloud-gemma";
  latency_ms: number;
}

function getEnvVar(key: string, defaultValue = ""): string {
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      const match = content.match(new RegExp(`^${key}=(.*)$`, "m"));
      if (match && match[1].trim()) {
        return match[1].trim();
      }
    }
  } catch {}
  return process.env[key] || defaultValue;
}

export const OLLAMA_BASE_URL = getEnvVar(
  "OLLAMA_BASE_URL",
  "http://localhost:11434",
);
export const OLLAMA_MODEL = getEnvVar("OLLAMA_MODEL", "gemma3:1b");
export const OLLAMA_VISION_MODEL = getEnvVar(
  "OLLAMA_VISION_MODEL",
  "moondream:latest",
);
export const GROQ_API_KEY = getEnvVar("GROQ_API_KEY", "");
export const GEMMA_CLOUD_MODEL = getEnvVar("GEMMA_CLOUD_MODEL", "gemma2-9b-it");

/**
 * Check if local Ollama instance is alive and reachable.
 */
export async function isOllamaReachable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Transcribe image to text using Ollama vision model (moondream) locally,
 * or Google Gemini Flash Vision / Groq Vision in the cloud.
 */
export async function transcribeImageWithVision(
  base64Image: string,
): Promise<string> {
  const mimeMatch = base64Image.match(
    /^data:(image\/[a-zA-Z0-9\+\-]+);base64,/,
  );
  const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const cleanBase64 = base64Image
    .replace(/^data:image\/[a-zA-Z0-9\+\-]+;base64,/, "")
    .replace(/^data:image\/[a-zA-Z]+;base64,/, "");

  // 1. Try local Ollama if reachable
  const ollamaOnline = await isOllamaReachable();
  if (ollamaOnline) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);

      const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_VISION_MODEL,
          prompt:
            "Carefully read and transcribe the entire text, mathematical expressions, formulas, and diagrams in this exam question image verbatim.",
          images: [cleanBase64],
          stream: false,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        return (data.response || "").trim();
      }
    } catch (err) {
      console.warn("[Vision Transcription - Ollama] Error:", err);
    }
  }

  // 2. Cloud Fallback: Google Gemini Vision
  const geminiKey = GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const ai = new GoogleGenerativeAI(geminiKey);
      const candidateVisionModels = [
        "gemini-1.5-flash",
        "gemini-2.0-flash",
        "gemini-2.5-flash",
      ];
      for (const m of candidateVisionModels) {
        try {
          const model = ai.getGenerativeModel({ model: m });
          const prompt =
            "Carefully read and transcribe the entire text, mathematical expressions, formulas, and diagrams in this exam question image verbatim. Return only the extracted question text.";
          const imagePart = {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
            },
          };
          const res = await model.generateContent([prompt, imagePart]);
          const text = res.response.text().trim();
          if (text) return text;
        } catch (mErr) {
          console.warn(`[Vision Transcription - Gemini ${m}] failed:`, mErr);
        }
      }
    } catch (err) {
      console.warn("[Vision Transcription - Gemini] Error:", err);
    }
  }

  // 3. Cloud Fallback: Groq Vision
  const groqKey = GROQ_API_KEY || process.env.GROQ_API_KEY;
  if (groqKey) {
    const candidateGroqModels = [
      "llama-3.2-11b-vision-preview",
      "llama-3.2-90b-vision-preview",
    ];
    for (const gm of candidateGroqModels) {
      try {
        const res = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${groqKey}`,
            },
            body: JSON.stringify({
              model: gm,
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: "Carefully read and transcribe the entire text, mathematical expressions, formulas, and diagrams in this exam question image verbatim.",
                    },
                    {
                      type: "image_url",
                      image_url: {
                        url: `data:${mimeType};base64,${cleanBase64}`,
                      },
                    },
                  ],
                },
              ],
              temperature: 0.1,
            }),
          },
        );
        if (res.ok) {
          const data = await res.json();
          const content = (data.choices?.[0]?.message?.content || "").trim();
          if (content) return content;
        }
      } catch (err) {
        console.warn(`[Vision Transcription - Groq ${gm}] Error:`, err);
      }
    }
  }

  return "";
}

/**
 * Clean and extract JSON from raw model text (handles ```json fences).
 */
function extractJson<T>(rawText: string): T {
  let cleaned = rawText.trim();
  // Strip markdown code block fences if present
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }

  // Find first { and last }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }

  return JSON.parse(cleaned) as T;
}

/**
 * Execute prompt with local Ollama Gemma.
 */
async function queryOllamaGemma(
  prompt: string,
  systemPrompt?: string,
  modelName = OLLAMA_MODEL,
  formatJson = false,
): Promise<{ text: string; model: string }> {
  const fullPrompt = systemPrompt
    ? `${systemPrompt}\n\nUser: ${prompt}`
    : prompt;

  const bodyPayload: Record<string, unknown> = {
    model: modelName,
    prompt: fullPrompt,
    stream: false,
    options: {
      temperature: 0.2,
      top_p: 0.9,
    },
  };

  if (formatJson) {
    bodyPayload.format = "json";
  }

  const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyPayload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Ollama generation failed (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return {
    text: data.response || "",
    model: modelName,
  };
}

export const GEMINI_API_KEY = getEnvVar("GEMINI_API_KEY", "");

/**
 * Cloud Open-Weight Gemma API (Groq / Gemini) fallback
 */
async function queryCloudGemma(
  prompt: string,
  systemPrompt?: string,
  formatJson = false,
): Promise<{ text: string; model: string }> {
  const groqKey = GROQ_API_KEY || process.env.GROQ_API_KEY;
  const geminiKey = GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  // 1. Try Groq open-weight Gemma
  if (groqKey) {
    try {
      const messages = [];
      if (systemPrompt) {
        messages.push({ role: "system", content: systemPrompt });
      }
      messages.push({ role: "user", content: prompt });

      const res = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: GEMMA_CLOUD_MODEL,
            messages,
            temperature: 0.2,
            response_format: formatJson ? { type: "json_object" } : undefined,
          }),
        },
      );

      if (res.ok) {
        const data = await res.json();
        return {
          text: data.choices?.[0]?.message?.content || "",
          model: `groq-${GEMMA_CLOUD_MODEL}`,
        };
      }
    } catch (groqErr) {
      console.warn("[Cloud Groq] Error:", groqErr);
    }
  }

  // 2. Try Google AI Studio (Gemini / Gemma)
  if (geminiKey) {
    const candidateModels = [
      "gemini-1.5-flash",
      "gemini-2.0-flash",
      "gemini-2.5-flash",
    ];
    for (const m of candidateModels) {
      try {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const ai = new GoogleGenerativeAI(geminiKey);
        const model = ai.getGenerativeModel({
          model: m,
          generationConfig: {
            temperature: 0.2,
            responseMimeType: formatJson ? "application/json" : undefined,
          },
          systemInstruction: systemPrompt,
        });

        const result = await model.generateContent(prompt);
        const txt = result.response.text();
        if (txt) {
          return {
            text: txt,
            model: `gemini-cloud-${m}`,
          };
        }
      } catch (geminiErr) {
        console.warn(`[Cloud Gemini ${m}] Error:`, geminiErr);
      }
    }
  }

  throw new Error(
    "Local Ollama is unavailable on Vercel and neither GEMINI_API_KEY nor GROQ_API_KEY is configured in Vercel Project Environment Variables.",
  );
}

/**
 * Universal Gemma reasoning executor (Ollama local first, cloud open-weight fallback)
 */
async function runGemma(
  prompt: string,
  systemPrompt: string,
  formatJson = false,
): Promise<{
  text: string;
  model: string;
  mode: "local-ollama" | "cloud-gemma";
  latencyMs: number;
}> {
  const startTime = Date.now();
  const ollamaAvailable = await isOllamaReachable();

  if (ollamaAvailable) {
    try {
      // Try configured model, fallback to gemma3:1b or gemma4:e4b
      const candidateModels = Array.from(
        new Set([OLLAMA_MODEL, "gemma3:1b", "gemma4:e4b", "gemma4:12b"]),
      );
      let lastErr: unknown;

      for (const m of candidateModels) {
        try {
          const res = await queryOllamaGemma(
            prompt,
            systemPrompt,
            m,
            formatJson,
          );
          return {
            text: res.text,
            model: res.model,
            mode: "local-ollama",
            latencyMs: Date.now() - startTime,
          };
        } catch (err) {
          lastErr = err;
          console.warn(
            `[Gemma Local] Failed with ${m}, trying next candidate...`,
          );
        }
      }
      throw lastErr;
    } catch (ollamaErr) {
      console.warn(
        "[Gemma Local] Ollama failed, attempting cloud fallback...",
        ollamaErr,
      );
    }
  }

  // Cloud Open-Weight Gemma
  const cloudRes = await queryCloudGemma(prompt, systemPrompt, formatJson);
  return {
    text: cloudRes.text,
    model: cloudRes.model,
    mode: "cloud-gemma",
    latencyMs: Date.now() - startTime,
  };
}

const TRIAGE_SYSTEM_PROMPT = `You are Gemmate, an empathetic, top-tier study partner helping students conquer tricky exam questions.
Your goal is to triage the question to relieve their exam anxiety.
DO NOT solve the question directly or output the final answer.
Instead, perform a structured triage:
1. Core Concepts: The essential underlying theoretical principles.
2. The Trap(s): The deceptive wording, subtle edge cases, unit traps, or misconceptions designed to trick students.
3. Attack Plan: 3 to 4 sequential, actionable steps to solve the problem systematically.

You must respond ONLY with a valid JSON object matching this schema:
{
  "core_concepts": ["concept 1", "concept 2"],
  "the_trap": ["The primary trap or subtle trick", "Secondary trap if applicable"],
  "attack_plan": ["Step 1: First action...", "Step 2: Key calculation/formulation...", "Step 3: Verification..."]
}`;

/**
 * Triage an exam question (text and/or images) using Gemma.
 */
export async function triageExamQuestion(params: {
  images?: string[];
  questionText?: string;
}): Promise<TriageResult> {
  let combinedQuestionText = (params.questionText || "").trim();

  // If images are provided, transcribe with vision model first
  if (params.images && params.images.length > 0) {
    const transcriptions = [];
    for (let i = 0; i < params.images.length; i++) {
      const transcription = await transcribeImageWithVision(params.images[i]);
      if (transcription) {
        transcriptions.push(
          `[Image ${i + 1} Question Content]:\n${transcription}`,
        );
      }
    }
    if (transcriptions.length > 0) {
      combinedQuestionText =
        `${combinedQuestionText}\n\n${transcriptions.join("\n\n")}`.trim();
    }
  }

  if (!combinedQuestionText) {
    const hasCloudKeys = Boolean(
      GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      GROQ_API_KEY ||
      process.env.GROQ_API_KEY,
    );
    if (!hasCloudKeys) {
      throw new Error(
        "Could not extract question text from the uploaded images because no AI vision keys are configured. Please set GEMINI_API_KEY (from Google AI Studio) or GROQ_API_KEY in your Vercel Project Environment Variables, or use the 'Type or Paste Question' tab.",
      );
    }
    throw new Error(
      "Could not extract readable question text from the uploaded images. Please ensure the photos are clear and legible, or use the 'Type or Paste Question' tab.",
    );
  }

  const userPrompt = `Here is the exam question being studied:\n\n${combinedQuestionText}\n\nAnalyze this question, identify all tricks/traps, and output the required JSON format.`;

  const { text, model, mode, latencyMs } = await runGemma(
    userPrompt,
    TRIAGE_SYSTEM_PROMPT,
    true,
  );

  interface ParsedTriage {
    core_concepts?: string[];
    the_trap?: string[] | string;
    attack_plan?: string[];
  }

  let parsed: ParsedTriage;
  try {
    parsed = extractJson<ParsedTriage>(text);
  } catch (err) {
    console.error("[triageExamQuestion] JSON Parse Error on raw text:", text);
    // Graceful recovery format
    parsed = {
      core_concepts: ["Problem Formulation", "System Analysis"],
      the_trap: [
        "Be cautious of boundary conditions and hidden question constraints.",
      ],
      attack_plan: [
        "1. Identify the given parameters and required output.",
        "2. Apply the fundamental equations matching the core concept.",
        "3. Check for edge case constraints before finalizing.",
      ],
    };
  }

  const traps = Array.isArray(parsed.the_trap)
    ? parsed.the_trap
    : parsed.the_trap
      ? [parsed.the_trap]
      : [
          "Watch for tricky wording and hidden assumptions in the question statement.",
        ];

  return {
    core_concepts: parsed.core_concepts?.length
      ? parsed.core_concepts
      : ["Core Theory Analysis"],
    the_trap: traps,
    attack_plan: parsed.attack_plan?.length
      ? parsed.attack_plan
      : ["Formulate the given constraints.", "Calculate methodically."],
    extracted_question: combinedQuestionText,
    model_used: model,
    inference_mode: mode,
    latency_ms: latencyMs,
  };
}

/**
 * Generate a progressive Socratic hint without spoiling the answer.
 */
export async function generateSocraticHint(params: {
  question: string;
  existingHints?: string[];
}): Promise<HintResult> {
  const hintCount = (params.existingHints || []).length;
  const previousHintsContext = params.existingHints?.length
    ? `Previous hints already given (do NOT repeat these):\n${params.existingHints.map((h, i) => `${i + 1}. ${h}`).join("\n")}`
    : "This is the first hint.";

  const systemPrompt = `You are Gemmate, an empathetic Socratic study coach. 
Give ONE progressive, thought-provoking hint that guides the student forward without giving away the solution or final formula.
Keep it conversational, encouraging, and under 3 sentences. Hint Level: ${hintCount + 1}/3.`;

  const userPrompt = `Question:\n${params.question}\n\n${previousHintsContext}\n\nGive the next Socratic hint.`;

  const { text, model, mode, latencyMs } = await runGemma(
    userPrompt,
    systemPrompt,
    false,
  );

  return {
    hint: text.trim(),
    model_used: model,
    inference_mode: mode,
    latency_ms: latencyMs,
  };
}

/**
 * Generate a practice question targeting the same core concepts and traps.
 */
export async function generatePracticeQuestion(params: {
  coreConcepts?: string[];
  theTrap?: string[] | string;
}): Promise<PracticeResult> {
  const conceptsStr =
    (params.coreConcepts || []).join(", ") || "General Technical Analysis";
  const trapStr = Array.isArray(params.theTrap)
    ? params.theTrap.join("; ")
    : params.theTrap || "Subtle edge case";

  const systemPrompt = `You are Gemmate. Generate a brand new, original exam-style practice problem that tests the same core concepts and features a similar hidden trap.
Format clearly in Markdown with:
- ## Practice Question
- Description and given parameters
- Do NOT include the solution.`;

  const userPrompt = `Concepts to test: ${conceptsStr}\nTrap style: ${trapStr}\n\nGenerate the new practice problem in Markdown format.`;

  const { text, model, mode, latencyMs } = await runGemma(
    userPrompt,
    systemPrompt,
    false,
  );

  return {
    markdown: text.trim(),
    model_used: model,
    inference_mode: mode,
    latency_ms: latencyMs,
  };
}
