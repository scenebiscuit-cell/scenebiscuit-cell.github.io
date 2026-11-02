# CLAUDE.md — portfolio site

Nick Lax's portfolio home page, served by GitHub Pages at https://scenebiscuit-cell.github.io/ from `main`.

## Rules
1. Plain HTML, CSS and vanilla JS. No build step, no frameworks, no npm dependencies. The only external resource is Google Fonts.
2. Work on a branch and open a pull request. Never push to `main`. Merge only when Nick says "merge".
3. When `css/style.css` or `js/main.js` changes, bump the `?v=YYYY-MM-DD` on their tags in `index.html`.
4. Keep it accessible: real links and buttons, visible focus, 4.5:1 text contrast in light and dark, and respect `prefers-reduced-motion` for every animation.
5. No invented numbers. Every stat on the page must match the project's README (Pharos: 89% / 83% on 36 unseen tickets; COA tools: 88 tests).
6. Nick is on Windows with PowerShell. Start command blocks with `cd C:\Projects\scenebiscuit-cell.github.io`. One small, testable step at a time, ending with how to check it worked.

## Design
- Eggshell/cream page (`#EEE7D8`), near-black ink, one accent: ballpoint blue `#1F3FD8` (`#93A5FF` in dark mode).
- Bricolage Grotesque for headings, IBM Plex Sans for body, IBM Plex Mono for small labels.
- No handwriting fonts and no portrait. Small, purposeful motion only: hero fade-up, highlight wipe behind "show their work", scroll fade-ins, card lift on hover, pulsing status dots, and a tumbleweed after 3 idle seconds.
- Pharos comes before the cannabis project; cannabis should not be the first thing visitors see.

## Screenshots
- `img/*-light.webp` show in light mode, `img/*-dark.webp` in dark mode. 1200px wide, WebP. Frames crop to 2:1 from the top-left.

## Open items
- `Nick-Lax-Resume.pdf` (update the resume's demo-link placeholders first).
- LinkedIn button in the contact section once Nick provides the URL.
