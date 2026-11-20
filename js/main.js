/* Nick Lax portfolio — small, dependency-free behaviors:
   1. Light/dark toggle (remembered in this browser)
   2. Sections fade in as they scroll into view
   3. Biscuit the horse trots along under the menu after the mouse
   4. Stats count up when they scroll into view
   5. Screenshots drift and tilt a little with scroll and mouse
   6. Video thumbnails open in a small pop-up player */
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

  /* ---------- 4. Count-up stats ----------
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

  /* ---------- 5. Screenshot tilt ----------
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

  /* ---------- 6. Pop-up video player ----------
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
