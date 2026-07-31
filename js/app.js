/* ==========================================
   MOBİL YAZILIM KULÜBÜ JAVASCRIPT LOGIC
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {

    // --- 0. Firebase & EmailJS Initialization (with localStorage Fallbacks) ---
    let db = null;
    let useFirebase = false;
    let useEmailJS = false;
    let dbMembers = []; // In-memory database cache for instant responsive UI

    // Firebase Initialization
    if (typeof CONFIG !== 'undefined' && CONFIG.firebase && CONFIG.firebase.projectId) {
        try {
            firebase.initializeApp(CONFIG.firebase);
            db = firebase.firestore();
            useFirebase = true;
            console.log("Firebase initialized successfully.");
        } catch (err) {
            console.error("Firebase initialization failed. Falling back to LocalStorage:", err);
        }
    } else {
        console.log("Firebase config not found. Running in LocalStorage fallback mode.");
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
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // --- 2. Hamburger Mobile Menu ---
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('open');
            navMenu.classList.toggle('open');
        });

        // Close menu when clicking link
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('open');
                navMenu.classList.remove('open');
            });
        });

        // Close menu when clicking outside
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
            const target = parseInt(stat.getAttribute('data-val'));
            if (target === 0) {
                stat.innerText = "0";
                return;
            }
            
            let current = 0;
            const duration = 2000; // 2 seconds
            const steps = duration / 30; // 30ms intervals
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
        registerModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Reset modal layout back to form entry
        membershipForm.classList.remove('hidden');
        verificationContainer.classList.add('hidden');
        successMsg.classList.add('hidden');
        membershipForm.reset();
    }

    function closeRegisterModal() {
        registerModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        clearInterval(countdownInterval);
    }

    if (regTriggerNav) regTriggerNav.addEventListener('click', openRegisterModal);
    if (regTriggerHero) regTriggerHero.addEventListener('click', openRegisterModal);
    if (closeRegister) closeRegister.addEventListener('click', closeRegisterModal);

    // Close when clicking backdrop
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

    // Custom Status Toast Notification
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
        }, 5000);
    }

    // Custom Toast Notification Simulator
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

        // Auto dismiss after 8 seconds
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 400);
        }, 8000);
    }

    // Real email sender using EmailJS or FormSubmit (Keyless Free Service)
    function sendVerificationEmail(code, email, name) {
        if (useEmailJS) {
            const templateParams = {
                to_email: email,
                to_name: name,
                verification_code: code
            };
            emailjs.send(CONFIG.emailjs.serviceId, CONFIG.emailjs.templateId, templateParams)
                .then((response) => {
                    console.log('Real Verification Email sent successfully via EmailJS!', response.status, response.text);
                }, (error) => {
                    console.error('EmailJS failed. Falling back to FormSubmit...', error);
                    sendFormSubmitEmail(code, email, name);
                });
        } else {
            sendFormSubmitEmail(code, email, name);
        }
    }

    // Sends real email to the user's inbox using FormSubmit
    function sendFormSubmitEmail(code, email, name) {
        console.log("Sending real verification email via FormSubmit to:", email);
        
        // Show local toast simulator too so they can proceed immediately if mail delay happens
        showToastNotification(code, `${email} (İlk kez kullanıyorsanız gelen aktivasyon mailini onaylayın!)`);
        
        fetch(`https://formsubmit.co/ajax/${email}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                _subject: "🔑 Mobil Yazılım Kulübü - Üyelik Doğrulama Kodu",
                Ad_Soyad: name,
                Onay_Kodu: code,
                Mesaj: `Merhaba ${name},\n\nMobil Yazılım Kulübü üyelik başvurunuz için 6 haneli onay kodunuz: ${code}\n\nLütfen bu kodu sitedeki doğrulama ekranına girerek kaydınızı tamamlayın.`
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log("FormSubmit response:", data);
        })
        .catch(err => {
            console.error("FormSubmit request failed:", err);
        });
    }

    // Timer Countdown resend code
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

    // Traversal digit boxes
    verifyInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            const val = e.target.value;
            e.target.value = val.replace(/[^0-9]/g, ''); // Digits only
            
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

    // Dynamic Faculty & Department Dropdowns mapping
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

    if (membershipForm) {
        membershipForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const submitBtn = membershipForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> Gönderiliyor...`;

            // Validate passwords match
            const password = document.getElementById('user-password').value;
            const passwordConfirm = document.getElementById('user-password-confirm').value;
            if (password !== passwordConfirm) {
                alert("Şifreler uyuşmuyor!");
                submitBtn.disabled = false;
                submitBtn.innerHTML = `Hesap Oluştur`;
                return;
            }

            // Simulate loader check
            setTimeout(() => {
                const firstName = document.getElementById('first-name').value;
                const lastName = document.getElementById('last-name').value;
                const email = document.getElementById('user-email').value;
                const username = document.getElementById('user-username').value;
                const studentId = document.getElementById('user-student-id').value;
                const phone = document.getElementById('user-phone').value;
                const faculty = document.getElementById('user-faculty').value;
                const department = document.getElementById('user-department').value;
                const grade = document.getElementById('user-grade').value;
                const birthdate = document.getElementById('user-birthdate').value;

                // Cache data (Defaults tracks to 'ios' for mobile club classification)
                pendingMemberData = {
                    id: Date.now(),
                    name: `${firstName} ${lastName}`,
                    email: email,
                    username: username,
                    studentId: studentId,
                    phone: phone,
                    faculty: faculty,
                    department: department,
                    grade: grade,
                    birthdate: birthdate,
                    password: password,
                    track: 'ios',
                    status: 'pending'
                };

                // Generate code
                currentVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();

                // Trigger real email or email simulation toast
                sendVerificationEmail(currentVerificationCode, email, `${firstName} ${lastName}`);

                // Show verification step
                membershipForm.classList.add('hidden');
                verificationContainer.classList.remove('hidden');
                verificationError.classList.add('hidden');

                // Clear digit inputs and focus
                verifyInputs.forEach(inp => inp.value = '');
                setTimeout(() => verifyInputs[0].focus(), 100);

                // Timer resend
                startResendTimer();
                
                // Reset button
                submitBtn.disabled = false;
                submitBtn.innerHTML = `Hesap Oluştur`;
            }, 1200);
        });
    }

    // Resend trigger click
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

    // OTP Code validation verification
    if (verifySubmitBtn) {
        verifySubmitBtn.addEventListener('click', async () => {
            let enteredCode = '';
            verifyInputs.forEach(inp => enteredCode += inp.value);

            if (enteredCode === currentVerificationCode) {
                // Save locally first to guarantee instant UI success response
                let local = getLocalStorageMembers();
                local = local.filter(m => m.id.toString() !== pendingMemberData.id.toString());
                local.push(pendingMemberData);
                saveLocalStorageMembers(local);

                // Update in-memory array immediately
                dbMembers = dbMembers.filter(m => m.id.toString() !== pendingMemberData.id.toString());
                dbMembers.push(pendingMemberData);

                // Write to Firestore asynchronously in background (fire-and-forget)
                if (useFirebase) {
                    const docId = pendingMemberData.id.toString();
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
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    }).then(() => {
                        console.log("Background Firestore save succeeded!");
                    }).catch(err => {
                        console.error("Background Firestore save failed (Check if Firestore database is created):", err);
                    });
                }

                // UI update inside modal (runs instantly!)
                verificationContainer.classList.add('hidden');
                successMsg.classList.remove('hidden');

                // Update table dynamic and stats
                renderDashboardTable(memberSearch ? memberSearch.value : '', false);
                updateHomepageStats();
            } else {
                // Error verification code mismatch
                verificationError.classList.remove('hidden');
                verifyInputs.forEach(inp => inp.value = '');
                verifyInputs[0].focus();
            }
        });
    }

    // --- 7. Admin Panel & Member Management System (Local/Firebase Compatible) ---

    // Initial mock data
    const initialMockMembers = [
        { id: 101, name: "Ahmet Yılmaz", email: "ahmet.yilmaz@posta.com", password: "123456ahmet", department: "Yazılım Mühendisliği", track: "ios", status: "pending" },
        { id: 102, name: "Elif Kaya", email: "elif.kaya@outlook.com", password: "elifpasswords", department: "Bilgisayar Mühendisliği", track: "ios", status: "approved" },
        { id: 103, name: "Can Demir", email: "can.demir@gmail.com", password: "candemirpass", department: "Yönetim Bilişim Sistemleri (YBS)", track: "android", status: "pending" },
        { id: 104, name: "Selin Öztürk", email: "selin.ozturk@gmail.com", password: "selinozturk1", department: "Endüstri Mühendisliği", track: "android", status: "approved" }
    ];

    function getLocalStorageMembers() {
        const stored = localStorage.getItem('myk_members');
        if (!stored) {
            localStorage.setItem('myk_members', JSON.stringify(initialMockMembers));
            return initialMockMembers;
        }
        return JSON.parse(stored);
    }

    function saveLocalStorageMembers(members) {
        localStorage.setItem('myk_members', JSON.stringify(members));
    }

    // --- Events & Announcements Database Helpers & Mock Data ---
    const initialMockEvents = [
        {
            id: "ev_1",
            title: "SwiftUI ile Arayüz Tasarım Kampı",
            category: "iOS / Swift",
            badgeClass: "kolay",
            status: "upcoming",
            statusText: "Aktif Kayıt",
            statusIcon: "fa-solid fa-circle-play",
            description: "iOS uygulama dünyasının modern arayüz framework'ü SwiftUI temellerini, bildirimsel kod yazımını ve hazır animasyon bileşenlerini uygulamalı olarak işliyoruz.",
            date: "15 Şubat 2026, Cumartesi",
            time: "14:00 - 17:00",
            location: "Teknoloji Kampüsü, Lab 404"
        },
        {
            id: "ev_2",
            title: "Kotlin ile Android Geliştirmeye Giriş",
            category: "Android / Kotlin",
            badgeClass: "orta",
            status: "upcoming",
            statusText: "Aktif Kayıt",
            statusIcon: "fa-solid fa-circle-play",
            description: "Android geliştirmede kullanılan resmi dil Kotlin'in temellerini, OOP prensiplerini ve temel emülatör yapılandırmalarını sıfırdan ele alıyoruz.",
            date: "22 Şubat 2026, Cumartesi",
            time: "14:00 - 17:00",
            location: "Teknoloji Kampüsü, Lab 404"
        },
        {
            id: "ev_3",
            title: "MYGK Tanışma Toplantısı",
            category: "Kulüp İçi",
            badgeClass: "kolay",
            status: "past",
            statusText: "Tamamlandı",
            statusIcon: "fa-solid fa-circle-check",
            description: "Kulübümüzün vizyonunu, eğitim hedeflerini, projelerimizi ve dönem planlarını sunduğumuz, yeni katılan üyelerimizle tanıştığımız ilk buluşmamızı başarıyla gerçekleştirdik.",
            date: "12 Kasım 2025, Çarşamba",
            time: "",
            location: "Konferans Salonu B"
        },
        {
            id: "ev_4",
            title: "Mobil Sektöründe Kariyer Sohbetleri",
            category: "Sektör Sohbeti",
            badgeClass: "orta",
            status: "past",
            statusText: "Tamamlandı",
            statusIcon: "fa-solid fa-circle-check",
            description: "Sektörde aktif olarak çalışan tecrübeli konuklarımızla mobil geliştirmenin bugünü, geleceği, iş bulma süreçleri ve CV hazırlama tüyolarını konuştuk.",
            date: "05 Aralık 2025, Cuma",
            time: "",
            location: "Online Zoom"
        },
        {
            id: "ev_5",
            title: "Git ve GitHub Workshop",
            category: "Git / Versiyon Kontrol",
            badgeClass: "zor",
            status: "workshop",
            statusText: "Tamamlandı",
            statusIcon: "fa-solid fa-circle-check",
            description: "Kodlarimizi versiyonlamayi, takim halinde cakisma (conflict) yasamadan calismayi ve projelerimizi GitHub reposuna yuklemeyi uygulamali isledik.",
            date: "20 Aralık 2025, Cumartesi",
            time: "",
            location: "Teknoloji Kampüsü, Lab 404"
        },
        {
            id: "ev_6",
            title: "Figma ile Mobil UI/UX Tasarım Atölyesi",
            category: "Tasarım / UI-UX",
            badgeClass: "kolay",
            status: "workshop",
            statusText: "Tamamlandı",
            statusIcon: "fa-solid fa-circle-check",
            description: "Kullanıcı deneyimi (UX) prensiplerini, mobil arayüz (UI) standartlarını ve Figma'da prototipleme araçlarını sıfırdan uygulamalı olarak öğrendik.",
            date: "10 Ocak 2026, Cumartesi",
            time: "",
            location: "Online Zoom"
        }
    ];

    const initialMockAnnouncements = [
        {
            id: "ann_1",
            title: "Sıfırdan Mobil Geliştirme Atölyeleri Kayıtları Açıldı!",
            category: "Eğitim Atölyesi",
            badgeClass: "kolay",
            date: "15 Ocak 2026",
            description: "Swift ve Kotlin dilleri ile sıfırdan mobil uygulama geliştirme atölyelerimizin kayıtları başlamıştır. Eğitimlerimiz ücretsiz olup, uygulamalı projeler üzerinden yürütülecektir. Katılmak için ana sayfadaki 'Kayıt Ol' butonu ile üyelik başvurusu yapmanız yeterlidir."
        },
        {
            id: "ann_2",
            title: "WhatsApp Duyuru Grubumuza Katılın!",
            category: "Önemli Duyuru",
            badgeClass: "zor",
            date: "10 Ocak 2026",
            description: "Kulüp içindeki eğitim sınıfları, hackathon grupları ve buluşma zamanı güncellemelerinden anlık haberdar olabilmek için üye olduktan sonra sağ üstteki profil panelinizde açılan 'Kulüp WhatsApp Grubu' linkine tıklayarak grubumuza katılabilirsiniz."
        },
        {
            id: "ann_3",
            title: "Sponsorluk ve Partnerlik Görüşmeleri Başladı",
            category: "Genel Haber",
            badgeClass: "orta",
            date: "05 Ocak 2026",
            description: "İstanbul Gedik Üniversitesi Mobil Yazılım Geliştirme Kulübü olarak bu dönem yapacağımız proje yarışmaları ve hackathonlar için sektör temsilcisi teknoloji firmaları ile sponsorluk görüşmelerine başlanmıştır. Detaylar netleştikçe buradan duyurulacaktır."
        }
    ];

    function getLocalStorageEvents() {
        const stored = localStorage.getItem('myk_events');
        if (!stored) {
            localStorage.setItem('myk_events', JSON.stringify(initialMockEvents));
            return initialMockEvents;
        }
        return JSON.parse(stored);
    }

    function saveLocalStorageEvents(events) {
        localStorage.setItem('myk_events', JSON.stringify(events));
    }

    function getLocalStorageAnnouncements() {
        const stored = localStorage.getItem('myk_announcements');
        if (!stored) {
            localStorage.setItem('myk_announcements', JSON.stringify(initialMockAnnouncements));
            return initialMockAnnouncements;
        }
        return JSON.parse(stored);
    }

    function saveLocalStorageAnnouncements(announcements) {
        localStorage.setItem('myk_announcements', JSON.stringify(announcements));
    }

    // Dynamic homepage stats update (combines local + cloud count)
    async function updateHomepageStats() {
        const memberSpan = document.getElementById('homepage-member-count');
        if (!memberSpan) return;

        // If dbMembers is already loaded, use it. Otherwise, load it first.
        if (dbMembers.length === 0) {
            let membersMap = new Map();
            const local = getLocalStorageMembers();
            local.forEach(m => membersMap.set(m.id.toString(), m));

            if (useFirebase) {
                try {
                    const fetchPromise = db.collection('applicants').get();
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000));
                    const snapshot = await Promise.race([fetchPromise, timeoutPromise]);
                    snapshot.forEach(doc => {
                        membersMap.set(doc.id, { id: doc.id, ...doc.data() });
                    });
                } catch (err) {
                    console.error("Firestore read timed out or failed for stats:", err);
                }
            }
            dbMembers = Array.from(membersMap.values());
        }

        const totalCount = dbMembers.length;
        memberSpan.setAttribute('data-val', totalCount);
        memberSpan.innerText = totalCount;
    }

    const trackLabels = {
        ios: "iOS (Swift)",
        android: "Android (Kotlin)",
        cross: "Hibrit (Flutter)",
        uiux: "Tasarım (Figma)"
    };

    // UI elements references
    const loginTrigger = document.getElementById('login-trigger');
    const adminTriggerFooter = document.getElementById('admin-trigger-footer');
    const loginModal = document.getElementById('login-modal');
    const closeLogin = document.getElementById('close-login');
    const adminLoginForm = document.getElementById('admin-login-form');
    const adminDashboard = document.getElementById('admin-dashboard');
    const logoutBtn = document.getElementById('logout-btn');
    const loginError = document.getElementById('login-error-message');
    const memberSearch = document.getElementById('member-search');
    const clearDataBtn = document.getElementById('clear-data-btn');

    // Render table rows and stats counters (Supports Asynchronous Firestore fetch)
    async function renderDashboardTable(filterText = '', forceFetch = false) {
        const listContainer = document.getElementById('admin-member-list');
        if (!listContainer) return;

        listContainer.innerHTML = '';
        
        // 1. Fetch only if cache is empty or forceFetch is requested
        if (dbMembers.length === 0 || forceFetch) {
            let localMembers = getLocalStorageMembers();
            let membersMap = new Map();
            
            localMembers.forEach(m => {
                membersMap.set(m.id.toString(), m);
            });
            
            if (useFirebase) {
                try {
                    const fetchPromise = db.collection('applicants').get();
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000));
                    
                    const snapshot = await Promise.race([fetchPromise, timeoutPromise]);
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        membersMap.set(doc.id, { id: doc.id, ...data });
                    });
                } catch (err) {
                    console.error("Firestore read timed out or failed, displaying local data only:", err);
                }
            }
            dbMembers = Array.from(membersMap.values());
        }
        
        // 2. Calculate Dashboard Stats based on ALL members in memory (not just filtered search matches)
        let total = 0;
        let ios = 0;
        let android = 0;

        dbMembers.forEach(m => {
            total++;
            if (m.track) {
                const tracks = m.track.split(',');
                tracks.forEach(trackKey => {
                    if (trackKey === 'ios') ios++;
                    else if (trackKey === 'android') android++;
                });
            }
        });

        // Write Stats to UI
        document.getElementById('dash-total-members').innerText = total;
        document.getElementById('dash-ios-count').innerText = ios;
        document.getElementById('dash-android-count').innerText = android;

        // 3. Filter members for search display
        const filtered = dbMembers.filter(m => {
            const matchesText = m.name.toLowerCase().includes(filterText.toLowerCase()) || 
                                m.email.toLowerCase().includes(filterText.toLowerCase());
            return matchesText;
        });

        if (filtered.length === 0) {
            listContainer.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 30px;">Kayıt bulunamadı.</td></tr>`;
            return;
        }

        filtered.forEach(m => {
            const tr = document.createElement('tr');
            
            // Build multi-badges HTML for dynamic tracks list
            const trackBadgesHTML = m.track ? m.track.split(',').map(trackKey => {
                const label = trackLabels[trackKey] || trackKey;
                return `<span class="track-badge-mini ${escapeHtml(trackKey)}">${escapeHtml(label.split(' ')[0])}</span>`;
            }).join('') : '';

            const statusClass = m.status === 'approved' ? 'approved' : 'pending';
            const statusText = m.status === 'approved' ? 'Onaylandı' : 'Beklemede';

            tr.innerHTML = `
                <td><strong class="clickable-member-name" data-id="${m.id}" style="cursor: pointer; color: var(--primary); text-decoration: underline; text-underline-offset: 4px;">${escapeHtml(m.name)}</strong></td>
                <td>${escapeHtml(m.email)}</td>
                <td><code>${escapeHtml(m.password || '••••••••')}</code></td>
                <td>${escapeHtml(m.department)}</td>
                <td>${trackBadgesHTML}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    ${m.status === 'pending' ? `<button class="table-btn btn-approve" data-id="${m.id}" title="Onayla"><i class="fa-solid fa-circle-check"></i></button>` : ''}
                    <button class="table-btn btn-delete" data-id="${m.id}" title="Sil"><i class="fa-solid fa-trash-can"></i></button>
                </td>
            `;

            listContainer.appendChild(tr);
        });

        // Attach dynamic button listeners
        listContainer.querySelectorAll('.btn-approve').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                approveMember(id);
            });
        });

        listContainer.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                deleteMember(id);
            });
        });

        // Attach click listener to member names to view detailed profile popup
        listContainer.querySelectorAll('.clickable-member-name').forEach(elem => {
            elem.addEventListener('click', () => {
                const id = elem.getAttribute('data-id');
                openAdminMemberDetail(id);
            });
        });
    }

    // --- Admin Member Detail Modal Logic ---
    const adminMemberDetailModal = document.getElementById('admin-member-detail-modal');
    const closeAdminMemberDetail = document.getElementById('close-admin-member-detail');
    let activeDetailMemberId = null;

    function openAdminMemberDetail(id) {
        const member = dbMembers.find(m => m.id.toString() === id.toString());
        if (!member) return;

        activeDetailMemberId = id;

        // Populate fields
        document.getElementById('admin-detail-name').innerText = member.name;
        document.getElementById('admin-detail-email').innerText = member.email;
        document.getElementById('admin-detail-username').innerText = member.username || '-';
        document.getElementById('admin-detail-student-id').innerText = member.studentId || '-';
        document.getElementById('admin-detail-phone').innerText = member.phone || '-';
        document.getElementById('admin-detail-faculty').innerText = member.faculty || '-';
        document.getElementById('admin-detail-dept').innerText = member.department || '-';
        document.getElementById('admin-detail-grade').innerText = member.grade || '-';
        document.getElementById('admin-detail-birthdate').innerText = member.birthdate || '-';
        document.getElementById('admin-detail-password').innerText = member.password || '-';

        // Set status
        const statusSpan = document.getElementById('admin-detail-status');
        const statusClass = member.status === 'approved' ? 'approved' : 'pending';
        const statusText = member.status === 'approved' ? 'Onaylandı' : 'Beklemede';
        statusSpan.className = `status-badge ${statusClass}`;
        statusSpan.innerText = statusText;

        // Configure Action Buttons display state
        const btnApprove = document.getElementById('admin-detail-approve-btn');
        if (member.status === 'approved') {
            if (btnApprove) btnApprove.style.display = 'none';
        } else {
            if (btnApprove) btnApprove.style.display = 'block';
        }

        // Show modal
        if (adminMemberDetailModal) {
            adminMemberDetailModal.classList.remove('hidden');
        }
    }

    // Attach static click handlers once at start
    const btnApproveDetail = document.getElementById('admin-detail-approve-btn');
    if (btnApproveDetail) {
        btnApproveDetail.addEventListener('click', () => {
            if (activeDetailMemberId) {
                approveMember(activeDetailMemberId);
                if (adminMemberDetailModal) adminMemberDetailModal.classList.add('hidden');
            }
        });
    }

    const btnDeleteDetail = document.getElementById('admin-detail-delete-btn');
    if (btnDeleteDetail) {
        btnDeleteDetail.addEventListener('click', () => {
            if (activeDetailMemberId) {
                deleteMember(activeDetailMemberId);
                if (adminMemberDetailModal) adminMemberDetailModal.classList.add('hidden');
            }
        });
    }

    if (closeAdminMemberDetail) {
        closeAdminMemberDetail.addEventListener('click', () => {
            if (adminMemberDetailModal) adminMemberDetailModal.classList.add('hidden');
        });
    }

    if (adminMemberDetailModal) {
        adminMemberDetailModal.addEventListener('click', (e) => {
            if (e.target === adminMemberDetailModal) {
                adminMemberDetailModal.classList.add('hidden');
            }
        });
    }

    function escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function approveMember(id) {
        // 1. Update LocalStorage immediately to reflect changes instantly on UI
        const numericId = parseInt(id);
        let local = getLocalStorageMembers();
        local = local.map(m => (m.id === numericId || m.id.toString() === id.toString()) ? { ...m, status: 'approved' } : m);
        saveLocalStorageMembers(local);

        // 2. Update in-memory cache instantly
        dbMembers = dbMembers.map(m => (m.id === numericId || m.id.toString() === id.toString()) ? { ...m, status: 'approved' } : m);

        // 3. Dispatch Firestore update asynchronously in the background
        if (useFirebase) {
            db.collection('applicants').doc(id.toString()).update({ status: 'approved' })
                .then(() => console.log("Background Firestore approve succeeded!"))
                .catch(err => console.error("Background Firestore approve failed (Check if Firestore database is created):", err));
        }

        // 4. Re-render the UI table instantly using cached data
        renderDashboardTable(memberSearch.value, false);
        updateHomepageStats();
    }

    function deleteMember(id) {
        if (confirm('Bu başvuruyu listeden silmek istediğinize emin misiniz?')) {
            // 1. Update LocalStorage immediately
            const numericId = parseInt(id);
            let local = getLocalStorageMembers();
            local = local.filter(m => (m.id !== numericId && m.id.toString() !== id.toString()));
            saveLocalStorageMembers(local);

            // 2. Update in-memory cache instantly
            dbMembers = dbMembers.filter(m => (m.id !== numericId && m.id.toString() !== id.toString()));

            // 3. Dispatch Firestore delete asynchronously in the background
            if (useFirebase) {
                db.collection('applicants').doc(id.toString()).delete()
                    .then(() => console.log("Background Firestore delete succeeded!"))
                    .catch(err => console.error("Background Firestore delete failed (Check if Firestore database is created):", err));
            }

            // 4. Re-render the UI table instantly using cached data
            renderDashboardTable(memberSearch.value, false);
            updateHomepageStats();
        }
    }

    // Modal login triggers
    function openLoginModal(e) {
        e.preventDefault();
        loginModal.classList.remove('hidden');
        loginError.classList.add('hidden');
    }

    if (loginTrigger) loginTrigger.addEventListener('click', openLoginModal);
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

    // Tab switching logic in login modal
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

    // Member profile dashboard rendering helper
    const memberDashboardModal = document.getElementById('member-dashboard-modal');
    const closeMemberDash = document.getElementById('close-member-dash');
    const memberLogoutBtn = document.getElementById('member-logout-btn');
    const userProfileTrigger = document.getElementById('user-profile-trigger');
    const memberViewArea = document.getElementById('member-view-area');
    const memberEditArea = document.getElementById('member-edit-area');
    const memberEditBtn = document.getElementById('member-edit-btn');
    const memberEditCancelBtn = document.getElementById('member-edit-cancel-btn');
    const memberProfileEditForm = document.getElementById('member-profile-edit-form');

    // Dynamic header navigation switcher (Giriş Yap -> Profilim)
    function updateHeaderState(member, isLoggedIn) {
        const loginTrigger = document.getElementById('login-trigger');
        const registerTriggerNav = document.getElementById('register-trigger-nav');
        const navUserName = document.getElementById('nav-user-name');

        if (isLoggedIn && member) {
            if (loginTrigger) loginTrigger.classList.add('hidden');
            if (registerTriggerNav) registerTriggerNav.classList.add('hidden');
            if (userProfileTrigger) userProfileTrigger.classList.remove('hidden');
            // Use username if available, otherwise fallback to first name
            if (navUserName) navUserName.innerText = member.username || member.name.split(' ')[0];
        } else {
            if (loginTrigger) loginTrigger.classList.remove('hidden');
            if (registerTriggerNav) registerTriggerNav.classList.remove('hidden');
            if (userProfileTrigger) userProfileTrigger.classList.add('hidden');
        }
    }

    function showMemberDashboard(member) {
        // Reset to view mode first
        if (memberViewArea) memberViewArea.classList.remove('hidden');
        if (memberEditArea) memberEditArea.classList.add('hidden');

        document.getElementById('member-dash-name').innerText = member.name;
        document.getElementById('member-dash-email').innerText = member.email;
        
        // Populate dashboard view values
        document.getElementById('member-dash-username').innerText = member.username || '-';
        document.getElementById('member-dash-student-id').innerText = member.studentId || '-';
        document.getElementById('member-dash-phone').innerText = member.phone || '-';
        document.getElementById('member-dash-faculty').innerText = member.faculty || '-';
        document.getElementById('member-dash-dept').innerText = member.department || '-';
        document.getElementById('member-dash-grade').innerText = member.grade || '-';
        document.getElementById('member-dash-birthdate').innerText = member.birthdate || '-';

        // Set status
        const statusSpan = document.getElementById('member-dash-status');
        const statusClass = member.status === 'approved' ? 'approved' : 'pending';
        const statusText = member.status === 'approved' ? 'Onaylandı' : 'Beklemede';
        statusSpan.className = `status-badge ${statusClass}`;
        statusSpan.innerText = statusText;

        // Display correct status info card
        const pendingCard = document.getElementById('member-status-pending-card');
        const approvedCard = document.getElementById('member-status-approved-card');

        if (member.status === 'approved') {
            if (approvedCard) approvedCard.classList.remove('hidden');
            if (pendingCard) pendingCard.classList.add('hidden');
        } else {
            if (pendingCard) pendingCard.classList.remove('hidden');
            if (approvedCard) approvedCard.classList.add('hidden');
        }

        // Update header nav buttons state
        updateHeaderState(member, true);

        // Show modal
        if (memberDashboardModal) {
            memberDashboardModal.classList.remove('hidden');
        }
    }

    // Member login form submit
    const memberLoginForm = document.getElementById('member-login-form');
    if (memberLoginForm) {
        memberLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('member-email').value.trim().toLowerCase();
            const password = document.getElementById('member-password').value;

            // Make sure cache is loaded
            if (dbMembers.length === 0) {
                await renderDashboardTable('', true);
            }

            // Find member matching credentials
            const foundMember = dbMembers.find(m => m.email.toLowerCase() === email && m.password === password);

            if (foundMember) {
                loginModal.classList.add('hidden');
                sessionStorage.setItem('member_logged_in_email', email);
                showMemberDashboard(foundMember);
                if (memberLoginError) memberLoginError.classList.add('hidden');
                memberLoginForm.reset();
            } else {
                if (memberLoginError) memberLoginError.classList.remove('hidden');
            }
        });
    }

    // Profile button click to open dashboard
    if (userProfileTrigger) {
        userProfileTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            const memberEmail = sessionStorage.getItem('member_logged_in_email');
            if (memberEmail && dbMembers.length > 0) {
                const found = dbMembers.find(m => m.email.toLowerCase() === memberEmail.toLowerCase());
                if (found) {
                    showMemberDashboard(found);
                }
            }
        });
    }

    // Member Dashboard Close/Logout handlers
    if (closeMemberDash) {
        closeMemberDash.addEventListener('click', () => {
            if (memberDashboardModal) memberDashboardModal.classList.add('hidden');
        });
    }

    if (memberDashboardModal) {
        memberDashboardModal.addEventListener('click', (e) => {
            if (e.target === memberDashboardModal) {
                memberDashboardModal.classList.add('hidden');
            }
        });
    }

    if (memberLogoutBtn) {
        memberLogoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('member_logged_in_email');
            updateHeaderState(null, false);
            if (memberDashboardModal) memberDashboardModal.classList.add('hidden');
        });
    }

    // --- Member Profile Edit Mode Event Handlers ---
    
    // Dynamic mapping for Edit Form
    const editFacultySelect = document.getElementById('edit-faculty');
    const editDepartmentSelect = document.getElementById('edit-department');

    if (editFacultySelect && editDepartmentSelect) {
        editFacultySelect.addEventListener('change', () => {
            const selectedFaculty = editFacultySelect.value;
            const departments = facultyDepartments[selectedFaculty] || [];
            
            editDepartmentSelect.innerHTML = '<option value="" disabled selected>Bölüm Seçiniz</option>';
            departments.forEach(dept => {
                const opt = document.createElement('option');
                opt.value = dept;
                opt.innerText = dept;
                editDepartmentSelect.appendChild(opt);
            });
        });
    }

    // Click Edit button to enter edit mode
    if (memberEditBtn) {
        memberEditBtn.addEventListener('click', () => {
            const memberEmail = sessionStorage.getItem('member_logged_in_email');
            if (!memberEmail) return;

            const member = dbMembers.find(m => m.email.toLowerCase() === memberEmail.toLowerCase());
            if (!member) return;

            // Split name
            const nameParts = member.name.split(' ');
            const firstName = nameParts.slice(0, -1).join(' ') || member.name;
            const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

            // Populate form
            document.getElementById('edit-first-name').value = firstName;
            document.getElementById('edit-last-name').value = lastName;
            document.getElementById('edit-email').value = member.email;
            document.getElementById('edit-username').value = member.username || '';
            document.getElementById('edit-student-id').value = member.studentId || '';
            document.getElementById('edit-phone').value = member.phone || '';
            document.getElementById('edit-faculty').value = member.faculty || '';
            
            // Populate department options dynamically
            const departments = facultyDepartments[member.faculty] || [];
            editDepartmentSelect.innerHTML = '<option value="" disabled selected>Bölüm Seçiniz</option>';
            departments.forEach(dept => {
                const opt = document.createElement('option');
                opt.value = dept;
                opt.innerText = dept;
                if (dept === member.department) opt.selected = true;
                editDepartmentSelect.appendChild(opt);
            });

            document.getElementById('edit-grade').value = member.grade || '';
            document.getElementById('edit-birthdate').value = member.birthdate || '';
            document.getElementById('edit-password').value = member.password || '';

            // Toggle view
            if (memberViewArea) memberViewArea.classList.add('hidden');
            if (memberEditArea) memberEditArea.classList.remove('hidden');
            
            const successMsg = document.getElementById('edit-profile-success-message');
            if (successMsg) successMsg.classList.add('hidden');
        });
    }

    // Cancel edit
    if (memberEditCancelBtn) {
        memberEditCancelBtn.addEventListener('click', () => {
            if (memberViewArea) memberViewArea.classList.remove('hidden');
            if (memberEditArea) memberEditArea.classList.add('hidden');
        });
    }

    // Submit edited profile form
    if (memberProfileEditForm) {
        memberProfileEditForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const memberEmail = sessionStorage.getItem('member_logged_in_email');
            if (!memberEmail) return;

            const member = dbMembers.find(m => m.email.toLowerCase() === memberEmail.toLowerCase());
            if (!member) return;

            const firstName = document.getElementById('edit-first-name').value.trim();
            const lastName = document.getElementById('edit-last-name').value.trim();
            const username = document.getElementById('edit-username').value.trim();
            const studentId = document.getElementById('edit-student-id').value.trim();
            const phone = document.getElementById('edit-phone').value.trim();
            const faculty = document.getElementById('edit-faculty').value;
            const department = document.getElementById('edit-department').value;
            const grade = document.getElementById('edit-grade').value;
            const birthdate = document.getElementById('edit-birthdate').value;
            const password = document.getElementById('edit-password').value;

            // Update in-memory cache
            const updatedMember = {
                ...member,
                name: `${firstName} ${lastName}`,
                username: username,
                studentId: studentId,
                phone: phone,
                faculty: faculty,
                department: department,
                grade: grade,
                birthdate: birthdate,
                password: password
            };

            // Write to local cache
            dbMembers = dbMembers.map(m => m.id === member.id ? updatedMember : m);

            // Save to LocalStorage
            let local = getLocalStorageMembers();
            local = local.map(m => m.id === member.id ? updatedMember : m);
            saveLocalStorageMembers(local);

            // Sync with Firebase Firestore (fire-and-forget in background)
            if (useFirebase) {
                db.collection('applicants').doc(member.id.toString()).update({
                    name: updatedMember.name,
                    username: updatedMember.username,
                    studentId: updatedMember.studentId,
                    phone: updatedMember.phone,
                    faculty: updatedMember.faculty,
                    department: updatedMember.department,
                    grade: updatedMember.grade,
                    birthdate: updatedMember.birthdate,
                    password: updatedMember.password
                }).then(() => {
                    console.log("Background Firestore update profile succeeded!");
                }).catch(err => {
                    console.error("Firestore update profile failed:", err);
                });
            }

            // Show success message
            const successMsg = document.getElementById('edit-profile-success-message');
            if (successMsg) successMsg.classList.remove('hidden');

            // Update header name
            updateHeaderState(updatedMember, true);

            // Transition back to view mode after 1.2s
            setTimeout(() => {
                showMemberDashboard(updatedMember);
                // Refresh dashboard table list for admins
                renderDashboardTable(memberSearch.value, false);
            }, 1200);
        });
    }

    // Admin login form submit
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('admin-email').value;
            const pass = document.getElementById('admin-password').value;

            if (email === 'admin@kulup.com' && pass === 'admin') {
                loginModal.classList.add('hidden');
                adminDashboard.classList.remove('hidden');
                document.body.style.overflow = 'hidden'; // Lock scroll
                sessionStorage.setItem('admin_logged_in', 'true'); // Save session state
                renderDashboardTable(memberSearch.value, true); // Force fetch new entries
            } else {
                loginError.classList.remove('hidden');
            }
        });
    }

    // --- Admin Dashboard Tabs Switching & CRUD Operations ---
    const tabBtns = document.querySelectorAll('.dash-tab-btn');
    const tabSections = document.querySelectorAll('.dash-tab-section');

    if (tabBtns.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-tab');
                
                // Reset active styles
                tabBtns.forEach(b => {
                    b.classList.remove('active');
                    b.style.borderBottomColor = 'transparent';
                    b.style.color = 'var(--text-muted)';
                });
                
                btn.classList.add('active');
                btn.style.borderBottomColor = 'var(--primary)';
                btn.style.color = 'var(--headings-color)';

                // Toggle visibility
                tabSections.forEach(sec => sec.classList.add('hidden'));
                const activeSection = document.getElementById(`section-${tab}`);
                if (activeSection) {
                    activeSection.classList.remove('hidden');
                }

                // Render corresponding data
                if (tab === 'members') {
                    renderDashboardTable(memberSearch.value, false);
                } else if (tab === 'events') {
                    renderDashboardEvents();
                } else if (tab === 'announcements') {
                    renderDashboardAnnouncements();
                }
            });
        });
    }

    // Render Events in admin dashboard
    function renderDashboardEvents() {
        const listContainer = document.getElementById('admin-events-list');
        if (!listContainer) return;

        listContainer.innerHTML = '';
        const events = getLocalStorageEvents();

        if (events.length === 0) {
            listContainer.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 30px;">Kayıtlı etkinlik bulunamadı.</td></tr>`;
            return;
        }

        events.forEach(ev => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${escapeHtml(ev.title)}</strong></td>
                <td>${escapeHtml(ev.category)}</td>
                <td><span class="ctf-badge ${escapeHtml(ev.badgeClass)}">${escapeHtml(ev.badgeClass.toUpperCase())}</span></td>
                <td><span class="status-badge ${ev.status === 'upcoming' ? 'approved' : 'pending'}">${escapeHtml(ev.status.toUpperCase())}</span></td>
                <td>${escapeHtml(ev.date)} ${ev.time ? `(${escapeHtml(ev.time)})` : ''}</td>
                <td>${escapeHtml(ev.location)}</td>
                <td>
                    <button class="table-btn btn-edit-event" data-id="${ev.id}" title="Düzenle"><i class="fa-solid fa-pen-to-square" style="color: #00b4d8;"></i></button>
                    <button class="table-btn btn-delete-event" data-id="${ev.id}" title="Sil"><i class="fa-solid fa-trash-can"></i></button>
                </td>
            `;
            listContainer.appendChild(tr);
        });

        // Edit listeners
        listContainer.querySelectorAll('.btn-edit-event').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                openEditEventModal(id);
            });
        });

        // Delete listeners
        listContainer.querySelectorAll('.btn-delete-event').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                deleteEvent(id);
            });
        });
    }

    // Render Announcements in admin dashboard
    function renderDashboardAnnouncements() {
        const listContainer = document.getElementById('admin-announcements-list');
        if (!listContainer) return;

        listContainer.innerHTML = '';
        const announcements = getLocalStorageAnnouncements();

        if (announcements.length === 0) {
            listContainer.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px;">Kayıtlı duyuru bulunamadı.</td></tr>`;
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

        // Edit listeners
        listContainer.querySelectorAll('.btn-edit-ann').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                openEditAnnouncementModal(id);
            });
        });

        // Delete listeners
        listContainer.querySelectorAll('.btn-delete-ann').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                deleteAnnouncement(id);
            });
        });
    }

    // --- Modal opening, saving, deleting handlers ---
    const eventModal = document.getElementById('admin-event-modal');
    const closeEventModalBtn = document.getElementById('close-event-modal');
    const eventForm = document.getElementById('admin-event-form');
    const btnAddEvent = document.getElementById('btn-add-event');

    const announcementModal = document.getElementById('admin-announcement-modal');
    const closeAnnouncementModalBtn = document.getElementById('close-announcement-modal');
    const announcementForm = document.getElementById('admin-announcement-form');
    const btnAddAnnouncement = document.getElementById('btn-add-announcement');

    // Event Modal Actions
    if (btnAddEvent) {
        btnAddEvent.addEventListener('click', () => {
            if (eventForm) eventForm.reset();
            document.getElementById('event-edit-id').value = '';
            document.getElementById('event-modal-title').innerText = 'Yeni Etkinlik Ekle';
            if (eventModal) eventModal.classList.remove('hidden');
        });
    }

    if (closeEventModalBtn && eventModal) {
        closeEventModalBtn.addEventListener('click', () => {
            eventModal.classList.add('hidden');
        });
    }

    if (eventForm) {
        eventForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const editId = document.getElementById('event-edit-id').value;
            const title = document.getElementById('event-title').value.trim();
            const category = document.getElementById('event-category').value.trim();
            const badgeClass = document.getElementById('event-badge').value;
            const status = document.getElementById('event-status').value;
            const statusText = document.getElementById('event-statustext').value.trim();
            const date = document.getElementById('event-date').value.trim();
            const time = document.getElementById('event-time').value.trim();
            const location = document.getElementById('event-location').value.trim();
            const description = document.getElementById('event-description').value.trim();

            let events = getLocalStorageEvents();

            const statusIcon = status === 'upcoming' ? 'fa-solid fa-circle-play' : 'fa-solid fa-circle-check';

            const eventData = {
                id: editId || 'ev_' + Date.now(),
                title,
                category,
                badgeClass,
                status,
                statusText,
                statusIcon,
                description,
                date,
                time,
                location
            };

            if (editId) {
                events = events.map(ev => ev.id === editId ? eventData : ev);
                showStatusToast("Güncellendi!", "Etkinlik başarıyla güncellendi.", true);
            } else {
                events.push(eventData);
                showStatusToast("Eklendi!", "Yeni etkinlik başarıyla eklendi.", true);
            }

            saveLocalStorageEvents(events);
            renderDashboardEvents();
            if (eventModal) eventModal.classList.add('hidden');
        });
    }

    function openEditEventModal(id) {
        const events = getLocalStorageEvents();
        const found = events.find(ev => ev.id === id);
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
            let events = getLocalStorageEvents();
            events = events.filter(ev => ev.id !== id);
            saveLocalStorageEvents(events);
            renderDashboardEvents();
            showStatusToast("Silindi", "Etkinlik başarıyla silindi.", true);
        }
    }

    // Announcement Modal Actions
    if (btnAddAnnouncement) {
        btnAddAnnouncement.addEventListener('click', () => {
            if (announcementForm) announcementForm.reset();
            document.getElementById('announcement-edit-id').value = '';
            document.getElementById('announcement-modal-title').innerText = 'Yeni Duyuru Ekle';
            if (announcementModal) announcementModal.classList.remove('hidden');
        });
    }

    if (closeAnnouncementModalBtn && announcementModal) {
        closeAnnouncementModalBtn.addEventListener('click', () => {
            announcementModal.classList.add('hidden');
        });
    }

    if (announcementForm) {
        announcementForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const editId = document.getElementById('announcement-edit-id').value;
            const title = document.getElementById('announcement-title').value.trim();
            const category = document.getElementById('announcement-category').value.trim();
            const badgeClass = document.getElementById('announcement-badge').value;
            const date = document.getElementById('announcement-date').value.trim();
            const description = document.getElementById('announcement-description').value.trim();

            let announcements = getLocalStorageAnnouncements();

            const announcementData = {
                id: editId || 'ann_' + Date.now(),
                title,
                category,
                badgeClass,
                date,
                description
            };

            if (editId) {
                announcements = announcements.map(ann => ann.id === editId ? announcementData : ann);
                showStatusToast("Güncellendi!", "Duyuru başarıyla güncellendi.", true);
            } else {
                announcements.push(announcementData);
                showStatusToast("Eklendi!", "Yeni duyuru başarıyla eklendi.", true);
            }

            saveLocalStorageAnnouncements(announcements);
            renderDashboardAnnouncements();
            if (announcementModal) announcementModal.classList.add('hidden');
        });
    }

    function openEditAnnouncementModal(id) {
        const announcements = getLocalStorageAnnouncements();
        const found = announcements.find(ann => ann.id === id);
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
            let announcements = getLocalStorageAnnouncements();
            announcements = announcements.filter(ann => ann.id !== id);
            saveLocalStorageAnnouncements(announcements);
            renderDashboardAnnouncements();
            showStatusToast("Silindi", "Duyuru başarıyla silindi.", true);
        }
    }

    // Logout Action
    if (logoutBtn && adminDashboard) {
        logoutBtn.addEventListener('click', () => {
            adminDashboard.classList.add('hidden');
            document.body.style.overflow = 'auto'; // Unlock scroll
            sessionStorage.removeItem('admin_logged_in'); // Clear session state
            if (adminLoginForm) adminLoginForm.reset();
        });
    }

    // Live search filtering
    if (memberSearch) {
        memberSearch.addEventListener('input', (e) => {
            renderDashboardTable(e.target.value, false); // Do not force fetch during search typing
        });
    }

    // Reset database action
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', async () => {
            if (confirm('Tüm başvuru verilerini varsayılan listeye sıfırlamak istiyor musunuz?')) {
                if (useFirebase) {
                    try {
                        const snapshot = await db.collection('applicants').get();
                        const batch = db.batch();
                        snapshot.forEach(doc => {
                            batch.delete(doc.ref);
                        });
                        await batch.commit();
                        console.log("Firestore collection reset completed.");
                    } catch (err) {
                        console.error("Firestore reset failed:", err);
                    }
                } else {
                    localStorage.removeItem('myk_members');
                    localStorage.removeItem('myk_events');
                    localStorage.removeItem('myk_announcements');
                }
                dbMembers = []; // Reset local cache
                await renderDashboardTable(memberSearch.value, true); // Force refetch empty/default list
                updateHomepageStats();
            }
        });
    }

    // --- 8. Theme Switcher (Toggles dark-theme class on body) ---
    const themeToggle = document.getElementById('theme-toggle');
    
    // Load stored theme or default to light (no body class)
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        if (themeToggle) {
            themeToggle.innerHTML = `<i class="fa-solid fa-sun"></i>`;
        }
    } else {
        document.body.classList.remove('dark-theme');
        if (themeToggle) {
            themeToggle.innerHTML = `<i class="fa-solid fa-moon"></i>`;
        }
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            
            if (document.body.classList.contains('dark-theme')) {
                themeToggle.innerHTML = `<i class="fa-solid fa-sun"></i>`;
                localStorage.setItem('theme', 'dark');
            } else {
                themeToggle.innerHTML = `<i class="fa-solid fa-moon"></i>`;
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // --- 9. Initial Load Triggers (Stats & Admin Session Persistence) ---
    updateHomepageStats().then(() => {
        // Auto-login member if session exists
        const memberEmail = sessionStorage.getItem('member_logged_in_email');
        if (memberEmail && dbMembers.length > 0) {
            const found = dbMembers.find(m => m.email.toLowerCase() === memberEmail.toLowerCase());
            if (found) {
                updateHeaderState(found, true); // Update header navigation ONLY (no modal popup on reload)
            }
        }
    });

    if (sessionStorage.getItem('admin_logged_in') === 'true') {
        if (adminDashboard) {
            adminDashboard.classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // Lock scroll
            renderDashboardTable('', true); // Force fetch on page load
        }
    }

    // --- 10. Club Tools (CV Builder, Skills Evaluator, Leaderboard, Quiz, CTF) Logic ---
    const toolModal = document.getElementById('tool-modal');
    const closeToolModal = document.getElementById('close-tool-modal');
    const toolModalBody = document.getElementById('tool-modal-body');

    if (closeToolModal) {
        closeToolModal.addEventListener('click', () => {
            if (toolModal) toolModal.classList.add('hidden');
        });
    }

    if (toolModal) {
        toolModal.addEventListener('click', (e) => {
            if (e.target === toolModal) {
                toolModal.classList.add('hidden');
            }
        });
    }

    document.querySelectorAll('.tool-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const toolName = link.getAttribute('data-tool');
            const loggedInEmail = sessionStorage.getItem('member_logged_in_email');

            if (!loggedInEmail) {
                alert("Bu aracı kullanmak için lütfen üye girişi yapın!");
                const loginModal = document.getElementById('login-modal');
                if (loginModal) {
                    loginModal.classList.remove('hidden');
                    const errorArea = document.getElementById('member-login-error');
                    if (errorArea) errorArea.classList.add('hidden');
                }
                return;
            }

            const member = dbMembers.find(m => m.email.toLowerCase() === loggedInEmail.toLowerCase());
            if (!member) return;

            openToolModal(toolName, member);
        });
    });

    function openToolModal(toolName, member) {
        if (!toolModalBody || !toolModal) return;

        toolModal.classList.remove('hidden');
        toolModalBody.innerHTML = ''; // Clear previous

        if (toolName === 'cv') {
            loadCVTool(member);
        } else if (toolName === 'skills') {
            loadSkillsTool(member);
        } else if (toolName === 'leaderboard') {
            loadLeaderboardTool(member);
        } else if (toolName === 'quiz') {
            loadQuizTool(member);
        } else if (toolName === 'ctf') {
            loadCTFTool(member);
        }
    }

    // --- CV Builder Tool ---
    function loadCVTool(member) {
        toolModalBody.innerHTML = `
            <div class="tool-header-area">
                <span class="tool-icon-wrap"><i class="fa-solid fa-file-invoice"></i></span>
                <div>
                    <h3>CV Hazırlayıcı</h3>
                    <p>Bilgilerinizi girerek saniyeler içinde modern bir PDF CV oluşturun.</p>
                </div>
            </div>
            <div class="tool-grid">
                <div>
                    <form id="cv-builder-form" style="display: flex; flex-direction: column; gap: 15px;">
                        <div class="form-group" style="margin-bottom: 0;">
                            <label>Ad Soyad</label>
                            <input type="text" id="cv-input-name" value="${member.name}" required>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label>Ünvan / Rol</label>
                            <input type="text" id="cv-input-title" placeholder="Örn: iOS Geliştirici | Öğrenci" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group" style="margin-bottom: 0;">
                                <label>GitHub</label>
                                <input type="url" id="cv-input-github" placeholder="https://github.com/...">
                            </div>
                            <div class="form-group" style="margin-bottom: 0;">
                                <label>LinkedIn</label>
                                <input type="url" id="cv-input-linkedin" placeholder="https://linkedin.com/in/...">
                            </div>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label>Eğitim</label>
                            <textarea id="cv-input-education" rows="3" placeholder="Örn: İstanbul Gedik Üniversitesi - Yazılım Mühendisliği (2024-Devam)"></textarea>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label>Deneyim & Projeler</label>
                            <textarea id="cv-input-experience" rows="4" placeholder="Geliştirdiğiniz projeleri ve deneyimlerinizi buraya yazın..."></textarea>
                        </div>
                        <button type="button" id="cv-btn-print" class="btn btn-primary btn-full glow-btn" style="margin-top: 10px;"><i class="fa-solid fa-print"></i> PDF Olarak Kaydet / Yazdır</button>
                    </form>
                </div>
                <div class="tool-preview-pane">
                    <div class="cv-preview-card" id="cv-preview">
                        <div class="cv-header">
                           <div class="cv-name" id="cv-preview-name">${member.name}</div>
                           <div class="cv-title" id="cv-preview-title">Mobil Yazılım Geliştirici</div>
                           <div style="font-size: 0.8rem; color: #6b7280; margin-top: 5px;">
                               <span>${member.email}</span> | <span id="cv-preview-links">Links</span>
                           </div>
                        </div>
                        <div class="cv-section-title">Eğitim</div>
                        <p id="cv-preview-education" style="white-space: pre-wrap;">Henüz girilmedi...</p>
                        
                        <div class="cv-section-title">Deneyim & Projeler</div>
                        <p id="cv-preview-experience" style="white-space: pre-wrap;">Henüz girilmedi...</p>
                    </div>
                </div>
            </div>
        `;

        const nameIn = document.getElementById('cv-input-name');
        const titleIn = document.getElementById('cv-input-title');
        const ghIn = document.getElementById('cv-input-github');
        const liIn = document.getElementById('cv-input-linkedin');
        const eduIn = document.getElementById('cv-input-education');
        const expIn = document.getElementById('cv-input-experience');

        const pName = document.getElementById('cv-preview-name');
        const pTitle = document.getElementById('cv-preview-title');
        const pLinks = document.getElementById('cv-preview-links');
        const pEdu = document.getElementById('cv-preview-education');
        const pExp = document.getElementById('cv-preview-experience');

        function updatePreview() {
            pName.innerText = nameIn.value || member.name;
            pTitle.innerText = titleIn.value || "Mobil Yazılım Geliştirici";
            
            let linksArr = [];
            if (ghIn.value) linksArr.push('GitHub');
            if (liIn.value) linksArr.push('LinkedIn');
            pLinks.innerText = linksArr.length > 0 ? linksArr.join(' - ') : 'GitHub - LinkedIn';

            pEdu.innerText = eduIn.value || "Henüz girilmedi...";
            pExp.innerText = expIn.value || "Henüz girilmedi...";
        }

        [nameIn, titleIn, ghIn, liIn, eduIn, expIn].forEach(input => {
            if (input) input.addEventListener('input', updatePreview);
        });

        updatePreview(); // Initial call

        const printBtn = document.getElementById('cv-btn-print');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                const win = window.open('', '_blank');
                win.document.write(`
                    <html>
                    <head>
                        <title>${nameIn.value || member.name} - CV</title>
                        <style>
                            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');
                            body { font-family: 'Outfit', sans-serif; color: #1f2937; padding: 50px; line-height: 1.6; }
                            .header { border-bottom: 2px solid #8c0b45; padding-bottom: 20px; margin-bottom: 30px; }
                            .name { font-size: 32px; font-weight: 700; color: #8c0b45; }
                            .title { font-size: 18px; color: #4b5563; margin-top: 5px; }
                            .contact { font-size: 13px; color: #6b7280; margin-top: 10px; }
                            .section-title { font-size: 20px; font-weight: 700; color: #8c0b45; border-bottom: 1px solid #e5e7eb; margin-top: 35px; padding-bottom: 6px; margin-bottom: 12px; }
                            p { margin: 0 0 10px 0; white-space: pre-wrap; font-size: 14px; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <div class="name">${nameIn.value || member.name}</div>
                            <div class="title">${titleIn.value || "Mobil Yazılım Geliştirici"}</div>
                            <div class="contact">
                                E-posta: ${member.email} ${ghIn.value ? ' | GitHub: ' + ghIn.value : ''} ${liIn.value ? ' | LinkedIn: ' + liIn.value : ''}
                            </div>
                        </div>
                        
                        <div class="section-title">Eğitim</div>
                        <p>${eduIn.value || 'Girilen eğitim bilgisi bulunmamaktadır.'}</p>
                        
                        <div class="section-title">Deneyim & Projeler</div>
                        <p>${expIn.value || 'Girilen deneyim bilgisi bulunmamaktadır.'}</p>
                    </body>
                    </html>
                `);
                win.document.close();
                setTimeout(() => {
                    win.print();
                }, 500);
            });
        }
    }

    // --- Skills Evaluator Tool ---
    function loadSkillsTool(member) {
        const swiftVal = member.skillSwift || 50;
        const kotlinVal = member.skillKotlin || 50;
        const gitVal = member.skillGit || 50;
        const uiVal = member.skillUI || 50;
        const apiVal = member.skillAPI || 50;

        toolModalBody.innerHTML = `
            <div class="tool-header-area">
                <span class="tool-icon-wrap"><i class="fa-solid fa-chart-line"></i></span>
                <div>
                    <h3>Yetenek Skoru Değerlendirici</h3>
                    <p>Yetenek seviyenizi belirleyin, geliştirici puanınızı yükseltin ve Liderlik Tablosunda yükselin!</p>
                </div>
            </div>
            <div class="tool-grid">
                <div>
                    <div class="skills-slider-item">
                        <div class="slider-header">
                            <span>Swift & iOS Geliştirme</span>
                            <span id="label-swift">${swiftVal}%</span>
                        </div>
                        <input type="range" id="slider-swift" min="0" max="100" value="${swiftVal}">
                    </div>
                    <div class="skills-slider-item">
                        <div class="slider-header">
                            <span>Kotlin & Android Geliştirme</span>
                            <span id="label-kotlin">${kotlinVal}%</span>
                        </div>
                        <input type="range" id="slider-kotlin" min="0" max="100" value="${kotlinVal}">
                    </div>
                    <div class="skills-slider-item">
                        <div class="slider-header">
                            <span>Git & GitHub Versiyon Kontrolü</span>
                            <span id="label-git">${gitVal}%</span>
                        </div>
                        <input type="range" id="slider-git" min="0" max="100" value="${gitVal}">
                    </div>
                    <div class="skills-slider-item">
                        <div class="slider-header">
                            <span>UI/UX Mobil Tasarım</span>
                            <span id="label-ui">${uiVal}%</span>
                        </div>
                        <input type="range" id="slider-ui" min="0" max="100" value="${uiVal}">
                    </div>
                    <div class="skills-slider-item">
                        <div class="slider-header">
                            <span>Rest API & Mobil Veritabanı</span>
                            <span id="label-api">${apiVal}%</span>
                        </div>
                        <input type="range" id="slider-api" min="0" max="100" value="${apiVal}">
                    </div>
                    
                    <button type="button" id="skills-btn-save" class="btn btn-primary btn-full glow-btn" style="margin-top: 15px;"><i class="fa-solid fa-cloud-arrow-up"></i> Skorumu Kaydet ve Puanla</button>
                </div>
                <div class="score-gauge-wrap">
                    <h4>Geliştirici Seviyeniz</h4>
                    <div class="score-value" id="score-val-total">0</div>
                    <div class="score-rank" id="score-rank-text">-</div>
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 15px;">Bu puan Liderlik Tablosunda sıralamanızı belirler.</p>
                </div>
            </div>
        `;

        const sliderSwift = document.getElementById('slider-swift');
        const sliderKotlin = document.getElementById('slider-kotlin');
        const sliderGit = document.getElementById('slider-git');
        const sliderUI = document.getElementById('slider-ui');
        const sliderAPI = document.getElementById('slider-api');

        const lblSwift = document.getElementById('label-swift');
        const lblKotlin = document.getElementById('label-kotlin');
        const lblGit = document.getElementById('label-git');
        const lblUI = document.getElementById('label-ui');
        const lblAPI = document.getElementById('label-api');

        const scoreValTotal = document.getElementById('score-val-total');
        const scoreRankText = document.getElementById('score-rank-text');

        function calculateTotal() {
            const s = parseInt(sliderSwift.value);
            const k = parseInt(sliderKotlin.value);
            const g = parseInt(sliderGit.value);
            const u = parseInt(sliderUI.value);
            const a = parseInt(sliderAPI.value);

            const avg = Math.round((s + k + g + u + a) / 5);
            scoreValTotal.innerText = avg;

            let rank = '';
            if (avg < 40) rank = "Junior Developer Trainee 🥚";
            else if (avg < 70) rank = "Intermediate Mobile Developer 🚀";
            else if (avg < 90) rank = "Advanced Mobile Engineer 🏆";
            else rank = "Mythic Tech Lead 👑";

            scoreRankText.innerText = rank;

            lblSwift.innerText = s + '%';
            lblKotlin.innerText = k + '%';
            lblGit.innerText = g + '%';
            lblUI.innerText = u + '%';
            lblAPI.innerText = a + '%';
        }

        [sliderSwift, sliderKotlin, sliderGit, sliderUI, sliderAPI].forEach(slider => {
            slider.addEventListener('input', calculateTotal);
        });

        calculateTotal();

        const saveBtn = document.getElementById('skills-btn-save');
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                saveBtn.disabled = true;
                saveBtn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> Kaydediliyor...`;

                const finalScore = parseInt(scoreValTotal.innerText);

                member.skillSwift = parseInt(sliderSwift.value);
                member.skillKotlin = parseInt(sliderKotlin.value);
                member.skillGit = parseInt(sliderGit.value);
                member.skillUI = parseInt(sliderUI.value);
                member.skillAPI = parseInt(sliderAPI.value);
                member.skillsScore = finalScore;

                dbMembers = dbMembers.map(m => m.id === member.id ? member : m);

                let local = getLocalStorageMembers();
                local = local.map(m => m.id === member.id ? member : m);
                saveLocalStorageMembers(local);

                if (useFirebase) {
                    try {
                        await db.collection('applicants').doc(member.id.toString()).update({
                            skillSwift: member.skillSwift,
                            skillKotlin: member.skillKotlin,
                            skillGit: member.skillGit,
                            skillUI: member.skillUI,
                            skillAPI: member.skillAPI,
                            skillsScore: member.skillsScore
                        });
                    } catch (err) {
                        console.error("Firestore skills sync failed:", err);
                    }
                }

                alert(`Yetenek skorunuz (${finalScore}/100) başarıyla profiline kaydedildi! Liderlik tablosu güncellendi.`);
                saveBtn.disabled = false;
                saveBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Skorumu Kaydet ve Puanla`;
            });
        }
    }

    // --- Leaderboard Tool ---
    function loadLeaderboardTool(member) {
        dbMembers.forEach(m => {
            if (m.id === 101) {
                m.skillsScore = 65;
                m.quizPoints = 40;
                m.ctfPoints = 30;
            } else if (m.id === 102) {
                m.skillsScore = 80;
                m.quizPoints = 50;
                m.ctfPoints = 50;
            }
        });

        const rankedMembers = [...dbMembers].map(m => {
            const score = m.skillsScore || 0;
            const quiz = m.quizPoints || 0;
            const ctf = m.ctfPoints || 0;
            return {
                ...m,
                totalPoints: score + quiz + ctf
            };
        }).sort((a, b) => b.totalPoints - a.totalPoints);

        let rowsHTML = '';
        rankedMembers.forEach((m, idx) => {
            const rankNum = idx + 1;
            let rankBadge = rankNum;
            if (rankNum === 1) rankBadge = '🥇';
            else if (rankNum === 2) rankBadge = '🥈';
            else if (rankNum === 3) rankBadge = '🥉';

            const isMe = m.id.toString() === member.id.toString();
            const rowClass = isMe ? 'leaderboard-row current-user' : 'leaderboard-row';
            const displayName = m.username || m.name;

            rowsHTML += `
                <div class="${rowClass}">
                    <div class="leaderboard-user-info">
                        <span class="leaderboard-rank">${rankBadge}</span>
                        <span class="leaderboard-name">${escapeHtml(displayName)} ${isMe ? ' (Sen)' : ''}</span>
                    </div>
                    <div class="leaderboard-points">${m.totalPoints} Puan</div>
                </div>
            `;
        });

        toolModalBody.innerHTML = `
            <div class="tool-header-area">
                <span class="tool-icon-wrap"><i class="fa-solid fa-trophy"></i></span>
                <div>
                    <h3>Kulüp Liderlik Tablosu</h3>
                    <p>Üyelerin Yetenek Skoru, Quiz puanları ve CTF çözümlerine göre sıralama listesi.</p>
                </div>
            </div>
            <div class="leaderboard-list">
                ${rowsHTML}
            </div>
        `;
    }

    // --- Quiz Tool ---
    function loadQuizTool(member) {
        const quizQuestions = [
            {
                q: "Swift dilinde isteğe bağlı (değer içerebilen veya nil olabilen) değişkenleri tanımlamak için hangi sembol kullanılır?",
                o: ["?", "!", "*", "&"],
                a: 0
            },
            {
                q: "Kotlin'de değiştirilemez (read-only) bir değişken tanımlamak için hangi anahtar kelime kullanılır?",
                o: ["var", "val", "let", "const"],
                a: 1
            },
            {
                q: "Mobil arayüz tasarımlarında Apple tarafından önerilen resmi tasarım dili hangisidir?",
                o: ["Material Design", "Human Interface Guidelines (HIG)", "Fluent Design", "Bootstrap"],
                a: 1
            },
            {
                q: "Bir uygulamanın arka plan servislerini ve bileşenlerini Android işletim sistemine bildirdiğimiz XML dosyası hangisidir?",
                o: ["build.gradle", "MainActivity.kt", "AndroidManifest.xml", "strings.xml"],
                a: 2
            },
            {
                q: "iOS geliştirmede arayüz tasarımlarını kodla bildirimsel (declarative) olarak oluşturmamızı sağlayan modern framework hangisidir?",
                o: ["UIKit", "SwiftUI", "Storyboards", "Xamarin"],
                a: 1
            }
        ];

        let currentQuestionIndex = 0;
        let correctAnswersCount = 0;
        let selectedOptionIndex = null;

        function renderWelcome() {
            toolModalBody.innerHTML = `
                <div class="tool-header-area">
                    <span class="tool-icon-wrap"><i class="fa-solid fa-circle-question"></i></span>
                    <div>
                        <h3>Mobil Kodlama Quizi</h3>
                        <p>5 soruluk mobil geliştirme testimize katılın, puan kazanın!</p>
                    </div>
                </div>
                <div class="quiz-welcome-screen">
                    <i class="fa-solid fa-laptop-code" style="font-size: 4rem; color: var(--primary); margin-bottom: 20px; display: block;"></i>
                    <h4>Kazanabileceğin Puan: +50 Liderlik Puanı</h4>
                    <p style="margin: 15px 0 25px 0; color: var(--text-muted);">Sorular iOS (Swift) ve Android (Kotlin) genel konseptlerini içerir. Her doğru yanıt 10 puan kazandırır.</p>
                    <button type="button" id="quiz-btn-start" class="btn btn-primary glow-btn"><i class="fa-solid fa-play"></i> Teste Başla</button>
                </div>
            `;

            const startBtn = document.getElementById('quiz-btn-start');
            if (startBtn) startBtn.addEventListener('click', startQuiz);
        }

        function startQuiz() {
            currentQuestionIndex = 0;
            correctAnswersCount = 0;
            renderQuestion();
        }

        function renderQuestion() {
            selectedOptionIndex = null;
            const currentQ = quizQuestions[currentQuestionIndex];
            const progressPercent = Math.round((currentQuestionIndex / quizQuestions.length) * 100);

            let optionsHTML = '';
            currentQ.o.forEach((opt, idx) => {
                optionsHTML += `
                    <button type="button" class="quiz-option-btn" data-idx="${idx}">
                        ${escapeHtml(opt)}
                    </button>
                `;
            });

            toolModalBody.innerHTML = `
                <div class="tool-header-area">
                    <span class="tool-icon-wrap"><i class="fa-solid fa-circle-question"></i></span>
                    <div>
                        <h3>Soru ${currentQuestionIndex + 1} / ${quizQuestions.length}</h3>
                        <p>Doğru seçeneği işaretleyin ve ilerleyin.</p>
                    </div>
                </div>
                <div class="quiz-question-screen">
                    <div class="quiz-progress-bar">
                        <div class="quiz-progress-fill" style="width: ${progressPercent}%;"></div>
                    </div>
                    <h4 style="text-align: left; line-height: 1.5; margin-bottom: 20px;">${escapeHtml(currentQ.q)}</h4>
                    <div class="quiz-options-list">
                        ${optionsHTML}
                    </div>
                    <button type="button" id="quiz-btn-next" class="btn btn-primary glow-btn btn-full" disabled>Sonraki Soru <i class="fa-solid fa-arrow-right"></i></button>
                </div>
            `;

            const optionBtns = toolModalBody.querySelectorAll('.quiz-option-btn');
            const nextBtn = document.getElementById('quiz-btn-next');

            optionBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    optionBtns.forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    selectedOptionIndex = parseInt(btn.getAttribute('data-idx'));
                    if (nextBtn) nextBtn.disabled = false;
                });
            });

            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    if (selectedOptionIndex === currentQ.a) {
                        correctAnswersCount++;
                    }

                    currentQuestionIndex++;
                    if (currentQuestionIndex < quizQuestions.length) {
                        renderQuestion();
                    } else {
                        renderResults();
                    }
                });
            }
        }

        function renderResults() {
            const scorePoints = correctAnswersCount * 10;
            const progressPercent = 100;

            toolModalBody.innerHTML = `
                <div class="tool-header-area">
                    <span class="tool-icon-wrap"><i class="fa-solid fa-square-poll-vertical"></i></span>
                    <div>
                        <h3>Test Sonuçları</h3>
                        <p>Katılımınız için teşekkürler!</p>
                    </div>
                </div>
                <div class="quiz-result-screen">
                    <div class="quiz-progress-bar" style="margin-bottom: 25px;">
                        <div class="quiz-progress-fill" style="width: ${progressPercent}%;"></div>
                    </div>
                    <i class="fa-solid fa-medal" style="font-size: 4rem; color: #f59e0b; margin-bottom: 20px; display: block;"></i>
                    <h4>Sonuç: ${correctAnswersCount} / ${quizQuestions.length} Doğru</h4>
                    <div class="score-value">+${scorePoints} Puan</div>
                    <p style="margin: 15px 0 25px 0; color: var(--text-muted);">Puanlarınızı Liderlik Tablosunda yükselmek için profilinize yükleyebilirsiniz.</p>
                    
                    <button type="button" id="quiz-btn-save-score" class="btn btn-primary glow-btn btn-full"><i class="fa-solid fa-cloud-arrow-up"></i> Puanları Profilime Yükle</button>
                </div>
            `;

            const saveBtn = document.getElementById('quiz-btn-save-score');
            if (saveBtn) {
                saveBtn.addEventListener('click', async () => {
                    saveBtn.disabled = true;
                    saveBtn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> Yükleniyor...`;

                    member.quizPoints = (member.quizPoints || 0) + scorePoints;

                    dbMembers = dbMembers.map(m => m.id === member.id ? member : m);

                    let local = getLocalStorageMembers();
                    local = local.map(m => m.id === member.id ? member : m);
                    saveLocalStorageMembers(local);

                    if (useFirebase) {
                        try {
                            await db.collection('applicants').doc(member.id.toString()).update({
                                quizPoints: member.quizPoints
                            });
                        } catch (err) {
                            console.error("Firestore quiz points sync failed:", err);
                        }
                    }

                    alert(`Harika! +${scorePoints} Puan profilinize eklendi! Toplam Quiz Puanınız: ${member.quizPoints}`);
                    if (toolModal) toolModal.classList.add('hidden');
                });
            }
        }

        renderWelcome();
    }

    // --- CTF Tool ---
    function loadCTFTool(member) {
        console.log("%c[MYGK CTF SIZINTISI]%c FLAG_SECRET = MYGK{logcat_snoop}", "background: #8c0b45; color: white; font-weight: bold; padding: 4px;", "color: var(--primary); font-weight: bold;");

        const solvedFlags = member.solvedFlags ? member.solvedFlags.split(',') : [];

        function renderCTFList() {
            const ctf1Solved = solvedFlags.includes('ctf1');
            const ctf2Solved = solvedFlags.includes('ctf2');
            const ctf3Solved = solvedFlags.includes('ctf3');

            toolModalBody.innerHTML = `
                <div class="tool-header-area">
                    <span class="tool-icon-wrap"><i class="fa-solid fa-flag"></i></span>
                    <div>
                        <h3>Mobil CTF (Bayrağı Yakala)</h3>
                        <p>Hacking ve kod analiz yeteneklerinizi test edin, gizli bayrakları (flag) bulup puanları kapın!</p>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    
                    <div class="ctf-card ${ctf1Solved ? 'solved' : ''}">
                        <span class="ctf-badge kolay">Kolay | +30 Puan</span>
                        <h4>1. Geliştirici Log Analizi</h4>
                        <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 5px;">
                            Geliştirici loglarına sızan gizli bayrağı bulabilir misin? Geliştirici konsolunda basılan <strong>FLAG_SECRET</strong> değerini tespit et. (İpucu: Sağ tık -> İncele -> Console sekmesini kontrol et!)
                        </p>
                        ${ctf1Solved ? `
                            <div style="color: #10b981; font-weight: 600; margin-top: 10px;"><i class="fa-solid fa-circle-check"></i> ÇÖZÜLDÜ! (Bayrak: MYGK{logcat_snoop})</div>
                        ` : `
                            <div class="ctf-input-row">
                                <input type="text" id="ctf-flag-1" placeholder="MYGK{bayrak_degeri}">
                                <button type="button" class="btn btn-primary btn-sm ctf-submit-btn" data-ctf="1">Gönder</button>
                            </div>
                            <div id="ctf-error-1" class="hidden error-text" style="margin-top: 10px; margin-bottom: 0;"><i class="fa-solid fa-circle-xmark"></i> Hatalı bayrak!</div>
                        `}
                    </div>

                    <div class="ctf-card ${ctf2Solved ? 'solved' : ''}">
                        <span class="ctf-badge orta">Orta | +50 Puan</span>
                        <h4>2. Swift Base64 Analizi</h4>
                        <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 5px;">
                            Aşağıdaki Swift fonksiyonunun geri döndürdüğü dize değerini deşifre ederek bayrağı elde edin:
                        </p>
                        <code>func getSecretFlag() -> String {
    let base64Text = "TVlHS3tzd2lmdF9kZWNyeXB0X29reX0="
    // Base64 dizesini çöz ve geri döndür
    return decodedString
}</code>
                        ${ctf2Solved ? `
                            <div style="color: #10b981; font-weight: 600; margin-top: 10px;"><i class="fa-solid fa-circle-check"></i> ÇÖZÜLDÜ! (Bayrak: MYGK{swift_decrypt_oky})</div>
                        ` : `
                            <div class="ctf-input-row">
                                <input type="text" id="ctf-flag-2" placeholder="MYGK{bayrak_degeri}">
                                <button type="button" class="btn btn-primary btn-sm ctf-submit-btn" data-ctf="2">Gönder</button>
                            </div>
                            <div id="ctf-error-2" class="hidden error-text" style="margin-top: 10px; margin-bottom: 0;"><i class="fa-solid fa-circle-xmark"></i> Hatalı bayrak!</div>
                        `}
                    </div>

                    <div class="ctf-card ${ctf3Solved ? 'solved' : ''}">
                        <span class="ctf-badge zor">Zor | +70 Puan</span>
                        <h4>3. Regex Eşleştirme Deseni</h4>
                        <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 5px;">
                            Aşağıdaki regex desenini (regular expression) tam olarak eşleştiren ve kulüp ismimizle başlayan dizeyi bulup bayrak olarak girin:
                        </p>
                        <code>Desen: ^MYGK\\{[a-z]{3}_[0-9]{3}_[a-z]{4}\\}$</code>
                        <p style="color: var(--text-muted); font-size: 0.8rem; margin-top: 5px; margin-bottom: 10px;">
                            (Açıklama: Üç küçük harf, alt çizgi, üç rakam, alt çizgi, dört küçük harf. Örn: MYGK{dev_204_code})
                        </p>
                        ${ctf3Solved ? `
                            <div style="color: #10b981; font-weight: 600; margin-top: 10px;"><i class="fa-solid fa-circle-check"></i> ÇÖZÜLDÜ! (Regex başarıyla eşleştirildi!)</div>
                        ` : `
                            <div class="ctf-input-row">
                                <input type="text" id="ctf-flag-3" placeholder="MYGK{bayrak_degeri}">
                                <button type="button" class="btn btn-primary btn-sm ctf-submit-btn" data-ctf="3">Gönder</button>
                            </div>
                            <div id="ctf-error-3" class="hidden error-text" style="margin-top: 10px; margin-bottom: 0;"><i class="fa-solid fa-circle-xmark"></i> Dize regex desenine uymuyor!</div>
                        `}
                    </div>

                </div>
            `;

            toolModalBody.querySelectorAll('.ctf-submit-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const challengeId = btn.getAttribute('data-ctf');
                    const inputField = document.getElementById(`ctf-flag-${challengeId}`);
                    const errorDiv = document.getElementById(`ctf-error-${challengeId}`);
                    const flagValue = inputField.value.trim();

                    let isCorrect = false;
                    let pointsEarned = 0;

                    if (challengeId === '1') {
                        isCorrect = (flagValue === 'MYGK{logcat_snoop}');
                        pointsEarned = 30;
                    } else if (challengeId === '2') {
                        isCorrect = (flagValue === 'MYGK{swift_decrypt_oky}');
                        pointsEarned = 50;
                    } else if (challengeId === '3') {
                        const regex = /^MYGK\{[a-z]{3}_[0-9]{3}_[a-z]{4}\}$/;
                        isCorrect = regex.test(flagValue);
                        pointsEarned = 70;
                    }

                    if (isCorrect) {
                        if (errorDiv) errorDiv.classList.add('hidden');
                        alert(`TEBRİKLER! Bayrağı Yakaladın! +${pointsEarned} Puan kazandın!`);

                        solvedFlags.push(`ctf${challengeId}`);
                        member.solvedFlags = solvedFlags.join(',');
                        member.ctfPoints = (member.ctfPoints || 0) + pointsEarned;

                        dbMembers = dbMembers.map(m => m.id === member.id ? member : m);

                        let local = getLocalStorageMembers();
                        local = local.map(m => m.id === member.id ? member : m);
                        saveLocalStorageMembers(local);

                        if (useFirebase) {
                            db.collection('applicants').doc(member.id.toString()).update({
                                solvedFlags: member.solvedFlags,
                                ctfPoints: member.ctfPoints
                            }).catch(err => console.error("Firestore CTF sync error:", err));
                        }

                        renderCTFList();
                    } else {
                        if (errorDiv) errorDiv.classList.remove('hidden');
                    }
                });
            });
        }

        renderCTFList();
    }

    // --- 11. Contact Form Handler ---
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> Gönderiliyor...`;
            
            const name = document.getElementById('contact-name').value.trim();
            const email = document.getElementById('contact-email').value.trim();
            const subject = document.getElementById('contact-subject').value;
            const message = document.getElementById('contact-message').value.trim();
            
            // 1. Rate limiting / Flood prevention (60 seconds cooldown)
            const lastSubmit = localStorage.getItem('last_contact_submit_time');
            const now = Date.now();
            if (lastSubmit && (now - lastSubmit < 60000)) {
                const remaining = Math.round((60000 - (now - lastSubmit)) / 1000);
                showStatusToast("Yavaş Olun!", `Yeni bir mesaj göndermek için ${remaining} saniye beklemelisiniz.`, false);
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }

            // 2. Spam Bot Honeypot check
            const honeyPotEl = document.getElementById('contact-hp');
            if (honeyPotEl && honeyPotEl.value) {
                console.warn("Spam bot submission blocked.");
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }

            // 3. Strict Email Validation Regex
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(email)) {
                showStatusToast("Geçersiz E-posta", "Lütfen geçerli bir e-posta adresi giriniz! (Örn: isim@domain.com)", false);
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }

            // 4. Block temporary/disposable email domains
            const tempEmailDomains = ['tempmail.com', '10minutemail.com', 'yopmail.com', 'mailinator.com', 'temp-mail.org', 'guerrillamail.com', 'sharklasers.com', 'dispostable.com', 'getairmail.com', 'boun.cr', 'tempmail.net', 'tempmailaddress.com'];
            const emailDomain = email.split('@')[1].toLowerCase();
            if (tempEmailDomains.includes(emailDomain)) {
                showStatusToast("Geçersiz E-posta", "Geçici veya tek kullanımlık e-posta adresleri kabul edilmemektedir.", false);
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }

            // 5. Try sending via EmailJS if enabled
            if (useEmailJS) {
                const templateParams = {
                    name: name,
                    email: email,
                    title: subject, // Maps to {{title}} in your subject line
                    message: message, // Maps to {{message}}
                    time: new Date().toLocaleString('tr-TR') // Maps to {{time}} in your email body
                };

                const tId = CONFIG.emailjs.contactTemplateId || "template_contact";

                emailjs.send(CONFIG.emailjs.serviceId, tId, templateParams)
                    .then((response) => {
                        console.log('Contact Message sent successfully via EmailJS!', response.status, response.text);
                        localStorage.setItem('last_contact_submit_time', Date.now());
                        showStatusToast("Gönderildi!", "Mesajınız başarıyla kulüp mail adresine iletildi.", true);
                        contactForm.reset();
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalText;
                    })
                    .catch((error) => {
                        console.error('EmailJS contact failed. Falling back to FormSubmit...', error);
                        sendViaFormSubmit(name, email, subject, message, submitBtn, originalText);
                    });
            } else {
                // 6. Fallback directly to FormSubmit
                sendViaFormSubmit(name, email, subject, message, submitBtn, originalText);
            }
        });
    }

    // FormSubmit sender helper function
    function sendViaFormSubmit(name, email, subject, message, submitBtn, originalText) {
        fetch("https://formsubmit.co/ajax/gedikmobilyazilimkulubu@gmail.com", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                _subject: `📩 Yeni İletişim Formu Mesajı (${subject.toUpperCase()})`,
                Ad_Soyad: name,
                Gonderen_Email: email,
                Konu: subject,
                Mesaj: message
            })
        })
        .then(response => response.json())
        .then(data => {
            localStorage.setItem('last_contact_submit_time', Date.now());
            showStatusToast("Gönderildi!", "Mesajınız başarıyla iletildi! Gelen kutunuza düşen onay mailini doğrulamayı unutmayın.", true);
            contactForm.reset();
        })
        .catch(error => {
            console.error("FormSubmit contact message failed:", error);
            showStatusToast("Gönderilemedi", "Mesajınız gönderilirken hata oluştu. Lütfen doğrudan gedikmobilyazilimkulubu@gmail.com adresine mail atınız.", false);
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        });
    }
});
