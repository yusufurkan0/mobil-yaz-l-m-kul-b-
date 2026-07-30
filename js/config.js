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
        apiKey: "AIzaSyD1DU6viGdeezdEf1aI7KFiboqOGNYFtlc",
        authDomain: "mobil-yazilim.firebaseapp.com",
        projectId: "mobil-yazilim",
        storageBucket: "mobil-yazilim.firebasestorage.app",
        messagingSenderId: "1064794786111",
        appId: "1:1064794786111:web:156014ec4fd432be1d6b8a"
    },

    // EmailJS (Gerçek E-posta Gönderim Servisi) Yapılandırması
    emailjs: {
        serviceId: "service_xfwh375",
        templateId: "template_dy45d4h",
        publicKey: "jbdFINOTgwnVSZNOQ"
    }
};
