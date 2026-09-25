/* ============================================================
   ORAKSER — GSAP CINEMATIC MOTION LAYER
   Adds premium image motion on top of the existing site:
   - Homepage hero: custom cinematic crossfade + slow zoom slider,
     with a soft clip-path wipe on the very first reveal and a
     subtle scroll parallax as the visitor scrolls past the hero.
   - Service pages: scroll-triggered slow zoom + reveal on the
     overview photo.
   Everything here is additive — no existing markup, layout, or
   functionality is touched. If GSAP fails to load (e.g. CDN
   blocked), the site's existing CSS animations still run, so
   nothing breaks.
   ============================================================ */
(function () {
  'use strict';
  if (typeof gsap === 'undefined') return; /* graceful no-op fallback */

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);

  /* ============================================================
     HOMEPAGE — cinematic hero slider
     ============================================================ */
  var slideshow = document.querySelector('.hero-slideshow');
  var slides = slideshow ? Array.prototype.slice.call(slideshow.querySelectorAll('.hero-slide')) : [];

  if (slideshow && slides.length) {
    /* Hand control to GSAP: stop the CSS keyframe loop so the two never fight. */
    slideshow.classList.add('gsap-driven');

    if (reduceMotion) {
      gsap.set(slides[0], { opacity: 1, scale: 1.04 });
    } else {
      var HOLD = 5.4;      /* seconds each slide is fully visible */
      var FADE = 1.6;      /* seconds of crossfade between slides */
      var ZOOM_FROM = 1.04;
      var ZOOM_TO = 1.14;

      gsap.set(slides, { opacity: 0, scale: ZOOM_FROM });

      /* Cinematic wipe-in flourish for the very first slide's first appearance only. */
      gsap.set(slides[0], { clipPath: 'inset(0 100% 0 0)' });
      gsap.to(slides[0], {
        clipPath: 'inset(0 0% 0 0)', duration: 1.7, ease: 'power3.inOut'
      });

      /* Uniform crossfade + slow zoom for every slide, looping forever. */
      var master = gsap.timeline({ repeat: -1, delay: 1.7 });
      slides.forEach(function (slide, i) {
        var pos = i * HOLD;
        gsap.set(slide, { clipPath: 'inset(0 0% 0 0)' });
        master.to(slide, { opacity: 1, duration: FADE, ease: 'power2.inOut' }, pos);
        master.fromTo(slide, { scale: ZOOM_FROM }, { scale: ZOOM_TO, duration: HOLD + FADE, ease: 'none' }, pos);
        master.to(slide, { opacity: 0, duration: FADE, ease: 'power2.inOut' }, pos + HOLD);
      });
    }

    /* Subtle parallax: the slideshow drifts slower than the page as you scroll past the hero. */
    if (!reduceMotion && typeof ScrollTrigger !== 'undefined') {
      gsap.to(slideshow, {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: {
          trigger: slideshow.closest('.hero-cinematic') || slideshow,
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });
    }
  }

  /* ============================================================
     SERVICE PAGES — overview photo: scroll reveal + slow zoom
     ============================================================ */
  if (!reduceMotion && typeof ScrollTrigger !== 'undefined') {
    document.querySelectorAll('.overview-photo img').forEach(function (img) {
      var wrap = img.closest('.overview-photo');
      gsap.set(img, { scale: 1.16 });
      gsap.fromTo(wrap, { clipPath: 'inset(0 0 100% 0)' }, {
        clipPath: 'inset(0 0 0% 0)', duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: wrap, start: 'top 88%' }
      });
      gsap.to(img, {
        scale: 1, ease: 'none',
        scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom 60%', scrub: true }
      });
    });

    /* Inline mission/about photos get the same slow, cinematic zoom-out-on-scroll treatment. */
    document.querySelectorAll('.inline-photo img').forEach(function (img) {
      gsap.set(img, { scale: 1.12 });
      gsap.to(img, {
        scale: 1, ease: 'none',
        scrollTrigger: { trigger: img.closest('.inline-photo'), start: 'top bottom', end: 'bottom 55%', scrub: true }
      });
    });
  }
})();
