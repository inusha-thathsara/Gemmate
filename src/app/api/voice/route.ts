import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Simple in-memory cache to save ElevenLabs character quota on re-plays
const audioCache = new Map<string, Buffer>();

function getElevenLabsApiKey(): string {
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      const match = content.match(/^ELEVENLABS_API_KEY=(.*)$/m);
      if (match && match[1].trim()) {
        return match[1].trim();
      }
    }
  } catch {}
  return process.env.ELEVENLABS_API_KEY || "";
}

function getElevenLabsVoiceId(): string {
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      const match = content.match(/^ELEVENLABS_VOICE_ID=(.*)$/m);
      if (match && match[1].trim()) {
        return match[1].trim();
      }
    }
  } catch {}
  return process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // Default: Rachel
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawText = (body.text || "").trim();
    const voiceId = body.voiceId || getElevenLabsVoiceId();

    if (!rawText) {
      return NextResponse.json(
        { error: "Text is required for voice generation." },
        { status: 400 },
      );
    }

    const apiKey = getElevenLabsApiKey();
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "ELEVENLABS_API_KEY is not configured.",
          fallbackToBrowserSpeech: true,
        },
        { status: 503 },
      );
    }

    // Clean text of markdown characters for natural speech
    const cleanText = rawText
      .replace(/```[\s\S]*?```/g, "Code omitted for speech.")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/[#*_~>]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();

    // Cache key
    const cacheKey = `${voiceId}_${cleanText}`;
    if (audioCache.has(cacheKey)) {
      const cached = audioCache.get(cacheKey)!;
      return new NextResponse(new Uint8Array(cached), {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=86400, immutable",
          "X-Voice-Source": "cache",
        },
      });
    }

    // Request to ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.1,
            use_speaker_boost: true,
          },
        }),
      },
    );

    if (!response.ok) {
      const errDetail = await response.text();
      console.error("[ElevenLabs API Error]:", response.status, errDetail);
      return NextResponse.json(
        {
          error: `ElevenLabs returned ${response.status}`,
          fallbackToBrowserSpeech: true,
          detail: errDetail,
        },
        { status: 502 },
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save in cache
    if (audioCache.size > 50) {
      // Clear oldest entries if cache grows
      const firstKey = audioCache.keys().next().value;
      if (firstKey) audioCache.delete(firstKey);
    }
    audioCache.set(cacheKey, buffer);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
        "X-Voice-Source": "elevenlabs-generated",
      },
    });
  } catch (err: unknown) {
    console.error("[/api/voice Error]:", err);
    return NextResponse.json(
      {
        error: "Failed to generate audio speech.",
        fallbackToBrowserSpeech: true,
      },
      { status: 500 },
    );
  }
}
