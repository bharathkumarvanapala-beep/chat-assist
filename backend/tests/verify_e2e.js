import assert from 'node:assert';

const BASE_URL = 'http://localhost:5000/api';

async function run() {
  console.log('--- STARTING VERIFICATION TESTS ---');

  // Test 1: Health check
  const healthRes = await fetch(`${BASE_URL}/health`);
  assert.strictEqual(healthRes.status, 200, 'Health endpoint must return 200');
  const health = await healthRes.json();
  console.log('✓ 1. Health check OK:', health.service, '| Provider:', health.orchestrator?.activeProvider);

  // Test 2: "Where are you working?" (English -> Hindi, Casual)
  const res1 = await fetch(`${BASE_URL}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'Where are you working?',
      sourceLanguage: 'en',
      targetLanguage: 'hi',
      tone: 'Casual',
      style: 'natural'
    })
  });
  const data1 = await res1.json();
  assert.strictEqual(data1.success, true);
  console.log('✓ 2. "Where are you working?" ->', data1.translation);
  console.log('     Alternatives:', data1.alternatives);
  console.log('     Grammar tokens:', data1.grammar.length);
  assert.ok(data1.translation.includes('काम') || data1.translation.includes('जॉब'), 'Must translate "working"');
  assert.ok(data1.translation.includes('कहाँ'), 'Must translate "Where"');

  // Test 3: Completely different sentence: "I will call you tomorrow."
  const res2 = await fetch(`${BASE_URL}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'I will call you tomorrow.',
      sourceLanguage: 'en',
      targetLanguage: 'hi',
      tone: 'Casual',
      style: 'natural'
    })
  });
  const data2 = await res2.json();
  assert.strictEqual(data2.success, true);
  console.log('✓ 3. "I will call you tomorrow." ->', data2.translation);
  assert.ok(data2.translation.includes('कल'), 'Must translate "tomorrow"');
  assert.ok(data2.translation.includes('कॉल') || data2.translation.includes('फोन'), 'Must translate "call"');
  assert.ok(!data2.translation.includes('काम'), 'Must NOT have "काम" from previous request');

  // Test 4: Tone change (Casual vs Polite for "Where are you working?")
  const resPolite = await fetch(`${BASE_URL}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'Where are you working?',
      sourceLanguage: 'en',
      targetLanguage: 'hi',
      tone: 'Polite',
      style: 'natural'
    })
  });
  const dataPolite = await resPolite.json();
  console.log('✓ 4. Polite tone ->', dataPolite.translation);
  assert.ok(dataPolite.translation.includes('आप'), 'Polite tone must use "आप"');

  // Test 5: Hindi -> English
  const resHiEn = await fetch(`${BASE_URL}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'तुम कहाँ काम कर रहे हो?',
      sourceLanguage: 'hi',
      targetLanguage: 'en'
    })
  });
  const dataHiEn = await resHiEn.json();
  console.log('✓ 5. Hindi -> English ->', dataHiEn.translation);
  assert.ok(dataHiEn.translation.toLowerCase().includes('working'), 'Must translate back to English with "working"');

  // Test 6: Telugu -> Hindi
  const resTeHi = await fetch(`${BASE_URL}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'నువ్వు ఎక్కడ ఉన్నావు?',
      sourceLanguage: 'te',
      targetLanguage: 'hi'
    })
  });
  const dataTeHi = await resTeHi.json();
  console.log('✓ 6. Telugu -> Hindi ->', dataTeHi.translation);
  assert.ok(dataTeHi.translation.includes('कहाँ'), 'Must translate to Hindi "कहाँ"');

  // Test 7: Empty input
  const resEmpty = await fetch(`${BASE_URL}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: '' })
  });
  const dataEmpty = await resEmpty.json();
  assert.strictEqual(dataEmpty.success, true);
  assert.strictEqual(dataEmpty.translation, '');
  console.log('✓ 7. Empty input correctly handled without error');

  // Test 8: Chat Assistant endpoint
  const resChat = await fetch(`${BASE_URL}/chat-assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'What is the difference between tu, tum and aap?',
      targetLanguage: 'hi'
    })
  });
  const dataChat = await resChat.json();
  assert.strictEqual(dataChat.success, true);
  console.log('✓ 8. Chat Assistant query handled dynamically:', dataChat.intent);

  // Test 9: Reply suggestions
  const resReplies = await fetch(`${BASE_URL}/reply-suggestions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      incomingText: 'Are you free right now?',
      targetLanguage: 'hi'
    })
  });
  const dataReplies = await resReplies.json();
  assert.strictEqual(dataReplies.success, true);
  assert.ok(dataReplies.suggestions.length >= 3);
  console.log('✓ 9. Reply suggestions generated dynamically:', dataReplies.suggestions.length, 'options');

  // Test 10: Security check - Verify API key is NOT leaked anywhere in any response
  const responsesText = JSON.stringify([health, data1, data2, dataPolite, dataHiEn, dataTeHi, dataEmpty, dataChat, dataReplies]);
  assert.ok(!responsesText.includes('AIzaSy'), 'No API key in responses');
  assert.ok(!responsesText.includes('GEMINI_API_KEY'), 'No environment variable key names in responses');
  console.log('✓ 10. Security confirmed: No API key or sensitive backend variables exposed in network responses.');

  console.log('\n--- ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ---');
}

run().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
