# AGENTS.md — OCATECH Digital Solutions website

Build a $0, phone-fast, local-search-friendly site for a non-developer owner. Keep owner-facing messages short and plain. The build is scaffolded: zero-dependency Node, no framework, `package.json`, CI or `opencode.json`. The sources of truth are `data/site.json` and `data/courses.json` even though older brief text says root JSON files.

## 1. Source of truth

Read before writing code: `SITE-CONTENT.md` (exact copy + chat prompt), `data/site.json`, `data/courses.json`, `00-START-PROMPT.md`.

- In `SITE-CONTENT.md`, `{curly}` means fill from data; `[brackets]` are instructions, never copy.
- Never invent facts. `null` means unknown: hide the element and add it to `OPEN-QUESTIONS.md`. No fake testimonials, prices, durations, discounts, hours, trainer names, addresses, photos, ratings, awards or accreditation.
- Owner decisions win. If you disagree, say so in the final report, but build what was decided.
- Visible text uses typographic apostrophes (’) and curly quotes (“ ”). Straight quotes only inside HTML/CSS/JS/JSON syntax.

## 2. Assets

Already supplied and moved to `assets/incoming/`: `ocatech-logo.png`, `training.png`, `training-lab.png`, `digital-skill-training-instructor guide.png`, `ict-training.mp4`. Do not re-ask for these. Originals are not served; git-ignore them and optimise into `assets/img/`.

Ask only for what is missing, adapting this message:

> I have the logo, photos and video. I still need: opening days and hours; a Google Maps link plus one or two landmarks; any social links you have; your `*.pages.dev` address if created; an inspiration website if you have one; and confirmation of founder visibility, service scope, online delivery for every course, privacy retention/analytics and certificate wording. If any key view is missing — entrance with sign, classroom, computers, hardware workbench, hands on keyboards, street frontage — please send it. If something is not ready, say “later” and I will hide that part.

If the owner says “later”, use neutral dev-only placeholders, hide those sections in production, and keep `ASSETS-TODO.md` current. No stock photos, AI photos or other people’s logos as if they were the center.

Processing: strip EXIF/GPS; WebP at 480/960/1600 px with `srcset`, `sizes`, `width`, `height` and lazy loading except the hero; hero ≤150 KB, others ≤100 KB. Favicons 32/180/192/512 px plus a 1200×630 share image. Video: H.264 MP4, 720p, `preload="none"`, poster, no autoplay with sound, well under 10 MB; check the current Pages per-file limit, and use a click-to-load YouTube/Facebook embed if too large. Alt text describes what is visible. Only use photos of people who agreed to appear.

## 3. Stack and exact commands

- Cloudflare Pages from GitHub. Build command: `node tools/build.mjs`. Output: `dist`. Functions: `/functions/api/apply.js`, `/functions/api/chat.js`. D1 binding: `DB`.
- Env: `GROQ_API_KEY`, `GROQ_MODEL`, `RESEND_API_KEY`, `NOTIFY_EMAIL`, `IP_SALT`, optional `TURNSTILE_SECRET`. Never put secrets in repo, HTML, JSON or front-end code; use Cloudflare variables or git-ignored `.dev.vars`.
- Zero-dependency Node build reads data/copy/templates, writes real static HTML to `dist/` including `dist/courses/{slug}/index.html`, generates `sitemap.xml`, `robots.txt`, JSON-LD, canonical and OG tags, copies assets, then runs `node tools/check.mjs`.
- No frameworks, paid services, paid fonts or paid plugins; check every dependency licence. No custom domain yet; `siteUrl` is a placeholder until deploy, then update and redeploy.
- Verify current docs before relying on anything changeable: Cloudflare Pages/D1 limits and config, Groq free model IDs and limits, Resend sending rules, Pages file size limit.
- If scaffolding the planned `data/` layout, move the root JSON files and update references; do not duplicate sources.

## 4. Pages and behaviour

Pages: Home, Courses, 17 course pages, Services, About, Apply, Contact, Privacy, 404. All words come from `SITE-CONTENT.md`; all content is visible without JavaScript.

- Skill picker: vanilla JS from a small JSON object, keyboard/screen-reader accessible; no-JS fallback is links to course tracks; result links to courses plus WhatsApp preset and Apply.
- Courses filter: plain `/courses/?track=web` links, enhanced with JS.
- WhatsApp: use exact presets from `SITE-CONTENT.md` §1, URL-encoded, number `2348165321429`.
- Apply form: submits to the same endpoint with JS off; JS adds inline validation, sending state and WhatsApp continue; preselect from `?course=` or `?service=`.
- Chat: load script only after the first tap; keyboard accessible; never blocks the page.
- `flags` in `site.json` gate fees, discount banner, testimonials, founder, chatbot, analytics and Turnstile. While `showFees` is false, show only `offer.feeNote`, never prices. Testimonials render nothing while hidden or empty. Analytics only with an owner-supplied token.

## 5. Design constraints

