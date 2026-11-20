/* ============================================================
   ORAKSER — HOMEPAGE UPDATES
   1. Why choose us: section stays pinned, cards scroll, counter 01-06;
      the page moves on only after card 6
   2. Testimonial slider with arrows (infinite loop)
   3. Regulator cards: staggered reveal
   ============================================================ */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Why choose us ---------- */
  var why = document.querySelector('.why-pin');
  if (why) {
    var viewport = why.querySelector('.why-viewport');
    var track = why.querySelector('.why-list');
    var cards = track.querySelectorAll('.why-item');
    var left = why.querySelector('.sticky-col');
    var currentEl = why.querySelector('.why-current');
    var bar = why.querySelector('.why-bar i');
    var topbar = document.querySelector('.topbar');
    var navbar = document.getElementById('navbar');
    var desktop = window.matchMedia('(min-width: 1025px)');
    var distance = 0, pinned = false, active = -1, lastPinTop = -1;

    var headerTop = function () { return (topbar ? topbar.offsetHeight : 0) + (navbar ? navbar.offsetHeight : 0); };

    var setActive = function (i) {
      if (i === active) return;
      active = i;
      Array.prototype.forEach.call(cards, function (c, k) { c.classList.toggle('active', k === i); });
      if (currentEl) {
        currentEl.textContent = (i + 1 < 10 ? '0' : '') + (i + 1);
        currentEl.classList.remove('flip'); void currentEl.offsetWidth; currentEl.classList.add('flip');
      }
      if (bar) bar.style.transform = 'scaleX(' + ((i + 1) / cards.length) + ')';
    };

    var layout = function () {
      pinned = desktop.matches && !reduceMotion;
      why.classList.toggle('is-pinned', pinned);
      track.style.transform = '';
      why.style.height = '';
      var pinTop = headerTop(); lastPinTop = pinTop;
      why.style.setProperty('--pin-top', pinTop + 'px');
      /* If the left column can't fit on this screen, don't pin, so nothing is cut off. */
      if (pinned && left.offsetHeight > window.innerHeight - pinTop - 24) {
        pinned = false;
        why.classList.remove('is-pinned');
      }
      if (!pinned) { update(); return; }
      distance = Math.max(0, track.scrollHeight - (viewport.clientHeight - 78) + 8);
      /* A little dwell per card so fast scrollers still see each one. */
      var dwell = Math.round(window.innerHeight * 0.12) * cards.length;
      var newH = (window.innerHeight - pinTop + distance + dwell) + 'px';
      var changed = why.style.height !== newH;
      why.style.height = newH;
      /* GSAP measured the page before this section grew: let it re-measure. */
      if (changed && window.ScrollTrigger) requestAnimationFrame(function () { window.ScrollTrigger.refresh(); });
      update();
    };

    var update = function () {
      if (!pinned) {
        var mid = window.innerHeight / 2, best = 0, bestD = Infinity;
        Array.prototype.forEach.call(cards, function (c, k) {
          var r = c.getBoundingClientRect();
          var d = Math.abs(r.top + r.height / 2 - mid);
          if (d < bestD) { bestD = d; best = k; }
        });
        setActive(best);
        return;
      }
      var pinTop = headerTop();
      /* The header tightens after the first scroll: re-measure so nothing hides under it. */
      if (pinTop !== lastPinTop) { layout(); return; }
      var rect = why.getBoundingClientRect();
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

  /* ---------- 2. Testimonial slider ---------- */
  document.querySelectorAll('.t-slider').forEach(function (slider) {
    var trackEl = slider.querySelector('.t-track');
    var originals = Array.prototype.slice.call(trackEl.children);
    if (!originals.length) return;
    /* Clone once so the loop never shows a gap, even with few reviews. */
    originals.forEach(function (s) {
      var c = s.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      trackEl.appendChild(c);
    });
    var busy = false;
    var step = function () {
      var first = trackEl.children[0];
      return first.getBoundingClientRect().width + parseFloat(getComputedStyle(first).marginRight || 0);
    };
    var after = function (fn) {
      var called = false;
      var done = function () {
        if (called) return; called = true;
        trackEl.removeEventListener('transitionend', done); fn();
      };
      trackEl.addEventListener('transitionend', done);
      setTimeout(done, 800);
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
    slider.querySelector('.t-next').addEventListener('click', function () { next(); restart(); });
    slider.querySelector('.t-prev').addEventListener('click', function () { prev(); restart(); });
    slider.addEventListener('mouseenter', function () { clearInterval(auto); });
    slider.addEventListener('mouseleave', restart);
    restart();
  });

  /* ---------- 3. Regulator cards: staggered reveal ---------- */
  var regCards = document.querySelectorAll('.reg-card');
  if (regCards.length) {
    if (!('IntersectionObserver' in window) || reduceMotion) {
      regCards.forEach(function (c) { c.classList.add('in-view'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var i = Array.prototype.indexOf.call(regCards, e.target);
          e.target.style.setProperty('--d', ((i % 8) * 60) + 'ms');
          e.target.classList.add('in-view');
          io.unobserve(e.target);
        });
      }, { threshold: 0.15 });
      regCards.forEach(function (c) { io.observe(c); });
    }
  }
})();
