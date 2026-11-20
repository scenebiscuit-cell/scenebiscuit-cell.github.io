# CLAUDE.md — portfolio site

Nick Lax's portfolio home page, live since November 3, 2026, at https://scenebiscuit.com/ (custom domain from November 10; `scenebiscuit-cell.github.io` redirects there). GitHub Pages serves it straight from `main`; a merge goes live in a minute or two. Local clone: `C:\Projects\scenebiscuit-cell.github.io`.

## Rules
1. Plain HTML, CSS and vanilla JS. No build step, no frameworks, no npm dependencies. The only external resource is Google Fonts.
2. Work on a branch and open a pull request. Never push to `main`. Merge only when Nick says "merge".
3. When `css/style.css` or `js/main.js` changes, bump the `?v=YYYY-MM-DD` on their tags in `index.html`.
4. Keep it accessible: real links and buttons, visible focus, 4.5:1 text contrast in light and dark, tap targets at least 44px tall, and respect `prefers-reduced-motion` for every animation.
5. Responsive: one breakpoint at 760px (nav collapses, columns stack). Check 320, 390, 768, 1024, 1440 and 1920px for sideways scroll before merging layout changes.
6. No invented numbers. Every stat on the page must match the project's README (Pharos: 89% / 83% on 36 unseen tickets; COA tools: 88 tests).
7. Nick is on Windows with PowerShell. Start command blocks with `cd C:\Projects\scenebiscuit-cell.github.io`. One small, testable step at a time, ending with how to check it worked.

