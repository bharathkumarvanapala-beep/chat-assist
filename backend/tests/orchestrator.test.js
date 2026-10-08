import { test } from 'node:test';
import assert from 'node:assert';
import { aiOrchestrator } from '../src/ai/aiOrchestrator.js';

// ============================================================================
// 1. Core Sentence-Level Tests (English -> Hindi)
// ============================================================================

test('1. "Where are you walking?" translates to complete sentence, NEVER token fragments', async () => {
  const res = await aiOrchestrator.translate({
    text: 'where are you walking',
    sourceLanguage: 'en',
    targetLanguage: 'hi',
    tone: 'Casual',
    style: 'natural'
  });

  assert.strictEqual(res.success, true);
  // Must NOT produce "कहाँ are तुम walking?"
  assert.ok(!res.translation.includes('are'), 'Must not leave "are" untranslated');
  assert.ok(!res.translation.includes('walking'), 'Must not leave "walking" untranslated');
  assert.ok(res.translation.includes('कहाँ'), 'Must contain "कहाँ"');
  assert.ok(res.translation.includes('चल रहे') || res.translation.includes('जा रहे') || res.translation.includes('टहल रहे') || res.translation.includes('घूम रहे'), 'Must conjugate verb');
  assert.ok(res.translation.includes('तुम') || res.translation.includes('आप'), 'Must have subject');
});

test('2. "Where are you going?" translates to complete sentence', async () => {
  const res = await aiOrchestrator.translate({
    text: 'Where are you going?',
    sourceLanguage: 'en',
    targetLanguage: 'hi',
    tone: 'Casual'
  });
  assert.strictEqual(res.success, true);
  assert.ok(res.translation.includes('कहाँ'));
  assert.ok(res.translation.includes('जा रहे'));
});

test('3. "What are you doing?" translates to complete sentence', async () => {
  const res = await aiOrchestrator.translate({
    text: 'What are you doing?',
    sourceLanguage: 'en',
    targetLanguage: 'hi',
    tone: 'Casual'
  });
  assert.strictEqual(res.success, true);
  assert.ok(res.translation.includes('क्या'));
  assert.ok(res.translation.includes('कर रहे'));
});

test('4. "I will call you tomorrow." translates to complete sentence', async () => {
  const res = await aiOrchestrator.translate({
    text: 'I will call you tomorrow.',
    sourceLanguage: 'en',
    targetLanguage: 'hi',
    tone: 'Casual'
  });
  assert.strictEqual(res.success, true);
  assert.ok(res.translation.includes('कल'));
  assert.ok(res.translation.includes('कॉल करूँगा') || res.translation.includes('फोन करूँगा'));
});

test('5. "Did you eat?" translates to complete sentence', async () => {
  const res = await aiOrchestrator.translate({
    text: 'Did you eat?',
    sourceLanguage: 'en',
    targetLanguage: 'hi',
    tone: 'Casual'
  });
  assert.strictEqual(res.success, true);
  assert.ok(res.translation.includes('खाया') || res.translation.includes('खाना'));
});

test('6. "Why didn\'t you come yesterday?" translates to complete sentence', async () => {
  const res = await aiOrchestrator.translate({
    text: "Why didn't you come yesterday?",
    sourceLanguage: 'en',
    targetLanguage: 'hi',
    tone: 'Casual'
  });
  assert.strictEqual(res.success, true);
  assert.ok(res.translation.includes('क्यों'));
  assert.ok(res.translation.includes('कल'));
  assert.ok(res.translation.includes('नहीं आए') || res.translation.includes('नहीं आ पाए'));
});

test('7. "Can you send me the location?" translates to complete sentence', async () => {
  const res = await aiOrchestrator.translate({
    text: 'Can you send me the location?',
    sourceLanguage: 'en',
    targetLanguage: 'hi',
    tone: 'Polite'
  });
  assert.strictEqual(res.success, true);
  assert.ok(res.translation.includes('लोकेशन'));
  assert.ok(res.translation.includes('भेज सकते हैं') || res.translation.includes('भेज दीजिए'));
});

test('8. "I have been waiting for you." translates to complete sentence', async () => {
  const res = await aiOrchestrator.translate({
    text: 'I have been waiting for you.',
    sourceLanguage: 'en',
    targetLanguage: 'hi',
    tone: 'Casual'
  });
  assert.strictEqual(res.success, true);
  assert.ok(res.translation.includes('इंतज़ार'));
});

test('9. "Let me know when you reach home." translates to complete sentence', async () => {
  const res = await aiOrchestrator.translate({
    text: 'Let me know when you reach home.',
    sourceLanguage: 'en',
    targetLanguage: 'hi',
    tone: 'Casual'
  });
  assert.strictEqual(res.success, true);
  assert.ok(res.translation.includes('घर'));
  assert.ok(res.translation.includes('पहुँच') || res.translation.includes('बताना'));
});

