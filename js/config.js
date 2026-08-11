/* ==========================================
   MOBİL YAZILIM KULÜBÜ CONFIGURATION FILE
   ==========================================
   Eğer gerçek e-posta gönderimi ve veritabanı (Firebase Firestore)
   kullanmak isterseniz, aşağıdaki bilgileri kendi hesaplarınızdan
   alıp doldurmanız yeterlidir. Doldurmadığınız takdirde sistem 
   otomatik olarak tarayıcı hafızasını (localStorage) kullanacaktır.
*/

const CONFIG = {
    // Firebase Firestore Veritabanı Yapılandırması
    firebase: {
        apiKey: "AIzaSyBt0erS3Xh_tWbpDwQzyZwn_C2ZWTcLmEk",
        authDomain: "gedik-mygk.firebaseapp.com",
        projectId: "gedik-mygk",
        storageBucket: "gedik-mygk.firebasestorage.app",
        messagingSenderId: "772100380736",
        appId: "1:772100380736:web:83716a920a14961bf7e7a5"
    },

    // EmailJS (Gerçek E-posta Gönderim Servisi) Yapılandırması
    emailjs: {
        serviceId: "service_xfwh375",
        templateId: "template_dy45d4h", // Kayıt için onay kodu şablonu
        contactTemplateId: "template_o3gytpr", // İletişim formu şablonu (EmailJS panelinizdeki ID ile güncellendi)
        publicKey: "jbdFINOTgwnVSZNOQ"
    }
};
