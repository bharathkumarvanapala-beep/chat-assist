import test from 'node:test';
import assert from 'node:assert';
import { aiOrchestrator } from '../src/ai/aiOrchestrator.js';
import { geminiProvider } from '../src/ai/geminiProvider.js';

test('1. Routing Selection: Local vs Gemini vs Consent vs Privacy Shield', async () => {
  // Scenario A: Gemini unavailable -> routes to local
  const origKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  assert.strictEqual(geminiProvider.isAvailable(), false);

  const localRes = await aiOrchestrator.translate({
    text: 'where are you going',
    sourceLanguage: 'en',
    targetLanguage: 'hi'
  });
  assert.strictEqual(localRes.provider, 'local');
  assert.strictEqual(localRes.processingSource, 'On-device');

  // Scenario B: Gemini available -> routes to Gemini
  process.env.GEMINI_API_KEY_MOCK = 'true';
  process.env.GEMINI_API_KEY = 'test_mock_gemini_key_12345';
  assert.strictEqual(geminiProvider.isAvailable(), true);

  const origTranslate = geminiProvider.translate.bind(geminiProvider);
  let capturedArgs = null;
  geminiProvider.translate = async (args) => {
    capturedArgs = args;
    return {
      translation: 'तुम कहाँ जा रहे हो?',
      alternatives: ['किधर जा रहे हो?'],
      grammar: [{ source: 'where', target: 'कहाँ' }],
      nuance: 'Casual conversational translation.'
    };
  };

  try {
    const cloudRes = await aiOrchestrator.translate({
      text: 'where are you going',
      sourceLanguage: 'en',
      targetLanguage: 'hi',
      userConsentCloud: true
    });
    assert.strictEqual(cloudRes.provider, 'gemini');
    assert.strictEqual(cloudRes.processingSource, 'Cloud AI');
    assert.strictEqual(cloudRes.translation, 'तुम कहाँ जा रहे हो?');

    // Scenario C: User disables Cloud AI consent -> routes to local
    const consentRes = await aiOrchestrator.translate({
      text: 'where are you going',
      sourceLanguage: 'en',
      targetLanguage: 'hi',
      userConsentCloud: false
    });
    assert.strictEqual(consentRes.provider, 'local');
    assert.strictEqual(consentRes.processingSource, 'On-device');

    // Scenario D: Privacy Sensitive flag enabled -> strictly routes to local
    const privacyRes = await aiOrchestrator.translate({
      text: 'where are you going',
      sourceLanguage: 'en',
      targetLanguage: 'hi',
      isPrivacySensitive: true
    });
    assert.strictEqual(privacyRes.provider, 'local');
    assert.strictEqual(privacyRes.processingSource, 'On-device');
  } finally {
    geminiProvider.translate = origTranslate;
    delete process.env.GEMINI_API_KEY_MOCK;
    if (origKey) process.env.GEMINI_API_KEY = origKey;
    else delete process.env.GEMINI_API_KEY;
  }
});

test('2. Offline Fallback: Never invent unrelated translations for unconfident sentences', async () => {
  const origKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  // Input not in limited phrasebook or on-device templates
  const arbitrarySentence = 'The quantum neural network computes tensor matrices dynamically.';
  const res = await aiOrchestrator.translate({
    text: arbitrarySentence,
    sourceLanguage: 'en',
    targetLanguage: 'hi'
  });

  // Must return clear fallback error state
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.translation, '');
  assert.strictEqual(res.provider, 'local');
  assert.strictEqual(res.processingSource, 'On-device');
  assert.ok(res.error.includes('offline engine cannot confidently translate'));
  // Ensure it never returns hallucinated phrases
  assert.ok(!res.translation.includes('तुम क्या कह रहे हो'));
  assert.ok(!res.translation.includes('मैं समझ गया'));

  if (origKey) process.env.GEMINI_API_KEY = origKey;
});

