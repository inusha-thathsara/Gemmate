"use client";

import NextImage from "next/image";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, ImagePlus, X, AlertCircle, Upload } from "lucide-react";

interface ImageEntry {
  id: string;
  url: string;
  base64: string;
  name: string;
}

interface ImageUploadProps {
  images?: ImageEntry[];
  onImagesChange: (entries: ImageEntry[]) => void;
}

const MAX_IMAGES = 3;

/** Compress + resize an image file before base64-encoding it.
 *  Max dimension: 1280 px. Quality: 75 %.
 *  A typical 10 MB phone photo → ~200-300 KB → 3 images stay well under
 *  Vercel's 4.5 MB serverless-function payload limit.
 */
function compressToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1280;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width >= height) {
          height = Math.round((height * MAX) / width);
          width = MAX;
        } else {
          width = Math.round((width * MAX) / height);
          height = MAX;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export type { ImageEntry };

export default function ImageUpload({
  images: controlledImages,
  onImagesChange,
}: ImageUploadProps) {
  const [internalImages, setInternalImages] = useState<ImageEntry[]>([]);
  const images =
    controlledImages !== undefined ? controlledImages : internalImages;

  const setImages = (newImages: ImageEntry[]) => {
    if (controlledImages === undefined) {
      setInternalImages(newImages);
    }
    onImagesChange(newImages);
  };

  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    const incoming = Array.from(files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (incoming.length === 0) {
      setError("Please select a valid image file (JPG, PNG, WEBP).");
      return;
    }
    if (images.length + incoming.length > MAX_IMAGES) {
      setError(`Max ${MAX_IMAGES} images allowed.`);
      return;
    }
    try {
      const newEntries: ImageEntry[] = await Promise.all(
        incoming.map(async (file) => ({
          id: crypto.randomUUID(),
          url: URL.createObjectURL(file),
          base64: await compressToBase64(file),
          name: file.name,
        })),
      );
      const updated = [...images, ...newEntries];
      setImages(updated);
    } catch {
      setError("Failed to process image. Please try again.");
    }
  };

  const removeImage = (id: string) => {
    const target = images.find((img) => img.id === id);
    if (target?.url) {
      URL.revokeObjectURL(target.url);
    }
    const updated = images.filter((img) => img.id !== id);
    setImages(updated);
    setError(null);
  };

  const canAdd = images.length < MAX_IMAGES;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <AnimatePresence>
        {canAdd && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />

            <motion.div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                handleFiles(e.dataTransfer.files);
              }}
              animate={{
                borderColor: dragging ? "#4f8eff" : "#253d6b",
                background: dragging
                  ? "rgba(79,142,255,0.06)"
                  : "rgba(13,19,35,0.8)",
              }}
              style={{
                border: "2px dashed var(--border-bright)",
                borderRadius: 18,
                padding: "32px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 14,
                cursor: "pointer",
                transition: "all 0.2s ease",
                position: "relative",
                overflow: "hidden",
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {/* ambient blob inside dropzone */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%,-50%)",
                  width: 200,
                  height: 200,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(79,142,255,0.07) 0%, transparent 70%)",
                  pointerEvents: "none",
                }}
              />

              <motion.div
                animate={{ y: dragging ? -4 : 0 }}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background:
                    "linear-gradient(135deg,rgba(79,142,255,0.2),rgba(167,139,250,0.2))",
                  border: "1px solid rgba(79,142,255,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Upload size={24} color="#4f8eff" />
              </motion.div>

              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    color: "var(--text-1)",
                    fontWeight: 700,
                    fontSize: 15,
                    marginBottom: 4,
                  }}
                >
                  Drop images here or browse
                </p>
                <p style={{ color: "var(--text-3)", fontSize: 12.5 }}>
                  Up to {MAX_IMAGES} images · JPG, PNG, WEBP
                </p>
              </div>

              <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                  aria-label="Choose images from gallery"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "10px 18px",
                    borderRadius: 12,
                    background: "rgba(79,142,255,0.12)",
                    border: "1px solid rgba(79,142,255,0.3)",
                    color: "#4f8eff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <ImagePlus size={15} /> Gallery
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => cameraInputRef.current?.click()}
                  type="button"
                  aria-label="Take a photo with camera"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "10px 18px",
                    borderRadius: 12,
                    background: "rgba(167,139,250,0.12)",
                    border: "1px solid rgba(167,139,250,0.3)",
                    color: "#a78bfa",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <Camera size={15} /> Camera
                </motion.button>
              </div>

              {/* slot indicators */}
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 28,
                      height: 4,
                      borderRadius: 4,
                      background:
                        i < images.length ? "#4f8eff" : "var(--border)",
                      transition: "background 0.3s",
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              borderRadius: 10,
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.25)",
              color: "var(--red)",
              fontSize: 13,
              overflow: "hidden",
            }}
          >
            <AlertCircle size={14} />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thumbnails */}
      <AnimatePresence>
        {images.length > 0 && (
          <motion.div
            layout
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 10,
            }}
          >
            {images.map((img) => (
              <motion.div
                key={img.id}
                layout
                initial={{ opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.75 }}
                transition={{ type: "spring", stiffness: 320, damping: 26 }}
                style={{
                  position: "relative",
                  aspectRatio: "1",
                  borderRadius: 16,
                  overflow: "hidden",
                }}
              >
                <NextImage
                  src={img.url}
                  alt={img.name}
                  fill
                  sizes="(max-width: 520px) 30vw, 160px"
                  unoptimized
                  style={{ objectFit: "cover" }}
                />
                {/* Always-visible dark gradient at the bottom */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 16,
                    background:
                      "linear-gradient(to top, rgba(5,7,15,0.55) 0%, transparent 55%)",
                    pointerEvents: "none",
                  }}
                />
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => removeImage(img.id)}
                  type="button"
                  aria-label={`Remove ${img.name}`}
                  style={{
                    position: "absolute",
                    top: 7,
                    right: 7,
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(10,15,30,0.75)",
                    backdropFilter: "blur(6px)",
                    WebkitBackdropFilter: "blur(6px)",
                    border: "1px solid rgba(248,113,113,0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#f87171",
                    cursor: "pointer",
                  }}
                >
                  <X size={13} />
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
