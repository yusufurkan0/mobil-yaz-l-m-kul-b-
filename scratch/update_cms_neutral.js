const https = require('https');

const email = "yusuffurkangek@gmail.com";
const password = "Furkan123456?";
const apiKey = "AIzaSyBt0erS3Xh_tWbpDwQzyZwn_C2ZWTcLmEk";

const loginData = JSON.stringify({
    email: email,
    password: password,
    returnSecureToken: true
});

const req = https.request({
    hostname: 'identitytoolkit.googleapis.com',
    path: `/v1/accounts:signInWithPassword?key=${apiKey}`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
    }
}, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        if (res.statusCode !== 200) {
            console.error("Giriş başarısız! Yanıt:", body);
            process.exit(1);
        }
        const authData = JSON.parse(body);
        const idToken = authData.idToken;
        updateCmsFields(idToken);
    });
});

req.on('error', (e) => console.error(e));
req.write(loginData);
req.end();

function updateCmsFields(idToken) {
    // 1. Get current settings/cms document
    const getOptions = {
        hostname: 'firestore.googleapis.com',
        path: '/v1/projects/gedik-mygk/databases/(default)/documents/settings/cms',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${idToken}`
        }
    };

    https.get(getOptions, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
            try {
                const doc = JSON.parse(body);
                if (res.statusCode !== 200) {
                    console.error("Belge çekilemedi:", doc);
                    return;
                }

                // Prepare updated fields
                const fields = doc.fields || {};
                
                // 1. Update heroDesc
                fields.heroDesc = { 
                    stringValue: "Mobil uygulama geliştirmeye odaklanan kulübümüzle mobil yazılım ekosistemine ilk adımını at. Sıfırdan başla, projeler geliştir, sektöre yön ver!" 
                };

                // 2. Update aboutText1
                fields.aboutText1 = { 
                    stringValue: "Mobil Yazılım Kulübü, geleceğin mobil uygulama ekosistemini inşa edecek geliştiricileri ve tasarımcıları bir araya getiren dinamik bir öğrenci topluluğudur. Mobil platformların gücünü keşfederek, teorik bilgiyi pratik projelerle pekiştiriyor ve üyelerimizi sektöre hazır hale getiriyoruz." 
                };

                // 3. Update regC1
                fields.regC1 = { 
                    stringValue: "Topluluğun amacı, İstanbul Gedik Üniversitesi öğrencilerine mobil yazılım alanlarında teorik eğitimler vermek, pratik projeler geliştirmek ve öğrencileri teknoloji ekosistemine hazırlamaktır." 
                };

                // Patch document in Firestore
                const patchData = JSON.stringify({ fields: fields });
                const patchOptions = {
                    hostname: 'firestore.googleapis.com',
                    path: '/v1/projects/gedik-mygk/databases/(default)/documents/settings/cms',
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${idToken}`,
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(patchData)
                    }
                };

                const patchReq = https.request(patchOptions, (patchRes) => {
                    let patchBody = '';
                    patchRes.on('data', chunk => patchBody += chunk);
                    patchRes.on('end', () => {
                        if (patchRes.statusCode === 200) {
                            console.log("Firestore settings/cms successfully updated with neutral terms.");
                        } else {
                            console.error("Update failed:", patchRes.statusCode, patchBody);
                        }
                    });
                });

                patchReq.write(patchData);
                patchReq.end();

            } catch (e) {
                console.error("JSON parsing error:", e);
            }
        });
    });
}
