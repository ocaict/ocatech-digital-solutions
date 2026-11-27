import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { esc, json, page, wa } from "../templates/layout.mjs";
import {
  shared, home, coursesPage, pathsPage, showcasePage, courseTemplate, services, about,
  apply as applyCopy, quote as quoteCopy, contact, faq, homeFaqCount, privacy, notFound, chat,
} from "../content/site.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const readJSON = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const site = readJSON("data/site.json");
const courseData = readJSON("data/courses.json").courses;
const courseBySlug = new Map(courseData.map((course) => [course.slug, course]));
const sharedCopy = { ...shared, chat };
const trackById = new Map(site.tracks.map((track) => [track.id, track]));
const serviceBySlug = new Map(site.services.map((service) => [service.slug, service]));

const write = (file, contents) => {
  const target = path.join(dist, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents, "utf8");
};

const hashFile = (file) => crypto.createHash("sha256").update(fs.readFileSync(path.join(root, file))).digest("hex").slice(0, 12);

function copyHashed(source, label) {
  const ext = path.extname(source);
  const base = path.basename(source, ext);
  const hash = hashFile(source);
  const target = `assets/${base}.${hash}${ext}`;
  fs.mkdirSync(path.join(dist, path.dirname(target)), { recursive: true });
  fs.copyFileSync(path.join(root, source), path.join(dist, target));
  return `/${target}`;
}

fs.rmSync(path.join(dist, "assets"), { recursive: true, force: true });

const assets = {
  css: copyHashed("assets/css/styles.css"),
  main: copyHashed("assets/js/main.js"),
  picker: copyHashed("assets/js/picker.js"),
  form: copyHashed("assets/js/form.js"),
  chat: copyHashed("assets/js/chat.js"),
  font: "/assets/fonts/figtree-latin.woff2",
};

for (const folder of ["img", "fonts", "video"]) {
  fs.cpSync(path.join(root, "assets", folder), path.join(dist, "assets", folder), { recursive: true });
}
fs.copyFileSync(path.join(root, "_redirects"), path.join(dist, "_redirects"));

const urls = {
  home: site.siteUrl.replace(/\/$/, ""),
  for(pathname = "/") {
    return new URL(pathname, `${this.home}/`).href;
  },
};

const whatsapp = (text) => `https://wa.me/${site.contact.whatsapp.number}?text=${encodeURIComponent(text)}`;
const titleFor = (title) => `${title} | OCATECH`;
const trackName = (id) => trackById.get(id)?.name || id;

const svgIcons = {
  arrowRight: `<svg class="icon-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>`,
  arrowNe: `<svg class="icon-arrow-ne" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg>`,
  clock: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  pin: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  grad: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
  laptop: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="2" y1="20" x2="22" y2="20"/></svg>`,
  award: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>`,
  card: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
  globe: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  bot: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8.01" y2="16"/><line x1="16" y1="16" x2="16.01" y2="16"/></svg>`,
  "bar-chart": `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  palette: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>`,
  "trending-up": `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  tool: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
};

function faqJsonLd(items, url) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    mainEntity: items.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

function breadcrumbJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, url], index) => ({
      "@type": "ListItem", position: index + 1, name, item: url,
    })),
  };
}

const organization = {
  "@type": "EducationalOrganization",
  "@id": `${urls.home}/#organization`,
  name: site.brand.name,
  alternateName: site.brand.shortName,
  url: urls.home,
  slogan: site.brand.tagline,
  email: site.contact.email,
  telephone: site.contact.phones.map((phone) => phone.e164),
  address: {
    "@type": "PostalAddress",
    streetAddress: site.contact.addressLine,
    addressLocality: site.contact.city,
    addressRegion: site.contact.state,
    addressCountry: site.contact.country,
  },
  areaServed: site.areasServed,
  ...(Object.values(site.contact.social).filter(Boolean).length ? { sameAs: Object.values(site.contact.social).filter(Boolean) } : {}),
};

function homeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      {
        "@type": "LocalBusiness",
        "@id": `${urls.home}/#business`,
        name: site.brand.name,
        description: site.brand.descriptor,
        url: urls.home,
        telephone: site.contact.phones.map((phone) => phone.e164),
        email: site.contact.email,
        address: organization.address,
        areaServed: site.areasServed,
        image: urls.for("/assets/img/share-card.png"),
        ...(site.contact.openingHoursSchema ? { openingHours: site.contact.openingHoursSchema } : {}),
      },
    ],
  };
}

function courseJsonLd(course) {
  const url = urls.for(`/courses/${course.slug}/`);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Course",
        "@id": `${url}#course`,
        name: course.title,
        description: course.summary,
        url,
        provider: { "@type": "EducationalOrganization", name: site.brand.name, url: urls.home },
        courseLevel: course.level,
        inLanguage: "en",
      },
      breadcrumbJsonLd([["Home", urls.home], ["Courses", urls.for("/courses/")], [course.title, url]]),
    ],
  };
}

function renderFaq(items) {
  return `<div class="faq-list">${items.map(([question, answer]) => `<details class="faq-item" name="faq">
<summary>${esc(question)}</summary>
<p>${esc(answer)}</p>
</details>`).join("")}</div>`;
}

function renderBreadcrumbs(items) {
  const sep = `<span class="breadcrumb-sep" aria-hidden="true">/</span>`;
  const crumbs = items.map(([label, href], i) => {
    const last = i === items.length - 1;
    return last
      ? `<li class="breadcrumb-item" aria-current="page">${esc(label)}</li>`
      : `<li class="breadcrumb-item"><a href="${esc(href)}">${esc(label)}</a>${sep}</li>`;
  }).join("");
  return `<nav class="breadcrumbs-nav wrap" aria-label="Breadcrumb"><ol class="breadcrumb-list">${crumbs}</ol></nav>`;
}

function renderPickerFallback() {
  return `<noscript><ul class="plain-list">${site.tracks.map((track) => `<li><a href="/courses/?track=${esc(track.id)}">${esc(track.name)}</a></li>`).join("")}</ul></noscript>`;
}

function courseCard(course, lead = false) {
  const track = trackById.get(course.track);
  const url = `/courses/${course.slug}/`;
  const formatNaira = (num) => Number(num || 0).toLocaleString("en-NG");
  const outcomes = (course.outcomes || []).slice(0, 3);
  const outcomesHtml = outcomes.map((o) => `<li><span class="outcome-check" aria-hidden="true">&#x2713;</span> ${esc(o)}</li>`).join("");

  const hasFutureOffer = site.offer.endsOn && new Date(site.offer.endsOn) > new Date();
  const priceHtml = (course.originalFee && hasFutureOffer)
    ? `<span class="price-current">₦${formatNaira(course.fee)}</span><span class="price-original"><s>₦${formatNaira(course.originalFee)}</s></span>`
    : `<span class="price-current">₦${formatNaira(course.fee)}</span>`;

  return `<article class="course-card${lead ? " course-card-lead" : ""}" data-course-track="${esc(course.track)}">
<div class="course-card-media">
  <img src="${esc(course.image)}" width="600" height="340" alt="${esc(course.title)}" loading="lazy">
</div>
<div class="course-card-body">
  <div class="course-card-meta">
    <span class="course-card-track">${esc(trackName(course.track))}</span>
    ${course.duration ? `<span class="course-duration-badge" title="Duration"><span aria-hidden="true">${svgIcons.clock}</span> ${esc(course.duration)}</span>` : ""}
  </div>
  <h3 class="course-card-title"><a class="course-card-link" href="${url}">${esc(course.title)}</a></h3>
  <p class="course-card-desc">${esc(course.subtitle)}</p>
  <ul class="course-card-outcomes" aria-label="Key outcomes">
    ${outcomesHtml}
  </ul>
  <div class="course-card-pricing-wrap">
    <div class="course-card-pricing">
      ${priceHtml}
    </div>
  </div>
  <div class="course-card-cta-row">
    <a class="button button-card-enrol" href="/apply/?course=${esc(course.slug)}">Enrol</a>
    <a class="button-card-details" href="${url}">Details <span class="arrow" aria-hidden="true">${svgIcons.arrowNe}</span></a>
  </div>
</div>
</article>`;
}

function renderHome() {
  const lead = site.leadCourses.map((slug) => courseBySlug.get(slug)).filter(Boolean);
  const serviceIcons = {
    "software-installation": "/assets/img/service-software.svg",
    "cctv-installation": "/assets/img/service-cctv.svg",
    "solar-installation": "/assets/img/service-solar.svg",
  };

  const serviceList = Object.entries(home.services.items).map(([slug, item]) => {
    const iconSrc = serviceIcons[slug] || "/assets/img/service-software.svg";
    return `
      <li class="home-service-item">
        <div class="service-item-icon-wrap" aria-hidden="true">
          <img class="service-item-icon" src="${iconSrc}" width="56" height="56" alt="" loading="lazy">
        </div>
        <div class="service-item-body">
          <h3>${esc(item.name)}</h3>
          <p>${esc(item.text)}</p>
          <a class="service-item-link" href="/quote/?service=${esc(slug)}">${esc(sharedCopy.buttons.quote)} ${svgIcons.arrowRight}</a>
        </div>
      </li>`;
  }).join("");
  const why = home.why.items.filter(([,], index) => index !== 2 || site.flags.showServicesClaim).map(([term, text]) => `<li><strong>${esc(term)}</strong> ${esc(text)}</li>`).join("");
  const testimonials = site.flags.showTestimonials && Array.isArray(site.testimonials) && site.testimonials.length
    ? `<section class="section" aria-labelledby="testimonials"><h2 id="testimonials">${esc(home.testimonials.heading)}</h2></section>`
    : "";
  const discount = site.flags.showDiscountBanner && site.discountNote && site.discountConfirmed
    ? `<div class="discount">${esc(site.discountNote)}</div>`
    : "";
  const inner = `${discount}
<section class="hero">
  <video class="hero-video" autoplay muted loop playsinline preload="none" poster="/assets/img/video-poster.webp" aria-hidden="true">
    <source src="/assets/video/ict-training.mp4" type="video/mp4">
    <p>Video of OCATECH training center in Onitsha.</p>
  </video>
  <div class="hero-video-overlay" aria-hidden="true"></div>
  <div class="wrap hero-grid">
    <div class="hero-text">
      <p class="hero-kicker">${esc(site.brand.descriptor)}</p>
      <h1>${esc(home.h1)}</h1>
      <p class="hero-copy">${esc(home.subheading)}</p>
      <div class="hero-actions">
        <a class="button button-wa" href="${esc(whatsapp(sharedCopy.whatsappPresets.general))}">${esc(sharedCopy.buttons.whatsapp)}</a>
        <a class="button button-quiet" href="/courses/">${esc(sharedCopy.buttons.allCourses)}</a>
      </div>
    </div>
    <div class="hero-instructor-wrap" aria-hidden="true">
      <img class="hero-instructor-img"
        src="/assets/img/instructor-guide-960.webp"
        srcset="/assets/img/instructor-guide-480.webp 480w, /assets/img/instructor-guide-960.webp 960w, /assets/img/instructor-guide-1600.webp 1600w"
        sizes="(min-width: 900px) 420px, 0px"
        width="960" height="540"
        alt="OCATECH instructor guiding students in digital skills training">
      <div class="hero-instructor-badge">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
        <span>Practical, hands-on training</span>
      </div>
    </div>
  </div>
</section>
<section class="section picker-section" aria-labelledby="picker-heading">
<div class="wrap">
<h2 id="picker-heading">${esc(home.picker.heading)}</h2>
<p>${esc(home.picker.helper)}</p>
<div id="skill-picker" class="picker" data-src="/assets/js/picker-data.json"></div>
${renderPickerFallback()}
<div id="picker-result" class="picker-result" aria-live="polite">${esc(home.picker.empty)}</div>
</div>
</section>
<section class="section facts-strip" aria-label="Key facts"><div class="wrap"><ul>${home.facts.map((fact) => `<li>${esc(fact)}</li>`).join("")}</ul></div></section>
<section class="section" aria-labelledby="lead-heading"><div class="wrap">
<h2 id="lead-heading">${esc(home.leadCourses.heading)}</h2>
<p>${esc(home.leadCourses.intro)}</p>
<div class="lead-grid">${lead.map((course) => courseCard(course, true)).join("")}</div>
<p><a class="text-link" href="/courses/">${esc(sharedCopy.buttons.allCourses)}</a></p>
</div></section>
<section class="section section-alt" aria-labelledby="how-heading"><div class="wrap">
<h2 id="how-heading">${esc(home.how.heading)}</h2>
<ol class="steps">${home.how.steps.map(([term, text]) => `<li><strong>${esc(term)}</strong> ${esc(text)}</li>`).join("")}</ol>
</div></section>
<section class="section home-paths-cta" aria-labelledby="paths-heading"><div class="wrap">
  <div class="paths-cta-card">
    <div class="paths-cta-text">
      <span class="path-badge">${esc(home.pathsCta.badge)}</span>
      <h2 id="paths-heading">${esc(home.pathsCta.heading)}</h2>
      <p>${esc(home.pathsCta.text)}</p>
      <div class="hero-actions">
        <a class="button" href="/paths/">${esc(home.pathsCta.button)} ${svgIcons.arrowRight}</a>
        <a class="button button-wa" href="${esc(whatsapp(sharedCopy.whatsappPresets.general))}">${esc(sharedCopy.buttons.whatsapp)}</a>
      </div>
    </div>
    <div class="paths-cta-chips-grid" aria-hidden="true">
      <div class="paths-pill-item"><span class="pill-icon">${svgIcons.globe}</span><span>Web Development</span></div>
      <div class="paths-pill-item"><span class="pill-icon">${svgIcons.bot}</span><span>Artificial Intelligence</span></div>
      <div class="paths-pill-item"><span class="pill-icon">${svgIcons["bar-chart"]}</span><span>Data Analytics</span></div>
      <div class="paths-pill-item"><span class="pill-icon">${svgIcons.palette}</span><span>Design &amp; Media</span></div>
      <div class="paths-pill-item"><span class="pill-icon">${svgIcons["trending-up"]}</span><span>Business Growth</span></div>
      <div class="paths-pill-item"><span class="pill-icon">${svgIcons.tool}</span><span>Hardware &amp; IT</span></div>
    </div>
  </div>
</div></section>
<section class="section section-alt home-services-section" aria-labelledby="services-heading">
  <div class="wrap">
    <div class="home-services-grid">
      <div class="home-services-left">
        <div class="section-title-wrap">
          <span class="path-badge">Technical Installations</span>
          <h2 id="services-heading">${esc(home.services.heading)}</h2>
          <p class="section-subtitle">${esc(home.services.intro)}</p>
        </div>
        
        <figure class="home-services-media">
          <img src="/assets/img/services-showcase-960.webp"
               srcset="/assets/img/services-showcase-480.webp 480w, /assets/img/services-showcase-960.webp 960w, /assets/img/services-showcase.webp 1376w"
               sizes="(min-width: 860px) 480px, 100vw"
               width="960" height="536"
               loading="lazy"
               alt="OCATECH technical installations: CCTV surveillance, solar power inverters, and computer software setup in Onitsha">
          <figcaption class="home-services-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
            <span>On-site setup by our team · Onitsha &amp; nearby towns</span>
          </figcaption>
        </figure>
      </div>

      <div class="home-services-right">
        <ul class="home-services-list">
          ${serviceList}
        </ul>
        <div class="home-services-actions">
          <a class="button button-quiet" href="/services/">${esc(home.services.link)} ${svgIcons.arrowRight}</a>
          <a class="button button-wa" href="${esc(whatsapp(sharedCopy.whatsappPresets.service.replace("{service}", "a technical service")))}">
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </div>
  </div>
</section>
<section class="section" aria-labelledby="why-heading"><div class="wrap">
<h2 id="why-heading">${esc(home.why.heading)}</h2>
<ul class="why-list">${why}</ul>
</div></section>
${testimonials}
<section class="section" aria-labelledby="home-faq-heading"><div class="wrap">
<h2 id="home-faq-heading">${esc(home.questions.heading)}</h2>
${renderFaq(faq.slice(0, homeFaqCount))}
</div></section>
<section class="section section-alt closing"><div class="wrap">
<h2>${esc(home.closing.heading)}</h2>
<p>${esc(home.closing.text)}</p>
<div class="hero-actions">
<a class="button button-wa" href="${esc(whatsapp(sharedCopy.whatsappPresets.general))}">${esc(sharedCopy.buttons.whatsapp)}</a>
<a class="button" href="/apply/">${esc(sharedCopy.buttons.applyNow)}</a>
</div>
</div></section>`;
  return {
    title: home.seoTitle,
    description: home.seoDescription,
    canonical: urls.home + "/",
    inner,
    jsonLd: [homeJsonLd(), faqJsonLd(faq.slice(0, homeFaqCount), urls.for("/"))],
    extraScripts: [assets.picker],
  };
}

