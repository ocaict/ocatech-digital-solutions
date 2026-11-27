// POST /api/track — anonymous click/event counter. No personal data stored.
// Body: { event: string, page: string }
// Events: whatsapp_click, call_click, apply_start, apply_submit, quote_submit, taster_submit, chat_open

const ALLOWED_EVENTS = new Set([
  "whatsapp_click", "call_click", "apply_start", "apply_submit",
  "quote_submit", "taster_submit", "chat_open",
]);

const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
});

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.DB) return jsonResponse({ ok: true });

  let body = {};
  try {
    const ct = request.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      body = await request.json().catch(() => ({}));
    }
  } catch {}

  const event = String(body.event || "").slice(0, 60);
  const page = String(body.page || "/").slice(0, 200);

  if (!ALLOWED_EVENTS.has(event)) return jsonResponse({ ok: true });

  const day = new Date().toISOString().slice(0, 10);
  try {
    await env.DB.prepare(`
      INSERT INTO events (day, event, page, count) VALUES (?, ?, ?, 1)
      ON CONFLICT(day, event, page) DO UPDATE SET count = count + 1
    `).bind(day, event, page).run();
  } catch {}

  return jsonResponse({ ok: true });
}
