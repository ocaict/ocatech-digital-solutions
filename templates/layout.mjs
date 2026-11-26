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
    .map(([label, href]) => `<a href="${href}">${esc(label)}</a>`).join("");
  const phones = site.contact.phones.map((phone) => `<a href="tel:${esc(phone.e164)}">${esc(phone.display)}</a>`).join("");
  const socialLabels = { facebook: "Facebook", instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", x: "X" };
  const social = Object.entries(site.contact.social).filter(([, url]) => url)
    .map(([name, url]) => `<a href="${esc(url)}">${esc(socialLabels[name] || name)}</a>`).join("");
  const maps = site.contact.googleMapsUrl ? `<p><a href="${esc(site.contact.googleMapsUrl)}">Get directions</a></p>` : "";
  return `<footer class="site-footer">
  <div class="wrap footer-grid">
    <section aria-labelledby="footer-brand">
      <h2 id="footer-brand" class="footer-title">${esc(site.brand.name)}</h2>
      <p>${esc(site.brand.descriptor)}</p>
      <p>${esc(site.brand.tagline)}</p>
    </section>
    <section aria-labelledby="footer-visit">
      <h2 id="footer-visit" class="footer-title">Visit us</h2>
      <p>${esc(site.contact.addressLine)}, ${esc(site.contact.city)}, ${esc(site.contact.state)}</p>
      ${site.contact.landmarkOrDirections ? `<p>${esc(site.contact.landmarkOrDirections)}</p>` : ""}
      ${site.contact.hours ? `<p>Open ${esc(site.contact.hours)}.</p>` : ""}
      ${maps}
    </section>
    <section aria-labelledby="footer-contact">
      <h2 id="footer-contact" class="footer-title">Contact</h2>
      <p>${phones}</p>
      <p><a href="https://wa.me/${site.contact.whatsapp.number}">${esc(site.contact.whatsapp.display)}</a></p>
      <p><a href="mailto:${esc(site.contact.email)}">${esc(site.contact.email)}</a></p>
    </section>
    <section aria-labelledby="footer-links">
      <h2 id="footer-links" class="footer-title">Links</h2>
      <p>${links}</p>
      ${social ? `<p>${social}</p>` : ""}
    </section>
  </div>
  <div class="wrap legal">© ${new Date().getUTCFullYear()} ${esc(shared.legal)}</div>
</footer>`;
}

export function chatButton(chat) {
  return `<div class="chat-launcher">
  <button class="chat-open" type="button" aria-expanded="false">${esc(chat.closed)}</button>
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
