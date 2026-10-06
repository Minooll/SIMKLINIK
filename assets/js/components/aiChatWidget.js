/**
 * SIMKLINIK - AI Patient Chat Widget Component (Sasa)
 * Handles Smart Triage, Purworejo Multi-Clinic & Queue Recommendations,
 * and direct [BOOK_CLINIC] / [BOOK_POLI] action shortcuts.
 */
(() => {
  'use strict';

  let widgetElement = null;
  let messagesContainer = null;
  let inputField = null;
  let isOpen = false;

  // Patient Location Context (Default: Kec. Purworejo)
  let userLocation = {
    district: 'Purworejo',
    latitude: -7.7144,
    longitude: 110.0125
  };

  const DISTRICT_COORDS = {
    'purworejo': { name: 'Kec. Purworejo Kota', lat: -7.7144, lon: 110.0125 },
    'kutoarjo': { name: 'Kec. Kutoarjo', lat: -7.7198, lon: 109.9134 },
    'banyuurip': { name: 'Kec. Banyuurip', lat: -7.7420, lon: 109.9985 }
  };

  const updateLocationByDistrict = (districtName) => {
    const key = (districtName || '').toLowerCase().trim();
    if (DISTRICT_COORDS[key]) {
      userLocation.district = key.charAt(0).toUpperCase() + key.slice(1);
      userLocation.latitude = DISTRICT_COORDS[key].lat;
      userLocation.longitude = DISTRICT_COORDS[key].lon;
      const select = document.getElementById('aiDistrictSelect');
      if (select && select.value !== userLocation.district) {
        select.value = userLocation.district;
      }
    }
  };

  const requestGeolocation = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          userLocation.latitude = pos.coords.latitude;
          userLocation.longitude = pos.coords.longitude;
          if (window.Toast) {
            window.Toast.success('Lokasi GPS berhasil diperbarui.');
          }
        },
        () => {
          if (window.Toast) {
            window.Toast.info('Menggunakan estimasi wilayah kecamatan Purworejo.');
          }
        },
        { timeout: 5000 }
      );
    }
  };

  const init = () => {
    if (document.getElementById('aiChatWidgetRoot')) return;

    const root = document.createElement('div');
    root.id = 'aiChatWidgetRoot';
    root.innerHTML = `
      <div class="ai-fab-container" id="aiFabContainer">
        <span class="ai-fab-label">Tanya Sasa 😊✨</span>
        <button class="ai-fab-btn" id="aiFabBtn" aria-label="Buka Asisten Medis Virtual">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10a9.96 9.96 0 0 1-4.708-1.175L2 22l1.175-5.292A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2z"></path>
            <circle cx="8.5" cy="11.5" r="1.5" fill="currentColor"></circle>
            <circle cx="15.5" cy="11.5" r="1.5" fill="currentColor"></circle>
          </svg>
          <span class="ai-fab-badge" aria-hidden="true"></span>
        </button>
      </div>

      <div class="ai-chat-window" id="aiChatWindow" aria-hidden="true">
        <header class="ai-chat-header">
          <div class="ai-chat-profile">
            <div class="ai-chat-avatar">S</div>
            <div class="ai-chat-title">
              <strong>Sasa — Asisten Cerdas Purworejo</strong>
              <small>😊 Rekomendasi Klinik &amp; Antrean Faskes ✨</small>
            </div>
          </div>
          <button class="ai-chat-close-btn" id="aiChatCloseBtn" aria-label="Tutup obrolan">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </header>

        <div class="ai-location-bar" id="aiLocationBar">
          <span class="ai-loc-label">📍 Wilayah:</span>
          <select class="ai-loc-select" id="aiDistrictSelect" aria-label="Pilih Kecamatan Anda">
            <option value="Purworejo">Kec. Purworejo Kota</option>
            <option value="Kutoarjo">Kec. Kutoarjo</option>
            <option value="Banyuurip">Kec. Banyuurip</option>
          </select>
          <button type="button" class="ai-gps-btn" id="aiGpsBtn" title="Gunakan GPS Browser">🎯 GPS</button>
        </div>

        <div class="ai-disclaimer-bar">
          ⚠️ Panduan edukatif &amp; navigasi klinik Purworejo. Darurat? Segera ke IGD/hubungi 119.
        </div>

        <div class="ai-chat-messages" id="aiChatMessages">
          <div class="ai-message bot">
            Halo Sahabat Sehat Kabupaten Purworejo! Senang sekali bisa menyapa kamu hari ini! 😊✨ Saya <strong>Sasa</strong> (<em>Sistem Asisten Skrining &amp; Anamnesis</em>), siap membantu menganalisis keluhan fisikmu serta merekomendasikan <strong>klinik terbaik, estimasi antrean, dan jarak terdekat</strong> di Purworejo! 🩺💖<br><br>Ada keluhan apa yang sedang dirasakan? Yuk, ceritakan ke Sasa dengan santai ya! 🌟
          </div>
        </div>

        <div class="ai-quick-chips" id="aiQuickChips">
          <button type="button" class="ai-chip-btn" data-query="Gigi ngilu dan ngedrop sejak kemarin, saya di Purworejo Kota">🦷 Sakit Gigi (Purworejo Kota)</button>
          <button type="button" class="ai-chip-btn" data-query="Anak saya demam tinggi dan batuk, lokasi saya di Kutoarjo">👶 Anak Demam (Kutoarjo)</button>
          <button type="button" class="ai-chip-btn" data-query="Mau cek tensi, asam urat dan kolesterol di Banyuurip">🩸 Cek Lab / Darah (Banyuurip)</button>
          <button type="button" class="ai-chip-btn" data-query="Butuh layanan persalinan atau UGD 24 jam malam ini">🚨 UGD 24 Jam &amp; Bersalin</button>
        </div>

        <form class="ai-chat-input-bar" id="aiChatForm">
          <input type="text" class="ai-chat-input" id="aiChatInput" placeholder="Ceritakan keluhanmu di sini dengan santai ya... 😊" autocomplete="off" />
          <button type="submit" class="ai-chat-send-btn" id="aiChatSendBtn" aria-label="Kirim pesan">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(root);

    widgetElement = document.getElementById('aiChatWindow');
    messagesContainer = document.getElementById('aiChatMessages');
    inputField = document.getElementById('aiChatInput');

    document.getElementById('aiFabBtn').addEventListener('click', toggle);
    document.getElementById('aiChatCloseBtn').addEventListener('click', close);

    const districtSelect = document.getElementById('aiDistrictSelect');
    if (districtSelect) {
      districtSelect.addEventListener('change', (e) => {
        updateLocationByDistrict(e.target.value);
      });
    }

    const gpsBtn = document.getElementById('aiGpsBtn');
    if (gpsBtn) {
      gpsBtn.addEventListener('click', () => {
        requestGeolocation();
      });
    }

    document.getElementById('aiChatForm').addEventListener('submit', (e) => {
      e.preventDefault();
      handleSend();
    });

    document.getElementById('aiQuickChips').addEventListener('click', (e) => {
      const chip = e.target.closest('.ai-chip-btn');
      if (chip && chip.dataset.query) {
        inputField.value = chip.dataset.query;
        handleSend();
      }
    });

    // Delegate booking CTA button clicks inside bot messages
    messagesContainer.addEventListener('click', (e) => {
      // 1. Direct booking with clinic + poli
      const clinicBtn = e.target.closest('.ai-booking-clinic-btn');
      if (clinicBtn) {
        const clinicId = clinicBtn.dataset.clinic;
        const poliName = clinicBtn.dataset.poli;
        close();
        if (typeof window.openBookingModalWithService === 'function') {
          window.openBookingModalWithService(poliName, clinicId);
        } else if (typeof window.openBookingWithClinic === 'function') {
          window.openBookingWithClinic(clinicId, poliName);
        } else {
          window.location.href = `pasien.html?clinic=${encodeURIComponent(clinicId)}&poli=${encodeURIComponent(poliName)}`;
        }
        return;
      }

      // 2. Generic booking with poli only
      const poliBtn = e.target.closest('.ai-booking-cta-btn');
      if (poliBtn && poliBtn.dataset.poli) {
        const poliName = poliBtn.dataset.poli;
        close();
        if (typeof window.openBookingModalWithService === 'function') {
          window.openBookingModalWithService(poliName);
        } else {
          window.location.href = `pasien.html?poli=${encodeURIComponent(poliName)}`;
        }
      }
    });
  };

  const open = () => {
    isOpen = true;
    if (widgetElement) {
      widgetElement.classList.add('is-open');
      widgetElement.setAttribute('aria-hidden', 'false');
      inputField?.focus();
    }
  };

  const close = () => {
    isOpen = false;
    if (widgetElement) {
      widgetElement.classList.remove('is-open');
      widgetElement.setAttribute('aria-hidden', 'true');
    }
  };

  const toggle = () => {
    if (isOpen) close();
    else open();
  };

  const appendUserMessage = (text) => {
    const el = document.createElement('div');
    el.className = 'ai-message user';
    el.textContent = text;
    messagesContainer.appendChild(el);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  };

  const appendBotMessage = (htmlContent, isEmergency = false, triageLevel = '') => {
    const el = document.createElement('div');
    el.className = `ai-message bot${isEmergency ? ' emergency' : ''}`;

    let badgeHtml = '';
    if (triageLevel) {
      let badgeClass = 'ringan';
      if (triageLevel.includes('UGD') || triageLevel.includes('Darurat')) badgeClass = 'darurat';
      else if (triageLevel.includes('Sedang')) badgeClass = 'sedang';
      badgeHtml = `<span class="ai-triage-badge ${badgeClass}">${triageLevel}</span>`;
    }

    el.innerHTML = `${badgeHtml}<div>${htmlContent}</div>`;
    messagesContainer.appendChild(el);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  };

  const showTypingIndicator = () => {
    const el = document.createElement('div');
    el.className = 'ai-typing-indicator';
    el.id = 'aiTypingIndicator';
    el.innerHTML = '<span class="ai-typing-dot"></span><span class="ai-typing-dot"></span><span class="ai-typing-dot"></span>';
    messagesContainer.appendChild(el);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  };

  const hideTypingIndicator = () => {
    const el = document.getElementById('aiTypingIndicator');
    if (el) el.remove();
  };

  const resolveClinicDetails = (clinicId) => {
    const clinics = (typeof window !== 'undefined' && window.clinicService?.clinics)
      ? window.clinicService.clinics
      : [
          { id: 'clinic-pwr-01', code: 'KLN-PWR-01', name: 'Klinik Pratama Sehat Mandiri Purworejo', district: 'Purworejo', latitude: -7.7144, longitude: 110.0125 },
          { id: 'clinic-pwr-02', code: 'KLN-PWR-02', name: 'Klinik Pratama & Bersalin Kutoarjo Medika', district: 'Kutoarjo', latitude: -7.7198, longitude: 109.9134 },
          { id: 'clinic-pwr-03', code: 'KLN-PWR-03', name: 'Klinik Pratama Keluarga Banyuurip', district: 'Banyuurip', latitude: -7.7420, longitude: 109.9985 }
        ];

    return clinics.find(c => c.id === clinicId || c.code === clinicId) || clinics[0];
  };

  const formatBotMarkdown = (text) => {
    if (!text) return '';
    let parsed = text
      .replace(/\[EMERGENCY_ALERT\]/g, '')
      // Parse [BOOK_CLINIC: "clinicId", "poliName"] into rich recommendation card
      .replace(/\[BOOK_CLINIC:\s*["']?([^"',\]]+)["']?,\s*["']?([^"'\]]+)["']?\]/g, (match, clinicId, poli) => {
        const clinic = resolveClinicDetails(clinicId.trim());
        let distKm = 0;
        if (typeof window !== 'undefined' && window.clinicService?.calculateDistanceKm && userLocation.latitude) {
          distKm = window.clinicService.calculateDistanceKm(userLocation.latitude, userLocation.longitude, clinic.latitude, clinic.longitude);
        }
        const queueCount = (clinic.id === 'clinic-pwr-02' || clinic.code === 'KLN-PWR-02') ? 5 : ((clinic.id === 'clinic-pwr-03' || clinic.code === 'KLN-PWR-03') ? 2 : 3);
        const waitEst = queueCount * 12;

        return `
          <div class="ai-clinic-recommend-card" id="aiClinicCard-${clinic.id}">
            <div class="ai-clinic-card-header">
              <span class="ai-clinic-badge">${clinic.code || 'KLINIK'}</span>
              <strong class="ai-clinic-card-name">${clinic.name}</strong>
            </div>
            <div class="ai-clinic-card-meta">
              <span class="ai-meta-item">📍 Kec. ${clinic.district} ${distKm > 0 ? `(~${distKm} km)` : '(Pusat)'}</span>
              <span class="ai-meta-item">⏳ Antrean: <strong>${queueCount} Pasien</strong> (~${waitEst} mnt)</span>
              <span class="ai-meta-item">🩺 Rekomendasi: <strong>${poli}</strong></span>
            </div>
            <button type="button" class="ai-booking-clinic-btn primary-button" data-clinic="${clinic.id}" data-poli="${poli}">
              📅 Daftar di Klinik Ini Sekarang &rarr;
            </button>
          </div>
        `;
      })
      // Parse legacy [BOOK_POLI: "poliName"]
      .replace(/\[BOOK_POLI:\s*["']?([^"'\]]+)["']?\]/g, (match, poli) => {
        return `<button type="button" class="ai-booking-cta-btn" data-poli="${poli}">📅 Jadwalkan Konsultasi di ${poli}</button>`;
      })
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n- /g, '<br>• ')
      .replace(/\n/g, '<br>');
    return parsed;
  };

  const handleSend = async () => {
    const query = inputField.value.trim();
    if (!query) return;

    // Detect mentioned district in query
    if (/kutoarjo/i.test(query)) {
      updateLocationByDistrict('kutoarjo');
    } else if (/banyuurip|banyu urip/i.test(query)) {
      updateLocationByDistrict('banyuurip');
    } else if (/purworejo/i.test(query)) {
      updateLocationByDistrict('purworejo');
    }

    inputField.value = '';
    appendUserMessage(query);
    showTypingIndicator();

    try {
      if (!window.aiService) {
        throw new Error('Layanan AI sedang memuat.');
      }

      const isSymptom = /sakit|nyeri|demam|batuk|pusing|mual|gejala|luka|ngilu|sesak|gigi|anak|kolesterol|tensi|urat|hamil|bidan|persalinan/i.test(query);

      if (isSymptom) {
        let services = [];
        if (window.appointmentService && typeof window.appointmentService.getServices === 'function') {
          try { services = await window.appointmentService.getServices(); } catch {}
        }

        let clinics = [];
        if (window.clinicService && typeof window.clinicService.getClinics === 'function') {
          try { clinics = await window.clinicService.getClinics(); } catch {}
        }

        const triage = await window.aiService.triagePatient(query, [], services, clinics, userLocation);
        hideTypingIndicator();
        appendBotMessage(formatBotMarkdown(triage.rawText), triage.isEmergency, triage.triageLevel);
      } else {
        const faqReply = await window.aiService.answerClinicFaq(query, {
          clinicName: 'SIMKLINIK Platform Multi-Klinik Purworejo',
          hours: 'Klinik Kota & Banyuurip: 08:00 - 21:00 WIB | Kutoarjo: UGD 24 Jam',
          bpjs: 'Melayani Pasien Umum dan BPJS Kesehatan Mandiri'
        });
        hideTypingIndicator();
        appendBotMessage(formatBotMarkdown(faqReply), false, '');
      }
    } catch (err) {
      hideTypingIndicator();
      const errDisplay = window.translateError ? window.translateError(err.message) : err.message;
      appendBotMessage(`Maaf, terjadi kendala: ${errDisplay}. Silakan coba beberapa saat lagi.`, false, '');
    }
  };

  // Auto-boot when DOM is ready
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  const widgetApi = { open, close, toggle, init, updateLocationByDistrict, getUserLocation: () => ({ ...userLocation }) };
  if (typeof window !== 'undefined') {
    window.aiChatWidget = widgetApi;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = widgetApi;
  }
})();