- Modern, tech-forward dark UI with gradients. Brand colours live once as CSS custom properties so they can be swapped later; gradients are built from tokens.
- navy `#071125`, logo blue `#012D96`, orange `#FF6600`, red `#FF0000`; track colours green/cyan/magenta/slate blue/logo blue/red. Derive surface, border, muted and text tokens from navy in the same block. Use navy text on orange; keep red and slate blue for edges, tags and large shapes, not small text. Track name always appears in text.
- Two open-licence self-hosted WOFF2 families with system fallback and `font-display: swap`; ≤3 weights and <80-character lines. Bricolage Grotesque/Figtree are suggested; if substituted, say why in the report.
- The skill picker is the one memorable element; keep its surroundings quiet. Six lead courses get prominence, paths are ordered lists, FAQ is a plain list, catalogue is compact rows. Numbers are for real sequences such as “How it works”.
- Motion: one orchestrated hero load moment, then only in response to a visitor action. Respect `prefers-reduced-motion`.
- Avoid ALL-CAPS labels above every heading, one coloured headline word, arrows on every button, middle-dot meta lines, identical soft shadows and fade-slide on every section. Copy is sentence case, plain verbs, specific over clever; buttons say exactly what happens.
- Mobile first at 360 px, 44×44 px tap targets, semantic landmarks, one H1, visible focus, labelled fields, field-tied errors, skip link, AA contrast, no layout shift, no blocking third-party scripts.
- Budgets per page: HTML <60 KB, CSS <40 KB compressed, core JS <40 KB; chat loads separately. Target Lighthouse mobile ≥90 for Performance, Accessibility, Best Practices and SEO.

## 6. Functions, data and security

`POST /api/apply`: JSON or form-encoded; validate server-side. Fields: `type`, `name`, `phone`, `email`, `course`, `service`, `mode`, `start`, `message`, `consent`, `website`, `turnstileToken`, `sourcePage`. Name 2–80 chars; phone normalised to Nigerian formats (`0816…`, `+234816…`, `234816…`); message ≤600; consent true; course exists in `courses.json`; service exists in `site.json`; honeypot filled means success without saving. Rate limit >5/hour per hashed IP in D1. Insert into `leads`, email `NOTIFY_EMAIL` via Resend, return `{ ok: true, whatsappUrl }`. Email failure after insert still succeeds and logs; both failing returns a clear error. Verify Turnstile only when the flag is on. Until a domain is verified, Resend’s test sender may only deliver to the owner’s own email; tell the owner what applies.

`POST /api/chat`: body `{ messages: [{ role, content }] }`; keep last 6, trim user messages to 500 chars, reject empty/oversized. System prompt from `SITE-CONTENT.md` §13 plus FACTS generated at build time into a module; never read data files at runtime. Call Groq’s OpenAI-compatible endpoint with `GROQ_MODEL`; temperature ~0.2, max ~300 tokens. Daily limit ~30 per hashed IP; over limit returns limit message + WhatsApp. Replace replies containing currency, percentages or “guarantee” with handoff. Upstream errors return the friendly error + WhatsApp, never a stack trace. Never log message content; log status and timing only.

```sql
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  course TEXT,
  service TEXT,
  mode TEXT,
  start_pref TEXT,
  message TEXT,
  source_page TEXT,
  status TEXT NOT NULL DEFAULT 'new'
);

CREATE TABLE IF NOT EXISTS usage (
  day TEXT NOT NULL,
  kind TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, kind, ip_hash)
);
```

`_headers`: strict CSP (no inline scripts/styles or `style=""`; allow Turnstile only if enabled), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, restrictive `Permissions-Policy`, long-lived caching for fingerprinted assets. Parameterised D1 queries; escape user content in emails; hash IPs with `IP_SALT` and never store raw IPs. Chat footer note: do not type passwords or bank details. Never publish bank account numbers or personal phone numbers beyond `site.json`.

## 7. SEO

Unique title ~60 chars and description ~155 chars on every page from data/`SITE-CONTENT.md`; one H1; canonical from `siteUrl`; `404.html` noindex. Home: `EducationalOrganization` + `LocalBusiness` with name, address, phones, email, `areaServed` and `sameAs`. Course pages: `Course` with OCATECH as provider plus `BreadcrumbList`. FAQ pages: `FAQPage`. Validate all JSON-LD. OG and Twitter tags plus a real 1200×630 share image on every page. Home links all six lead courses and six paths; every course links `nextSteps` and the courses index. Use Onitsha, Nkpor, Obosi and Awka naturally; add no ratings or reviews until real. Name, address and phone must match the Google Business Profile; link GBP and socials only when supplied.

## 8. Owner confirmations

Maintain `OPEN-QUESTIONS.md`; never show unconfirmed claims. Outstanding: hours; maps/landmarks; social links; Pages URL; fees/durations and the 75% discount; founder visibility; what installation services include and whether the “one place” claim is true; online delivery for every course; privacy retention/analytics; certificate wording and verification. The privacy page is a draft in `SITE-CONTENT.md` §10: match it to what is built, mark it for owner review, and do not present it as legal advice.

## 9. Owner setup guide

Write `SETUP.md` in plain click-by-click language: GitHub account/repo and upload; Cloudflare Pages project from repo with build command/output; create D1, run `db/schema.sql`, bind `DB`; create Groq and Resend keys and add encrypted variables including `.dev.vars.example` locally; deploy, test form/chat, update `siteUrl`, redeploy; add live URL to Google Business Profile and submit sitemap in Google Search Console; update courses/contact by editing the JSON source; read leads in the D1 dashboard and see where emails arrive.

## 10. Quality checks before done

`node tools/check.mjs` must pass: internal links/images resolve; no placeholder labels in `dist/`; every page has title, description, canonical, one H1 and valid JSON-LD; no leaked `null`/`undefined`; no secrets; `nextSteps` and path slugs exist; sitemap lists every page.

Then hand-test 360 px and desktop; keyboard focus; form with JS on/off, valid/invalid and honeypot filled; chat with on-topic, off-topic, price and prompt-override questions; Lighthouse home page and one course page.

## 11. Final report to owner

Short, plain English: what was built and where; checklist from `OPEN-QUESTIONS.md` and `ASSETS-TODO.md`; exact deploy steps pointing to `SETUP.md`; disagreements, changes and anything unverified including current free-tier limits and the chosen Groq model; measured Lighthouse scores; after launch, first Google reviews, a free taster class and a custom domain when income allows.