function renderCourses() {
  const tracks = [{ id: "all", name: "All" }, ...site.tracks];
  const params = new URLSearchParams();
  const filters = tracks.map((track) => {
    params.set("track", track.id);
    const href = track.id === "all" ? "/courses/" : `/courses/?${params.toString()}`;
    return `<a class="filter-link" data-track-filter="${esc(track.id)}" href="${esc(href)}">${esc(track.name)}</a>`;
  }).join("");
  const cards = courseData.map((course) => courseCard(course)).join("");
  const inner = `<section class="page-head wrap">
<h1>${esc(coursesPage.h1)}</h1>
<p>${esc(coursesPage.intro)}</p>
<div class="courses-paths-banner">
  <div class="banner-text">
    <strong>Not sure what comes next?</strong>
    <p>Explore our step-by-step career roadmaps to see how courses connect from beginner to advanced.</p>
  </div>
  <a class="button button-small button-quiet" href="/paths/">View Learning Paths ${svgIcons.arrowRight}</a>
</div>
</section>
<section class="section"><div class="wrap">
<nav class="filters" aria-label="Filter courses by track">${filters}</nav>
<div id="course-list" class="course-grid">${cards}</div>
<p>${esc(coursesPage.empty)} <a class="text-link" href="${esc(whatsapp(sharedCopy.whatsappPresets.general))}">${esc(sharedCopy.buttons.whatsapp)}</a> and tell us your goal.</p>
</div></section>`;
  return { title: coursesPage.seoTitle, description: coursesPage.seoDescription, canonical: urls.for("/courses/"), inner, jsonLd: [] };
}

function renderPaths() {
  const stepLabels = ["Digital Foundation", "Core Skill", "Specialization", "Advanced Practice", "Capstone Project"];

  const pathCards = site.paths.map((path) => {
    const meta = pathsPage.meta[path.id] || {};
    const courses = path.courses.map((slug) => courseBySlug.get(slug)).filter(Boolean);
    const startCourse = courses[0];
    const applyUrl = `/apply/?course=${esc(startCourse?.slug || "")}`;
    const waUrl = whatsapp(`Hello OCATECH, I want to learn more about the ${path.name} learning path.`);

    const steps = courses.map((course, idx) => {
      const stepName = stepLabels[idx] || `Stage 0${idx + 1}`;
      const formatNaira = (num) => Number(num || 0).toLocaleString("en-NG");
      return `<li class="roadmap-step"><div class="step-marker" aria-hidden="true"><span class="step-num">0${idx + 1}</span>${idx < courses.length - 1 ? '<span class="step-line"></span>' : ""}</div><div class="step-body"><div class="step-header"><span class="step-stage-tag">${esc(stepName)}</span><span class="step-level-tag">${esc(course.level)}</span></div><h3 class="step-title"><a href="/courses/${esc(course.slug)}/">${esc(course.title)}</a></h3><p class="step-desc">${esc(course.summary || course.subtitle)}</p><div class="step-footer"><span class="step-fee">₦${formatNaira(course.fee)}</span><a class="step-link" href="/courses/${esc(course.slug)}/">Course details ${svgIcons.arrowRight}</a></div></div></li>`;
    }).join("");

    return `<article class="path-card" id="${esc(path.id)}" data-category="${esc(meta.category || 'all')}"><header class="path-card-header"><div class="path-badge-strip"><span class="path-category-pill">${esc(meta.badge || "Career Path")}</span><span class="path-level-pill">${courses.length} sequential courses</span></div><div class="path-title-wrap"><span class="path-icon" aria-hidden="true">${svgIcons[meta.icon] || svgIcons.globe}</span><div><h2 class="path-title">${esc(path.name)}</h2><p class="path-tagline">${esc(meta.tagline || "")}</p></div></div><p class="path-description">${esc(meta.description || "")}</p><div class="path-outcomes"><div class="outcome-item"><span class="outcome-label">Target Roles:</span><span class="outcome-value">${esc(meta.targetRoles || "Tech Professional")}</span></div><div class="outcome-item"><span class="outcome-label">Key Outcome:</span><span class="outcome-value">${esc(meta.outcome || "")}</span></div></div></header><div class="path-roadmap-wrap"><h3 class="roadmap-heading">Recommended Sequence:</h3><ol class="roadmap-list">${steps}</ol></div><footer class="path-card-actions"><div class="path-actions-left"><a class="button button-small" href="${applyUrl}">Apply for this Path ${svgIcons.arrowRight}</a><a class="button button-small button-wa" href="${esc(waUrl)}">Chat with Advisor</a></div><span class="path-admissions-note">Open admissions · Learn at your pace</span></footer></article>`;
  }).join("");

  const howPoints = (pathsPage.howItWorks.points || []).map(([title, desc], idx) => `
    <div class="path-how-card">
      <span class="how-num">0${idx + 1}</span>
      <h3>${esc(title)}</h3>
      <p>${esc(desc)}</p>
    </div>`).join("");

  const inner = `${renderBreadcrumbs([["Home", "/"], ["Paths", "/paths/"]])}<section class="paths-hero">
  <div class="wrap">
    <div class="paths-hero-content">
      <div class="paths-kicker-badge">
        <span class="pulse-dot" aria-hidden="true"></span>
        <span>${esc(pathsPage.kicker)}</span>
      </div>
      <h1>${esc(pathsPage.h1)}</h1>
      <p class="paths-hero-lead">${esc(pathsPage.lead)}</p>
      
      <div class="paths-hero-trust" aria-label="Key highlights">
        <span class="trust-pill"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> 6 Structured Tracks</span>
        <span class="trust-pill"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> From Absolute Beginner</span>
        <span class="trust-pill"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> Recognized Certificates</span>
      </div>
    </div>
  </div>
</section>

<section class="section paths-main-section">
  <div class="wrap">
    <div class="paths-intro-bar">
      <div>
        <p class="hero-kicker">End-to-End Progression</p>
        <h2>Select your career destination</h2>
        <p class="section-subtitle">Each path is logically sequenced so you always build on what you previously mastered.</p>
      </div>
    </div>

    <div class="paths-grid">
      ${pathCards}
    </div>
  </div>
</section>

<section class="section section-alt paths-how-section">
  <div class="wrap">
    <div class="section-title-wrap text-center">
      <p class="hero-kicker">Guaranteed Clarity</p>
      <h2>${esc(pathsPage.howItWorks.heading)}</h2>
      <p class="section-subtitle">Designed to help you build real-world capability without tutorial frustration.</p>
    </div>
    <div class="paths-how-grid">
      ${howPoints}
    </div>
  </div>
</section>

<section class="section paths-advisory-section">
  <div class="wrap">
    <div class="paths-advisory-box">
      <div class="paths-advisory-text">
        <span class="path-badge">Personalized Assessment</span>
        <h2>${esc(pathsPage.advisory.heading)}</h2>
        <p>${esc(pathsPage.advisory.text)}</p>
      </div>
      <div class="paths-advisory-actions">
        <a class="button button-wa" href="${esc(whatsapp(sharedCopy.whatsappPresets.general))}">${esc(pathsPage.advisory.whatsappBtn)}</a>
        <a class="button button-quiet" href="/apply/">${esc(pathsPage.advisory.applyBtn)} &rarr;</a>
      </div>
    </div>
  </div>
</section>`;

  return {
    title: pathsPage.seoTitle,
    description: pathsPage.seoDescription,
    canonical: urls.for("/paths/"),
    inner,
    jsonLd: [],
  };
}

function renderShowcase() {
  const projectCards = courseData.map((course) => `
    <article class="showcase-card" data-course-track="${esc(course.track)}">
      <div class="showcase-body">
        <div class="showcase-badge-row">
          <span class="showcase-cat-badge">${esc(trackName(course.track))}</span>
          <span class="showcase-brief-tag">Sample project brief</span>
        </div>
        <h3 class="showcase-title">${esc(course.title)}</h3>
        <p class="showcase-summary">${esc(course.finalProject)}</p>
        <div class="showcase-tools">
          ${course.tools.map((t) => `<span class="tool-tag">${esc(t)}</span>`).join("")}
        </div>
        <div class="showcase-footer">
          <a class="showcase-course-link" href="/courses/${esc(course.slug)}/">View course details ${svgIcons.arrowRight}</a>
        </div>
      </div>
    </article>
  `).join("");

  let studentWorkHtml = "";
  if (site.flags.showStudentWork) {
    try {
      const studentWork = readJSON("data/student-work.json");
      const confirmed = Array.isArray(studentWork) ? studentWork.filter((item) => item.permissionConfirmed === true) : [];
      if (confirmed.length > 0) {
        studentWorkHtml = `<section class="section" aria-labelledby="student-work-heading">
          <div class="wrap">
            <h2 id="student-work-heading">Student work</h2>
          </div>
        </section>`;
      }
    } catch (e) {}
  }

  const inner = `${renderBreadcrumbs([["Home", "/"], ["Projects", "/showcase/"]])}<section class="page-head wrap text-center">
<span class="eyebrow">Projects</span>
<h1>${esc(showcasePage.h1)}</h1>
<p class="section-lead">${esc(showcasePage.intro)}</p>
</section>

<section class="section" aria-labelledby="showcase-list-heading">
<div class="wrap">
  <div class="showcase-grid">
    ${projectCards}
  </div>
</div>
</section>
${studentWorkHtml}
<section class="section section-alt closing">
<div class="wrap">
  <h2>${esc(showcasePage.cta.heading)}</h2>
  <p>${esc(showcasePage.cta.text)}</p>
  <div class="hero-actions">
    <a class="button" href="/apply/">${esc(showcasePage.cta.applyBtn)}</a>
    <a class="button button-wa" href="${esc(whatsapp(sharedCopy.whatsappPresets.general))}">${esc(showcasePage.cta.whatsappBtn)}</a>
  </div>
</div>
</section>`;

  return {
    title: showcasePage.seoTitle,
    description: showcasePage.seoDescription,
    canonical: urls.for("/showcase/"),
    inner,
    jsonLd: [breadcrumbJsonLd([["Home", urls.home], ["Projects you will build", urls.for("/showcase/")]])],
  };
}