// ============================================================================
// 2. Multilingual Complete Sentence Tests
// ============================================================================

test('10. English -> Telugu complete conversational sentences', async () => {
  const res1 = await aiOrchestrator.translate({
    text: 'Where are you walking?',
    sourceLanguage: 'en',
    targetLanguage: 'te',
    tone: 'Casual'
  });
  assert.strictEqual(res1.success, true);
  assert.ok(res1.translation.includes('ఎక్కడ'));
  assert.ok(res1.translation.includes('నడుస్తున్నావు') || res1.translation.includes('ఉన్నారు'));

  const res2 = await aiOrchestrator.translate({
    text: 'Did you eat?',
    sourceLanguage: 'en',
    targetLanguage: 'te',
    tone: 'Casual'
  });
  assert.strictEqual(res2.success, true);
  assert.ok(res2.translation.includes('తిన్నారా') || res2.translation.includes('తిన్నావా') || res2.translation.includes('భోజనం'));
});

test('11. Hindi -> English complete conversational sentences', async () => {
  const res1 = await aiOrchestrator.translate({
    text: 'तुम कहाँ चल रहे हो?',
    sourceLanguage: 'hi',
    targetLanguage: 'en'
  });
  assert.strictEqual(res1.success, true);
  assert.ok(res1.translation.toLowerCase().includes('walking') || res1.translation.toLowerCase().includes('where'));

  const res2 = await aiOrchestrator.translate({
    text: 'क्या तुमने खाना खाया?',
    sourceLanguage: 'hi',
    targetLanguage: 'en'
  });
  assert.strictEqual(res2.success, true);
  assert.ok(res2.translation.toLowerCase().includes('eat') || res2.translation.toLowerCase().includes('meal'));
});

test('12. Telugu -> Hindi complete conversational sentences', async () => {
  const res1 = await aiOrchestrator.translate({
    text: 'నువ్వు ఎక్కడ నడుస్తున్నావు?',
    sourceLanguage: 'te',
    targetLanguage: 'hi',
    tone: 'Casual'
  });
  assert.strictEqual(res1.success, true);
  assert.ok(res1.translation.includes('कहाँ'));
  assert.ok(res1.translation.includes('चल रहे') || res1.translation.includes('जा रहे'));

  const res2 = await aiOrchestrator.translate({
    text: 'నువ్వు ఎక్కడ ఉన్నావు?',
    sourceLanguage: 'te',
    targetLanguage: 'hi',
    tone: 'Polite'
  });
  assert.strictEqual(res2.success, true);
  assert.ok(res2.translation.includes('आप कहाँ हैं?') || res2.translation.includes('तुम कहाँ हो?'));
});

// ============================================================================
// 3. Tones, Formatting, Entities, and Edge Cases
// ============================================================================

test('13. Tone variations: Casual vs Polite vs Formal', async () => {
  const casual = await aiOrchestrator.translate({
    text: 'Where are you walking?',
    sourceLanguage: 'en',
    targetLanguage: 'hi',
    tone: 'Casual'
  });
  const polite = await aiOrchestrator.translate({
    text: 'Where are you walking?',
    sourceLanguage: 'en',
    targetLanguage: 'hi',
    tone: 'Polite'
  });

  assert.ok(casual.translation.includes('तुम') || casual.translation.includes('हो'));
  assert.ok(polite.translation.includes('आप') || polite.translation.includes('हैं'));
});

test('14. Preserves Emojis, URLs, Numbers, and Names', async () => {
  const res = await aiOrchestrator.translate({
    text: 'Rahul, please check https://example.com at 10 AM 👍',
    sourceLanguage: 'en',
    targetLanguage: 'hi'
  });

  assert.strictEqual(res.success, true);
  assert.ok(res.translation.includes('https://example.com'), 'Must preserve URL');
  assert.ok(res.translation.includes('👍'), 'Must preserve emoji');
  assert.ok(res.translation.includes('10'), 'Must preserve number');
});

test('15. Empty input and very short input handled cleanly', async () => {
  const emptyRes = await aiOrchestrator.translate({
    text: '',
    sourceLanguage: 'en',
    targetLanguage: 'hi'
  });
  assert.strictEqual(emptyRes.success, true);
  assert.strictEqual(emptyRes.translation, '');

  const shortRes = await aiOrchestrator.translate({
    text: 'Hi',
    sourceLanguage: 'en',
    targetLanguage: 'hi'
  });
  assert.strictEqual(shortRes.success, true);
  assert.ok(shortRes.translation.length > 0);
});
