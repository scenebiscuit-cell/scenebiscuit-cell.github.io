# CLAUDE.md — portfolio site

Nick Lax's portfolio home page, live at https://scenebiscuit-cell.github.io/ since November 3, 2026. GitHub Pages serves it straight from `main`; a merge goes live in a minute or two. Local clone: `C:\Projects\scenebiscuit-cell.github.io`.

## Rules
1. Plain HTML, CSS and vanilla JS. No build step, no frameworks, no npm dependencies. The only external resource is Google Fonts.
2. Work on a branch and open a pull request. Never push to `main`. Merge only when Nick says "merge".
3. When `css/style.css` or `js/main.js` changes, bump the `?v=YYYY-MM-DD` on their tags in `index.html`.
4. Keep it accessible: real links and buttons, visible focus, 4.5:1 text contrast in light and dark, and respect `prefers-reduced-motion` for every animation.
5. No invented numbers. Every stat on the page must match the project's README (Pharos: 89% / 83% on 36 unseen tickets; COA tools: 88 tests).
6. Nick is on Windows with PowerShell. Start command blocks with `cd C:\Projects\scenebiscuit-cell.github.io`. One small, testable step at a time, ending with how to check it worked.

## Files
| File | What it does |
|---|---|
| `index.html` | All page content |
| `css/style.css` | Layout, light/dark colors, animations |
| `js/main.js` | Theme toggle (saved in browser storage as `nl-theme`), scroll fade-ins, idle tumbleweed |
| `img/` | Favicon (`favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`: a white document with a blue check), `tumbleweed.png` (Nick's drawing), project screenshots |
| `Nick-Lax-Resume.pdf` | Public resume behind the Download resume button |
| `.nojekyll` | Tells GitHub Pages to serve files as-is |

## Copy
- Headline: "I build AI tools that show their work."
- Lead with support, not compliance. The "more than ten years" is combined across support, cannabis compliance (about five years) and web and motion design.
- Pharos comes before the cannabis project; cannabis should not be the first thing visitors see.
- Name Atlassian in summaries, not Loom (a short stint). Loom stays in the Experience list.
- Contact says the roles Nick wants: support operations, customer success, compliance or AI evaluation, in Austin or remote. Update it if that changes.
- Plain, specific sentences. No filler, no invented claims.

## Design
- Eggshell/cream page (`#EEE7D8`), cards `#F7F2E7`, near-black ink, one accent: ballpoint blue `#1F3FD8` (`#93A5FF` in dark mode).
- Bricolage Grotesque for headings, IBM Plex Sans for body, IBM Plex Mono for small labels.
- No handwriting fonts, no portrait, no art/painting mentions. Small, purposeful motion only: hero fade-up, highlight wipe behind "show their work", scroll fade-ins, card lift on hover, pulsing status dots, and a tumbleweed that rolls once after 10 idle seconds (no repeat until the visitor moves and goes idle again).
- Hero buttons each have an icon after the label: looped down arrow (See the work), envelope (Email me), page with down arrow (Download resume).

## Screenshots
- `img/*-light.webp` show in light mode, `img/*-dark.webp` in dark mode. 1200px wide, WebP, under ~50 KB each. Frames crop to 2:1 from the top-left, so the top of each screenshot is what shows.
- To replace one: Nick takes a full-width capture of the live tool (no browser chrome); resize to 1200px wide, save as WebP at quality ~82, update the `width`/`height` and `alt` in `index.html`.

## Resume
- `Nick-Lax-Resume.pdf` is the public version: no phone number, on purpose. Keep it that way when replacing the file. Check with `pdftotext Nick-Lax-Resume.pdf - | grep 903` (should find nothing).
- Two pages. Header is "Nick Lax" plus Austin, TX · email · portfolio · LinkedIn · GitHub.

## Ideas for later
- A "Writing" section once these exist: an AI evaluation sample (rubric plus rated responses), a compliance writing sample, a one-page Pharos postmortem on the safety-net miss.
- Optional custom domain.
