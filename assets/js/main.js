/* ============================================================
   ORAKSER — SHARED SITE BEHAVIOR
   Nav scroll state, mobile menu, FAQ accordion, counters,
   scroll-reveal, and WhatsApp form submission.
   ============================================================ */
(function () {
  'use strict';

  var WA_NUMBER = '923000091881'; /* +92-300-0091881, wa.me format */

  /* ---------- Sticky header ----------
     The whole header (topbar + navbar) stays pinned while scrolling, on
     every page. The navbar tightens a little once the page moves. */
  var navbar = document.getElementById('navbar');
  var topbar = document.querySelector('.topbar');
  function setTopbarHeight() {
    if (topbar) document.documentElement.style.setProperty('--topbar-h', topbar.offsetHeight + 'px');
  }
  setTopbarHeight();
  window.addEventListener('resize', setTopbarHeight);
  if (topbar && 'ResizeObserver' in window) new ResizeObserver(setTopbarHeight).observe(topbar);

  /* Thin red-to-blue reading progress bar along the top edge */
  var progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);

  function onScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(window.scrollY / max, 1) : 0) + ')';
    var y = window.scrollY;
    if (navbar) navbar.classList.toggle('scrolled', y > 12);
    /* Header leaves with the page, then slides back down from the top once
       it is out of view. Hysteresis stops it flickering at the edges. */
    var hdr = navbar ? navbar.parentElement : null;
    if (hdr && hdr.tagName === 'HEADER') {
      var fixed = document.body.classList.contains('hdr-fixed');
      if (!fixed) {
        var h = (topbar ? topbar.offsetHeight : 0) + hdr.offsetHeight;
        if (y > h + 120) {
          document.documentElement.style.setProperty('--hdr-h', hdr.offsetHeight + 'px');
          document.body.classList.add('hdr-fixed');
        }
      } else if (y < 4) {
        document.body.classList.remove('hdr-fixed');
      }
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var hamburgers = document.querySelectorAll('.hamburger');
  var mobileNav = document.getElementById('mobileNav');
  var navOverlay = document.getElementById('navOverlay');
  var mobileNavClose = document.getElementById('mobileNavClose');

  function openMobileNav() {
    hamburgers.forEach(function (b) { b.classList.add('open'); b.setAttribute('aria-expanded', 'true'); });
    mobileNav && mobileNav.classList.add('open');
    navOverlay && navOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeMobileNav() {
    hamburgers.forEach(function (b) { b.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); });
    mobileNav && mobileNav.classList.remove('open');
    navOverlay && navOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }
  hamburgers.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (mobileNav && mobileNav.classList.contains('open')) closeMobileNav();
      else openMobileNav();
    });
  });
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
  /* data-category may hold several space-separated categories, e.g. "ip popular" */
  document.querySelectorAll('.filter-tabs').forEach(function (tabs) {
    var cards = document.querySelectorAll('[data-category]');
    function applyFilter(cat) {
      cards.forEach(function (card) {
        var cats = (card.getAttribute('data-category') || '').split(/\s+/);
        var match = cat === 'all' || cats.indexOf(cat) !== -1;
        card.style.display = match ? '' : 'none';
      });
    }
    var initial = tabs.getAttribute('data-default');
    if (initial) applyFilter(initial);
    tabs.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter-tab');
      if (!btn) return;
      tabs.querySelectorAll('.filter-tab').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      applyFilter(btn.getAttribute('data-filter'));
    });
  });

  /* ---------- Mobile sticky action bar (Call / WhatsApp / Free Quote) ---------- */
  if (!document.querySelector('.m-actionbar')) {
    var bar = document.createElement('nav');
    bar.className = 'm-actionbar';
    bar.setAttribute('aria-label', 'Quick contact');
    bar.innerHTML =
      '<a class="mab-call" href="tel:+922135897959"><i class="fas fa-phone" aria-hidden="true"></i> Call</a>' +
      '<a class="mab-wa" href="https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent('Hello, I need consultation from Orakser.') + '" target="_blank" rel="noopener"><i class="fab fa-whatsapp" aria-hidden="true"></i> WhatsApp</a>' +
      '<a class="mab-quote" href="https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent('Hello, I would like a free quote. Service needed: ') + '" target="_blank" rel="noopener"><i class="fas fa-file-signature" aria-hidden="true"></i> Free Quote</a>';
    document.body.appendChild(bar);
  }

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
      city: 'Preferred Office', message: 'Message', company: 'Company Name',
      brand: 'Brand Name to Search', industry: 'Business Type'
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

  /* A form button may carry data-channel="email" or "whatsapp" (the default).
     Email: if the form has data-endpoint, the fields are POSTed there as JSON
     (plug in your backend / form service); otherwise the visitor's email app
     opens with the message pre-filled to info@orakser.com. */
  var EMAIL_TO = 'info@orakser.com';

  document.querySelectorAll('form.wa-form').forEach(function (form) {
    form.setAttribute('novalidate', 'novalidate');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateForm(form)) return;

      var submitter = e.submitter || form.querySelector('button[type="submit"]');
      var channel = (submitter && submitter.getAttribute('data-channel')) || 'whatsapp';
      var message = buildWaMessage(form);
      var successBox = form.querySelector('.form-success');
      var buttons = form.querySelectorAll('button[type="submit"]');
      function setBusy(busy) {
        buttons.forEach(function (b) { b.disabled = busy; b.style.opacity = busy ? '0.7' : ''; });
      }
      function done(text) {
        if (successBox) {
          var label = successBox.querySelector('.form-success-text');
          if (label && text) label.textContent = text;
          successBox.classList.add('show');
          setTimeout(function () { successBox.classList.remove('show'); }, 6000);
        }
        form.reset();
        setBusy(false);
      }

      setBusy(true);

      if (channel === 'email') {
        var endpoint = form.getAttribute('data-endpoint');
        if (endpoint && window.fetch) {
          var data = {};
          Array.prototype.forEach.call(form.elements, function (f) { if (f.name) data[f.name] = f.value; });
          fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(data) })
            .then(function (r) { if (!r.ok) throw new Error(r.status); done('Thank you! Our team will contact you within 2 hours.'); })
            .catch(function () { setBusy(false); window.location.href = mailtoUrl(form, message); });
        } else {
          window.location.href = mailtoUrl(form, message);
          done('Your email app is opening with your request. Just press send.');
        }
        return;
      }

      var url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(message);
      if (successBox) successBox.classList.add('show');
      setTimeout(function () {
        window.open(url, '_blank', 'noopener');
        done('Opening WhatsApp…');
      }, 700);
    });
  });

  function mailtoUrl(form, message) {
    var subject = form.getAttribute('data-wa-heading') || 'New Inquiry — Orakser Website';
    return 'mailto:' + EMAIL_TO + '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(message.replace(/\*/g, '').replace(/_/g, ''));
  }

  /* ---------- Live-clear error state while typing ---------- */
  document.querySelectorAll('.field input, .field select, .field textarea').forEach(function (el) {
    el.addEventListener('input', function () {
      var wrap = el.closest('.field');
      if (wrap) wrap.classList.remove('has-error');
    });
  });
})();
