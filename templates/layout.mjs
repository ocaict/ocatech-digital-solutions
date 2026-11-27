export const esc = (value = "") => String(value).replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[c]));

export const json = (value) => JSON.stringify(value).replace(/</g, "\\u003c");

export const wa = (number, text) => `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

export const notice = '<span class="sr-only"> (opens in a new tab)</span>';

export function markExternalLinks(html) {
  return html.replace(/(<a\b[^>]*\bhref="https?:\/\/[^"]+"[^>]*>)([\s\S]*?)(<\/a>)/gi, (match, open, text, close) => {
    const attrs = `${/\btarget=/i.test(open) ? "" : ' target="_blank"'}${/\brel=/i.test(open) ? "" : ' rel="noopener noreferrer"'}`;
    const updated = attrs ? open.replace(/^<a/, `<a${attrs}`) : open;
    return `${updated}${text}${text.includes("sr-only") ? "" : notice}${close}`;
  });
}

export function shell({ title, description, canonical, body, assets, jsonLd = [], noindex = false, bodyClass = "", extraScripts = [], chatSrc = "" }) {
  const ld = jsonLd.map((item) => `<script type="application/ld+json">${json(item)}</script>`).join("\n");
  const robots = noindex ? "noindex, nofollow" : "index, follow";
  return markExternalLinks(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="${robots}">
<meta name="google-site-verification" content="X4wu9MJh9bKsta3_t3elWPtAvpn-7Ew40b0o3Yv528o">
<meta name="chat-src" content="${esc(chatSrc)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="OCATECH Digital Solutions">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(new URL("/assets/img/share-card.png", canonical).href)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(new URL("/assets/img/share-card.png", canonical).href)}">
<link rel="icon" href="/assets/img/favicon-32.png" sizes="32x32">
<link rel="icon" href="/assets/img/favicon-192.png" sizes="192x192">
<link rel="icon" href="/assets/img/favicon-512.png" sizes="512x512">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="preload" href="${assets.font}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${assets.css}">
${ld}
</head>
<body class="${esc(bodyClass)}">
<a class="skip-link" href="#main">Skip to main content</a>
${body}
${extraScripts.map((src) => `<script src="${src}" defer></script>`).join("\n")}
<script src="${assets.main}" defer></script>
</body>
</html>
`);
}

export function header(site, shared, assets, canonicalPath) {
  const nav = shared.nav.map(([label, href]) => `<a${canonicalPath.startsWith(href) ? ' aria-current="page"' : ""} href="${href}">${esc(label)}</a>`).join("");
  const wa = `https://wa.me/${site.contact.whatsapp.number}?text=${encodeURIComponent(shared.whatsappPresets.general)}`;
  return `<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="/" aria-label="OCATECH Digital Solutions home">
      <img src="/assets/img/logo-480.webp" alt="OCATECH Digital Solutions logo" width="96" height="96">
      <span>${esc(site.brand.name)}</span>
    </a>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
    <nav id="site-nav" class="site-nav" aria-label="Main navigation">
      ${nav}
      <a class="button button-small" href="/apply/" data-track="apply_start">Apply</a>
      <a class="button button-small button-wa" href="${esc(wa)}" data-track="whatsapp_click">${esc(shared.buttons.whatsapp)}</a>
    </nav>
    <a class="header-wa" href="${esc(wa)}" data-track="whatsapp_click">${esc(shared.buttons.whatsapp)}</a>
  </div>
</header>`;
}

