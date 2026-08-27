/* ==========================================
   GEDIK MYGK - CLIENT-SIDE BACKGROUND SYNCHRONIZATION
   ==========================================
   This script loads Firebase compat SDKs dynamically, initializes Firestore,
   and pulls the latest Events, Announcements, Blog, and CMS settings in the background
   to ensure that subpages render the latest data from the cloud Firestore database.
*/

(function() {
    // 1. Immediate Theme Persistence (prevent flash of light theme)
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'light') {
        document.body.classList.remove('dark-theme');
    } else {
        document.body.classList.add('dark-theme');
    }

    // Mobile hamburger menu toggle handler & Admin Toolbar sync for subpages
    document.addEventListener('DOMContentLoaded', () => {
        const menuToggle = document.getElementById('menu-toggle');
        const navMenu = document.getElementById('nav-menu');
        if (menuToggle && navMenu) {
            menuToggle.addEventListener('click', () => {
                menuToggle.classList.toggle('open');
                navMenu.classList.toggle('open');
                document.body.classList.toggle('no-scroll');
            });
        }

        // Admin session handling on subpages
        if (sessionStorage.getItem('admin_logged_in') === 'true') {
            const adminToolbar = document.getElementById('admin-toolbar');
            if (adminToolbar) {
                adminToolbar.classList.remove('hidden');
                document.body.classList.add('admin-mode-active');
            }
            
            const toolbarBtns = document.querySelectorAll('.admin-toolbar .toolbar-btn[data-target]');
            toolbarBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const target = btn.getAttribute('data-target');
                    if (target === 'members') {
                        window.location.href = 'basvurular.html';
                    } else {
                        window.location.href = `index.html?admin_target=${target}`;
                    }
                });
            });
            
            const logoutBtn = document.getElementById('admin-toolbar-logout');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    sessionStorage.removeItem('admin_logged_in');
                    window.location.reload();
                });
            }
        }
    });

    // Only run if CONFIG is defined (which holds our credentials)
    if (typeof CONFIG === 'undefined' || !CONFIG.firebase || !CONFIG.firebase.projectId) return;

    // Helper to dynamically load external scripts
    function loadScript(src, callback) {
        const s = document.createElement('script');
        s.src = src;
        s.onload = callback;
        s.onerror = (err) => console.error("Failed to load script: " + src, err);
        document.body.appendChild(s);
    }

    function initSync() {
        if (typeof firebase !== 'undefined' && !firebase.apps.length) {
            firebase.initializeApp(CONFIG.firebase);
        }
        if (typeof firebase === 'undefined') return;
        
        const db = firebase.firestore();

        // 1. Sync Site Settings (CMS)
        db.collection('settings').doc('cms').get().then(doc => {
            if (doc.exists) {
                const settingsData = doc.data();
                const currentSettings = (function() {
                    try { return JSON.parse(localStorage.getItem('myk_site_settings')) || {}; } catch(e) { return {}; }
                })();
                
                // CRITICAL PROTECTION: Never allow Firestore sync to wipe approved members count to 0
                const localMembers = (function() {
                    try { return JSON.parse(localStorage.getItem('myk_members')) || []; } catch(e) { return []; }
                })();
                const approvedCount = localMembers.filter(m => (m.status === 'approved' || m.status === 'onaylandı')).length;
                if (approvedCount > 0) {
                    settingsData.totalMembers = approvedCount;
                }
                
                localStorage.setItem('myk_site_settings', JSON.stringify({ ...currentSettings, ...settingsData }));
                applySyncedFooterSettings(settingsData);
                
                // Immediately apply stats to the homepage elements if they exist on the page
                const memberSpan = document.getElementById('homepage-member-count');
                if (memberSpan) {
                    const displayCount = (approvedCount > 0) ? approvedCount : (settingsData.totalMembers !== undefined ? settingsData.totalMembers : 0);
                    memberSpan.setAttribute('data-val', displayCount);
                    memberSpan.innerText = displayCount;
                }
                const eventSpan = document.getElementById('homepage-event-count');
                if (eventSpan) {
                    const eventCount = settingsData.totalEvents !== undefined ? settingsData.totalEvents : 0;
                    eventSpan.setAttribute('data-val', eventCount);
                    eventSpan.innerText = eventCount;
                }
                const sponsorSpan = document.getElementById('homepage-sponsor-count');
                if (sponsorSpan) {
                    const sponsorCount = settingsData.totalSponsors !== undefined ? settingsData.totalSponsors : 5;
                    sponsorSpan.setAttribute('data-val', sponsorCount);
                    sponsorSpan.innerText = sponsorCount;
                }
            }
        }).catch(err => console.error("CMS settings sync failed:", err));

        // 2. Page-specific background sync
        const path = window.location.pathname;
        if (path.includes('etkinlikler.html')) {
            db.collection('events').get().then(snapshot => {
                const events = [];
                snapshot.forEach(doc => events.push(doc.data()));
                localStorage.setItem('myk_events', JSON.stringify(events));
                console.log("Events synced from Firestore:", events.length);
                if (typeof renderEvents === 'function') renderEvents();
            }).catch(err => console.error("Events sync failed:", err));
        } else if (path.includes('duyurular.html')) {
            db.collection('announcements').get().then(snapshot => {
                const announcements = [];
                snapshot.forEach(doc => announcements.push(doc.data()));
                if (announcements.length > 0) {
                    localStorage.setItem('myk_announcements', JSON.stringify(announcements));
                    console.log("Announcements synced from Firestore:", announcements.length);
                }
                if (typeof renderAnnouncements === 'function') renderAnnouncements();
            }).catch(err => console.error("Announcements sync failed:", err));
        } else if (path.includes('blog.html')) {
            db.collection('blog').get().then(snapshot => {
                const blog = [];
                snapshot.forEach(doc => blog.push(doc.data()));
                localStorage.setItem('myk_blog', JSON.stringify(blog));
                console.log("Blog posts synced from Firestore:", blog.length);
                if (typeof renderBlog === 'function') renderBlog();
            }).catch(err => console.error("Blog posts sync failed:", err));
        }
    }

    function applySyncedFooterSettings(settings) {
        if (!settings) return;
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
    }

    // Load Firebase App & Firestore compat SDKs if not present, then execute sync
    if (typeof firebase === 'undefined') {
        loadScript('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js', () => {
            loadScript('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js', () => {
                initSync();
            });
        });
    } else {
        initSync();
    }
})();
