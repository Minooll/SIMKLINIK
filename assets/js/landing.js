/**
 * SIMKLINIK — Landing Page Interactivity (landing.js)
 * Clean vanilla JS with CSS class-based state management (zero inline styles).
 */
(() => {
  'use strict';

  const mobileToggle = document.getElementById('mobileMenuToggle');
  const navLinks = document.getElementById('navLinks');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navLinks.classList.toggle('is-open');
      const isOpen = navLinks.classList.contains('is-open');
      mobileToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (navLinks && navLinks.classList.contains('is-open') && !navLinks.contains(e.target) && e.target !== mobileToggle) {
      navLinks.classList.remove('is-open');
      if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth' });
          if (navLinks) {
            navLinks.classList.remove('is-open');
            if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
          }
        }
      }
    });
  });
})();
