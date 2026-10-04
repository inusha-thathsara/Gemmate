"use client";

import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, Loader2, Sparkles } from "lucide-react";

interface VoiceButtonProps {
  text: string;
  label?: string;
  compact?: boolean;
  accentColor?: string;
}

export default function VoiceButton({
  text,
  label = "Listen",
  compact = false,
  accentColor = "#34d399",
}: VoiceButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sourceType, setSourceType] = useState<"elevenlabs" | "browser" | null>(
    null,
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  const handlePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isPlaying) {
      handleStop();
      return;
    }

    // If we already have audio loaded, replay it immediately
    if (audioRef.current && audioUrlRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.fallbackToBrowserSpeech) {
          playBrowserFallback();
          return;
        }
        throw new Error("Voice API returned " + res.status);
      }

      const contentType = res.headers.get("Content-Type") || "";
      if (contentType.includes("application/json")) {
        const json = await res.json();
        if (json.fallbackToBrowserSpeech) {
          playBrowserFallback();
          return;
        }
      }

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      audioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setSourceType("elevenlabs");

      audio.onended = () => {
        setIsPlaying(false);
      };

      audio.onerror = () => {
        setIsPlaying(false);
        playBrowserFallback();
      };

      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      console.warn(
        "[VoiceButton] ElevenLabs request failed, falling back to Web Speech:",
        err,
      );
      playBrowserFallback();
    } finally {
      setIsLoading(false);
    }
  };

  const playBrowserFallback = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsLoading(false);
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();

    // Clean text
    const clean = text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/[#*_~>]/g, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    setSourceType("browser");
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handlePlay}
        disabled={isLoading}
        title={isPlaying ? "Stop audio" : "Listen with ElevenLabs voice coach"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          borderRadius: 8,
          border: `1px solid ${isPlaying ? accentColor : "var(--border)"}`,
          background: isPlaying
            ? "rgba(52,211,153,0.15)"
            : "var(--surface-hover)",
          color: isPlaying ? accentColor : "var(--text-muted)",
          cursor: isLoading ? "wait" : "pointer",
          transition: "all 0.2s ease",
          padding: 0,
        }}
      >
        {isLoading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : isPlaying ? (
          <VolumeX size={15} style={{ color: accentColor }} />
        ) : (
          <Volume2 size={15} />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handlePlay}
      disabled={isLoading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 13px",
        borderRadius: 999,
        fontSize: "0.78rem",
        fontWeight: 600,
        letterSpacing: "0.02em",
        border: `1px solid ${isPlaying ? accentColor : "rgba(255,255,255,0.12)"}`,
        background: isPlaying
          ? `linear-gradient(135deg, ${accentColor}22, ${accentColor}11)`
          : "rgba(255,255,255,0.04)",
        color: isPlaying ? accentColor : "var(--text-secondary)",
        cursor: isLoading ? "wait" : "pointer",
        transition: "all 0.2s ease",
      }}
    >
      {isLoading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : isPlaying ? (
        <VolumeX size={14} style={{ color: accentColor }} />
      ) : (
        <Volume2 size={14} />
      )}

      <span>{isPlaying ? "Stop Voice" : label}</span>

      {isPlaying && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 2,
            marginLeft: 2,
          }}
        >
          <span
            className="audio-bar"
            style={{
              width: 2.5,
              height: 10,
              backgroundColor: accentColor,
              borderRadius: 2,
              animation: "wave 0.8s ease-in-out infinite",
            }}
          />
          <span
            className="audio-bar"
            style={{
              width: 2.5,
              height: 14,
              backgroundColor: accentColor,
              borderRadius: 2,
              animation: "wave 0.8s ease-in-out infinite 0.2s",
            }}
          />
          <span
            className="audio-bar"
            style={{
              width: 2.5,
              height: 8,
              backgroundColor: accentColor,
              borderRadius: 2,
              animation: "wave 0.8s ease-in-out infinite 0.4s",
            }}
          />
        </span>
      )}

      {sourceType === "elevenlabs" && !isPlaying && (
        <Sparkles size={11} style={{ opacity: 0.6 }} />
      )}
    </button>
  );
}
