/**
 * SIMKLINIK - AI Patient Chat Widget Component (Sasa)
 * Handles Smart Triage, FAQ queries, and [BOOK_POLI] action shortcuts.
 */
(() => {
  'use strict';

  let widgetElement = null;
  let messagesContainer = null;
  let inputField = null;
  let isOpen = false;

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
              <strong>Sasa — Asisten Cerdas SIMKLINIK</strong>
              <small>😊 Ceria, Ramah &amp; Siap Membantu ✨</small>
            </div>
          </div>
          <button class="ai-chat-close-btn" id="aiChatCloseBtn" aria-label="Tutup obrolan">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </header>

        <div class="ai-disclaimer-bar">
          ⚠️ Panduan awal edukatif, bukan diagnosis final dokter. Kondisi darurat? Segera ke UGD/hubungi 119.
        </div>

        <div class="ai-chat-messages" id="aiChatMessages">
          <div class="ai-message bot">
            Halo Sahabat Sehat SIMKLINIK! Senang sekali bisa menyapa kamu hari ini! 😊✨ Saya <strong>Sasa</strong> (<em>Sistem Asisten Skrining &amp; Anamnesis</em>), asisten cerdas yang selalu ceria dan siap nemenin kamu dengan penuh semangat! 🌟<br><br>Ada keluhan kesehatan yang sedang dirasakan, atau ada yang ingin ditanyakan seputar SIMKLINIK? Yuk, ceritakan ke Sasa dengan santai ya! 🩺💖
          </div>
        </div>

        <div class="ai-quick-chips" id="aiQuickChips">
          <button type="button" class="ai-chip-btn" data-query="Tenggorokan sakit dan demam sudah 3 hari">🤒 Cek Sakit Tenggorokan</button>
          <button type="button" class="ai-chip-btn" data-query="Jadwal dokter hari ini di SIMKLINIK">📅 Jadwal Dokter Hari Ini</button>
          <button type="button" class="ai-chip-btn" data-query="Bagaimana alur pendaftaran BPJS Kesehatan?">🏥 Alur Pasien BPJS</button>
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
      const btn = e.target.closest('.ai-booking-cta-btn');
      if (btn && btn.dataset.poli) {
        const poliName = btn.dataset.poli;
        close();
        if (typeof window.openBookingModalWithService === 'function') {
          window.openBookingModalWithService(poliName);
        } else {
          // If on landing page, redirect to pasien.html
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

  const formatBotMarkdown = (text) => {
    if (!text) return '';
    let parsed = text
      .replace(/\[EMERGENCY_ALERT\]/g, '')
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

    inputField.value = '';
    appendUserMessage(query);
    showTypingIndicator();

    try {
      if (!window.aiService) {
        throw new Error('Layanan AI sedang memuat.');
      }

      // Check if it's medical symptoms or FAQ
      const isSymptom = /sakit|nyeri|demam|batuk|pusing|mual|gejala|luka|ngilu|sesak/i.test(query);

      if (isSymptom) {
        let services = [];
        if (window.appointmentService && typeof window.appointmentService.getServices === 'function') {
          try { services = await window.appointmentService.getServices(); } catch {}
        }
        const triage = await window.aiService.triagePatient(query, [], services);
        hideTypingIndicator();
        appendBotMessage(formatBotMarkdown(triage.rawText), triage.isEmergency, triage.triageLevel);
      } else {
        const faqReply = await window.aiService.answerClinicFaq(query, {
          clinicName: 'SIMKLINIK',
          hours: 'Senin - Sabtu: 08:00 - 21:00 WIB',
          bpjs: 'Melayani BPJS Kesehatan faskes primer'
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

  const widgetApi = { open, close, toggle, init };
  if (typeof window !== 'undefined') {
    window.aiChatWidget = widgetApi;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = widgetApi;
  }
})();
