/**
 * SIMKLINIK - Accessible Modal Dialog Component
 * Zero inline styles, controls open/close via `.is-open` CSS class.
 * Handles Focus trapping, Escape key, and backdrop click.
 */
(function (global) {
  'use strict';

  let activeModal = null;
  let previousActiveElement = null;

  const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  function trapFocus(e) {
    if (!activeModal || e.key !== 'Tab') return;
    const focusables = activeModal.querySelectorAll(FOCUSABLE_SELECTOR);
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        last.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Escape' && activeModal) {
      const isStatic = activeModal.getAttribute('data-backdrop') === 'static';
      if (!isStatic) {
        Modal.close(activeModal);
      }
    }
  }

  const Modal = {
    open(target) {
      const modalEl = typeof target === 'string' ? document.getElementById(target) : target;
      if (!modalEl) {
        console.warn(`[Modal] Element not found:`, target);
        return;
      }

      if (activeModal && activeModal !== modalEl) {
        Modal.close(activeModal);
      }

      previousActiveElement = document.activeElement;
      activeModal = modalEl;

      modalEl.classList.add('is-open');
      modalEl.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');

      // Autofocus first input or close button
      const firstInput = modalEl.querySelector('input:not([type="hidden"]), select, textarea, button.btn-modal-submit, .modal-close-btn');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 60);
      }

      document.addEventListener('keydown', trapFocus);
      document.addEventListener('keydown', handleKeydown);

      // Dispatch custom event
      modalEl.dispatchEvent(new CustomEvent('modal:opened', { detail: { modal: modalEl } }));
    },

    close(target) {
      const modalEl = target
        ? (typeof target === 'string' ? document.getElementById(target) : target)
        : activeModal;

      if (!modalEl) return;

      modalEl.classList.remove('is-open');
      modalEl.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');

      document.removeEventListener('keydown', trapFocus);
      document.removeEventListener('keydown', handleKeydown);

      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus();
      }

      const closedModal = activeModal;
      activeModal = null;
      previousActiveElement = null;

      if (closedModal) {
        closedModal.dispatchEvent(new CustomEvent('modal:closed', { detail: { modal: closedModal } }));
      }
    },

    initAutoBindings() {
      document.addEventListener('click', (e) => {
        // Trigger open
        const trigger = e.target.closest('[data-modal-target]');
        if (trigger) {
          e.preventDefault();
          const targetId = trigger.getAttribute('data-modal-target');
          Modal.open(targetId);
          return;
        }

        // Trigger close
        const closeBtn = e.target.closest('[data-modal-close]');
        if (closeBtn) {
          e.preventDefault();
          const modalBackdrop = closeBtn.closest('.modal-backdrop');
          Modal.close(modalBackdrop);
          return;
        }

        // Backdrop click to close
        if (e.target.classList.contains('modal-backdrop')) {
          if (e.target.getAttribute('data-backdrop') !== 'static') {
            Modal.close(e.target);
          }
        }
      });
    }
  };

  // Auto initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Modal.initAutoBindings());
  } else {
    Modal.initAutoBindings();
  }

  global.Modal = Modal;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Modal;
  }
})(typeof window !== 'undefined' ? window : this);