export function footer(site, shared) {
  const navLinks = [
    ...shared.nav,
    ["Course fees", "/fees/"],
    ["Free class", "/free-class/"],
    ["For teams", "/training-for-teams/"],
    ["Local guides", "/guides/"],
    ["Verify certificate", "/verify/"],
    ["Apply", "/apply/"],
    ["Privacy", "/privacy/"],
  ];
  const links = navLinks
    .map(([label, href]) => `<li><a href="${href}">${esc(label)}</a></li>`).join("");
  const phones = site.contact.phones
    .map((phone) => `<li>
        <span class="footer-contact-icon" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.47 2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6.09 6.09l1.09-.9a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        </span>
        <a href="tel:${esc(phone.e164)}" data-track="call_click">${esc(phone.display)}</a>
      </li>`).join("");
  const socialLabels = { facebook: "Facebook", instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", x: "X" };
  const socialIcons = {
    facebook: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>',
    youtube: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg>',
    instagram: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',
    tiktok: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.81a8.24 8.24 0 0 0 4.76 1.5V6.86a4.82 4.82 0 0 1-1-.17z"/></svg>',
    x: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23zm-1.16 17.52h1.83L7.08 4.13H5.12z"/></svg>',
  };
  const social = Object.entries(site.contact.social).filter(([, url]) => url)
    .map(([name, url]) => {
      const label = socialLabels[name] || name;
      const icon = socialIcons[name] || "";
      return `<a class="social-link" href="${esc(url)}" aria-label="${esc(label)} (opens in a new tab)" title="${esc(label)}">${icon}<span>${esc(label)}</span></a>`;
    }).join("");
  const waIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.998 2C6.472 2 2 6.481 2 12.015a10.02 10.02 0 0 0 1.401 5.146L2 22l4.998-1.313A9.956 9.956 0 0 0 12 22c5.514 0 10-4.481 10-10.015S17.514 2 11.998 2z" fill-rule="evenodd" clip-rule="evenodd"/></svg>`;
  const emailIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`;
  const maps = site.contact.googleMapsUrl
    ? `<a class="footer-maps-link" href="${esc(site.contact.googleMapsUrl)}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>Get directions</a>`
    : "";
  return `<footer class="site-footer">
  <div class="footer-top-bar" aria-hidden="true"></div>
  <div class="wrap footer-grid">

    <section class="footer-brand-col" aria-labelledby="footer-brand">
      <div class="footer-brand-head">
        <img src="/assets/img/logo-480.webp" alt="" width="48" height="48">
        <div>
          <h2 id="footer-brand" class="footer-brand-name">${esc(site.brand.name)}</h2>
          <p class="footer-brand-sub">${esc(site.brand.descriptor)}</p>
        </div>
      </div>
      <p class="footer-tagline">"${esc(site.brand.tagline)}"</p>
      ${social ? `<nav class="footer-social" aria-label="Follow us">${social}</nav>` : ""}
    </section>

    <section class="footer-col" aria-labelledby="footer-visit">
      <h3 id="footer-visit" class="footer-col-title">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>
        Visit us
      </h3>
      <address class="footer-address">
        <p>${esc(site.contact.addressLine)},<br>${esc(site.contact.city)}, ${esc(site.contact.state)}</p>
        ${site.contact.landmarkOrDirections ? `<p class="footer-landmark">${esc(site.contact.landmarkOrDirections)}</p>` : ""}
        ${site.contact.hours ? `<p class="footer-hours"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${esc(site.contact.hours)}</p>` : ""}
      </address>
      ${maps}
    </section>

    <section class="footer-col" aria-labelledby="footer-contact">
      <h3 id="footer-contact" class="footer-col-title">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.47 2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6.09 6.09l1.09-.9a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        Get in touch
      </h3>
      <ul class="footer-contact-list">
        ${phones}
        <li>
          <span class="footer-contact-icon" aria-hidden="true">${waIcon}</span>
          <a href="https://wa.me/${site.contact.whatsapp.number}" class="footer-wa-link" data-track="whatsapp_click">${esc(site.contact.whatsapp.display)}</a>
        </li>
        <li>
          <span class="footer-contact-icon" aria-hidden="true">${emailIcon}</span>
          <a href="mailto:${esc(site.contact.email)}">${esc(site.contact.email)}</a>
        </li>
      </ul>
    </section>

    <section class="footer-col" aria-labelledby="footer-links">
      <h3 id="footer-links" class="footer-col-title">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
        Quick links
      </h3>
      <ul class="footer-links-list">
        ${links}
      </ul>
    </section>

  </div>
  <div class="wrap legal">
    <p>© ${new Date().getUTCFullYear()} ${esc(shared.legal)}</p>
    <p class="legal-links"><a href="/privacy/">Privacy</a> · <a href="/contact/">Contact</a></p>
  </div>
</footer>`;
}

export function chatButton(chat) {
  return `<div class="chat-launcher">
  <button class="chat-open" type="button" aria-expanded="false" aria-label="${esc(chat.closed)}" title="${esc(chat.closed)}">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      <path d="M9 10h.01M12 10h.01M15 10h.01"/>
    </svg>
    <span class="sr-only">${esc(chat.closed)}</span>
  </button>
</div>`;
}

export function mobileActionBar(site, shared) {
  const phone = site.contact.phones[0] || { e164: "+2348165321429" };
  const wa = `https://wa.me/${site.contact.whatsapp.number}?text=${encodeURIComponent(shared.whatsappPresets.general)}`;
  return `<nav class="mobile-action-bar" aria-label="Quick contact actions">
  <a class="bar-btn bar-call" href="tel:${esc(phone.e164)}" data-track="call_click">
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.47 2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6.09 6.09l1.09-.9a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
    <span>Call us</span>
  </a>
  <a class="bar-btn bar-wa" href="${esc(wa)}" target="_blank" rel="noopener noreferrer" data-track="whatsapp_click">
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.998 2C6.472 2 2 6.481 2 12.015a10.02 10.02 0 0 0 1.401 5.146L2 22l4.998-1.313A9.956 9.956 0 0 0 12 22c5.514 0 10-4.481 10-10.015S17.514 2 11.998 2z" fill-rule="evenodd" clip-rule="evenodd"/></svg>
    <span>Chat on WhatsApp</span>
  </a>
</nav>`;
}

export function page(site, shared, assets, meta, inner, jsonLd = []) {
  const canonicalPath = new URL(meta.canonical).pathname;
  const chatEnabled = Boolean(site.flags.enableChatbot);
  const body = `${header(site, shared, assets, canonicalPath)}
<main id="main">
${inner}
</main>
${footer(site, shared)}
${chatEnabled ? chatButton(shared.chat) : ""}
${mobileActionBar(site, shared)}`;
  return shell({ ...meta, assets, body, jsonLd, extraScripts: meta.extraScripts || [], chatSrc: chatEnabled ? assets.chat : "" });
}
