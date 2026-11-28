import { systemPrompt, config } from "../generated/chat-facts.mjs";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const WHATSAPP_TEXT = config.whatsappText || "Hello OCATECH, I would like to know more about your courses.";
const RISKY_REPLY = /\b(?:100%\s*(?:job|placement|pass|hire)|job\s+guarantee|guaranteed\s+(?:employment|job|salary|income|placement))\b/i;

const jsonResponse = (body, status = 200, extraHeaders = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extraHeaders },
});

const whatsappUrl = () => `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(WHATSAPP_TEXT)}`;

function handoff(status = 200) {
  return jsonResponse({
    ok: true,
    reply: config.handoff,
    handoff: true,
    whatsappUrl: whatsappUrl(),
  }, status);
}

function friendlyError(status, message, code) {
  const headers = code ? { "X-Chat-Error": code } : {};
  return jsonResponse({ ok: false, message, whatsappUrl: whatsappUrl() }, status, headers);
}

async function hashIp(request, salt) {
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown";
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${ip}`));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function checkDailyLimit(env, ipHash) {
  if (!env.DB) return false;
  const day = new Date().toISOString().slice(0, 10);
  const row = await env.DB.prepare("SELECT count FROM usage WHERE day = ? AND kind = ? AND ip_hash = ?")
    .bind(day, "chat", ipHash).first();
  if (row && row.count >= 30) return true;
  await env.DB.prepare(`INSERT INTO usage (day, kind, ip_hash, count) VALUES (?, ?, ?, 1)
    ON CONFLICT(day, kind, ip_hash) DO UPDATE SET count = count + 1`)
    .bind(day, "chat", ipHash).run();
  return false;
}

function cleanMessages(payload) {
  const messages = payload?.messages;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 20) return null;
  const cleaned = [];
  for (const item of messages.slice(-10)) {
    const role = item?.role === "user" ? "user" : item?.role === "assistant" ? "assistant" : null;
    const raw = typeof item?.content === "string" ? item.content.trim() : "";
    if (!role || !raw || raw.length > 5000) return null;
    cleaned.push({ role, content: raw.slice(0, role === "user" ? 600 : 1500) });
  }
  return cleaned;
}

export async function onRequestPost(context) {
  const started = Date.now();
  const { request, env } = context;
  const log = (status) => console.log(JSON.stringify({ route: "chat", status, ms: Date.now() - started }));

  if (!config.flags.enableChatbot) {
    log("disabled");
    return handoff();
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    log("invalid");
    return friendlyError(400, "Please send a valid question.", "bad-request");
  }

  const messages = cleanMessages(payload);
  if (!messages) {
    log("invalid");
    return friendlyError(400, "Please send a short question.", "bad-request");
  }

  let limited = false;
  try {
    limited = await checkDailyLimit(env, await hashIp(request, env.IP_SALT || "local"));
  } catch {
    log("rate-limit-error");
  }
  if (limited) {
    log("limit");
    return friendlyError(429, config.limit, "limit");
  }

  if (!env.GROQ_API_KEY) {
    log("not-configured");
    return friendlyError(502, config.error, "missing-key");
  }

  let response;
  try {
    response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.GROQ_MODEL || DEFAULT_MODEL,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        temperature: 0.55,
        max_tokens: 450,
      }),
    });
  } catch {
    log("upstream-error");
    return friendlyError(502, config.error, "upstream-error");
  }

  if (!response.ok) {
    log(`upstream-${response.status}`);
    return friendlyError(502, config.error, `upstream-${response.status}`);
  }

  let payloadFromGroq;
  try {
    payloadFromGroq = await response.json();
  } catch {
    log("upstream-invalid");
    return friendlyError(502, config.error, "upstream-invalid");
  }

  const reply = payloadFromGroq?.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    log("empty-reply");
    return handoff();
  }

  const handOff = RISKY_REPLY.test(reply);
  log("ok");
  return jsonResponse({
    ok: true,
    reply: (handOff ? config.handoff : reply).slice(0, 1200),
    handoff: handOff,
  });
}
