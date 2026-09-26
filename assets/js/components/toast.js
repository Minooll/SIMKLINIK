/**
 * SIMKLINIK - Accessible Toast Notification Component
 * Zero inline styles, uses CSS classes defined in modal.css.
 */
(function (global) {
  'use strict';

  let container = null;

  function ensureContainer() {
    if (!container || !document.body.contains(container)) {
      container = document.querySelector('.toast-container');
      if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-atomic', 'true');
        document.body.appendChild(container);
      }
    }
    return container;
  }

  const ICONS = {
    success: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`,
    error: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    info: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
  };

  function show(message, type = 'info', duration = 3800) {
    const parent = ensureContainer();
    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    toast.setAttribute('role', 'alert');

    const iconHtml = ICONS[type] || ICONS.info;
    const textSpan = document.createElement('span');
    textSpan.textContent = message;

    toast.innerHTML = iconHtml;
    toast.appendChild(textSpan);
    parent.appendChild(toast);

    let dismissed = false;
    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      toast.classList.add('is-dismissing');
      // allow animation before removal
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 250);
    }

    toast.addEventListener('click', dismiss);
    if (duration > 0) {
      setTimeout(dismiss, duration);
    }

    return { dismiss };
  }

  const Toast = {
    show,
    success(msg, duration) { return show(msg, 'success', duration); },
    error(msg, duration) { return show(msg, 'error', duration); },
    info(msg, duration) { return show(msg, 'info', duration); }
  };

  global.Toast = Toast;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Toast;
  }
})(typeof window !== 'undefined' ? window : this);
