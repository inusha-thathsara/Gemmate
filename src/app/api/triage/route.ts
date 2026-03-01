import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a senior IT undergrad tutoring a batchmate. Analyze the provided exam question images. DO NOT solve the question. Identify ALL traps and tricks present — there may be more than one. Output strictly in JSON format matching this exact schema: {"core_concepts": ["concept 1"], "the_trap": ["The first trick in the question", "Another trick if present"], "attack_plan": ["step 1", "step 2", "step 3"]}.`;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const images: string[] = body.images; // array of base64 data URLs

        if (!images || !Array.isArray(images) || images.length === 0) {
            return NextResponse.json(
                { error: "Provide at least one image." },
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
            generationConfig: {
                // @ts-ignore — responseMimeType is supported but not yet typed in current SDK version
                responseMimeType: "application/json",
            },
            systemInstruction: SYSTEM_PROMPT,
        });

        // Build inline image parts from base64 data URLs
        const imageParts = images.map((dataUrl) => {
            // dataUrl format: "data:<mimeType>;base64,<data>"
            const [meta, data] = dataUrl.split(",");
            const mimeType = meta.replace("data:", "").replace(";base64", "");
            return {
                inlineData: {
                    mimeType,
                    data,
                },
            };
        });

        const result = await model.generateContent([
            ...imageParts,
            { text: "Analyse these exam question images and respond in the required JSON format." },
        ]);

        const text = result.response.text();
        const parsed = JSON.parse(text);

        return NextResponse.json(parsed);
    } catch (err: unknown) {
        console.error("[/api/triage] error:", err);
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
