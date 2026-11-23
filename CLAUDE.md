# CLAUDE.md — portfolio site

Nick Lax's portfolio home page, live since November 3, 2026, at https://scenebiscuit.com/ (custom domain from November 10; `scenebiscuit-cell.github.io` redirects there). GitHub Pages serves it straight from `main`; a merge goes live in a minute or two. Local clone: `C:\Projects\scenebiscuit-cell.github.io`.

## Rules
1. Plain HTML, CSS and vanilla JS. No build step, no frameworks, no npm dependencies. The only external resource is Google Fonts.
2. Work on a branch and open a pull request. Never push to `main`. Merge only when Nick says "merge".
3. When `css/style.css` or `js/main.js` changes, bump the `?v=YYYY-MM-DD` on their tags in `index.html`.
4. Keep it accessible: real links and buttons, visible focus, 4.5:1 text contrast in light and dark, tap targets at least 44px tall, and respect `prefers-reduced-motion` for every animation.
5. Responsive: one breakpoint at 760px (nav collapses, columns stack). Anything else adapts by wrapping, not by a second breakpoint: the case-study halves stack screenshot-first whenever they don't fit side by side (below about 1125px), and a video thumbnail's text drops under its picture on the narrowest phones. Check 320, 390, 768, 1024, 1440 and 1920px for sideways scroll before merging layout changes.
6. No invented numbers. Every stat on the page must match the project's README (Pharos: 89% / 83% on 36 unseen tickets with the security safety net, 83% / 78% without it; COA tools: 113 tests as of Nov 23, 2026, which is 80 in COA Crosscheck plus 33 in the TCUP checker, counted by running `npm test` in each repo; four states plus federal hemp). Recount the tests whenever the COA repos change.
7. Nick is on Windows with PowerShell. Start command blocks with `cd C:\Projects\scenebiscuit-cell.github.io`. One small, testable step at a time, ending with how to check it worked.

