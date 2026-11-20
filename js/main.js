/* Nick Lax portfolio — small, dependency-free behaviors:
   1. Light/dark toggle (remembered in this browser)
   2. Sections fade in as they scroll into view
   3. Biscuit the horse trots along under the menu after the mouse
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

  /* ---------- 3. Biscuit walks the top ----------
     Biscuit (a small horse, for Seabiscuit, the name behind scenebiscuit)
     trots along the strip under the menu, keeping under the mouse. He leans
     into the way he's going and bobs while he moves; when he stops he looks
     at the pointer and blinks now and then. Only on computers with a mouse
     and a wide window (the CSS shows him there); with reduced motion he
     stands still at the right. He rests while the top of the page is out of
     view. */
  var biscuit = document.getElementById('biscuit');
  var biscuitPointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (biscuit && biscuitPointer.matches && !reduceMotion.matches) {
    var track = biscuit.parentNode;
    var horse = biscuit.querySelector('.biscuit-body');
    var horseEyes = biscuit.querySelector('.biscuit-eyes');
    var horsePupils = biscuit.querySelectorAll('.pupil');
    var MAX_SPEED = 520;               // px per second at a full trot
    var horseX = null, targetX = null, pointer = null, lastT = null, trotting = false, topInView = true;

    function room() { return Math.max(0, track.clientWidth - biscuit.offsetWidth); }
    function place() { biscuit.style.transform = 'translateX(' + horseX.toFixed(1) + 'px)'; }

    function lookAt(target) {
      horsePupils.forEach(function (p) {
        if (!target) { p.style.transform = ''; return; }
        var r = p.getBoundingClientRect();
        var dx = target.x - (r.left + r.width / 2), dy = target.y - (r.top + r.height / 2);
        var dist = Math.max(Math.hypot(dx, dy), 1);
        var reach = Math.min(dist / 40, 1) * 3.4;
        p.style.transform = 'translate(' + (dx / dist * reach).toFixed(2) + 'px,' + (dy / dist * reach).toFixed(2) + 'px)';
      });
    }

    function step(t) {
      if (!topInView || track.clientWidth === 0) { trotting = false; return; }
      var dt = lastT === null ? 0 : Math.min((t - lastT) / 1000, 0.05);
      lastT = t;
      var dx = targetX - horseX;
      var speed = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, dx * 6));
      var moving = Math.abs(dx) > 1.5;
      horseX = moving ? horseX + speed * dt : targetX;
      place();
      biscuit.classList.toggle('is-trotting', moving);
      horse.style.transform = moving ? 'rotate(' + (speed / MAX_SPEED * 8).toFixed(2) + 'deg)' : '';
      lookAt(pointer);
      if (moving) { requestAnimationFrame(step); } else { trotting = false; }
    }
    function trot() {
      if (trotting || !topInView) { return; }
      trotting = true; lastT = null;
      requestAnimationFrame(step);
    }

    function start() {
      horseX = room();                 // he starts at the right, under the theme button
      targetX = horseX;
      biscuit.classList.add('is-live');
      place();
    }
    start();

    window.addEventListener('mousemove', function (e) {
      pointer = { x: e.clientX, y: e.clientY };
      var r = track.getBoundingClientRect();
      targetX = Math.max(0, Math.min(room(), e.clientX - r.left - biscuit.offsetWidth / 2));
      trot();
    }, { passive: true });
    window.addEventListener('resize', function () {
      horseX = Math.min(horseX, room()); targetX = Math.min(targetX, room());
      place();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        topInView = entries[0].isIntersecting;
        if (topInView) { trot(); }
      }).observe(track);
    }

    // A blink every few seconds, only while he's standing and in view.
    (function blinkLater() {
      setTimeout(function () {
        if (topInView && !trotting && !document.hidden) {
          horseEyes.classList.add('blink');
          setTimeout(function () { horseEyes.classList.remove('blink'); }, 200);
        }
        blinkLater();
      }, 2500 + Math.random() * 3500);
    })();
  }

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