function renderCourse(course) {
  const track = trackById.get(course.track);
  const formatNaira = (num) => Number(num || 0).toLocaleString("en-NG");
  const payFaq = faq.find(([q]) => q === "How can I pay?");
  const courseFaq = [
    [courseTemplate.qExperience, course.prerequisites],
    [courseTemplate.qOnline, courseTemplate.aOnline],
    [courseTemplate.qEnd, courseTemplate.aEnd],
    ...(payFaq ? [payFaq] : []),
  ];
  const next = course.nextSteps.map((slug) => courseBySlug.get(slug)).filter(Boolean)
    .map((item) => `<li><a href="/courses/${esc(item.slug)}/">${esc(item.title)}</a></li>`).join("");

  const hasFutureOffer = site.offer.endsOn && new Date(site.offer.endsOn) > new Date();
  const heroPricingHtml = (course.originalFee && hasFutureOffer)
    ? `<div class="hero-pricing">
        <span class="price-val">₦${formatNaira(course.fee)}</span>
        <span class="price-orig"><s>₦${formatNaira(course.originalFee)}</s></span>
        <span class="price-offer-label">${site.offer.label || "Launch price"} until ${esc(new Date(site.offer.endsOn).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" }))}</span>
      </div>`
    : `<div class="hero-pricing">
        <span class="price-val">₦${formatNaira(course.fee)}</span>
      </div>`;

  const inner = `<article class="course-page">
${renderBreadcrumbs([["Home", "/"], ["Courses", "/courses/"], [course.title, `/courses/${course.slug}/`]])}
<header class="page-head wrap">
<span class="course-track-pill">${esc(trackName(course.track))}</span>
<h1>${esc(course.title)}</h1>
<p class="course-subtitle">${esc(course.subtitle)}</p>
<p class="course-lead-copy">${esc(course.summary)}</p>
<div class="course-hero-bar">
  ${heroPricingHtml}
  <div class="hero-actions">
    <a class="button" href="/apply/?course=${esc(course.slug)}">${esc(sharedCopy.buttons.applyCourse)}</a>
    <a class="button button-wa" href="${esc(whatsapp(sharedCopy.whatsappPresets.course.replace("{course}", course.title)))}">${esc(sharedCopy.buttons.whatsapp)}</a>
  </div>
</div>
</header>

<section class="section" aria-labelledby="specs-heading">
<div class="wrap">
<h2 id="specs-heading" class="section-title">Course Specifications</h2>
<div class="specs-grid">
  <div class="spec-card">
    <span class="spec-icon" aria-hidden="true">${svgIcons.clock}</span>
    <div class="spec-info">
      <h3>Duration &amp; Schedule</h3>
      <p>${esc(course.duration || "Flexible pace")} · Weekdays &amp; weekends</p>
    </div>
  </div>
  <div class="spec-card">
    <span class="spec-icon" aria-hidden="true">${svgIcons.pin}</span>
    <div class="spec-info">
      <h3>Training Format</h3>
      <p>In-person in Onitsha · Online available for select courses</p>
    </div>
  </div>
  <div class="spec-card">
    <span class="spec-icon" aria-hidden="true">${svgIcons.grad}</span>
    <div class="spec-info">
      <h3>Skill Level</h3>
      <p>${esc(course.level)} · Practical hands-on training</p>
    </div>
  </div>
  <div class="spec-card">
    <span class="spec-icon" aria-hidden="true">${svgIcons.laptop}</span>
    <div class="spec-info">
      <h3>Equipment &amp; Facilities</h3>
      <p>Computers provided for practical classes · Stable power supply</p>
    </div>
  </div>
  <div class="spec-card">
    <span class="spec-icon" aria-hidden="true">${svgIcons.award}</span>
    <div class="spec-info">
      <h3>Certification</h3>
      <p>${esc(site.offer.certificate)}</p>
    </div>
  </div>
  <div class="spec-card">
    <span class="spec-icon" aria-hidden="true">${svgIcons.card}</span>
    <div class="spec-info">
      <h3>Tuition &amp; Plans</h3>
      <p>₦${formatNaira(course.fee)} · Installment plans available</p>
    </div>
  </div>
</div>
</div>
</section>

<section class="section section-alt" aria-labelledby="curriculum-heading">
<div class="wrap">
<h2 id="curriculum-heading">${esc(courseTemplate.outcomes)}</h2>
<div class="curriculum-grid">
  ${course.outcomes.map((item, idx) => `
  <div class="curriculum-card">
    <span class="curriculum-num">${String(idx + 1).padStart(2, "0")}</span>
    <p>${esc(item)}</p>
  </div>`).join("")}
</div>
<div class="syllabus-download-banner">
  <div class="syllabus-banner-info">
    <span class="syllabus-badge">${svgIcons.award} Course Syllabus</span>
    <h3>Want the complete week-by-week module breakdown?</h3>
    <p>Get the detailed class timetable, practical exercise outlines and capstone project guide delivered directly to your WhatsApp.</p>
  </div>
  <div class="syllabus-banner-action">
    <a class="button button-wa" href="${esc(whatsapp(sharedCopy.whatsappPresets.course.replace("{course}", course.title)))}">${esc(sharedCopy.buttons.whatsapp)}</a>
  </div>
</div>
</div>
</section>

<section class="section" aria-labelledby="tools-heading">
<div class="wrap">
<h2 id="tools-heading">${esc(courseTemplate.tools)}</h2>
<div class="tools-pills-wrap">
  ${course.tools.map((item) => `<span class="tool-badge">${esc(item)}</span>`).join("")}
</div>
</div>
</section>

<section class="section section-alt" aria-labelledby="project-heading">
<div class="wrap">
<h2 id="project-heading">${esc(courseTemplate.finalProject)}</h2>
<div class="capstone-card">
  <span class="capstone-badge">Portfolio Deliverable</span>
  <p class="capstone-desc">${esc(course.finalProject)}</p>
</div>
</div>
</section>

<section class="section" aria-labelledby="audience-heading">
<div class="wrap two-col-info">
  <div class="info-card">
    <h2 id="audience-heading">${esc(courseTemplate.whoFor)}</h2>
    <p>${esc(course.whoFor)}</p>
  </div>
  <div class="info-card">
    <h2>${esc(courseTemplate.prerequisites)}</h2>
    <p>${esc(course.prerequisites)}</p>
    ${course.note ? `<p class="note">${esc(course.note)}</p>` : ""}
  </div>
</div>
</section>

<section class="section section-alt" aria-labelledby="tuition-heading">
<div class="wrap">
  <div class="section-head text-center">
    <span class="eyebrow">Tuition &amp; Flexible Payments</span>
    <h2 id="tuition-heading">Transparent Fees, No Hidden Charges</h2>
    <p class="tuition-lead">Start your practical training in Onitsha with a single payment or spread your investment with flexible installment milestones.</p>
  </div>

  ${site.flags.showFees && course.fee ? `
  <div class="installments-grid">
    <div class="installment-plan-card">
      <div class="plan-header">
        <span class="plan-tier-badge">Option 1 · Full Payment</span>
        <h3 class="plan-title">Single Tuition</h3>
        <p class="plan-desc">Pay once at registration and focus 100% on learning with zero payment worries.</p>
      </div>
      <div class="plan-price-wrap">
        <span class="plan-price">₦${formatNaira(course.fee)}</span>
      </div>
      <ul class="plan-perks-list">
        <li><span class="check-mark">&#x2713;</span> Full course access &amp; lab computer</li>
        <li><span class="check-mark">&#x2713;</span> Dedicated instructor mentoring</li>
        <li><span class="check-mark">&#x2713;</span> Stable power supply for practical sessions</li>
        <li><span class="check-mark">&#x2713;</span> Certificate of completion</li>
      </ul>
      <a class="button button-block" href="/apply/?course=${esc(course.slug)}">${esc(sharedCopy.buttons.applyCourse)}</a>
    </div>

    <div class="installment-plan-card featured-plan">
      <div class="plan-header">
        <span class="plan-tier-badge">Option 2 · 2-Part Split</span>
        <h3 class="plan-title">50 / 50 Installment</h3>
        <p class="plan-desc">Start right away with 50% deposit. Pay the balance midway through the program.</p>
      </div>
      <div class="plan-price-wrap">
        <span class="plan-price">₦${formatNaira(Math.round(course.fee * 0.5))} <span class="plan-price-period">to start</span></span>
        <span class="plan-split-sub">Then ₦${formatNaira(course.fee - Math.round(course.fee * 0.5))} at mid-term</span>
      </div>
      <ul class="plan-perks-list">
        <li><span class="check-mark">&#x2713;</span> Enrol immediately with 50% deposit</li>
        <li><span class="check-mark">&#x2713;</span> Mid-term balance halfway through</li>
        <li><span class="check-mark">&#x2713;</span> Full access to computers &amp; tools</li>
        <li><span class="check-mark">&#x2713;</span> Certificate upon full completion</li>
      </ul>
      <a class="button button-block" href="/apply/?course=${esc(course.slug)}">Enrol with 2 Payments ${svgIcons.arrowRight}</a>
    </div>

    <div class="installment-plan-card">
      <div class="plan-header">
        <span class="plan-tier-badge">Option 3 · 3-Stage Milestone</span>
        <h3 class="plan-title">40 / 30 / 30 Plan</h3>
        <p class="plan-desc">Maximum flexibility across three study milestones as you hit project checkpoints.</p>
      </div>
      <div class="plan-price-wrap">
        <span class="plan-price">₦${formatNaira(Math.round(course.fee * 0.4))} <span class="plan-price-period">to start</span></span>
        <span class="plan-split-sub">₦${formatNaira(Math.round(course.fee * 0.3))} month 2 &middot; ₦${formatNaira(course.fee - Math.round(course.fee * 0.4) - Math.round(course.fee * 0.3))} final milestone</span>
      </div>
      <ul class="plan-perks-list">
        <li><span class="check-mark">&#x2713;</span> 40% initial deposit at sign-up</li>
        <li><span class="check-mark">&#x2713;</span> 30% second installment at month 2</li>
        <li><span class="check-mark">&#x2713;</span> 30% balance before capstone project</li>
        <li><span class="check-mark">&#x2713;</span> Certificate upon final completion</li>
      </ul>
      <a class="button button-outline button-block" href="/apply/?course=${esc(course.slug)}">Apply on 3-Part Plan ${svgIcons.arrowRight}</a>
    </div>
  </div>
  ` : `
  <div class="tuition-card">
    <div class="tuition-content">
      <h2 id="tuition-heading">Tuition &amp; Enrolment</h2>
      <p class="tuition-lead">Gain in-demand practical skills with step-by-step instructor guidance in Onitsha.</p>
      <p class="tuition-note">${esc(site.offer.feeNote)} Payment methods: ${site.offer.paymentMethods.join(", ")}.</p>
    </div>
    <div class="tuition-actions">
      <a class="button" href="/apply/?course=${esc(course.slug)}">${esc(sharedCopy.buttons.applyCourse)}</a>
      <a class="button button-wa" href="${esc(whatsapp(sharedCopy.whatsappPresets.course.replace("{course}", course.title)))}">${esc(sharedCopy.buttons.whatsapp)}</a>
    </div>
  </div>
  `}

  <div class="tuition-footer-note">
    <p class="tuition-note">${svgIcons.card} Accepted payment methods: ${site.offer.paymentMethods.join(", ")}. No hidden computer usage fees or unexpected levies.</p>
    <a class="button button-wa" href="${esc(whatsapp(sharedCopy.whatsappPresets.course.replace("{course}", course.title)))}">${esc(sharedCopy.buttons.whatsapp)}</a>
  </div>
</div>
</section>

${next ? `<section class="section"><div class="wrap"><h2>${esc(courseTemplate.nextSteps)}</h2><ul class="plain-list">${next}</ul></div></section>` : ""}

<section class="section section-alt" aria-labelledby="faq-heading">
<div class="wrap">
<h2 id="faq-heading">${esc(courseTemplate.questions)}</h2>
${renderFaq(courseFaq)}
</div>
</section>

<section class="section closing"><div class="wrap">
<h2>${esc(courseTemplate.closing.replace("{course}", course.shortName || course.title))}</h2>
<div class="hero-actions">
<a class="button" href="/apply/?course=${esc(course.slug)}">${esc(sharedCopy.buttons.applyCourse)}</a>
<a class="button button-wa" href="${esc(whatsapp(sharedCopy.whatsappPresets.course.replace("{course}", course.title)))}">${esc(sharedCopy.buttons.whatsapp)}</a>
</div>
<p><a class="text-link" href="/courses/">${esc(sharedCopy.buttons.allCourses)}</a></p>
</div></section>
</article>`;
  return {
    title: course.seoTitle,
    description: course.metaDescription,
    canonical: urls.for(`/courses/${course.slug}/`),
    inner,
    jsonLd: [courseJsonLd(course), faqJsonLd(courseFaq, urls.for(`/courses/${course.slug}/`))],
  };
}

