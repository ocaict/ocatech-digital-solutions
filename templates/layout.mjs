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
      <a class="button button-small" href="/apply/">Apply</a>
      <a class="button button-small button-wa" href="${esc(wa)}">${esc(shared.buttons.whatsapp)}</a>
    </nav>
    <a class="header-wa" href="${esc(wa)}">${esc(shared.buttons.whatsapp)}</a>
  </div>
</header>`;
}

export function footer(site, shared) {
  const links = [...shared.nav, ["Apply", "/apply/"], ["Privacy", "/privacy/"]]
    .map(([label, href]) => `<li><a href="${href}">${esc(label)}</a></li>`).join("");
  const phones = site.contact.phones
    .map((phone) => `<li><a href="tel:${esc(phone.e164)}">${esc(phone.display)}</a></li>`).join("");
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
      return `<a class="social-link" href="${esc(url)}" aria-label="${esc(label)}" title="${esc(label)}">${icon}<span>${esc(label)}</span></a>`;
    }).join("");
  const maps = site.contact.googleMapsUrl ? `<p class="footer-maps"><a class="text-link" href="${esc(site.contact.googleMapsUrl)}">Get directions &nearr;</a></p>` : "";
  return `<footer class="site-footer">
  <div class="wrap footer-grid">
    <section class="footer-brand-col" aria-labelledby="footer-brand">
      <div class="footer-brand-head">
        <img src="/assets/img/logo-480.webp" alt="OCATECH Digital Solutions logo" width="44" height="44">
        <h2 id="footer-brand" class="footer-title">${esc(site.brand.name)}</h2>
      </div>
      <p class="footer-desc">${esc(site.brand.descriptor)}</p>
      <p class="footer-tagline">${esc(site.brand.tagline)}</p>
      ${social ? `<div class="footer-social" aria-label="Social media links">${social}</div>` : ""}
    </section>
    <section aria-labelledby="footer-visit">
      <h2 id="footer-visit" class="footer-title">Visit us</h2>
      <p>${esc(site.contact.addressLine)}, ${esc(site.contact.city)}, ${esc(site.contact.state)}</p>
      ${site.contact.landmarkOrDirections ? `<p>${esc(site.contact.landmarkOrDirections)}</p>` : ""}
      ${site.contact.hours ? `<p class="footer-hours">Open ${esc(site.contact.hours)}.</p>` : ""}
      ${maps}
    </section>
    <section aria-labelledby="footer-contact">
      <h2 id="footer-contact" class="footer-title">Contact</h2>
      <ul class="footer-list">
        ${phones}
        <li><a href="https://wa.me/${site.contact.whatsapp.number}">WhatsApp: ${esc(site.contact.whatsapp.display)}</a></li>
        <li><a href="mailto:${esc(site.contact.email)}">${esc(site.contact.email)}</a></li>
      </ul>
    </section>
    <section aria-labelledby="footer-links">
      <h2 id="footer-links" class="footer-title">Quick links</h2>
      <ul class="footer-list">
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
  <p class="chat-safety">${esc(chat.safety)}</p>
</div>`;
}

export function page(site, shared, assets, meta, inner, jsonLd = []) {
  const canonicalPath = new URL(meta.canonical).pathname;
  const chatEnabled = Boolean(site.flags.enableChatbot);
  const body = `${header(site, shared, assets, canonicalPath)}
<main id="main">
${inner}
</main>
${footer(site, shared)}
${chatEnabled ? chatButton(shared.chat) : ""}`;
  return shell({ ...meta, assets, body, jsonLd, extraScripts: meta.extraScripts || [], chatSrc: chatEnabled ? assets.chat : "" });
}
