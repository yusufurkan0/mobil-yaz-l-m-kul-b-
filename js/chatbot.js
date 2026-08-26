/* ==========================================================
   GEDIK MYGK - AI CHATBOX ASSISTANT WIDGET (SECURE & AI ENHANCED)
   ==========================================================
   Floating glassmorphism AI chat widget with:
   1. AI Security Vulnerability Guardrails (XSS, Prompt Injection, Rate Limiting)
   2. 30 Q&A Semantic / Fuzzy Matching Database
   3. Dynamic Page Redirection & Action Triggers
   ==========================================================
*/

(function() {
    // ==========================================================
    // 1. SECURITY & VULNERABILITY GUARDRAILS
    // ==========================================================

    // XSS Sanitizer helper
    function escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Rate Limiter: Max 4 messages per 6 seconds
    const RateLimiter = {
        timestamps: [],
        maxLimit: 4,
        timeWindowMs: 6000,
        minDelayMs: 600,
        lastMsgTime: 0,

        canSend: function() {
            const now = Date.now();
            if (now - this.lastMsgTime < this.minDelayMs) {
                return { allowed: false, reason: "Lütfen mesajlar arasında biraz bekleyin." };
            }
            this.timestamps = this.timestamps.filter(t => now - t < this.timeWindowMs);
            if (this.timestamps.length >= this.maxLimit) {
                return { allowed: false, reason: "Çok hızlı mesaj gönderiyorsunuz. Lütfen birkaç saniye bekleyin." };
            }
            this.timestamps.push(now);
            this.lastMsgTime = now;
            return { allowed: true };
        }
    };

    // Prompt Injection & Malicious Pattern Detector
    function checkSecurityVulnerabilities(input) {
        const lower = input.toLowerCase();

        // 1. Input length limit (Max 300 characters)
        if (input.length > 300) {
            return {
                safe: false,
                reason: "🛡️ <b>Güvenlik Uyarısı:</b> Mesajınız maksimum 300 karakter sınırını aşıyor."
            };
        }

        // 2. Script / HTML Enjeksiyon Koruması
        const scriptPatterns = [
            /<script/i, /javascript:/i, /onerror=/i, /onload=/i, /onclick=/i, /onmouseover=/i, /onfocus=/i,
            /<iframe/i, /<object/i, /<embed/i, /eval\(/i, /document\.cookie/i, /localStorage\./i, /sessionStorage\./i,
            /data:text\/html/i, /srcdoc=/i, /alert\(/i, /fetch\(/i, /xmlhttprequest/i
        ];
        for (const pattern of scriptPatterns) {
            if (pattern.test(input)) {
                return {
                    safe: false,
                    reason: "🛡️ <b>Güvenlik Engeli (XSS Guard):</b> Mesajınız zararlı kod veya script enjeksiyonu içeriyor."
                };
            }
        }

        // 3. Prompt Injection / Jailbreak Koruması
        const promptInjectionPatterns = [
            "ignore previous instructions", "ignore all instructions", "override prompt",
            "system prompt", "you are now a", "act as a unrestricted", "dan mode",
            "jailbreak", "forget your rules", "sql injection", "drop table", "select * from"
        ];
        for (const pattern of promptInjectionPatterns) {
            if (lower.includes(pattern)) {
                return {
                    safe: false,
                    reason: "🛡️ <b>Yapay Zeka Güvenlik Koruması:</b> Zararlı komut veya sistem manipülasyonu algılandı. Lütfen kulüp ve mobil yazılım ile ilgili geçerli sorular sorunuz."
                };
            }
        }

        return { safe: true };
    }


    // ==========================================================
    // 2. 30 SORU & 30 CEVAP KAPSAMLI VERİ TABANI (GEDIK MYGK)
    // ==========================================================
    const mygkKnowledgeBase = [
        {
            id: 1,
            question: "Kulübe nasıl üye olabilirim? Üyelik ücretli mi?",
            keywords: ["üye", "üye olmak", "katılmak", "katılım", "ücret", "ücretsiz", "kayıt", "başvuru", "form", "nasıl katılırım"],
            answer: "<b>Gedik MYGK'ya üyelik tamamen ücretsizdir!</b> Mobil uygulama geliştirmeye ilgi duyan tüm Gedik Üniversitesi öğrencileri katılabilir. Seni ana sayfadaki başvuru formuna yönlendiriyorum.",
            action: "kayıt"
        },
        {
            id: 2,
            question: "Kulüp başkanı ve yönetim kurulunda kimler yer alıyor?",
            keywords: ["başkan", "yönetim", "kurucu", "ekip", "yusuf furkan", "burak", "selin", "ahmet", "elif", "lider", "yöneticiler"],
            answer: "Kulüp Başkanımız <b>Yusuf Furkan Yılmaz</b>'dır. Yönetim ve koordinasyon ekibimizde iOS Lead <b>Ahmet Yılmaz</b> ve Android Lead <b>Elif Kaya</b> yer almaktadır. Seni yönetim ekibimize kaydırıyorum.",
            action: "yönetim"
        },
        {
            id: 3,
            question: "Mobil Yazılım Kulübü'nün (MYGK) amacı ve vizyonu nedir?",
            keywords: ["amaç", "vizyon", "misyon", "biz kimiz", "hakkında", "kulüp ne yapar", "ne iş yapar", "hedef"],
            answer: "Gedik MYGK, geleceğin mobil uygulama ekosistemini inşa edecek geliştiricileri ve tasarımcıları bir araya getirir. Teorik eğitimi pratik projelerle pekiştirerek üyelerimizi sektöre hazırlarız.",
            action: "hakkımızda"
        },
        {
            id: 4,
            question: "Kulüp tüzüğü ve temel kuralları nelerdir?",
            keywords: ["tüzük", "tuzuk", "kural", "ilkeler", "madde", "madde 1", "madde 2", "madde 3", "madde 4", "yönetmelik"],
            answer: "Resmi tüzüğümüz 4 ana maddeden oluşur: Madde 1-Kuruluş ve Amaç, Madde 2-Üyelik Şartları, Madde 3-Proje/Eğitim Esasları, Madde 4-Yönetim ve Temsil. Seni tüzük bölümüne kaydırıyorum.",
            action: "tüzük"
        },
        {
            id: 5,
            question: "Hangi programlama dilleri ve teknolojileri öğrenilebilir?",
            keywords: ["teknoloji", "dil", "swift", "kotlin", "flutter", "react native", "dart", "xcode", "android studio", "yazılım dilleri"],
            answer: "Kulübümüzde <b>Swift (iOS/SwiftUI)</b>, <b>Kotlin (Android/Jetpack Compose)</b>, <b>Flutter (Dart)</b> ve <b>React Native</b> teknolojilerinde eğitimler ve çalışma grupları yürütülmektedir.",
            action: "etkinlikler"
        },
        {
            id: 6,
            question: "Sıfırdan başlayanlar veya hiç kodlama bilmeyenler katılabilir mi?",
            keywords: ["sıfırdan", "hiç bilmiyorum", "yeni başlayan", "başlangıç", "tecrübesiz", "öğrenebilir miyim", "temel", "acemi"],
            answer: "Evet, kesinlikle! Eğitimlerimiz sıfırdan başlayan öğrencilere uygun temellerden başlar. Hiç kodlama bilmeseniz de kulübümüze katılıp kendinizi geliştirebilirsiniz.",
            action: "kayıt"
        },
        {
            id: 7,
            question: "Kulüp etkinlikleri ve workshoplar ne zaman düzenleniyor?",
            keywords: ["etkinlik", "workshop", "atölye", "takvim", "ders saatleri", "ne zaman", "saat", "gün", "seminer"],
            answer: "Etkinliklerimiz ders çıkış saatlerinde yüz yüze veya hafta sonları online oturumlar şeklinde düzenlenmektedir. Güncel takvim için <a href='etkinlikler.html'>Etkinlikler</a> sayfamızı ziyaret edebilirsin.",
            action: "etkinlikler"
        },
        {
            id: 8,
            question: "Kampüsteki kulüp konumu ve iletişim bilgileri nedir?",
            keywords: ["iletişim", "adres", "nerede", "yerleşke", "konum", "kartal", "eposta", "mail", "oda", "ulaşım"],
            answer: "Kulübümüz <b>İstanbul Gedik Üniversitesi Kartal Yerleşkesi</b>'ndedir. E-posta adresimiz: <b>gedikmobilyazilimkulubu@gmail.com</b>. Seni İletişim sayfasına yönlendiriyorum.",
            action: "iletişim"
        },
        {
            id: 9,
            question: "Eğitimlerin ve workshopların sonunda sertifika veriliyor mu?",
            keywords: ["sertifika", "katılım belgesi", "belge", "cv", "özgeçmiş", "onaylı", "sertifika var mı"],
            answer: "Evet! Tamamlanan resmi workshop serileri ve proje çalışma gruplarındaki başarı durumunuza göre <b>Gedik MYGK Onaylı Katılım ve Başarı Sertifikası</b> verilmektedir.",
            action: null
        },
        {
            id: 10,
            question: "Kulüp projelerinde yayın yapılıyor mu? (App Store / Google Play)",
            keywords: ["proje", "app store", "google play", "yayın", "mağaza", "uygulama yükleme", "geliştirme", "market"],
            answer: "Evet! Çalışma gruplarımızda üretilen başarılı mobil projeler, kulübümüzün geliştirici hesapları üzerinden App Store ve Google Play platformlarında yayınlanmaktadır.",
            action: null
        },
        {
            id: 11,
            question: "Etkinliklere ve eğitimlere katılım zorunlu mu?",
            keywords: ["zorunlu", "devam", "yoklama", "devamsızlık", "katılamazsam", "çakışma", "zorunluluk"],
            answer: "Katılım zorunlu değildir. Ancak sertifika almaya hak kazanmak ve aktif proje ekiplerine seçilmek için oturumların en az %70'ine katılım göstermeniz önerilir.",
            action: null
        },
        {
            id: 12,
            question: "Farklı bir bölümden veya fakülteden kulübe katılabilir miyim?",
            keywords: ["farklı bölüm", "mühendislik dışı", "myo", "sağlık", "mimarlık", "bölüm fark eder mi", "herkes katılabilir mi"],
            answer: "Evet! Mühendislik, İktisadi İdari Bilimler, Sağlık Bilimleri, Spor Bilimleri veya MYO fark etmeksizin tüm Gedik Üniversitesi öğrencilerine kapımız açıktır.",
            action: "kayıt"
        },
        {
            id: 13,
            question: "Kulübe katılmak için kendi bilgisayarıma sahip olmak zorunda mıyım?",
            keywords: ["bilgisayar", "laptop", "donanım", "şart mı", "bilgisayarım yok", "laboratuvar", "pc"],
            answer: "Kendi bilgisayarınızın olması avantajdır; ancak zorunlu değildir. Atölyelerde üniversitemizin bilgisayar laboratuvarlarını aktif olarak kullanabiliyoruz.",
            action: null
        },
        {
            id: 14,
            question: "iOS (iPhone) uygulaması geliştirmek için Mac / MacBook şart mı?",
            keywords: ["mac", "macbook", "ios için mac", "windows ios", "xcode", "apple", "mac gerekli mi"],
            answer: "Swift ve Xcode ile native iOS geliştirmek için Mac önerilir. Ancak Windows kullanıyorsanız Flutter veya React Native ile cross-platform iOS uyumlu uygulamalar geliştirebilirsiniz.",
            action: null
        },
        {
            id: 15,
            question: "Hackathon yarışmalarına katılıyor musunuz?",
            keywords: ["hackathon", "yarışma", "teknofest", "ödül", "maraton", "kodlama yarışı", "derece"],
            answer: "Evet! Gedik MYGK olarak Teknofest, ulusal hackathonlar ve üniversiteler arası yazılım maratonlarına katılmak üzere özel proje takımları hazırlamaktayız.",
            action: null
        },
        {
            id: 16,
            question: "Kulüp sponsorları ve iş birliği ortakları kimlerdir?",
            keywords: ["sponsor", "destekçi", "ortak", "google", "apple academy", "github", "aws", "microsoft", "sponsorluk"],
            answer: "Sponsorlarımız ve teknoloji ortaklarımız arasında Google Developers, Apple Academy, GitHub Campus, Microsoft ve AWS Academy yer almaktadır. Seni sponsorlar bölümüne yönlendiriyorum.",
            action: "sponsor"
        },
        {
            id: 17,
            question: "Discord veya WhatsApp iletişim grupları var mı?",
            keywords: ["discord", "whatsapp", "grup", "kanal", "sosyal medya", "sohbet", "topluluk", "iletişim grubu"],
            answer: "Evet! Üye kaydınızı yaptıktan sonra üye profil paneliniz üzerinden özel WhatsApp Duyuru Grubu ve Discord Kodlama Sunucumuzun davet bağlantılarına ulaşabilirsiniz.",
            action: null
        },
        {
            id: 18,
            question: "Kulüp duyurularını ve blog yazılarını nereden takip edebilirim?",
            keywords: ["duyuru", "haber", "blog", "yazı", "makale", "kaynak", "içerik", "yeni haberler"],
            answer: "En güncel kulüp haberleri için <a href='duyurular.html'>Duyurular</a> sayfamızı, teknik rehberler ve mobil yazılım makaleleri için <a href='blog.html'>Blog</a> sayfamızı ziyaret edebilirsiniz.",
            action: null
        },
        {
            id: 19,
            question: "Şifremi unuttum, hesabıma nasıl yeniden giriş yapabilirim?",
            keywords: ["şifremi unuttum", "parola sıfırlama", "giriş yapamıyorum", "şifre yenileme", "şifre sıfırla"],
            answer: "Giriş Yap modalaındaki 'Şifremi Unuttum' bağlantısına tıklayarak e-posta adresinize sıfırlama kodu talep edebilirsiniz. Seni Giriş ekranına yönlendiriyorum.",
            action: "giriş"
        },
        {
            id: 20,
            question: "Yönetici (Admin) Paneline nasıl giriş yapılır?",
            keywords: ["admin", "yönetici", "panel", "cms", "yönetici girişi", "admin paneli", "yönetici modu"],
            answer: "Giriş modalaındaki 'Yönetici Girişi' sekmesinden yetkili e-posta ve şifrenizle giriş yapabilirsiniz. Yönetici girişi ile sitede canlı içerik düzenleme araçları aktifleşir.",
            action: "giriş"
        },
        {
            id: 21,
            question: "Staj ve kariyer imkanlarında kulüp destek sağlıyor mu?",
            keywords: ["staj", "iş", "kariyer", "referans", "network", "cv inceleme", "sektör", "iş imkanı"],
            answer: "Kulübümüz sektördeki yazılım firmalarıyla buluşma günleri, CV inceleme etkinlikleri ve aktif üyelerimiz için staj referansı desteği sunmaktadır.",
            action: null
        },
        {
            id: 22,
            question: "Kulüpte Yapay Zeka (AI) entegrasyonlu mobil projeler yapılıyor mu?",
            keywords: ["yapay zeka", "ai", "chatgpt", "openai", "coreml", "ml kit", "makine öğrenmesi", "yapay zeka dersi"],
            answer: "Evet! Mobil uygulamalarda OpenAI API, Apple CoreML ve Google ML Kit entegrasyonu üzerine yapay zeka odaklı pratik mobil workshoplar düzenliyoruz.",
            action: null
        },
        {
            id: 23,
            question: "Mobil Güvenlik ve Siber Güvenlik konuları işleniyor mu?",
            keywords: ["siber güvenlik", "güvenlik", "zafiyet", "penetrasyon", "ssl pinning", "veri koruma", "güvenli kodlama"],
            answer: "Mobil yazılımda güvenli kodlama, hassas veri şifreleme ve zararlı kod analizi esasları eğitim müfredatımızda yer almaktadır.",
            action: null
        },
        {
            id: 24,
            question: "Üye profilimi ve bilgilerimi nasıl güncelleyebilirim?",
            keywords: ["profil", "profilim", "bilgi güncelleme", "şifre değiştirme", "hesabım", "bilgilerimi değiştir"],
            answer: "Sitemize giriş yaptıktan sonra sağ üst menüdeki 'Profilim' seçeneğine tıklayarak sınıf, telefon, e-posta ve şifre bilgilerinizi güncelleyebilirsiniz.",
            action: null
        },
        {
            id: 25,
            question: "Hazırlık sınıfı öğrencileri kulübe üye olabilir mi?",
            keywords: ["hazırlık", "hazırlık sınıfı", "ingilizce hazırlık", "yabancı diller", "1. sınıf öncesi"],
            answer: "Evet! Hazırlık sınıfı öğrencileri ilk yıldan itibaren kulübümüze katılıp hem teknik altyapı oluşturabilir hem de sosyal ortama dahil olabilirler.",
            action: "kayıt"
        },
        {
            id: 26,
            question: "Kulübe sponsor olmak veya iş birliği yapmak için kiminle görüşebiliriz?",
            keywords: ["sponsor olmak", "destek vermek", "iş birliği", "kurumsal", "partnerlik", "firmalar"],
            answer: "Sponsorluk ve kurumsal iş birliği teklifleri için <b>gedikmobilyazilimkulubu@gmail.com</b> e-posta adresimiz üzerinden Yönetim Kurulumuzla iletişime geçebilirsiniz.",
            action: "iletişim"
        },
        {
            id: 27,
            question: "Kulüp yönetim ekibine veya koordinatörlüğe nasıl seçilebilirim?",
            keywords: ["koordinatör", "yönetime girme", "seçim", "komite", "lider olma", "yönetici olma"],
            answer: "Etkinliklerde aktif rol alan, çalışma gruplarına liderlik eden üyelerimiz dönem sonlarında yönetim kurulu ve koordinatörlük kadrolarına dahil edilmektedir.",
            action: "yönetim"
        },
        {
            id: 28,
            question: "Mezun olduktan sonra kulüple bağımız devam eder mi?",
            keywords: ["mezun", "mezuniyet", "alumni", "mezun üye", "kariyer sonrası", "okul bitince"],
            answer: "Evet! Mezun üyelerimiz Gedik MYGK Alumni ağımıza dahil olarak tecrübelerini yeni üyelerle paylaşır ve mentorluk yaparlar.",
            action: null
        },
        {
            id: 29,
            question: "Mobil Oyun Geliştirme (Unity/Unreal) çalışmaları var mı?",
            keywords: ["oyun", "unity", "unreal", "game dev", "mobil oyun", "2d oyun", "game jam", "oyun geliştirme"],
            answer: "Evet! Mobil uygulama geliştirmenin yanı sıra Unity ile 2D/3D Mobil Oyun Geliştirme atölyeleri ve Game Jam maratonları düzenlenmektedir.",
            action: null
        },
        {
            id: 30,
            question: "Gece Kodlama (Night Coding) ve maraton kampları düzenleniyor mu?",
            keywords: ["gece kodlama", "night coding", "kodlama kampı", "bootcamp", "24 saat", "maraton", "geceleme"],
            answer: "Evet! Dönem içerisinde kampüsümüzde pizza eşliğinde 24 saatlik Gece Kodlama Maratonları ve Hackathon hazırlık kampları düzenlemekteyiz.",
            action: null
        }
    ];

    // ==========================================================
    // 3. ANLAMSAL & YAKINLIK EŞLEŞME ALGORİTMASI (FUZZY MATCH)
    // ==========================================================

    // Turkish Normalizer
    function normalizeTurkishText(str) {
        if (!str) return '';
        return str.toString()
            .replace(/İ/g, 'i').replace(/I/g, 'ı').replace(/ı/g, 'i')
            .replace(/Ğ/g, 'g').replace(/ğ/g, 'g')
            .replace(/Ü/g, 'u').replace(/ü/g, 'u')
            .replace(/Ş/g, 's').replace(/ş/g, 's')
            .replace(/Ö/g, 'o').replace(/ö/g, 'o')
            .replace(/Ç/g, 'c').replace(/ç/g, 'c')
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Levenshtein String Distance for typos (e.g., "fluter" -> "flutter", "klupe" -> "kulube")
    function getLevenshteinDistance(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    }

    // Similarity score between two words (0.0 to 1.0)
    function wordSimilarity(w1, w2) {
        const norm1 = normalizeTurkishText(w1);
        const norm2 = normalizeTurkishText(w2);
        if (!norm1 || !norm2) return 0;
        if (norm1 === norm2) return 1.0;
        if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.85;
        const maxLen = Math.max(norm1.length, norm2.length);
        if (maxLen === 0) return 1.0;
        const dist = getLevenshteinDistance(norm1, norm2);
        return Math.max(0, 1 - dist / maxLen);
    }

    // Compute match score of user query against a Knowledge Base Q&A item
    function computeMatchScore(userQuery, item) {
        const normQuery = normalizeTurkishText(userQuery);
        const queryWords = normQuery.split(' ').filter(w => w.length > 1);
        if (queryWords.length === 0) return 0;

        let totalScore = 0;

        // 1. Direct Question Text Similarity
        const normQuestion = normalizeTurkishText(item.question);
        if (normQuestion.includes(normQuery) || normQuery.includes(normQuestion)) {
            totalScore += 2.5;
        }

        // 2. Keyword Matches (weighted high)
        for (const keyword of item.keywords) {
            const normKeyword = normalizeTurkishText(keyword);
            const kwWords = normKeyword.split(' ');

            if (normQuery.includes(normKeyword)) {
                totalScore += 2.0;
            } else {
                // Check word by word fuzzy match
                for (const qWord of queryWords) {
                    for (const kWord of kwWords) {
                        const sim = wordSimilarity(qWord, kWord);
                        if (sim >= 0.75) {
                            totalScore += sim * 1.2;
                        }
                    }
                }
            }
        }

        // 3. Question Word Fuzzy Overlap
        const questionWords = normQuestion.split(' ').filter(w => w.length > 2);
        for (const qWord of queryWords) {
            for (const itemWord of questionWords) {
                const sim = wordSimilarity(qWord, itemWord);
                if (sim >= 0.8) {
                    totalScore += sim * 0.5;
                }
            }
        }

        return totalScore;
    }

    // Find best match in 30 Q&A Database
    function findBestMatch(userQuery) {
        let bestItem = null;
        let highestScore = 0;

        for (const item of mygkKnowledgeBase) {
            const score = computeMatchScore(userQuery, item);
            if (score > highestScore) {
                highestScore = score;
                bestItem = item;
            }
        }

        return { item: bestItem, score: highestScore };
    }


    // ==========================================================
    // 4. UI BUILDER & STYLES INJECTION
    // ==========================================================
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
            background: #d9267a;
            background: linear-gradient(135deg, var(--primary, #d9267a), rgba(var(--primary-rgb, 217, 38, 122), 0.8));
            box-shadow: 0 8px 32px rgba(var(--primary-rgb, 217, 38, 122), 0.35);
            border: 1px solid rgba(255, 255, 255, 0.15);
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
            box-shadow: 0 12px 40px rgba(var(--primary-rgb, 217, 38, 122), 0.5);
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
            width: 390px;
            height: 540px;
            max-height: calc(100vh - 140px);
            border-radius: 18px;
            background: var(--bg-card, #121829);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
            box-shadow: var(--card-shadow, 0 20px 50px rgba(0,0,0,0.5));
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
            padding: 14px 18px;
            background: linear-gradient(135deg, rgba(var(--primary-rgb, 217, 38, 122), 0.18), rgba(var(--primary-rgb, 217, 38, 122), 0.05));
            border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .chatbot-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: var(--primary, #d9267a);
            color: #ffffff !important;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            position: relative;
            box-shadow: 0 4px 12px rgba(var(--primary-rgb, 217, 38, 122), 0.3);
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
            border: 2px solid var(--bg-card, #121829);
        }
        .chatbot-header-info {
            flex-grow: 1;
        }
        .chatbot-header-title {
            font-family: 'Plus Jakarta Sans', 'Space Grotesk', sans-serif;
            font-weight: 700;
            font-size: 0.95rem;
            color: var(--headings-color, #ffffff);
            margin: 0;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .chatbot-header-status {
            font-size: 0.72rem;
            color: var(--text-muted, #94a3b8);
            margin: 0;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .security-badge {
            display: inline-flex;
            align-items: center;
            gap: 3px;
            font-size: 0.68rem;
            background: rgba(16, 185, 129, 0.12);
            color: #10b981;
            padding: 2px 7px;
            border-radius: 10px;
            border: 1px solid rgba(16, 185, 129, 0.25);
            font-weight: 600;
        }

        /* Quick Suggestions Horizontal Scroll */
        .chatbot-quick-pills {
            display: flex;
            gap: 8px;
            padding: 10px 16px;
            overflow-x: auto;
            border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.05));
            background: rgba(0, 0, 0, 0.1);
            scrollbar-width: none;
        }
        .chatbot-quick-pills::-webkit-scrollbar {
            display: none;
        }
        .quick-pill {
            white-space: nowrap;
            font-size: 0.74rem;
            padding: 6px 12px;
            border-radius: 16px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
            color: var(--text-color, #e2e8f0);
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .quick-pill:hover {
            background: var(--primary, #d9267a);
            color: #ffffff !important;
            border-color: var(--primary, #d9267a);
            transform: translateY(-1px);
        }

        /* Chat Messages */
        .chatbot-messages {
            flex-grow: 1;
            padding: 16px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 14px;
            scroll-behavior: smooth;
        }
        .chatbot-msg {
            max-width: 82%;
            padding: 11px 15px;
            border-radius: 14px;
            font-size: 0.85rem;
            line-height: 1.48;
            word-wrap: break-word;
            animation: chatbot-fade-in 0.25s ease-out;
        }
        @keyframes chatbot-fade-in {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .chatbot-msg.bot {
            align-self: flex-start;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            color: var(--text-color, #e2e8f0);
            border-top-left-radius: 3px;
        }
        body:not(.dark-theme) .chatbot-msg.bot {
            background: #f8fafc;
            border-color: #e2e8f0;
            color: #1e293b;
        }
        .chatbot-msg.user {
            align-self: flex-end;
            background: var(--primary, #d9267a);
            color: #ffffff !important;
            border-top-right-radius: 3px;
            box-shadow: 0 4px 12px rgba(var(--primary-rgb, 217, 38, 122), 0.2);
        }
        .chatbot-msg.security-alert {
            align-self: flex-start;
            background: rgba(239, 68, 68, 0.12);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #fca5a5;
            border-top-left-radius: 3px;
        }
        .chatbot-msg.bot a {
            color: var(--primary, #d9267a);
            text-decoration: underline;
            font-weight: 600;
        }

        /* Typing Indicator */
        .chatbot-typing {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 10px 14px;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: 14px;
            border-top-left-radius: 3px;
            width: fit-content;
            align-self: flex-start;
        }
        body:not(.dark-theme) .chatbot-typing {
            background: #f8fafc;
        }
        .chatbot-typing span {
            width: 6px;
            height: 6px;
            background: var(--text-muted, #94a3b8);
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

        /* Input Container */
        .chatbot-input-container {
            padding: 12px 16px;
            border-top: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            display: flex;
            gap: 10px;
            background: rgba(0, 0, 0, 0.1);
            align-items: center;
        }
        .chatbot-input {
            flex-grow: 1;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.12));
            border-radius: 24px;
            padding: 10px 16px;
            font-size: 0.85rem;
            color: var(--text-color, #ffffff);
            outline: none;
            transition: border-color 0.2s ease;
        }
        body:not(.dark-theme) .chatbot-input {
            background: #ffffff;
            color: #1e293b;
        }
        .chatbot-input:focus {
            border-color: var(--primary, #d9267a);
        }
        .chatbot-send-btn {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: var(--primary, #d9267a);
            color: #ffffff !important;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.95rem;
            transition: all 0.2s ease;
            box-shadow: 0 4px 12px rgba(var(--primary-rgb, 217, 38, 122), 0.25);
        }
        .chatbot-send-btn i {
            color: #ffffff !important;
        }
        .chatbot-send-btn:hover {
            transform: scale(1.05);
        }

        /* Responsiveness */
        @media (max-width: 480px) {
            .chatbot-window {
                bottom: 85px;
                right: 15px;
                left: 15px;
                width: auto;
                height: 490px;
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

    // Dynamic HTML Injection
    const chatContainer = document.createElement('div');
    chatContainer.innerHTML = `
        <button id="chatbot-toggle" class="chatbot-toggle" aria-label="MYGK Asistanını Aç">
            <i class="fa-solid fa-comments"></i>
            <i class="fa-solid fa-xmark"></i>
        </button>
        <div id="chatbot-window" class="chatbot-window">
            <div class="chatbot-header">
                <div class="chatbot-avatar">
                    <i class="fa-solid fa-robot"></i>
                </div>
                <div class="chatbot-header-info">
                    <h4 class="chatbot-header-title">
                        MYGK Asistan
                        <span class="security-badge"><i class="fa-solid fa-shield-halved"></i> Güvenli AI</span>
                    </h4>
                    <p class="chatbot-header-status">
                        <span style="display:inline-block; width:6px; height:6px; background:#10b981; border-radius:50%;"></span>
                        Çevrimiçi · 30 Soru-Cevap Zekası
                    </p>
                </div>
            </div>

            <!-- Quick Pill Suggestions -->
            <div class="chatbot-quick-pills">
                <button class="quick-pill" data-query="Kulübe nasıl üye olabilirim?"><i class="fa-solid fa-user-plus"></i> Üyelik</button>
                <button class="quick-pill" data-query="Kulüp başkanı ve yönetim kurulunda kimler var?"><i class="fa-solid fa-crown"></i> Yönetim</button>
                <button class="quick-pill" data-query="Hangi programlama dilleri ve teknolojileri var?"><i class="fa-solid fa-code"></i> Teknolojiler</button>
                <button class="quick-pill" data-query="Kulüp tüzüğü ve kuralları nedir?"><i class="fa-solid fa-book"></i> Tüzük</button>
                <button class="quick-pill" data-query="Kampüsteki kulüp konumu nerede?"><i class="fa-solid fa-location-dot"></i> Konum</button>
                <button class="quick-pill" data-query="Eğitim sonunda sertifika veriliyor mu?"><i class="fa-solid fa-certificate"></i> Sertifika</button>
            </div>

            <div id="chatbot-messages" class="chatbot-messages">
                <div class="chatbot-msg bot">
                    Merhaba! Ben <b>Gedik MYGK Yapay Zeka Asistanıyım</b>. 🛡️ Güvenlik filtreleri ve 30 soru-cevaplık akıllı bilgi sistemi ile donatıldım. <br><br>Üyelik, tüzük, eğitimlerimiz, yönetim ekibimiz veya kampüsümüz hakkında merak ettiğin her şeyi sorabilirsin! 😊
                </div>
            </div>

            <div class="chatbot-input-container">
                <input type="text" id="chatbot-input" class="chatbot-input" placeholder="Soru sorun (ör: üyelik ücretli mi?)" autocomplete="off" maxlength="300">
                <button id="chatbot-send-btn" class="chatbot-send-btn" aria-label="Gönder">
                    <i class="fa-solid fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(chatContainer);


    // ==========================================================
    // 5. EVENT LISTENERS & CHAT LOGIC
    // ==========================================================
    const toggleBtn = document.getElementById('chatbot-toggle');
    const chatWindow = document.getElementById('chatbot-window');
    const chatInput = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send-btn');
    const msgContainer = document.getElementById('chatbot-messages');
    const quickPills = document.querySelectorAll('.quick-pill');

    if (!toggleBtn || !chatWindow || !chatInput || !sendBtn || !msgContainer) return;

    toggleBtn.addEventListener('click', () => {
        chatWindow.classList.toggle('open');
        toggleBtn.classList.toggle('open');
        if (chatWindow.classList.contains('open')) {
            chatInput.focus();
        }
    });

    // Quick Pill Clicks
    quickPills.forEach(pill => {
        pill.addEventListener('click', () => {
            const query = pill.getAttribute('data-query');
            if (query) {
                chatInput.value = query;
                sendMessage();
            }
        });
    });

    // Send Triggers
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    function sendMessage() {
        const rawText = chatInput.value.trim();
        if (!rawText) return;

        // 1. Rate Limiting Check
        const rateCheck = RateLimiter.canSend();
        if (!rateCheck.allowed) {
            appendMessage(rateCheck.reason, 'security-alert');
            return;
        }

        // 2. Vulnerability & Security Guardrail Check
        const secCheck = checkSecurityVulnerabilities(rawText);
        if (!secCheck.safe) {
            // Render user input safely escaped
            appendMessage(escapeHTML(rawText), 'user');
            chatInput.value = '';
            // Render security alert
            appendMessage(secCheck.reason, 'security-alert');
            return;
        }

        // Render User Input safely
        const safeUserText = escapeHTML(rawText);
        appendMessage(safeUserText, 'user');
        chatInput.value = '';

        // Show Typing Indicator
        const typingId = showTypingIndicator();

        // Simulate Smart Processing Delay (700ms - 1200ms)
        setTimeout(() => {
            removeTypingIndicator(typingId);
            
            // Generate Smart AI Match Response
            const botResponseObj = generateSmartResponse(rawText);
            appendMessage(botResponseObj.text, 'bot');

            // Trigger Page Navigation Action if needed
            if (botResponseObj.action) {
                setTimeout(() => {
                    triggerPageAction(botResponseObj.action);
                }, 400);
            }
        }, 700 + Math.random() * 500);
    }

    function appendMessage(text, type) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chatbot-msg ${type}`;
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
        const el = document.getElementById(id);
        if (el) el.remove();
    }


    // ==========================================================
    // 6. SMART AI BOT RESPONSE GENERATOR
    // ==========================================================
    function generateSmartResponse(rawInput) {
        const lowerInput = rawInput.toLowerCase();

        // Basic Greets & Politeness
        if (['merhaba', 'selam', 'hey', 'naber', 'günaydın', 'tünaydın', 'iyi günler', 'sa'].some(w => lowerInput.includes(w))) {
            return {
                text: "Merhaba! Ben Gedik MYGK Asistanıyım. Kulübümüz, üyelik başvuruları, eğitimlerimiz ve etkinliklerimiz hakkında merak ettiğin her şeyi bana sorabilirsin! 😊",
                action: null
            };
        }

        if (['teşekkür', 'teşekkürler', 'sağol', 'eyvallah', 'harika', 'tamam', 'ok'].some(w => lowerInput.includes(w))) {
            return {
                text: "Rica ederim! Yardımcı olabildiysem ne mutlu. Gedik MYGK ile ilgili başka bir sorun olursa her zaman buradayım. 🚀",
                action: null
            };
        }

        // Run Semantic & Fuzzy Matcher over 30 Q&A Dataset
        const matchResult = findBestMatch(rawInput);

        if (matchResult.item && matchResult.score >= 0.4) {
            // High Confidence Match
            return {
                text: matchResult.item.answer,
                action: matchResult.item.action
            };
        } else if (matchResult.item && matchResult.score >= 0.2) {
            // Moderate Confidence Match
            return {
                text: `<b>Aradığınız soru bu olabilir mi?</b><br><i>"${matchResult.item.question}"</i><br><br>${matchResult.item.answer}`,
                action: matchResult.item.action
            };
        }

        // Fallback Response
        return {
            text: "Bu soruya doğrudan karşılık gelen bir kayıt bulamadım. Ancak üst taraftaki **Hızlı Soru Etiketlerini** deneyebilir veya doğrudan <b>gedikmobilyazilimkulubu@gmail.com</b> adresinden yönetim ekibimizle iletişime geçebilirsin. İstersen sorunu farklı kelimelerle yazarak tekrar deneyebilirsin! 😊",
            action: null
        };
    }


    // ==========================================================
    // 7. PAGE ACTION DRIVER (SCROLL & NAVIGATION)
    // ==========================================================
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
        } else if (category === 'etkinlikler') {
            if (!window.location.pathname.endsWith('etkinlikler.html')) {
                window.location.href = 'etkinlikler.html';
            }
        }
    }
})();
