const https = require('https');
const apiKey = "AIzaSyBt0erS3Xh_tWbpDwQzyZwn_C2ZWTcLmEk";

// Perform an anonymous query filter on email
const queryData = JSON.stringify({
    structuredQuery: {
        from: [{ collectionId: 'applicants' }],
        where: {
            fieldFilter: {
                field: { fieldPath: 'email' },
                op: 'EQUAL',
                value: { stringValue: 'emrhnakgns@gmail.com' }
            }
        }
    }
});

const req = https.request({
    hostname: 'firestore.googleapis.com',
    path: `/v1/projects/gedik-mygk/databases/(default)/documents:runQuery?key=${apiKey}`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(queryData)
    }
}, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        console.log(`=== Anonymous Query Status: ${res.statusCode} ===`);
        console.log(body);
    });
});

req.on('error', (e) => {
    console.error(e);
});

req.write(queryData);
req.end();
