# Start prompt (paste this into your AI agent)

Put the whole `ocatech-website-brief` folder in the agent’s workspace first (for example a Claude Code, Cursor or Codex project folder), then paste everything below the line.

---

You are my web developer. Build the website for **OCATECH Digital Solutions**, an ICT hub and training center at 62 New Market Road, Onitsha, Nigeria.

Everything you need is in this folder. Read these files in order before you write any code:

1. `AGENTS.md`: your rules, the stack, the design direction and the acceptance checks
2. `data/site.json`: the business facts and settings
3. `data/courses.json`: the 17 courses
4. `SITE-CONTENT.md`: every word for every page, plus the chatbot content

**How to work**

1. **Ask me for my assets first and inspiration website.** Check the folder and this chat for my logo, photos of the center and videos. If any are missing, send me the asset request message from section 2 of `AGENTS.md` and wait for my answer. If I say “later”, carry on with placeholders for development only, keep `ASSETS-TODO.md` up to date, and make sure nothing placeholder-like appears on the live site.
2. **Never invent facts.** Where the data files say `null`, or `SITE-CONTENT.md` says the owner must confirm something, leave it out of the site and add it to `OPEN-QUESTIONS.md`. No fake testimonials, prices, discounts, hours or photos.
3. **Free tools only.** Plain HTML, CSS and JavaScript on Cloudflare Pages, with Pages Functions, Cloudflare D1, Groq and Resend, as described in `AGENTS.md`. Check current free-tier limits and model names in the official documentation before you rely on them.
4. **Plan before you build.** Send me a short plan (page list, design tokens, the skill picker idea, any disagreements with the brief), then build in this order: shell and design tokens, home page, courses and the 17 course pages, services, about, contact, apply form with its function, chat widget with its function, privacy and 404, SEO files, then checks.
5. **Check your work.** Run `tools/check.mjs`, test the pages on a 360 px phone width, test the form with JavaScript on and off, and test the chat assistant against price questions and attempts to break its rules.
6. **Write `SETUP.md`** in plain language so that I, who am not a developer, can put the site online step by step.
7. **Finish with the final report** described in section 11 of `AGENTS.md`: what is built, what you need from me, how to deploy, anything you changed or could not verify, and the Lighthouse scores.

If something in the brief is unclear or seems wrong, tell me before building around it. Keep your messages to me short and in plain English.

Start now by reading the files, then message me with your asset request and your plan.
