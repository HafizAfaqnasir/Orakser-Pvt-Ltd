/* ============================================================
   ORAKSER — HOMEPAGE MOTION
   Hero intro choreography, cursor depth, kinetic strip, card tilt,
   magnetic buttons and scroll storytelling. Content is fully visible
   without this file; it only layers motion on top. Respects
   prefers-reduced-motion and skips pointer effects on touch screens.
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGsap = typeof gsap !== 'undefined';
  var hasST = hasGsap && typeof ScrollTrigger !== 'undefined';
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Split headings into masked words ---------- */
  function splitWords(el) {
    var nodes = Array.prototype.slice.call(el.childNodes);
    el.textContent = '';
    nodes.forEach(function (node) {
      var target = el;
      var text = node.textContent;
      if (node.nodeType === 1) { target = node.cloneNode(false); el.appendChild(target); }
      text.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { target.appendChild(document.createTextNode(' ')); return; }
        var w = document.createElement('span'); w.className = 'w';
        var wi = document.createElement('span'); wi.className = 'wi'; wi.textContent = part;
        w.appendChild(wi); target.appendChild(w);
      });
    });
  }
  var splitTargets = document.querySelectorAll('.split-words, .hdr h2, .hdr-left h2, .about-copy h2, .sticky-col h2, #faq-h2');
  if (hasGsap && !reduce) {
    splitTargets.forEach(function (el) {
      if (!el.classList.contains('split-words')) el.classList.add('split-words');
      el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
      splitWords(el);
      el.querySelectorAll('.w').forEach(function (w) { w.setAttribute('aria-hidden', 'true'); });
    });
  }

  if (!hasGsap || reduce) return;

  /* ---------- Hero intro choreography ---------- */
  var hero = document.querySelector('.hero-lead');
  if (hero) {
    var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.from('.hero-kicker', { y: 20, opacity: 0, duration: .5 })
      .from('.hero-lead h1 .wi', { yPercent: 110, duration: .8, stagger: .06 }, '-=.35')
      .from('.hero-rotator', { y: 16, opacity: 0, duration: .5 }, '-=.55')
      .from('.hero-lead-sub', { y: 18, opacity: 0, duration: .5 }, '-=.4')
      .from('.hero-points li', { x: -24, opacity: 0, duration: .5, stagger: .06 }, '-=.4')
      .from('.hero-lead .hero-btn-row .btn', { y: 22, opacity: 0, duration: .5, stagger: .08 }, '-=.4')
      .from('.hero-proof-item', { y: 26, opacity: 0, duration: .5, stagger: .07 }, '-=.35')
      .from('.lead-wrap', { x: 70, opacity: 0, rotateY: -12, transformPerspective: 1200, duration: 1.1, ease: 'expo.out' }, .2)
      .from('.seal', { scale: 0, rotate: -180, duration: 1, ease: 'back.out(1.7)' }, .7)
      .from('.hero-symbols .sym', { opacity: 0, scale: .4, duration: 1.4, stagger: .12, ease: 'expo.out' }, .2);

    /* Cursor depth: orbs and legal symbols drift toward the pointer */
    if (finePointer) {
      var syms = hero.querySelectorAll('.sym');
      var orbs = hero.querySelectorAll('.orb');
      hero.addEventListener('mousemove', function (e) {
        var r = hero.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width - .5;
        var ny = (e.clientY - r.top) / r.height - .5;
        syms.forEach(function (s) {
          var d = parseFloat(s.getAttribute('data-depth')) || 20;
          s.style.transform = 'translate(' + (nx * d) + 'px,' + (ny * d) + 'px)';
        });
        orbs.forEach(function (o, i) {
          gsap.to(o, { x: nx * (i ? -60 : 80), y: ny * (i ? -50 : 60), duration: 1.2, ease: 'power3.out', overwrite: 'auto' });
        });
      });
    }

    /* Hero content eases up and fades as you scroll away */
    if (hasST) {
      gsap.to('.hero-lead-inner', { yPercent: -8, opacity: .35, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    }
  }

  /* ---------- Kinetic strip: speed + direction follow scroll velocity ---------- */
  var track = document.querySelector('.kinetic-track');
  if (track && hasST) {
    track.classList.add('js-driven');
    var loop = gsap.to(track, { xPercent: -50, duration: 38, ease: 'none', repeat: -1 });
    var dir = 1;
    ScrollTrigger.create({
      trigger: '.kinetic', start: 'top bottom', end: 'bottom top',
      onUpdate: function (self) {
        var v = self.getVelocity();
        if (v !== 0) dir = v > 0 ? 1 : -1;
        var boost = Math.min(Math.abs(v) / 180, 7);
        gsap.to(loop, { timeScale: dir * (1 + boost), duration: .25, overwrite: true });
        gsap.to(loop, { timeScale: dir, duration: 1.2, delay: .25, ease: 'power2.out' });
      }
    });
  }

  if (!hasST) return;

  /* Entrance tween that temporarily disables CSS transitions (which would
     fight GSAP each frame) and clears inline styles when done. */
  function enter(targets, vars) {
    var els = gsap.utils.toArray(targets);
    if (!els.length) return;
    els.forEach(function (e) { e.style.transition = 'none'; });
    vars.clearProps = 'transform,opacity';
    vars.onComplete = function () { els.forEach(function (e) { e.style.transition = ''; }); };
    gsap.from(els, vars);
  }

  /* ---------- Section headings: masked word rise ---------- */
  document.querySelectorAll('.split-words').forEach(function (el) {
    if (el.closest('.hero-lead')) return;
    gsap.from(el.querySelectorAll('.wi'), {
      yPercent: 110, duration: .9, stagger: .06, ease: 'power4.out',
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });

  /* ---------- Trust bar numbers pop ---------- */
  gsap.from('.trustbar-item', { y: 24, opacity: 0, duration: .7, stagger: .1, ease: 'power3.out',
    scrollTrigger: { trigger: '.trustbar', start: 'top 92%' } });

  /* ---------- About: frame slides, image reveals with zoom-out ---------- */
  var aboutImg = document.querySelector('.about-media img');
  if (aboutImg) {
    gsap.fromTo(aboutImg, { clipPath: 'inset(0 0 100% 0)', scale: 1.25 },
      { clipPath: 'inset(0 0 0% 0)', scale: 1, duration: 1.4, ease: 'expo.out',
        scrollTrigger: { trigger: '.about-media', start: 'top 80%' } });
    gsap.to(aboutImg, { yPercent: -6, ease: 'none',
      scrollTrigger: { trigger: '.about-media', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  /* ---------- Service cards: stagger in, then tilt + spotlight ---------- */
  enter('.svc-card', { y: 60, opacity: 0, rotateX: -12, transformPerspective: 900, duration: .9, stagger: .08, ease: 'power3.out',
    scrollTrigger: { trigger: '.svc-cards', start: 'top 82%' } });
  if (finePointer) {
    document.querySelectorAll('.svc-card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var x = e.clientX - r.left, y = e.clientY - r.top;
        card.style.setProperty('--mx', x + 'px');
        card.style.setProperty('--my', y + 'px');
        var rx = ((y / r.height) - .5) * -10, ry = ((x / r.width) - .5) * 12;
        card.classList.add('tilting');
        gsap.to(card, { rotateX: rx, rotateY: ry, y: -8, transformPerspective: 900, duration: .4, ease: 'power2.out', overwrite: 'auto' });
      });
      card.addEventListener('mouseleave', function () {
        gsap.to(card, { rotateX: 0, rotateY: 0, y: 0, duration: .7, ease: 'elastic.out(1, .5)', overwrite: 'auto',
          onComplete: function () { card.classList.remove('tilting'); } });
      });
    });
  }

  /* Why us: counter and active card are driven by updates.js (pinned scroll). */

  /* ---------- Process: line draws, steps pop in sequence ---------- */
  var line = document.querySelector('.steps-line span');
  if (line) {
    gsap.fromTo(line, { scaleX: 0 }, { scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: '.steps-v2', start: 'top 75%', end: 'top 35%', scrub: .6 } });
  }
  enter('.step-v2', { y: 50, opacity: 0, scale: .9, duration: .8, stagger: .14, ease: 'back.out(1.6)',
    scrollTrigger: { trigger: '.steps-v2', start: 'top 80%' } });

  /* ---------- Team: curtain reveal on the leader, cards rise ---------- */
  var lead = document.querySelector('.team-lead');
  if (lead) {
    gsap.fromTo(lead, { clipPath: 'inset(100% 0 0 0 round 20px)' }, { clipPath: 'inset(0% 0 0 0 round 20px)', duration: 1.3, ease: 'expo.out',
      scrollTrigger: { trigger: lead, start: 'top 80%' } });
    gsap.fromTo(lead.querySelector('img'), { scale: 1.3 }, { scale: 1, duration: 1.8, ease: 'expo.out',
      scrollTrigger: { trigger: lead, start: 'top 80%' } });
  }

  /* ---------- Logo wall: cascade ---------- */
  gsap.utils.toArray('.logo-wall').forEach(function (wall) {
    enter(wall.children, { y: 30, opacity: 0, duration: .6, stagger: .07, ease: 'power3.out',
      scrollTrigger: { trigger: wall, start: 'top 88%' } });
  });

  /* ---------- CTA watermark parallax ---------- */
  gsap.to('.cta-mark', { yPercent: -20, ease: 'none',
    scrollTrigger: { trigger: '.cta-v2', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* ---------- Magnetic buttons ---------- */
  if (finePointer) {
    document.querySelectorAll('.magnetic').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        gsap.to(btn, { x: dx * .25, y: dy * .35, duration: .3, ease: 'power3.out' });
      });
      btn.addEventListener('mouseleave', function () {
        gsap.to(btn, { x: 0, y: 0, duration: .6, ease: 'elastic.out(1, .4)' });
      });
    });
  }

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
