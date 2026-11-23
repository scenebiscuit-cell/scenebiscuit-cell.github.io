# Nick Lax — portfolio

My portfolio home page: **https://scenebiscuit.com/**

It links my projects together (Pharos Support Desk, COA Crosscheck and the TCUP COA Checker, plus the side projects QRTZ and ASSET ZERO) and gives a short version of my resume.

## How it's built

Plain HTML, CSS and JavaScript. No build step, no dependencies. GitHub Pages serves the files straight from `main`.

| File | What it does |
|---|---|
| `index.html` | All the page content |
| `css/style.css` | Layout, colors (light and dark), animations |
| `js/main.js` | Light/dark toggle, fade-in on scroll, count-up stats, pop-up video player |
| `img/` | Favicon, project screenshots, video preview images, link-preview image (`og-card.png`) |
| `video/` | The QRTZ trailer, the longer QRTZ demo video, and the ASSET ZERO trailer |
| `qrtz/` | The QRTZ browser demo (copied from the qrtz repo; don't edit it here) |
| `Nick-Lax-Resume.pdf` | The resume behind the "Download resume" button |
| `.nojekyll` | Tells GitHub Pages to serve the files as-is |

## Preview locally

Open `index.html` in a browser. That's it.

## Updating

- Change text in `index.html`.
- After changing `css/style.css` or `js/main.js`, bump the `?v=` date where `index.html` loads them, so browsers fetch the new version.
- Work on a branch and open a pull request; `main` is what's live.

Created by Nick Lax.
