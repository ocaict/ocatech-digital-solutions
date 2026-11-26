import { onRequestPost as applyPost } from "./api/apply.js";
import { onRequestPost as chatPost } from "./api/chat.js";

const SECURITY_HEADERS = {
  "Content-Security-Policy": "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "accelerometer=(), camera=(), geolocation=(), microphone=(), payment=(), usb=()",
};

function secure(response, extraHeaders = {}) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries({ ...SECURITY_HEADERS, ...extraHeaders })) {
    if (!headers.has(name)) headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function json(body, status = 200, extraHeaders = {}) {
  return secure(new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extraHeaders },
  }));
}

async function postOnly(request, env, ctx, handler) {
  if (request.method !== "POST") {
    return json({ ok: false, message: "Use POST for this request." }, 405, { Allow: "POST" });
  }
  return secure(await handler({ request, env, ctx, params: {} }));
}

export default {
  async fetch(request, env, ctx) {
    const pathname = new URL(request.url).pathname.replace(/\/+$/, "") || "/";

    if (pathname === "/api/apply") return postOnly(request, env, ctx, applyPost);
    if (pathname === "/api/chat") return postOnly(request, env, ctx, chatPost);
    if (pathname.startsWith("/api/")) return json({ ok: false, message: "Not found." }, 404);

    return env.ASSETS.fetch(request);
  },
};
