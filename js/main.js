/* Nick Lax portfolio — small, dependency-free behaviors:
   1. Light/dark toggle (remembered in this browser)
   2. Sections fade in as they scroll into view
   3. Stats count up when they scroll into view
   4. Screenshots drift and tilt a little with scroll and mouse
   5. Video thumbnails open in a small pop-up player */
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

  /* ---------- 2. Scroll reveals ----------
     Items in the same group (cards, experience rows) arrive one after another.
     After an item lands it gets .settled so hover effects are quick again. */
  var revealEls = document.querySelectorAll('.reveal');
  document.querySelectorAll('.cards, .jobs').forEach(function (group) {
    group.querySelectorAll(':scope > .reveal').forEach(function (el, i) {
      el.style.setProperty('--d', (i * 0.12).toFixed(2) + 's');
    });
  });
  revealEls.forEach(function (el) {
    el.addEventListener('transitionend', function (e) {
      if (e.target === el && e.propertyName === 'transform' && el.classList.contains('is-in')) {
        el.classList.add('settled');
      }
    });
  });

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

  /* ---------- 3. Count-up stats ----------
     Numbers like 89% count up from zero the first time they scroll into view.
     Screen readers get the final number straight away. */
  var counters = document.querySelectorAll('dd[data-count]');
  function runCount(dd) {
    var target = parseInt(dd.getAttribute('data-count'), 10);
    var suffix = dd.getAttribute('data-suffix') || '';
    var shown = document.createElement('span');
    shown.setAttribute('aria-hidden', 'true');
    var real = document.createElement('span');
    real.className = 'sr-only';
    real.textContent = target + suffix;
    dd.textContent = '';
    dd.appendChild(shown); dd.appendChild(real);
    var start = null, DURATION = 900;
    function frame(t) {
      if (start === null) { start = t; }
      var p = Math.min((t - start) / DURATION, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      shown.textContent = Math.round(target * eased) + suffix;
      if (p < 1) { requestAnimationFrame(frame); }
    }
    requestAnimationFrame(frame);
  }
  if (counters.length && 'IntersectionObserver' in window && !reduceMotion.matches) {
    var countObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { runCount(e.target); countObs.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (dd) { countObs.observe(dd); });
  }

  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  /* Screenshots drift a few pixels slower than the page while scrolling */
  var shots = document.querySelectorAll('.frame-body--shot');
  if (shots.length && !reduceMotion.matches) {
    var ticking = false;
    function drift() {
      ticking = false;
      var vh = window.innerHeight;
      shots.forEach(function (box) {
        var r = box.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) { return; }
        var progress = (r.top + r.height / 2 - vh / 2) / vh; // -1 .. 1 across the screen
        box.querySelectorAll('img').forEach(function (img) {
          img.style.setProperty('--py', (progress * -14).toFixed(1) + 'px');
        });
      });
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(drift); }
    }, { passive: true });
    drift();
  }

  /* ---------- 4. Screenshot tilt ----------
     Project screenshots lean a little toward the mouse, like a card in your hand. */
  if (finePointer.matches && !reduceMotion.matches) {
    document.querySelectorAll('.case-media .frame').forEach(function (frame) {
      frame.addEventListener('mousemove', function (e) {
        var r = frame.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        frame.classList.add('tilting');
        frame.style.transform = 'translateY(-5px) rotateX(' + (-py * 5).toFixed(2) + 'deg) rotateY(' + (px * 6).toFixed(2) + 'deg)';
      });
      frame.addEventListener('mouseleave', function () {
        frame.style.transform = '';
        setTimeout(function () { frame.classList.remove('tilting'); }, 150);
      });
    });
  }

  /* ---------- 5. Pop-up video player ----------
     A link marked data-video-dialog="Title" (a thumbnail or a plain button) opens its video in a small window
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
      // The still shown until the video starts: the thumbnail's own picture, or data-poster on a plain button
      var poster = link.querySelector('img');
      dialogTitle.textContent = link.getAttribute('data-video-dialog');
      dialogVideo.setAttribute('aria-label', link.getAttribute('data-video-dialog'));
      dialogVideo.poster = poster ? poster.getAttribute('src') : (link.getAttribute('data-poster') || '');
      dialogVideo.src = link.getAttribute('href');
      dialog.showModal();
      var started = dialogVideo.play();
      if (started && started.catch) { started.catch(function () { /* blocked: the controls are there */ }); }
    });
  });
})();
