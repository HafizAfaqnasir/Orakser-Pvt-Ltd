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
    var current = 0;

    /* Wrap every word of each headline so it can rise out of a mask.
       Elements like <em> and <br> are kept as they are. */
    var wordIndex = 0;
    var splitWords = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            var inner = document.createElement('span');
            inner.textContent = part;
            inner.style.setProperty('--d', (wordIndex++ * 70) + 'ms');
            w.appendChild(inner); frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          splitWords(child);
        }
      });
    };
    Array.prototype.forEach.call(texts, function (t) {
      var h1 = t.querySelector('h1');
      if (!h1) return;
      var label = '';
      Array.prototype.forEach.call(h1.childNodes, function (n) { label += n.nodeName === 'BR' ? ' ' : n.textContent; });
      h1.setAttribute('aria-label', label.replace(/\s+/g, ' ').trim());
      wordIndex = 0; splitWords(h1);
      Array.prototype.forEach.call(h1.querySelectorAll('.w'), function (w) { w.setAttribute('aria-hidden', 'true'); });
    });

    var go = function (i) {
      var n = texts.length;
      current = (i + n) % n;
      [bgs, texts, dots].forEach(function (list) {
        Array.prototype.forEach.call(list, function (el, k) { el.classList.toggle('is-active', k === current); });
      });
    };
    /* Autoplay is driven by the active dot's fill animation, so the
       timer bar and the slide change always stay in sync. */
    hero.querySelector('.h-hero-dots').addEventListener('animationend', function (e) {
      if (e.animationName === 'dotFill') go(current + 1);
    });
    hero.querySelector('.h-hero-prev').addEventListener('click', function () { go(current - 1); });
    hero.querySelector('.h-hero-next').addEventListener('click', function () { go(current + 1); });
    Array.prototype.forEach.call(dots, function (d, k) { d.addEventListener('click', function () { go(k); }); });
    /* Pause while someone is filling in the form; resume when they leave it. */
    var form = hero.querySelector('.h-hero-form');
    form.addEventListener('focusin', function () { hero.classList.add('is-paused'); });
    form.addEventListener('focusout', function () {
      setTimeout(function () { if (!form.contains(document.activeElement)) hero.classList.remove('is-paused'); }, 50);
    });
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
    var left = why.querySelector('.h-why-left');
    var distance = 0, pinned = false, active = -1;
    var desktop = window.matchMedia('(min-width: 1025px)');

    var setActive = function (i) {
      if (i === active) return;
      active = i;
      Array.prototype.forEach.call(cards, function (c, k) { c.classList.toggle('is-active', k === i); });
      currentEl.textContent = (i + 1 < 10 ? '0' : '') + (i + 1);
      currentEl.classList.remove('flip'); void currentEl.offsetWidth; currentEl.classList.add('flip');
      fill.style.width = ((i + 1) / cards.length * 100) + '%';
    };

    var layout = function () {
      pinned = desktop.matches && !reduceMotion;
      why.classList.toggle('is-pinned', pinned);
      track.style.transform = '';
      why.style.height = '';
      var pinTop = navbar ? navbar.offsetHeight : 0;
      why.style.setProperty('--pin-top', pinTop + 'px');
      /* If the left column still can't fit on this screen, don't pin:
         the section then scrolls normally and nothing gets cut off. */
      if (pinned && left.offsetHeight > window.innerHeight - pinTop - 24) {
        pinned = false;
        why.classList.remove('is-pinned');
      }
      if (!pinned) return;
      /* How far the cards must travel so the last one ends fully in view. */
      distance = Math.max(0, track.scrollHeight - (viewport.clientHeight - 64) + 8);
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

  /* ---------- 4. Reading progress line ---------- */
  var bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  var paintBar = function () {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
  };

  /* ---------- 5. Process journey: line fills, steps light up, stamp lands ---------- */
  var journey = document.querySelector('.h-journey');
  var steps = journey ? journey.querySelectorAll('.h-step') : [];
  var paintJourney = function () {
    if (!journey) return;
    var r = journey.getBoundingClientRect();
    var vh = window.innerHeight;
    var p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / Math.max(r.height * 0.9, vh * 0.55)));
    if (reduceMotion && r.top < vh) p = 1;
    journey.style.setProperty('--p', p.toFixed(3));
    Array.prototype.forEach.call(steps, function (s, k) {
      var on = p >= (k / (steps.length - 1)) * 0.92 + 0.02;
      s.classList.toggle('is-on', on);
      if (s.classList.contains('h-step-final') && on) s.classList.add('is-stamped');
    });
  };

  var queued = false;
  var onScrollFrame = function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; paintBar(); paintJourney(); });
  };
  window.addEventListener('scroll', onScrollFrame, { passive: true });
  window.addEventListener('resize', onScrollFrame);
  onScrollFrame();

  /* ---------- 6. Service cards: cursor-follow tilt (mouse only) ---------- */
  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.h-svc').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--ry', ((x - 0.5) * 10).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((0.5 - y) * 8).toFixed(2) + 'deg');
        card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        card.classList.add('is-tilting');
      });
      card.addEventListener('pointerleave', function () { card.classList.remove('is-tilting'); });
    });
  }
})();
