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

  /* ---------- 3. Idle visitors: tumbleweed + Biscuit ----------
     These are only here to catch the eye of someone who has stopped
     interacting. After 10 idle seconds Biscuit the horse peeks up from the
     corner and a tumbleweed rolls across; while the visitor stays idle the
     tumbleweed comes back 5 seconds after each roll. The moment they move
     the mouse, scroll, tap or type, both disappear and the 10-second wait
     starts over. */
  var FIRST_IDLE_MS = 10000;
  var REPEAT_IDLE_MS = 5000;
  var idleTimer = null;
  var idle = false;
  var weed = null;
  var critterEl = document.getElementById('critter');
  var lastPointer = null;

  function startIdleShow() {
    if (reduceMotion.matches || document.hidden) { return; }
    idle = true;
    if (critterEl) { critterEl.classList.add('is-up'); }
    rollTumbleweed();
  }

  function rollTumbleweed() {
    if (!idle || weed) { return; }
    weed = document.createElement('div');
    weed.className = 'tumbleweed';
    weed.setAttribute('aria-hidden', 'true');
    weed.innerHTML = '<div class="tumbleweed-hop"><img src="img/tumbleweed.png" alt="" width="64" height="64"></div>';
    var mine = weed;
    weed.addEventListener('animationend', function (event) {
      if (event.target !== mine || mine.classList.contains('poof')) { return; } // ignore inner spin/hop loops
      mine.remove();
      if (weed === mine) { weed = null; }
      if (idle) { idleTimer = setTimeout(rollTumbleweed, REPEAT_IDLE_MS); }
    });
    document.body.appendChild(weed);
  }

  function endIdleShow() {
    idle = false;
    if (critterEl) { critterEl.classList.remove('is-up'); }
    if (weed) {
      var gone = weed;
      weed = null;
      gone.classList.add('poof');
      setTimeout(function () { gone.remove(); }, 200);
    }
  }

  function onActivity(event) {
    // Ignore a mouse that only jiggles a few pixels (a bumped desk)
    if (event && event.type === 'mousemove') {
      var here = { x: event.clientX, y: event.clientY };
      var moved = !lastPointer || Math.hypot(here.x - lastPointer.x, here.y - lastPointer.y) > 6;
      lastPointer = here;
      if (!moved) { return; }
    }
    if (idle) { endIdleShow(); }
    clearTimeout(idleTimer);
    idleTimer = setTimeout(startIdleShow, FIRST_IDLE_MS);
  }

  ['mousemove', 'pointerdown', 'keydown', 'wheel', 'scroll', 'touchstart'].forEach(function (type) {
    window.addEventListener(type, onActivity, { passive: true });
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { clearTimeout(idleTimer); endIdleShow(); } else { onActivity(); }
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
     Shown by the idle show above. While he's up, his eyes follow the
     tumbleweed (or rest where the cursor was last), his head leans a little
     toward it, and he blinks now and then. */
  if (critterEl) {
    var body = critterEl.querySelector('.critter-body');
    var eyes = critterEl.querySelector('.critter-eyes');
    var pupils = critterEl.querySelectorAll('.pupil');

    function look() {
      if (critterEl.classList.contains('is-up')) {
        var target = lastPointer;
        var rolling = document.querySelector('.tumbleweed:not(.poof)');
        if (rolling) {
          var w = rolling.getBoundingClientRect();
          target = { x: w.left + w.width / 2, y: w.top + w.height / 2 };
        }
        if (target) {
          var lean = 0;
          pupils.forEach(function (p) {
            var r = p.getBoundingClientRect();
            var dx = target.x - (r.left + r.width / 2), dy = target.y - (r.top + r.height / 2);
            var dist = Math.max(Math.hypot(dx, dy), 1);
            var reach = Math.min(dist / 40, 1) * 3.4;
            p.style.transform = 'translate(' + (dx / dist * reach).toFixed(2) + 'px,' + (dy / dist * reach).toFixed(2) + 'px)';
            lean = dx;
          });
          body.style.transform = 'rotate(' + Math.max(-8, Math.min(8, lean / 60)).toFixed(2) + 'deg)';
        }
      }
      requestAnimationFrame(look);
    }
    requestAnimationFrame(look);

    (function blinkLater() {
      setTimeout(function () {
        if (critterEl.classList.contains('is-up')) {
          eyes.classList.add('blink');
          setTimeout(function () { eyes.classList.remove('blink'); }, 200);
        }
        blinkLater();
      }, 2500 + Math.random() * 3500);
    })();
  }
})();
