const { Client, LocalAuth } = require("whatsapp-web.js");
const http = require("http");
const { URL } = require("url");
const QRCode = require("qrcode");

const PORT = parseInt(process.env.WHATSAPP_DAEMON_PORT || "3006", 10);
const WEBHOOK_URL = process.env.WHATSAPP_DAEMON_WEBHOOK || "http://localhost:3000/api/whatsapp-bot/webhook";
const CHROMIUM_PATH = process.env.CHROMIUM_PATH || "/usr/sbin/chromium";

let client = null;
let qrBuffer = null;
let status = "DISCONNECTED";

function createClient() {
  try { if (client) client.destroy(); } catch {}
  client = new Client({
    authStrategy: new LocalAuth({ dataPath: "./waha-sessions/wwjs" }),
    puppeteer: {
      executablePath: CHROMIUM_PATH,
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--single-process",
        "--disable-features=VizDisplayCompositor",
        "--disable-software-rasterizer",
        "--disable-blink-features=AutomationControlled",
      ],
      ignoreDefaultArgs: ["--enable-automation"],
    },
    useStealth: true,
  });

  client.on("qr", async (qr) => {
    try {
      qrBuffer = await QRCode.toBuffer(qr, { type: "png", width: 300, margin: 2 });
    } catch (e) {
      console.error("[Daemon] QR generate error:", e.message);
    }
    status = "QR";
    console.log("[Daemon] QR code received");
  });

  client.on("ready", () => {
    status = "CONNECTED";
    qrBuffer = null;
    const me = client.info?.wid?.user || null;
    console.log("[Daemon] Connected. Phone:", me);
  });

  client.on("disconnected", (reason) => {
    status = "DISCONNECTED";
    console.log("[Daemon] Disconnected:", reason);
    setTimeout(createClient, 5000);
  });

  client.on("message", async (msg) => {
    try {
      const payload = {
        event: "message",
        payload: {
          from: msg.from,
          type: msg.type,
          body: msg.body,
          timestamp: msg.timestamp,
        },
      };
      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.error("[Daemon] Webhook error:", e.message);
    }
  });

  client.initialize().catch((err) => {
    console.error("[Daemon] Init error:", err.message);
    status = "FAILED";
    setTimeout(createClient, 5000);
  });
}

function json(res, data, code = 200) {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const path = url.pathname;

    if (path === "/api/qr" && req.method === "GET") {
      if (qrBuffer) {
        res.writeHead(200, {
          "Content-Type": "image/png",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        });
        res.end(qrBuffer);
      } else {
        res.writeHead(404);
        res.end("No QR available");
      }
      return;
    }

    if (path === "/api/status" && req.method === "GET") {
      const info = client?.info;
      json(res, {
        status,
        me: info ? { id: info.wid?.user, pushName: info.pushname } : null,
      });
      return;
    }

    if (path === "/api/send-text" && req.method === "POST") {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", async () => {
        try {
          const { chatId, text } = JSON.parse(body);
          if (!chatId || !text) return json(res, { error: "chatId and text required" }, 400);
          if (!client || status !== "CONNECTED") return json(res, { error: "not ready" }, 503);
          await client.sendMessage(chatId, text);
          json(res, { success: true });
        } catch (e) {
          json(res, { error: e.message }, 500);
        }
      });
      return;
    }

    if (path === "/api/send-image" && req.method === "POST") {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", async () => {
        try {
          const { chatId, imageUrl, caption } = JSON.parse(body);
          if (!chatId || !imageUrl) return json(res, { error: "chatId and imageUrl required" }, 400);
          if (!client || status !== "CONNECTED") return json(res, { error: "not ready" }, 503);
          const { MessageMedia } = require("whatsapp-web.js");
          const media = await MessageMedia.fromUrl(imageUrl, { unsafeMime: true });
          await client.sendMessage(chatId, media, { caption: caption || "" });
          json(res, { success: true });
        } catch (e) {
          json(res, { error: e.message }, 500);
        }
      });
      return;
    }

    if (path === "/api/restart" && req.method === "POST") {
      qrBuffer = null;
      status = "DISCONNECTED";
      createClient();
      json(res, { success: true, message: "Reconnecting..." });
      return;
    }

    json(res, { error: "Not found" }, 404);
  } catch (e) {
    console.error("[Daemon] Server error:", e.message);
    res.writeHead(500);
    res.end("error");
  }
});

process.on("uncaughtException", (e) => console.error("[Daemon] Uncaught:", e.message));
process.on("unhandledRejection", (e) => console.error("[Daemon] Unhandled:", e.message));

server.listen(PORT, () => {
  console.log(`[Daemon] HTTP on port ${PORT}, webhook: ${WEBHOOK_URL}`);
  createClient();
});
