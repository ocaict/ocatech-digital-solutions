// POST /api/verify — look up a certificate number in D1
// Body: { code: string }

import { config } from "../generated/chat-facts.mjs";

const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
});

const htmlRedirect = (location) => new Response(null, {
  status: 303,
  headers: { Location: location, "Cache-Control": "no-store" },
});

async function hashIp(request, salt) {
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown";
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${ip}`));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function checkRateLimit(env, ipHash) {
  if (!env.DB) return false;
  const day = new Date().toISOString().slice(0, 10);
  const row = await env.DB.prepare("SELECT count FROM usage WHERE day = ? AND kind = ? AND ip_hash = ?")
    .bind(day, "verify", ipHash).first();
  if (row && row.count >= 20) return true;
  await env.DB.prepare(`INSERT INTO usage (day, kind, ip_hash, count) VALUES (?, ?, ?, 1)
    ON CONFLICT(day, kind, ip_hash) DO UPDATE SET count = count + 1`)
    .bind(day, "verify", ipHash).run();
  return false;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const wantsHtml = (request.headers.get("accept") || "").includes("text/html");

  let body = {};
  try {
    const ct = request.headers.get("content-type") || "";
    if (ct.includes("application/json")) body = await request.json().catch(() => ({}));
    else {
      const form = await request.formData();
      body = Object.fromEntries(form.entries());
    }
  } catch {}

  const rawCode = String(body.code || "").trim().toUpperCase().slice(0, 40);
  if (!rawCode) {
    if (wantsHtml) return htmlRedirect("/verify/?error=empty");
    return jsonResponse({ ok: false, message: "Please enter a certificate number." }, 400);
  }

  if (!env.DB) {
    if (wantsHtml) return htmlRedirect("/verify/?error=unavailable");
    return jsonResponse({ ok: false, message: "Verification is not yet available." }, 503);
  }

  const ipHash = await hashIp(request, env.IP_SALT || "local");
  let limited = false;
  try { limited = await checkRateLimit(env, ipHash); } catch {}
  if (limited) {
    if (wantsHtml) return htmlRedirect("/verify/?error=limit");
    return jsonResponse({ ok: false, message: "Too many attempts. Please try again later." }, 429);
  }

  try {
    const row = await env.DB.prepare(
      "SELECT name, course, issued_on, revoked FROM certificates WHERE code = ?"
    ).bind(rawCode).first();

    if (!row || row.revoked) {
      if (wantsHtml) return htmlRedirect("/verify/?result=not-found");
      return jsonResponse({ ok: false, message: "No certificate found with that number." });
    }

    const result = { ok: true, name: row.name, course: row.course, issuedOn: row.issued_on };
    if (wantsHtml) {
      const q = new URLSearchParams({ result: "found", name: row.name, course: row.course, issued: row.issued_on });
      return htmlRedirect(`/verify/?${q.toString()}`);
    }
    return jsonResponse(result);
  } catch {
    if (wantsHtml) return htmlRedirect("/verify/?error=unavailable");
    return jsonResponse({ ok: false, message: "Verification unavailable. Please try again shortly." }, 503);
  }
}
