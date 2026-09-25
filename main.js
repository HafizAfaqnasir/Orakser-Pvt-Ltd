/* ============================================================
   ORAKSER — SHARED SITE BEHAVIOR
   Nav scroll state, mobile menu, FAQ accordion, counters,
   scroll-reveal, and WhatsApp form submission.
   ============================================================ */
(function () {
  'use strict';

  var WA_NUMBER = '923000091881'; /* +92-300-0091881, wa.me format */

  /* ---------- Sticky navbar shrink on scroll ---------- */
  var navbar = document.getElementById('navbar');
  function onScroll() {
    if (!navbar) return;
    if (window.scrollY > 12) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var hamburger = document.getElementById('hamburger');
  var mobileNav = document.getElementById('mobileNav');
  var navOverlay = document.getElementById('navOverlay');
  var mobileNavClose = document.getElementById('mobileNavClose');

  function openMobileNav() {
    hamburger && hamburger.classList.add('open');
    mobileNav && mobileNav.classList.add('open');
    navOverlay && navOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeMobileNav() {
    hamburger && hamburger.classList.remove('open');
    mobileNav && mobileNav.classList.remove('open');
    navOverlay && navOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }
  if (hamburger) {
    hamburger.addEventListener('click', function () {
      if (mobileNav && mobileNav.classList.contains('open')) closeMobileNav();
      else openMobileNav();
    });
  }
  navOverlay && navOverlay.addEventListener('click', closeMobileNav);
  mobileNavClose && mobileNavClose.addEventListener('click', closeMobileNav);

  /* Mobile dropdown toggle (Services submenu) */
  document.querySelectorAll('.mobile-sub-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var sub = btn.nextElementSibling;
      if (!sub) return;
      var isOpen = sub.style.maxHeight && sub.style.maxHeight !== '0px';
      sub.style.maxHeight = isOpen ? '0px' : sub.scrollHeight + 'px';
      btn.classList.toggle('open', !isOpen);
    });
  });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-question').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq-item');
      if (!item) return;
      var wasOpen = item.classList.contains('open');
      item.parentElement.querySelectorAll('.faq-item.open').forEach(function (openItem) {
        if (openItem !== item) openItem.classList.remove('open');
      });
      item.classList.toggle('open', !wasOpen);
    });
  });

  /* ---------- Animated stat counters ---------- */
  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-target'), 10) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 1600;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target).toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString() + suffix;
    }
    requestAnimationFrame(step);
  }

  /* ---------- Scroll reveal + counter trigger (single observer) ---------- */
  var STAGGER_SELECTOR = '.gov-badge, .quick-card, .service-card, .team-card, .office-card, .price-card';

  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      if (el.matches(STAGGER_SELECTOR)) {
        var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) { return c.matches(STAGGER_SELECTOR); });
        var idx = siblings.indexOf(el);
        el.style.transitionDelay = Math.min(idx * 70, 420) + 'ms';
      }
      el.classList.add('in-view');
      if (el.classList.contains('stat-num') && !el.dataset.counted) {
        el.dataset.counted = '1';
        animateCount(el);
      }
      io.unobserve(el);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }) : null;

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .stat-num, .gov-badge, .quick-card').forEach(function (el) {
    if (io) io.observe(el);
    else { el.classList.add('in-view'); if (el.classList.contains('stat-num')) animateCount(el); }
  });

  /* ---------- Service catalog filter tabs ---------- */
  document.querySelectorAll('.filter-tabs').forEach(function (tabs) {
    var cards = document.querySelectorAll('[data-category]');
    tabs.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter-tab');
      if (!btn) return;
      tabs.querySelectorAll('.filter-tab').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var cat = btn.getAttribute('data-filter');
      cards.forEach(function (card) {
        var match = cat === 'all' || card.getAttribute('data-category') === cat;
        card.style.display = match ? '' : 'none';
      });
    });
  });

  /* ============================================================
     WHATSAPP FORM SUBMISSION
     Any <form class="wa-form"> auto-wires to WhatsApp.
     Optional form attribute: data-wa-heading="Custom Title"
     ============================================================ */
  function buildWaMessage(form) {
    var heading = form.getAttribute('data-wa-heading') || 'New Inquiry — Orakser Website';
    var lines = ['*' + heading + '*', ''];
    var labels = {
      name: 'Name', phone: 'Phone', email: 'Email', service: 'Service Required',
      city: 'Preferred Office', message: 'Message', company: 'Company Name'
    };
    Array.prototype.forEach.call(form.elements, function (field) {
      if (!field.name || field.type === 'submit' || field.type === 'button') return;
      var value = (field.value || '').toString().trim();
      if (!value) return;
      var label = labels[field.name] || (field.name.charAt(0).toUpperCase() + field.name.slice(1));
      lines.push(label + ': ' + value);
    });
    lines.push('', '_Sent via Orakser Website_');
    return lines.join('\n');
  }

  function validateForm(form) {
    var valid = true;
    var firstInvalid = null;
    Array.prototype.forEach.call(form.querySelectorAll('[required]'), function (field) {
      var fieldWrap = field.closest('.field') || field.parentElement;
      var value = (field.value || '').trim();
      var ok = true;
      if (!value) ok = false;
      if (ok && field.type === 'email') {
        ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      }
      if (ok && field.type === 'tel') {
        ok = value.replace(/[^0-9]/g, '').length >= 7;
      }
      if (!ok) {
        valid = false;
        fieldWrap && fieldWrap.classList.add('has-error');
        if (!firstInvalid) firstInvalid = field;
      } else {
        fieldWrap && fieldWrap.classList.remove('has-error');
      }
    });
    if (firstInvalid) firstInvalid.focus();
    return valid;
  }

  document.querySelectorAll('form.wa-form').forEach(function (form) {
    form.setAttribute('novalidate', 'novalidate');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateForm(form)) return;

      var message = buildWaMessage(form);
      var url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(message);

      var successBox = form.querySelector('.form-success');
      if (successBox) successBox.classList.add('show');
      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.style.opacity = '0.7'; }

      setTimeout(function () {
        window.open(url, '_blank', 'noopener');
        form.reset();
        if (submitBtn) { submitBtn.disabled = false; submitBtn.style.opacity = ''; }
        setTimeout(function () { successBox && successBox.classList.remove('show'); }, 6000);
      }, 700);
    });
  });

  /* ---------- Live-clear error state while typing ---------- */
  document.querySelectorAll('.field input, .field select, .field textarea').forEach(function (el) {
    el.addEventListener('input', function () {
      var wrap = el.closest('.field');
      if (wrap) wrap.classList.remove('has-error');
    });
  });
})();