function renderServices() {
  const serviceIcons = {
    "software-installation": '<img src="/assets/img/service-software.svg" width="40" height="40" alt="" class="service-img-icon">',
    "cctv-installation": '<img src="/assets/img/service-cctv.svg" width="40" height="40" alt="" class="service-img-icon">',
    "solar-installation": '<img src="/assets/img/service-solar.svg" width="40" height="40" alt="" class="service-img-icon">',
  };
  const fallbackIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
  const checkIcon = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';

  const cards = Object.entries(services.items).map(([slug, item]) => {
    const icon = serviceIcons[slug] || fallbackIcon;
    const waText = sharedCopy.whatsappPresets.service.replace("{service}", item.name);
    const waUrl = whatsapp(waText);
    const highlights = (item.highlights || []).map((pt) => `<li><span class="service-check" aria-hidden="true">${checkIcon}</span><span>${esc(pt)}</span></li>`).join("");

    return `
    <article class="service-card" id="service-${esc(slug)}">
      <div class="service-card-top">
        <span class="service-icon" aria-hidden="true">${icon}</span>
        <span class="service-tag">${esc(item.tag || "Installation")}</span>
      </div>
      <h2 class="service-title">${esc(item.name)}</h2>
      <p class="service-text">${esc(item.text)}</p>
      ${highlights ? `<ul class="service-highlights">${highlights}</ul>` : ""}
      <div class="service-card-actions">
        <a class="button button-small" href="/quote/?service=${esc(slug)}">${esc(sharedCopy.buttons.quote)}</a>
        <a class="service-wa-link" href="${esc(waUrl)}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.998 2C6.472 2 2 6.481 2 12.015a10.02 10.02 0 0 0 1.401 5.146L2 22l4.998-1.313A9.956 9.956 0 0 0 12 22c5.514 0 10-4.481 10-10.015S17.514 2 11.998 2z" fill-rule="evenodd" clip-rule="evenodd"/></svg>
          Ask on WhatsApp
        </a>
      </div>
    </article>`;
  }).join("");

  const processSteps = (services.process || []).map(([title, desc], idx) => `
    <div class="service-process-card">
      <span class="process-num">0${idx + 1}</span>
      <h3>${esc(title)}</h3>
      <p>${esc(desc)}</p>
    </div>`).join("");

  const inner = `${renderBreadcrumbs([["Home", "/"], ["Services", "/services/"]])}<section class="services-hero">
  <div class="wrap">
    <div class="services-hero-content">
      <div class="services-kicker-badge">
        <span class="pulse-dot" aria-hidden="true"></span>
        <span>On-Site Technical &amp; Power Solutions</span>
      </div>
      <h1>${esc(services.h1)}</h1>
      <p class="services-lead">${esc(services.intro)}</p>
      <div class="services-trust-strip">
        <span class="trust-pill"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg> Onitsha · Nkpor · Obosi · Awka</span>
        <span class="trust-pill"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg> Homes &amp; Businesses</span>
        <span class="trust-pill"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> Professional On-Site Setup</span>
      </div>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="services-list-heading">
  <div class="wrap">
    <div class="section-title-wrap">
      <p class="hero-kicker">Our Offerings</p>
      <h2 id="services-list-heading">Available installation services</h2>
      <p class="section-subtitle">High-standard technical setup executed by our team.</p>
    </div>
    <div class="services-grid">${cards}</div>
  </div>
</section>

<section class="section section-alt" aria-labelledby="service-process-heading">
  <div class="wrap">
    <div class="section-title-wrap text-center">
      <p class="hero-kicker">How It Works</p>
      <h2 id="service-process-heading">${esc(services.processHeading)}</h2>
      <p class="section-subtitle">${esc(services.processIntro)}</p>
    </div>
    <div class="service-process-grid">${processSteps}</div>
  </div>
</section>

<section class="section closing" aria-labelledby="services-closing-heading">
  <div class="wrap service-closing-wrap">
    <div>
      <h2 id="services-closing-heading">${esc(services.closing.heading)}</h2>
      <p>${esc(services.closing.text)}</p>
    </div>
    <div class="hero-actions">
      <a class="button" href="/quote/">${esc(sharedCopy.buttons.quote)}</a>
      <a class="button button-wa" href="${esc(whatsapp(sharedCopy.whatsappPresets.general))}">${esc(sharedCopy.buttons.whatsapp)}</a>
    </div>
  </div>
</section>`;
  return { title: services.seoTitle, description: services.seoDescription, canonical: urls.for("/services/"), inner, jsonLd: [breadcrumbJsonLd([["Home", urls.home], ["Services", urls.for("/services/")]])] };
}

function renderAbout() {
  const founder = site.flags.showFounder ? `<p>${esc(site.brand.founder.title)}: ${esc(site.brand.founder.name)}.</p>` : "";
  const pillarIcons = [
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  ];
  const checkIcon = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';

  const pillars = about.pillars.map((item, idx) => {
    const icon = pillarIcons[idx] || pillarIcons[0];
    const points = (item.points || []).map((pt) => `<li><span class="pillar-check" aria-hidden="true">${checkIcon}</span><span>${esc(pt)}</span></li>`).join("");
    return `
    <article class="pillar-card">
      <div class="pillar-card-top">
        <span class="pillar-icon" aria-hidden="true">${icon}</span>
        <span class="pillar-tag">${esc(item.tag || "Core")}</span>
      </div>
      <h3>${esc(item.title)}</h3>
      <p class="pillar-text">${esc(item.text)}</p>
      ${points ? `<ul class="pillar-points">${points}</ul>` : ""}
    </article>`;
  }).join("");

  const approach = about.approach.map(([title, text], idx) => `
    <div class="approach-grid-card">
      <span class="approach-num">${String(idx + 1).padStart(2, "0")}</span>
      <h3>${esc(title)}</h3>
      <p>${esc(text)}</p>
    </div>`).join("");

  const inner = `<section class="about-hero-section">
  <div class="wrap about-hero-grid">
    <div class="about-hero-text">
      <div class="about-kicker-badge">
        <span class="pulse-dot" aria-hidden="true"></span>
        <span>${esc(site.brand.descriptor)}</span>
      </div>
      <h1>${esc(about.h1)}</h1>
      <p class="about-lead">${esc(about.who)}${site.flags.showServicesClaim ? esc(about.onePlaceClaim) : "."}</p>
      <div class="hero-actions">
        <a class="button" href="/courses/">${esc(sharedCopy.buttons.allCourses)}</a>
        <a class="button button-wa" href="${esc(whatsapp(sharedCopy.whatsappPresets.general))}">${esc(sharedCopy.buttons.whatsapp)}</a>
      </div>
      <div class="about-hero-trust" aria-label="Key highlights">
        <span class="trust-pill"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> Registered BN 9677251</span>
        <span class="trust-pill"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> Mon–Sat 8AM–6PM</span>
        <span class="trust-pill"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> Stable Power Supply</span>
      </div>
    </div>
    <div class="about-hero-media-wrap">
      <figure class="about-hero-media">
        <img src="/assets/img/training-960.webp" srcset="/assets/img/training-480.webp 480w, /assets/img/training-960.webp 960w, /assets/img/training-1600.webp 1600w" sizes="(min-width: 820px) 520px, 100vw" width="960" height="540" alt="Students learning practical digital skills at OCATECH Digital Solutions in Onitsha">
        <figcaption class="hero-media-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span><strong>62 New Market Road, Onitsha</strong> · Beside Glo Office &amp; Mr Bigs</span>
        </figcaption>
      </figure>
    </div>
  </div>
</section>

<section class="section section-pillars" aria-labelledby="pillars-heading">
  <div class="wrap">
    <div class="section-title-wrap text-center">
      <p class="hero-kicker">Guiding Principles</p>
      <h2 id="pillars-heading">Our Mission, Vision &amp; Goal</h2>
      <p class="section-subtitle">The standard behind our teaching, mentorship and technology solutions in Onitsha.</p>
    </div>
    <div class="pillars-grid">${pillars}</div>
  </div>
</section>

<section class="section facts-strip" aria-label="Verified center facts">
  <div class="wrap">
    <ul>
      <li><strong>${courseData.length}</strong> Practical courses</li>
      <li><strong>${site.tracks.length}</strong> Learning tracks</li>
      <li><strong>BN 9677251</strong> Registered business</li>
      <li><strong>Mon–Sat</strong> Open 8AM–6PM</li>
    </ul>
  </div>
</section>

<section class="section" aria-labelledby="approach-heading">
  <div class="wrap">
    <div class="section-title-wrap">
      <p class="hero-kicker">How We Teach</p>
      <h2 id="approach-heading">${esc(about.approachHeading)}</h2>
      <p class="section-subtitle">${esc(about.approachIntro)}</p>
    </div>
    <div class="approach-grid">${approach}</div>
  </div>
</section>

<section class="section section-alt" aria-labelledby="inside-about-heading">
  <div class="wrap">
    <div class="section-title-wrap text-center">
      <p class="hero-kicker">Center Facilities</p>
      <h2 id="inside-about-heading">Inside our Onitsha center</h2>
      <p class="section-subtitle">Practical training space with computers provided and stable power supply.</p>
    </div>
    <div class="about-video-wrap">
      <video class="center-video" controls playsinline preload="none" poster="/assets/img/video-poster.webp"><source src="/assets/video/ict-training.mp4" type="video/mp4"><p>Video tour of our Onitsha training center.</p></video>
      <p class="video-transcript-note">Can't play the video? <a class="text-link" href="${esc(whatsapp(sharedCopy.whatsappPresets.general))}">Message us on WhatsApp</a> for a live tour.</p>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="about-scope-heading">
  <div class="wrap two-col-info">
    <div class="info-card">
      <h2 id="about-scope-heading">What we do</h2>
      <p>${esc(about.what)}</p>
    </div>
    <div class="info-card">
      <h2>Who we teach</h2>
      <p>${esc(about.audiences)}</p>
      <p class="about-reg">${esc(about.registered)}</p>
      ${founder}
    </div>
  </div>
</section>

<section class="section section-alt closing" aria-labelledby="about-visit-heading">
  <div class="wrap about-closing">
    <div>
      <h2 id="about-visit-heading">Visit us in Onitsha</h2>
      <p>${esc(site.contact.addressLine)}, ${esc(site.contact.city)}, ${esc(site.contact.state)}.</p>
      ${site.contact.landmarkOrDirections ? `<p class="contact-muted">${esc(site.contact.landmarkOrDirections)}</p>` : ""}
      ${site.contact.hours ? `<p class="contact-hours">Open ${esc(site.contact.hours)}.</p>` : ""}
    </div>
    <div class="hero-actions">
      <a class="button" href="/apply/">${esc(sharedCopy.buttons.applyNow)}</a>
      ${site.contact.googleMapsUrl ? `<a class="button button-quiet" href="${esc(site.contact.googleMapsUrl)}">Get directions ${svgIcons.arrowNe}</a>` : ""}
    </div>
  </div>
</section>`;
  return { title: about.seoTitle, description: about.seoDescription, canonical: urls.for("/about/"), inner, jsonLd: [] };
}

