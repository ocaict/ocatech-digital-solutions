# Revision 01: OCATECH website

Paste the prompt below into your build agent. Keep this file in the project folder next to `AGENTS.md`, because the prompt points to the detailed tasks in the sections after it.

---

## Prompt to paste

You are continuing work on the live OCATECH Digital Solutions website (https://ict.ocatech.workers.dev/). Read `AGENTS.md`, `data/site.json`, `data/courses.json`, `SITE-CONTENT.md` and this file (`REVISION-01.md`) first.

A review of the live site found trust risks, technical bugs and missing conversion features. Apply every task in this file, in order, phase by phase.

Rules for this revision:
1. **Never invent facts.** Every claim on the site must be something the owner has confirmed. If you are not sure, remove it and add it to `OPEN-QUESTIONS.md`.
2. **Ask the owner the questions in section A before you change prices, facility claims or class format.** Do the rest of Phase 0 while you wait.
3. **Do not add anything about SIWES, student industrial placements or ITF.** The owner has decided to leave it out.
4. Keep everything free, plain HTML/CSS/JS, Cloudflare Pages Functions and D1, as in `AGENTS.md`.
5. Work phase by phase. After each phase, run `tools/check.mjs`, tell me what changed in plain English, and list anything you need from me.
6. At the end, send the final report described in section G.

---

## A. Questions to ask the owner first

Ask these in one message, as a short numbered list. Do not guess answers.

1. Which of these are true today? Air-conditioned lab · high-speed internet · solar-powered workstations · stable power supply · individual computers for every student · online classes available · hybrid classes available. Keep only the true ones on the site.
2. Is training one-to-one, in small groups, or both? (The site currently says both “1-on-1” and “peer collaboration”.)
3. What are the final prices for all 17 courses, and is there a launch offer? If yes: the offer end date.
4. Is the installment plan really “50% deposit, then the balance”? Over how long?
5. Do any real students or finished student projects exist yet, and do they agree in writing to be shown?
6. What is the date, time and topic of the first free taster class, and how many seats (if limited)?
7. What is your Google review link? (Google Business Profile, then “Get more reviews”.)
8. Do you have a WhatsApp Channel link?
9. Which landmark spelling is correct: “Mr Bigs at Ogbommanu” or “Mr Biggs at Ogo-ommanu”?

---

## B. Phase 0: Trust and accuracy

### B1. Rebuild the Showcase page as “Projects you will build”
- Rename the page, its title, H1, nav label, meta description and URL title to “Projects you will build”. Keep the URL `/showcase/` but add a canonical and update internal links.
- **Delete**: every student name, cohort label, initials, the “₦42M+” figure, “built at 62 New Market Road”, “Every student graduates with real-world deliverables”, the stats “100% Practical Projects” and “Industry-Standard Tools & Software”, and any “Featured Student Projects” heading.
- **Replace with**: one card per course taken from the `finalProject` field in `data/courses.json`. Each card shows the course name, the sample project brief, the tools from the course, and a link to the course page. Label every card “Sample project brief”.
- New intro copy: “Every course ends with a project you can show. Here are the briefs you will work on.”
- Add a data structure for real student work (`data/student-work.json`) with fields: title, course, student first name, photo, link, `permissionConfirmed` (true/false), date. Render a “Student work” section **only** for entries with `permissionConfirmed: true`. With none, show nothing.
- Add the flag `showStudentWork: false` in `data/site.json`.

### B2. Remove unverified claims everywhere
Search the whole site and the chatbot facts for these and fix them (use the owner’s answers from section A):
- “Certified”, “certified on-site setup”, “trained technicians” → remove or change to “our team”.
- “we frequently recommend our vetted top graduates”, “many students start with zero experience”, “Because training is practical and 1-on-1” → remove.
- “air-conditioned”, “high-speed internet”, “solar-powered”, “stable power supply”, “dedicated computers”, “peer collaboration” → keep only if the owner confirms.
- “Popular” badge on course cards → remove.
- “100% practical”, “most trusted ICT hub”, “leading tech education hub”, “career-ready” style promises → change to plain, provable wording such as “practical from day one”.
- Update the chatbot FACTS block to match the confirmed facts, and add the rule that it never claims job placement, certification by outside bodies, or graduate numbers.

### B3. Prices and offers
- Keep the current prices in a single data file (`data/prices.json`: slug, price, regularPrice or null, durationWeeks). Do not change numbers until the owner confirms them.
- Add `offer.endsOn` (ISO date) and `offer.label` to `data/site.json`.
- If `regularPrice` exists: show it crossed out **only while** `endsOn` is in the future, with the text “Launch price until {date}”. After that date the build shows the single price. If there is no end date, show one price only.
- Make every statement about fees consistent: key facts on course pages, the FAQ, the apply page, the chatbot FACTS. Remove “Fees differ by course. Message us for the current fee” wherever a price is displayed. Use: “Prices are shown on each course page and on the fees page. Installments are available.”

### B4. Consistency clean-up
- One landmark value in `data/site.json` (`contact.landmarkOrDirections`), used everywhere. Remove the duplicated “Visit us” paragraph on the About page.
- Course pages: delete the duplicate “Do I need experience?” question. Keep the course-specific questions plus the prerequisite answer, and drop the generic block.
- Home and Apply keep the full FAQ. Course pages show only course-specific questions plus “How can I pay?”.

### B5. Interface clean-up
- Replace all emojis in the UI (🌐🤖📊🎨📈🛠️⏱👤) and the arrow characters (→ ↗) with one consistent set of inline SVG icons that use `currentColor`. Add `aria-hidden="true"` to decorative icons.
- Change the sticky “Call Center” button to “Call us”.

**Phase 0 acceptance:** a site-wide text search finds none of the removed phrases; no student name appears anywhere; every price statement agrees across pages.

---

## C. Phase 1: Technical fixes

### C1. Skill picker
Confirm it works with JavaScript: seven goals, results box, WhatsApp preset, Apply link. Remove the duplicated helper sentence (“Pick one and we will show the courses that fit.” appears twice). Keyboard operable, announces results to screen readers with `aria-live="polite"`. Without JavaScript the track links remain.

### C2. Video
Wrap videos in a proper `<video>` with `poster`, `controls`, `playsinline`, `preload="none"`, `muted` if it autoplays, and a text fallback that is not a bare file link. Compress to a reasonable size for mobile data (aim for under 10 MB). Add captions or a short transcript line below.

### C3. Forms (apply and quote)
- Make sure the honeypot field is invisible to people (positioned off-screen with CSS, `tabindex="-1"`, `autocomplete="off"`, `aria-hidden="true"`) and silently ignored by the server.
- Save attribution with every enquiry. Add columns to `leads`: `utm_source`, `utm_medium`, `utm_campaign`, `referrer` (migration in `db/schema.sql` plus a one-line `ALTER TABLE` note for the owner). Read UTM values from the page URL, keep them in `sessionStorage`, and send them with the form.
- Test both forms end to end: valid, invalid, honeypot filled, no JavaScript. Confirm the row appears in D1, the owner email arrives, and the “Continue on WhatsApp” button opens with the right preset.

### C4. Speed
Run Lighthouse (or ask the owner to run Google PageSpeed Insights) on the home page and one course page. Fix until mobile Performance and SEO are about 90 or more. Check image sizes, `srcset`, lazy loading, font loading, and unused JavaScript.

### C5. Structured data and breadcrumbs
Validate every JSON-LD block (home, course, services). Add visible breadcrumbs to course, services and guide pages (Home › Courses › Course). Never add ratings or reviews markup until real reviews exist.

**Phase 1 acceptance:** the picker, video and both forms work on a 360 px phone; leads arrive with UTM data; Lighthouse results are in the report.

---

## D. Phase 2: Getting found

### D1. Review link
Add `/review`, which redirects (302) to the owner’s Google review URL from section A. Add a printable QR code for it (SVG) at `assets/img/review-qr.svg`, and a short message template in `SETUP.md` for the owner to send after each class.

### D2. Local guides
Create `/guides/` (index) and three articles. Draft them for the owner to approve before publishing (put them behind a `draft: true` flag until approved). Each is 600 to 900 words, plain, specific to Onitsha, with internal links to relevant courses or services, a clear WhatsApp call to action, `Article` structured data, and no invented statistics, prices, brands or client stories.
1. **How to choose a computer training center in Onitsha**: what to look for (hands-on time, class size, what you finish with, payment terms, visiting before you pay, red flags). Do not name competitors.
2. **CCTV installation in Onitsha: what to ask before you pay**: questions to ask any installer (site visit, camera types, storage, remote viewing, warranty in writing, who maintains it). Link to the services page.
3. **AI tools for Onitsha traders: five ways to save time**: practical examples (customer replies, product descriptions, price lists, social posts, simple bookkeeping help), plus a warning about checking AI answers and protecting customer data. Link to the AI Tools course.

### D3. Search Console files
Make sure the sitemap includes the guides, fees, free-class, teams and verify pages. Add to `SETUP.md` plain steps for the owner to verify the site in Google Search Console and Bing Webmaster Tools, submit the sitemap, and request indexing for the key pages.

**Phase 2 acceptance:** `/review` redirects correctly; the three guides render as drafts and publish when the owner removes the flag; the sitemap lists all new pages.

---

## E. Phase 3: Conversion features

### E1. Fees page (`/fees/`)
- Title: “Course fees | OCATECH Digital Solutions”. H1: “Course fees”.
- Intro: “Clear prices for every course. Installments are available.”
- One table or list for all 17 courses grouped by track: course, level, duration, price (with launch-price rules from B3), a link to the course page, and an “Apply” link.
- An “Installments” block with the plan the owner confirmed (section A, question 4) and a line: “We will give you payment details directly. We never ask you to pay into an account sent by anyone else.”
- Add to the main nav only if the owner agrees; otherwise link from the Courses page and the footer.

### E2. Free taster class (`/free-class/`)
- Content comes from the owner’s answers (date, time, topic, seats). If any are missing, ask; do not make up a date. If no class is scheduled, show “Next free class: to be announced. Leave your details and we will message you.”
- Sign-up form (`type=taster`): name, phone, optional email, consent. Save to D1 and notify the owner.
- Say what the session covers and what people should bring. Do not promise outcomes.

### E3. WhatsApp setup
Add the WhatsApp Channel link to the footer and Contact page only if the owner supplied it. Put owner steps in `SETUP.md` for WhatsApp Business labels (New enquiry, Interested, Enrolled), quick replies (/courses, /fees, /location, /payment), and an away message.

### E4. Click tracking
- Add `/api/track` (POST) that increments a daily counter in a new D1 table `events (day, event, page, count)` for these events: `whatsapp_click`, `call_click`, `apply_start`, `apply_submit`, `quote_submit`, `taster_submit`, `chat_open`. No IP, no name, no phone, no cookies.
- Send events with `navigator.sendBeacon`. Fail silently.
- Add one sentence to the privacy page. Give the owner three ready SQL queries in `SETUP.md` (clicks by day, by page, by event) to read in the D1 dashboard.

### E5. Training for teams and schools (`/training-for-teams/`)
- H1: “Training for teams, schools and businesses”.
- What we can teach (from the course list), where (at our center or at your premises, if the owner confirms), the process (tell us your goal and team size, we propose a plan), and a request form (`type=team`: organisation, contact person, phone, number of people, topic, message).
- No prices, no client names, no claims of past clients.

### E6. Certificate verification (`/verify/`)
- Form with a certificate number; the Function looks it up in a D1 table `certificates (code, name, course, issued_on, revoked)` and shows name, course and date, or “No certificate found with that number.”
- Rate limit lookups (for example 20 per hour per hashed IP). Never show a list. Do not index the results page (`noindex`).
- Launch it with an empty table and the note “Verification opens when our first certificates are issued.” Put owner steps in `SETUP.md` to add rows through the D1 console.

**Phase 3 acceptance:** all five new pages render with titles, meta descriptions, canonical tags and structured data where relevant; each form saves to D1 and emails the owner; the events table fills when buttons are clicked.

---

## F. Do not build yet

Student testimonials (until real ones exist with consent), Paystack online deposits, a student portal, a referral discount, a teen holiday class, Meta Pixel, and anything about SIWES or ITF.

---

## G. Final report

Keep it short and in plain English:
1. What changed, phase by phase.
2. What you need from the owner (section A answers still missing, photos, review link, taster date), as a checklist.
3. Every claim you removed and every claim you kept because the owner confirmed it.
4. Test results: forms, picker, video, Lighthouse scores, structured data validation.
5. Anything you could not verify or decided differently, and why.
6. The next three improvements you recommend.
