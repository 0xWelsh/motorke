"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { absoluteMediaUrl } from "@/lib/site-url";
import { formatCarPrice } from "@/lib/utils";
import { Download, Loader2, Palette } from "lucide-react";

const TEMPLATES = [
  { id: "clean", label: "Clean", accent: "#2563eb", bg: "#0f172a", textPrimary: "#ffffff", textSecondary: "#94a3b8" },
  { id: "energetic", label: "Energetic", accent: "#ef4444", bg: "#18181b", textPrimary: "#ffffff", textSecondary: "#fbbf24" },
  { id: "luxury", label: "Luxury", accent: "#d4af37", bg: "#0a0a0a", textPrimary: "#f5f5f5", textSecondary: "#a3a3a3" },
  { id: "minimal", label: "Minimal", accent: "#ffffff", bg: "#ffffff", textPrimary: "#171717", textSecondary: "#737373" },
];

const SIZES = [
  { id: "reels", label: "Reels / TikTok", w: 1080, h: 1920 },
  { id: "square", label: "IG Square", w: 1080, h: 1080 },
  { id: "story", label: "Story", w: 1080, h: 1920 },
];

const FPS = 30;
const SLIDE_SECONDS = 2.5;

export default function ContentCreatorClient({ cars = [] }) {
  const [selectedCar, setSelectedCar] = useState(null);
  const [template, setTemplate] = useState(TEMPLATES[0]);
  const [size, setSize] = useState(SIZES[0]);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const imgCacheRef = useRef({});

  const filteredCars = cars.filter((car) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return `${car.make} ${car.model} ${car.year} ${car.variant || ""}`.toLowerCase().includes(q);
  });

  const images = (selectedCar?.images || [])
    .map((img) => absoluteMediaUrl(img.url))
    .filter(Boolean);

  const drawFrame = useCallback((ctx, w, h, elapsed, car, tmpl) => {
    const photos = images.length > 0 ? images : ["/placeholder-car.jpg"];
    const totalDur = photos.length * SLIDE_SECONDS;
    const loopTime = elapsed % (totalDur + 1);

    ctx.fillStyle = tmpl.bg;
    ctx.fillRect(0, 0, w, h);

    const slideIndex = Math.min(Math.floor(loopTime / SLIDE_SECONDS), photos.length - 1);
    const slideProgress = (loopTime % SLIDE_SECONDS) / SLIDE_SECONDS;
    const scale = 1.0 + slideProgress * 0.12;

    const photoUrl = photos[slideIndex];
    if (!imgCacheRef.current[photoUrl]) {
      const preload = new window.Image();
      preload.crossOrigin = "anonymous";
      preload.src = photoUrl;
      imgCacheRef.current[photoUrl] = preload;
    }
    const cached = imgCacheRef.current[photoUrl];
    if (cached.complete && cached.naturalWidth) {
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(scale, scale);
      ctx.translate(-w / 2, -h / 2);
      const imgRatio = cached.naturalWidth / cached.naturalHeight;
      const canvasRatio = w / h;
      let dw, dh, dx, dy;
      if (imgRatio > canvasRatio) {
        dh = h;
        dw = h * imgRatio;
        dx = (w - dw) / 2;
        dy = 0;
      } else {
        dw = w;
        dh = w / imgRatio;
        dx = 0;
        dy = (h - dh) / 2;
      }
      ctx.drawImage(cached, dx, dy, dw, dh);
      ctx.restore();
    }

    if (tmpl.id !== "minimal") {
      const grad = ctx.createLinearGradient(0, h * 0.55, 0, h);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(0.4, "rgba(0,0,0,0.5)");
      grad.addColorStop(1, "rgba(0,0,0,0.85)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    if (car) {
      const bottomPad = h * 0.08;
      const textX = w * 0.06;

      ctx.fillStyle = tmpl.textSecondary;
      ctx.font = `bold ${Math.round(w * 0.032)}px -apple-system, system-ui, sans-serif`;
      ctx.textBaseline = "bottom";
      ctx.fillText(`${car.year} ${car.make}`.toUpperCase(), textX, h - bottomPad - w * 0.18);

      ctx.fillStyle = tmpl.textPrimary;
      ctx.font = `900 ${Math.round(w * 0.065)}px -apple-system, system-ui, sans-serif`;
      ctx.fillText(car.model + (car.variant ? ` ${car.variant}` : ""), textX, h - bottomPad - w * 0.08);

      ctx.fillStyle = tmpl.accent;
      ctx.font = `800 ${Math.round(w * 0.045)}px -apple-system, system-ui, sans-serif`;
      ctx.fillText(formatCarPrice(car), textX, h - bottomPad + w * 0.02);

      ctx.fillStyle = tmpl.textSecondary;
      ctx.font = `600 ${Math.round(w * 0.026)}px -apple-system, system-ui, sans-serif`;
      ctx.fillText("DM to buy \u00b7 Link in bio", textX, h - bottomPad + w * 0.065);

      ctx.fillStyle = tmpl.id === "minimal" ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.5)";
      ctx.font = `900 ${Math.round(w * 0.028)}px -apple-system, system-ui, sans-serif`;
      ctx.textBaseline = "top";
      ctx.fillText("BIDGARI", textX, h * 0.04);
    }

    if (photos.length > 1) {
      const dotR = w * 0.008;
      const gap = dotR * 3;
      const dotsW = photos.length * (dotR * 2 + gap) - gap;
      const dotsX = (w - dotsW) / 2;
      const dotsY = h * 0.92;
      for (let i = 0; i < photos.length; i++) {
        ctx.beginPath();
        ctx.arc(dotsX + i * (dotR * 2 + gap) + dotR, dotsY, dotR, 0, Math.PI * 2);
        ctx.fillStyle = i === slideIndex
          ? (tmpl.id === "minimal" ? "#171717" : "#ffffff")
          : (tmpl.id === "minimal" ? "#d4d4d4" : "rgba(255,255,255,0.3)");
        ctx.fill();
      }
    }
  }, [images, selectedCar]);

  useEffect(() => {
    imgCacheRef.current = {};
    images.forEach((url) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      imgCacheRef.current[url] = img;
    });
  }, [images]);

  useEffect(() => {
    if (!selectedCar || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = size.w;
    canvas.height = size.h;
    const start = performance.now();

    function animate(now) {
      const elapsed = (now - start) / 1000;
      drawFrame(ctx, size.w, size.h, elapsed, selectedCar, template);
      animRef.current = requestAnimationFrame(animate);
    }
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [selectedCar, template, size, drawFrame]);

  async function handleDownload() {
    if (!canvasRef.current || !selectedCar) return;
    setGenerating(true);
    recordedChunksRef.current = [];

    try {
      const stream = canvasRef.current.captureStream(FPS);
      const recorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
        videoBitsPerSecond: 5_000_000,
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      const totalDuration = (images.length || 1) * SLIDE_SECONDS + 1;
      recorder.start();
      await new Promise((resolve) => setTimeout(resolve, totalDuration * 1000));
      recorder.stop();
      await new Promise((resolve) => { recorder.onstop = resolve; });

      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bidgari-${selectedCar.make}-${selectedCar.model}-${template.id}-${size.id}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Video generation failed:", err);
      alert("Video generation failed. Try a different browser (Chrome recommended).");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="bg-surface rounded-xl border border-border p-5">
        <h2 className="text-sm font-bold text-text mb-3">1. Pick a car</h2>
        <input
          type="text"
          placeholder="Search make, model, year..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 px-4 border border-border rounded-lg text-sm mb-3 focus:border-[var(--accent)] outline-none"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto">
          {filteredCars.map((car) => {
            const img = car.images?.[0]?.url;
            const isSelected = selectedCar?.id === car.id;
            return (
              <button
                key={car.id}
                type="button"
                onClick={() => setSelectedCar(car)}
                className={`text-left rounded-lg border p-2 transition-all ${
                  isSelected
                    ? "border-[var(--accent)] bg-[var(--accent)]/5 ring-1 ring-[var(--accent)]"
                    : "border-border hover:border-border"
                }`}
              >
                <div className="relative aspect-[16/10] bg-surface-overlay rounded overflow-hidden mb-1.5">
                  {img ? (
                    <Image
                      src={absoluteMediaUrl(img)}
                      alt={`${car.year} ${car.make} ${car.model}`}
                      fill
                      className="object-cover"
                      sizes="150px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-ghost text-xs">No photo</div>
                  )}
                </div>
                <p className="text-[10px] font-bold text-dim uppercase">{car.make}</p>
                <p className="text-xs font-bold text-text truncate">{car.model}</p>
                <p className="text-[10px] text-muted">{car.year} \u00b7 {formatCarPrice(car)}</p>
              </button>
            );
          })}
          {filteredCars.length === 0 && (
            <p className="col-span-full text-center text-sm text-dim py-8">No cars match your search.</p>
          )}
        </div>
      </section>

      <section className="bg-surface rounded-xl border border-border p-5">
        <h2 className="text-sm font-bold text-text mb-3">2. Style</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTemplate(t)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                template.id === t.id
                  ? "border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)]"
                  : "border-border text-muted hover:border-border"
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              {t.label}
              <span className="w-3 h-3 rounded-full border border-border" style={{ background: t.accent }} />
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSize(s)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                size.id === s.id
                  ? "border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)]"
                  : "border-border text-muted hover:border-border"
              }`}
            >
              {s.label} ({s.w}x{s.h})
            </button>
          ))}
        </div>
      </section>

      <section className="bg-surface rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-text">3. Preview & Download</h2>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!selectedCar || generating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-text text-sm font-bold disabled:opacity-40 hover:brightness-110 transition-all"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {generating ? "Generating..." : "Download Video"}
          </button>
        </div>
        {selectedCar ? (
          <div className="flex justify-center">
            <div className="relative rounded-xl overflow-hidden shadow-lg border border-border" style={{ maxWidth: size.w / 2, maxHeight: size.h / 2 }}>
              <canvas
                ref={canvasRef}
                width={size.w}
                height={size.h}
                style={{ width: "100%", height: "auto" }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-sm text-dim">
            Select a car above to see preview
          </div>
        )}
        {selectedCar && (
          <p className="text-center text-xs text-dim mt-3">
            Preview plays in a loop. Click &quot;Download Video&quot; to export as {size.w}x{size.h} WebM.
          </p>
        )}
      </section>
    </div>
  );
}
