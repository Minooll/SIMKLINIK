// ====================================================================
// Komponen Modal Dialog Aksesibel - SIMKLINIK Purworejo
// ====================================================================

function showModal(modalId) {
  if (typeof document === 'undefined') return;
  const modal = document.getElementById(modalId);
  if (!modal) {
    console.warn(`Modal with ID "${modalId}" not found.`);
    return;
  }
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');

  // Set focus on first focusable element
  const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (focusable) focusable.focus();
}

function closeModal(modalId) {
  if (typeof document === 'undefined') return;
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
}

function initModal() {
  if (typeof document === 'undefined') return;

  // Pasang event listener untuk tombol penutup modal (data-close-modal)
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal-backdrop');
      if (modal) closeModal(modal.id);
    });
  });

  // Tutup jika mengklik area backdrop
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });

  // Tutup dengan tombol Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const activeModal = document.querySelector('.modal-backdrop.active');
      if (activeModal) closeModal(activeModal.id);
    }
  });
}

// Inisialisasi otomatis saat DOM siap
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModal);
  } else {
    initModal();
  }
}

if (typeof window !== 'undefined') {
  window.showModal = showModal;
  window.closeModal = closeModal;
  window.initModal = initModal;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    showModal,
    closeModal,
    initModal
  };
}
