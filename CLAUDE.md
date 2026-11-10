# Portfolio — project notes for Claude

Personal portfolio for Akshay Chavan. Vanilla HTML/CSS/JS built with Vite. No framework, no tests for the public site.
Live: https://akshaychavan44.github.io (repo: akshaychavan44/akshaychavan44.github.io, branch `main`). `vercel.json` also configures a Vite build to `dist`.

## Commands
- `npm run dev` — dev server at http://localhost:5173 (`.claude/launch.json` uses 127.0.0.1:5174).
- `npm run build` / `npm run preview` — production build to `dist/` (gitignored).
- `node tests/admin-api.mjs <url>` — checks the local admin API against a running dev server.

## Where content lives (check before editing)
- **`public/content.json`** — profile text, contact/social links, résumé, and all **projects** (`projects[]`, with `visible` flags). Rendered by `portfolio-content.js`.
- **`index.html`** — static markup for **Experience**, **Education**, **About**, **Skills** and the hero. Skills lane items are read from the HTML, not from JSON. Edit these directly.
- Local admin studio (`admin.html`, `login.html`, `admin.js`, `login.js`) edits `content.json` through a dev-server-only API defined in `vite.config.mjs`. It is excluded from the build. Credentials live in the git-ignored `.local/`.

Sections in order: hero (`#home`), `#projects`, `#skills`, `#experience`, `#about`, `#education`, `#cta`, `#contact`.

## CSS
Stylesheets are loaded in this order and **later files win**: `styles.css` → `responsive.css` → `presentation.css` → `portfolio-motion.css` → `section-theme.css` → `studio.css`. `studio.css` is the current design system (`.s-*` classes, dark/light panels). Much of the older CSS is legacy; when a style does not apply, look in `studio.css` first. Mobile breakpoint is `max-width:767px`. `main > section` is full-screen on desktop; the mobile block at the end of `studio.css` lets sections fit their content.

## JS
`main.js` is the entry. It loads content, then `script.js`, then `stacking.js` (header tone per section, in-page links, scroll reveals). Motion and cursor helpers: `portfolio-motion.js`, `minimal-cursor.js`, `hero-wave.js`, `nav-letter-flip.js`.

## Rules for this repo
- **Never invent portfolio facts** (stats, dates, years, roles, claims). Use what is in `content.json` / `index.html`, or ask the owner first. Show the source facts when drafting copy.
- Preview PNG/JPG files in the repo root and `tmp/` are local screenshots, not site assets. Do not delete or commit new ones unprompted.
- Do not commit `.local/`, `.env*`, `dist/` or `vite*.log` (already ignored). `.claude/` is local tool config and is currently untracked.
- Commit and push only when asked.
- When changing layout, check it at phone width (about 390px) as well as desktop.
