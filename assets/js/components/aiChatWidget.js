// ====================================================================
// Widget Controller Floating Chatbot Nayla - SIMKLINIK Purworejo
// ====================================================================

function initAiChatWidget() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('ai-chat-launcher')) return; // Hindari duplikasi

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
          <div class="ai-status">🟢 Online (Gemini 2.0 Flash)</div>
        </div>
      </div>
      <button type="button" class="ai-close-btn" id="ai-chat-close">&times;</button>
    </div>
    <div class="ai-chat-body" id="ai-chat-messages">
      <div class="ai-bubble ai-bubble-bot">
        Halo! Saya <strong>Sasa (Sahabat Asisten Sehat Anda)</strong>, asisten virtual SIMKLINIK Purworejo. 
        Ceritakan keluhan Anda, saya dapat merekomendasikan klinik dan dokter terdekat di Purworejo dengan memantau antrean dan kuota secara langsung.
      </div>
    </div>
    <form class="ai-chat-footer" id="ai-chat-form">
      <input type="text" class="ai-chat-input" id="ai-chat-input" placeholder="Ketik keluhan (cth: anak demam di Kutoarjo)..." required autocomplete="off">
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

    // Loading indicator
    const botLoading = document.createElement('div');
    botLoading.className = 'ai-bubble ai-bubble-bot';
    botLoading.innerHTML = '<em>Sasa sedang menganalisis data faskes Purworejo...</em>';
    msgBox.appendChild(botLoading);
    msgBox.scrollTop = msgBox.scrollHeight;

    // Panggil Service AI
    const askFn = window.askSasaAi || window.askNaylaAi;
    const result = await askFn(msg);
    botLoading.remove();

    const botBubble = document.createElement('div');
    botBubble.className = 'ai-bubble ai-bubble-bot';
    botBubble.innerHTML = `<div>${result.cleanText}</div>`;

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
