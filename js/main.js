/* Nick Lax portfolio — small, dependency-free behaviors:
   1. Light/dark toggle (remembered in this browser)
   2. Sections fade in as they scroll into view
   3. A tumbleweed rolls by after a few idle seconds
   4. Video thumbnails open in a small pop-up player */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- 1. Theme toggle ---------- */
  var themeBtn = document.getElementById('theme-btn');

  function syncThemeLabel() {
    var dark = root.getAttribute('data-theme') === 'dark';
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  }

  if (themeBtn) {
    syncThemeLabel();
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('nl-theme', next); } catch (e) { /* storage blocked: fine */ }
      syncThemeLabel();
    });
  }

  /* ---------- 2. Scroll reveals ---------- */
  var revealEls = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window) || reduceMotion.matches) {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    revealEls.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- 3. Idle tumbleweed ----------
     First roll after 10 seconds with no mouse, keyboard, scroll or touch
     activity. While the visitor stays idle, it comes back 5 seconds after
     each roll finishes. Any activity resets the wait to 10 seconds. */
  var FIRST_IDLE_MS = 10000;
  var REPEAT_IDLE_MS = 5000;
  var idleTimer = null;
  var rolling = false;
  var activeDuringRoll = false;

  function rollTumbleweed() {
    if (rolling || reduceMotion.matches || document.hidden) { return; }
    rolling = true;
    activeDuringRoll = false;

    var weed = document.createElement('div');
    weed.className = 'tumbleweed';
    weed.setAttribute('aria-hidden', 'true');
    weed.innerHTML = '<div class="tumbleweed-hop"><img src="img/tumbleweed.png" alt="" width="64" height="64"></div>';

    weed.addEventListener('animationend', function (event) {
      if (event.target !== weed) { return; } // ignore the inner spin/hop loops
      weed.remove();
      rolling = false;
      if (activeDuringRoll) { return; } // visitor moved mid-roll: the 10-second wait already started
      clearTimeout(idleTimer);
      idleTimer = setTimeout(rollTumbleweed, REPEAT_IDLE_MS);
    });

    document.body.appendChild(weed);
  }

  function onActivity() {
    if (rolling) { activeDuringRoll = true; }
    clearTimeout(idleTimer);
    idleTimer = setTimeout(rollTumbleweed, FIRST_IDLE_MS);
  }

  ['mousemove', 'pointerdown', 'keydown', 'wheel', 'scroll', 'touchstart'].forEach(function (type) {
    window.addEventListener(type, onActivity, { passive: true });
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { clearTimeout(idleTimer); } else { onActivity(); }
  });
  onActivity();

  /* ---------- 4. Pop-up video player ----------
     A link marked data-video-dialog="Title" opens its video in a small window
     over the page, instead of taking up room in the card. The video only
     downloads when someone clicks. Esc, the close button or a click outside
     closes it and stops the video. Without JavaScript the link opens the file. */
  var videoLinks = document.querySelectorAll('a[data-video-dialog]');
  var dialog = null;
  var dialogVideo = null;
  var dialogTitle = null;
  var opener = null;

  function buildDialog() {
    dialog = document.createElement('dialog');
    dialog.className = 'video-dialog';
    dialog.setAttribute('aria-labelledby', 'video-dialog-title');
    dialog.innerHTML =
      '<div class="video-dialog-head">' +
        '<p class="video-dialog-title" id="video-dialog-title"></p>' +
        '<button type="button" class="video-dialog-close" aria-label="Close video">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
        '</button>' +
      '</div>' +
      '<video controls playsinline preload="none"></video>';
    document.body.appendChild(dialog);
    dialogVideo = dialog.querySelector('video');
    dialogTitle = dialog.querySelector('.video-dialog-title');

    dialog.querySelector('.video-dialog-close').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) { dialog.close(); } // click on the dimmed area around the player
    });
    dialog.addEventListener('close', function () {
      dialogVideo.pause();
      dialogVideo.removeAttribute('src');
      dialogVideo.load(); // stops the download too
      if (opener) { opener.focus(); }
    });
  }

  videoLinks.forEach(function (link) {
    link.addEventListener('click', function (event) {
      if (typeof HTMLDialogElement === 'undefined') { return; } // very old browser: just open the file
      event.preventDefault();
      if (!dialog) { buildDialog(); }
      opener = link;
      var poster = link.querySelector('img');
      dialogTitle.textContent = link.getAttribute('data-video-dialog');
      dialogVideo.setAttribute('aria-label', link.getAttribute('data-video-dialog'));
      dialogVideo.poster = poster ? poster.getAttribute('src') : '';
      dialogVideo.src = link.getAttribute('href');
      dialog.showModal();
      var started = dialogVideo.play();
      if (started && started.catch) { started.catch(function () { /* blocked: the controls are there */ }); }
    });
  });
})();
