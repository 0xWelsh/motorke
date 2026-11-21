"use client";

import { useState } from "react";
import { humanizeError, humanizeApiError } from "@/lib/humanize-error";

function fmtPrice(price) {
  if (!price || price === 0) return "Contact for price";
  return `KES ${Number(price).toLocaleString("en-KE")}`;
}

function proxyUrl(url) {
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load image: ${src.slice(0, 120)}`));
    img.src = src;
  });
}

function drawCover(ctx, img, w, h) {
  const iar = img.width / img.height;
  const tar = w / h;
  let sx, sy, sw, sh;
  if (iar > tar) {
    sh = img.height;
    sw = img.height * tar;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = img.width / tar;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
}

function drawSlide(ctx, img, car, index, total) {
  const W = 1080, H = 1920;
  drawCover(ctx, img, W, H);

  const grad = ctx.createLinearGradient(0, H * 0.6, 0, H);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.85)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, H * 0.6, W, H * 0.4);

  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.font = "bold 40px sans-serif";
  ctx.fillText("BIDGARI", 50, 90);

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.font = "20px sans-serif";
  ctx.fillText(`${index + 1} / ${total}`, 50, 125);

  ctx.textBaseline = "bottom";
  let y = H - 240;
  ctx.fillStyle = "#fff";
  ctx.font = "bold 64px sans-serif";
  ctx.fillText(`${car.year} ${car.make} ${car.model}`, 60, y);

  y -= 90;
  ctx.font = "bold 52px sans-serif";
  ctx.fillStyle = "#22c55e";
  ctx.fillText(fmtPrice(car.price), 60, y);

  y -= 75;
  ctx.font = "32px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  const specs = [
    car.mileage ? `${Number(car.mileage).toLocaleString("en-KE")} km` : null,
    car.fuelType, car.transmission, car.bodyType,
  ].filter(Boolean).join(" \xb7 ");
  ctx.fillText(specs, 60, y);
  ctx.textBaseline = "alphabetic";
}

function drawFinalSlide(ctx, car) {
  const W = 1080, H = 1920;
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#222222");
  bg.addColorStop(0.5, "#141414");
  bg.addColorStop(1, "#222222");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.font = "bold 36px sans-serif";
  ctx.fillText("BIDGARI", 50, 90);

  ctx.textAlign = "center";
  let y = 320;
  ctx.fillStyle = "#fff";
  ctx.font = "bold 56px sans-serif";
  ctx.fillText("NOW AVAILABLE", W / 2, y); y += 120;

  ctx.font = "bold 80px sans-serif";
  ctx.fillStyle = "#22c55e";
  ctx.fillText(fmtPrice(car.price), W / 2, y); y += 120;

  ctx.font = "48px sans-serif";
  ctx.fillStyle = "#fff";
  ctx.fillText(`${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""}`, W / 2, y); y += 100;

  ctx.font = "32px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  const specs = [
    ["Mileage", car.mileage ? `${Number(car.mileage).toLocaleString("en-KE")} km` : "\u2014"],
    ["Fuel", car.fuelType || "\u2014"],
    ["Transmission", car.transmission || "\u2014"],
    ["Body", car.bodyType || "\u2014"],
    ["Doors", car.doors ? String(car.doors) : "\u2014"],
    ["Seats", car.seats ? String(car.seats) : "\u2014"],
    ["Engine", car.engineCC ? `${car.engineCC} cc` : "\u2014"],
    ["Color", car.color || "\u2014"],
    ["Location", car.location || "Nairobi"],
  ];
  const leftCol = W / 2 - 260;
  for (const [label, value] of specs) {
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillText(label, leftCol, y);
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(value, leftCol + 20, y);
    y += 56;
  }

  y += 40;
  if (car.features?.length > 0) {
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.textAlign = "center";
    ctx.font = "28px sans-serif";
    ctx.fillText("FEATURES", W / 2, y); y += 50;
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "26px sans-serif";
    ctx.fillText(car.features.slice(0, 6).join(" \xb7 "), W / 2, y); y += 70;
  }

  y = Math.max(y, 1550);
  ctx.fillStyle = "#22c55e";
  ctx.font = "bold 34px sans-serif";
  ctx.fillText("DM to Inquire", W / 2, y); y += 60;
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.font = "24px sans-serif";
  ctx.fillText("bidgari.co.ke", W / 2, y); y += 50;
  ctx.fillStyle = "rgba(255,255,255,0.07)";
  ctx.font = "18px sans-serif";
  ctx.fillText("BIDGARI", W / 2, y);
  ctx.textAlign = "start";
}

function makeCaption(car) {
  const lines = [
    `\u{1F697} ${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""}`,
    `\u{1F4B0} ${fmtPrice(car.price)}`,
  ];
  if (car.mileage) lines.push(`\u{1F4CF} ${Number(car.mileage).toLocaleString("en-KE")} km`);
  if (car.fuelType) lines.push(`\u26FD ${car.fuelType}`);
  if (car.transmission) lines.push(`\u2699\uFE0F ${car.transmission}`);
  if (car.bodyType) lines.push(`\u{1F699} ${car.bodyType}`);
  lines.push(`\u{1F4CD} ${car.location || "Nairobi"}`);
  lines.push("");
  if (car.description) {
    lines.push(car.description.slice(0, 200) + (car.description.length > 200 ? "..." : ""));
    lines.push("");
  }
  lines.push("\u{1F447} DM or call for more details");
  lines.push("");
  const tags = ["BIDGARI", "CarsKE", "Nairobi", "Kenya", "CarDealer", car.make, car.model.replace(/\s+/g, "")];
  lines.push(tags.map((t) => `#${t}`).join(" "));
  return lines.join("\n");
}

