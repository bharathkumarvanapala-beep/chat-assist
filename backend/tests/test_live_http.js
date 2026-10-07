import http from 'http';

function makeRequest(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/translate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'x-cloud-consent': body.consentCloud ? 'true' : 'false'
      }
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, raw });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  const payload = {
    text: 'where do you live',
    sourceLanguage: 'en',
    targetLanguage: 'hi',
    tone: 'Casual',
    style: 'natural',
    consentCloud: true
  };

  console.log('Sending payload:', JSON.stringify(payload, null, 2));
  const res = await makeRequest(payload);
  console.log('HTTP Status:', res.status);
  console.log('Response body:', JSON.stringify(res.data, null, 2));
}

run().catch(console.error);
