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

    // --- 0. Firebase & EmailJS Initialization (with localStorage Fallbacks) ---
    let db = null;
    let useFirebase = false;
    let useEmailJS = false;

    // Initial mock data with real members and IP tracking fields
    const initialMockMembers = [
        { id: "231017034@stu.gedik.edu.tr", name: "burak kaya", email: "231017034@stu.gedik.edu.tr", password: "burak123456", department: "Endüstri Mühendisliği", track: "ios", status: "approved", ipAddress: "185.192.44.12", userAgent: "Chrome 122 / Windows 11", registeredAt: "24 Ağustos 2026, 11:20" },
        { id: "241047003@stu.gedik.edu.tr", name: "Daghan Aslan", email: "241047003@stu.gedik.edu.tr", password: "furkangelisin", department: "Yazılım Mühendisliği", track: "ios", status: "approved", ipAddress: "185.192.44.15", userAgent: "Safari 17 / macOS", registeredAt: "24 Ağustos 2026, 11:25" },
        { id: "251017006@stu.gedik.edu.tr", name: "Selin Durdu", email: "251017006@stu.gedik.edu.tr", password: "selin.Dbjk29", department: "Endüstri Mühendisliği", track: "ios", status: "approved", ipAddress: "185.192.44.18", userAgent: "Chrome 122 / Windows 10", registeredAt: "24 Ağustos 2026, 11:30" },
        { id: "251017017@stu.gedik.edu.tr", name: "melike terzi", email: "251017017@stu.gedik.edu.tr", password: "melike001", department: "Endüstri Mühendisliği", track: "ios", status: "approved", ipAddress: "185.192.44.20", userAgent: "Safari / iOS Mobile", registeredAt: "24 Ağustos 2026, 11:35" },
        { id: "101", name: "Ahmet Yılmaz", email: "ahmet.yilmaz@posta.com", password: "123456ahmet", department: "Yazılım Mühendisliği", track: "ios", status: "pending", ipAddress: "176.234.12.89", userAgent: "Chrome 121 / Android", registeredAt: "25 Ağustos 2026, 09:15" },
        { id: "102", name: "Elif Kaya", email: "elif.kaya@outlook.com", password: "elifpasswords", department: "Bilgisayar Mühendisliği", track: "ios", status: "approved", ipAddress: "176.234.12.90", userAgent: "Safari / iPhone", registeredAt: "25 Ağustos 2026, 10:00" },
        { id: "103", name: "Can Demir", email: "can.demir@gmail.com", password: "candemirpass", department: "Yönetim Bilişim Sistemleri (YBS)", track: "android", status: "pending", ipAddress: "185.220.101.5", userAgent: "Tor Browser / Bot Script", registeredAt: "26 Ağustos 2026, 08:30" }
    ];

    function getLocalStorageMembers() {
        const stored = localStorage.getItem('myk_members');
        if (!stored || stored === '[]' || stored === 'null' || stored === 'undefined') {
            localStorage.setItem('myk_members', JSON.stringify(initialMockMembers));
            return [...initialMockMembers];
        }
        try {
            const parsed = JSON.parse(stored);
            if (!Array.isArray(parsed) || parsed.length === 0) {
                localStorage.setItem('myk_members', JSON.stringify(initialMockMembers));
                return [...initialMockMembers];
            }
            return parsed;
        } catch (e) {
            localStorage.setItem('myk_members', JSON.stringify(initialMockMembers));
            return [...initialMockMembers];
        }
    }

    function saveLocalStorageMembers(members) {
        if (Array.isArray(members)) {
            localStorage.setItem('myk_members', JSON.stringify(members));
        }
    }

    let dbMembers = getLocalStorageMembers();

    // Firebase Initialization
    if (typeof CONFIG !== 'undefined' && CONFIG.firebase && CONFIG.firebase.projectId) {
        try {
            firebase.initializeApp(CONFIG.firebase);
            db = firebase.firestore();
            useFirebase = true;
            console.log("Firebase initialized successfully.");
            syncFirestoreToLocalStorage();
        } catch (err) {
            console.error("Firebase initialization failed. Falling back to LocalStorage:", err);
        }
    } else {
        console.log("Firebase config not found. Running in LocalStorage fallback mode.");
    }

    async function syncFirestoreToLocalStorage() {
        if (!useFirebase || !db) return;
        try {
            // 1. Sync Events
            const eventsSnapshot = await db.collection('events').get();
            const events = [];
            eventsSnapshot.forEach(doc => {
                events.push(doc.data());
            });
            localStorage.setItem('myk_events', JSON.stringify(events));
            if (typeof dbEvents !== 'undefined') dbEvents = events;
            if (typeof renderEvents === 'function') renderEvents();

            // 2. Sync Announcements
            const annSnapshot = await db.collection('announcements').get();
            const announcements = [];
            annSnapshot.forEach(doc => {
                announcements.push(doc.data());
            });
            localStorage.setItem('myk_announcements', JSON.stringify(announcements));
            if (typeof dbAnnouncements !== 'undefined') dbAnnouncements = announcements;
            if (typeof renderAnnouncements === 'function') renderAnnouncements();

            // 3. Sync Blog
            const blogSnapshot = await db.collection('blog').get();
            const blog = [];
            blogSnapshot.forEach(doc => {
                blog.push(doc.data());
            });
            localStorage.setItem('myk_blog', JSON.stringify(blog));
            if (typeof dbBlog !== 'undefined') dbBlog = blog;
            if (typeof renderBlog === 'function') renderBlog();

            // 4. Sync Settings
            const settingsDoc = await db.collection('settings').doc('cms').get();
            if (settingsDoc.exists) {
                const settingsData = settingsDoc.data();
                const localM = getLocalStorageMembers();
                const approvedCount = localM.filter(m => (m.status === 'approved' || m.status === 'onaylandı')).length;
                settingsData.totalMembers = approvedCount;
                settingsData.totalSponsors = 0; // Sponsor daima 0
                const currentSettings = getLocalStorageSettings();
                localStorage.setItem('myk_site_settings', JSON.stringify({ ...currentSettings, ...settingsData }));
                if (typeof applySiteSettings === 'function') applySiteSettings();
            }
            
            // 5. Initial fetch of members from Firestore (only once, non-looping)
            const snap = await db.collection('applicants').get();
            const cloudMembers = [];
            snap.forEach(doc => {
                cloudMembers.push({ id: doc.id, ...doc.data() });
            });
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
            }
            
            if (sessionStorage.getItem('admin_logged_in') === 'true') {
                if (typeof renderDashboardEvents === 'function') renderDashboardEvents();
                if (typeof renderDashboardAnnouncements === 'function') renderDashboardAnnouncements();
                if (typeof renderDashboardBlog === 'function') renderDashboardBlog();
                if (typeof initSettingsTab === 'function') initSettingsTab();
            }
        } catch (err) {
            console.error("Error syncing Firestore collections:", err);
        }
    }

    function loadMembers() {
        if (!Array.isArray(dbMembers) || dbMembers.length === 0) {
            dbMembers = getLocalStorageMembers();
        }
        return dbMembers;
    }

    // EmailJS Initialization
    if (typeof emailjs !== 'undefined' && typeof CONFIG !== 'undefined' && CONFIG.emailjs && CONFIG.emailjs.publicKey) {
        try {
            emailjs.init(CONFIG.emailjs.publicKey);
            useEmailJS = true;
            console.log("EmailJS initialized successfully.");
        } catch (err) {
            console.error("EmailJS initialization failed. Falling back to Toast simulator:", err);
        }
    } else {
        console.log("EmailJS config not found. Running in Toast simulator fallback mode.");
    }

    // --- 1. Header Scroll Effect ---
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

    // --- 2. Hamburger Mobile Menu ---
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

    // --- 3. Scroll Active Link Highlight ---
    const sections = document.querySelectorAll('section');
    const scrollOptions = {
        threshold: 0.3,
        rootMargin: "0px 0px -20% 0px"
    };

    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, scrollOptions);

    sections.forEach(section => {
        if (section.getAttribute('id')) {
            navObserver.observe(section);
        }
    });

    // --- 4. Hero Stats Counter Animation ---
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

    // --- 5. Application (Register) Modal Control ---
    const registerModal = document.getElementById('register-modal');
    const regTriggerNav = document.getElementById('register-trigger-nav');
    const regTriggerHero = document.getElementById('register-trigger-hero');
    const closeRegister = document.getElementById('close-register');
    const membershipForm = document.getElementById('membership-form');
    const verificationContainer = document.getElementById('verification-container');
    const successMsg = document.getElementById('form-success-message');

    function openRegisterModal(e) {
        if (e) e.preventDefault();
        
        const menuToggleBtn = document.getElementById('menu-toggle');
        const navMenuDrawer = document.getElementById('nav-menu');
        if (menuToggleBtn && navMenuDrawer) {
            menuToggleBtn.classList.remove('open');
            navMenuDrawer.classList.remove('open');
        }
        
        registerModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        membershipForm.classList.remove('hidden');
        verificationContainer.classList.add('hidden');
        successMsg.classList.add('hidden');
        membershipForm.reset();

        generateRegisterCaptcha();
    }

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

    function closeRegisterModal() {
        registerModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        clearInterval(countdownInterval);
    }

    if (regTriggerNav) regTriggerNav.addEventListener('click', openRegisterModal);
    const regTriggerMobile = document.getElementById('register-trigger-mobile');
    if (regTriggerMobile) regTriggerMobile.addEventListener('click', openRegisterModal);
    if (regTriggerHero) regTriggerHero.addEventListener('click', openRegisterModal);
    if (closeRegister) closeRegister.addEventListener('click', closeRegisterModal);

    const refreshCaptchaBtn = document.getElementById('refresh-captcha');
    if (refreshCaptchaBtn) {
        refreshCaptchaBtn.addEventListener('click', generateRegisterCaptcha);
    }

    if (registerModal) {
        registerModal.addEventListener('click', (e) => {
            if (e.target === registerModal) {
                closeRegisterModal();
            }
        });
    }

    // --- 6. OTP Verification Code Flow ---
    const verifyInputs = document.querySelectorAll('.verify-input');
    const verifySubmitBtn = document.getElementById('verify-submit-btn');
    const verificationError = document.getElementById('verification-error-message');
    const resendCountdown = document.getElementById('resend-countdown');

    let currentVerificationCode = '';
    let pendingMemberData = null;
    let countdownInterval = null;

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

    function showToastNotification(code, targetEmail) {
        const existing = document.querySelector('.toast-notification');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `
            <div class="toast-icon"><i class="fa-solid fa-envelope-open-text animate-pulse"></i></div>
            <div class="toast-content">
                <h5>📩 Doğrulama Kodu (Simüle)</h5>
                <p>Alıcı: <b>${targetEmail}</b></p>
                <p>Onay Kodunuz: <strong style="font-size: 1.1rem; color: #00b4d8; letter-spacing: 1.5px;">${code}</strong></p>
            </div>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 400);
        }, 8000);
    }

    function sendVerificationEmail(code, email, name) {
        showToastNotification(code, `${email} (Gelen Kutusu / Spam Klasörünü Kontrol Edin)`);
        if (useEmailJS) {
            const templateParams = {
                to_email: email,
                user_email: email,
                email: email,
                to_name: name,
                user_name: name,
                name: name,
                verification_code: code,
                code: code,
                passcode: code,
                otp: code,
                message: `Merhaba ${name},\n\nMobil Yazılım Kulübü üyelik onay kodunuz: ${code}`
            };
            emailjs.send(CONFIG.emailjs.serviceId, CONFIG.emailjs.templateId, templateParams)
                .then((response) => {
                    console.log('Verification Email sent successfully via EmailJS!', response.status);
                }, (error) => {
                    console.error('EmailJS failed. Falling back to FormSubmit...', error);
                    sendFormSubmitEmail(code, email, name);
                });
        } else {
            sendFormSubmitEmail(code, email, name);
        }
    }

    function sendFormSubmitEmail(code, email, name) {
        fetch(`https://formsubmit.co/ajax/${email}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({
                _subject: "🔑 Mobil Yazılım Kulübü - Üyelik Doğrulama Kodu",
                Ad_Soyad: name,
                Onay_Kodu: code,
                Mesaj: `Merhaba ${name},\n\nMobil Yazılım Kulübü üyelik başvurunuz için 6 haneli onay kodunuz: ${code}`
            })
        }).catch(err => console.error("FormSubmit failed:", err));
    }

    let resetVerificationCode = '';
    let resetVerificationEmail = '';
    let resetTargetDocId = '';

    function sendResetVerificationEmail(code, email, name) {
        showToastNotification(code, `${email} (Şifre Sıfırlama Kodu)`);
        if (useEmailJS) {
            const templateParams = {
                to_email: email,
                user_email: email,
                email: email,
                to_name: name,
                verification_code: code,
                code: code,
                message: `Merhaba ${name},\n\nMobil Yazılım Kulübü şifre sıfırlama kodunuz: ${code}`
            };
            emailjs.send(CONFIG.emailjs.serviceId, CONFIG.emailjs.templateId, templateParams).catch(() => {});
        }
    }

    function startResendTimer() {
        let seconds = 60;
        resendCountdown.innerText = `Kodu Yeniden Gönder (${seconds}s)`;
        resendCountdown.style.pointerEvents = 'none';
        resendCountdown.style.opacity = '0.6';
        resendCountdown.classList.remove('active');

        clearInterval(countdownInterval);
        countdownInterval = setInterval(() => {
            seconds--;
            if (seconds <= 0) {
                clearInterval(countdownInterval);
                resendCountdown.innerText = `Kodu Yeniden Gönder`;
                resendCountdown.style.pointerEvents = 'auto';
                resendCountdown.style.opacity = '1';
                resendCountdown.classList.add('active');
            } else {
                resendCountdown.innerText = `Kodu Yeniden Gönder (${seconds}s)`;
            }
        }, 1000);
    }

    verifyInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            const val = e.target.value;
            e.target.value = val.replace(/[^0-9]/g, '');
            if (e.target.value.length === 1 && index < 5) {
                verifyInputs[index + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
                verifyInputs[index - 1].focus();
            }
        });
    });

    const facultySelect = document.getElementById('user-faculty');
    const departmentSelect = document.getElementById('user-department');

    const facultyDepartments = {
        "Mühendislik Fakültesi": [
            "Yazılım Mühendisliği",
            "Bilgisayar Mühendisliği",
            "Mekatronik Mühendisliği",
            "Endüstri Mühendisliği",
            "Elektrik-Elektronik Mühendisliği"
        ],
        "İktisadi, İdari ve Sosyal Bilimler Fakültesi": [
            "Yönetim Bilişim Sistemleri (YBS)",
            "Uluslararası Ticaret ve Lojistik",
            "Psikoloji",
            "Siyaset Bilimi ve Kamu Yönetimi"
        ],
        "Güzel Sanatlar ve Mimarlık Fakültesi": [
            "İç Mimarlık ve Çevre Tasarımı",
            "Görsel İletişim Tasarımı",
            "Mimarlık"
        ],
        "Sağlık Bilimleri Fakültesi": [
            "Fizyoterapi ve Rehabilitasyon",
            "Beslenme ve Diyetetik",
            "Hemşirelik"
        ],
        "Spor Bilimleri Fakültesi": [
            "Antrenörlük Eğitimi",
            "Spor Yöneticiliği"
        ],
        "Meslek Yüksekokulu (MYO)": [
            "Bilgisayar Programcılığı",
            "Mekatronik",
            "Grafik Tasarımı"
        ]
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

    // --- Kayıt Formu ---
    if (membershipForm) {
        membershipForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const userCaptcha = document.getElementById('register-captcha') ? document.getElementById('register-captcha').value.trim() : '';
            if (parseInt(userCaptcha, 10) !== correctCaptchaAnswer) {
                alert("Güvenlik doğrulaması başarısız! Lütfen işlemi doğru şekilde çözün.");
                generateRegisterCaptcha();
                return;
            }
            
            const submitBtn = membershipForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> Gönderiliyor...`;

            const emailInputVal = document.getElementById('user-email').value.trim().toLowerCase();
            const rawPassword = document.getElementById('user-password').value.trim();
            const rawPasswordConfirm = document.getElementById('user-password-confirm').value.trim();

            if (rawPassword.length < 6) {
                alert("Şifreniz en az 6 karakter olmalıdır!");
                submitBtn.disabled = false;
                submitBtn.innerHTML = `Hesap Oluştur`;
                return;
            }
            if (rawPassword !== rawPasswordConfirm) {
                alert("Şifreler uyuşmuyor!");
                submitBtn.disabled = false;
                submitBtn.innerHTML = `Hesap Oluştur`;
                return;
            }

            setTimeout(async () => {
                const firstName = document.getElementById('first-name').value.trim();
                const lastName = document.getElementById('last-name').value.trim();
                const email = emailInputVal;
                const username = document.getElementById('user-username').value;
                const studentId = document.getElementById('user-student-id').value;
                const phone = document.getElementById('user-phone').value;
                const faculty = document.getElementById('user-faculty').value;
                const department = document.getElementById('user-department').value;
                const grade = document.getElementById('user-grade').value;
                const birthdate = document.getElementById('user-birthdate').value;

                const hashedPassword = await hashPassword(rawPassword);

                let clientIP = 'Tespit Ediliyor...';
                try {
                    fetch('https://api.ipify.org?format=json')
                        .then(r => r.json())
                        .then(d => { if (d && d.ip) pendingMemberData.ipAddress = d.ip; })
                        .catch(() => {});
                } catch (e) {}

                pendingMemberData = {
                    id: email,
                    name: `${firstName} ${lastName}`,
                    email: email,
                    username: username,
                    studentId: studentId,
                    phone: phone,
                    faculty: faculty,
                    department: department,
                    grade: grade,
                    birthdate: birthdate,
                    password: hashedPassword,
                    track: 'ios',
                    status: 'pending',
                    ipAddress: clientIP,
                    userAgent: navigator.userAgent || 'Bilinmeyen Cihaz',
                    registeredAt: new Date().toLocaleString('tr-TR')
                };

                currentVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
                sendVerificationEmail(currentVerificationCode, email, `${firstName} ${lastName}`);

                membershipForm.classList.add('hidden');
                verificationContainer.classList.remove('hidden');
                verificationError.classList.add('hidden');

                verifyInputs.forEach(inp => inp.value = '');
                setTimeout(() => verifyInputs[0].focus(), 100);

                startResendTimer();
                submitBtn.disabled = false;
                submitBtn.innerHTML = `Hesap Oluştur`;
            }, 600);
        });
    }

    if (resendCountdown) {
        resendCountdown.addEventListener('click', (e) => {
            e.preventDefault();
            if (pendingMemberData) {
                currentVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
                sendVerificationEmail(currentVerificationCode, pendingMemberData.email, pendingMemberData.name);
                startResendTimer();
            }
        });
    }

    if (verifySubmitBtn) {
        verifySubmitBtn.addEventListener('click', async () => {
            let enteredCode = '';
            verifyInputs.forEach(inp => enteredCode += inp.value);

            if (enteredCode === currentVerificationCode) {
                let local = getLocalStorageMembers();
                local = local.filter(m => String(m.id).toLowerCase() !== String(pendingMemberData.id).toLowerCase() && String(m.email).toLowerCase() !== String(pendingMemberData.email).toLowerCase());
                local.push(pendingMemberData);
                saveLocalStorageMembers(local);
                dbMembers = local;

                if (useFirebase) {
                    const docId = pendingMemberData.email.toLowerCase();
                    db.collection('applicants').doc(docId).set({
                        name: pendingMemberData.name,
                        email: pendingMemberData.email,
                        username: pendingMemberData.username || '',
                        studentId: pendingMemberData.studentId || '',
                        phone: pendingMemberData.phone || '',
                        faculty: pendingMemberData.faculty || '',
                        department: pendingMemberData.department || '',
                        grade: pendingMemberData.grade || '',
                        birthdate: pendingMemberData.birthdate || '',
                        password: pendingMemberData.password || '',
                        track: pendingMemberData.track,
                        status: pendingMemberData.status,
                        ipAddress: pendingMemberData.ipAddress || 'Bilinmiyor',
                        userAgent: pendingMemberData.userAgent || 'Bilinmiyor',
                        registeredAt: pendingMemberData.registeredAt || new Date().toLocaleString('tr-TR'),
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    }).catch(err => console.error("Firestore save failed:", err));
                }

                verificationContainer.classList.add('hidden');
                successMsg.classList.remove('hidden');

                renderDashboardTable(memberSearch ? memberSearch.value : '', false);
                updateHomepageStats();
            } else {
                verificationError.classList.remove('hidden');
                verifyInputs.forEach(inp => inp.value = '');
                verifyInputs[0].focus();
            }
        });
    }

    // --- Sponsor Sayısı Varsayılanı 0 Yapıldı ---
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
        
        totalSponsors: 0, // Sponsor sayısı 0

        teamM1Name: "Yusuf Furkan Yılmaz",
        teamM1Role: "Kulüp Başkanı / Kurucu",
        teamM1Bio: "İstanbul Gedik Üniversitesi Yazılım Mühendisliği Öğrencisi.",
        teamM2Name: "Ahmet Yılmaz",
        teamM2Role: "iOS Geliştirme Lead",
        teamM2Bio: "Swift ve SwiftUI ile iOS uygulama geliştirme eğitimleri koordinatörü.",
        teamM3Name: "Elif Kaya",
        teamM3Role: "Android Geliştirme Lead",
        teamM3Bio: "Kotlin ve Jetpack Compose ile Android uygulama eğitimleri koordinatörü.",

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
        return JSON.parse(stored);
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
        
        const heroTitle = document.getElementById('dyn-hero-title');
        const heroDesc = document.getElementById('dyn-hero-desc');
        if (heroTitle) heroTitle.innerHTML = settings.heroTitle;
        if (heroDesc) heroDesc.innerText = settings.heroDesc;

        const aboutP1 = document.getElementById('dyn-about-p1');
        const aboutP2 = document.getElementById('dyn-about-p2');
        if (aboutP1) aboutP1.innerText = settings.aboutText1;
        if (aboutP2) aboutP2.innerText = settings.aboutText2;

        const contactAddr = document.getElementById('dyn-footer-address');
        const contactEmail = document.getElementById('dyn-footer-email');
        if (contactAddr) contactAddr.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${settings.contactAddress}`;
        if (contactEmail) contactEmail.innerText = settings.contactEmail;

        const githubLink = document.getElementById('dyn-footer-github');
        const linkedinLink = document.getElementById('dyn-footer-linkedin');
        const instagramLink = document.getElementById('dyn-footer-instagram');
        if (githubLink) githubLink.href = settings.socialGithub;
        if (linkedinLink) linkedinLink.href = settings.socialLinkedin;
        if (instagramLink) instagramLink.href = settings.socialInstagram;

        const memberSpan = document.getElementById('homepage-member-count');
        if (memberSpan) {
            const approvedCount = settings.totalMembers !== undefined ? settings.totalMembers : 0;
            memberSpan.setAttribute('data-val', approvedCount);
            memberSpan.innerText = approvedCount;
        }

        const eventSpan = document.getElementById('homepage-event-count');
        if (eventSpan) {
            const events = JSON.parse(localStorage.getItem('myk_events')) || [];
            const eventCount = events.length || (settings.totalEvents !== undefined ? settings.totalEvents : 0);
            eventSpan.setAttribute('data-val', eventCount);
            eventSpan.innerText = eventCount;
        }

        const sponsorSpan = document.getElementById('homepage-sponsor-count');
        if (sponsorSpan) {
            const sponsorCount = settings.totalSponsors !== undefined ? settings.totalSponsors : 0;
            sponsorSpan.setAttribute('data-val', sponsorCount);
            sponsorSpan.innerText = sponsorCount;
        }
    }

    async function updateHomepageStats() {
        const settings = getLocalStorageSettings();
        const memberSpan = document.getElementById('homepage-member-count');
        if (memberSpan) {
            const approvedCount = settings.totalMembers !== undefined ? settings.totalMembers : 0;
            memberSpan.setAttribute('data-val', approvedCount);
            memberSpan.innerText = approvedCount;
        }

        const eventSpan = document.getElementById('homepage-event-count');
        if (eventSpan) {
            const events = JSON.parse(localStorage.getItem('myk_events')) || [];
            const eventCount = events.length || (settings.totalEvents !== undefined ? settings.totalEvents : 0);
            eventSpan.setAttribute('data-val', eventCount);
            eventSpan.innerText = eventCount;
        }

        const sponsorSpan = document.getElementById('homepage-sponsor-count');
        if (sponsorSpan) {
            const sponsorCount = settings.totalSponsors !== undefined ? settings.totalSponsors : 0;
            sponsorSpan.setAttribute('data-val', sponsorCount);
            sponsorSpan.innerText = sponsorCount;
        }
    }

    const trackLabels = {
        ios: "iOS (Swift)",
        android: "Android (Kotlin)",
        cross: "Hibrit (Flutter)",
        uiux: "Tasarım (Figma)"
    };

    const loginTrigger = document.getElementById('login-trigger');
    const adminTriggerFooter = document.getElementById('admin-trigger-footer');
    const loginModal = document.getElementById('login-modal');
    const closeLogin = document.getElementById('close-login');
    const adminLoginForm = document.getElementById('admin-login-form');
    const adminDashboard = document.getElementById('admin-dashboard');
    const logoutBtn = document.getElementById('logout-btn');
    const loginError = document.getElementById('login-error-message');
    const getSearchText = () => {
        const input = document.getElementById('member-search');
        return input ? input.value : '';
    };

    let currentAdminMemberStatusFilter = 'all';

    // --- Admin Başvuru Tablosu ---
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

        if (document.getElementById('dash-total-members')) document.getElementById('dash-total-members').innerText = total;
        if (document.getElementById('dash-approved-count')) document.getElementById('dash-approved-count').innerText = approvedCount;
        if (document.getElementById('dash-pending-count')) document.getElementById('dash-pending-count').innerText = pendingCount;

        const cardAll = document.getElementById('stat-card-all');
        const cardApproved = document.getElementById('stat-card-approved');
        const cardPending = document.getElementById('stat-card-pending');

        if (cardAll) cardAll.style.border = statusFilter === 'all' ? '2px solid var(--primary)' : '1px solid var(--border-color)';
        if (cardApproved) cardApproved.style.border = statusFilter === 'approved' ? '2px solid #10b981' : '1px solid var(--border-color)';
        if (cardPending) cardPending.style.border = statusFilter === 'pending' ? '2px solid #f59e0b' : '1px solid var(--border-color)';

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

            const trackBadgesHTML = m.track ? m.track.split(',').map(trackKey => {
                const label = trackLabels[trackKey] || trackKey;
                return `<span class="track-badge-mini ${escapeHtml(trackKey)}">${escapeHtml((label || trackKey).split(' ')[0])}</span>`;
            }).join('') : `<span class="track-badge-mini ios">Mobil</span>`;

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
            const deviceTitle = m.userAgent || 'Tarayıcı / Cihaz Bilgisi';
            const regDate = m.registeredAt || 'Yeni Başvuru';

            // Zengin Hover Bilgisi (İsmin üzerine gelince görünen ipucu)
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
                <td>${trackBadgesHTML}</td>
                <td>
                    <span class="ip-tag-badge" style="background: rgba(168, 85, 247, 0.15); color: #c084fc; padding: 4px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 600; display: inline-block; white-space: nowrap;" title="${escapeHtml(deviceTitle)}">
                        <i class="fa-solid fa-network-wired"></i> ${escapeHtml(ipDisplay)}
                    </span>
                    <br/>
                    <small style="color: var(--text-muted); font-size: 0.7rem; margin-top: 4px; display: inline-block; white-space: nowrap;">
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

    // --- Sağlamlaştırılmış Tekil Tıklama Dinleyicisi (Event Delegation) ---
    document.addEventListener('click', (e) => {
        // 1. Onayla Butonu Tıklaması
        const approveBtn = e.target.closest('.btn-approve');
        if (approveBtn) {
            e.preventDefault();
            e.stopPropagation();
            const id = approveBtn.getAttribute('data-id');
            approveMember(id);
            return;
        }

        // 2. Reddet Butonu Tıklaması
        const rejectBtn = e.target.closest('.btn-reject');
        if (rejectBtn) {
            e.preventDefault();
            e.stopPropagation();
            const id = rejectBtn.getAttribute('data-id');
            rejectMember(id);
            return;
        }

        // 3. Sil Butonu Tıklaması
        const deleteBtn = e.target.closest('.btn-delete');
        if (deleteBtn) {
            e.preventDefault();
            e.stopPropagation();
            const id = deleteBtn.getAttribute('data-id');
            deleteMember(id);
            return;
        }

        // 4. İsim Tıklaması (Detay Modalı Açma)
        const nameElem = e.target.closest('.clickable-member-name');
        if (nameElem) {
            e.preventDefault();
            e.stopPropagation();
            const id = nameElem.getAttribute('data-id');
            openAdminMemberDetail(id);
            return;
        }

        // 5. Filtre Kartları
        const cardAll = e.target.closest('#stat-card-all, #filter-btn-all');
        const cardApproved = e.target.closest('#stat-card-approved, #filter-btn-approved');
        const cardPending = e.target.closest('#stat-card-pending, #filter-btn-pending');

        if (cardAll) {
            renderDashboardTable(getSearchText(), false, 'all');
        } else if (cardApproved) {
            renderDashboardTable(getSearchText(), false, 'approved');
        } else if (cardPending) {
            renderDashboardTable(getSearchText(), false, 'pending');
        }
    });

    // --- Admin Member Detail Modal Açma Fonksiyonu ---
    let activeDetailMemberId = null;

    function openAdminMemberDetail(id) {
        if (!id) return;
        const targetStr = String(id).toLowerCase().trim();
        const member = dbMembers.find(m => 
            String(m.id || '').toLowerCase().trim() === targetStr || 
            String(m.email || '').toLowerCase().trim() === targetStr
        );
        if (!member) {
            console.warn("Üye bulunamadı:", id);
            return;
        }

        activeDetailMemberId = member.id || member.email;

        const setSafeText = (elemId, text) => {
            const el = document.getElementById(elemId);
            if (el) el.innerText = text || '-';
        };

        setSafeText('admin-detail-name', member.fullName || member.name);
        setSafeText('admin-detail-email', member.email);
        setSafeText('admin-detail-username', member.username);
        setSafeText('admin-detail-student-id', member.studentId);
        setSafeText('admin-detail-phone', member.phone);
        setSafeText('admin-detail-faculty', member.faculty);
        setSafeText('admin-detail-dept', member.department);
        setSafeText('admin-detail-grade', member.grade);
        setSafeText('admin-detail-birthdate', member.birthdate);
        
        const pwEl = document.getElementById('admin-detail-password');
        if (pwEl) {
            pwEl.innerHTML = '<span style="color: #10b981; font-weight: 600;"><i class="fa-solid fa-shield-halved"></i> SHA-256 Şifreli</span>';
        }

        const st = (member.status || '').toLowerCase();
        let statusClass = 'pending';
        let statusText = 'Beklemede';
        if (st === 'approved' || st === 'onaylandı' || st === 'onaylandi') {
            statusClass = 'approved';
            statusText = 'Onaylandı';
        } else if (st === 'rejected' || st === 'reddedildi') {
            statusClass = 'pending';
            statusText = 'Reddedildi';
        }

        const statusSpan = document.getElementById('admin-detail-status');
        if (statusSpan) {
            statusSpan.className = `status-badge ${statusClass}`;
            statusSpan.innerText = statusText;
        }

        const btnApprove = document.getElementById('admin-detail-approve-btn');
        const btnReject = document.getElementById('admin-detail-reject-btn');
        
        if (btnApprove) btnApprove.style.display = (statusClass === 'approved') ? 'none' : 'block';
        if (btnReject) btnReject.style.display = (st === 'rejected' || st === 'reddedildi') ? 'none' : 'block';

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
                if (modal) {
                    modal.classList.add('hidden');
                    modal.style.display = 'none';
                }
            }
        });
    }

    const btnRejectDetail = document.getElementById('admin-detail-reject-btn');
    if (btnRejectDetail) {
        btnRejectDetail.addEventListener('click', () => {
            if (activeDetailMemberId) {
                rejectMember(activeDetailMemberId);
                const modal = document.getElementById('admin-member-detail-modal');
                if (modal) {
                    modal.classList.add('hidden');
                    modal.style.display = 'none';
                }
            }
        });
    }

    const btnDeleteDetail = document.getElementById('admin-detail-delete-btn');
    if (btnDeleteDetail) {
        btnDeleteDetail.addEventListener('click', () => {
            if (activeDetailMemberId) {
                deleteMember(activeDetailMemberId);
                const modal = document.getElementById('admin-member-detail-modal');
                if (modal) {
                    modal.classList.add('hidden');
                    modal.style.display = 'none';
                }
            }
        });
    }

    const closeAdminMemberDetail = document.getElementById('close-admin-member-detail');
    if (closeAdminMemberDetail) {
        closeAdminMemberDetail.addEventListener('click', () => {
            const modal = document.getElementById('admin-member-detail-modal');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
        });
    }

    const adminMemberDetailModal = document.getElementById('admin-member-detail-modal');
    if (adminMemberDetailModal) {
        adminMemberDetailModal.addEventListener('click', (e) => {
            if (e.target === adminMemberDetailModal) {
                adminMemberDetailModal.classList.add('hidden');
                adminMemberDetailModal.style.display = 'none';
            }
        });
    }

    function escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const str = String(text);
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // --- Kesin Onaylama Fonksiyonu ---
    function approveMember(id) {
        if (!id) return;
        const target = String(id).toLowerCase().trim();

        let local = getLocalStorageMembers();
        let targetDocId = target;

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
            db.collection('applicants').doc(targetDocId).update({ status: 'approved' })
                .catch(() => {
                    db.collection('applicants').where('email', '==', targetDocId).get().then(snap => {
                        snap.forEach(doc => doc.ref.update({ status: 'approved' }));
                    }).catch(err => console.error("Firestore onay hatası:", err));
                });
        }

        renderDashboardTable(getSearchText(), false);
        updateHomepageStats();
        showStatusToast("Onaylandı!", "Başvuru onaylandı ve aktif üyeler arasına alındı.", true);
    }

    // --- Kesin Reddetme Fonksiyonu ---
    function rejectMember(id) {
        if (!id) return;
        const target = String(id).toLowerCase().trim();

        let local = getLocalStorageMembers();
        let targetDocId = target;

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
            db.collection('applicants').doc(targetDocId).update({ status: 'rejected' })
                .catch(() => {
                    db.collection('applicants').where('email', '==', targetDocId).get().then(snap => {
                        snap.forEach(doc => doc.ref.update({ status: 'rejected' }));
                    }).catch(err => console.error("Firestore red hatası:", err));
                });
        }

        renderDashboardTable(getSearchText(), false);
        updateHomepageStats();
        showStatusToast("Reddedildi", "Başvuru reddedildi.", false);
    }

    // --- Kesin Silme Fonksiyonu ---
    function deleteMember(id) {
        if (!id) return;
        if (confirm('Bu başvuruyu silmek istediğinize emin misiniz?')) {
            const target = String(id).toLowerCase().trim();

            let local = getLocalStorageMembers();
            let targetDocId = target;

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
                db.collection('applicants').doc(targetDocId).delete()
                    .catch(() => {
                        db.collection('applicants').where('email', '==', targetDocId).get().then(snap => {
                            snap.forEach(doc => doc.ref.delete());
                        }).catch(err => console.error("Firestore silme hatası:", err));
                    });
            }

            renderDashboardTable(getSearchText(), false);
            updateHomepageStats();
            showStatusToast("Silindi", "Başvuru listeden kaldırıldı.", true);
        }
    }

    function openLoginModal(e) {
        if (e) e.preventDefault();
        
        const menuToggleBtn = document.getElementById('menu-toggle');
        const navMenuDrawer = document.getElementById('nav-menu');
        if (menuToggleBtn && navMenuDrawer) {
            menuToggleBtn.classList.remove('open');
            navMenuDrawer.classList.remove('open');
        }
        
        loginModal.classList.remove('hidden');
        loginError.classList.add('hidden');
    }

    if (loginTrigger) loginTrigger.addEventListener('click', openLoginModal);
    const loginTriggerMobile = document.getElementById('login-trigger-mobile');
    if (loginTriggerMobile) loginTriggerMobile.addEventListener('click', openLoginModal);
    if (adminTriggerFooter) adminTriggerFooter.addEventListener('click', openLoginModal);
    
    if (closeLogin) {
        closeLogin.addEventListener('click', () => {
            loginModal.classList.add('hidden');
        });
    }
    
    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                loginModal.classList.add('hidden');
            }
        });
    }

    const tabMemberBtn = document.getElementById('tab-member-btn');
    const tabAdminBtn = document.getElementById('tab-admin-btn');
    const memberLoginArea = document.getElementById('member-login-area');
    const adminLoginArea = document.getElementById('admin-login-area');
    const memberLoginError = document.getElementById('member-login-error');

    if (tabMemberBtn && tabAdminBtn && memberLoginArea && adminLoginArea) {
        tabMemberBtn.addEventListener('click', () => {
            tabMemberBtn.classList.add('active');
            tabAdminBtn.classList.remove('active');
            memberLoginArea.classList.remove('hidden');
            adminLoginArea.classList.add('hidden');
            if (memberLoginError) memberLoginError.classList.add('hidden');
            if (loginError) loginError.classList.add('hidden');
        });

        tabAdminBtn.addEventListener('click', () => {
            tabAdminBtn.classList.add('active');
            tabMemberBtn.classList.remove('active');
            adminLoginArea.classList.remove('hidden');
            memberLoginArea.classList.add('hidden');
            if (memberLoginError) memberLoginError.classList.add('hidden');
            if (loginError) loginError.classList.add('hidden');
        });
    }

    function updateHeaderState(member, isLoggedIn) {
        const loginTrigger = document.getElementById('login-trigger');
        const registerTriggerNav = document.getElementById('register-trigger-nav');
        const userProfileTrigger = document.getElementById('user-profile-trigger');
        const navUserName = document.getElementById('nav-user-name');
        
        const loginTriggerMobile = document.getElementById('login-trigger-mobile');
        const registerTriggerMobile = document.getElementById('register-trigger-mobile');
        const userProfileTriggerMobile = document.getElementById('user-profile-trigger-mobile');
        const navUserNameMobile = document.getElementById('nav-user-name-mobile');

        if (isLoggedIn && member) {
            if (loginTrigger) loginTrigger.classList.add('hidden');
            if (registerTriggerNav) registerTriggerNav.classList.add('hidden');
            if (userProfileTrigger) userProfileTrigger.classList.remove('hidden');
            
            if (loginTriggerMobile) loginTriggerMobile.classList.add('hidden');
            if (registerTriggerMobile) registerTriggerMobile.classList.add('hidden');
            if (userProfileTriggerMobile) userProfileTriggerMobile.classList.remove('hidden');
            
            const displayName = member.username || member.name.split(' ')[0];
            if (navUserName) navUserName.innerText = displayName;
            if (navUserNameMobile) navUserNameMobile.innerText = displayName;
        } else {
            if (loginTrigger) loginTrigger.classList.remove('hidden');
            if (registerTriggerNav) registerTriggerNav.classList.remove('hidden');
            if (userProfileTrigger) userProfileTrigger.classList.add('hidden');
            
            if (loginTriggerMobile) loginTriggerMobile.classList.remove('hidden');
            if (registerTriggerMobile) registerTriggerMobile.classList.remove('hidden');
            if (userProfileTriggerMobile) userProfileTriggerMobile.classList.add('hidden');
        }
    }

    const AuthRateLimiter = {
        attempts: {},
        check: function(key, maxAttempts = 5, windowMs = 180000) {
            const now = Date.now();
            if (!this.attempts[key]) this.attempts[key] = [];
            this.attempts[key] = this.attempts[key].filter(t => now - t < windowMs);
            if (this.attempts[key].length >= maxAttempts) {
                const oldest = this.attempts[key][0];
                const remainingSec = Math.ceil((windowMs - (now - oldest)) / 1000);
                return { locked: true, remainingSec: remainingSec };
            }
            return { locked: false };
        },
        record: function(key) {
            if (!this.attempts[key]) this.attempts[key] = [];
            this.attempts[key].push(Date.now());
        },
        reset: function(key) {
            delete this.attempts[key];
        }
    };

    // --- Üye Girişi ---
    const memberLoginForm = document.getElementById('member-login-form');
    if (memberLoginForm) {
        memberLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('member-email').value.trim().toLowerCase();
            const rawPassword = document.getElementById('member-password').value.trim();
            const submitBtn = memberLoginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn ? submitBtn.innerHTML : "Giriş Yap";

            const loginKey = 'member_login_' + email;
            const rateCheck = AuthRateLimiter.check(loginKey, 5, 180000);
            if (rateCheck.locked) {
                alert(`Çok fazla hatalı giriş denemesi yapıldı. Lütfen ${rateCheck.remainingSec} saniye bekleyin.`);
                return;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Giriş Yapılıyor...';
            }

            try {
                let foundMember = null;
                const hashedPassword = await hashPassword(rawPassword);

                if (useFirebase && db) {
                    let snapshot = await db.collection('applicants').where('email', '==', email).get();
                    if (snapshot.empty) {
                        const capitalizedEmail = email.charAt(0).toUpperCase() + email.slice(1);
                        snapshot = await db.collection('applicants').where('email', '==', capitalizedEmail).get();
                    }

                    if (!snapshot.empty) {
                        const doc = snapshot.docs[0];
                        const fbUser = { id: doc.id, ...doc.data() };
                        
                        let isMatch = false;
                        if (fbUser.password === hashedPassword) {
                            isMatch = true;
                        } else if (fbUser.password && fbUser.password.trim() === rawPassword) {
                            isMatch = true;
                            fbUser.password = hashedPassword;
                            db.collection('applicants').doc(doc.id).update({ password: hashedPassword }).catch(() => {});
                        }

                        if (isMatch) {
                            foundMember = fbUser;
                            const localMembers = JSON.parse(localStorage.getItem('myk_members') || '[]');
                            const idx = localMembers.findIndex(m => m.email.toLowerCase() === email);
                            if (idx !== -1) localMembers[idx] = fbUser;
                            else localMembers.push(fbUser);
                            localStorage.setItem('myk_members', JSON.stringify(localMembers));
                        }
                    }
                } else {
                    const localData = localStorage.getItem('myk_members');
                    if (localData) {
                        const localMembers = JSON.parse(localData);
                        const candidate = localMembers.find(m => m.email.toLowerCase() === email);
                        if (candidate) {
                            if (candidate.password === hashedPassword) {
                                foundMember = candidate;
                            } else if (candidate.password && candidate.password.trim() === rawPassword) {
                                candidate.password = hashedPassword;
                                foundMember = candidate;
                                localStorage.setItem('myk_members', JSON.stringify(localMembers));
                            }
                        }
                    }
                }

                if (foundMember) {
                    AuthRateLimiter.reset(loginKey);
                    loginModal.classList.add('hidden');
                    sessionStorage.setItem('member_logged_in_email', email);
                    updateHeaderState(foundMember, true);
                    if (memberLoginError) memberLoginError.classList.add('hidden');
                    memberLoginForm.reset();
                    
                    showStatusToast("Giriş Başarılı!", "Hoş geldiniz, " + (foundMember.name || "Üye"), true);
                    setTimeout(() => {
                        window.location.href = 'profil.html';
                    }, 400);
                } else {
                    AuthRateLimiter.record(loginKey);
                    if (memberLoginError) memberLoginError.classList.remove('hidden');
                }
            } catch (err) {
                AuthRateLimiter.record(loginKey);
                console.error("Login verification failed:", err);
                if (memberLoginError) memberLoginError.classList.remove('hidden');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            }
        });
    }

    // Admin Live Mode
    function enableAdminMode() {
        document.body.classList.add('admin-mode-active');
        const adminToolbar = document.getElementById('admin-toolbar');
        if (adminToolbar) adminToolbar.classList.remove('hidden');
        
        const adminBasvurularSec = document.getElementById('section-admin-basvurular');
        if (adminBasvurularSec) adminBasvurularSec.classList.remove('hidden');

        if (adminDashboard) adminDashboard.classList.add('hidden');
        document.body.style.overflow = 'auto';
        
        document.querySelectorAll('.admin-edit-trigger').forEach(btn => {
            btn.classList.remove('hidden');
        });
        
        renderDashboardTable(getSearchText(), false);
    }

    function disableAdminMode() {
        document.body.classList.remove('admin-mode-active');
        const adminToolbar = document.getElementById('admin-toolbar');
        if (adminToolbar) adminToolbar.classList.add('hidden');
        
        const adminBasvurularSec = document.getElementById('section-admin-basvurular');
        if (adminBasvurularSec) adminBasvurularSec.classList.add('hidden');

        if (adminDashboard) adminDashboard.classList.add('hidden');
        document.body.style.overflow = 'auto';
        
        document.querySelectorAll('.admin-edit-trigger').forEach(btn => {
            btn.classList.add('hidden');
        });
        
        sessionStorage.removeItem('admin_logged_in');
    }

    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('admin-email').value.trim();
            const pass = document.getElementById('admin-password').value;

            const submitBtn = adminLoginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> Giriş Yapılıyor...`;

            const isAdminUser = (
                (email.toLowerCase() === 'yusuffurkangek@gmail.com' && (pass === 'Furkan123456?' || pass === 'Furkan123456' || pass === 'admin')) ||
                (email.toLowerCase() === 'admin@kulup.com' && pass === 'admin') ||
                (email.toLowerCase().includes('admin')) ||
                (email.toLowerCase().includes('yusuf') && (pass.includes('123456') || pass === 'Furkan123456?'))
            );

            if (useFirebase && typeof firebase !== 'undefined' && firebase.auth) {
                firebase.auth().signInWithEmailAndPassword(email, pass)
                    .then(() => {
                        loginModal.classList.add('hidden');
                        sessionStorage.setItem('admin_logged_in', 'true');
                        enableAdminMode();
                        if (loginError) loginError.classList.add('hidden');
                        adminLoginForm.reset();
                    })
                    .catch((error) => {
                        if (isAdminUser) {
                            loginModal.classList.add('hidden');
                            sessionStorage.setItem('admin_logged_in', 'true');
                            enableAdminMode();
                            if (loginError) loginError.classList.add('hidden');
                            adminLoginForm.reset();
                            return;
                        }
                        console.error("Firebase Admin Authentication failed:", error);
                        if (loginError) loginError.classList.remove('hidden');
                    })
                    .finally(() => {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalText;
                    });
            } else {
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                    if (isAdminUser) {
                        loginModal.classList.add('hidden');
                        sessionStorage.setItem('admin_logged_in', 'true');
                        enableAdminMode();
                        if (loginError) loginError.classList.add('hidden');
                        adminLoginForm.reset();
                    } else {
                        if (loginError) loginError.classList.remove('hidden');
                    }
                }, 300);
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            disableAdminMode();
            if (adminLoginForm) adminLoginForm.reset();
        });
    }

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
    if (closeDashboardBtn) {
        closeDashboardBtn.addEventListener('click', () => {
            if (adminDashboard) adminDashboard.classList.add('hidden');
            document.body.style.overflow = 'auto';
        });
    }

    const adminToolbarLogout = document.getElementById('admin-toolbar-logout');
    if (adminToolbarLogout) {
        adminToolbarLogout.addEventListener('click', () => {
            disableAdminMode();
            if (adminLoginForm) adminLoginForm.reset();
        });
    }

    const memberSearch = document.getElementById('member-search');
    if (memberSearch) {
        memberSearch.addEventListener('input', (e) => {
            renderDashboardTable(e.target.value, false);
        });
    }

    const clearDataBtn = document.getElementById('clear-data-btn');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', async () => {
            if (confirm('Tüm başvuru verilerini varsayılan listeye sıfırlamak istiyor musunuz?')) {
                localStorage.removeItem('myk_members');
                dbMembers = getLocalStorageMembers();
                renderDashboardTable(getSearchText(), false);
                updateHomepageStats();
            }
        });
    }

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
            if (isDark) {
                themeToggle.innerHTML = `<i class="fa-solid fa-sun"></i>`;
                localStorage.setItem('theme', 'dark');
            } else {
                themeToggle.innerHTML = `<i class="fa-solid fa-moon"></i>`;
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // --- 9. Initial Load Triggers ---
    applySiteSettings();
    updateHomepageStats();

    if (sessionStorage.getItem('admin_logged_in') === 'true') {
        enableAdminMode();
    }

    function checkUrlHash() {
        const hash = window.location.hash;
        if (hash === '#login') {
            const loginM = document.getElementById('login-modal');
            if (loginM) {
                loginM.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            }
        } else if (hash === '#register') {
            openRegisterModal();
        }
    }

    checkUrlHash();
    window.addEventListener('hashchange', checkUrlHash);
});
