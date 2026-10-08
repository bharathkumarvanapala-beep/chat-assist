import assert from 'node:assert';
import { translationClient } from '../../web/frontend/src/services/translationClient.js';

async function run() {
  console.log('=== VERIFYING FRONTEND translationClient.js FLOW ===\n');

  // 1. Health check
  console.log('--- 1. Health Check ---');
  const health = await translationClient.getHealthInfo();
  console.log('Health:', health.orchestrator);
  assert.strictEqual(health.status, 'ok');
  assert.strictEqual(health.gemini_status, 'ACTIVE');
  assert.strictEqual(health.orchestrator.geminiAvailable, true);
  assert.strictEqual(health.orchestrator.activeProvider, 'gemini');
  console.log('PASS: Health info fetched cleanly and confirms Gemini is ACTIVE.\n');

  // 2. EN -> HI: "I am working right now"
  console.log('--- 2. EN -> HI: "I am working right now" (Cloud AI ON) ---');
  const res1 = await translationClient.translate({
    text: 'I am working right now',
    sourceLang: 'en',
    targetLang: 'hi',
    consentCloud: true
  });
  console.log('Provider:', res1.provider);
  console.log('ProcessingSource:', res1.processingSource);
  console.log('Translation:', res1.translation);
  assert.strictEqual(res1.success, true);
  assert.strictEqual(res1.provider, 'gemini');
  assert.strictEqual(res1.processingSource, 'Cloud AI');
  assert.ok(!JSON.stringify(res1).includes('GEMINI_API_KEY'));
  console.log('PASS: Translation Result badge matches Cloud AI with no false errors.\n');

  // 3. HI -> EN: "kaha jana hai"
  console.log('--- 3. HI -> EN: "kaha jana hai" (Cloud AI ON) ---');
  const res2 = await translationClient.translate({
    text: 'kaha jana hai',
    sourceLang: 'hi',
    targetLang: 'en',
    consentCloud: true
  });
  console.log('Provider:', res2.provider);
  console.log('ProcessingSource:', res2.processingSource);
  console.log('Translation:', res2.translation);
  assert.strictEqual(res2.success, true);
  assert.strictEqual(res2.provider, 'gemini');
  assert.strictEqual(res2.processingSource, 'Cloud AI');
  assert.ok(!JSON.stringify(res2).includes('GEMINI_API_KEY'));
  console.log('PASS: Translation Result badge matches Cloud AI with no false errors.\n');

  // 4. Arbitrary sentence: "Where do you live?"
  console.log('--- 4. Arbitrary sentence: "Where do you live?" (Cloud AI ON) ---');
  const res3 = await translationClient.translate({
    text: 'Where do you live?',
    sourceLang: 'en',
    targetLang: 'hi',
    consentCloud: true
  });
  console.log('Provider:', res3.provider);
  console.log('ProcessingSource:', res3.processingSource);
  console.log('Translation:', res3.translation);
  assert.strictEqual(res3.success, true);
  assert.strictEqual(res3.provider, 'gemini');
  assert.strictEqual(res3.processingSource, 'Cloud AI');
  assert.ok(!JSON.stringify(res3).includes('GEMINI_API_KEY'));
  console.log('PASS: Translation Result badge matches Cloud AI with no false errors.\n');

  // 5. Cloud AI OFF: "Where do you live?" (consentCloud: false)
  console.log('--- 5. On-Device Mode: "Where do you live?" (Cloud AI OFF) ---');
  const res4 = await translationClient.translate({
    text: 'Where do you live?',
    sourceLang: 'en',
    targetLang: 'hi',
    consentCloud: false
  });
  console.log('Provider:', res4.provider);
  console.log('ProcessingSource:', res4.processingSource);
  console.log('Translation:', res4.translation);
  assert.strictEqual(res4.provider, 'local');
  assert.strictEqual(res4.processingSource, 'On-device');
  assert.ok(!JSON.stringify(res4).includes('GEMINI_API_KEY'));
  console.log('PASS: On-device mode cleanly respected when Cloud AI is turned off.\n');

  console.log('ALL FRONTEND CLIENT TESTS COMPLETED SUCCESSFULLY! 100%');
}

run().catch(e => {
  console.error('FRONTEND CLIENT VERIFICATION FAILED:', e);
  process.exit(1);
});
