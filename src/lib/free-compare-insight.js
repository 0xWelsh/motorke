/**
 * Optional LLM paragraph for /compare. Server-only: GROQ_API_KEY and/or GEMINI_API_KEY.
 * Uses fetch only — no extra npm package.
 */

const SYSTEM =
  "You help buyers in Kenya compare vehicles on Welsh Motorhub. Use ONLY the facts in the user message. " +
  "Write 2–4 short sentences in plain English, no bullet points, no markdown, no headings. " +
  "Do not invent numbers; if a fact is N/A, you may say it is not shown. Be neutral, not salesy.";

async function tryGroq(userBlock) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userBlock },
      ],
      max_tokens: 500,
      temperature: 0.35,
    }),
  });
  if (!res.ok) {
    return { type: "error", status: res.status, body: (await res.text()).slice(0, 200) };
  }
  const j = await res.json();
  const text = j.choices?.[0]?.message?.content?.trim();
  return text ? { type: "ok", text } : { type: "empty" };
}

async function tryGemini(userBlock) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
  const combined = `${SYSTEM}\n\nUser facts:\n${userBlock}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: combined }] }],
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.35,
      },
    }),
  });
  if (!res.ok) {
    return { type: "error", status: res.status, body: (await res.text()).slice(0, 200) };
  }
  const j = await res.json();
  const text = j.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  return text ? { type: "ok", text } : { type: "empty" };
}

/**
 * @param {string} userBlock
 * @returns {Promise<
 *   | { ok: true; text: string; provider: "groq" | "gemini" }
 *   | { ok: false; error: string; details?: string }
 * >}
 */
export async function generateCompareParagraph(userBlock) {
  if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
    return { ok: false, error: "no_key" };
  }

  const g = await tryGroq(userBlock);
  if (g && g.type === "ok" && g.text) {
    return { ok: true, text: g.text, provider: "groq" };
  }

  const m = await tryGemini(userBlock);
  if (m && m.type === "ok" && m.text) {
    return { ok: true, text: m.text, provider: "gemini" };
  }

  if (g?.type === "error" && m?.type === "error") {
    return {
      ok: false,
      error: "both_backends_failed",
      details: `Groq ${g.status}: ${g.body} · Gemini ${m.status}: ${m.body}`.slice(0, 500),
    };
  }
  if (g?.type === "error")
    return { ok: false, error: `groq_http_${g.status}`, details: g.body };
  if (m?.type === "error")
    return { ok: false, error: `gemini_http_${m.status}`, details: m.body };

  return { ok: false, error: "llm_unavailable" };
}
