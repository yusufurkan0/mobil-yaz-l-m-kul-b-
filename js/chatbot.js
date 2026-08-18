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
            background: #d9267a; /* Fallback solid color */
            background: linear-gradient(135deg, var(--primary), rgba(var(--primary-rgb), 0.8));
            box-shadow: 0 8px 32px rgba(var(--primary-rgb), 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #ffffff !important;
            font-size: 1.6rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .chatbot-toggle i {
            color: #ffffff !important;
        }
        .chatbot-toggle:hover {
            transform: scale(1.1) rotate(5deg);
            background: var(--primary);
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
            color: #ffffff !important;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            position: relative;
        }
        .chatbot-avatar i {
            color: #ffffff !important;
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
            color: #ffffff !important;
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
            color: #ffffff !important;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.95rem;
            transition: all 0.2s ease;
        }
        .chatbot-send-btn i {
            color: #ffffff !important;
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
            const { text: botResponse, action } = generateBotResponse(text);
            appendMessage(botResponse, 'bot');
            
            // Execute page scroll or modal triggers if any
            if (action) {
                setTimeout(() => {
                    triggerPageAction(action);
                }, 500);
            }
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

    // Page action driver: scrolls to relevant sections or launches interactive workflows
    function triggerPageAction(category) {
        const isHomepage = window.location.pathname === '/' || window.location.pathname.endsWith('index.html') || window.location.pathname === '';
        
        if (category === 'tüzük') {
            if (isHomepage) {
                const regEl = document.getElementById('regulations');
                if (regEl) regEl.scrollIntoView({ behavior: 'smooth' });
            } else {
                window.location.href = 'index.html#regulations';
            }
        } else if (category === 'yönetim') {
            if (isHomepage) {
                const boardEl = document.getElementById('board');
                if (boardEl) boardEl.scrollIntoView({ behavior: 'smooth' });
            } else {
                window.location.href = 'index.html#board';
            }
        } else if (category === 'hakkımızda') {
            if (isHomepage) {
                const aboutEl = document.getElementById('about');
                if (aboutEl) aboutEl.scrollIntoView({ behavior: 'smooth' });
            } else {
                window.location.href = 'index.html#about';
            }
        } else if (category === 'sponsor') {
            if (isHomepage) {
                const spEl = document.getElementById('sponsors');
                if (spEl) spEl.scrollIntoView({ behavior: 'smooth' });
            } else {
                window.location.href = 'index.html#sponsors';
            }
        } else if (category === 'kayıt') {
            if (isHomepage) {
                const regHero = document.getElementById('register-trigger-hero');
                if (regHero) regHero.click();
            } else {
                window.location.href = 'index.html';
            }
        } else if (category === 'giriş') {
            const loginTrig = document.getElementById('login-trigger');
            if (loginTrig) loginTrig.click();
        } else if (category === 'iletişim') {
            if (window.location.pathname.endsWith('iletisim.html')) {
                const footer = document.querySelector('footer');
                if (footer) footer.scrollIntoView({ behavior: 'smooth' });
            } else {
                window.location.href = 'iletisim.html';
            }
        }
    }

    // 4. Smart Local AI Bot Response Logic with Page Redirection Hooks
    function generateBotResponse(input) {
        const query = input.toLowerCase();

        // Helper to check keywords
        const contains = (words) => words.some(word => query.includes(word));

        // 1. Tüzük Maddeleri
        if (contains(['madde 1', 'madde bir', '1. madde'])) {
            return {
                text: "<b>Madde 1 (Kuruluş ve Amaç):</b> Topluluğun amacı, İstanbul Gedik Üniversitesi öğrencilerine mobil yazılım alanlarında teorik eğitimler vermek, pratik projeler geliştirmek ve öğrencileri teknoloji ekosistemine hazırlamaktır. Seni şimdi tüzük bölümüne kaydırıyorum.",
                action: 'tüzük'
            };
        }
        if (contains(['madde 2', 'madde iki', '2. madde'])) {
            return {
                text: "<b>Madde 2 (Üyelik ve Katılım):</b> Topluluğa üye olmak tamamen ücretsizdir. Mobil uygulama geliştirmeye ve tasarıma ilgi duyan tüm Gedik Üniversitesi öğrencileri katılabilir. Seni şimdi tüzük bölümüne kaydırıyorum.",
                action: 'tüzük'
            };
        }
        if (contains(['madde 3', 'madde üç', '3. madde'])) {
            return {
                text: "<b>Madde 3 (Proje ve Eğitim Esasları):</b> Eğitimler açık kaynaklı ve paylaşımcı kültür esasına göre yürütülür. Çalışma grupları kurularak Google Play ve App Store'a uygulamalar yüklenir. Seni şimdi tüzük bölümüne kaydırıyorum.",
                action: 'tüzük'
            };
        }
        if (contains(['madde 4', 'madde dört', '4. madde'])) {
            return {
                text: "<b>Madde 4 (Yönetim ve Temsil):</b> Yönetim kurulu; kulüp başkanı ve koordinatörlerden oluşur. Üniversite içindeki etkinlik planlamaları yönetim kurulu tarafından kararlaştırılır. Seni şimdi tüzük bölümüne kaydırıyorum.",
                action: 'tüzük'
            };
        }
        if (contains(['tüzük', 'tuzuk', 'kural', 'ilkeler', 'madde', 'tüzüğü'])) {
            return {
                text: "Gedik MYGK Resmi Tüzüğü 4 ana maddeden oluşur: Amaç, Üyelik, Eğitim ve Yönetim ilkeleri. Seni hemen sayfanın <b>Kulüp Tüzüğü</b> (Kurallar ve İlkeler) bölümüne yönlendiriyorum.",
                action: 'tüzük'
            };
        }

        // 2. Üyelik ve Kayıt
        if (contains(['üye', 'kayıt', 'nasıl katılırım', 'katılmak', 'başvuru', 'form', 'başvurusu'])) {
            return {
                text: "Kulübümüze katılım tamamen ücretsizdir! Seni şimdi ana sayfadaki <b>Topluluğa Katıl / Kayıt Ol</b> başvuru formuna yönlendiriyorum.",
                action: 'kayıt'
            };
        }

        // 3. Giriş ve Admin
        if (contains(['giriş', 'giriş yap', 'oturum', 'admin', 'yönetici'])) {
            return {
                text: "Hesabınıza girmek veya Yönetici Paneline erişmek için seni <b>Giriş Yap</b> formuna yönlendiriyorum.",
                action: 'giriş'
            };
        }

        // 4. Yönetim Kurulu
        if (contains(['başkan', 'kurucu', 'yönetim', 'ekip', 'burak', 'yusuf', 'furkan', 'selin', 'koordinatör'])) {
            return {
                text: "Kulübümüzün Başkanı <b>Burak Kaya</b>'dır. Başkan Yardımcılarımız ise <b>Yusuf Furkan Gelişin</b> ve <b>Selin Durdu</b>'dur. Seni şimdi <b>Yönetim Kurulu (Kulüp Ekibimiz)</b> bölümüne kaydırıyorum.",
                action: 'yönetim'
            };
        }

        // 5. Hakkımızda & Vizyon
        if (contains(['hakkında', 'hakkımızda', 'vizyon', 'misyon', 'biz kimiz', 'amaç'])) {
            return {
                text: "Mobil Yazılım Kulübü, geleceğin mobil uygulama ekosistemini inşa edecek geliştiricileri ve tasarımcıları bir araya getiren dinamik bir öğrenci topluluğudur. Seni hemen <b>Vizyonumuz ve Amacımız</b> bölümüne kaydırıyorum.",
                action: 'hakkımızda'
            };
        }

        // 6. Sponsorlar
        if (contains(['sponsor', 'sponsorship', 'destek', 'ortak'])) {
            return {
                text: "Kulübümüzün sponsorları ve iş birliği ortakları hakkında bilgi almak için seni <b>Sponsorlarımız</b> bölümüne kaydırıyorum.",
                action: 'sponsor'
            };
        }

        // 7. İletişim & Konum
        if (contains(['iletişim', 'adres', 'nerede', 'ulaşım', 'konum', 'yerleşke', 'mail', 'eposta'])) {
            return {
                text: "Kulübümüz İstanbul Gedik Üniversitesi Kartal Yerleşkesindedir. E-posta: <b>gedikmobilyazilimkulubu@gmail.com</b>. Seni detaylı adres ve form için <b>İletişim</b> sayfasına yönlendiriyorum.",
                action: 'iletişim'
            };
        }

        // 8. Eğitim & Etkinlikler
        if (contains(['etkinlik', 'eğitim', 'workshop', 'ders', 'kurs', 'seminer', 'aktivite'])) {
            return {
                text: "Kulübümüzde mobil uygulama geliştirme atölyeleri, kodlama eğitimleri ve hackathon çalışmaları düzenlenmektedir. Güncel tüm etkinliklerimizi incelemek için <a href='etkinlikler.html'>Etkinlikler</a> sayfamıza gidebilirsin.",
                action: null
            };
        }

        // 9. Blog ve Duyurular
        if (contains(['blog', 'yazı', 'kaynak', 'makale'])) {
            return {
                text: "Üyelerimizin ve yönetim ekibimizin mobil yazılım dünyası hakkında paylaştığı en son makaleleri <a href='blog.html'>Blog</a> sayfamızdan okuyabilirsin.",
                action: null
            };
        }
        if (contains(['duyuru', 'haber', 'ilan'])) {
            return {
                text: "Kulübümüzle ilgili en güncel duyuru ve haberlere <a href='duyurular.html'>Duyurular</a> sayfasından erişebilirsin.",
                action: null
            };
        }

        // 10. Greeting & Politeness
        if (contains(['merhaba', 'selam', 'hey', 'naber', 'günaydın', 'tünaydın', 'salam'])) {
            return {
                text: "Merhaba! Ben Gedik MYGK Asistanıyım. Kulübümüz, eğitimlerimiz veya üyelik başvuruları hakkında sana bilgi verebilirim. Nasıl yardımcı olabilirim?",
                action: null
            };
        }
        if (contains(['teşekkür', 'sağol', 'teşekkürler', 'eyvallah', 'ok', 'tamam'])) {
            return {
                text: "Rica ederim! Yardımcı olabildiysem ne mutlu. Gedik MYGK hakkında sormak istediğin başka bir soru olursa her zaman buradayım.",
                action: null
            };
        }

        // Fallback response
        return {
            text: "Bu konuda tam bilgim yok ama istersen doğrudan iletişim formunu kullanarak veya <b>gedikmobilyazilimkulubu@gmail.com</b> e-posta adresinden yönetim ekibimize sorularını iletebilirsin. Sana başka bir konuda yardımcı olabilir miyim?",
            action: null
        };
    }
})();
