import { config } from "../generated/chat-facts.mjs";

const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
});

const htmlRedirect = (location, status = 303) => new Response(null, {
  status,
  headers: { Location: location, "Cache-Control": "no-store" },
});

const clean = (value, max = 2000) => String(value || "").replace(/[\r\n]+/g, " ").trim().slice(0, max);

const normalisePhone = (value) => {
  const digits = String(value || "").replace(/[^\d]/g, "");
  if (/^0[789]\d{9}$/.test(digits)) return `234${digits.slice(1)}`;
  if (/^234[789]\d{9}$/.test(digits)) return digits;
  return null;
};

async function hashIp(request, salt) {
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown";
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${ip}`));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function checkRateLimit(env, ipHash) {
  if (!env.DB) return false;
  const day = new Date().toISOString().slice(0, 10);
  const row = await env.DB.prepare("SELECT count FROM usage WHERE day = ? AND kind = ? AND ip_hash = ?")
    .bind(day, "apply", ipHash).first();
  if (row && row.count >= 5) return true;
  await env.DB.prepare(`INSERT INTO usage (day, kind, ip_hash, count) VALUES (?, ?, ?, 1)
    ON CONFLICT(day, kind, ip_hash) DO UPDATE SET count = count + 1`)
    .bind(day, "apply", ipHash).run();
  return false;
}

async function verifyTurnstile(request, env, token) {
  if (env.TURNSTILE_SECRET) {
    const secret = env.TURNSTILE_SECRET;
    const remoteip = request.headers.get("cf-connecting-ip") || undefined;
    const body = new URLSearchParams({ secret, response: token || "" });
    if (remoteip) body.set("remoteip", remoteip);
    try {
      const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        body,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const result = await response.json();
      return Boolean(result.success);
    } catch {
      return false;
    }
  }
  return false;
}

async function readInput(request) {
  const type = request.headers.get("content-type") || "";
  if (type.includes("application/json")) return request.json().catch(() => ({}));
  const form = await request.formData();
  return Object.fromEntries(form.entries());
}

function validate(data) {
  const out = {};
  const allowedTypes = ["service", "taster", "team"];
  out.type = allowedTypes.includes(data.type) ? data.type : "learn";
  out.name = clean(data.name, 80);
  out.phone = normalisePhone(data.phone);
  out.email = clean(data.email, 120);
  out.course = clean(data.course, 80);
  out.service = clean(data.service, 80);
  out.mode = clean(data.mode, 40);
  out.start = clean(data.start, 40);

  const status = clean(data.current_status, 60);
  const goal = clean(data.goal, 60);
  const laptop = clean(data.has_laptop, 20);
  const referral = clean(data.referral, 80);
  const propertyType = clean(data.property_type, 60);
  const location = clean(data.location, 120);
  const organisation = clean(data.organisation, 120);
  const teamSize = clean(data.team_size, 40);
  const topic = clean(data.topic, 120);
  const rawMsg = clean(data.message, 600);

  const details = [];
  if (organisation) details.push(`Organisation: ${organisation}`);
  if (teamSize) details.push(`Team size: ${teamSize}`);
  if (topic) details.push(`Topic: ${topic}`);
  if (status) details.push(`Status: ${status}`);
  if (goal) details.push(`Goal: ${goal}`);
  if (laptop) details.push(`Laptop & Internet: ${laptop}`);
  if (referral) details.push(`Heard via: ${referral}`);
  if (propertyType) details.push(`Property: ${propertyType}`);
  if (location) details.push(`Location: ${location}`);
  if (rawMsg) details.push(`Details: ${rawMsg}`);

  out.message = details.length ? details.join(" | ").slice(0, 600) : "";
  out.consent = data.consent === true || data.consent === "true" || data.consent === "on" || data.consent === "1";
  out.sourcePage = clean(data.sourcePage, 200);
  out.website = clean(data.website, 200);
  out.turnstileToken = clean(data.turnstileToken, 500);
  out.utm_source = clean(data.utm_source, 100);
  out.utm_medium = clean(data.utm_medium, 100);
  out.utm_campaign = clean(data.utm_campaign, 100);
  out.referrer = clean(data.referrer, 500);

  if (out.name.length < 2) return { error: "name" };
  if (!out.phone) return { error: "phone" };
  if (out.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email)) return { error: "email" };
  if (out.type === "learn" && out.course !== "not-sure-yet" && !config.courseSlugs.includes(out.course)) return { error: "course" };
  if (out.type === "service" && !config.serviceSlugs.includes(out.service) && out.service !== "custom-setup") return { error: "service" };
  if (!["In person", "Online", "Not sure", ""].includes(out.mode)) return { error: "mode" };
  if (!["As soon as possible", "Within a month", "Just exploring", ""].includes(out.start)) return { error: "start" };
  if (!out.consent) return { error: "consent" };
  return { data: out };
}

async function sendEmail(env, lead) {
  if (!env.RESEND_API_KEY || !env.NOTIFY_EMAIL) return false;
  const subjectLabel = lead.type === "service" ? `${lead.service || "service"} quote request`
    : lead.type === "taster" ? "free class sign-up"
    : lead.type === "team" ? "team training enquiry"
    : lead.course || "course enquiry";
  const lines = [
    `Name: ${clean(lead.name, 80)}`,
    `Phone: ${lead.phone}`,
    `Email: ${lead.email || "not supplied"}`,
    `Type: ${lead.type === "service" ? "Service Quote Request" : "Course Application"}`,
    `Course: ${lead.type === "learn" ? lead.course || "not supplied" : "not applicable"}`,
    `Service: ${lead.type === "service" ? lead.service || "not supplied" : "not applicable"}`,
    `Mode: ${lead.mode || "not supplied"}`,
    `Details: ${lead.message || "not supplied"}`,
    `Page: ${lead.sourcePage || "not supplied"}`,
    lead.utm_source ? `UTM Source: ${lead.utm_source}` : null,
    lead.utm_medium ? `UTM Medium: ${lead.utm_medium}` : null,
    lead.utm_campaign ? `UTM Campaign: ${lead.utm_campaign}` : null,
    lead.referrer ? `Referrer: ${lead.referrer}` : null,
    `Time: ${new Date().toISOString()}`,
  ].filter(Boolean);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.RESEND_FROM || "OCATECH website <onboarding@resend.dev>",
      to: [env.NOTIFY_EMAIL],
      subject: clean(`New ${subjectLabel} from ${lead.name}`, 140),
      text: lines.join("\n"),
    }),
  });
  return response.ok;
}

export async function onRequestPost(context) {
  const started = Date.now();
  const { request, env } = context;
  const wantsHtml = (request.headers.get("accept") || "").includes("text/html")
    && !(request.headers.get("accept") || "").includes("application/json");
  const finish = (status, body, htmlLocation) => {
    console.log(JSON.stringify({ route: "apply", status, ms: Date.now() - started }));
    if (htmlLocation && wantsHtml) return htmlRedirect(htmlLocation);
    return jsonResponse(body, status);
  };

  let input;
  try {
    input = await readInput(request);
  } catch {
    return finish(400, { ok: false, message: "Invalid request." }, "/apply/?error=invalid");
  }

  if (input.website) return finish(200, { ok: true, whatsappUrl: `https://wa.me/${config.whatsappNumber}` }, "/success/");

  const checked = validate(input);
  if (checked.error) return finish(400, { ok: false, message: checked.error }, "/apply/?error=invalid");

  if (config.flags.enableTurnstile && !(await verifyTurnstile(request, env, checked.data.turnstileToken))) {
    return finish(400, { ok: false, message: "Verification failed." }, "/apply/?error=verify");
  }

  let limited = false;
  try {
    limited = await checkRateLimit(env, await hashIp(request, env.IP_SALT || "local"));
  } catch (error) {
    console.log(JSON.stringify({ route: "apply", status: "rate-limit-error", ms: Date.now() - started }));
    return finish(503, { ok: false, message: "Storage is unavailable." }, "/apply/?error=server");
  }
  if (limited) {
    return finish(429, { ok: false, message: "Too many attempts." }, "/apply/?error=limit");
  }

  const lead = checked.data;
  let saved = false;
  let emailed = false;
  try {
    if (env.DB) {
      await env.DB.prepare(`INSERT INTO leads
        (type, name, phone, email, course, service, mode, start_pref, message, source_page, status, utm_source, utm_medium, utm_campaign, referrer)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?, ?)`)
        .bind(lead.type, lead.name, lead.phone, lead.email || null,
          lead.type === "learn" ? lead.course : null,
          lead.type === "service" ? lead.service : null,
          lead.mode || null, lead.start || null, lead.message || null, lead.sourcePage || null,
          lead.utm_source || null, lead.utm_medium || null, lead.utm_campaign || null, lead.referrer || null)
        .run();
      saved = true;
    }
  } catch (error) {
    console.log(JSON.stringify({ route: "apply", status: "insert-error", ms: Date.now() - started }));
  }

  try {
    emailed = await sendEmail(env, lead);
  } catch (error) {
    console.log(JSON.stringify({ route: "apply", status: "email-error", ms: Date.now() - started }));
  }

  if (!saved && !emailed) {
    return finish(503, { ok: false, message: "Your details were not sent. Please try again." }, "/apply/?error=server");
  }
  if (!emailed) console.log(JSON.stringify({ route: "apply", status: "email-fallback", ms: Date.now() - started }));

  const waText = lead.type === "service"
    ? `Hello OCATECH, I just requested a quote for ${lead.service || "installation services"}. My name is ${lead.name}.`
    : lead.type === "taster"
    ? `Hello OCATECH, I just signed up for the free taster class. My name is ${lead.name}.`
    : lead.type === "team"
    ? `Hello OCATECH, I just submitted a team training enquiry. My name is ${lead.name}.`
    : `Hello OCATECH, I just applied for ${lead.course || "a course"}. My name is ${lead.name}.`;

  return finish(200, {
    ok: true,
    whatsappUrl: `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(waText)}`,
  }, "/success/");
}
