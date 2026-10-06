// ====================================================================
// Service Antrean Realtime & Indikator Beban Keramaian
// SIMKLINIK Purworejo
// ====================================================================

/**
 * Menentukan tingkat keramaian antrean di faskes
 * Standar: < 5 Lengang, 5-10 Sedang, > 10 Padat
 */
function getCrowdStatus(queueCount) {
  const count = Number(queueCount) || 0;
  if (count < 5) return 'lengang';
  if (count <= 10) return 'sedang';
  return 'padat';
}

/**
 * Mendapatkan label teks dan warna status keramaian
 */
function getCrowdDisplay(queueCount) {
  const status = getCrowdStatus(queueCount);
  switch (status) {
    case 'lengang':
      return { status, label: 'Antrean Lengang (< 5)', class: 'lengang' };
    case 'sedang':
      return { status, label: 'Antrean Sedang (5-10)', class: 'sedang' };
    case 'padat':
      return { status, label: 'Antrean Padat (> 10)', class: 'padat' };
    default:
      return { status: 'lengang', label: 'Lengang', class: 'lengang' };
  }
}

/**
 * Format nomor antrean
 */
function formatQueueNumber(prefix = 'A', order = 1) {
  return `${prefix}-${String(order).padStart(2, '0')}`;
}

if (typeof window !== 'undefined') {
  window.getCrowdStatus = getCrowdStatus;
  window.getCrowdDisplay = getCrowdDisplay;
  window.formatQueueNumber = formatQueueNumber;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getCrowdStatus,
    getCrowdDisplay,
    formatQueueNumber
  };
}
