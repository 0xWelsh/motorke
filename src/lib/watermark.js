import sharp from "sharp";

const WATERMARK_TEXT = process.env.LISTING_WATERMARK_TEXT || "MOTORKE";
const WATERMARK_ENABLED = process.env.LISTING_WATERMARK_ENABLED !== "false";

function escapeXml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildWatermarkSvg(width, height, text) {
  const shortestSide = Math.min(width, height);
  const fontSize = Math.max(16, Math.round(shortestSide * 0.042));
  const padding = Math.max(10, Math.round(shortestSide * 0.025));
  const strokeWidth = Math.max(1, Math.round(fontSize * 0.08));

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <text
        x="${width - padding}"
        y="${height - padding}"
        text-anchor="end"
        font-family="Inter, Arial, sans-serif"
        font-size="${fontSize}"
        font-weight="700"
        letter-spacing="1"
        fill="rgba(255,255,255,0.24)"
        stroke="rgba(0,0,0,0.28)"
        stroke-width="${strokeWidth}"
      >${escapeXml(text)}</text>
    </svg>`
  );
}

export async function applyListingWatermark(buffer, mimeType) {
  if (!WATERMARK_ENABLED) return buffer;

  const image = sharp(buffer, { failOn: "none" });
  const meta = await image.metadata();
  const width = meta.width || 0;
  const height = meta.height || 0;

  if (!width || !height) return buffer;

  const overlay = buildWatermarkSvg(width, height, WATERMARK_TEXT);
  const processed = image.composite([{ input: overlay, left: 0, top: 0 }]);

  if (mimeType === "image/png") {
    return processed.png({ compressionLevel: 9 }).toBuffer();
  }

  if (mimeType === "image/webp") {
    return processed.webp({ quality: 90 }).toBuffer();
  }

  return processed.jpeg({ quality: 88, mozjpeg: true }).toBuffer();
}
