/* ============================================================
   ORAKSER — HOMEPAGE INTERACTIONS
   1. Hero slider with arrows, dots and autoplay
   2. "Why Choose Us": section stays pinned while the six cards
      scroll; the page moves on only after card 6 is read
   3. Testimonial slider with arrows (infinite loop)
   ============================================================ */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Hero slider ---------- */
  var hero = document.querySelector('.h-hero');
  if (hero) {
    var bgs = hero.querySelectorAll('.h-hero-bg');
    var texts = hero.querySelectorAll('.h-hero-text');
    var dots = hero.querySelectorAll('.h-hero-dots button');
    var current = 0, timer = null;

    var go = function (i) {
      var n = texts.length;
      current = (i + n) % n;
      [bgs, texts, dots].forEach(function (list) {
        Array.prototype.forEach.call(list, function (el, k) { el.classList.toggle('is-active', k === current); });
      });
    };
    var restart = function () {
      if (reduceMotion) return;
      clearInterval(timer);
      timer = setInterval(function () { go(current + 1); }, 6500);
    };
    hero.querySelector('.h-hero-prev').addEventListener('click', function () { go(current - 1); restart(); });
    hero.querySelector('.h-hero-next').addEventListener('click', function () { go(current + 1); restart(); });
    Array.prototype.forEach.call(dots, function (d, k) { d.addEventListener('click', function () { go(k); restart(); }); });
    /* Pause while someone is filling in the form. */
    hero.addEventListener('focusin', function () { clearInterval(timer); });
    restart();
  }

  /* ---------- 2. Why Choose Us — pinned scroll ---------- */
  var why = document.querySelector('.h-why');
  if (why) {
    var viewport = why.querySelector('.h-why-viewport');
    var track = why.querySelector('.h-why-track');
    var cards = track.querySelectorAll('.h-why-card');
    var currentEl = why.querySelector('.h-why-current');
    var fill = why.querySelector('.h-why-fill');
    var navbar = document.getElementById('navbar');
    var distance = 0, pinned = false, active = -1;
    var desktop = window.matchMedia('(min-width: 1025px)');

    var setActive = function (i) {
      if (i === active) return;
      active = i;
      Array.prototype.forEach.call(cards, function (c, k) { c.classList.toggle('is-active', k === i); });
      currentEl.textContent = (i + 1 < 10 ? '0' : '') + (i + 1);
      fill.style.width = ((i + 1) / cards.length * 100) + '%';
    };

    var layout = function () {
      pinned = desktop.matches && !reduceMotion;
      why.classList.toggle('is-pinned', pinned);
      track.style.transform = '';
      if (!pinned) { why.style.height = ''; return; }
      var pinTop = navbar ? navbar.offsetHeight : 0;
      why.style.setProperty('--pin-top', pinTop + 'px');
      /* How far the cards must travel so the last one ends fully in view. */
      distance = Math.max(0, track.scrollHeight - viewport.clientHeight + 40);
      /* Extra scroll room: a little dwell on each card, so fast scrollers still see the change. */
      var dwell = Math.round(window.innerHeight * 0.12) * cards.length;
      why.style.height = (window.innerHeight - pinTop + distance + dwell) + 'px';
      update();
    };

    var update = function () {
      if (!pinned) {
        /* Mobile/tablet: highlight the card nearest the middle of the screen. */
        var mid = window.innerHeight / 2, best = 0, bestD = Infinity;
        Array.prototype.forEach.call(cards, function (c, k) {
          var r = c.getBoundingClientRect();
          var d = Math.abs(r.top + r.height / 2 - mid);
          if (d < bestD) { bestD = d; best = k; }
        });
        setActive(best);
        return;
      }
      var rect = why.getBoundingClientRect();
      var pinTop = navbar ? navbar.offsetHeight : 0;
      var total = why.offsetHeight - (window.innerHeight - pinTop);
      var p = total > 0 ? Math.min(1, Math.max(0, (pinTop - rect.top) / total)) : 0;
      track.style.transform = 'translate3d(0,' + (-p * distance) + 'px,0)';
      setActive(Math.min(cards.length - 1, Math.floor(p * cards.length)));
    };

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; update(); });
    }, { passive: true });
    window.addEventListener('resize', layout);
    window.addEventListener('load', layout);
    layout();
  }

  /* ---------- 3. Testimonial slider ---------- */
  document.querySelectorAll('.h-slider').forEach(function (slider) {
    var trackEl = slider.querySelector('.h-slider-track');
    var originals = Array.prototype.slice.call(trackEl.children);
    if (!originals.length) return;
    /* Clone once so the loop never shows an empty gap, even with few reviews. */
    originals.forEach(function (s) {
      var c = s.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      trackEl.appendChild(c);
    });
    var busy = false;
    var step = function () { return trackEl.children[0].getBoundingClientRect().width; };
    var after = function (fn) {
      var called = false;
      var done = function () {
        if (called) return; called = true;
        trackEl.removeEventListener('transitionend', done); fn();
      };
      trackEl.addEventListener('transitionend', done);
      setTimeout(done, 800); /* fallback if no transition runs */
    };
    var next = function () {
      if (busy) return; busy = true;
      trackEl.style.transform = 'translateX(' + (-step()) + 'px)';
      after(function () {
        trackEl.style.transition = 'none';
        trackEl.appendChild(trackEl.firstElementChild);
        trackEl.style.transform = 'translateX(0)';
        void trackEl.offsetWidth;
        trackEl.style.transition = '';
        busy = false;
      });
    };
    var prev = function () {
      if (busy) return; busy = true;
      trackEl.style.transition = 'none';
      trackEl.insertBefore(trackEl.lastElementChild, trackEl.firstElementChild);
      trackEl.style.transform = 'translateX(' + (-step()) + 'px)';
      void trackEl.offsetWidth;
      trackEl.style.transition = '';
      trackEl.style.transform = 'translateX(0)';
      after(function () { busy = false; });
    };
    var delay = parseInt(slider.getAttribute('data-autoplay'), 10);
    var auto = null;
    var restart = function () {
      if (reduceMotion || !delay) return;
      clearInterval(auto);
      auto = setInterval(next, delay);
    };
    slider.querySelector('.h-slider-next').addEventListener('click', function () { next(); restart(); });
    slider.querySelector('.h-slider-prev').addEventListener('click', function () { prev(); restart(); });
    slider.addEventListener('mouseenter', function () { clearInterval(auto); });
    slider.addEventListener('mouseleave', restart);
    restart();
  });
})();