function renderApply() {
  const groups = site.tracks.map((track) => `<optgroup label="${esc(track.name)}">${courseData.filter((course) => course.track === track.id).map((course) => `<option value="${esc(course.slug)}">${esc(course.title)}</option>`).join("")}</optgroup>`).join("");
  const statusOptions = (applyCopy.statuses || []).map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join("");
  const goalOptions = (applyCopy.goals || []).map((g) => `<option value="${esc(g)}">${esc(g)}</option>`).join("");
  const laptopOptions = (applyCopy.laptopOptions || []).map((l) => `<option value="${esc(l)}">${esc(l)}</option>`).join("");
  const referralOptions = (applyCopy.referrals || []).map((r) => `<option value="${esc(r)}">${esc(r)}</option>`).join("");

  const checkIcon = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';
  const benefitsList = (applyCopy.benefits || []).map(([title, desc]) => `
    <li>
      <span class="apply-benefit-check" aria-hidden="true">${checkIcon}</span>
      <div>
        <strong>${esc(title)}</strong>
        <p>${esc(desc)}</p>
      </div>
    </li>`).join("");

  const inner = `<section class="apply-hero-section">
  <div class="wrap">
    <div class="apply-hero-text">
      <div class="apply-kicker-badge">
        <span class="pulse-dot" aria-hidden="true"></span>
        <span>Admissions &amp; Enrolment</span>
      </div>
      <h1>${esc(applyCopy.h1)}</h1>
      <p class="apply-hero-lead">${esc(applyCopy.intro)}</p>
    </div>
  </div>
</section>

<section class="section apply-main-section">
  <div class="wrap apply-layout-grid">
    
    <aside class="apply-benefits-col" aria-label="Why choose OCATECH">
      <div class="apply-benefits-card">
        <p class="hero-kicker">Why Learn with Us</p>
        <h2 class="apply-benefits-title">Your pathway to practical digital competence</h2>
        <ul class="apply-benefits-list">
          ${benefitsList}
        </ul>
        <div class="apply-wa-direct">
          <p class="apply-wa-direct-label">Need immediate answers or assistance?</p>
          <a class="button button-wa button-full" href="${esc(whatsapp(sharedCopy.whatsappPresets.general))}">
            ${esc(sharedCopy.buttons.whatsapp)}
          </a>
        </div>
      </div>

      <div class="apply-tour-card">
        <div class="tour-card-header">
          <span class="tour-badge">${svgIcons.pin} Free Center Walkthrough</span>
          <h3>Prefer to see the lab in person first?</h3>
        </div>
        <p class="tour-desc">You are always welcome at 62 New Market Road, Onitsha. Come see our learning space with computers provided and stable power supply, see our active classes, and speak with an instructor before making any commitment.</p>
        <ul class="tour-perks">
          <li><span class="check-mark">&#x2713;</span> Free course advice</li>
          <li><span class="check-mark">&#x2713;</span> Hands-on look at our lab computers</li>
          <li><span class="check-mark">&#x2713;</span> No pressure, zero upfront obligation</li>
        </ul>
        <p class="tour-note">Open ${esc(site.contact.hours || "Monday–Saturday, 8AM–6PM")}.</p>
        <a class="button button-wa button-full" href="${esc(whatsapp(sharedCopy.whatsappPresets.general))}">
          ${esc(sharedCopy.buttons.whatsapp)}
        </a>
      </div>
    </aside>

    <div class="apply-form-col">
      <div class="apply-card">
        <form id="apply-form" action="/api/apply" method="post" data-success="/success/" data-whatsapp="${esc(whatsapp(sharedCopy.whatsappPresets.general))}" data-messages="${esc(json(applyCopy.messages))}">
          <div id="form-errors" class="form-errors" role="alert" hidden></div>
          <input type="hidden" name="type" value="learn">

          <div class="form-grid">
            <div class="form-row-2">
              <p class="form-field">
                <label for="name">${esc(applyCopy.fields.name)} <span class="req">*</span></label>
                <input id="name" name="name" type="text" autocomplete="name" placeholder="e.g. Chukwuma Okoye" required minlength="2" maxlength="80">
              </p>
              <p class="form-field">
                <label for="phone">${esc(applyCopy.fields.phone)} <span class="req">*</span></label>
                <input id="phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="e.g. 0816 532 1429" required>
              </p>
            </div>

            <p class="form-field">
              <label for="email">${esc(applyCopy.fields.email)}</label>
              <input id="email" name="email" type="email" autocomplete="email" placeholder="e.g. yourname@example.com">
            </p>

            <p class="form-field">
              <label for="course">${esc(applyCopy.fields.course)} <span class="req">*</span></label>
              <select id="course" name="course" required>
                <option value="" disabled selected>Select a course...</option>
                ${groups}
              </select>
            </p>

            <fieldset class="form-fieldset">
              <legend>${esc(applyCopy.fields.mode)} <span class="req">*</span></legend>
              <div class="mode-chips">
                <label class="chip-label">
                  <input type="radio" name="mode" value="In person" checked>
                  <span class="chip-pill">${svgIcons.pin} In person (Onitsha Hub)</span>
                </label>
                <label class="chip-label">
                  <input type="radio" name="mode" value="Online">
                  <span class="chip-pill">${svgIcons.laptop} Online</span>
                </label>
              </div>
            </fieldset>

            <div class="form-row-2">
              <p class="form-field">
                <label for="current_status">${esc(applyCopy.fields.status)}</label>
                <select id="current_status" name="current_status">
                  <option value="" disabled selected>Select your current status</option>
                  ${statusOptions}
                </select>
              </p>
              <p class="form-field">
                <label for="goal">${esc(applyCopy.fields.goal)}</label>
                <select id="goal" name="goal">
                  <option value="" disabled selected>Select your choice</option>
                  ${goalOptions}
                </select>
              </p>
            </div>

            <div class="form-row-2">
              <p class="form-field">
                <label for="has_laptop">${esc(applyCopy.fields.laptop)}</label>
                <select id="has_laptop" name="has_laptop">
                  <option value="" disabled selected>Select your choice</option>
                  ${laptopOptions}
                </select>
              </p>
              <p class="form-field">
                <label for="referral">${esc(applyCopy.fields.referral)}</label>
                <select id="referral" name="referral">
                  <option value="" disabled selected>Select an option</option>
                  ${referralOptions}
                </select>
              </p>
            </div>

            <p class="form-field">
              <label for="message">${esc(applyCopy.fields.message)}</label>
              <textarea id="message" name="message" rows="3" maxlength="600" placeholder="Any specific questions, requirements or additional details..."></textarea>
              <span class="counter" id="message-count" aria-live="polite">0/600</span>
            </p>

            <p class="honeypot" aria-hidden="true">
              <label for="website">Website</label>
              <input id="website" name="website" type="text" tabindex="-1" autocomplete="off">
            </p>
            <input type="hidden" name="sourcePage" id="source-page" value="">
            <input type="hidden" name="utm_source" value="">
            <input type="hidden" name="utm_medium" value="">
            <input type="hidden" name="utm_campaign" value="">
            <input type="hidden" name="referrer" value="">

            <p class="consent">
              <label>
                <input type="checkbox" name="consent" value="true" required>
                <span>${esc(applyCopy.fields.consent)} <a href="/privacy/">Privacy Policy</a></span>
              </label>
            </p>

            <button class="button button-full" type="submit">${esc(sharedCopy.buttons.send)} ${svgIcons.arrowRight}</button>
            <p class="form-guarantee-note">We respect your privacy. No spam or unsolicited messages.</p>
          </div>
        </form>
      </div>
    </div>

  </div>
</section>

<section class="section section-alt">
  <div class="wrap">
    <div class="section-title-wrap text-center">
      <p class="hero-kicker">Got Questions?</p>
      <h2>Common questions before applying</h2>
    </div>
    ${renderFaq(faq.slice(0, homeFaqCount))}
  </div>
</section>`;
  return {
    title: applyCopy.seoTitle,
    description: applyCopy.seoDescription,
    canonical: urls.for("/apply/"),
    inner,
    jsonLd: [faqJsonLd(faq.slice(0, homeFaqCount), urls.for("/apply/"))],
    extraScripts: [assets.form],
  };
}

function renderQuote() {
  const serviceOptions = site.services.map((service) => `<option value="${esc(service.slug)}">${esc(service.name)}</option>`).join("");
  const propertyOptions = (quoteCopy.propertyTypes || []).map((p) => `<option value="${esc(p)}">${esc(p)}</option>`).join("");
  const locationOptions = (quoteCopy.locations || []).map((l) => `<option value="${esc(l)}">${esc(l)}</option>`).join("");

  const checkIcon = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';
  const benefitsList = (quoteCopy.benefits || []).map(([title, desc]) => `
    <li>
      <span class="apply-benefit-check" aria-hidden="true">${checkIcon}</span>
      <div>
        <strong>${esc(title)}</strong>
        <p>${esc(desc)}</p>
      </div>
    </li>`).join("");

  const inner = `<section class="apply-hero-section">
  <div class="wrap">
    <div class="apply-hero-text">
      <div class="apply-kicker-badge">
        <span class="pulse-dot" aria-hidden="true"></span>
        <span>Technical Services &amp; Installations</span>
      </div>
      <h1>${esc(quoteCopy.h1)}</h1>
      <p class="apply-hero-lead">${esc(quoteCopy.intro)}</p>
    </div>
  </div>
</section>

<section class="section apply-main-section">
  <div class="wrap apply-layout-grid">
    
    <aside class="apply-benefits-col" aria-label="Why choose OCATECH for installations">
      <div class="apply-benefits-card">
        <p class="hero-kicker">Why Work With Us</p>
        <h2 class="apply-benefits-title">Reliable installation &amp; technical infrastructure</h2>
        <ul class="apply-benefits-list">
          ${benefitsList}
        </ul>
        <div class="apply-wa-direct">
          <p class="apply-wa-direct-label">Need immediate consultation or site booking?</p>
          <a class="button button-wa button-full" href="${esc(whatsapp(sharedCopy.whatsappPresets.service.replace("{service}", "a technical service")))}">
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </aside>

    <div class="apply-form-col">
      <div class="apply-card">
        <form id="apply-form" action="/api/apply" method="post" data-success="/success/" data-whatsapp="${esc(whatsapp(sharedCopy.whatsappPresets.service.replace("{service}", "a technical service")))}" data-messages="${esc(json(quoteCopy.messages))}">
          <div id="form-errors" class="form-errors" role="alert" hidden></div>
          <input type="hidden" name="type" value="service">

          <div class="form-grid">
            <div class="form-row-2">
              <p class="form-field">
                <label for="name">${esc(quoteCopy.fields.name)} <span class="req">*</span></label>
                <input id="name" name="name" type="text" autocomplete="name" placeholder="e.g. Obinna Emeka / Swift Logistics" required minlength="2" maxlength="80">
              </p>
              <p class="form-field">
                <label for="phone">${esc(quoteCopy.fields.phone)} <span class="req">*</span></label>
                <input id="phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="e.g. 0816 532 1429" required>
              </p>
            </div>

            <p class="form-field">
              <label for="email">${esc(quoteCopy.fields.email)}</label>
              <input id="email" name="email" type="email" autocomplete="email" placeholder="e.g. company@example.com">
            </p>

            <div class="form-row-2">
              <p class="form-field">
                <label for="service">${esc(quoteCopy.fields.service)} <span class="req">*</span></label>
                <select id="service" name="service" required>
                  <option value="" disabled selected>Select a service...</option>
                  ${serviceOptions}
                  <option value="custom-setup">Multiple / Custom Setup</option>
                </select>
              </p>
              <p class="form-field">
                <label for="property_type">${esc(quoteCopy.fields.propertyType)}</label>
                <select id="property_type" name="property_type">
                  <option value="" disabled selected>Select property type</option>
                  ${propertyOptions}
                </select>
              </p>
            </div>

            <p class="form-field">
              <label for="location">${esc(quoteCopy.fields.location)} <span class="req">*</span></label>
              <input id="location" name="location" type="text" placeholder="e.g. 62 New Market Road, Onitsha / Nkpor / Awka" required>
            </p>

            <p class="form-field">
              <label for="message">${esc(quoteCopy.fields.message)}</label>
              <textarea id="message" name="message" rows="4" maxlength="600" placeholder="Tell us more about the project, building size, number of CCTV cameras or inverter load required..."></textarea>
              <span class="counter" id="message-count" aria-live="polite">0/600</span>
            </p>

            <p class="honeypot" aria-hidden="true">
              <label for="website">Website</label>
              <input id="website" name="website" type="text" tabindex="-1" autocomplete="off">
            </p>
            <input type="hidden" name="sourcePage" id="source-page" value="">
            <input type="hidden" name="utm_source" value="">
            <input type="hidden" name="utm_medium" value="">
            <input type="hidden" name="utm_campaign" value="">
            <input type="hidden" name="referrer" value="">

            <p class="consent">
              <label>
                <input type="checkbox" name="consent" value="true" required>
                <span>${esc(quoteCopy.fields.consent)} <a href="/privacy/">Privacy Policy</a></span>
              </label>
            </p>

            <button class="button button-full" type="submit">Submit Quote Request ${svgIcons.arrowRight}</button>
            <p class="form-guarantee-note">Fast response. We assess your needs before giving final estimates.</p>
          </div>
        </form>
      </div>
    </div>

  </div>
</section>`;
  return {
    title: quoteCopy.seoTitle,
    description: quoteCopy.seoDescription,
    canonical: urls.for("/quote/"),
    inner,
    jsonLd: [],
    extraScripts: [assets.form],
  };
}

