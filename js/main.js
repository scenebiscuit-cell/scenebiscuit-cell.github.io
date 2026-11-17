/* Nick Lax portfolio — small, dependency-free behaviors:
   1. Light/dark toggle (remembered in this browser)
   2. Sections fade in as they scroll into view
   3. A tumbleweed rolls by after a few idle seconds */
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

    // Easter egg: click the tumbleweed and it bounces off the screen
    weed.addEventListener('click', function () {
      if (weed.classList.contains('boing')) { return; }
      var x = new DOMMatrix(getComputedStyle(weed).transform).m41;
      weed.style.setProperty('--x', x + 'px');
      weed.classList.add('boing');
    });

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

  /* ---------- 6. Biscuit the horse ----------
     Peeks up from the bottom corner once the visitor scrolls past the intro.
     Eyes follow the mouse (or the tumbleweed when it rolls by), the head leans
     a little toward the cursor, and it blinks now and then. Click to say hi. */
  var critter = document.getElementById('critter');
  var critterBtn = document.getElementById('critter-btn');
  var say = document.getElementById('critter-say');
  if (critter && critterBtn) {
    var body = critter.querySelector('.critter-body');
    var eyes = critter.querySelector('.critter-eyes');
    var pupils = critter.querySelectorAll('.pupil');
    var lines = ["Howdy! I'm Biscuit.", "Named after Seabiscuit, the underdog that kept going.", "Scroll down, the good stuff is in the projects.", "Psst. Try clicking the tumbleweed."];
    var lineIndex = 0, sayTimer = null, mouse = null;

    function showCritter() {
      if (window.scrollY > 380) { critter.classList.add('is-up'); }
    }
    window.addEventListener('scroll', showCritter, { passive: true });
    setTimeout(function () { critter.classList.add('is-up'); }, 8000);
    showCritter();

    window.addEventListener('mousemove', function (e) { mouse = { x: e.clientX, y: e.clientY }; }, { passive: true });

    function look() {
      var target = mouse;
      var weed = document.querySelector('.tumbleweed');
      if (weed) {
        var w = weed.getBoundingClientRect();
        target = { x: w.left + w.width / 2, y: w.top + w.height / 2 };
      }
      if (target && critter.classList.contains('is-up')) {
        var lean = 0;
        pupils.forEach(function (p) {
          var r = p.getBoundingClientRect();
          var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          var dx = target.x - cx, dy = target.y - cy;
          var dist = Math.max(Math.hypot(dx, dy), 1);
          var reach = Math.min(dist / 40, 1) * 3.4;
          p.style.transform = 'translate(' + (dx / dist * reach).toFixed(2) + 'px,' + (dy / dist * reach).toFixed(2) + 'px)';
          lean = dx;
        });
        if (!reduceMotion.matches) {
          var tilt = Math.max(-8, Math.min(8, lean / 60));
          body.style.transform = 'rotate(' + tilt.toFixed(2) + 'deg)';
        }
      }
      requestAnimationFrame(look);
    }
    requestAnimationFrame(look);

    function blinkLater() {
      setTimeout(function () {
        if (!reduceMotion.matches) {
          eyes.classList.add('blink');
          setTimeout(function () { eyes.classList.remove('blink'); }, 200);
        }
        blinkLater();
      }, 2500 + Math.random() * 3500);
    }
    blinkLater();

    critterBtn.addEventListener('click', function () {
      clearTimeout(sayTimer);
      say.textContent = lines[lineIndex % lines.length];
      lineIndex += 1;
      say.classList.add('show');
      sayTimer = setTimeout(function () {
        say.classList.remove('show');
        setTimeout(function () { say.textContent = ''; }, 250);
      }, 3200);
    });
  }
})();
