import assert from 'node:assert';

async function run() {
  console.log('=== RUNNING VERIFICATION FOR USER REQUIREMENTS ===\n');

  // Test 1: English -> Hindi: "I am working right now"
  console.log('--- Test 1: English -> Hindi ("I am working right now") ---');
  const res1 = await fetch('http://localhost:5000/api/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cloud-consent': 'true'
    },
    body: JSON.stringify({
      text: 'I am working right now',
      sourceLanguage: 'en',
      targetLanguage: 'hi',
      consentCloud: true
    })
  });
  const data1 = await res1.json();
  console.log('Provider:', data1.provider);
  console.log('Mode:', data1.mode);
  console.log('ProcessingSource:', data1.processingSource);
  console.log('Translation:', data1.translation || data1.translatedText);
  assert.strictEqual(res1.status, 200);
  assert.strictEqual(data1.success, true);
  assert.strictEqual(data1.provider, 'gemini');
  assert.strictEqual(data1.mode, 'cloud');
  assert.strictEqual(data1.processingSource, 'Cloud AI');
  assert.ok(!JSON.stringify(data1).includes('GEMINI_API_KEY'));
  console.log('PASS: Test 1 routes to Gemini with Cloud AI badge and no false errors.\n');

  // Test 2: Hindi/Roman Hindi -> English: "kaha jana hai"
  console.log('--- Test 2: Hindi/Roman Hindi -> English ("kaha jana hai") ---');
  const res2 = await fetch('http://localhost:5000/api/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cloud-consent': 'true'
    },
    body: JSON.stringify({
      text: 'kaha jana hai',
      sourceLanguage: 'hi',
      targetLanguage: 'en',
      consentCloud: true
    })
  });
  const data2 = await res2.json();
  console.log('Provider:', data2.provider);
  console.log('Mode:', data2.mode);
  console.log('ProcessingSource:', data2.processingSource);
  console.log('Translation:', data2.translation || data2.translatedText);
  assert.strictEqual(res2.status, 200);
  assert.strictEqual(data2.success, true);
  assert.strictEqual(data2.provider, 'gemini');
  assert.strictEqual(data2.mode, 'cloud');
  assert.strictEqual(data2.processingSource, 'Cloud AI');
  assert.ok(!JSON.stringify(data2).includes('GEMINI_API_KEY'));
  console.log('PASS: Test 2 routes to Gemini with Cloud AI badge and no false errors.\n');

  // Test 3: Arbitrary sentence: "Where do you live?"
  console.log('--- Test 3: Arbitrary sentence ("Where do you live?") ---');
  const res3 = await fetch('http://localhost:5000/api/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cloud-consent': 'true'
    },
    body: JSON.stringify({
      text: 'Where do you live?',
      sourceLanguage: 'en',
      targetLanguage: 'hi',
      consentCloud: true
    })
  });
  const data3 = await res3.json();
  console.log('Provider:', data3.provider);
  console.log('Mode:', data3.mode);
  console.log('ProcessingSource:', data3.processingSource);
  console.log('Translation:', data3.translation || data3.translatedText);
  assert.strictEqual(res3.status, 200);
  assert.strictEqual(data3.success, true);
  assert.strictEqual(data3.provider, 'gemini');
  assert.strictEqual(data3.mode, 'cloud');
  assert.strictEqual(data3.processingSource, 'Cloud AI');
  assert.ok(!JSON.stringify(data3).includes('GEMINI_API_KEY'));
  console.log('PASS: Test 3 routes to Gemini with Cloud AI badge and no false errors.\n');

  // Test 4: On-device intentionally disabled (consentCloud: false)
  console.log('--- Test 4: On-Device when Cloud AI disabled (consentCloud: false) ---');
  const res4 = await fetch('http://localhost:5000/api/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cloud-consent': 'false'
    },
    body: JSON.stringify({
      text: 'Where do you live?',
      sourceLanguage: 'en',
      targetLanguage: 'hi',
      consentCloud: false
    })
  });
  const data4 = await res4.json();
  console.log('Provider:', data4.provider);
  console.log('Mode:', data4.mode);
  console.log('ProcessingSource:', data4.processingSource);
  console.log('Translation:', data4.translation || data4.translatedText);
  assert.strictEqual(res4.status, 200);
  assert.strictEqual(data4.provider, 'local');
  assert.strictEqual(data4.mode, 'on-device');
  assert.strictEqual(data4.processingSource, 'On-device');
  assert.ok(!JSON.stringify(data4).includes('GEMINI_API_KEY'));
  console.log('PASS: Test 4 cleanly routes to on-device without calling Cloud AI.\n');

  console.log('ALL REQUIRED TESTS PASSED SUCCESSFULLY! 100%');
}

run().catch(err => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
