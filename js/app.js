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

    if (membershipForm) {
        membershipForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const submitBtn = membershipForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> Gönderiliyor...`;

            // Simulate loader check
            setTimeout(() => {
                const firstName = document.getElementById('first-name').value;
                const lastName = document.getElementById('last-name').value;
                const email = document.getElementById('user-email').value;
                const password = document.getElementById('user-password').value;
                const department = document.getElementById('user-department').value;
                
                // Get checked tracks
                const checkedTracks = [];
                document.querySelectorAll('input[name="user-track"]:checked').forEach(cb => {
                    checkedTracks.push(cb.value);
                });
                
                // Fallback
                if (checkedTracks.length === 0) checkedTracks.push('ios');
                
                const track = checkedTracks.join(',');

                // Cache data
                pendingMemberData = {
                    id: Date.now(),
                    name: `${firstName} ${lastName}`,
                    email: email,
                    password: password,
                    department: department,
                    track: track,
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
                submitBtn.innerHTML = `Başvuruyu Gönder`;
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
                        password: pendingMemberData.password || '',
                        department: pendingMemberData.department,
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
                <td><strong>${escapeHtml(m.name)}</strong></td>
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

    // Dynamic header navigation switcher (Giriş Yap -> Profilim)
    function updateHeaderState(member, isLoggedIn) {
        const loginTrigger = document.getElementById('login-trigger');
        const registerTriggerNav = document.getElementById('register-trigger-nav');
        const navUserName = document.getElementById('nav-user-name');

        if (isLoggedIn && member) {
            if (loginTrigger) loginTrigger.classList.add('hidden');
            if (registerTriggerNav) registerTriggerNav.classList.add('hidden');
            if (userProfileTrigger) userProfileTrigger.classList.remove('hidden');
            if (navUserName) navUserName.innerText = member.name.split(' ')[0];
        } else {
            if (loginTrigger) loginTrigger.classList.remove('hidden');
            if (registerTriggerNav) registerTriggerNav.classList.remove('hidden');
            if (userProfileTrigger) userProfileTrigger.classList.add('hidden');
        }
    }

    function showMemberDashboard(member) {
        document.getElementById('member-dash-name').innerText = member.name;
        document.getElementById('member-dash-email').innerText = member.email;
        document.getElementById('member-dash-dept').innerText = member.department || '-';

        // Set status
        const statusSpan = document.getElementById('member-dash-status');
        const statusClass = member.status === 'approved' ? 'approved' : 'pending';
        const statusText = member.status === 'approved' ? 'Onaylandı' : 'Beklemede';
        statusSpan.className = `status-badge ${statusClass}`;
        statusSpan.innerText = statusText;

        // Render tracks
        const tracksContainer = document.getElementById('member-dash-tracks');
        tracksContainer.innerHTML = '';
        if (member.track) {
            member.track.split(',').forEach(trackKey => {
                const label = trackLabels[trackKey] || trackKey;
                const span = document.createElement('span');
                span.className = `track-badge-mini ${trackKey}`;
                span.innerText = label.split(' ')[0];
                tracksContainer.appendChild(span);
            });
        }

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
});
