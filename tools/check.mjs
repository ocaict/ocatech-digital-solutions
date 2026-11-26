import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { home, services as serviceCopy } from "../content/site.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const site = JSON.parse(fs.readFileSync(path.join(root, "data/site.json"), "utf8"));
const courses = JSON.parse(fs.readFileSync(path.join(root, "data/courses.json"), "utf8")).courses;
const errors = [];
const notes = [];
const fail = (message) => errors.push(message);
const note = (message) => notes.push(message);

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function relative(file) {
  return path.relative(dist, file).split(path.sep).join("/");
}

function routeFor(rel) {
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return `/${rel.slice(0, -"index.html".length)}`;
  return `/${rel}`;
}

function matches(tag, attribute, value) {
  return new RegExp(`${attribute}\\s*=\\s*["']${value}["']`, "i").test(tag);
}

function metaTag(tags, key) {
  return tags.find((tag) => tag.includes(`="${key}"`) || tag.includes(`='${key}'`));
}

function resolveTarget(pathname) {
  let clean;
  try {
    clean = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (!clean.startsWith("/")) return null;
  let target;
  if (clean === "/") target = path.join(dist, "index.html");
  else {
    const safe = path.normalize(clean).replace(/^([/\\]|\.\.[/\\])+/, "");
    target = path.extname(safe)
      ? path.join(dist, safe)
      : path.join(dist, safe, "index.html");
  }
  if (target !== dist && !target.startsWith(`${dist}${path.sep}`)) return null;
  return target;
}

if (!fs.existsSync(dist)) {
  console.error("dist/ does not exist. Run node tools/build.mjs first.");
  process.exit(1);
}

const allFiles = walk(dist);
const htmlFiles = allFiles.filter((file) => file.endsWith(".html")).sort();
const headers = fs.existsSync(path.join(dist, "_headers")) ? fs.readFileSync(path.join(dist, "_headers"), "utf8") : "";
const sitemap = fs.existsSync(path.join(dist, "sitemap.xml")) ? fs.readFileSync(path.join(dist, "sitemap.xml"), "utf8") : "";
const robots = fs.existsSync(path.join(dist, "robots.txt")) ? fs.readFileSync(path.join(dist, "robots.txt"), "utf8") : "";
const courseSlugs = new Set(courses.map((course) => course.slug));
const routes = new Set(htmlFiles.map((file) => routeFor(relative(file))));

if (courses.length !== 17) fail(`Expected 17 courses, found ${courses.length}.`);
if (!headers.includes("Content-Security-Policy")) fail("_headers has no Content-Security-Policy.");
if (!headers.includes("X-Content-Type-Options: nosniff")) fail("_headers is missing nosniff.");
if (!headers.includes("Referrer-Policy: strict-origin-when-cross-origin")) fail("_headers is missing Referrer-Policy.");
if (!headers.includes("X-Frame-Options: DENY")) fail("_headers is missing X-Frame-Options.");
if (!headers.includes("Permissions-Policy")) fail("_headers is missing Permissions-Policy.");
if (!headers.includes("Cache-Control: public, max-age=31536000, immutable")) fail("_headers is missing immutable asset caching.");
if (headers.includes("challenges.cloudflare.com") && !site.flags.enableTurnstile) fail("Turnstile is allowed in CSP but disabled in site.json.");
if (!robots.includes("Sitemap:")) fail("robots.txt has no sitemap line.");

for (const route of ["/", "/courses/", "/services/", "/about/", "/apply/", "/contact/", "/privacy/", "/success/", "/404.html", ...[...courseSlugs].map((slug) => `/courses/${slug}/`)]) {
  if (!routes.has(route)) fail(`Missing page: ${route}`);
}

const titles = new Map();
const descriptions = new Map();

for (const file of htmlFiles) {
  const rel = relative(file);
  const route = routeFor(rel);
  const html = fs.readFileSync(file, "utf8");
  const metaTags = [...html.matchAll(/<meta\b[^>]*>/gi)].map((match) => match[0]);

  if ((html.match(/<title\b/gi) || []).length !== 1) fail(`${rel}: expected one title.`);
  if ((html.match(/<h1\b/gi) || []).length !== 1) fail(`${rel}: expected one H1.`);
  if (!metaTag(metaTags, "description")) fail(`${rel}: missing meta description.`);

  const canonicalTag = html.match(/<link\b[^>]*\brel=["']canonical["'][^>]*>/i)?.[0];
  if (!canonicalTag) fail(`${rel}: missing canonical link.`);
  else {
    const href = canonicalTag.match(/\bhref\s*=\s*["']([^"']*)["']/i)?.[1];
    if (!href) fail(`${rel}: canonical has no href.`);
    else {
      let parsed;
      try { parsed = new URL(href); } catch { fail(`${rel}: canonical is not a valid URL.`); }
      if (parsed && parsed.pathname !== route) fail(`${rel}: canonical path ${parsed.pathname} does not match ${route}.`);
      if (/REPLACE-WITH/i.test(href)) note("Update siteUrl in data/site.json after the first deploy.");
    }
  }

  for (const key of ["og:title", "og:description", "og:url", "og:image", "twitter:card", "twitter:title", "twitter:description", "twitter:image"]) {
    if (!metaTag(metaTags, key)) fail(`${rel}: missing ${key} tag.`);
  }

  const robotsTag = metaTag(metaTags, "robots") || "";
  const noindex = /noindex/i.test(robotsTag);
  if ((route === "/404.html" || route === "/success/") && !noindex) fail(`${rel}: should be noindex.`);
  if (route !== "/404.html" && route !== "/success/" && noindex) fail(`${rel}: should not be noindex.`);

  const ldScripts = [...html.matchAll(/<script\b[^>]*\btype=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  if (ldScripts.length === 0 && route !== "/services/" && route !== "/about/" && route !== "/contact/" && route !== "/privacy/") note(`${rel}: no structured data.`);
  for (const match of ldScripts) {
    try { JSON.parse(match[1]); } catch { fail(`${rel}: invalid JSON-LD.`); }
    const hash = crypto.createHash("sha256").update(match[1]).digest("base64");
    if (!headers.includes(`'sha256-${hash}'`)) fail(`${rel}: JSON-LD is missing its CSP hash.`);
  }

  if (/<script\b(?![^>]*\bsrc=)(?![^>]*\btype=["']application\/ld\+json["'])[^>]*>/i.test(html)) fail(`${rel}: inline script found.`);
  if (/<[^>]*\sstyle\s*=/i.test(html)) fail(`${rel}: inline style found.`);
  if (/javascript:/i.test(html)) fail(`${rel}: javascript: URL found.`);
  if (/\son(?:click|load|error|mouseover|focus)\s*=/i.test(html)) fail(`${rel}: inline event handler found.`);

  const visible = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:amp|quot|lt|gt|nbsp|#39);/g, " ")
    .replace(/\s+/g, " ");

  if (/\b(?:null|undefined|NaN)\b/i.test(visible)) fail(`${rel}: leaked null, undefined or NaN in visible text.`);
  if (/\[[^\]]{1,80}\]|\{[^{}]{1,80}\}|\bTODO\b|\bFIXME\b|lorem ipsum|REPLACE-WITH/i.test(visible)) fail(`${rel}: placeholder text found.`);
  if (!site.flags.showFees && /₦|\bNGN\b/.test(html)) fail(`${rel}: fee shown while showFees is false.`);
  if (!site.flags.showTestimonials && visible.includes("What students say")) fail(`${rel}: testimonials shown while hidden.`);
  if (!site.flags.showFounder && visible.includes("Founder & Director")) fail(`${rel}: founder shown while hidden.`);
  if (!site.flags.showDiscountBanner && visible.includes("75% discount")) fail(`${rel}: discount shown while hidden.`);

  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0];
    if (!/\balt\s*=/.test(tag)) fail(`${rel}: image without alt text.`);
    if (!/\bwidth\s*=/.test(tag) || !/\bheight\s*=/.test(tag)) fail(`${rel}: image without width and height.`);
  }

  const refs = [];
  for (const pattern of [/\bhref\s*=\s*["']([^"']*)["']/gi, /\bsrc\s*=\s*["']([^"']*)["']/gi, /\bposter\s*=\s*["']([^"']*)["']/gi, /\bdata-src\s*=\s*["']([^"']*)["']/gi]) {
    for (const match of html.matchAll(pattern)) refs.push(match[1]);
  }
  for (const match of html.matchAll(/\bsrcset\s*=\s*["']([^"']*)["']/gi)) {
    for (const candidate of match[1].split(",")) refs.push(candidate.trim().split(/\s+/)[0]);
  }

  for (const ref of refs) {
    if (!ref || ref.startsWith("#") || ref.startsWith("mailto:") || ref.startsWith("tel:") || ref.startsWith("data:")) continue;
    if (/^https?:\/\//i.test(ref)) {
      let parsed;
      try { parsed = new URL(ref); } catch { continue; }
      if (parsed.host === "wa.me" || parsed.host === "www.wa.me") continue;
      if (!parsed.pathname.startsWith("/assets/")) continue;
      refs.push(parsed.pathname);
      continue;
    }
    if (ref.startsWith("//")) {
      fail(`${rel}: protocol-relative URL ${ref}`);
      continue;
    }
    const pathname = ref.split(/[?#]/)[0];
    if (!pathname || pathname.startsWith("/api/")) continue;
    const target = resolveTarget(pathname);
    if (!target || !fs.existsSync(target)) fail(`${rel}: broken local reference ${ref}`);
  }

  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const description = metaTag(metaTags, "description")?.match(/\bcontent\s*=\s*["']([^"']*)["']/i)?.[1]?.trim();
  if (title) {
    if (titles.has(title)) fail(`Duplicate title on ${rel} and ${titles.get(title)}.`);
    titles.set(title, rel);
  }
  if (description) {
    if (descriptions.has(description)) fail(`Duplicate description on ${rel} and ${descriptions.get(description)}.`);
    descriptions.set(description, rel);
  }

  const bytes = fs.statSync(file).size;
  if (bytes > 60 * 1024) fail(`${rel}: HTML is ${Math.round(bytes / 1024)} KB (limit 60 KB).`);
}

const sitemapPaths = [...sitemap.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map((match) => {
  try { return new URL(match[1].trim()).pathname; } catch { fail("Sitemap has an invalid URL."); return null; }
}).filter(Boolean);
if (sitemapPaths.length !== new Set(sitemapPaths).size) fail("Sitemap has duplicate URLs.");
for (const route of sitemapPaths) if (!routes.has(route)) fail(`Sitemap lists missing page ${route}.`);
for (const file of htmlFiles) {
  const route = routeFor(relative(file));
  const html = fs.readFileSync(file, "utf8");
  const noindex = /<meta\b[^>]*\bname=["']robots["'][^>]*\bcontent=["']noindex/i.test(html);
  if (!noindex && !sitemapPaths.includes(route)) fail(`${route}: indexable page missing from sitemap.`);
}

for (const course of courses) {
  for (const slug of course.nextSteps || []) if (!courseSlugs.has(slug)) fail(`${course.slug}: nextSteps references unknown slug ${slug}.`);
}
for (const item of site.paths) {
  for (const slug of item.courses || []) if (!courseSlugs.has(slug)) fail(`Path ${item.id}: unknown course slug ${slug}.`);
}
for (const slug of site.leadCourses || []) if (!courseSlugs.has(slug)) fail(`leadCourses: unknown slug ${slug}.`);
for (const choice of home.picker.choices || []) {
  for (const slug of choice[1] || []) if (!courseSlugs.has(slug)) fail(`Picker choice ${choice[0]}: unknown slug ${slug}.`);
}
const serviceSlugs = new Set(site.services.map((service) => service.slug));
for (const slug of Object.keys(serviceCopy.items)) if (!serviceSlugs.has(slug)) fail(`Service copy references unknown slug ${slug}.`);

const cssFiles = allFiles.filter((file) => file.endsWith(".css"));
const jsFiles = allFiles.filter((file) => file.endsWith(".js"));
for (const file of cssFiles) {
  const size = zlib.gzipSync(fs.readFileSync(file), { level: 9 }).length;
  if (size > 40 * 1024) fail(`${relative(file)}: compressed CSS is ${Math.round(size / 1024)} KB (limit 40 KB).`);
}
for (const file of jsFiles) {
  const size = zlib.gzipSync(fs.readFileSync(file), { level: 9 }).length;
  if (size > 40 * 1024) fail(`${relative(file)}: compressed JS is ${Math.round(size / 1024)} KB (limit 40 KB).`);
}
const video = path.join(dist, "assets/video/ict-training.mp4");
if (fs.existsSync(video)) {
  const size = fs.statSync(video).size;
  if (size > 10 * 1024 * 1024) fail(`Video is ${(size / 1024 / 1024).toFixed(1)} MB (limit 10 MB).`);
  if (size > 25 * 1024 * 1024) fail("Video exceeds the Cloudflare Pages file limit.");
} else fail("Video is missing from dist/assets/video/.");

const secretPatterns = [
  /(?:GROQ_API_KEY|RESEND_API_KEY|TURNSTILE_SECRET)\s*[=:]\s*["']?[A-Za-z0-9_\-]{12,}/,
  /sk-[A-Za-z0-9_\-]{16,}/,
  /re_[A-Za-z0-9]{16,}/,
];
for (const file of allFiles.filter((item) => /\.(?:html|css|js|json|xml|txt)$/i.test(item))) {
  const contents = fs.readFileSync(file, "utf8");
  for (const pattern of secretPatterns) if (pattern.test(contents)) fail(`${relative(file)}: possible secret found.`);
}

if (errors.length) {
  console.error(`Check failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:`);
  for (const error of errors.slice(0, 60)) console.error(`- ${error}`);
  if (errors.length > 60) console.error(`- ...and ${errors.length - 60} more`);
  process.exit(1);
}

console.log(`Checked ${htmlFiles.length} pages, ${cssFiles.length} CSS files and ${jsFiles.length} JS files.`);
for (const item of new Set(notes)) console.log(`Note: ${item}`);
