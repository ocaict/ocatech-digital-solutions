import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { esc, json, page, wa } from "../templates/layout.mjs";
import {
  shared, home, coursesPage, courseTemplate, services, about,
  apply as applyCopy, contact, faq, homeFaqCount, privacy, notFound, chat,
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
  return `<div class="faq-list">${items.map(([question, answer], index) => `<details class="faq-item"${index === 0 ? " open" : ""}>
<summary>${esc(question)}</summary>
<p>${esc(answer)}</p>
</details>`).join("")}</div>`;
}

function renderPickerFallback() {
  return `<noscript><p>${esc(home.picker.helper)}</p><ul class="plain-list">${site.tracks.map((track) => `<li><a href="/courses/?track=${esc(track.id)}">${esc(track.name)}</a></li>`).join("")}</ul></noscript>`;
}

function courseCard(course, lead = false) {
  const track = trackById.get(course.track);
  const url = `/courses/${course.slug}/`;
  const formatNaira = (num) => Number(num || 0).toLocaleString("en-NG");
  const outcomes = (course.outcomes || []).slice(0, 3);
  const outcomesHtml = outcomes.map((o) => `<li><span class="outcome-check" aria-hidden="true">&#x2713;</span> ${esc(o)}</li>`).join("");

  return `<article class="course-card${lead ? " course-card-lead" : ""}" data-course-track="${esc(course.track)}">
<div class="course-card-media">
  <img src="${esc(course.image)}" width="600" height="340" alt="${esc(course.title)}" loading="lazy">
</div>
<div class="course-card-body">
  <div class="course-card-meta">
    <span class="course-card-track">${esc(trackName(course.track))}</span>
    ${course.duration ? `<span class="course-duration-badge" title="Duration"><span aria-hidden="true">&#x23F1;</span> ${esc(course.duration)}</span>` : ""}
  </div>
  <h3 class="course-card-title"><a class="course-card-link" href="${url}">${esc(course.title)}</a></h3>
  <p class="course-card-desc">${esc(course.subtitle)}</p>
  <ul class="course-card-outcomes" aria-label="Key outcomes">
    ${outcomesHtml}
  </ul>
  <div class="course-card-pricing-wrap">
    <div class="course-card-pricing">
      <span class="price-current">₦${formatNaira(course.fee)}</span>
      ${course.originalFee ? `<span class="price-original"><s>₦${formatNaira(course.originalFee)}</s></span>` : ""}
    </div>
    ${course.isPopular ? `<span class="badge-popular">Popular</span>` : ""}
  </div>
  <div class="course-card-cta-row">
    <a class="button button-card-enrol" href="/apply/?course=${esc(course.slug)}">Enrol</a>
    <a class="button-card-details" href="${url}">Details <span class="arrow" aria-hidden="true">&nearr;</span></a>
  </div>
</div>
</article>`;
}

function renderHome() {
  const lead = site.leadCourses.map((slug) => courseBySlug.get(slug)).filter(Boolean);
  const paths = site.paths.map((item, index) => `<li>
<h3>${esc(item.name)}</h3>
<ol>${item.courses.map((slug) => { const c = courseBySlug.get(slug); return c ? `<li><a href="/courses/${esc(slug)}/">${esc(c.shortName || c.title)}</a></li>` : ""; }).join("")}</ol>
</li>`).join("");
  const why = home.why.items.filter(([,], index) => index !== 2 || site.flags.showServicesClaim).map(([term, text]) => `<li><strong>${esc(term)}</strong> ${esc(text)}</li>`).join("");
  const testimonials = site.flags.showTestimonials && Array.isArray(site.testimonials) && site.testimonials.length
    ? `<section class="section" aria-labelledby="testimonials"><h2 id="testimonials">${esc(home.testimonials.heading)}</h2></section>`
    : "";
  const discount = site.flags.showDiscountBanner && site.discountNote && site.discountConfirmed
    ? `<div class="discount">${esc(site.discountNote)}</div>`
    : "";
  const inner = `${discount}
<section class="hero wrap">
<p class="hero-kicker">${esc(site.brand.descriptor)}</p>
<h1>${esc(home.h1)}</h1>
<p class="hero-copy">${esc(home.subheading)}</p>
<div class="hero-actions">
<a class="button button-wa" href="${esc(whatsapp(sharedCopy.whatsappPresets.general))}">${esc(sharedCopy.buttons.whatsapp)}</a>
<a class="button button-quiet" href="/courses/">${esc(sharedCopy.buttons.allCourses)}</a>
</div>
<div class="hero-art" aria-hidden="true"><span class="orb orb-one"></span><span class="orb orb-two"></span><span class="grid-lines"></span></div>
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
<section class="section" aria-labelledby="paths-heading"><div class="wrap">
<h2 id="paths-heading">${esc(home.paths.heading)}</h2>
<p>${esc(home.paths.intro)}</p>
<ol class="paths">${paths}</ol>
</div></section>
<section class="section section-alt" aria-labelledby="services-heading"><div class="wrap">
<h2 id="services-heading">${esc(home.services.heading)}</h2>
<p>${esc(home.services.intro)}</p>
<ul class="service-list">${Object.entries(home.services.items).map(([slug, item]) => `<li><h3>${esc(item.name)}</h3><p>${esc(item.text)}</p><a class="text-link" href="/apply/?service=${esc(slug)}">${esc(sharedCopy.buttons.quote)}</a></li>`).join("")}</ul>
<p><a class="text-link" href="/services/">${esc(home.services.link)}</a></p>
</div></section>
<section class="section" aria-labelledby="why-heading"><div class="wrap">
<h2 id="why-heading">${esc(home.why.heading)}</h2>
<ul class="why-list">${why}</ul>
</div></section>
<section class="section section-alt" aria-labelledby="inside-heading"><div class="wrap">
<h2 id="inside-heading">${esc(home.inside.heading)}</h2>
<div class="gallery">
<figure><img src="/assets/img/training-lab-960.webp" srcset="/assets/img/training-lab-480.webp 480w, /assets/img/training-lab-960.webp 960w, /assets/img/training-lab-1600.webp 1600w" sizes="(min-width: 800px) 50vw, 100vw" width="960" height="540" loading="lazy" alt="OCATECH training lab"><figcaption>${esc(home.inside.caption)}</figcaption></figure>
<figure><img src="/assets/img/training-960.webp" srcset="/assets/img/training-480.webp 480w, /assets/img/training-960.webp 960w, /assets/img/training-1600.webp 1600w" sizes="(min-width: 800px) 50vw, 100vw" width="960" height="540" loading="lazy" alt="OCATECH training session"><figcaption>Training at the center.</figcaption></figure>
<figure><img src="/assets/img/instructor-guide-960.webp" srcset="/assets/img/instructor-guide-480.webp 480w, /assets/img/instructor-guide-960.webp 960w, /assets/img/instructor-guide-1600.webp 1600w" sizes="(min-width: 800px) 50vw, 100vw" width="960" height="540" loading="lazy" alt="OCATECH digital skills instructor guide"><figcaption>Digital skills guide used at OCATECH.</figcaption></figure>
</div>
<video class="center-video" controls preload="none" poster="/assets/img/video-poster.webp"><source src="/assets/video/ict-training.mp4" type="video/mp4"></video>
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
</section>
<section class="section"><div class="wrap">
<nav class="filters" aria-label="Filter courses by track">${filters}</nav>
<div id="course-list" class="course-grid">${cards}</div>
<p>${esc(coursesPage.empty)} <a class="text-link" href="${esc(whatsapp(sharedCopy.whatsappPresets.general))}">${esc(sharedCopy.buttons.whatsapp)}</a> and tell us your goal.</p>
</div></section>`;
  return { title: coursesPage.seoTitle, description: coursesPage.seoDescription, canonical: urls.for("/courses/"), inner, jsonLd: [] };
}

function renderCourse(course) {
  const track = trackById.get(course.track);
  const formatNaira = (num) => Number(num || 0).toLocaleString("en-NG");
  const courseFaq = [
    [courseTemplate.qExperience, course.prerequisites],
    [courseTemplate.qOnline, courseTemplate.aOnline],
    [courseTemplate.qEnd, courseTemplate.aEnd],
    ...faq.slice(0, 4),
  ];
  const next = course.nextSteps.map((slug) => courseBySlug.get(slug)).filter(Boolean)
    .map((item) => `<li><a href="/courses/${esc(item.slug)}/">${esc(item.title)}</a></li>`).join("");

  const inner = `<article class="course-page">
<header class="page-head wrap">
<span class="course-track-pill">${esc(trackName(course.track))}</span>
<h1>${esc(course.title)}</h1>
<p class="course-subtitle">${esc(course.subtitle)}</p>
<p class="course-lead-copy">${esc(course.summary)}</p>
<div class="course-hero-bar">
  <div class="hero-pricing">
    <span class="price-val">₦${formatNaira(course.fee)}</span>
    ${course.originalFee ? `<span class="price-orig"><s>₦${formatNaira(course.originalFee)}</s></span>` : ""}
  </div>
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
    <span class="spec-icon" aria-hidden="true">&#x23F1;</span>
    <div class="spec-info">
      <h3>Duration &amp; Schedule</h3>
      <p>${esc(course.duration || "Flexible pace")} · Weekdays &amp; weekends</p>
    </div>
  </div>
  <div class="spec-card">
    <span class="spec-icon" aria-hidden="true">&#x1F4CD;</span>
    <div class="spec-info">
      <h3>Training Format</h3>
      <p>100% in-person at our Onitsha center</p>
    </div>
  </div>
  <div class="spec-card">
    <span class="spec-icon" aria-hidden="true">&#x1F393;</span>
    <div class="spec-info">
      <h3>Skill Level</h3>
      <p>${esc(course.level)} · Practical hands-on training</p>
    </div>
  </div>
  <div class="spec-card">
    <span class="spec-icon" aria-hidden="true">&#x1F4BB;</span>
    <div class="spec-info">
      <h3>Equipment &amp; Facilities</h3>
      <p>Lab computers provided · Free Wi-Fi</p>
    </div>
  </div>
  <div class="spec-card">
    <span class="spec-icon" aria-hidden="true">&#x1F3C6;</span>
    <div class="spec-info">
      <h3>Certification</h3>
      <p>${esc(site.offer.certificate)}</p>
    </div>
  </div>
  <div class="spec-card">
    <span class="spec-icon" aria-hidden="true">&#x1F4B3;</span>
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
<div class="tuition-card">
  <div class="tuition-content">
    <h2 id="tuition-heading">Tuition &amp; Enrolment</h2>
    <p class="tuition-lead">Gain in-demand practical skills with step-by-step instructor guidance in Onitsha.</p>
    <div class="tuition-pricing">
      <span class="tuition-current">₦${formatNaira(course.fee)}</span>
      ${course.originalFee ? `<span class="tuition-original"><s>₦${formatNaira(course.originalFee)}</s></span>` : ""}
    </div>
    <p class="tuition-note">${esc(site.offer.feeNote)} Payment methods: ${site.offer.paymentMethods.join(", ")}.</p>
  </div>
  <div class="tuition-actions">
    <a class="button" href="/apply/?course=${esc(course.slug)}">${esc(sharedCopy.buttons.applyCourse)}</a>
    <a class="button button-wa" href="${esc(whatsapp(sharedCopy.whatsappPresets.course.replace("{course}", course.title)))}">${esc(sharedCopy.buttons.whatsapp)}</a>
  </div>
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
    "software-installation": '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    "cctv-installation": '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',
    "solar-installation": '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
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
        <a class="button button-small" href="/apply/?service=${esc(slug)}">${esc(sharedCopy.buttons.quote)}</a>
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

  const inner = `<section class="services-hero">
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
      <p class="section-subtitle">High-standard technical setup executed by trained technicians.</p>
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
      <a class="button" href="/apply/">${esc(sharedCopy.buttons.quote)}</a>
      <a class="button button-wa" href="${esc(whatsapp(sharedCopy.whatsappPresets.general))}">${esc(sharedCopy.buttons.whatsapp)}</a>
    </div>
  </div>
</section>`;
  return { title: services.seoTitle, description: services.seoDescription, canonical: urls.for("/services/"), inner, jsonLd: [] };
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
        <span class="trust-pill"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> Free Wi-Fi at Hub</span>
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
      <p class="section-subtitle">Comfortable, air-conditioned lab with individual computer workstations and high-speed internet.</p>
    </div>
    <div class="about-video-wrap">
      <video class="center-video" controls preload="none" poster="/assets/img/video-poster.webp"><source src="/assets/video/ict-training.mp4" type="video/mp4"></video>
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
      <p>${esc(about.visit)}</p>
      ${site.contact.landmarkOrDirections ? `<p class="contact-muted">${esc(site.contact.landmarkOrDirections)}</p>` : ""}
      ${site.contact.hours ? `<p class="contact-hours">Open ${esc(site.contact.hours)}.</p>` : ""}
    </div>
    <div class="hero-actions">
      <a class="button" href="/apply/">${esc(sharedCopy.buttons.applyNow)}</a>
      ${site.contact.googleMapsUrl ? `<a class="button button-quiet" href="${esc(site.contact.googleMapsUrl)}">Get directions &nearr;</a>` : ""}
    </div>
  </div>
</section>`;
  return { title: about.seoTitle, description: about.seoDescription, canonical: urls.for("/about/"), inner, jsonLd: [] };
}

function renderApply() {
  const groups = site.tracks.map((track) => `<optgroup label="${esc(track.name)}">${courseData.filter((course) => course.track === track.id).map((course) => `<option value="${esc(course.slug)}">${esc(course.title)}</option>`).join("")}</optgroup>`).join("");
  const services = site.services.map((service) => `<option value="${esc(service.slug)}">${esc(service.name)}</option>`).join("");
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
    </aside>

    <div class="apply-form-col">
      <div class="apply-card">
        <form id="apply-form" action="/api/apply" method="post" data-success="/success/" data-whatsapp="${esc(whatsapp(sharedCopy.whatsappPresets.general))}" data-messages="${esc(json(applyCopy.messages))}">
          <div id="form-errors" class="form-errors" role="alert" hidden></div>
          
          <div class="form-mode-switch" role="radiogroup" aria-label="Select application type">
            <label class="mode-switch-label">
              <input type="radio" name="type" value="learn" checked>
              <span class="mode-switch-pill">🎓 ${esc(applyCopy.learn)}</span>
            </label>
            <label class="mode-switch-label">
              <input type="radio" name="type" value="service">
              <span class="mode-switch-pill">🛠️ ${esc(applyCopy.service)}</span>
            </label>
          </div>

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

            <div id="learn-fields">
              <p class="form-field">
                <label for="course">${esc(applyCopy.fields.course)} <span class="req">*</span></label>
                <select id="course" name="course" required>
                  <option value="">Select a course...</option>
                  <option value="not-sure-yet">${esc(applyCopy.notSure)}</option>
                  ${groups}
                </select>
              </p>

              <fieldset class="form-fieldset">
                <legend>${esc(applyCopy.fields.mode)} <span class="req">*</span></legend>
                <div class="mode-chips">
                  <label class="chip-label">
                    <input type="radio" name="mode" value="In person" checked>
                    <span class="chip-pill">📍 In person (Onitsha Hub)</span>
                  </label>
                  <label class="chip-label">
                    <input type="radio" name="mode" value="Online">
                    <span class="chip-pill">💻 Online</span>
                  </label>
                </div>
              </fieldset>

              <div class="form-row-2">
                <p class="form-field">
                  <label for="current_status">${esc(applyCopy.fields.status)}</label>
                  <select id="current_status" name="current_status">
                    <option value="">Select your current status</option>
                    ${statusOptions}
                  </select>
                </p>
                <p class="form-field">
                  <label for="goal">${esc(applyCopy.fields.goal)}</label>
                  <select id="goal" name="goal">
                    <option value="">Select your choice</option>
                    ${goalOptions}
                  </select>
                </p>
              </div>

              <div class="form-row-2">
                <p class="form-field">
                  <label for="has_laptop">${esc(applyCopy.fields.laptop)}</label>
                  <select id="has_laptop" name="has_laptop">
                    <option value="">Select your choice</option>
                    ${laptopOptions}
                  </select>
                </p>
                <p class="form-field">
                  <label for="referral">${esc(applyCopy.fields.referral)}</label>
                  <select id="referral" name="referral">
                    <option value="">Select an option</option>
                    ${referralOptions}
                  </select>
                </p>
              </div>
            </div>

            <div id="service-fields" hidden>
              <p class="form-field">
                <label for="service">${esc(applyCopy.fields.service)} <span class="req">*</span></label>
                <select id="service" name="service">
                  <option value="">Select a service...</option>
                  ${services}
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

            <p class="consent">
              <label>
                <input type="checkbox" name="consent" value="true" required>
                <span>${esc(applyCopy.fields.consent)} <a href="/privacy/">Privacy Policy</a></span>
              </label>
            </p>

            <button class="button button-full" type="submit">${esc(sharedCopy.buttons.send)} &rarr;</button>
            <p class="form-guarantee-note">🔒 We respect your privacy. No spam or unsolicited messages.</p>
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
        <p class="honeypot"><label>Leave this blank <input type="text" name="website" tabindex="-1" autocomplete="off"></label></p>
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
      ${site.contact.googleMapsUrl ? `<a class="button button-quiet" href="${esc(site.contact.googleMapsUrl)}">Open in Google Maps &nearr;</a>` : ""}
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

const headerRules = [];
const sitemapPaths = ["/", "/courses/", "/services/", "/about/", "/apply/", "/contact/", "/privacy/"];

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
  ["services/index.html", renderServices()],
  ["about/index.html", renderAbout()],
  ["apply/index.html", renderApply()],
  ["contact/index.html", renderContact()],
  ["privacy/index.html", renderPrivacy()],
  ["success/index.html", renderSuccess()],
  ["404.html", render404()],
];

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
  `- Learning: in person at the Onitsha center. Courses are in person by default; ask us about online options. ${site.offer.admission} ${site.offer.certificate}. ${site.offer.perks.join(" ")}.`,
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