## Files
| File | What it does |
|---|---|
| `index.html` | All page content |
| `css/style.css` | Layout, light/dark colors, animations |
| `js/main.js` | Theme toggle (saved in browser storage as `nl-theme`), scroll fade-ins, idle tumbleweed, pop-up video player for thumbnails marked `data-video-dialog` |
| `img/` | Favicon (`favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`: a white document with a blue check), `tumbleweed.png` (Nick's drawing), project screenshots, video preview images (`*-poster.webp`) |
| `video/` | `qrtz-demo.mp4` (2:40) and `asset-zero-trailer.mp4` (43 s), both 1280×720 H.264 with sound, played in the pop-up player |
| `Nick-Lax-Resume.pdf` | Public resume behind the Download resume button |
| `.nojekyll` | Tells GitHub Pages to serve files as-is |
| `qrtz/` | The QRTZ browser demo, served at https://scenebiscuit.com/qrtz/. A copy of `web/demo/` from the private qrtz repo: don't edit it here. Change it there, then run `C:\Projects\qrtz\web\demo\tools\publish_to_portfolio.ps1` to copy it over |
| `CNAME` | Custom domain (`scenebiscuit.com`). DNS is on Cloudflare: four A records to GitHub Pages and `www` CNAME to `scenebiscuit-cell.github.io`, all DNS-only (grey cloud). Don't delete this file. |

## Copy
- Headline: "I help small teams put AI to work without losing the human part." (Nov 17, 2026. Earlier: "I make sure the answer is right…" and before that "I build AI tools…".) The site now speaks to both employers and freelance clients: the lede leans on cross-industry experience (support, cannabis regulation, small-business ops, web and motion design) for spotting bottlenecks.
- Section 01 "How I can help" has three cards: Find the bottlenecks, Make your data visible, Build the system together. Keep the data card modest until there is a dashboard project to point to.
- Experience heading: "Where I learned to spot what slows teams down". Atlassian is two rows, because Product Advocate is Nick's strongest role and must not be squeezed into a mention. Product Advocate (2016–2017): a consultative role, not support, focused on HipChat and Confluence. Helped international customers decide whether Atlassian's products fit their business goals, which ones to use and how to use them; brought customer feedback back to the product teams as bug reports and feature recommendations. Customer Success Advocate (2014–2016): generalist across all products, mostly how billing and licensing worked; answered what was in scope and routed the rest to the right team; 40–60 tickets a day plus phone shifts of up to 40 calls, CSAT above 90%, wrote training documents for the Manila team (he did not design or run a training program), promoted to Product Advocate.
- Lead with support, not compliance. The "more than ten years" is combined across support, cannabis compliance (about five years) and web and motion design.
- Pharos comes before the cannabis project; cannabis should not be the first thing visitors see.
- Name Atlassian in summaries, not Loom (a short stint). Loom stays in the Experience list.
- Section 03 is "Side projects: Games and live visuals" (was "Currently building: On the workbench"; renamed Nov 19, 2026 because ASSET ZERO is paused). The nav link says "Side projects"; the anchor stays `#building`. Keep the status lines current. As of Nov 19, 2026:
  - QRTZ: "Demo video out · try it in your browser" (pulsing dot). The card describes the desktop app and its browser demo, and plays its 2:40 demo video from `video/qrtz-demo.mp4` (the same video is unlisted on YouTube at https://youtu.be/rB3cTf-EOlw, but the site no longer links there). The crystal-on-the-booth controller is not built, so the card doesn't mention it.
  - ASSET ZERO: "Free demo on itch.io · paused" (hollow dot, no pulse: `dot--still`). Demo public at https://scenebiscuit.itch.io/asset-zero since Nov 18, 2026; desktop browser only. Switch back to the pulsing dot if work resumes.
- Contact heading is "Hiring, or need help with a project? Let's chat." and the line names both the roles Nick wants (support operations, customer success, compliance, AI evaluation; Austin or remote) and freelance projects. Update it if that changes.
- Plain, specific sentences. No filler, no invented claims.

## Design
- Eggshell/cream page (`#EEE7D8`), cards `#F7F2E7`, near-black ink, one accent: ballpoint blue `#1F3FD8` (`#93A5FF` in dark mode).
- Bricolage Grotesque for headings, IBM Plex Sans for body, IBM Plex Mono for small labels.
- No handwriting fonts, no portrait, no art/painting mentions. Small, purposeful motion only: hero fade-up, highlight wipe behind "without losing the human part.", scroll fade-ins, card lift on hover, pulsing status dots, and the idle show described below.
- Playful extras (Nov 17, 2026): stats count up once when they scroll into view (screen readers get the final number); the 1-2-3 badges on the How I can help cards pop in one after another; each of those cards has a small icon that acts out the card on hover (magnifier sweeps, bars grow, gears turn); project screenshots tilt slightly toward the mouse.
- Scroll motion: grouped items (How I can help cards, Currently building cards, Experience rows) arrive one after another; cards rise with a slight tilt and settle; case-study screenshot and text slide in from their own sides; screenshots drift a few pixels slower than the page. Each item animates once, then hover lifts take over. `main` uses `overflow-x: clip` so the side slides never cause sideways scroll.
- Idle show (Biscuit + tumbleweed): only for visitors who have stopped interacting. After 10 idle seconds, Biscuit (a small cartoon horse, for Seabiscuit, the meaning behind "scenebiscuit") peeks up from the bottom-right corner and the tumbleweed rolls across; while still idle the tumbleweed returns 5 seconds after each roll and Biscuit watches it (eyes follow, head leans, occasional blink). The moment the visitor moves the mouse (more than a few pixels), scrolls, taps or types, both disappear immediately and the 10-second wait restarts. Not clickable. Biscuit is hidden under 760px. All of it is off for reduced-motion.
- Hero buttons each have an icon after the label: looped down arrow (See the work), envelope (Email me), page with down arrow (Download resume).

## Side-project cards
- Each card has the same shape: status, title, one paragraph, a small video thumbnail (`.card-thumb`: 152px poster with a play button, a title and a length line), and the buttons pinned to the bottom so both cards line up. Videos stay small on the page on purpose.
- Clicking a thumbnail opens the video in a pop-up player (`<dialog>`, up to 960px wide) built by `main.js`. The player's own full-screen button expands it. Esc, the close button or a click outside closes it and stops the video. Without JavaScript the link opens the MP4.
- Videos are hosted here in `video/`, not on YouTube: 1280×720 H.264 MP4 with AAC sound, `+faststart`, ideally under ~15 MB each.
- Poster images: 1200×675 WebP in `img/`, named `<project>-video-poster.webp` or `<project>-trailer-poster.webp`.
- Nothing autoplays and nothing downloads until clicked.
- No GIFs. They were 6–8 MB each, and the trailer shows the same footage. If a card needs motion, use a short muted MP4 instead.

## Screenshots
- `img/*-light.webp` show in light mode, `img/*-dark.webp` in dark mode. 1200px wide, WebP, under ~50 KB each. Frames crop to 2:1 from the top-left, so the top of each screenshot is what shows.
- To replace one: Nick takes a full-width capture of the live tool (no browser chrome); resize to 1200px wide, save as WebP at quality ~82, update the `width`/`height` and `alt` in `index.html`.

## Resume
- `Nick-Lax-Resume.pdf` is the public version: no phone number, on purpose. Keep it that way when replacing the file. Check with `pdftotext Nick-Lax-Resume.pdf - | grep 903` (should find nothing).
- Two pages. Header is "Nick Lax" plus Austin, TX · email · portfolio · LinkedIn · GitHub.

## Ideas for later
- A "Writing" section once these exist: an AI evaluation sample (rubric plus rated responses), a compliance writing sample, a one-page Pharos postmortem on the safety-net miss.
