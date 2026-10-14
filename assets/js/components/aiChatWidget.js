// ====================================================================
// Widget Controller Floating Chatbot Sasa - SIMKLINIK Purworejo
// ====================================================================

function formatAiMessage(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

function initAiChatWidget() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('ai-chat-launcher')) return; // Hindari duplikasi

  const chatHistory = [];

  // 1. Buat tombol launcher mengambang
  const launcher = document.createElement('button');
  launcher.id = 'ai-chat-launcher';
  launcher.className = 'ai-chat-launcher';
  launcher.setAttribute('aria-label', 'Buka Konsultasi Sasa AI Purworejo');
  launcher.innerHTML = '🤖';

  // 2. Buat container drawer
  const drawer = document.createElement('div');
  drawer.id = 'ai-chat-drawer';
  drawer.className = 'ai-chat-drawer';
  drawer.innerHTML = `
    <div class="ai-chat-header">
      <div class="ai-header-info">
        <div class="ai-avatar">👩‍⚕️</div>
        <div>
          <div class="ai-title">Sasa — Sahabat Asisten Sehat Anda</div>
          <div class="ai-status" id="ai-chat-status">🟢 Online (Gemini 2.0 Flash)</div>
        </div>
      </div>
      <div style="display: flex; gap: 4px; align-items: center;">
        <button type="button" class="ai-key-btn" id="ai-chat-key" title="Atur Gemini API Key (Opsional)" style="background:none;border:none;color:white;cursor:pointer;font-size:1.1rem;padding:2px 6px;line-height:1;">⚙️</button>
        <button type="button" class="ai-close-btn" id="ai-chat-close" style="line-height:1;">&times;</button>
      </div>
    </div>
    <div class="ai-chat-body" id="ai-chat-messages">
      <div class="ai-bubble ai-bubble-bot">
        Halo! Saya <strong>Sasa (Sahabat Asisten Sehat Anda)</strong>, asisten virtual SIMKLINIK Purworejo. 
        Ceritakan keluhan Anda, tanyakan faskes dan jadwal dokter di Purworejo, atau diskusikan seputar kesehatan Anda secara santai. Saya siap mendengarkan!
      </div>
    </div>
    <form class="ai-chat-footer" id="ai-chat-form">
      <input type="text" class="ai-chat-input" id="ai-chat-input" placeholder="Tanya Sasa (cth: anak demam di Kutoarjo, atau konsultasi santai)..." required autocomplete="off">
      <button type="submit" class="ai-send-btn">Kirim</button>
    </form>
  `;

  document.body.appendChild(launcher);
  document.body.appendChild(drawer);

  // Toggle drawer
  launcher.addEventListener('click', () => {
    drawer.classList.toggle('active');
    if (drawer.classList.contains('active')) {
      document.getElementById('ai-chat-input').focus();
    }
  });

  document.getElementById('ai-chat-close').addEventListener('click', () => {
    drawer.classList.remove('active');
  });

  // Konfigurasi Gemini API Key langsung dari UI
  const keyBtn = document.getElementById('ai-chat-key');
  if (keyBtn) {
    keyBtn.addEventListener('click', () => {
      const existing = (typeof window !== 'undefined' && window.localStorage?.getItem('simklinik_gemini_api_key')) || '';
      const input = prompt('Masukkan Google Gemini API Key Anda (opsional, tersimpan lokal di browser Anda untuk konsultasi cloud langsung):', existing);
      if (input !== null) {
        const trimmed = input.trim();
        if (trimmed) {
          window.localStorage?.setItem('simklinik_gemini_api_key', trimmed);
          window.localStorage?.setItem('gemini_api_key', trimmed);
          if (window.GEMINI_CONFIG) window.GEMINI_CONFIG.apiKey = trimmed;
          document.getElementById('ai-chat-status').textContent = '🟢 Online (Gemini Cloud Aktif)';
          alert('API Key berhasil disimpan! Sasa kini terhubung langsung dengan Gemini 2.0 Flash Cloud.');
        } else {
          window.localStorage?.removeItem('simklinik_gemini_api_key');
          window.localStorage?.removeItem('gemini_api_key');
          if (window.GEMINI_CONFIG) window.GEMINI_CONFIG.apiKey = '';
          document.getElementById('ai-chat-status').textContent = '🟢 Online (Gemini 2.0 Flash)';
          alert('API Key dihapus. Sasa beralih ke Mode Asisten Cerdas Lokal.');
        }
      }
    });
  }

  // Kirim pesan
  document.getElementById('ai-chat-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('ai-chat-input');
    const msg = input.value.trim();
    if (!msg) return;

    input.value = '';
    const msgBox = document.getElementById('ai-chat-messages');

    // Tampilkan pesan pengguna
    const userBubble = document.createElement('div');
    userBubble.className = 'ai-bubble ai-bubble-user';
    userBubble.textContent = msg;
    msgBox.appendChild(userBubble);
    msgBox.scrollTop = msgBox.scrollHeight;

    // Catat ke riwayat percakapan
    chatHistory.push({ role: 'user', text: msg });

    // Loading indicator
    const botLoading = document.createElement('div');
    botLoading.className = 'ai-bubble ai-bubble-bot';
    botLoading.innerHTML = '<em>Sasa sedang memproses...</em>';
    msgBox.appendChild(botLoading);
    msgBox.scrollTop = msgBox.scrollHeight;

    // Siapkan context percakapan multi-turn
    const context = {
      history: chatHistory.slice(-10)
    };

    // Panggil Service AI
    const askFn = window.askSasaAi || window.askNaylaAi;
    const result = await askFn(msg, context);
    botLoading.remove();

    // Catat respons bot ke riwayat percakapan
    chatHistory.push({ role: 'model', text: result.cleanText });

    const botBubble = document.createElement('div');
    botBubble.className = 'ai-bubble ai-bubble-bot';
    botBubble.innerHTML = `<div>${formatAiMessage(result.cleanText)}</div>`;

    if (result.hasAction && result.clinicId) {
      const actionBtn = document.createElement('button');
      actionBtn.className = 'btn-ai-action';
      actionBtn.textContent = '📅 Buat Janji di Klinik Ini';
      actionBtn.onclick = () => {
        if (typeof window.openBookingModal === 'function') {
          window.openBookingModal(result.clinicId);
          drawer.classList.remove('active');
        } else {
          window.location.href = `pasien.html`;
        }
      };
      botBubble.appendChild(actionBtn);
    }

    msgBox.appendChild(botBubble);
    msgBox.scrollTop = msgBox.scrollHeight;
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAiChatWidget);
  } else {
    initAiChatWidget();
  }
}

if (typeof window !== 'undefined') {
  window.initAiChatWidget = initAiChatWidget;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initAiChatWidget
  };
}
