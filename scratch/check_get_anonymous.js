const https = require('https');
const apiKey = "AIzaSyBt0erS3Xh_tWbpDwQzyZwn_C2ZWTcLmEk";

// Perform a single doc get anonymously
const options = {
    hostname: 'firestore.googleapis.com',
    path: '/v1/projects/gedik-mygk/databases/(default)/documents/applicants/fsukru96@gmail.com?key=' + apiKey,
    method: 'GET'
};

https.get(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        console.log(`=== Anonymous Single Doc Get Status: ${res.statusCode} ===`);
        console.log(body);
    });
}).on('error', (e) => {
    console.error(e);
});
