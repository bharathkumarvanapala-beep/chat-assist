import test from 'node:test';
import assert from 'node:assert';
import { aiOrchestrator } from '../src/ai/aiOrchestrator.js';
import { geminiProvider } from '../src/ai/geminiProvider.js';
import { localProvider } from '../src/ai/localProvider.js';

test('Routing Test: when Gemini is unavailable, localProvider is used and unsupported arbitrary sentences return clear fallback error', async () => {
  // Ensure Gemini is unavailable for this test
  const origKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  assert.strictEqual(geminiProvider.isAvailable(), false);
  const status = aiOrchestrator.getStatus();
  assert.strictEqual(status.activeProvider, 'local');
  assert.strictEqual(status.geminiAvailable, false);

  // Test arbitrary sentence that local engine cannot understand
  const res = await aiOrchestrator.translate({
    text: 'The quantum entanglement enables instantaneous quantum teleportation across qubits.',
    sourceLanguage: 'en',
    targetLanguage: 'hi'
  });

  // Must NOT silently return unrelated translation like "तुम क्या कह रहे हो?" or "मैं समझ गया।"
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.translation, '');
  assert.strictEqual(res.provider, 'local');
  assert.strictEqual(res.processingSource, 'On-device');
  assert.ok(res.error.includes('offline engine cannot confidently translate'));

  // Restore
  if (origKey) process.env.GEMINI_API_KEY = origKey;
});

test('Routing Test: when Gemini is available, translation routes to Gemini with Cloud AI badge', async () => {
  const origKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY_MOCK = 'true';
  process.env.GEMINI_API_KEY = 'test_mock_api_key_for_routing';

  assert.strictEqual(geminiProvider.isAvailable(), true);
  const status = aiOrchestrator.getStatus();
  assert.strictEqual(status.activeProvider, 'gemini');
  assert.strictEqual(status.geminiAvailable, true);

  // Mock geminiProvider.translate to verify orchestrator routing and payload pass-through
  const origTranslate = geminiProvider.translate.bind(geminiProvider);
  let capturedArgs = null;
  geminiProvider.translate = async (args) => {
    capturedArgs = args;
    return {
      translation: 'वह कहाँ देख रहा है?',
      alternatives: ['वह किधर देख रहा है?', 'कहाँ देख रहा है वह?'],
      grammar: [{ source: 'where', target: 'कहाँ' }],
      nuance: 'Conversational translation in Casual tone.'
    };
  };

  try {
    const res = await aiOrchestrator.translate({
      text: 'where is he looking',
      sourceLanguage: 'en',
      targetLanguage: 'hi',
      tone: 'Casual',
      style: 'natural',
      context: 'Previous message: He is searching for his keys.'
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.translation, 'वह कहाँ देख रहा है?');
    assert.strictEqual(res.provider, 'gemini');
    assert.strictEqual(res.mode, 'cloud');
    assert.strictEqual(res.processingSource, 'Cloud AI');
    assert.strictEqual(capturedArgs.text, 'where is he looking');
    assert.strictEqual(capturedArgs.sourceLanguage, 'en');
    assert.strictEqual(capturedArgs.targetLanguage, 'hi');
    assert.strictEqual(capturedArgs.tone, 'Casual');
    assert.strictEqual(capturedArgs.style, 'natural');
    assert.strictEqual(capturedArgs.context, 'Previous message: He is searching for his keys.');
  } finally {
    geminiProvider.translate = origTranslate;
    delete process.env.GEMINI_API_KEY_MOCK;
    if (origKey) process.env.GEMINI_API_KEY = origKey;
    else delete process.env.GEMINI_API_KEY;
  }
});

test('Routing Test: when user opts out of Cloud AI (consentCloud=false), routes to on-device', async () => {
  const origKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY_MOCK = 'true';
  process.env.GEMINI_API_KEY = 'test_mock_api_key_for_routing';

  let geminiCalled = false;
  const origTranslate = geminiProvider.translate.bind(geminiProvider);
  geminiProvider.translate = async () => {
    geminiCalled = true;
    return { translation: 'mock' };
  };

  try {
    const res = await aiOrchestrator.translate({
      text: 'Where are you going?',
      sourceLanguage: 'en',
      targetLanguage: 'hi',
      userConsentCloud: false
    });

    assert.strictEqual(geminiCalled, false, 'Gemini must not be called when userConsentCloud is false');
    assert.strictEqual(res.provider, 'local');
    assert.strictEqual(res.processingSource, 'On-device');
  } finally {
    geminiProvider.translate = origTranslate;
    delete process.env.GEMINI_API_KEY_MOCK;
    if (origKey) process.env.GEMINI_API_KEY = origKey;
    else delete process.env.GEMINI_API_KEY;
  }
});
