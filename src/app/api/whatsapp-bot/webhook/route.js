export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { sendText, sendImage, parseFrom, getChatId } from "@/lib/waha";
import { handleMessage } from "@/lib/whatsapp-bot";

async function sendMessages(chatId, messages) {
  for (const msg of messages) {
    if (msg.type === "text") {
      await sendText(chatId, msg.content);
    } else if (msg.type === "image") {
      await sendImage(chatId, msg.imageUrl, msg.caption);
    }
    await new Promise((r) => setTimeout(r, 800));
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("[WA Bot Webhook] event:", body.event, "from:", body.payload?.from);

    if (body.event !== "message") {
      return NextResponse.json({ ok: true });
    }

    const payload = body.payload;
    if (!payload || !payload.from) {
      return NextResponse.json({ ok: true });
    }

    if (payload.type === "chat" || payload.type === "message") {
      const text = String(payload.body || "").trim();
      if (!text || /^(seen|typing|recording)/i.test(text)) {
        return NextResponse.json({ ok: true });
      }

      const phone = parseFrom(payload.from);
      if (!phone) return NextResponse.json({ ok: true });

      console.log(`[WA Bot] From: ${phone}, Msg: "${text}"`);

      const messages = await handleMessage(payload.from, text);

      if (messages.length > 0) {
        await sendMessages(payload.from, messages);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[WA Bot Webhook] Error:", err.message);
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, name: "whatsapp-bot-webhook" });
}
