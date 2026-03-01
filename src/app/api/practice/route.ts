import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const coreConcepts: string[] = body.core_concepts ?? [];
        const theTrap: string[] = Array.isArray(body.the_trap)
            ? body.the_trap
            : body.the_trap ? [body.the_trap] : [];

        if (!coreConcepts.length && !theTrap.length) {
            return NextResponse.json(
                { error: "Provide core_concepts and/or the_trap." },
                { status: 400 }
            );
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not configured." },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction:
                "You are a university examiner known for writing deceptively tricky, highly challenging exam questions. You must return ONLY the question in clean Markdown — no preamble, no explanations, no answers.",
        });

        const trapText = theTrap.length === 1
            ? `And this specific trick/trap: ${theTrap[0]}`
            : `And these specific tricks/traps:\n${theTrap.map((t, i) => `${i + 1}. ${t}`).join("\n")}`;
        const prompt = `Based on these core concepts: ${coreConcepts.join(", ")}
${trapText}

Generate a brand new, highly difficult university-level exam question. Return the response in clean Markdown.`;

        const result = await model.generateContent(prompt);
        const markdown = result.response.text();

        return NextResponse.json({ markdown });
    } catch (err: unknown) {
        console.error("[/api/practice] error:", err);
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
