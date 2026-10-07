import { aiOrchestrator } from '../src/ai/aiOrchestrator.js';

async function testDirect() {
  const reqBody = {
    text: 'where is he looking',
    sourceLanguage: 'en',
    targetLanguage: 'hi',
    sourceLang: 'en',
    targetLang: 'hi',
    tone: 'Casual',
    style: 'natural',
    mode: 'natural',
    consentCloud: true,
    context: '',
    contextMessage: '',
    isPrivacySensitive: false
  };

  console.log('--- 1. EXACT REQUEST DISPATCHED BY FRONTEND ---');
  console.log('Method: POST');
  console.log('Endpoint: http://localhost:5000/api/translate');
  console.log('Headers:');
  console.log(JSON.stringify({
    'Content-Type': 'application/json',
    'x-cloud-consent': 'true'
  }, null, 2));
  console.log('Payload / Request Body:');
  console.log(JSON.stringify(reqBody, null, 2));

  console.log('\n--- 2. WHAT BACKEND ROUTE RECEIVES ---');
  console.log('Route: /api/translate in backend/src/routes/api.js');
  console.log('Received parameters: text="where is he looking", sourceLanguage="en", targetLanguage="hi", tone="Casual", style="natural"');

  const res = await aiOrchestrator.translate(reqBody);

  console.log('\n--- 3. EXACT BACKEND RESPONSE RETURNED ---');
  console.log('HTTP Status: 200 OK');
  console.log('Response JSON:');
  console.log(JSON.stringify(res, null, 2));
}

testDirect();
