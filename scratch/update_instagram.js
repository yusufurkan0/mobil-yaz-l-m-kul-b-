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
        updateInstagramLink(idToken);
    });
});

req.on('error', (e) => console.error(e));
req.write(loginData);
req.end();

function updateInstagramLink(idToken) {
    // 1. Get current document to merge other fields
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
                fields.socialInstagram = { stringValue: "https://www.instagram.com/gedikmygk" };

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
                            console.log("Firestore settings/cms socialInstagram successfully updated to https://www.instagram.com/gedikmygk");
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
