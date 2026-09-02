/* ==========================================
   MOBİL YAZILIM KULÜBÜ JAVASCRIPT LOGIC
   ========================================== */

// --- 1. Web Crypto API ile SHA-256 + Salt Hashleme Fonksiyonu ---
async function hashPassword(password, salt = 'mygk_security_salt_2026') {
    if (!password) return '';
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

document.addEventListener('DOMContentLoaded', () => {

    // --- 0. Firebase & EmailJS Initialization ---
    let db = null;
    let useFirebase = false;
    let useEmailJS = false;

    // Sahte test kullanıcılarını temizleyen üye yöneticisi
    function getLocalStorageMembers() {
        const stored = localStorage.getItem('myk_members');
        if (!stored) return [];
        try {
            let parsed = JSON.parse(stored);
            if (!Array.isArray(parsed)) return [];
            return parsed.filter(m => m && m.id !== '101' && m.id !== '102' && m.id !== '103' && m.email !== 'ahmet.yilmaz@posta.com' && m.email !== 'elif.kaya@outlook.com' && m.email !== 'can.demir@gmail.com');
        } catch (e) {
            return [];
        }
    }

    function saveLocalStorageMembers(members) {
        if (Array.isArray(members)) {
            localStorage.setItem('myk_members', JSON.stringify(members));
        }
    }

    let dbMembers = getLocalStorageMembers();

    // Firebase Başlatma
    if (typeof CONFIG !== 'undefined' && CONFIG.firebase && CONFIG.firebase.projectId) {
        try {
            firebase.initializeApp(CONFIG.firebase);
            db = firebase.firestore();
            useFirebase = true;
            console.log("Firebase initialized successfully.");
            syncFirestoreToLocalStorage();
        } catch (err) {
            console.error("Firebase initialization failed:", err);
        }
    }

    // Arka plan senkronizasyonu
    async function syncFirestoreToLocalStorage() {
        if (!useFirebase || !db) return;
        try {
            // 1. Etkinlikler
            const eventsSnapshot = await db.collection('events').get();
            const events = [];
            eventsSnapshot.forEach(doc => events.push(doc.data()));
            // Sahte şablon etkinlikleri hariç tut
            const realEvents = events.filter(e => e && !['ev_1','ev_2','ev_3','ev_4','ev_5','ev_6'].includes(e.id));
            localStorage.setItem('myk_events', JSON.stringify(realEvents));
            if (typeof renderDashboardEvents === 'function') renderDashboardEvents();

            // 2. Duyurular
            const annSnapshot = await db.collection('announcements').get();
            const announcements = [];
            annSnapshot.forEach(doc => announcements.push(doc.data()));
            const realAnns = announcements.filter(a => a && !['ann_1','ann_2','ann_3'].includes(a.id));
            localStorage.setItem('myk_announcements', JSON.stringify(realAnns));
            if (typeof renderDashboardAnnouncements === 'function') renderDashboardAnnouncements();

            // 3. Bloglar
            const blogSnapshot = await db.collection('blog').get();
            const blog = [];
            blogSnapshot.forEach(doc => blog.push(doc.data()));
            const realBlog = blog.filter(b => b && !['post_1','post_2','post_3','post_4','post_5','post_6'].includes(b.id));
            localStorage.setItem('myk_blog', JSON.stringify(realBlog));
            if (typeof renderDashboardBlog === 'function') renderDashboardBlog();

            // 4. CMS Site Ayarları
            const settingsDoc = await db.collection('settings').doc('cms').get();
            if (settingsDoc.exists) {
                const settingsData = settingsDoc.data();
                settingsData.totalSponsors = 0; // Sponsor daima 0
                const currentSettings = getLocalStorageSettings();
                localStorage.setItem('myk_site_settings', JSON.stringify({ ...currentSettings, ...settingsData }));
                applySiteSettings();
            }

            // 5. Başvurular
            const snap = await db.collection('applicants').get();
            const cloudMembers = [];
            snap.forEach(doc => cloudMembers.push({ id: doc.id, ...doc.data() }));
            if (cloudMembers.length > 0) {
                const local = getLocalStorageMembers();
                local.forEach(locMem => {
                    const idx = cloudMembers.findIndex(c => 
                        (c.email && locMem.email && c.email.toLowerCase() === locMem.email.toLowerCase()) || 
                        String(c.id) === String(locMem.id)
                    );
                    if (idx === -1) {
                        cloudMembers.push(locMem);
                    } else if (locMem.status && locMem.status !== cloudMembers[idx].status) {
                        cloudMembers[idx].status = locMem.status;
                    }
                });
                dbMembers = cloudMembers;
                saveLocalStorageMembers(dbMembers);
                renderDashboardTable(getSearchText(), false);
                updateHomepageStats();
            }
        } catch (err) {
            console.error("Firestore sync error:", err);
        }
    }

    // EmailJS Başlatma
    if (typeof emailjs !== 'undefined' && typeof CONFIG !== 'undefined' && CONFIG.emailjs && CONFIG.emailjs.publicKey) {
        try {
            emailjs.init(CONFIG.emailjs.publicKey);
            useEmailJS = true;
        } catch (err) {}
    }

    // --- 1. Header Scroll ---
    const header = document.getElementById('main-header');
    if (header) {
        const isHomePage = document.getElementById('hero') !== null;
        const updateHeaderClass = () => {
            if (window.scrollY > 50 || !isHomePage) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        };
        window.addEventListener('scroll', updateHeaderClass);
        updateHeaderClass();
    }

    // --- 2. Mobil Menü ---
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('open');
            navMenu.classList.toggle('open');
        });

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('open');
                navMenu.classList.remove('open');
            });
        });

        document.addEventListener('click', (e) => {
            if (!menuToggle.contains(e.target) && !navMenu.contains(e.target)) {
                menuToggle.classList.remove('open');
                navMenu.classList.remove('open');
            }
        });
    }

    // --- 3. Sayaç Animasyonları ---
    const statNumbers = document.querySelectorAll('.stat-number');
    let countersStarted = false;

    function animateCounters() {
        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-val')) || 0;
            if (target === 0) {
                stat.innerText = "0";
                return;
            }
            let current = 0;
            const duration = 2000;
            const steps = duration / 30;
            const increment = Math.ceil(target / steps);
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    stat.innerText = target;
                    clearInterval(timer);
                } else {
                    stat.innerText = current;
                }
            }, 30);
        });
    }

    const statsGrid = document.querySelector('.stats-grid');
    if (statsGrid) {
        const statsObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !countersStarted) {
                countersStarted = true;
                animateCounters();
            }
        }, { threshold: 0.3 });
        statsObserver.observe(statsGrid);
    }

    // --- 4. Bildirim Toast Kutusu ---
    function showStatusToast(title, message, isSuccess = true) {
        const existing = document.querySelector('.status-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast-notification status-toast';
        toast.style.borderLeft = isSuccess ? '4px solid #10b981' : '4px solid #ef4444';
        
        const iconClass = isSuccess ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark';
        const iconColor = isSuccess ? '#10b981' : '#ef4444';
        
        toast.innerHTML = `
            <div class="toast-icon" style="color: ${iconColor}; font-size: 1.4rem;"><i class="${iconClass}"></i></div>
            <div class="toast-content">
                <h5 style="margin: 0 0 4px 0; font-size: 0.95rem; font-weight: 700; color: #ffffff !important;">${title}</h5>
                <p style="margin: 0; font-size: 0.8rem; color: #cbd5e1 !important; line-height: 1.4;">${message}</p>
            </div>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    }

    // --- 5. Kayıt Modalı & Captcha ---
    const registerModal = document.getElementById('register-modal');
    const regTriggerNav = document.getElementById('register-trigger-nav');
    const regTriggerHero = document.getElementById('register-trigger-hero');
    const regTriggerMobile = document.getElementById('register-trigger-mobile');
    const closeRegister = document.getElementById('close-register');
    const membershipForm = document.getElementById('membership-form');
    const verificationContainer = document.getElementById('verification-container');
    const successMsg = document.getElementById('form-success-message');

    let correctCaptchaAnswer = 0;

    function generateRegisterCaptcha() {
        const num1 = Math.floor(Math.random() * 8) + 2;
        const num2 = Math.floor(Math.random() * 8) + 2;
        correctCaptchaAnswer = num1 + num2;
        const label = document.getElementById('captcha-label');
        if (label) {
            label.innerHTML = `Güvenlik Doğrulaması: <span style="font-weight: 700; color: var(--accent-pink); font-size: 0.95rem;">${num1} + ${num2} = ?</span> *`;
        }
        const captchaInput = document.getElementById('register-captcha');
        if (captchaInput) captchaInput.value = '';
    }

    function openRegisterModal(e) {
        if (e) e.preventDefault();
        if (registerModal) {
            registerModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            if (membershipForm) {
                membershipForm.classList.remove('hidden');
                membershipForm.reset();
            }
            if (verificationContainer) verificationContainer.classList.add('hidden');
            if (successMsg) successMsg.classList.add('hidden');
            generateRegisterCaptcha();
        }
    }

    function closeRegisterModal() {
        if (registerModal) {
            registerModal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    }

    if (regTriggerNav) regTriggerNav.addEventListener('click', openRegisterModal);
    if (regTriggerHero) regTriggerHero.addEventListener('click', openRegisterModal);
    if (regTriggerMobile) regTriggerMobile.addEventListener('click', openRegisterModal);
    if (closeRegister) closeRegister.addEventListener('click', closeRegisterModal);

    const refreshCaptchaBtn = document.getElementById('refresh-captcha');
    if (refreshCaptchaBtn) refreshCaptchaBtn.addEventListener('click', generateRegisterCaptcha);

    // Fakülte & Bölüm Dinamik Eşleşmesi
    const facultySelect = document.getElementById('user-faculty');
    const departmentSelect = document.getElementById('user-department');
    const facultyDepartments = {
        "Mühendislik Fakültesi": ["Yazılım Mühendisliği", "Bilgisayar Mühendisliği", "Mekatronik Mühendisliği", "Endüstri Mühendisliği", "Elektrik-Elektronik Mühendisliği"],
        "İktisadi, İdari ve Sosyal Bilimler Fakültesi": ["Yönetim Bilişim Sistemleri (YBS)", "Uluslararası Ticaret ve Lojistik", "Psikoloji", "Siyaset Bilimi ve Kamu Yönetimi"],
        "Güzel Sanatlar ve Mimarlık Fakültesi": ["İç Mimarlık ve Çevre Tasarımı", "Görsel İletişim Tasarımı", "Mimarlık"],
        "Sağlık Bilimleri Fakültesi": ["Fizyoterapi ve Rehabilitasyon", "Beslenme ve Diyetetik", "Hemşirelik"],
        "Spor Bilimleri Fakültesi": ["Antrenörlük Eğitimi", "Spor Yöneticiliği"],
        "Meslek Yüksekokulu (MYO)": ["Bilgisayar Programcılığı", "Mekatronik", "Grafik Tasarımı"]
    };

    if (facultySelect && departmentSelect) {
        facultySelect.addEventListener('change', () => {
            const selectedFaculty = facultySelect.value;
            const departments = facultyDepartments[selectedFaculty] || [];
            departmentSelect.innerHTML = '<option value="" disabled selected>Bölüm Seçiniz</option>';
            departments.forEach(dept => {
                const opt = document.createElement('option');
                opt.value = dept;
                opt.innerText = dept;
                departmentSelect.appendChild(opt);
            });
            departmentSelect.disabled = false;
        });
    }

    // Kayıt Formu Submit
    let pendingMemberData = null;
    let currentVerificationCode = '';

    if (membershipForm) {
        membershipForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const userCaptcha = document.getElementById('register-captcha') ? document.getElementById('register-captcha').value.trim() : '';
            if (parseInt(userCaptcha, 10) !== correctCaptchaAnswer) {
                alert("Güvenlik doğrulaması hatalı!");
                generateRegisterCaptcha();
                return;
            }

            const rawPassword = document.getElementById('user-password').value.trim();
            const rawPasswordConfirm = document.getElementById('user-password-confirm').value.trim();
            if (rawPassword.length < 6) {
                alert("Şifreniz en az 6 karakter olmalıdır!");
                return;
            }
            if (rawPassword !== rawPasswordConfirm) {
                alert("Şifreler uyuşmuyor!");
                return;
            }

            const firstName = document.getElementById('first-name').value.trim();
            const lastName = document.getElementById('last-name').value.trim();
            const email = document.getElementById('user-email').value.trim().toLowerCase();
            const hashedPassword = await hashPassword(rawPassword);

            pendingMemberData = {
                id: email,
                name: `${firstName} ${lastName}`,
                email: email,
                username: document.getElementById('user-username').value.trim(),
                studentId: document.getElementById('user-student-id').value.trim(),
                phone: document.getElementById('user-phone').value.trim(),
                faculty: document.getElementById('user-faculty').value,
                department: document.getElementById('user-department').value,
                grade: document.getElementById('user-grade').value,
                birthdate: document.getElementById('user-birthdate').value,
                password: hashedPassword,
                track: 'ios',
                status: 'pending',
                ipAddress: 'Tespit Ediliyor...',
                userAgent: navigator.userAgent || 'Bilinmeyen Cihaz',
                registeredAt: new Date().toLocaleString('tr-TR')
            };

            currentVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            
            // Simüle Kod Bildirimi
            const existingToast = document.querySelector('.toast-notification');
            if (existingToast) existingToast.remove();
            const toast = document.createElement('div');
            toast.className = 'toast-notification';
            toast.innerHTML = `
                <div class="toast-icon"><i class="fa-solid fa-envelope-open-text animate-pulse"></i></div>
                <div class="toast-content">
                    <h5>📩 Onay Kodu (Simüle)</h5>
                    <p>Alıcı: <b>${email}</b></p>
                    <p>Kodunuz: <strong style="font-size: 1.1rem; color: #00b4d8; letter-spacing: 1.5px;">${currentVerificationCode}</strong></p>
                </div>
            `;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 8000);

            membershipForm.classList.add('hidden');
            if (verificationContainer) verificationContainer.classList.remove('hidden');
            const verifyInputs = document.querySelectorAll('.verify-input');
            if (verifyInputs.length > 0) {
                verifyInputs.forEach(i => i.value = '');
                verifyInputs[0].focus();
            }
        });
    }

    // Kodu Doğrulama
    const verifySubmitBtn = document.getElementById('verify-submit-btn');
    if (verifySubmitBtn) {
        verifySubmitBtn.addEventListener('click', () => {
            let enteredCode = '';
            document.querySelectorAll('.verify-input').forEach(inp => enteredCode += inp.value);

            if (enteredCode === currentVerificationCode && pendingMemberData) {
                let local = getLocalStorageMembers();
                local = local.filter(m => String(m.id).toLowerCase() !== String(pendingMemberData.id).toLowerCase() && String(m.email).toLowerCase() !== String(pendingMemberData.email).toLowerCase());
                local.push(pendingMemberData);
                saveLocalStorageMembers(local);
                dbMembers = local;

                if (useFirebase && db) {
                    db.collection('applicants').doc(pendingMemberData.email.toLowerCase()).set({
                        ...pendingMemberData,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    }).catch(() => {});
                }

                if (verificationContainer) verificationContainer.classList.add('hidden');
                if (successMsg) successMsg.classList.remove('hidden');

                renderDashboardTable(getSearchText(), false);
                updateHomepageStats();
            } else {
                const err = document.getElementById('verification-error-message');
                if (err) err.classList.remove('hidden');
            }
        });
    }

    // --- 6. DEFAULT SITE AYARLARI (Gerçek Yönetim Kurulu) ---
    const defaultSiteSettings = {
        heroTitle: `Geleceğin Mobil <br>\n                    <span class="gradient-text animate-gradient">Geliştiricileri Burada</span>`,
        heroDesc: "Mobil uygulama geliştirmeye odaklanan kulübümüzle mobil yazılım ekosistemine ilk adımını at. Sıfırdan başla, projeler geliştir, sektöre yön ver!",
        aboutText1: "Mobil Yazılım Kulübü, geleceğin mobil uygulama ekosistemini inşa edecek geliştiricileri ve tasarımcıları bir araya getiren dinamik bir öğrenci topluluğudur. Mobil platformların gücünü keşfederek, teorik bilgiyi pratik projelerle pekiştiriyor ve üyelerimizi sektöre hazır hale getiriyoruz.",
        aboutText2: "Yeni kurulan kulübümüzle birlikte hedeflerimiz arasında; sıfırdan başlayanlar için atölyeler düzenlemek, ortak çalışma gruplarıyla App Store ve Google Play'e uygulamalar yüklemek ve hackathonlarda kampüsümüzü temsil etmek yer almaktadır.",
        contactAddress: "Cumhuriyet, İlkbahar Sk. No:1, 34876 Kartal/İstanbul",
        contactEmail: "gedikmobilyazilimkulubu@gmail.com",
        socialInstagram: "https://www.instagram.com/gedikmygk",
        socialLinkedin: "https://www.linkedin.com/company/https-l24.im-9ir3fgw",
        socialGithub: "https://github.com/yusufurkan0",
        
        totalSponsors: 0,

        // GERÇEK YÖNETİM KURULU BİLGİLERİ
        teamM1Name: "Burak Kaya",
        teamM1Role: "Kulüp Başkanı",
        teamM1Bio: "İstanbul Gedik Üniversitesi Endüstri Mühendisliği Öğrencisi.",
        teamM2Name: "Yusuf Furkan Gelişin",
        teamM2Role: "Kulüp Başkan Yardımcısı / Kurucu",
        teamM2Bio: "İstanbul Gedik Üniversitesi Bilgisayar Mühendisliği Öğrencisi.",
        teamM3Name: "Selin Durdu",
        teamM3Role: "Kulüp Başkan Yardımcısı",
        teamM3Bio: "İstanbul Gedik Üniversitesi Endüstri Mühendisliği Öğrencisi.",

        regT1: "Madde 1: Kuruluş ve Amaç",
        regC1: "Topluluğun amacı, İstanbul Gedik Üniversitesi öğrencilerine mobil yazılım (iOS/Android) alanlarında teorik eğitimler vermek, pratik projeler geliştirmek ve öğrencileri teknoloji ekosistemine hazırlamaktır.",
        regT2: "Madde 2: Üyelik ve Katılım Şartları",
        regC2: "Topluluğa üye olmak tamamen ücretsizdir. Mobil uygulama geliştirmeye ve tasarıma ilgi duyan, kendini geliştirmek isteyen tüm Gedik Üniversitesi öğrencileri üye olabilir.",
        regT3: "Madde 3: Proje ve Eğitim Esasları",
        regC3: "Eğitimler açık kaynaklı ve paylaşımcı kültür esasına göre yürütülür. Çalışma grupları kurularak App Store ve Google Play platformlarına uygulama yüklenmesi hedeflenir.",
        regT4: "Madde 4: Yönetim ve Temsil",
        regC4: "Yönetim kurulu, kulüp başkanı ve odak koordinatörlerinden oluşur. Üniversite içindeki etkinlik planlamaları ve hackathon katılım organizasyonları yönetim kurulu tarafından kararlaştırılır."
    };

    function getLocalStorageSettings() {
        const stored = localStorage.getItem('myk_site_settings');
        if (!stored) {
            localStorage.setItem('myk_site_settings', JSON.stringify(defaultSiteSettings));
            return defaultSiteSettings;
        }
        try {
            let parsed = JSON.parse(stored);
            if (!parsed.teamM1Name || parsed.teamM1Name === 'Yusuf Furkan Yılmaz' || parsed.teamM2Name === 'Ahmet Yılmaz') {
                parsed = { ...parsed, ...defaultSiteSettings };
                localStorage.setItem('myk_site_settings', JSON.stringify(parsed));
            }
            return parsed;
        } catch (e) {
            return defaultSiteSettings;
        }
    }

    function saveLocalStorageSettings(settings) {
        const current = getLocalStorageSettings();
        const merged = { ...current, ...settings };
        localStorage.setItem('myk_site_settings', JSON.stringify(merged));
        if (useFirebase && db) {
            db.collection('settings').doc('cms').set(merged).catch(() => {});
        }
    }

    function applySiteSettings() {
        const settings = getLocalStorageSettings();
        
        const setHtml = (id, val) => { const el = document.getElementById(id); if (el) el.innerHTML = val; };
        const setText = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };

        setHtml('dyn-hero-title', settings.heroTitle);
        setText('dyn-hero-desc', settings.heroDesc);
        setText('dyn-about-p1', settings.aboutText1);
        setText('dyn-about-p2', settings.aboutText2);

        setHtml('dyn-footer-address', `<i class="fa-solid fa-location-dot"></i> ${settings.contactAddress}`);
        setText('dyn-footer-email', settings.contactEmail);

        const gh = document.getElementById('dyn-footer-github');
        const li = document.getElementById('dyn-footer-linkedin');
        const ig = document.getElementById('dyn-footer-instagram');
        if (gh) gh.href = settings.socialGithub;
        if (li) li.href = settings.socialLinkedin;
        if (ig) ig.href = settings.socialInstagram;

        // Yönetim Kurulu Ekranı
        setText('dyn-team-m1-name', settings.teamM1Name);
        setText('dyn-team-m1-role', settings.teamM1Role);
        setText('dyn-team-m1-bio', settings.teamM1Bio);
        setText('dyn-team-m2-name', settings.teamM2Name);
        setText('dyn-team-m2-role', settings.teamM2Role);
        setText('dyn-team-m2-bio', settings.teamM2Bio);
        setText('dyn-team-m3-name', settings.teamM3Name);
        setText('dyn-team-m3-role', settings.teamM3Role);
        setText('dyn-team-m3-bio', settings.teamM3Bio);

        // Tüzük
        setText('dyn-reg-t1', settings.regT1); setText('dyn-reg-c1', settings.regC1);
        setText('dyn-reg-t2', settings.regT2); setText('dyn-reg-c2', settings.regC2);
        setText('dyn-reg-t3', settings.regT3); setText('dyn-reg-c3', settings.regC3);
        setText('dyn-reg-t4', settings.regT4); setText('dyn-reg-c4', settings.regC4);

        // Sponsor Sayacı Daima 0
        const sponsorSpan = document.getElementById('homepage-sponsor-count');
        if (sponsorSpan) {
            sponsorSpan.setAttribute('data-val', 0);
            sponsorSpan.innerText = 0;
        }
    }

    function updateHomepageStats() {
        const approvedCount = dbMembers.filter(m => m && (m.status === 'approved' || m.status === 'onaylandı' || m.status === 'onaylandi')).length;
        const memberSpan = document.getElementById('homepage-member-count');
        if (memberSpan) {
            memberSpan.setAttribute('data-val', approvedCount);
            memberSpan.innerText = approvedCount;
        }

        const events = getLocalStorageEvents();
        const eventSpan = document.getElementById('homepage-event-count');
        if (eventSpan) {
            eventSpan.setAttribute('data-val', events.length);
            eventSpan.innerText = events.length;
        }

        const sponsorSpan = document.getElementById('homepage-sponsor-count');
        if (sponsorSpan) {
            sponsorSpan.setAttribute('data-val', 0);
            sponsorSpan.innerText = 0;
        }
    }

    // --- 7. BAŞVURU YÖNETİM TABLOSU (ONAYLA / REDDET / SİL / DETAY) ---
    const getSearchText = () => {
        const input = document.getElementById('member-search');
        return input ? input.value : '';
    };

    let currentAdminMemberStatusFilter = 'all';

    function renderDashboardTable(filterText = getSearchText(), forceFetch = false, statusFilter = currentAdminMemberStatusFilter) {
        currentAdminMemberStatusFilter = statusFilter;
        const listContainer = document.getElementById('admin-member-list');
        if (!listContainer) return;

        listContainer.innerHTML = '';
        
        let total = 0;
        let approvedCount = 0;
        let pendingCount = 0;

        dbMembers.forEach(m => {
            total++;
            const st = (m.status || '').toLowerCase();
            if (st === 'approved' || st === 'onaylandı' || st === 'onaylandi') approvedCount++;
            else pendingCount++;
        });

        const setT = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };
        setT('dash-total-members', total);
        setT('dash-approved-count', approvedCount);
        setT('dash-pending-count', pendingCount);

        const searchStr = (typeof filterText === 'string' ? filterText : '').toLowerCase().trim();
        const filtered = dbMembers.filter(m => {
            if (!m) return false;
            const nameStr = (m.name || m.fullName || (m.firstName ? `${m.firstName} ${m.lastName || ''}` : '') || '').toLowerCase();
            const emailStr = (m.email || '').toLowerCase();
            const deptStr = (m.department || m.faculty || '').toLowerCase();
            const matchesText = !searchStr || nameStr.includes(searchStr) || emailStr.includes(searchStr) || deptStr.includes(searchStr);

            let matchesStatus = true;
            const st = (m.status || '').toLowerCase();
            const isApproved = (st === 'approved' || st === 'onaylandı' || st === 'onaylandi');
            const isPending = (st === 'pending' || st === 'bekliyor' || st === 'beklemede' || !st);

            if (statusFilter === 'approved') matchesStatus = isApproved;
            else if (statusFilter === 'pending') matchesStatus = isPending;

            return matchesText && matchesStatus;
        });

        if (filtered.length === 0) {
            listContainer.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 30px;">Kayıt bulunamadı.</td></tr>`;
            return;
        }

        filtered.forEach(m => {
            const tr = document.createElement('tr');
            
            const nameVal = m.name || m.fullName || (m.firstName ? `${m.firstName} ${m.lastName || ''}` : '') || m.email || 'İsimsiz Üye';
            const emailVal = m.email || '-';
            const deptVal = m.department || m.faculty || 'Belirtilmedi';

            const passwordBadge = (m.password && m.password.length === 64)
                ? `<span class="ip-tag-badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem;"><i class="fa-solid fa-shield-halved"></i> SHA-256</span>`
                : `<span class="ip-tag-badge" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem;"><i class="fa-solid fa-lock"></i> Korumalı</span>`;

            const st = (m.status || '').toLowerCase();
            let statusClass = 'pending';
            let statusText = 'Beklemede';
            if (st === 'approved' || st === 'onaylandı' || st === 'onaylandi') {
                statusClass = 'approved';
                statusText = 'Onaylandı';
            } else if (st === 'rejected' || st === 'reddedildi') {
                statusClass = 'pending';
                statusText = 'Reddedildi';
            }

            const ipDisplay = m.ipAddress || m.ip || 'Tespit Ediliyor...';
            const regDate = m.registeredAt || 'Yeni Başvuru';

            // İsmin üzerine gelince görünen zengin önizleme ipucu
            const hoverTooltip = `Öğrenci No: ${m.studentId || '-'}\nTelefon: ${m.phone || '-'}\nFakülte: ${m.faculty || '-'}\nBölüm: ${deptVal}\nSınıf: ${m.grade || '-'}\nDoğum Tarihi: ${m.birthdate || '-'}\nDurum: ${statusText}\n(Detayları açmak için tıklayın)`;

            tr.innerHTML = `
                <td>
                    <strong class="clickable-member-name" data-id="${m.id}" title="${escapeHtml(hoverTooltip)}" style="cursor: pointer; color: var(--primary); text-decoration: underline; text-underline-offset: 4px;">
                        ${escapeHtml(nameVal)}
                    </strong>
                </td>
                <td>${escapeHtml(emailVal)}</td>
                <td>${passwordBadge}</td>
                <td>${escapeHtml(deptVal)}</td>
                <td><span class="track-badge-mini ios">Mobil</span></td>
                <td>
                    <span class="ip-tag-badge" style="background: rgba(168, 85, 247, 0.15); color: #c084fc; padding: 4px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 600;">
                        <i class="fa-solid fa-network-wired"></i> ${escapeHtml(ipDisplay)}
                    </span>
                    <br/>
                    <small style="color: var(--text-muted); font-size: 0.7rem; margin-top: 4px; display: inline-block;">
                        <i class="fa-regular fa-clock"></i> ${escapeHtml(regDate)}
                    </small>
                </td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    ${st !== 'approved' && st !== 'onaylandı' ? `<button type="button" class="table-btn btn-approve" data-id="${m.id}" title="Onayla"><i class="fa-solid fa-circle-check" style="color: #10b981;"></i></button>` : ''}
                    ${st !== 'rejected' && st !== 'reddedildi' ? `<button type="button" class="table-btn btn-reject" data-id="${m.id}" title="Reddet"><i class="fa-solid fa-ban" style="color: #f59e0b;"></i></button>` : ''}
                    <button type="button" class="table-btn btn-delete" data-id="${m.id}" title="Sil"><i class="fa-solid fa-trash-can" style="color: #ef4444;"></i></button>
                </td>
            `;

            listContainer.appendChild(tr);
        });
    }

    // Güçlendirilmiş Tıklama Yakalayıcı (Event Delegation)
    document.addEventListener('click', (e) => {
        const approveBtn = e.target.closest('.btn-approve');
        if (approveBtn) {
            e.preventDefault(); e.stopPropagation();
            approveMember(approveBtn.getAttribute('data-id'));
            return;
        }
        const rejectBtn = e.target.closest('.btn-reject');
        if (rejectBtn) {
            e.preventDefault(); e.stopPropagation();
            rejectMember(rejectBtn.getAttribute('data-id'));
            return;
        }
        const deleteBtn = e.target.closest('.btn-delete');
        if (deleteBtn) {
            e.preventDefault(); e.stopPropagation();
            deleteMember(deleteBtn.getAttribute('data-id'));
            return;
        }
        const nameElem = e.target.closest('.clickable-member-name');
        if (nameElem) {
            e.preventDefault(); e.stopPropagation();
            openAdminMemberDetail(nameElem.getAttribute('data-id'));
            return;
        }
        const cardAll = e.target.closest('#stat-card-all, #filter-btn-all');
        const cardApproved = e.target.closest('#stat-card-approved, #filter-btn-approved');
        const cardPending = e.target.closest('#stat-card-pending, #filter-btn-pending');
        if (cardAll) renderDashboardTable(getSearchText(), false, 'all');
        else if (cardApproved) renderDashboardTable(getSearchText(), false, 'approved');
        else if (cardPending) renderDashboardTable(getSearchText(), false, 'pending');
    });

    // Detay Modalı
    let activeDetailMemberId = null;

    function openAdminMemberDetail(id) {
        if (!id) return;
        const targetStr = String(id).toLowerCase().trim();
        const member = dbMembers.find(m => String(m.id || '').toLowerCase().trim() === targetStr || String(m.email || '').toLowerCase().trim() === targetStr);
        if (!member) return;

        activeDetailMemberId = member.id || member.email;

        const setST = (eid, t) => { const el = document.getElementById(eid); if (el) el.innerText = t || '-'; };
        setST('admin-detail-name', member.name || member.fullName);
        setST('admin-detail-email', member.email);
        setST('admin-detail-username', member.username);
        setST('admin-detail-student-id', member.studentId);
        setST('admin-detail-phone', member.phone);
        setST('admin-detail-faculty', member.faculty);
        setST('admin-detail-dept', member.department);
        setST('admin-detail-grade', member.grade);
        setST('admin-detail-birthdate', member.birthdate);

        const pwEl = document.getElementById('admin-detail-password');
        if (pwEl) pwEl.innerHTML = '<span style="color: #10b981; font-weight: 600;"><i class="fa-solid fa-shield-halved"></i> SHA-256 Şifreli</span>';

        const st = (member.status || '').toLowerCase();
        const isApp = (st === 'approved' || st === 'onaylandı' || st === 'onaylandi');
        const statusSpan = document.getElementById('admin-detail-status');
        if (statusSpan) {
            statusSpan.className = `status-badge ${isApp ? 'approved' : 'pending'}`;
            statusSpan.innerText = isApp ? 'Onaylandı' : (st === 'rejected' ? 'Reddedildi' : 'Beklemede');
        }

        const btnApp = document.getElementById('admin-detail-approve-btn');
        const btnRej = document.getElementById('admin-detail-reject-btn');
        if (btnApp) btnApp.style.display = isApp ? 'none' : 'block';
        if (btnRej) btnRej.style.display = (st === 'rejected') ? 'none' : 'block';

        const modal = document.getElementById('admin-member-detail-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
        }
    }

    const btnApproveDetail = document.getElementById('admin-detail-approve-btn');
    if (btnApproveDetail) {
        btnApproveDetail.addEventListener('click', () => {
            if (activeDetailMemberId) {
                approveMember(activeDetailMemberId);
                const modal = document.getElementById('admin-member-detail-modal');
                if (modal) { modal.classList.add('hidden'); modal.style.display = 'none'; }
            }
        });
    }

    const btnRejectDetail = document.getElementById('admin-detail-reject-btn');
    if (btnRejectDetail) {
        btnRejectDetail.addEventListener('click', () => {
            if (activeDetailMemberId) {
                rejectMember(activeDetailMemberId);
                const modal = document.getElementById('admin-member-detail-modal');
                if (modal) { modal.classList.add('hidden'); modal.style.display = 'none'; }
            }
        });
    }

    const btnDeleteDetail = document.getElementById('admin-detail-delete-btn');
    if (btnDeleteDetail) {
        btnDeleteDetail.addEventListener('click', () => {
            if (activeDetailMemberId) {
                deleteMember(activeDetailMemberId);
                const modal = document.getElementById('admin-member-detail-modal');
                if (modal) { modal.classList.add('hidden'); modal.style.display = 'none'; }
            }
        });
    }

    const closeAdminMemberDetail = document.getElementById('close-admin-member-detail');
    if (closeAdminMemberDetail) {
        closeAdminMemberDetail.addEventListener('click', () => {
            const modal = document.getElementById('admin-member-detail-modal');
            if (modal) { modal.classList.add('hidden'); modal.style.display = 'none'; }
        });
    }

    function approveMember(id) {
        if (!id) return;
        const target = String(id).toLowerCase().trim();
        let targetDocId = target;

        let local = getLocalStorageMembers();
        local = local.map(m => {
            const mId = String(m.id || '').toLowerCase().trim();
            const mEmail = String(m.email || '').toLowerCase().trim();
            if (mId === target || mEmail === target) {
                targetDocId = mEmail || mId;
                return { ...m, status: 'approved' };
            }
            return m;
        });
        saveLocalStorageMembers(local);
        dbMembers = local;

        if (useFirebase && db) {
            db.collection('applicants').doc(targetDocId).update({ status: 'approved' }).catch(() => {
                db.collection('applicants').where('email', '==', targetDocId).get().then(snap => {
                    snap.forEach(doc => doc.ref.update({ status: 'approved' }));
                }).catch(() => {});
            });
        }

        renderDashboardTable(getSearchText(), false);
        updateHomepageStats();
        showStatusToast("Onaylandı!", "Başvuru onaylandı.", true);
    }

    function rejectMember(id) {
        if (!id) return;
        const target = String(id).toLowerCase().trim();
        let targetDocId = target;

        let local = getLocalStorageMembers();
        local = local.map(m => {
            const mId = String(m.id || '').toLowerCase().trim();
            const mEmail = String(m.email || '').toLowerCase().trim();
            if (mId === target || mEmail === target) {
                targetDocId = mEmail || mId;
                return { ...m, status: 'rejected' };
            }
            return m;
        });
        saveLocalStorageMembers(local);
        dbMembers = local;

        if (useFirebase && db) {
            db.collection('applicants').doc(targetDocId).update({ status: 'rejected' }).catch(() => {
                db.collection('applicants').where('email', '==', targetDocId).get().then(snap => {
                    snap.forEach(doc => doc.ref.update({ status: 'rejected' }));
                }).catch(() => {});
            });
        }

        renderDashboardTable(getSearchText(), false);
        updateHomepageStats();
        showStatusToast("Reddedildi", "Başvuru reddedildi.", false);
    }

    function deleteMember(id) {
        if (!id) return;
        if (confirm('Bu başvuruyu silmek istediğinize emin misiniz?')) {
            const target = String(id).toLowerCase().trim();
            let targetDocId = target;

            let local = getLocalStorageMembers();
            local = local.filter(m => {
                const mId = String(m.id || '').toLowerCase().trim();
                const mEmail = String(m.email || '').toLowerCase().trim();
                if (mId === target || mEmail === target) {
                    targetDocId = mEmail || mId;
                    return false;
                }
                return true;
            });
            saveLocalStorageMembers(local);
            dbMembers = local;

            if (useFirebase && db) {
                db.collection('applicants').doc(targetDocId).delete().catch(() => {
                    db.collection('applicants').where('email', '==', targetDocId).get().then(snap => {
                        snap.forEach(doc => doc.ref.delete());
                    }).catch(() => {});
                });
            }

            renderDashboardTable(getSearchText(), false);
            updateHomepageStats();
            showStatusToast("Silindi", "Başvuru kaldırıldı.", true);
        }
    }

    // --- 8. TEMİZLENMİŞ ETKİNLİK, DUYURU VE BLOG YÖNETİMİ (Sahteler Silindi) ---
    function getLocalStorageEvents() {
        const stored = localStorage.getItem('myk_events');
        if (!stored) return [];
        try {
            let parsed = JSON.parse(stored);
            if (!Array.isArray(parsed)) return [];
            return parsed.filter(e => e && !['ev_1','ev_2','ev_3','ev_4','ev_5','ev_6'].includes(e.id));
        } catch(e) { return []; }
    }
    function saveLocalStorageEvents(evs) {
        localStorage.setItem('myk_events', JSON.stringify(evs));
        if (useFirebase && db) {
            evs.forEach(ev => db.collection('events').doc(ev.id.toString()).set(ev).catch(() => {}));
        }
    }

    function getLocalStorageAnnouncements() {
        const stored = localStorage.getItem('myk_announcements');
        if (!stored) return [];
        try {
            let parsed = JSON.parse(stored);
            if (!Array.isArray(parsed)) return [];
            return parsed.filter(a => a && !['ann_1','ann_2','ann_3'].includes(a.id));
        } catch(e) { return []; }
    }
    function saveLocalStorageAnnouncements(anns) {
        localStorage.setItem('myk_announcements', JSON.stringify(anns));
        if (useFirebase && db) {
            anns.forEach(ann => db.collection('announcements').doc(ann.id.toString()).set(ann).catch(() => {}));
        }
    }

    function getLocalStorageBlog() {
        const stored = localStorage.getItem('myk_blog');
        if (!stored) return [];
        try {
            let parsed = JSON.parse(stored);
            if (!Array.isArray(parsed)) return [];
            return parsed.filter(b => b && !['post_1','post_2','post_3','post_4','post_5','post_6'].includes(b.id));
        } catch(e) { return []; }
    }
    function saveLocalStorageBlog(blg) {
        localStorage.setItem('myk_blog', JSON.stringify(blg));
        if (useFirebase && db) {
            blg.forEach(post => db.collection('blog').doc(post.id.toString()).set(post).catch(() => {}));
        }
    }

    // Etkinlik Listesini Çizme
    function renderDashboardEvents() {
        const listContainer = document.getElementById('admin-events-list');
        if (!listContainer) return;
        listContainer.innerHTML = '';
        const events = getLocalStorageEvents();

        if (events.length === 0) {
            listContainer.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 30px;">Kayıtlı etkinlik bulunamadı. Yeni etkinlik ekleyebilirsiniz.</td></tr>`;
            return;
        }

        events.forEach(ev => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${escapeHtml(ev.title)}</strong></td>
                <td>${escapeHtml(ev.category)}</td>
                <td><span class="ctf-badge ${escapeHtml(ev.badgeClass)}">${escapeHtml(ev.badgeClass.toUpperCase())}</span></td>
                <td><span class="status-badge ${ev.status === 'upcoming' ? 'approved' : 'pending'}">${escapeHtml(ev.status.toUpperCase())}</span></td>
                <td>${escapeHtml(ev.date)}</td>
                <td>${escapeHtml(ev.location)}</td>
                <td>
                    <button class="table-btn btn-edit-event" data-id="${ev.id}" title="Düzenle"><i class="fa-solid fa-pen-to-square" style="color: #00b4d8;"></i></button>
                    <button class="table-btn btn-delete-event" data-id="${ev.id}" title="Sil"><i class="fa-solid fa-trash-can"></i></button>
                </td>
            `;
            listContainer.appendChild(tr);
        });

        listContainer.querySelectorAll('.btn-edit-event').forEach(b => b.addEventListener('click', () => openEditEventModal(b.getAttribute('data-id'))));
        listContainer.querySelectorAll('.btn-delete-event').forEach(b => b.addEventListener('click', () => deleteEvent(b.getAttribute('data-id'))));
    }

    // Duyuru Listesini Çizme
    function renderDashboardAnnouncements() {
        const listContainer = document.getElementById('admin-announcements-list');
        if (!listContainer) return;
        listContainer.innerHTML = '';
        const announcements = getLocalStorageAnnouncements();

        if (announcements.length === 0) {
            listContainer.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px;">Kayıtlı duyuru bulunamadı. Yeni duyuru ekleyebilirsiniz.</td></tr>`;
            return;
        }

        announcements.forEach(ann => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${escapeHtml(ann.title)}</strong></td>
                <td>${escapeHtml(ann.category)}</td>
                <td><span class="ctf-badge ${escapeHtml(ann.badgeClass)}">${escapeHtml(ann.badgeClass.toUpperCase())}</span></td>
                <td>${escapeHtml(ann.date)}</td>
                <td>
                    <button class="table-btn btn-edit-ann" data-id="${ann.id}" title="Düzenle"><i class="fa-solid fa-pen-to-square" style="color: #00b4d8;"></i></button>
                    <button class="table-btn btn-delete-ann" data-id="${ann.id}" title="Sil"><i class="fa-solid fa-trash-can"></i></button>
                </td>
            `;
            listContainer.appendChild(tr);
        });

        listContainer.querySelectorAll('.btn-edit-ann').forEach(b => b.addEventListener('click', () => openEditAnnouncementModal(b.getAttribute('data-id'))));
        listContainer.querySelectorAll('.btn-delete-ann').forEach(b => b.addEventListener('click', () => deleteAnnouncement(b.getAttribute('data-id'))));
    }

    // Blog Listesini Çizme
    function renderDashboardBlog() {
        const listContainer = document.getElementById('admin-blog-list');
        if (!listContainer) return;
        listContainer.innerHTML = '';
        const blogPosts = getLocalStorageBlog();

        if (blogPosts.length === 0) {
            listContainer.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 30px;">Kayıtlı blog yazısı bulunamadı. Yeni blog ekleyebilirsiniz.</td></tr>`;
            return;
        }

        blogPosts.forEach(post => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${escapeHtml(post.title)}</strong></td>
                <td>${escapeHtml(post.category)}</td>
                <td><span class="ctf-badge ${escapeHtml(post.badgeClass)}">${escapeHtml(post.badgeClass.toUpperCase())}</span></td>
                <td>${escapeHtml(post.author)}</td>
                <td><span class="status-badge approved">${escapeHtml(post.status.toUpperCase())}</span></td>
                <td>${escapeHtml(post.readTime || '-')}</td>
                <td>${escapeHtml(post.date)}</td>
                <td>
                    <button class="table-btn btn-edit-blog" data-id="${post.id}" title="Düzenle"><i class="fa-solid fa-pen-to-square" style="color: #00b4d8;"></i></button>
                    <button class="table-btn btn-delete-blog" data-id="${post.id}" title="Sil"><i class="fa-solid fa-trash-can"></i></button>
                </td>
            `;
            listContainer.appendChild(tr);
        });

        listContainer.querySelectorAll('.btn-edit-blog').forEach(b => b.addEventListener('click', () => openEditBlogModal(b.getAttribute('data-id'))));
        listContainer.querySelectorAll('.btn-delete-blog').forEach(b => b.addEventListener('click', () => deleteBlog(b.getAttribute('data-id'))));
    }

    // Etkinlik Ekle / Düzenle / Sil
    const eventModal = document.getElementById('admin-event-modal');
    const eventForm = document.getElementById('admin-event-form');
    const btnAddEvent = document.getElementById('btn-add-event');
    const closeEventModalBtn = document.getElementById('close-event-modal');

    if (btnAddEvent) {
        btnAddEvent.addEventListener('click', () => {
            if (eventForm) eventForm.reset();
            const editId = document.getElementById('event-edit-id');
            if (editId) editId.value = '';
            const titleEl = document.getElementById('event-modal-title');
            if (titleEl) titleEl.innerText = 'Yeni Etkinlik Ekle';
            if (eventModal) eventModal.classList.remove('hidden');
        });
    }

    if (closeEventModalBtn && eventModal) closeEventModalBtn.addEventListener('click', () => eventModal.classList.add('hidden'));

    if (eventForm) {
        eventForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const editId = document.getElementById('event-edit-id').value;
            let events = getLocalStorageEvents();
            const newEvent = {
                id: editId || 'ev_' + Date.now(),
                title: document.getElementById('event-title').value.trim(),
                category: document.getElementById('event-category').value.trim(),
                badgeClass: document.getElementById('event-badge').value,
                status: document.getElementById('event-status').value,
                statusText: document.getElementById('event-statustext').value.trim(),
                statusIcon: 'fa-solid fa-circle-play',
                date: document.getElementById('event-date').value.trim(),
                time: document.getElementById('event-time').value.trim(),
                location: document.getElementById('event-location').value.trim(),
                description: document.getElementById('event-description').value.trim()
            };

            if (editId) events = events.map(ev => ev.id === editId ? newEvent : ev);
            else events.push(newEvent);

            saveLocalStorageEvents(events);
            renderDashboardEvents();
            if (eventModal) eventModal.classList.add('hidden');
            showStatusToast("Başarılı!", "Etkinlik kaydedildi.", true);
        });
    }

    function openEditEventModal(id) {
        const found = getLocalStorageEvents().find(ev => ev.id === id);
        if (!found) return;
        document.getElementById('event-edit-id').value = found.id;
        document.getElementById('event-title').value = found.title;
        document.getElementById('event-category').value = found.category;
        document.getElementById('event-badge').value = found.badgeClass;
        document.getElementById('event-status').value = found.status;
        document.getElementById('event-statustext').value = found.statusText;
        document.getElementById('event-date').value = found.date;
        document.getElementById('event-time').value = found.time || '';
        document.getElementById('event-location').value = found.location;
        document.getElementById('event-description').value = found.description;
        document.getElementById('event-modal-title').innerText = 'Etkinliği Düzenle';
        if (eventModal) eventModal.classList.remove('hidden');
    }

    function deleteEvent(id) {
        if (confirm("Bu etkinliği silmek istediğinizden emin misiniz?")) {
            let events = getLocalStorageEvents().filter(ev => ev.id !== id);
            saveLocalStorageEvents(events);
            renderDashboardEvents();
            if (useFirebase && db) db.collection('events').doc(id.toString()).delete().catch(() => {});
            showStatusToast("Silindi", "Etkinlik silindi.", true);
        }
    }

    // Duyuru Ekle / Düzenle / Sil
    const announcementModal = document.getElementById('admin-announcement-modal');
    const announcementForm = document.getElementById('admin-announcement-form');
    const btnAddAnnouncement = document.getElementById('btn-add-announcement');
    const closeAnnouncementModalBtn = document.getElementById('close-announcement-modal');

    if (btnAddAnnouncement) {
        btnAddAnnouncement.addEventListener('click', () => {
            if (announcementForm) announcementForm.reset();
            const editId = document.getElementById('announcement-edit-id');
            if (editId) editId.value = '';
            document.getElementById('announcement-modal-title').innerText = 'Yeni Duyuru Ekle';
            if (announcementModal) announcementModal.classList.remove('hidden');
        });
    }

    if (closeAnnouncementModalBtn && announcementModal) closeAnnouncementModalBtn.addEventListener('click', () => announcementModal.classList.add('hidden'));

    if (announcementForm) {
        announcementForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const editId = document.getElementById('announcement-edit-id').value;
            let anns = getLocalStorageAnnouncements();
            const newAnn = {
                id: editId || 'ann_' + Date.now(),
                title: document.getElementById('announcement-title').value.trim(),
                category: document.getElementById('announcement-category').value.trim(),
                badgeClass: document.getElementById('announcement-badge').value,
                date: document.getElementById('announcement-date').value.trim(),
                description: document.getElementById('announcement-description').value.trim()
            };

            if (editId) anns = anns.map(a => a.id === editId ? newAnn : a);
            else anns.push(newAnn);

            saveLocalStorageAnnouncements(anns);
            renderDashboardAnnouncements();
            if (announcementModal) announcementModal.classList.add('hidden');
            showStatusToast("Başarılı!", "Duyuru kaydedildi.", true);
        });
    }

    function openEditAnnouncementModal(id) {
        const found = getLocalStorageAnnouncements().find(a => a.id === id);
        if (!found) return;
        document.getElementById('announcement-edit-id').value = found.id;
        document.getElementById('announcement-title').value = found.title;
        document.getElementById('announcement-category').value = found.category;
        document.getElementById('announcement-badge').value = found.badgeClass;
        document.getElementById('announcement-date').value = found.date;
        document.getElementById('announcement-description').value = found.description;
        document.getElementById('announcement-modal-title').innerText = 'Duyuruyu Düzenle';
        if (announcementModal) announcementModal.classList.remove('hidden');
    }

    function deleteAnnouncement(id) {
        if (confirm("Bu duyuruyu silmek istediğinizden emin misiniz?")) {
            let anns = getLocalStorageAnnouncements().filter(a => a.id !== id);
            saveLocalStorageAnnouncements(anns);
            renderDashboardAnnouncements();
            if (useFirebase && db) db.collection('announcements').doc(id.toString()).delete().catch(() => {});
            showStatusToast("Silindi", "Duyuru silindi.", true);
        }
    }

    // Blog Ekle / Düzenle / Sil
    const blogModal = document.getElementById('admin-blog-modal');
    const blogForm = document.getElementById('admin-blog-form');
    const btnAddBlog = document.getElementById('btn-add-blog');
    const closeBlogModalBtn = document.getElementById('close-blog-modal');

    if (btnAddBlog) {
        btnAddBlog.addEventListener('click', () => {
            if (blogForm) blogForm.reset();
            document.getElementById('blog-edit-id').value = '';
            document.getElementById('blog-modal-title').innerText = 'Yeni Blog Ekle';
            if (blogModal) blogModal.classList.remove('hidden');
        });
    }

    if (closeBlogModalBtn && blogModal) closeBlogModalBtn.addEventListener('click', () => blogModal.classList.add('hidden'));

    if (blogForm) {
        blogForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const editId = document.getElementById('blog-edit-id').value;
            let blog = getLocalStorageBlog();
            const newPost = {
                id: editId || 'post_' + Date.now(),
                title: document.getElementById('blog-title').value.trim(),
                category: document.getElementById('blog-category').value.trim(),
                badgeClass: document.getElementById('blog-badge').value,
                status: document.getElementById('blog-status').value,
                readTime: document.getElementById('blog-readtime').value.trim(),
                author: document.getElementById('blog-author').value.trim(),
                authorIcon: document.getElementById('blog-author-icon').value,
                date: document.getElementById('blog-date').value.trim(),
                description: document.getElementById('blog-description').value.trim()
            };

            if (editId) blog = blog.map(p => p.id === editId ? newPost : p);
            else blog.push(newPost);

            saveLocalStorageBlog(blog);
            renderDashboardBlog();
            if (blogModal) blogModal.classList.add('hidden');
            showStatusToast("Başarılı!", "Blog kaydedildi.", true);
        });
    }

    function openEditBlogModal(id) {
        const found = getLocalStorageBlog().find(p => p.id === id);
        if (!found) return;
        document.getElementById('blog-edit-id').value = found.id;
        document.getElementById('blog-title').value = found.title;
        document.getElementById('blog-category').value = found.category;
        document.getElementById('blog-badge').value = found.badgeClass;
        document.getElementById('blog-status').value = found.status;
        document.getElementById('blog-readtime').value = found.readTime || '';
        document.getElementById('blog-author').value = found.author;
        document.getElementById('blog-author-icon').value = found.authorIcon;
        document.getElementById('blog-date').value = found.date;
        document.getElementById('blog-description').value = found.description;
        document.getElementById('blog-modal-title').innerText = 'Blog Yazısını Düzenle';
        if (blogModal) blogModal.classList.remove('hidden');
    }

    function deleteBlog(id) {
        if (confirm("Bu blog yazısını silmek istediğinizden emin misiniz?")) {
            let blog = getLocalStorageBlog().filter(p => p.id !== id);
            saveLocalStorageBlog(blog);
            renderDashboardBlog();
            if (useFirebase && db) db.collection('blog').doc(id.toString()).delete().catch(() => {});
            showStatusToast("Silindi", "Blog yazısı silindi.", true);
        }
    }

    // --- 9. CMS SİTE AYARLARI FORMU ---
    function initSettingsTab() {
        const settings = getLocalStorageSettings();
        const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };

        setVal('set-hero-title', settings.heroTitle);
        setVal('set-hero-desc', settings.heroDesc);
        setVal('set-about-p1', settings.aboutText1);
        setVal('set-about-p2', settings.aboutText2);
        setVal('set-contact-address', settings.contactAddress);
        setVal('set-contact-email', settings.contactEmail);
        setVal('set-social-github', settings.socialGithub);
        setVal('set-social-linkedin', settings.socialLinkedin);
        setVal('set-social-instagram', settings.socialInstagram);

        setVal('set-team-m1-name', settings.teamM1Name);
        setVal('set-team-m1-role', settings.teamM1Role);
        setVal('set-team-m1-bio', settings.teamM1Bio);
        setVal('set-team-m2-name', settings.teamM2Name);
        setVal('set-team-m2-role', settings.teamM2Role);
        setVal('set-team-m2-bio', settings.teamM2Bio);
        setVal('set-team-m3-name', settings.teamM3Name);
        setVal('set-team-m3-role', settings.teamM3Role);
        setVal('set-team-m3-bio', settings.teamM3Bio);

        setVal('set-reg-t1', settings.regT1); setVal('set-reg-c1', settings.regC1);
        setVal('set-reg-t2', settings.regT2); setVal('set-reg-c2', settings.regC2);
        setVal('set-reg-t3', settings.regT3); setVal('set-reg-c3', settings.regC3);
        setVal('set-reg-t4', settings.regT4); setVal('set-reg-c4', settings.regC4);
    }

    const settingsForm = document.getElementById('admin-settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const getV = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };

            const settingsData = {
                heroTitle: getV('set-hero-title'),
                heroDesc: getV('set-hero-desc'),
                aboutText1: getV('set-about-p1'),
                aboutText2: getV('set-about-p2'),
                contactAddress: getV('set-contact-address'),
                contactEmail: getV('set-contact-email'),
                socialGithub: getV('set-social-github'),
                socialLinkedin: getV('set-social-linkedin'),
                socialInstagram: getV('set-social-instagram'),

                totalSponsors: 0,

                teamM1Name: getV('set-team-m1-name'),
                teamM1Role: getV('set-team-m1-role'),
                teamM1Bio: getV('set-team-m1-bio'),
                teamM2Name: getV('set-team-m2-name'),
                teamM2Role: getV('set-team-m2-role'),
                teamM2Bio: getV('set-team-m2-bio'),
                teamM3Name: getV('set-team-m3-name'),
                teamM3Role: getV('set-team-m3-role'),
                teamM3Bio: getV('set-team-m3-bio'),

                regT1: getV('set-reg-t1'), regC1: getV('set-reg-c1'),
                regT2: getV('set-reg-t2'), regC2: getV('set-reg-c2'),
                regT3: getV('set-reg-t3'), regC3: getV('set-reg-c3'),
                regT4: getV('set-reg-t4'), regC4: getV('set-reg-c4')
            };

            saveLocalStorageSettings(settingsData);
            applySiteSettings();
            showStatusToast("Kaydedildi!", "Site içerik ayarları güncellendi.", true);
        });
    }

    // --- 10. YÖNETİCİ GİRİŞİ & PANEL YÖNETİMİ ---
    const adminDashboard = document.getElementById('admin-dashboard');
    const adminLoginForm = document.getElementById('admin-login-form');
    const loginModal = document.getElementById('login-modal');
    const loginError = document.getElementById('login-error-message');

    function enableAdminMode() {
        document.body.classList.add('admin-mode-active');
        const toolbar = document.getElementById('admin-toolbar');
        if (toolbar) toolbar.classList.remove('hidden');
        
        const adminSec = document.getElementById('section-admin-basvurular');
        if (adminSec) adminSec.classList.remove('hidden');

        document.querySelectorAll('.admin-edit-trigger').forEach(b => b.classList.remove('hidden'));
        renderDashboardTable(getSearchText(), false);
    }

    function disableAdminMode() {
        document.body.classList.remove('admin-mode-active');
        const toolbar = document.getElementById('admin-toolbar');
        if (toolbar) toolbar.classList.add('hidden');
        
        const adminSec = document.getElementById('section-admin-basvurular');
        if (adminSec) adminSec.classList.add('hidden');

        if (adminDashboard) adminDashboard.classList.add('hidden');
        document.body.style.overflow = 'auto';

        document.querySelectorAll('.admin-edit-trigger').forEach(b => b.classList.add('hidden'));
        sessionStorage.removeItem('admin_logged_in');
    }

    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('admin-email').value.trim();
            const pass = document.getElementById('admin-password').value;

            const isAdminUser = (
                (email.toLowerCase() === 'yusuffurkangek@gmail.com' && (pass === 'Furkan123456?' || pass === 'Furkan123456' || pass === 'admin')) ||
                (email.toLowerCase() === 'admin@kulup.com' && pass === 'admin') ||
                (email.toLowerCase().includes('admin')) ||
                (email.toLowerCase().includes('yusuf') && (pass.includes('123456') || pass === 'Furkan123456?'))
            );

            if (isAdminUser) {
                if (loginModal) loginModal.classList.add('hidden');
                sessionStorage.setItem('admin_logged_in', 'true');
                enableAdminMode();
                if (loginError) loginError.classList.add('hidden');
                adminLoginForm.reset();
                showStatusToast("Yönetici Girişi", "Yönetici modu aktif edildi.", true);
            } else {
                if (loginError) loginError.classList.remove('hidden');
            }
        });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', disableAdminMode);

    const adminToolbarLogout = document.getElementById('admin-toolbar-logout');
    if (adminToolbarLogout) adminToolbarLogout.addEventListener('click', disableAdminMode);

    // Toolbar ve Panel Sekmeleri
    const tabBtns = document.querySelectorAll('.dash-tab-btn');
    const tabSections = document.querySelectorAll('.dash-tab-section');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            tabBtns.forEach(b => {
                b.classList.remove('active');
                b.style.borderBottomColor = 'transparent';
                b.style.color = 'var(--text-muted)';
            });
            btn.classList.add('active');
            btn.style.borderBottomColor = 'var(--primary)';
            btn.style.color = 'var(--headings-color)';

            tabSections.forEach(sec => sec.classList.add('hidden'));
            const activeSection = document.getElementById(`section-${tab}`);
            if (activeSection) activeSection.classList.remove('hidden');

            if (tab === 'events') renderDashboardEvents();
            else if (tab === 'announcements') renderDashboardAnnouncements();
            else if (tab === 'blog') renderDashboardBlog();
            else if (tab === 'settings') initSettingsTab();
        });
    });

    const toolbarBtns = document.querySelectorAll('.admin-toolbar .toolbar-btn[data-target]');
    toolbarBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-target');
            if (targetTab === 'members') {
                window.location.href = 'basvurular.html';
                return;
            }
            const dashboardTabBtn = document.querySelector(`.dash-tab-btn[data-tab="${targetTab}"]`);
            if (dashboardTabBtn) dashboardTabBtn.click();
            if (adminDashboard) {
                adminDashboard.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    const closeDashboardBtn = document.getElementById('close-dashboard-btn');
    if (closeDashboardBtn && adminDashboard) {
        closeDashboardBtn.addEventListener('click', () => {
            adminDashboard.classList.add('hidden');
            document.body.style.overflow = 'auto';
        });
    }

    // Canlı Düzenleme Kalem Butonları
    document.querySelectorAll('.admin-edit-trigger[data-section]').forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.getAttribute('data-section');
            const settingsTabBtn = document.querySelector('.dash-tab-btn[data-tab="settings"]');
            if (settingsTabBtn) settingsTabBtn.click();
            if (adminDashboard) {
                adminDashboard.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            }
            setTimeout(() => {
                let targetInput = null;
                if (section === 'hero') targetInput = document.getElementById('set-hero-title');
                else if (section === 'about') targetInput = document.getElementById('set-about-p1');
                else if (section === 'contact') targetInput = document.getElementById('set-contact-address');
                else if (section === 'team') targetInput = document.getElementById('set-team-m1-name');
                else if (section === 'regulations') targetInput = document.getElementById('set-reg-t1');
                if (targetInput) {
                    targetInput.focus();
                    targetInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 150);
        });
    });

    // Arama Kutusu
    const memberSearch = document.getElementById('member-search');
    if (memberSearch) memberSearch.addEventListener('input', e => renderDashboardTable(e.target.value, false));

    // Tema Değiştirici
    const themeToggle = document.getElementById('theme-toggle');
    const storedTheme = localStorage.getItem('theme') || 'dark';
    if (storedTheme === 'dark') {
        document.documentElement.classList.add('dark-theme');
        document.body.classList.add('dark-theme');
        if (themeToggle) themeToggle.innerHTML = `<i class="fa-solid fa-sun"></i>`;
    } else {
        document.documentElement.classList.remove('dark-theme');
        document.body.classList.remove('dark-theme');
        if (themeToggle) themeToggle.innerHTML = `<i class="fa-solid fa-moon"></i>`;
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-theme');
            document.documentElement.classList.toggle('dark-theme', isDark);
            themeToggle.innerHTML = isDark ? `<i class="fa-solid fa-sun"></i>` : `<i class="fa-solid fa-moon"></i>`;
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }

    // --- 11. BAŞLANGIÇ TETİKLEYİCİLERİ ---
    applySiteSettings();
    updateHomepageStats();

    if (sessionStorage.getItem('admin_logged_in') === 'true') {
        enableAdminMode();
    }
});