## Files
| File | What it does |
|---|---|
| `index.html` | All page content |
| `css/style.css` | Layout, light/dark colors, animations |
| `js/main.js` | Theme toggle (saved in browser storage as `nl-theme`), scroll fade-ins, pop-up video player for thumbnails marked `data-video-dialog` |
| `img/` | Favicon (`favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`: a white document with a blue check), project screenshots, video preview images (`*-poster.webp`), and `og-card.png` (1200×630 picture that LinkedIn, Slack and iMessage show when the site's link is shared: the name, the eyebrow line and the headline on the cream background. Remake it if the headline changes) |
| `video/` | `qrtz-trailer.mp4` (42 s, 1920×1080, 30 fps) and `asset-zero-trailer.mp4` (43 s, 1920×1080, 60 fps), H.264 with sound, played in the pop-up player. `qrtz-demo.mp4` (2:40, 1920×1080, 30 fps) is the longer QRTZ demo video, opened by the QRTZ card's second button |
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
  - QRTZ: "Trailer out · try it in your browser" (pulsing dot). The card describes the desktop app and its browser demo, and has the trailer thumbnail plus two buttons (owner, Nov 23, 2026): "Try the demo" and "Full demo video · 2:40", which plays `video/qrtz-demo.mp4` in the same pop-up player. The trailer is `video/qrtz-trailer.mp4`: 41.6 seconds (the card says 0:41, as the player does), cut on the bar to the demo track from three bars before its first drop, with nine captioned scenes (the show footage from the demo video, and stills of the real desktop app's window) and an end card with the demo's address. It follows the QRTZ picture rule: only Sky and Pattern appear. The 2:40 demo video is also unlisted on YouTube at https://youtu.be/rB3cTf-EOlw, but the site doesn't link there. The crystal-on-the-booth controller is not built, so neither the card nor the trailer mentions it.
  - ASSET ZERO: "Free demo on itch.io · paused" (hollow dot, no pulse: `dot--still`). Demo public at https://scenebiscuit.itch.io/asset-zero since Nov 18, 2026; desktop browser only. Switch back to the pulsing dot if work resumes.
- Contact heading is "Hiring, or need help with a project? Let's chat." and the line names both the roles Nick wants (support operations, customer success, compliance, AI evaluation; Austin or remote) and freelance projects. Update it if that changes.
- Featured work says the code is public, not "open source": none of the project repos has a license (owner, Nov 23, 2026: the code stays readable, but he doesn't want it reused; the MIT license was removed from the two COA repos that day and Pharos never had one). Don't call any of it open source, and don't add a license to any repo without asking.
- The accessibility claim for the COA tools is "pass an automated WCAG 2.2 AA audit" (axe-core, light and dark), which is what was measured. Don't shorten it to "meets WCAG".
- About names his real Atlassian titles (customer success and product advocate). "Enterprise Support Specialist" was the Loom title.
- Plain, specific sentences. No filler, no invented claims.

## Design
- Eggshell/cream page (`#EEE7D8`), cards `#F7F2E7`, near-black ink, one accent: ballpoint blue `#1F3FD8` (`#93A5FF` in dark mode).
- Bricolage Grotesque for headings, IBM Plex Sans for body, IBM Plex Mono for small labels.
- No handwriting fonts, no portrait, no art/painting mentions. Small, purposeful motion only: hero fade-up, highlight wipe behind "without losing the human part.", scroll fade-ins, card lift on hover, and pulsing status dots. Nothing that follows the mouse or wanders across the page: the idle tumbleweed and then Biscuit (a small cartoon horse trotting under the menu after the mouse) were both removed on Nov 20, 2026 as too distracting (owner). Both drawings are in Git history.
- Playful extras (Nov 17, 2026): stats count up once when they scroll into view (screen readers get the final number); the 1-2-3 badges on the How I can help cards pop in one after another; each of those cards has a small icon that acts out the card on hover (magnifier sweeps, bars grow, gears turn); project screenshots tilt slightly toward the mouse.
- Scroll motion: grouped items (How I can help cards, Currently building cards, Experience rows) arrive one after another; cards rise with a slight tilt and settle; case-study screenshot and text slide in from their own sides; screenshots drift a few pixels slower than the page. Each item animates once, then hover lifts take over. `main` uses `overflow-x: clip` so the side slides never cause sideways scroll.
- Print and "Save as PDF": an `@media print` block at the end of `style.css` shows every section (nothing left hidden waiting for a scroll), switches to the light colors on white, and drops the motion. Keep it last in the file.
- Hero buttons each have an icon after the label: looped down arrow (See the work), envelope (Email me), page with down arrow (Download resume).

## Side-project cards
- Each card has the same shape: status, title, one paragraph, a small video thumbnail (`.card-thumb`: 152px poster with a play button, a title and a length line), and the buttons pinned to the bottom so both cards line up. Videos stay small on the page on purpose.
- Clicking a thumbnail opens the video in a pop-up player (`<dialog>`, up to 960px wide) built by `main.js`. A plain button can open one too: give the link `data-video-dialog="Title"` and, for the still shown before it plays, `data-poster="img/..."` (the QRTZ card's "Full demo video" button does this). It fades in with the `dialog-in` keyframes; keep every `@keyframes` name in `style.css` unique (two rules named `pop` once made the player bounce to 125% of its size). The player's own full-screen button expands it. Esc, the close button or a click outside closes it and stops the video. Without JavaScript the link opens the MP4.
- Videos are hosted here in `video/`, not on YouTube: 1280×720 H.264 MP4 with AAC sound, `+faststart`, ideally under ~15 MB each. `qrtz-trailer.mp4` is 1920×1080 at 30 fps and 26 MB, cut from `qrtz-demo.mp4` (so it is 30 fps; re-cut it from the 1080p60 master for a 60 fps version). `qrtz-demo.mp4` is the exception: 1920×1080 at 30 fps, about 4 Mbps two-pass, 81 MB (owner's choice, Nov 20), from the 1080p60 master in the owner's Videos folder. A 720p, 1 Mbps copy (23 MB) turned the kaleidoscope to mush; 1080p60 would need over GitHub's 100 MB file limit to look as good. It only downloads after a click (`preload="none"`) and streams as it plays. `asset-zero-trailer.mp4` is the trailer's own 1080p60 master (`asset_zero_trailer_v2.mp4` in the desktop PC's `C:\Projects\asset-zero\export\trailer\`), 29 MB, only remuxed with `+faststart`, not re-encoded.
- Poster images: 1200×675 WebP in `img/`, named `<project>-video-poster.webp` or `<project>-trailer-poster.webp`.
- Nothing autoplays and nothing downloads until clicked.
- No GIFs. They were 6–8 MB each, and the trailer shows the same footage. If a card needs motion, use a short muted MP4 instead.

## Screenshots
- `img/*-light.webp` show in light mode, `img/*-dark.webp` in dark mode. 1200px wide, WebP, under ~50 KB each. Frames crop to 2:1 from the top-left, so the top of each screenshot is what shows.
- To replace one: Nick takes a full-width capture of the live tool (no browser chrome); resize to 1200px wide, save as WebP at quality ~82, update the `width`/`height` and `alt` in `index.html`.

## Resume
- `Nick-Lax-Resume.pdf` is the public version: no phone number, on purpose. Keep it that way when replacing the file. Check with `pdftotext Nick-Lax-Resume.pdf - | grep 903` (should find nothing).
- Two pages. Header is "Nick Lax" plus Austin, TX · email · portfolio · LinkedIn · GitHub. No job is split across the page break.
- The resume's numbers must match this page: Pharos 78% keyword rules vs. 89% AI plus safety net on 36 unseen tickets; 113 COA tests; 40–60 tickets a day and phone shifts of up to 40 calls at Atlassian.

## Ideas for later
- A "Writing" section once these exist: an AI evaluation sample (rubric plus rated responses), a compliance writing sample, a one-page Pharos postmortem on the safety-net miss.