function renderContact() {
  const mapQuery = encodeURIComponent(`${site.contact.addressLine}, ${site.contact.city}, ${site.contact.state}, ${site.contact.country}`);
  const mapEmbedUrl = `https://www.google.com/maps?q=${mapQuery}&output=embed`;
  const inner = `<section class="page-head wrap">
  <h1>${esc(contact.h1)}</h1>
  <p class="course-lead-copy">${esc(contact.intro)}</p>
</section>

<section class="section contact-visual-section" aria-label="Our training center">
  <div class="wrap">
    <figure class="contact-hero-media">
      <img src="/assets/img/training-lab-960.webp" srcset="/assets/img/training-lab-480.webp 480w, /assets/img/training-lab-960.webp 960w, /assets/img/training-lab-1600.webp 1600w" sizes="(min-width: 960px) 920px, 100vw" width="960" height="540" loading="lazy" alt="OCATECH Digital Solutions training center in Onitsha">
      <figcaption>Inside our Onitsha training center at ${esc(site.contact.addressLine)}.</figcaption>
    </figure>
  </div>
</section>

<section class="section" aria-labelledby="contact-details-heading">
  <div class="wrap contact-split">
    <div class="contact-info-panel">
      <h2 id="contact-details-heading">Reach us directly</h2>
      <p class="contact-panel-intro">The quickest way to get an answer is on WhatsApp or by calling our desk during opening hours.</p>

      <div class="contact-item-list">
        <div class="contact-item">
          <span class="contact-item-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </span>
          <div>
            <h3>Visit the center</h3>
            <p>${esc(site.contact.addressLine)}, ${esc(site.contact.city)}, ${esc(site.contact.state)}</p>
            ${site.contact.landmarkOrDirections ? `<p class="contact-muted">${esc(site.contact.landmarkOrDirections)}</p>` : ""}
            ${site.contact.hours ? `<p class="contact-hours">Open ${esc(site.contact.hours)}.</p>` : ""}
          </div>
        </div>

        <div class="contact-item">
          <span class="contact-item-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </span>
          <div>
            <h3>Phone &amp; WhatsApp</h3>
            <ul class="contact-phones">
              ${site.contact.phones.map((phone) => `<li><a href="tel:${esc(phone.e164)}">${esc(phone.display)}</a></li>`).join("")}
            </ul>
            <p class="contact-wa-wrap"><a class="button button-small button-wa" href="${esc(whatsapp(sharedCopy.whatsappPresets.general))}">${esc(sharedCopy.buttons.whatsapp)}</a></p>
          </div>
        </div>

        <div class="contact-item">
          <span class="contact-item-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </span>
          <div>
            <h3>Email</h3>
            <p><a href="mailto:${esc(site.contact.email)}">${esc(site.contact.email)}</a></p>
          </div>
        </div>
      </div>
    </div>

    <div class="contact-form-card">
      <h2>Have a question? Let’s talk</h2>
      <p class="contact-panel-intro">Send a quick note and our team will reply on WhatsApp or call you back.</p>
      <form class="contact-quick-form" action="/api/apply" method="post">
        <input type="hidden" name="type" value="learn">
        <input type="hidden" name="course" value="not-sure-yet">
        <input type="hidden" name="sourcePage" value="/contact/">
        <input type="hidden" name="utm_source" value="">
        <input type="hidden" name="utm_medium" value="">
        <input type="hidden" name="utm_campaign" value="">
        <input type="hidden" name="referrer" value="">
        <p class="honeypot" aria-hidden="true"><label>Leave this blank <input type="text" name="website" tabindex="-1" autocomplete="off"></label></p>
        <p><label for="contact-name">Your name *</label><input id="contact-name" type="text" name="name" required minlength="2" maxlength="80" autocomplete="name" placeholder="Enter your full name"></p>
        <div class="contact-form-row">
          <p><label for="contact-phone">Phone / WhatsApp *</label><input id="contact-phone" type="tel" name="phone" required autocomplete="tel" placeholder="e.g. 0816 532 1429"></p>
          <p><label for="contact-email">Email (optional)</label><input id="contact-email" type="email" name="email" autocomplete="email" placeholder="you@example.com"></p>
        </div>
        <p><label for="contact-message">How can we help? *</label><textarea id="contact-message" name="message" required maxlength="600" placeholder="Ask about a course, schedule, fees or installation service..."></textarea></p>
        <p class="consent"><label><input type="checkbox" name="consent" required><span>I agree that OCATECH can contact me about this enquiry.</span></label></p>
        <p><button class="button contact-submit-btn" type="submit">Send message</button></p>
      </form>
    </div>
  </div>
</section>

<section class="section section-alt" aria-labelledby="map-heading">
  <div class="wrap">
    <div class="map-header">
      <div>
        <h2 id="map-heading">Find us on the map</h2>
        <p class="contact-muted">${esc(site.contact.addressLine)}, ${esc(site.contact.city)} — ${esc(site.contact.landmarkOrDirections)}</p>
      </div>
      ${site.contact.googleMapsUrl ? `<a class="button button-quiet" href="${esc(site.contact.googleMapsUrl)}">Open in Google Maps ${svgIcons.arrowNe}</a>` : ""}
    </div>
    <div class="map-embed-wrap">
      <iframe
        title="Map showing OCATECH Digital Solutions at 62 New Market Road, Onitsha"
        src="${esc(mapEmbedUrl)}"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        allowfullscreen>
      </iframe>
    </div>
  </div>
</section>`;
  return { title: contact.seoTitle, description: contact.seoDescription, canonical: urls.for("/contact/"), inner, jsonLd: [] };
}

function renderPrivacy() {
  const inner = `<!-- Draft for owner review. Not legal advice. -->
<section class="page-head wrap"><h1>${esc(privacy.h1)}</h1></section>
<section class="section"><div class="wrap prose">${privacy.sections.map(([heading, text]) => `<section><h2>${esc(heading)}</h2><p>${esc(text)}</p></section>`).join("")}</div></section>`;
  return { title: privacy.seoTitle, description: privacy.seoDescription, canonical: urls.for("/privacy/"), inner, jsonLd: [] };
}

function render404() {
  const inner = `<section class="page-head wrap"><h1>${esc(notFound.h1)}</h1><p>${esc(notFound.text)}</p>
<ul class="plain-list"><li><a href="/courses/">Courses</a></li><li><a href="/services/">Services</a></li><li><a href="/contact/">Contact</a></li><li><a href="${esc(whatsapp(sharedCopy.whatsappPresets.general))}">${esc(sharedCopy.buttons.whatsapp)}</a></li></ul></section>`;
  return { title: "Page not found | OCATECH", description: "The page you wanted could not be found.", canonical: urls.for("/404.html"), inner, jsonLd: [], noindex: true };
}

function renderSuccess() {
  const inner = `<section class="page-head wrap"><h1>${esc(applyCopy.messages.success)}</h1><p>${esc(applyCopy.messages.successText)}</p>
<a class="button button-wa" href="${esc(whatsapp(sharedCopy.whatsappPresets.general))}">${esc(sharedCopy.buttons.continue)}</a>
<p><a class="text-link" href="/">Back to home</a></p></section>`;
  return { title: "Details received | OCATECH", description: "Your details have been received.", canonical: urls.for("/success/"), inner, jsonLd: [], noindex: true };
}

function renderReview() {
  const reviewUrl = site.contact.googleReviewUrl || "https://g.page/r/CYmQp_WwwYMxEBM/review";
  const inner = `<section class="page-head wrap text-center">
<h1>Leave a Review for OCATECH</h1>
<p class="section-lead">Taking you to our Google review page…</p>
<div class="hero-actions">
  <a class="button button-wa" href="${esc(reviewUrl)}">Click here if not redirected automatically</a>
</div>
<p class="contact-muted">Thank you for sharing your experience with OCATECH Digital Solutions.</p>
<meta http-equiv="refresh" content="0; url=${esc(reviewUrl)}">
</section>`;
  return {
    title: "Leave a Review | OCATECH",
    description: "Review OCATECH Digital Solutions on Google.",
    canonical: urls.for("/review/"),
    inner,
    jsonLd: [],
  };
}

const headerRules = [];

// ── Fees page ─────────────────────────────────────────────────────────────────
function renderFees() {
  const formatNaira = (num) => Number(num || 0).toLocaleString("en-NG");
  const hasFutureOffer = site.offer.endsOn && new Date(site.offer.endsOn) > new Date();
  const offerEnd = hasFutureOffer ? new Date(site.offer.endsOn).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" }) : null;
  const trackOrder = ["foundation", "web", "design-media", "business", "data-ai", "security-networking"];
  const byTrack = new Map(trackOrder.map((id) => [id, []]));
  for (const course of courseData) {
    if (!byTrack.has(course.track)) byTrack.set(course.track, []);
    byTrack.get(course.track).push(course);
  }
  const sections = [...byTrack.entries()].filter(([, courses]) => courses.length).map(([trackId, courses]) => {
    const rows = courses.map((course) => {
      const priceCell = (course.originalFee && hasFutureOffer)
        ? `<span class="fees-price">₦${formatNaira(course.fee)}</span> <s class="fees-orig">₦${formatNaira(course.originalFee)}</s>`
        : `<span class="fees-price">₦${formatNaira(course.fee)}</span>`;
      return `<tr><td><a href="/courses/${esc(course.slug)}/">${esc(course.title)}</a></td><td>${esc(course.level)}</td><td>${priceCell}</td><td><a class="button button-small" href="/apply/?course=${esc(course.slug)}">Apply</a></td></tr>`;
    }).join("");
    return `<section class="fees-track-section" aria-labelledby="fees-track-${esc(trackId)}"><h2 id="fees-track-${esc(trackId)}">${esc(trackName(trackId))}</h2><table class="fees-table"><thead><tr><th>Course</th><th>Level</th><th>Fee</th><th></th></tr></thead><tbody>${rows}</tbody></table></section>`;
  }).join("");

  const inner = `${renderBreadcrumbs([["Home", "/"], ["Course fees", "/fees/"]])}
<section class="page-head wrap">
  <h1>Course fees</h1>
  <p class="course-lead-copy">Clear prices for every course. Installments are available.</p>
  ${hasFutureOffer ? `<p class="fees-offer-note">Launch prices valid until ${esc(offerEnd)}. Enrol before the offer ends.</p>` : ""}
</section>

<section class="section">
  <div class="wrap fees-wrap">
    ${sections}
    <div class="fees-installments">
      <h2>Installment plans</h2>
      <p>You can split your tuition across two or three payments. Options are available at the center. We will give you payment details directly.</p>
      <p class="fees-warn">We never ask you to pay into an account sent by anyone else. If you receive such a message, please contact us immediately on WhatsApp.</p>
      <p>Payment is accepted by ${esc(site.offer.paymentMethods.join(", "))} at the center.</p>
      <a class="button" href="/apply/">Apply for a course ${svgIcons.arrowRight}</a>
    </div>
  </div>
</section>`;
  return {
    title: "Course fees | OCATECH Digital Solutions",
    description: "See all 17 course fees at OCATECH Digital Solutions, Onitsha. Installment options available. Apply online or visit us at 62 New Market Road.",
    canonical: urls.for("/fees/"),
    inner,
    jsonLd: [breadcrumbJsonLd([["Home", urls.home], ["Course fees", urls.for("/fees/")]])],
  };
}

// ── Free class page ────────────────────────────────────────────────────────────
function renderFreeClass() {
  const tasterDate = site.taster?.date || null;
  const tasterTime = site.taster?.time || null;
  const tasterTopic = site.taster?.topic || null;
  const tasterSeats = site.taster?.seats || null;
  const hasDate = tasterDate && tasterTopic;
  const dateLine = hasDate
    ? `<p class="free-class-date"><strong>Date:</strong> ${esc(tasterDate)}${tasterTime ? ` at ${esc(tasterTime)}` : ""}</p>`
    : "";
  const topicLine = tasterTopic ? `<p><strong>Topic:</strong> ${esc(tasterTopic)}</p>` : "";
  const seatsLine = tasterSeats ? `<p class="free-class-seats">Only ${esc(String(tasterSeats))} seats available. Reserve yours today.</p>` : "";
  const headline = hasDate ? "Join our next free class" : "Free taster class";
  const intro = hasDate
    ? `Come and experience a live session at no cost. No prior knowledge required.`
    : `Next free class: to be announced. Leave your details and we will message you as soon as it is scheduled.`;

  const inner = `${renderBreadcrumbs([["Home", "/"], ["Free taster class", "/free-class/"]])}
<section class="page-head wrap">
  <h1>${esc(headline)}</h1>
  <p class="course-lead-copy">${esc(intro)}</p>
</section>
<section class="section">
  <div class="wrap two-col-info">
    <div class="info-card">
      <h2>Session details</h2>
      ${dateLine}${topicLine}${seatsLine}
      <p>Bring a pen and notebook. Comfortable clothes. No laptop needed — computers are provided at the center.</p>
      <p>The session is free. We will show you what practical digital training looks like, and answer your questions about courses and fees.</p>
    </div>
    <div class="info-card">
      <h2>Reserve your spot</h2>
      <form id="taster-form" action="/api/apply" method="post">
        <input type="hidden" name="type" value="taster">
        <input type="hidden" name="course" value="free-taster">
        <input type="hidden" name="sourcePage" value="/free-class/">
        <input type="hidden" name="utm_source" value="">
        <input type="hidden" name="utm_medium" value="">
        <input type="hidden" name="utm_campaign" value="">
        <input type="hidden" name="referrer" value="">
        <p class="honeypot" aria-hidden="true"><label>Leave blank <input type="text" name="website" tabindex="-1" autocomplete="off"></label></p>
        <p class="form-field"><label for="taster-name">Your name *</label><input id="taster-name" name="name" type="text" required minlength="2" maxlength="80" autocomplete="name" placeholder="Enter your full name"></p>
        <p class="form-field"><label for="taster-phone">Phone / WhatsApp *</label><input id="taster-phone" name="phone" type="tel" required autocomplete="tel" placeholder="e.g. 0816 532 1429"></p>
        <p class="form-field"><label for="taster-email">Email (optional)</label><input id="taster-email" name="email" type="email" autocomplete="email" placeholder="you@example.com"></p>
        <p class="consent"><label><input type="checkbox" name="consent" value="true" required><span>I agree that OCATECH can contact me about this event and future free sessions. <a href="/privacy/">Privacy Policy</a></span></label></p>
        <button class="button button-full" type="submit">Reserve my spot ${svgIcons.arrowRight}</button>
      </form>
    </div>
  </div>
</section>`;
  return {
    title: "Free taster class | OCATECH Digital Solutions",
    description: "Join a free ICT taster class at OCATECH in Onitsha. No experience needed. See hands-on digital training before you enrol.",
    canonical: urls.for("/free-class/"),
    inner,
    jsonLd: [breadcrumbJsonLd([["Home", urls.home], ["Free taster class", urls.for("/free-class/")]])],
    extraScripts: [assets.form],
  };
}

