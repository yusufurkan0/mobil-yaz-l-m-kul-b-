/* ==========================================
   GEDIK MYGK - CLIENT-SIDE BACKGROUND SYNCHRONIZATION
   ==========================================
   This script loads Firebase compat SDKs dynamically, initializes Firestore,
   and pulls the latest Events, Announcements, Blog, and CMS settings in the background
   to ensure that subpages render the latest data from the cloud Firestore database.
*/

(function() {
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
                localStorage.setItem('myk_site_settings', JSON.stringify(settingsData));
                applySyncedFooterSettings(settingsData);
            }
        }).catch(err => console.error("CMS settings sync failed:", err));

        // 2. Page-specific background sync
        const path = window.location.pathname;
        if (path.includes('etkinlikler.html')) {
            db.collection('events').get().then(snapshot => {
                if (!snapshot.empty) {
                    const events = [];
                    snapshot.forEach(doc => events.push(doc.data()));
                    localStorage.setItem('myk_events', JSON.stringify(events));
                    console.log("Events synced from Firestore.");
                    if (typeof renderEvents === 'function') renderEvents();
                }
            }).catch(err => console.error("Events sync failed:", err));
        } else if (path.includes('duyurular.html')) {
            db.collection('announcements').get().then(snapshot => {
                if (!snapshot.empty) {
                    const announcements = [];
                    snapshot.forEach(doc => announcements.push(doc.data()));
                    localStorage.setItem('myk_announcements', JSON.stringify(announcements));
                    console.log("Announcements synced from Firestore.");
                    if (typeof renderAnnouncements === 'function') renderAnnouncements();
                }
            }).catch(err => console.error("Announcements sync failed:", err));
        } else if (path.includes('blog.html')) {
            db.collection('blog').get().then(snapshot => {
                if (!snapshot.empty) {
                    const blog = [];
                    snapshot.forEach(doc => blog.push(doc.data()));
                    localStorage.setItem('myk_blog', JSON.stringify(blog));
                    console.log("Blog posts synced from Firestore.");
                    if (typeof renderBlog === 'function') renderBlog();
                }
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
