// ====================================================================
// Komponen Toast Notification Mengambang - SIMKLINIK Purworejo
// ====================================================================

function showToast(message, type = 'info', duration = 3500) {
  if (typeof document === 'undefined') {
    return { message, type };
  }

  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');

  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';
  if (type === 'warning') icon = '⚠️';

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-msg">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);

  return toast;
}

if (typeof window !== 'undefined') {
  window.showToast = showToast;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    showToast
  };
}