// ── Training for teams page ────────────────────────────────────────────────────
function renderTeams() {
  const courseGroups = site.tracks.map((track) => {
    const courses = courseData.filter((c) => c.track === track.id).map((c) => esc(c.title)).join(", ");
    return courses ? `<li><strong>${esc(track.name)}:</strong> ${courses}</li>` : "";
  }).filter(Boolean).join("");
  const inner = `${renderBreadcrumbs([["Home", "/"], ["Training for teams", "/training-for-teams/"]])}
<section class="page-head wrap">
  <h1>Training for teams, schools and businesses</h1>
  <p class="course-lead-copy">We can deliver structured digital skills training for your group — at our Onitsha center or at your premises. Tell us your goal and team size, and we will propose a plan.</p>
</section>
<section class="section">
  <div class="wrap two-col-info">
    <div class="info-card">
      <h2>What we can teach</h2>
      <p>All 17 of our courses are available for group delivery. Topics include:</p>
      <ul class="plain-list">${courseGroups}</ul>
      <h2>How it works</h2>
      <ol class="plain-list">
        <li>Send us a message with your organisation name, team size, and the skills you want covered.</li>
        <li>We propose a schedule, format, and fee structure based on your group.</li>
        <li>We confirm dates and begin training.</li>
      </ol>
      <p>We do not publish package prices for group training because every group is different. Contact us and we will discuss options.</p>
    </div>
    <div class="info-card">
      <h2>Send an enquiry</h2>
      <form id="apply-form" action="/api/apply" method="post" data-success="/success/" data-whatsapp="${esc(whatsapp(sharedCopy.whatsappPresets.general))}" data-messages='{"name":"Please enter your full name (at least 2 characters).","phone":"Please enter a valid Nigerian phone number.","consent":"Please accept the privacy policy.","sending":"Sending…","success":"Thank you","successText":"We have received your enquiry. Our team will get back to you on WhatsApp.","limit":"Too many attempts. Please try again later.","error":"Something went wrong. Please try again or contact us on WhatsApp."}'>
        <div id="form-errors" class="form-errors" role="alert" hidden></div>
        <input type="hidden" name="type" value="team">
        <input type="hidden" name="course" value="not-sure-yet">
        <input type="hidden" name="sourcePage" id="source-page" value="">
        <input type="hidden" name="utm_source" value="">
        <input type="hidden" name="utm_medium" value="">
        <input type="hidden" name="utm_campaign" value="">
        <input type="hidden" name="referrer" value="">
        <p class="honeypot" aria-hidden="true"><label>Leave blank <input type="text" name="website" tabindex="-1" autocomplete="off"></label></p>
        <div class="form-grid">
          <p class="form-field"><label for="org-name">Organisation or school name *</label><input id="org-name" name="name" type="text" required minlength="2" maxlength="80" autocomplete="organization" placeholder="e.g. Swift Logistics Ltd"></p>
          <p class="form-field"><label for="org-phone">Contact phone / WhatsApp *</label><input id="org-phone" name="phone" type="tel" required autocomplete="tel" placeholder="e.g. 0816 532 1429"></p>
          <p class="form-field"><label for="org-email">Email (optional)</label><input id="org-email" name="email" type="email" autocomplete="email" placeholder="you@example.com"></p>
          <p class="form-field"><label for="org-size">Number of people</label><input id="org-size" name="team_size" type="text" maxlength="40" placeholder="e.g. 10–15 staff"></p>
          <p class="form-field"><label for="org-topic">Topic or skill area</label><input id="org-topic" name="topic" type="text" maxlength="120" placeholder="e.g. Microsoft Office, CCTV, Web Design"></p>
          <p class="form-field"><label for="org-message">Any other details</label><textarea id="org-message" name="message" rows="3" maxlength="600" placeholder="Preferred dates, location preference, any questions…"></textarea></p>
          <p class="consent"><label><input type="checkbox" name="consent" value="true" required><span>I agree that OCATECH can contact me about this enquiry. <a href="/privacy/">Privacy Policy</a></span></label></p>
          <button class="button button-full" type="submit">Send enquiry ${svgIcons.arrowRight}</button>
        </div>
      </form>
    </div>
  </div>
</section>`;
  return {
    title: "Training for teams and businesses | OCATECH Digital Solutions",
    description: "Group digital skills training for teams, schools and businesses in Onitsha and Anambra. All topics available. Contact us for a custom plan.",
    canonical: urls.for("/training-for-teams/"),
    inner,
    jsonLd: [breadcrumbJsonLd([["Home", urls.home], ["Training for teams", urls.for("/training-for-teams/")]])],
    extraScripts: [assets.form],
  };
}

// ── Certificate verify page ────────────────────────────────────────────────────
function renderVerify() {
  const params = ""; // server-side result shown via GET params in JS-off fallback
  const inner = `${renderBreadcrumbs([["Home", "/"], ["Verify certificate", "/verify/"]])}
<section class="page-head wrap">
  <h1>Verify a certificate</h1>
  <p class="course-lead-copy">Enter the certificate number printed on your OCATECH certificate to confirm it is genuine.</p>
</section>
<section class="section">
  <div class="wrap verify-wrap">
    <div id="verify-result" class="verify-result-box" aria-live="polite"></div>
    <form id="verify-form" action="/api/verify" method="post">
      <p class="form-field"><label for="cert-code">Certificate number *</label><input id="cert-code" name="code" type="text" required maxlength="40" autocomplete="off" placeholder="e.g. OCA-2026-001" pattern="[A-Za-z0-9\\-]+" inputmode="text"></p>
      <button class="button" type="submit">Check certificate ${svgIcons.arrowRight}</button>
    </form>
    <p class="verify-note">Verification is available for certificates issued by OCATECH Digital Solutions. If the number is not found, please contact us on WhatsApp to confirm.</p>
    <p class="verify-note">We do not display a list of certificates. Each lookup checks one number only.</p>
  </div>
</section>`;
  return {
    title: "Verify a certificate | OCATECH Digital Solutions",
    description: "Check whether an OCATECH Digital Solutions certificate is genuine. Enter the certificate number to verify name, course and issue date.",
    canonical: urls.for("/verify/"),
    inner,
    jsonLd: [breadcrumbJsonLd([["Home", urls.home], ["Verify certificate", urls.for("/verify/")]])],
    extraScripts: [assets.verify],
  };
}

// ── Guides index ───────────────────────────────────────────────────────────────
const guides = [
  {
    slug: "choose-a-computer-training-center-onitsha",
    title: "How to choose a computer training center in Onitsha",
    description: "What to look for when picking an ICT training center in Onitsha: hands-on time, class size, payment terms and what you finish with.",
    draft: false,
    body: `${renderBreadcrumbs([["Home", "/"], ["Guides", "/guides/"], ["How to choose a computer training center", "/guides/choose-a-computer-training-center-onitsha/"]])}
<article class="guide-page">
<header class="page-head wrap">
  <p class="hero-kicker">Local guide · Onitsha</p>
  <h1>How to choose a computer training center in Onitsha</h1>
  <p class="course-lead-copy">The number of ICT training centers in Onitsha has grown. Some are excellent; others take your money and leave you with a certificate that opens no doors. Here is what to look for before you pay.</p>
</header>
<section class="section">
  <div class="wrap guide-wrap">
    <h2>Visit before you pay</h2>
    <p>Any center that refuses a free visit or trial session is a red flag. A genuine training center will invite you to see the classroom, meet instructors and ask questions before you commit any money.</p>
    <p>When you visit, look at the computers. Are they working and reasonably current? Is the room set up for learning, with enough space per student? Talk to any students you see there.</p>

    <h2>Ask what you will finish with</h2>
    <p>The most important question you can ask is: "What will I be able to do when I complete this course?" A good center gives you a straight answer — a project you will build, a skill you will demonstrate, or a task you will complete on your own. Vague answers like "you will be a professional" or "industry-ready" should raise caution.</p>
    <p>At OCATECH, every course ends with a defined final project. You can see the project briefs on our <a href="/showcase/">Projects you will build</a> page before you enrol.</p>

    <h2>Class size and hands-on time</h2>
    <p>Large classes where students share one computer between three people cut your practice time. Ask exactly how many students share each machine during practical sessions. The closer to one-to-one, the more you learn.</p>
    <p>Ask what proportion of class time is spent practising versus listening to a lecture. Good digital skills training is mostly practical. If most sessions are just watching a slideshow or someone else type, you will struggle to apply the skill independently.</p>

    <h2>Understand the payment terms</h2>
    <p>Ask for the full fee upfront in writing, before you sign or pay anything. Find out whether installments are available and what happens if you miss a payment. Confirm which payment methods are accepted — most honest centers accept bank transfer, POS or cash at the desk. Be cautious if you are asked to pay into a personal account sent by text or WhatsApp rather than a business account confirmed by the center itself.</p>

    <h2>Red flags to watch for</h2>
    <ul>
      <li>Promised job placement without any detail of how</li>
      <li>Certificates from unrecognized bodies used as the main selling point</li>
      <li>No physical address, or an address that does not match a real premises</li>
      <li>Pressure to pay immediately before you have visited or asked questions</li>
      <li>Trainers who cannot answer specific questions about the course content</li>
    </ul>

    <h2>Local knowledge matters</h2>
    <p>An Onitsha-based center understands the local market. If you are training to freelance or work locally, it helps to train somewhere that knows Anambra employers, the kinds of projects common in the region and the realistic earning potential for local work.</p>

    <h2>Start with a visit to OCATECH</h2>
    <p>We are at <a href="/contact/">62 New Market Road, Onitsha</a>, beside the Glo Office and Mr Bigs at Ogbommanu. You are welcome to visit any weekday or Saturday between 8AM and 6PM, see the center, and talk to us about which course fits your goal. There is no obligation.</p>
    <p>You can also <a href="${esc(whatsapp(sharedCopy.whatsappPresets.general))}">message us on WhatsApp</a> to ask a question first.</p>
  </div>
</section>
</article>`,
  },
  {
    slug: "cctv-installation-onitsha",
    title: "CCTV installation in Onitsha: what to ask before you pay",
    description: "Questions to ask any CCTV installer in Onitsha before you commit: site visit, camera types, storage, remote viewing and warranty.",
    draft: false,
    body: `${renderBreadcrumbs([["Home", "/"], ["Guides", "/guides/"], ["CCTV installation in Onitsha", "/guides/cctv-installation-onitsha/"]])}
<article class="guide-page">
<header class="page-head wrap">
  <p class="hero-kicker">Local guide · Onitsha</p>
  <h1>CCTV installation in Onitsha: what to ask before you pay</h1>
  <p class="course-lead-copy">A CCTV system is a significant purchase. Before you agree to anything, here are the questions that will protect you from poor-quality work and future regret.</p>
</header>
<section class="section">
  <div class="wrap guide-wrap">
    <h2>Ask for a site visit first</h2>
    <p>Any professional CCTV installer should visit your home or business before quoting. The layout of the building, the entry points, the available power sockets and the light conditions all affect where cameras should go and how many you need. A quote given without a visit is based on guesswork.</p>
    <p>During the visit, ask the installer to explain which areas they plan to cover and why, where the DVR or NVR will be installed, and how cables will be routed. If they cannot give clear answers, consider another installer.</p>

    <h2>Understand the camera types</h2>
    <p>Not all cameras are the same. The key questions are:</p>
    <ul>
      <li>What is the resolution? Higher resolution (at least 1080p for a modern system) means clearer footage.</li>
      <li>Is the camera rated for indoor use, outdoor use, or both? Outdoor cameras need weatherproofing.</li>
      <li>Does it have night vision, and what range is realistic in your conditions?</li>
      <li>Is it wired or wireless? Wired systems are generally more reliable; wireless systems depend on a stable network.</li>
    </ul>

    <h2>Storage: how long is footage kept?</h2>
    <p>Find out exactly how footage is stored and for how long. Most systems use a DVR or NVR with a hard drive. Ask the capacity and how many days of footage it holds at the camera resolution you are installing. Ask whether it records continuously, only on motion, or both.</p>
    <p>Also ask what happens when storage is full — does it overwrite the oldest footage automatically?</p>

    <h2>Remote viewing</h2>
    <p>A major advantage of modern CCTV is the ability to view cameras on your phone from anywhere. Ask whether remote access is included in the installation, which app is used, and what happens if your internet goes down.</p>

    <h2>Get the warranty in writing</h2>
    <p>Ask for the warranty period for both the equipment and the installation work. A reputable installer stands behind their work. Get the terms in writing — not just verbally — before you pay. Find out who you call if a camera stops working in six months.</p>

    <h2>Who maintains it?</h2>
    <p>Ask whether maintenance is available after the installation, and at what cost. Cameras, cables, connections and hard drives all need occasional attention. Knowing who to call — and what it costs — before you sign up avoids unpleasant surprises later.</p>

    <h2>Contact OCATECH for CCTV in Onitsha</h2>
    <p>Our team carries out CCTV installation for homes and businesses in Onitsha, Nkpor, Obosi and Awka. We do a site visit before quoting, and we give you a written summary of what will be installed.</p>
    <p><a href="/services/#service-cctv-installation">See our CCTV installation service</a> or <a href="${esc(whatsapp("Hello OCATECH, I would like to discuss CCTV installation for my property."))}">message us on WhatsApp</a> to arrange a free assessment.</p>
  </div>
</section>
</article>`,
  },
  {
    slug: "ai-tools-for-onitsha-traders",
    title: "AI tools for Onitsha traders: five ways to save time",
    description: "Five practical ways Onitsha traders and business owners can use AI tools today to reply to customers, write product descriptions and more.",
    draft: false,
    body: `${renderBreadcrumbs([["Home", "/"], ["Guides", "/guides/"], ["AI tools for Onitsha traders", "/guides/ai-tools-for-onitsha-traders/"]])}
<article class="guide-page">
<header class="page-head wrap">
  <p class="hero-kicker">Local guide · Onitsha</p>
  <h1>AI tools for Onitsha traders: five ways to save time</h1>
  <p class="course-lead-copy">AI tools are now accessible enough for any business owner with a smartphone. Here are five practical uses that can save you time today — plus a note on what to watch out for.</p>
</header>
<section class="section">
  <div class="wrap guide-wrap">
    <h2>1. Reply to customer messages faster</h2>
    <p>If you sell on WhatsApp, Instagram or Facebook, you likely spend a large part of your day replying to the same questions: "Is this available?", "What is the price?", "Can you deliver to Awka?".</p>
    <p>AI chat tools like ChatGPT or Google Gemini can help you draft quick, polite replies. You type the question and ask the tool to write a short professional response. You read it, adjust it if needed, and send it. This cuts reply time from several minutes to under one minute for each message.</p>

    <h2>2. Write product descriptions</h2>
    <p>Describing your products clearly and attractively takes time. An AI tool can generate a draft description from a few bullet points you give it — material, size, price, use case. The result is not perfect, but it is a solid starting point that you edit, not write from scratch.</p>
    <p>This is particularly useful if you sell on Jumia, Jiji or your own WhatsApp catalogue and have many products to list.</p>

    <h2>3. Create price lists and quotations</h2>
    <p>If you regularly write out price lists or quotations by hand, an AI tool can format them neatly from the information you give it. You tell it your products, quantities and prices; it produces a formatted list you can copy or screenshot.</p>

    <h2>4. Draft social media posts</h2>
    <p>Posting regularly on Facebook or WhatsApp Status keeps your business visible. AI tools can suggest short posts for promotions, restocks or simply introducing a product. You still need to check the content, add your own photos and make it sound like you — but the AI removes the blank-page problem.</p>

    <h2>5. Simple bookkeeping summaries</h2>
    <p>If you keep a record of daily sales in a notebook or spreadsheet, you can paste the numbers into an AI chat tool and ask it to summarise your week: total sales, busiest day, which product sold most. This is not a replacement for proper bookkeeping, but it can give you a quick picture without spending an hour adding things up.</p>

    <h2>Important cautions</h2>
    <p><strong>Always check AI answers before you use them.</strong> AI tools sometimes get facts wrong — a price, a date, a quantity. Never copy an AI response to a customer without reading it first.</p>
    <p><strong>Protect customer data.</strong> Do not paste customer names, phone numbers or bank details into AI tools. Use only the information needed for the task.</p>
    <p><strong>AI does not replace human judgment.</strong> Business decisions — what to stock, what to charge, who to trust — still require your knowledge and experience of the local market.</p>

    <h2>Learn more at OCATECH</h2>
    <p>Our <a href="/courses/ai-tools-for-business-and-productivity/">AI Tools for Business and Productivity</a> course teaches Onitsha traders and professionals how to use the leading AI tools effectively and safely. No technical background is required.</p>
    <p><a href="${esc(whatsapp("Hello OCATECH, I want to learn more about the AI Tools for Business and Productivity course."))}">Message us on WhatsApp</a> for more information, or <a href="/apply/?course=ai-tools-for-business-and-productivity">apply now</a>.</p>
  </div>
</section>
</article>`,
  },
];