async function recordVideo(canvas, ctx, imageUrls, car, setProgress) {
  const totalSlides = imageUrls.length + 1;
  const DURATION_MS = 4000;

  const imgs = [];
  for (let i = 0; i < imageUrls.length; i++) {
    setProgress(`Loading image ${i + 1} of ${imageUrls.length}...`);
    imgs.push(await loadImage(proxyUrl(imageUrls[i])));
  }

  setProgress("Recording video (real-time, please wait)...");
  const stream = canvas.captureStream(30);
  const chunks = [];
  const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm";
  const recorder = new MediaRecorder(stream, { mimeType: mime });

  return new Promise((resolve, reject) => {
    recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${car.make}-${car.model}-${car.year}-bidgari.webm`.replace(/[/\\?%*:|"<>]/g, "");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      resolve();
    };
    recorder.onerror = reject;

    recorder.start();
    let idx = 0;
    function next() {
      if (idx >= totalSlides) { recorder.stop(); return; }
      if (idx < imageUrls.length) drawSlide(ctx, imgs[idx], car, idx, imageUrls.length);
      else drawFinalSlide(ctx, car);
      setProgress(`Recording slide ${idx + 1} of ${totalSlides}...`);
      idx++;
      setTimeout(next, DURATION_MS);
    }
    next();
  });
}

export default function TikTokVideoButton({ car, className, compact }) {
  const [state, setState] = useState("idle");
  const [progress, setProgress] = useState("");

  const handleGenerate = async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");

    try {
      setState("loading");
      setProgress("Preparing...");
      if (!car || !car.images?.length) throw new Error("No images for this car");

      const imageUrls = car.images.map((i) => i.url);
      await recordVideo(canvas, ctx, imageUrls, car, setProgress);

      try { await navigator.clipboard.writeText(makeCaption(car)); } catch {}
      setState("done");
      setProgress("Done! Video downloaded & caption copied");
      setTimeout(() => { setState("idle"); setProgress(""); }, 4000);
    } catch (err) {
      console.error("TikTok video failed:", err);
      setState("error");
      setProgress(humanizeError(err, "Something went wrong — check the console for details."));
      setTimeout(() => { setState("idle"); setProgress(""); }, 8000);
    }
  };

  return (
    <>
      <button
        onClick={handleGenerate}
        disabled={state === "loading"}
        className={
          className ||
          (compact
            ? "inline-flex items-center gap-1 rounded-md border border-border bg-[var(--bg)]/60 p-1.5 text-pink-400 hover:bg-pink-600 hover:text-white hover:border-pink-600 transition-colors disabled:opacity-50"
            : "inline-flex items-center gap-1.5 rounded-md border border-border bg-[var(--bg)]/60 px-2.5 py-1.5 text-[11px] font-bold text-pink-400 hover:bg-pink-600 hover:text-white hover:border-pink-600 transition-colors disabled:opacity-50")
        }
        title="Create TikTok video"
      >
        {state === "loading" ? (
          <>
            <span className="w-3.5 h-3.5 rounded-full border-2 border-pink-400 border-t-transparent animate-spin shrink-0" />
            {!compact && "TikTok"}
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.9 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.88-2.89c.32 0 .63.06.92.15V8.78a6.35 6.35 0 0 0-3.76 1.16 6.35 6.35 0 0 0-2.59 5.12 6.35 6.35 0 0 0 6.35 6.34 6.35 6.35 0 0 0 6.35-6.34c0-.29-.02-.58-.06-.86V9.87a8.17 8.17 0 0 0 4.89 1.58v-3.5a4.83 4.83 0 0 1-3.77-4.25h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.9 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.88-2.89c.32 0 .63.06.92.15V8.78" />
            </svg>
            {!compact && "TikTok"}
          </>
        )}
      </button>

      {state !== "idle" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="mx-4 w-full max-w-sm rounded-xl border border-border bg-[var(--bg)] p-6 text-center shadow-2xl">
            {state === "loading" && (
              <div className="flex flex-col items-center gap-4">
                <span className="w-8 h-8 rounded-full border-2 border-pink-400 border-t-transparent animate-spin" />
                <p className="text-sm text-secondary">{progress}</p>
                {progress.includes("Recording") && (
                  <p className="text-[11px] text-muted">Recording in real-time. This waits for the full video duration.</p>
                )}
              </div>
            )}
            {state === "done" && (
              <div className="flex flex-col items-center gap-3">
                <span className="text-3xl">{'\u2705'}</span>
                <p className="text-sm text-secondary">{progress}</p>
              </div>
            )}
            {state === "error" && (
              <div className="flex flex-col items-center gap-3">
                <span className="text-3xl">{'\u274C'}</span>
                <p className="text-sm text-red-600">{progress}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
