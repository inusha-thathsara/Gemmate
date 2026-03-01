import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const question: string = body.question ?? "";
        const existingHints: string[] = body.existing_hints ?? [];
        const hintNumber: number = (existingHints.length) + 1;

        if (!question) {
            return NextResponse.json({ error: "Provide a question." }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "GEMINI_API_KEY is not configured." }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction:
                "You are a Socratic tutor. Your job is to guide students with hints — never give away answers, solutions, formulas, or worked examples. Hints must be short (1-3 sentences max), thought-provoking questions or nudges that point the student in the right direction.",
        });

        const prevHintsSection = existingHints.length > 0
            ? `\n\nHints already given (do NOT repeat these ideas):\n${existingHints.map((h, i) => `${i + 1}. ${h}`).join("\n")}`
            : "";

        const prompt = `Here is the exam question a student is working on:\n\n${question}${prevHintsSection}\n\nProvide Hint #${hintNumber}. It must be progressively more specific than the previous hints, but still must NOT reveal the answer or solution steps. Return only the hint text — no labels, no preamble.`;

        const result = await model.generateContent(prompt);
        const hint = result.response.text().trim();

        return NextResponse.json({ hint });
    } catch (err: unknown) {
        console.error("[/api/hint] error:", err);
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