function articleJsonLd(guide, url) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    url,
    author: { "@type": "Organization", name: site.brand.name, url: urls.home },
    publisher: { "@type": "Organization", name: site.brand.name, url: urls.home },
    inLanguage: "en",
  };
}

function renderGuide(guide) {
  const url = urls.for(`/guides/${guide.slug}/`);
  return {
    title: `${guide.title} | OCATECH Digital Solutions`,
    description: guide.description,
    canonical: url,
    noindex: Boolean(guide.draft),
    inner: guide.body,
    jsonLd: [articleJsonLd(guide, url), breadcrumbJsonLd([["Home", urls.home], ["Guides", urls.for("/guides/")], [guide.title, url]])],
  };
}

function renderGuidesIndex() {
  const cards = guides.map((g) => `
  <article class="guide-card">
    <h2><a href="/guides/${esc(g.slug)}/">${esc(g.title)}</a></h2>
    <p>${esc(g.description)}</p>
    <a class="text-link" href="/guides/${esc(g.slug)}/">Read the guide ${svgIcons.arrowRight}</a>
  </article>`).join("");
  const inner = `${renderBreadcrumbs([["Home", "/"], ["Guides", "/guides/"]])}
<section class="page-head wrap">
  <h1>Local guides</h1>
  <p class="course-lead-copy">Practical advice for people in Onitsha and Anambra on ICT training, tech services and digital tools for business.</p>
</section>
<section class="section"><div class="wrap guides-grid">${cards}</div></section>`;
  return {
    title: "Local guides | OCATECH Digital Solutions",
    description: "Practical guides on ICT training, CCTV installation and AI tools for businesses and traders in Onitsha and Anambra.",
    canonical: urls.for("/guides/"),
    inner,
    jsonLd: [breadcrumbJsonLd([["Home", urls.home], ["Guides", urls.for("/guides/")]])],
  };
}

// ── Verify JS (inline tiny script for client-side result display) ─────────────
const verifyJs = `(() => {
  const form = document.querySelector('#verify-form');
  const resultBox = document.querySelector('#verify-result');
  if (!form || !resultBox) return;
  const params = new URLSearchParams(location.search);
  const result = params.get('result');
  const errorKey = params.get('error');
  if (result === 'found') {
    const name = params.get('name') || '';
    const course = params.get('course') || '';
    const issued = params.get('issued') || '';
    resultBox.innerHTML = '<p class="verify-found"><strong>Certificate verified.</strong><br>Name: ' + name + '<br>Course: ' + course + '<br>Issued: ' + issued + '</p>';
  } else if (result === 'not-found') {
    resultBox.innerHTML = '<p class="verify-error">No certificate found with that number. Please check the number and try again, or contact us on WhatsApp.</p>';
  } else if (errorKey === 'limit') {
    resultBox.innerHTML = '<p class="verify-error">Too many attempts. Please try again later.</p>';
  } else if (errorKey) {
    resultBox.innerHTML = '<p class="verify-error">Verification is not available right now. Please try again shortly.</p>';
  }
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = form.elements.code?.value?.trim();
    if (!code) return;
    resultBox.innerHTML = '<p>Checking…</p>';
    try {
      const res = await fetch('/api/verify', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ code }) });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        resultBox.innerHTML = '<p class="verify-found"><strong>Certificate verified.</strong><br>Name: ' + (data.name || '') + '<br>Course: ' + (data.course || '') + '<br>Issued: ' + (data.issuedOn || '') + '</p>';
      } else {
        resultBox.innerHTML = '<p class="verify-error">' + (data.message || 'No certificate found with that number.') + '</p>';
      }
    } catch { resultBox.innerHTML = '<p class="verify-error">Could not connect. Please try again.</p>'; }
  });
})();`;
const verifyJsPath = "assets/js/verify.js";
fs.writeFileSync(path.join(root, verifyJsPath), verifyJs, "utf8");
assets.verify = copyHashed(verifyJsPath);

const sitemapPaths = ["/", "/courses/", "/paths/", "/showcase/", "/services/", "/about/", "/apply/", "/quote/", "/contact/", "/privacy/", "/review/", "/fees/", "/free-class/", "/training-for-teams/", "/verify/", "/guides/", "/guides/choose-a-computer-training-center-onitsha/", "/guides/cctv-installation-onitsha/", "/guides/ai-tools-for-onitsha-traders/"];

function emitPage(file, meta) {
  const hashes = meta.jsonLd.map((item) => crypto.createHash("sha256").update(json(item)).digest("base64"));
  const frameSources = [
    site.flags.enableTurnstile ? "https://challenges.cloudflare.com" : null,
    file === "contact/index.html" ? "https://www.google.com https://maps.google.com" : null,
  ].filter(Boolean);
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    `script-src 'self' ${hashes.map((hash) => `'sha256-${hash}'`).join(" ").trim()}`.trim(),
    "style-src 'self'",
    "img-src 'self'",
    "font-src 'self'",
    `connect-src 'self'${site.flags.enableTurnstile ? " https://challenges.cloudflare.com" : ""}`,
    "form-action 'self' https://wa.me",
    `frame-src ${frameSources.length ? frameSources.join(" ") : "'none'"}`,
    "upgrade-insecure-requests",
  ].join("; ");
  const route = file === "index.html" ? "/" : `/${file.replace(/index\.html$/, "")}`;
  headerRules.push(`${route}\n  Content-Security-Policy: ${csp}`);
  write(file, page(site, sharedCopy, assets, meta, meta.inner, meta.jsonLd));
}

const pages = [
  ["index.html", renderHome()],
  ["courses/index.html", renderCourses()],
  ["paths/index.html", renderPaths()],
  ["showcase/index.html", renderShowcase()],
  ["services/index.html", renderServices()],
  ["about/index.html", renderAbout()],
  ["apply/index.html", renderApply()],
  ["quote/index.html", renderQuote()],
  ["contact/index.html", renderContact()],
  ["privacy/index.html", renderPrivacy()],
  ["success/index.html", renderSuccess()],
  ["review/index.html", renderReview()],
  ["fees/index.html", renderFees()],
  ["free-class/index.html", renderFreeClass()],
  ["training-for-teams/index.html", renderTeams()],
  ["verify/index.html", renderVerify()],
  ["guides/index.html", renderGuidesIndex()],
  ["404.html", render404()],
];

for (const guide of guides) {
  pages.push([`guides/${guide.slug}/index.html`, renderGuide(guide)]);
}

for (const course of courseData) {
  pages.push([`courses/${course.slug}/index.html`, renderCourse(course)]);
  sitemapPaths.push(`/courses/${course.slug}/`);
}

for (const [file, meta] of pages) emitPage(file, meta);

const headers = `# Generated by tools/build.mjs
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Permissions-Policy: accelerometer=(), camera=(), geolocation=(), microphone=(), payment=(), usb=()
/assets/*
  Cache-Control: public, max-age=31536000, immutable
/courses/*
  Cache-Control: public, max-age=3600
${headerRules.join("\n")}
`;
write("_headers", headers);

write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapPaths.map((p) => `  <url><loc>${esc(urls.for(p))}</loc></url>`).join("\n")}
</urlset>
`);

write("robots.txt", `User-agent: *
Allow: /
Sitemap: ${urls.home}/sitemap.xml
`);

write("assets/js/picker-data.json", json({
  courses: courseData.map((course) => ({ slug: course.slug, name: course.shortName || course.title })),
  choices: home.picker.choices,
}));

const facts = [
  "- Business: OCATECH Digital Solutions, ICT Hub & Training Center. Tagline: Choose OCATECH, Choose Excellence. Registered business BN 9677251.",
  "- Address: 62 New Market Road, Onitsha, Anambra State, Nigeria.",
  site.contact.hours ? `- Opening hours: ${site.contact.hours}.` : null,
  site.contact.landmarkOrDirections ? `- Landmark: ${site.contact.landmarkOrDirections}` : null,
  `- Contact: WhatsApp ${site.contact.whatsapp.display}. Phones ${site.contact.phones.map((p) => p.display).join(" and ")}. Email ${site.contact.email}.`,
  `- Learning: in person at our Onitsha center with computers provided during practical classes and stable power supply. Online classes are available depending on the course; ask us on WhatsApp about online options. ${site.offer.admission} ${site.offer.certificate}.`,
  `- Payment: ${site.offer.paymentMethods.join(", ")}, and installment plans. ${site.offer.feeNote}`,
  `- Students: ${site.audiences.join(", ")}.`,
  `- Services: ${site.services.map((s) => s.name).join(", ")}, for homes and businesses in ${site.areasServed.join(", ")}.`,
  ...courseData.map((course) => `- Course: ${course.title}. Level: ${course.level}. ${course.summary} Tools: ${course.tools.join(", ")}. Before you start: ${course.prerequisites}. Next: ${course.nextSteps.map((slug) => courseBySlug.get(slug)?.title).filter(Boolean).join(", ") || "none"}.`),
  ...site.paths.map((item) => `- Path: ${item.name}: ${item.courses.map((slug) => courseBySlug.get(slug)?.title).filter(Boolean).join(", ")}.`),
].filter(Boolean).join("\n");

const generated = `// Generated by tools/build.mjs. Do not edit by hand.
export const systemPrompt = ${json(chat.systemPrompt + "\n\nFACTS:\n" + facts)};
export const config = ${json({
  siteUrl: urls.home,
  whatsappNumber: site.contact.whatsapp.number,
  courseSlugs: courseData.map((course) => course.slug),
  serviceSlugs: site.services.map((service) => service.slug),
  handoff: chat.handoff,
  whatsappText: shared.whatsappPresets.general,
  limit: chat.limit,
  error: chat.error,
  feeNote: site.offer.feeNote,
  flags: { enableTurnstile: site.flags.enableTurnstile, enableChatbot: site.flags.enableChatbot },
})};
`;
const generatedDir = path.join(root, "functions", "generated");
fs.mkdirSync(generatedDir, { recursive: true });
fs.writeFileSync(path.join(generatedDir, "chat-facts.mjs"), generated, "utf8");

const check = spawnSync(process.execPath, ["tools/check.mjs"], { cwd: root, stdio: "inherit" });
if (check.status !== 0) process.exit(check.status || 1);
console.log(`Built ${pages.length} pages.`);
