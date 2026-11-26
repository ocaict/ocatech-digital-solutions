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
  const trackColorClass = `track-${esc(track?.color || "green")}`;
  const tools = (course.tools || []).slice(0, 4);
  const remaining = (course.tools || []).length - tools.length;
  const toolsList = tools.map((t) => `<li class="card-tool-tag">${esc(t)}</li>`).join("")
    + (remaining > 0 ? `<li class="card-tool-tag card-tool-more">+${remaining} more</li>` : "");

  return `<article class="course-card ${trackColorClass}${lead ? " course-card-lead" : ""}" data-course-track="${esc(course.track)}">
<div class="course-card-head">
<span class="course-card-track">${esc(trackName(course.track))}</span>
<span class="course-card-level">${esc(course.level)}</span>
</div>
<h3 class="course-card-title"><a class="course-card-link" href="${url}">${esc(course.title)}</a></h3>
<p class="course-card-desc">${esc(course.subtitle)}</p>
<div class="course-card-tools-wrap">
<span class="course-card-tools-label">Tools:</span>
<ul class="course-card-tools" aria-label="Tools learned in ${esc(course.title)}">${toolsList}</ul>
</div>
<div class="course-card-footer">
<span class="course-card-cta">View course <span class="cta-arrow" aria-hidden="true">&rarr;</span></span>
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
<p class="course-track track-${esc(track?.color || "green")}">${esc(trackName(course.track))}</p>
<h1>${esc(course.title)}</h1>
<p class="course-subtitle">${esc(course.subtitle)}</p>
<p>${esc(course.summary)}</p>
<div class="hero-actions">
<a class="button" href="/apply/?course=${esc(course.slug)}">${esc(sharedCopy.buttons.applyCourse)}</a>
<a class="button button-wa" href="${esc(whatsapp(sharedCopy.whatsappPresets.course.replace("{course}", course.title)))}">${esc(sharedCopy.buttons.whatsapp)}</a>
</div>
</header>
<section class="section"><div class="wrap key-facts">
<h2>Key facts</h2>
<dl>
<div><dt>Level</dt><dd>${esc(course.level)}</dd></div>
<div><dt>Track</dt><dd>${esc(trackName(course.track))}</dd></div>
<div><dt>Learn</dt><dd>${esc(courseTemplate.learn.replace("Learn: ", ""))}</dd></div>
<div><dt>Start</dt><dd>${esc(courseTemplate.start.replace("Start: ", ""))}</dd></div>
<div><dt>Duration</dt><dd>${esc(courseTemplate.duration.replace("Duration: ", ""))}</dd></div>
<div><dt>Fee</dt><dd>${esc(site.offer.feeNote)}</dd></div>
<div><dt>Certificate</dt><dd>${esc(site.offer.certificate)}</dd></div>
</dl>
</div></section>
<section class="section section-alt"><div class="wrap"><h2>${esc(courseTemplate.whoFor)}</h2><p>${esc(course.whoFor)}</p></div></section>
<section class="section"><div class="wrap"><h2>${esc(courseTemplate.outcomes)}</h2><ul>${course.outcomes.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></div></section>
<section class="section section-alt"><div class="wrap"><h2>${esc(courseTemplate.tools)}</h2><ul>${course.tools.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></div></section>
<section class="section"><div class="wrap"><h2>${esc(courseTemplate.finalProject)}</h2><p>${esc(course.finalProject)}</p></div></section>
<section class="section section-alt"><div class="wrap"><h2>${esc(courseTemplate.prerequisites)}</h2><p>${esc(course.prerequisites)}</p>${course.note ? `<p class="note">${esc(course.note)}</p>` : ""}</div></section>
${next ? `<section class="section"><div class="wrap"><h2>${esc(courseTemplate.nextSteps)}</h2><ul>${next}</ul></div></section>` : ""}
<section class="section section-alt"><div class="wrap"><h2>${esc(courseTemplate.questions)}</h2>${renderFaq(courseFaq)}</div></section>
<section class="section closing"><div class="wrap"><h2>${esc(courseTemplate.closing.replace("{course}", course.shortName || course.title))}</h2>
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
  const items = Object.entries(services.items).map(([slug, item]) => `<section class="section service-block${slug === "cctv-installation" ? " section-alt" : ""}" aria-labelledby="service-${esc(slug)}">
