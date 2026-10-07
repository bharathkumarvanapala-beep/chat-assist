import test from 'node:test';
import assert from 'node:assert/strict';
import { translateText, generateReplySuggestions, correctText } from '../src/services/translationService.js';
import { detectLanguage } from '../src/services/languageDetector.js';

test('Language Detection Tests', () => {
  // English
  const resEn = detectLanguage('Where are you?');
  assert.equal(resEn.language, 'en');

  // Hindi (Devanagari)
  const resHi = detectLanguage('तुम कहाँ हो?');
  assert.equal(resHi.language, 'hi');

  // Telugu
  const resTe = detectLanguage('నువ్వు ఎక్కడ ఉన్నావు?');
  assert.equal(resTe.language, 'te');

  // Empty
  const resEmpty = detectLanguage('');
  assert.equal(resEmpty.language, 'unknown');
});

test('Engine Routing: Common phrase routes to Local Data', async () => {
  const result = await translateText({
    text: 'Where are you?',
    sourceLang: 'en',
    targetLang: 'hi',
    tone: 'Casual'
  });

  assert.ok(result.success);
  assert.equal(result.engine, 'local-data');
  assert.ok(result.processingSource.includes('Local Data'));
});

test('Engine Routing: Privacy-sensitive normal translation strictly routes to On-device', async () => {
  const result = await translateText({
    text: 'Please meet at 5 PM',
    sourceLang: 'en',
    targetLang: 'hi',
    tone: 'Casual',
    isPrivacySensitive: true
  });

  assert.ok(result.success);
  assert.equal(result.engine, 'on-device');
  assert.ok(result.processingSource.includes('On-device'));
});

test('Translation Nuance: "Are you free now?" uses conversational "फ्री", NOT "स्वतंत्र"', async () => {
  const result = await translateText({
    text: 'Are you free now?',
    sourceLang: 'en',
    targetLang: 'hi',
    tone: 'Casual'
  });

  assert.ok(result.success);
  assert.ok(result.translatedText.includes('फ्री'));
  assert.ok(!result.translatedText.includes('स्वतंत्र'));
});

test('Entity Preservation: URLs, Emojis, and Names remain intact', async () => {
  const textWithEntities = 'Bharath, check https://example.com tomorrow 😊';
  const result = await translateText({
    text: textWithEntities,
    sourceLang: 'en',
    targetLang: 'hi',
    tone: 'Casual'
  });

  assert.ok(result.success);
  assert.ok(result.translatedText.includes('https://example.com'), 'URL must be preserved untouched');
  assert.ok(result.translatedText.includes('😊'), 'Emoji must be preserved');
  assert.ok(result.translatedText.includes('Bharath'), 'Name must be preserved');
});

test('Tone Adaptation: Casual vs Polite', async () => {
  const casual = await translateText({
    text: 'Where are you?',
    sourceLang: 'en',
    targetLang: 'hi',
    tone: 'Casual'
  });
  assert.equal(casual.translatedText, 'तुम कहाँ हो?');

  const polite = await translateText({
    text: 'Where are you?',
    sourceLang: 'en',
    targetLang: 'hi',
    tone: 'Polite'
  });
  assert.equal(polite.translatedText, 'आप कहाँ हैं?');
});

test('Telugu to Hindi Translation: "నువ్వు ఎక్కడ ఉన్నావు?" -> "तुम कहाँ हो?"', async () => {
  const result = await translateText({
    text: 'నువ్వు ఎక్కడ ఉన్నావు?',
    sourceLang: 'te',
    targetLang: 'hi',
    tone: 'Casual'
  });
  assert.equal(result.translatedText, 'तुम कहाँ हो?');
});

test('Reply Assistant: Generates multi-tone suggestions', async () => {
  const replies = await generateReplySuggestions({
    incomingText: "Why didn't you come yesterday?",
    targetLang: 'hi'
  });

  assert.ok(replies.length >= 3);
  const tones = replies.map(r => r.tone);
  assert.ok(tones.includes('Casual'));
  assert.ok(tones.includes('Polite'));
  assert.ok(tones.includes('Short'));
});

test('Correction System: "Yesterday I am going market." corrected to "went"', async () => {
  const res = await correctText({ text: 'Yesterday I am going market.' });
  assert.ok(res.corrected.includes('went'));
  assert.ok(res.explanation.toLowerCase().includes('past'));
});