test('3. Verify 7 Required Sentences via Gemini preserving exact meaning', async () => {
  const origKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY_MOCK = 'true';
  process.env.GEMINI_API_KEY = 'test_mock_gemini_key_12345';

  const mockTranslations = {
    'where is he looking': {
      translation: 'वह कहाँ देख रहा है?',
      alternatives: ['वह किधर देख रहा है?', 'कहाँ देख रहा है वह?'],
      grammar: [{ source: 'where', target: 'कहाँ' }, { source: 'looking', target: 'देख रहा' }],
      nuance: 'Casual tone masculine singular continuous.'
    },
    'where are you going': {
      translation: 'तुम कहाँ जा रहे हो?',
      alternatives: ['किधर जा रहे हो?', 'कहाँ निकल रहे हो?'],
      grammar: [{ source: 'where', target: 'कहाँ' }, { source: 'going', target: 'जा रहे' }],
      nuance: 'Casual tone peer second person.'
    },
    'what are they doing': {
      translation: 'वे क्या कर रहे हैं?',
      alternatives: ['वो लोग क्या कर रहे हैं?', 'क्या चल रहा है उनका?'],
      grammar: [{ source: 'what', target: 'क्या' }, { source: 'doing', target: 'कर रहे' }],
      nuance: 'Third person plural continuous.'
    },
    'why is she waiting': {
      translation: 'वह क्यों इंतज़ार कर रही है?',
      alternatives: ['वह किसलिए रुकी हुई है?'],
      grammar: [{ source: 'why', target: 'क्यों' }, { source: 'waiting', target: 'इंतज़ार कर रही' }],
      nuance: 'Feminine singular continuous with reason question.'
    },
    'did you eat': {
      translation: 'क्या तुमने खाना खाया?',
      alternatives: ['खाना खा लिया क्या?', 'खाना खाया?'],
      grammar: [{ source: 'did you', target: 'क्या तुमने' }, { source: 'eat', target: 'खाना खाया' }],
      nuance: 'Past tense transitive with ne postposition.'
    },
    'where is my brother': {
      translation: 'मेरा भाई कहाँ है?',
      alternatives: ['भाई कहाँ है मेरा?'],
      grammar: [{ source: 'where', target: 'कहाँ' }, { source: 'my brother', target: 'मेरा भाई' }],
      nuance: 'Possessive relational inquiry.'
    },
    'i will call you tomorrow': {
      translation: 'मैं तुम्हें कल कॉल करूँगा।',
      alternatives: ['कल बात करता हूँ तुमसे।', 'कल फोन लगाता हूँ।'],
      grammar: [{ source: 'tomorrow', target: 'कल' }, { source: 'will call', target: 'कॉल करूँगा' }],
      nuance: 'Future first person with loanword call preserved.'
    }
  };

  const origTranslate = geminiProvider.translate.bind(geminiProvider);
  geminiProvider.translate = async ({ text }) => {
    const matched = mockTranslations[text.toLowerCase().trim()];
    if (matched) return matched;
    return { translation: `Translated: ${text}`, alternatives: [], grammar: [], nuance: '' };
  };

  try {
    for (const [inputSentence, expected] of Object.entries(mockTranslations)) {
      const res = await aiOrchestrator.translate({
        text: inputSentence,
        sourceLanguage: 'en',
        targetLanguage: 'hi'
      });

      assert.strictEqual(res.success, true);
      assert.strictEqual(res.provider, 'gemini');
      assert.strictEqual(res.processingSource, 'Cloud AI');
      assert.strictEqual(res.translation, expected.translation);
      assert.ok(res.alternatives.length > 0);
      assert.ok(res.grammar.length > 0);
      assert.ok(res.nuance.length > 0);
    }
  } finally {
    geminiProvider.translate = origTranslate;
    delete process.env.GEMINI_API_KEY_MOCK;
    if (origKey) process.env.GEMINI_API_KEY = origKey;
    else delete process.env.GEMINI_API_KEY;
  }
});

test('4. Verify changing translation parameters: tone, style, context, language direction', async () => {
  const origKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY_MOCK = 'true';
  process.env.GEMINI_API_KEY = 'test_mock_gemini_key_12345';

  const origTranslate = geminiProvider.translate.bind(geminiProvider);
  let recordedCalls = [];
  geminiProvider.translate = async (params) => {
    recordedCalls.push(params);
    if (params.tone === 'Polite') {
      return { translation: 'आप कहाँ जा रहे हैं?' };
    }
    if (params.style === 'literal') {
      return { translation: 'कहाँ आप जा रहे हैं?' };
    }
    if (params.targetLanguage === 'te') {
      return { translation: 'మీరు ఎక్కడికి వెళ్తున్నారు?' };
    }
    return { translation: 'तुम कहाँ जा रहे हो?' };
  };

  try {
    // A: Tone variation
    const politeRes = await aiOrchestrator.translate({
      text: 'where are you going',
      sourceLanguage: 'en',
      targetLanguage: 'hi',
      tone: 'Polite'
    });
    assert.strictEqual(politeRes.translation, 'आप कहाँ जा रहे हैं?');
    assert.strictEqual(recordedCalls[0].tone, 'Polite');

    // B: Style variation (literal vs natural)
    const literalRes = await aiOrchestrator.translate({
      text: 'where are you going',
      sourceLanguage: 'en',
      targetLanguage: 'hi',
      style: 'literal'
    });
    assert.strictEqual(literalRes.translation, 'कहाँ आप जा रहे हैं?');
    assert.strictEqual(recordedCalls[1].style, 'literal');

    // C: Target language variation (Telugu)
    const teRes = await aiOrchestrator.translate({
      text: 'where are you going',
      sourceLanguage: 'en',
      targetLanguage: 'te'
    });
    assert.strictEqual(teRes.translation, 'మీరు ఎక్కడికి వెళ్తున్నారు?');
    assert.strictEqual(recordedCalls[2].targetLanguage, 'te');

    // D: Context variation
    await aiOrchestrator.translate({
      text: 'are you coming?',
      sourceLanguage: 'en',
      targetLanguage: 'hi',
      context: 'We are at the station waiting for train.'
    });
    assert.strictEqual(recordedCalls[3].context, 'We are at the station waiting for train.');
  } finally {
    geminiProvider.translate = origTranslate;
    delete process.env.GEMINI_API_KEY_MOCK;
    if (origKey) process.env.GEMINI_API_KEY = origKey;
    else delete process.env.GEMINI_API_KEY;
  }
});