<div class="wrap"><h2 id="service-${esc(slug)}">${esc(item.name)}</h2><p>${esc(item.text)}</p>
<a class="button" href="/apply/?service=${esc(slug)}">${esc(sharedCopy.buttons.quote)}</a></div>
</section>`).join("");
  const inner = `<section class="page-head wrap"><h1>${esc(services.h1)}</h1><p>${esc(services.intro)}</p></section>
${items}
<section class="section section-alt closing"><div class="wrap"><h2>${esc(services.closing.heading)}</h2><p>${esc(services.closing.text)}</p>
<div class="hero-actions">
<a class="button" href="/apply/">${esc(sharedCopy.buttons.quote)}</a>
<a class="button button-wa" href="${esc(whatsapp(sharedCopy.whatsappPresets.general))}">${esc(sharedCopy.buttons.whatsapp)}</a>
</div></div></section>`;
  return { title: services.seoTitle, description: services.seoDescription, canonical: urls.for("/services/"), inner, jsonLd: [] };
}

function renderAbout() {
  const founder = site.flags.showFounder ? `<p>${esc(site.brand.founder.title)}: ${esc(site.brand.founder.name)}.</p>` : "";
  const inner = `<section class="page-head wrap"><h1>${esc(about.h1)}</h1></section>
<section class="section"><div class="wrap prose"><h2>Who we are</h2><p>${esc(about.who)}${site.flags.showServicesClaim ? esc(about.onePlaceClaim) : "."}</p></div></section>
<section class="section section-alt"><div class="wrap prose"><h2>What we do</h2><p>${esc(about.what)}</p></div></section>
<section class="section"><div class="wrap prose"><h2>How we teach</h2><ul>${about.how.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></div></section>
<section class="section section-alt"><div class="wrap prose"><h2>Who we teach</h2><p>${esc(about.audiences)}</p></div></section>
<section class="section"><div class="wrap prose"><h2>Registered business</h2><p>${esc(about.registered)}</p>${founder}</div></section>
<section class="section section-alt"><div class="wrap prose"><h2>Visit us</h2><p>${esc(about.visit)}</p>
${site.contact.landmarkOrDirections ? `<p>${esc(site.contact.landmarkOrDirections)}</p>` : ""}
${site.contact.hours ? `<p>Open ${esc(site.contact.hours)}.</p>` : ""}
<div class="hero-actions">
${site.contact.googleMapsUrl ? `<a class="button" href="${esc(site.contact.googleMapsUrl)}">Get directions</a>` : ""}
<a class="button button-wa" href="${esc(whatsapp(sharedCopy.whatsappPresets.general))}">${esc(sharedCopy.buttons.whatsapp)}</a>
</div></div></section>`;
  return { title: about.seoTitle, description: about.seoDescription, canonical: urls.for("/about/"), inner, jsonLd: [] };
}

function renderApply() {
  const groups = site.tracks.map((track) => `<optgroup label="${esc(track.name)}">${courseData.filter((course) => course.track === track.id).map((course) => `<option value="${esc(course.slug)}">${esc(course.title)}</option>`).join("")}</optgroup>`).join("");
  const services = site.services.map((service) => `<option value="${esc(service.slug)}">${esc(service.name)}</option>`).join("");
  const radioGroup = (name, values, required) => values.map((value) => `<label><input type="radio" name="${name}" value="${esc(value)}"${required && value === values[0] ? " checked" : ""}> ${esc(value)}</label>`).join("");
  const inner = `<section class="page-head wrap"><h1>${esc(applyCopy.h1)}</h1><p>${esc(applyCopy.intro)}</p></section>
<section class="section"><div class="wrap form-wrap">
<form id="apply-form" action="/api/apply" method="post" data-success="/success/" data-whatsapp="${esc(whatsapp(sharedCopy.whatsappPresets.general))}" data-messages="${esc(json(applyCopy.messages))}">
<div id="form-errors" class="form-errors" role="alert" hidden></div>
<fieldset><legend>What would you like?</legend>
<label><input type="radio" name="type" value="learn" checked> ${esc(applyCopy.learn)}</label>
<label><input type="radio" name="type" value="service"> ${esc(applyCopy.service)}</label>
</fieldset>
<div class="form-grid">
<p><label for="name">${esc(applyCopy.fields.name)}</label><input id="name" name="name" type="text" autocomplete="name" required minlength="2" maxlength="80"></p>
<p><label for="phone">${esc(applyCopy.fields.phone)}</label><input id="phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" required></p>
<p><label for="email">${esc(applyCopy.fields.email)}</label><input id="email" name="email" type="email" autocomplete="email"></p>
<div id="learn-fields">
<p><label for="course">${esc(applyCopy.fields.course)}</label><select id="course" name="course" required><option value="not-sure-yet">${esc(applyCopy.notSure)}</option>${groups}</select></p>
<fieldset><legend>${esc(applyCopy.fields.mode)}</legend>${radioGroup("mode", applyCopy.modes, true)}</fieldset>
<fieldset><legend>${esc(applyCopy.fields.start)}</legend>${radioGroup("start", applyCopy.starts, false)}</fieldset>
</div>
<div id="service-fields" hidden>
<p><label for="service">${esc(applyCopy.fields.service)}</label><select id="service" name="service"><option value="">${esc(applyCopy.notSure)}</option>${services}</select></p>
</div>
<p><label for="message">${esc(applyCopy.fields.message)}</label><textarea id="message" name="message" rows="5" maxlength="600"></textarea><span class="counter" id="message-count" aria-live="polite">0/600</span></p>
<p class="honeypot" aria-hidden="true"><label for="website">Website</label><input id="website" name="website" type="text" tabindex="-1" autocomplete="off"></p>
<input type="hidden" name="sourcePage" id="source-page" value="">
<p class="consent"><label><input type="checkbox" name="consent" value="true" required> ${esc(applyCopy.fields.consent)} <a href="/privacy/">Privacy</a></label></p>
<button class="button" type="submit">${esc(sharedCopy.buttons.send)}</button>
</div>
</form>
</div></section>
<section class="section section-alt"><div class="wrap"><h2>Common questions</h2>${renderFaq(faq.slice(0, homeFaqCount))}</div></section>`;
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
  const inner = `<section class="page-head wrap"><h1>${esc(contact.h1)}</h1><p>${esc(contact.intro)}</p></section>
<section class="section"><div class="wrap contact-grid">
<section><h2>Visit us</h2><p>${esc(site.contact.addressLine)}, ${esc(site.contact.city)}, ${esc(site.contact.state)}</p>
${site.contact.landmarkOrDirections ? `<p>${esc(site.contact.landmarkOrDirections)}</p>` : ""}
${site.contact.hours ? `<p>Open ${esc(site.contact.hours)}.</p>` : ""}
${site.contact.googleMapsUrl ? `<p><a href="${esc(site.contact.googleMapsUrl)}">Get directions</a></p>` : ""}</section>
<section><h2>WhatsApp</h2><p>${esc(site.contact.whatsapp.display)}</p><a class="button button-wa" href="${esc(whatsapp(sharedCopy.whatsappPresets.general))}">${esc(sharedCopy.buttons.whatsapp)}</a></section>
<section><h2>Phone</h2><ul>${site.contact.phones.map((phone) => `<li><a href="tel:${esc(phone.e164)}">${esc(phone.display)}</a></li>`).join("")}</ul></section>
<section><h2>Email</h2><p><a href="mailto:${esc(site.contact.email)}">${esc(site.contact.email)}</a></p></section>
</div></section>
<section class="section section-alt closing"><div class="wrap"><p>${esc(contact.closing)} <a class="text-link" href="/apply/">${esc(sharedCopy.buttons.applyNow)}</a></p></div></section>`;
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
    `frame-src 'none'${site.flags.enableTurnstile ? " https://challenges.cloudflare.com" : ""}`,
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
