/* ==========================================================
   GEDIK MYGK - AI CHATBOX ASSISTANT WIDGET
   ==========================================================
   Generates a floating premium glassmorphism AI chat widget
   loaded dynamically across all pages.
*/

(function() {
    // 1. Inject Styles
    const style = document.createElement('style');
    style.innerHTML = `
        /* Floating Chat Button */
        .chatbot-toggle {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--primary), var(--primary-hover));
            box-shadow: 0 8px 32px rgba(var(--primary-rgb), 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #ffffff;
            font-size: 1.6rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .chatbot-toggle:hover {
            transform: scale(1.1) rotate(5deg);
            box-shadow: 0 12px 40px rgba(var(--primary-rgb), 0.5);
        }
        .chatbot-toggle .fa-xmark {
            display: none;
        }
        .chatbot-toggle.open .fa-comments {
            display: none;
        }
        .chatbot-toggle.open .fa-xmark {
            display: block;
            font-size: 1.4rem;
        }

        /* Chat Window */
        .chatbot-window {
            position: fixed;
            bottom: 105px;
            right: 30px;
            width: 380px;
            height: 520px;
            max-height: calc(100vh - 140px);
            border-radius: 16px;
            background: var(--bg-card);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid var(--border-color);
            box-shadow: var(--card-shadow);
            z-index: 999998;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transform: translateY(30px) scale(0.95);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        .chatbot-window.open {
            transform: translateY(0) scale(1);
            opacity: 1;
            visibility: visible;
        }

        /* Chat Header */
        .chatbot-header {
            padding: 16px 20px;
            background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.15), rgba(var(--primary-rgb), 0.05));
            border-bottom: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .chatbot-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: var(--primary);
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            position: relative;
        }
        .chatbot-avatar::after {
            content: '';
            position: absolute;
            bottom: 1px;
            right: 1px;
            width: 9px;
            height: 9px;
            border-radius: 50%;
            background: #10b981;
            border: 2px solid var(--bg-card);
        }
        .chatbot-header-info {
            flex-grow: 1;
        }
        .chatbot-header-title {
            font-family: 'Space Grotesk', sans-serif;
            font-weight: 700;
            font-size: 0.95rem;
            color: var(--headings-color);
            margin: 0;
        }
        .chatbot-header-status {
            font-size: 0.75rem;
            color: var(--text-muted);
            margin: 0;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        /* Chat Messages */
        .chatbot-messages {
            flex-grow: 1;
            padding: 20px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 15px;
            scroll-behavior: smooth;
        }
        .chatbot-msg {
            max-width: 80%;
            padding: 12px 16px;
            border-radius: 14px;
            font-size: 0.85rem;
            line-height: 1.45;
            word-wrap: break-word;
        }
        .chatbot-msg.bot {
            align-self: flex-start;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--border-color);
            color: var(--text-color);
            border-top-left-radius: 2px;
        }
        /* Override light theme bot msg background */
        body:not(.dark-theme) .chatbot-msg.bot {
            background: #f8fafc;
        }
        .chatbot-msg.user {
            align-self: flex-end;
            background: var(--primary);
            color: #ffffff;
            border-top-right-radius: 2px;
            box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.15);
        }
        .chatbot-msg.bot a {
            color: var(--primary);
            text-decoration: underline;
            font-weight: 600;
        }

        /* Typing Indicator */
        .chatbot-typing {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 12px 16px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--border-color);
            border-radius: 14px;
            border-top-left-radius: 2px;
            width: fit-content;
            align-self: flex-start;
        }
        body:not(.dark-theme) .chatbot-typing {
            background: #f8fafc;
        }
        .chatbot-typing span {
            width: 6px;
            height: 6px;
            background: var(--text-muted);
            border-radius: 50%;
            display: inline-block;
            animation: chatbot-bounce 1.3s infinite ease-in-out;
        }
        .chatbot-typing span:nth-child(2) { animation-delay: 0.2s; }
        .chatbot-typing span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes chatbot-bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }

        /* Chat Input Area */
        .chatbot-input-container {
            padding: 14px 20px;
            border-top: 1px solid var(--border-color);
            display: flex;
            gap: 10px;
            background: rgba(255, 255, 255, 0.01);
            align-items: center;
        }
        .chatbot-input {
            flex-grow: 1;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--border-color);
            border-radius: 24px;
            padding: 10px 18px;
            font-size: 0.85rem;
            color: var(--text-color);
            outline: none;
            transition: border-color 0.2s ease;
        }
        body:not(.dark-theme) .chatbot-input {
            background: #ffffff;
        }
        .chatbot-input:focus {
            border-color: var(--primary);
        }
        .chatbot-send-btn {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: var(--primary);
            color: #ffffff;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.95rem;
            transition: all 0.2s ease;
        }
        .chatbot-send-btn:hover {
            transform: scale(1.05);
            background: var(--primary-hover);
        }

        /* Responsiveness */
        @media (max-width: 480px) {
            .chatbot-window {
                bottom: 85px;
                right: 15px;
                left: 15px;
                width: auto;
                height: 480px;
            }
            .chatbot-toggle {
                bottom: 15px;
                right: 15px;
                width: 55px;
                height: 55px;
            }
        }
    `;
    document.head.appendChild(style);

    // 2. Inject HTML Elements
    const chatContainer = document.createElement('div');
    chatContainer.innerHTML = `
        <button id="chatbot-toggle" class="chatbot-toggle" aria-label="Asistanı Aç">
            <i class="fa-solid fa-comments"></i>
            <i class="fa-solid fa-xmark"></i>
        </button>
        <div id="chatbot-window" class="chatbot-window">
            <div class="chatbot-header">
                <div class="chatbot-avatar">
                    <i class="fa-solid fa-robot"></i>
                </div>
                <div class="chatbot-header-info">
                    <h4 class="chatbot-header-title">MYGK Asistan</h4>
                    <p class="chatbot-header-status">
                        <span style="display:inline-block; width:6px; height:6px; background:#10b981; border-radius:50%;"></span>
                        Çevrimiçi · Yapay Zeka
                    </p>
                </div>
            </div>
            <div id="chatbot-messages" class="chatbot-messages">
                <div class="chatbot-msg bot">
                    Merhaba! Ben MYGK Yapay Zeka Asistanı. Gedik Üniversitesi Mobil Yazılım Geliştirme Kulübü, eğitimlerimiz, üyelik veya yönetim ekibimiz hakkında merak ettiğin her şeyi bana sorabilirsin. Sana nasıl yardımcı olabilirim? 😊
                </div>
            </div>
            <div class="chatbot-input-container">
                <input type="text" id="chatbot-input" class="chatbot-input" placeholder="Bir mesaj yazın..." autocomplete="off">
                <button id="chatbot-send-btn" class="chatbot-send-btn" aria-label="Gönder">
                    <i class="fa-solid fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(chatContainer);

    // 3. UI Interactions
    const toggleBtn = document.getElementById('chatbot-toggle');
    const chatWindow = document.getElementById('chatbot-window');
    const chatInput = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send-btn');
    const msgContainer = document.getElementById('chatbot-messages');

    if (!toggleBtn || !chatWindow || !chatInput || !sendBtn || !msgContainer) return;

    toggleBtn.addEventListener('click', () => {
        chatWindow.classList.toggle('open');
        toggleBtn.classList.toggle('open');
        if (chatWindow.classList.contains('open')) {
            chatInput.focus();
        }
    });

    // Send Message Trigger
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        // Render User Message
        appendMessage(text, 'user');
        chatInput.value = '';

        // Render Bot Typing Animation
        const typingId = showTypingIndicator();

        // Simulate thinking delay (1s - 1.5s)
        setTimeout(() => {
            removeTypingIndicator(typingId);
            const botResponse = generateBotResponse(text);
            appendMessage(botResponse, 'bot');
        }, 1000 + Math.random() * 500);
    }

    function appendMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chatbot-msg ${sender}`;
        msgDiv.innerHTML = text;
        msgContainer.appendChild(msgDiv);
        msgContainer.scrollTop = msgContainer.scrollHeight;
    }

    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chatbot-typing';
        typingDiv.id = 'chatbot-typing-indicator';
        typingDiv.innerHTML = '<span></span><span></span><span></span>';
        msgContainer.appendChild(typingDiv);
        msgContainer.scrollTop = msgContainer.scrollHeight;
        return typingDiv.id;
    }

    function removeTypingIndicator(id) {
        const element = document.getElementById(id);
        if (element) {
            element.remove();
        }
    }

    // 4. Smart Local AI Bot Response Logic
    function generateBotResponse(input) {
        const query = input.toLowerCase();

        // Helper to check keywords
        const contains = (words) => words.some(word => query.includes(word));

        if (contains(['merhaba', 'selam', 'hey', 'naber', 'günaydın', 'tünaydın', 'salam'])) {
            return "Merhaba! Ben Gedik MYGK Asistanıyım. Kulübümüz, eğitimlerimiz veya üyelik başvuruları hakkında sana bilgi verebilirim. Nasıl yardımcı olabilirim?";
        }

        if (contains(['üye', 'kayıt', 'nasıl katılırım', 'katılmak', 'başvuru', 'form', 'başvurusu'])) {
            return "Kulübümüze üye olmak tamamen ücretsizdir! Ana sayfadaki <b>'Topluluğa Katıl'</b> butonuna tıklayarak veya sağ üstteki <b>'Kayıt Ol'</b> seçeneğinden başvuru formunu doldurabilirsiniz. Başvurunuz yönetim kurulumuz tarafından onaylandıktan sonra profilinize giriş yapabilirsiniz.";
        }

        if (contains(['etkinlik', 'eğitim', 'workshop', 'ders', 'kurs', 'seminer', 'aktivite'])) {
            return "Kulübümüzde mobil uygulama geliştirme atölyeleri, kodlama eğitimleri ve hackathon çalışmaları düzenlenmektedir. Güncel ve geçmiş tüm etkinliklerimizi menüden <a href='etkinlikler.html'>Etkinlikler</a> sayfamıza giderek inceleyebilirsiniz.";
        }

        if (contains(['kim', 'kurucu', 'başkan', 'yönetim', 'ekip', 'üyeleri', 'yönetici'])) {
            return "Kulübümüzün Başkanı <b>Burak Kaya</b>'dır. Başkan Yardımcılarımız ise <b>Yusuf Furkan Gelişin</b> ve <b>Selin Durdu</b>'dur. Yönetim ekibimiz ve tüzüğümüz hakkında detaylı bilgiyi ana sayfadaki <b>'Yönetim Kurulu'</b> bölümünde bulabilirsiniz.";
        }

        if (contains(['iletişim', 'adres', 'nerede', 'ulaşım', 'instagram', 'mail', 'eposta', 'konum', 'yerleşke'])) {
            return "Bize aşağıdaki kanallardan ulaşabilirsiniz:<br><br>📧 <b>E-posta:</b> gedikmobilyazilimkulubu@gmail.com<br>📸 <b>Instagram:</b> <a href='https://www.instagram.com/gedikmygk' target='_blank'>@gedikmygk</a><br>📍 <b>Konum:</b> İstanbul Gedik Üniversitesi Kartal Yerleşkesi.";
        }

        if (contains(['tüzük', 'kural', 'amaç', 'misyon', 'vizyon'])) {
            return "Gedik MYGK'nin temel amacı, üniversitemiz bünyesindeki öğrencileri mobil yazılım ve arayüz tasarımı alanlarında eğitmek, ortak projeler geliştirerek Google Play ve App Store platformlarında yayınlamaktır. Eğitimler tamamen ücretsiz ve paylaşım esasına dayanır.";
        }

        if (contains(['teşekkür', 'sağol', 'teşekkürler', 'eyvallah', 'ok', 'tamam'])) {
            return "Rica ederim! Yardımcı olabildiysem ne mutlu. Gedik MYGK hakkında sormak istediğin başka bir soru olursa her zaman buradayım.";
        }

        if (contains(['ios', 'kotlin', 'swift', 'android', 'flutter', 'react'])) {
            return "Kulübümüzde genel mobil uygulama geliştirme teorisine, arayüz tasarımlarına ve uygulama yayınlama süreçlerine odaklanıyoruz. Herhangi bir platform ayrımı gözetmeksizin tüm mobil ekosistemi hedefliyoruz.";
        }

        if (contains(['blog', 'yazı', 'kaynak', 'makale'])) {
            return "Üyelerimizin ve yönetim ekibimizin mobil yazılım dünyası hakkında paylaştığı en son makaleleri, ipuçlarını ve kaynak tavsiyelerini <a href='blog.html'>Blog</a> sayfamızdan okuyabilirsiniz.";
        }

        if (contains(['duyuru', 'haber', 'ilan'])) {
            return "Kulübümüzle ilgili en güncel duyuru ve haberlere menüdeki <a href='duyurular.html'>Duyurular</a> sayfasından erişebilirsiniz.";
        }

        // Fallback
        return "Bu konuda kesin bir bilgim yok ama istersen doğrudan iletişim formunu kullanarak veya <b>gedikmobilyazilimkulubu@gmail.com</b> e-posta adresinden yönetim ekibimize sorularını iletebilirsin. Sana başka bir konuda yardımcı olabilir miyim?";
    }
})();
