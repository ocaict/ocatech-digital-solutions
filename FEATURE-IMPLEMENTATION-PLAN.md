# FEATURE IMPLEMENTATION PLAN — OCATECH Digital Solutions

**Author:** World-Class Web Engineer & Digital Marketer / CRO Specialist  
**Project:** OCATECH Digital Solutions (`https://ict.ocatech.workers.dev` → `ocatech.com.ng`)  
**Stack:** Zero-dependency Node.js SSG, Cloudflare Pages, Cloudflare D1, Cloudflare Workers/Functions.  
**Constraint:** $0 monthly recurring cost, sub-50ms speed, 100% mobile responsive, Nigerian market-optimized.

---

## Executive Summary & Feature Scope

To scale OCATECH from an attractive informational site into a premier student acquisition machine in Anambra State, we are executing a sequential rollout of high-ROI conversion features (excluding the B2B CCTV/Solar Estimator as requested).

### Ordered Implementation Roadmap

| Sequence | Feature Code | Feature Name | Primary Business Goal | Target Location |
| :---: | :---: | :--- | :--- | :--- |
| **Step 1** | **P1-BAR** | **Mobile Sticky Action Bar** | 15–25% lift in immediate mobile enquiries | Sitewide (Mobile devices) |
| **Step 2** | **P2-INST** | **Tuition & Installment Plan Breakdown** | Removes #1 price objection; increases course enrolment | All 17 Course Pages |
| **Step 3** | **P4-SHOW** | **Student Showcase & Portfolio Gallery** | Hard visual proof of student competence; destroys doubt | New `/showcase/` page + Course cross-links |
| **Step 4** | **P5-SYLL** | **Instant Course Syllabus & Outline Action** | Captures high-intent prospects asking for curriculum | All 17 Course Pages |
| **Step 5** | **P6-TOUR** | **Book a Free Center Tour & Lab Session** | Converts online visitors into physical foot traffic | `/apply/` + Contact + Home |

---

## Detailed Feature Specifications

### 1. Feature P1: Mobile Sticky Action Bar (`P1-BAR`)
* **Objective:** Give mobile visitors instant, thumb-friendly access to either directly dial the center (`0816 532 1429`) or chat on WhatsApp at any point while reading courses, paths, or services.
* **UX & Behavior:**
  - Hidden on desktop (`min-width: 760px`).
  - Floats fixed at bottom of mobile viewports with blur backdrop (`backdrop-filter: blur(12px)`).
  - Two high-contrast touch targets (minimum 48px height):
    - `📞 Call Center` (direct `tel:08165321429` trigger).
    - `💬 WhatsApp` (contextual WhatsApp link).
  - Seamlessly respects the circular chat widget so they don't overlap.
* **Tech:** Pure CSS + layout integration, 0 layout shift (CLS 0.00).

---

### 2. Feature P2: Tuition & Flexible Installment Breakdown (`P2-INST`)
* **Objective:** Remove upfront cost friction. Parents and self-sponsored learners in Onitsha often abandon course pages assuming the full fee is due on day one.
* **UX & Behavior:**
  - Integrated directly into the `.tuition-card` on every course page (`/courses/{slug}/`).
  - Clear 3-way payment breakdown:
    1. **Full Tuition:** ₦X (Single payment at registration).
    2. **2-Part Installment:** 50% at registration + 50% at mid-term (e.g. ₦15,000 + ₦15,000 for a ₦30,000 course).
    3. **3-Part Flexible Plan:** 40% registration + 30% month two + 30% project phase.
  - Direct conversion button: **“Enrol on Installment Plan on WhatsApp →”** pre-filling the exact course name and plan.
* **Tech:** Pure static calculation generated in SSG at build time. Zero runtime JS required for base view, accessible to all users without scripts.

---

### 3. Feature P4: Student Showcase & Portfolio Gallery (`P4-SHOW`)
* **Objective:** Provide undeniable evidence that students at OCATECH actually build real, marketable software, designs, and data projects.
* **UX & Behavior:**
  - New route: `/showcase/index.html`.
  - Added to navigation and sitemap.
  - Categories:
    - 🌐 **Web & Software:** E-commerce stores, responsive business landing pages, full-stack web apps.
    - 🎨 **Graphic Design & Branding:** Brand identity packages, event posters, social media banners for local businesses.
    - 🎬 **Video & Content Creation:** Promo video edits, YouTube shorts, reels created in Premiere Pro.
    - 📊 **Data & Analytics:** Excel business spreadsheets, interactive Power BI sales dashboards.
  - Each showcase project item features:
    - Project screenshot/mockup
    - Project title and student name / cohort
    - Tools used (e.g., `React`, `Photoshop`, `Power BI`)
    - Course linkage: *"Created during [Course Title]"* with direct link to that course.
* **Tech:** Static build generation, fully responsive grid, optimized WebP mockups.

---

### 4. Feature P5: 1-Click Course Syllabus / Outline Action (`P5-SYLL`)
* **Objective:** Satisfy prospects who want to see week-by-week curriculum topics before committing.
* **UX & Behavior:**
  - Added to individual course pages alongside tuition and prerequisites.
  - A dedicated action card: **“Need the full syllabus or company sponsorship proposal?”**
  - Instant button: **“Request Syllabus on WhatsApp”** with pre-filled message: *"Hello OCATECH, please send me the detailed syllabus for {Course Name}."*
  - Includes quick curriculum summary modal/details accordion.

---

### 5. Feature P6: Free Center Tour & Lab Session Booking (`P6-TOUR`)
* **Objective:** Bring prospects into the physical training center at 62 New Market Road.
* **UX & Behavior:**
  - Option added to the `/apply/` form and as a consultation block on `/contact/` and `/paths/`.
  - Simple 1-click scheduling: *"Book a Free 20-Minute Lab Tour & Career Counseling Session"*.
  - User picks day and time; receives immediate WhatsApp confirmation.

---

## Verification & Quality Standard
Every feature must satisfy:
1. Zero runtime dependencies added.
2. `node tools/build.mjs; node tools/check.mjs` must pass with 0 errors.
3. Mobile layout tested at 360px viewport.
4. Clean Git commit and push per feature.
