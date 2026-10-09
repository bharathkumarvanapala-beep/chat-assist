import { transliterateSentence, isDevanagari, isRomanHindi } from '../../web/frontend/src/services/transliterationService.js';
import { LocalProvider } from '../src/ai/localProvider.js';

async function runTests() {
  console.log('=== TEST SUITE: HINDI TRANSLITERATION & TRANSLATION ===\n');

  const local = new LocalProvider();

  const testCases = [
    {
      input: 'kaha jana hai',
      expectedTranslit: 'कहाँ जाना है',
      expectedAltsInclude: 'कहा जाना है'
    },
    {
      input: 'aap kaha ja rahe ho',
      expectedTranslit: 'आप कहाँ जा रहे हो',
      expectedAltsInclude: 'आप कहा जा रहे हो'
    },
    {
      input: 'mujhe kya karna hai',
      expectedTranslit: 'मुझे क्या करना है',
      expectedAltsInclude: 'मुझें क्या करना है'
    },
    {
      input: 'tum kya kar rahe ho',
      expectedTranslit: 'तुम क्या कर रहे हो',
      expectedAltsInclude: 'तुम क्या कर रहे हों'
    }
  ];

  console.log('--- 1. Testing Transliteration Assistant ---');
  let translitPassed = true;
  for (const tc of testCases) {
    const res = transliterateSentence(tc.input);
    console.log(`Input: "${tc.input}"`);
    console.log(`  Primary: "${res.primary}"`);
    console.log(`  Alternatives (${res.alternatives.length}):`, res.alternatives);

    if (res.primary !== tc.expectedTranslit) {
      console.error(`  FAIL: Expected "${tc.expectedTranslit}", got "${res.primary}"`);
      translitPassed = false;
    } else {
      console.log(`  PASS: Primary match.`);
    }

    if (res.alternatives.length < 2) {
      console.error(`  FAIL: Expected at least 2 alternatives, got ${res.alternatives.length}`);
      translitPassed = false;
    } else {
      console.log(`  PASS: Alternatives count = ${res.alternatives.length}.`);
    }
  }

  console.log('\n--- 2. Testing Direct Devanagari & Roman Detection ---');
  console.log('isDevanagari("कहाँ जाना है"):', isDevanagari("कहाँ जाना है"), '-> Expected true');
  console.log('isDevanagari("kaha jana hai"):', isDevanagari("kaha jana hai"), '-> Expected false');
  console.log('isRomanHindi("kaha jana hai"):', isRomanHindi("kaha jana hai"), '-> Expected true');
  console.log('isRomanHindi("कहाँ जाना है"):', isRomanHindi("कहाँ जाना है"), '-> Expected false');

  console.log('\n--- 3. Testing Local On-Device Translation (Hindi -> English) ---');
  const sentencesToTranslate = [
    'कहाँ जाना है',
    'kaha jana hai',
    'आप कहाँ जा रहे हो',
    'aap kaha ja rahe ho',
    'मुझे क्या करना है',
    'mujhe kya karna hai',
    'तुम क्या कर रहे हो',
    'tum kya kar rahe ho'
  ];

  let translatePassed = true;
  for (const s of sentencesToTranslate) {
    const res = await local.translate({
      text: s,
      sourceLanguage: 'hi',
      targetLanguage: 'en',
      tone: 'Casual',
      style: 'natural'
    });
    console.log(`Translate "${s}":`);
    if (res.success && res.translation) {
      console.log(`  PASS: -> "${res.translation}" (Alts: ${JSON.stringify(res.alternatives)})`);
    } else {
      console.error(`  FAIL: ${res.error || 'Failed to translate'}`);
      translatePassed = false;
    }
  }

  console.log('\n--- 4. Testing English and Telugu Modes (Preservation Check) ---');
  const enRes = await local.translate({
    text: 'Where are you?',
    sourceLanguage: 'en',
    targetLanguage: 'hi',
    tone: 'Casual'
  });
  console.log('EN -> HI ("Where are you?"):', enRes.translation);

  const teRes = await local.translate({
    text: 'Where are you going?',
    sourceLanguage: 'en',
    targetLanguage: 'te',
    tone: 'Casual'
  });
  console.log('EN -> TE ("Where are you going?"):', teRes.translation);

  const teToHiRes = await local.translate({
    text: 'ఎక్కడ ఉన్నావు',
    sourceLanguage: 'te',
    targetLanguage: 'hi',
    tone: 'Casual'
  });
  console.log('TE -> HI ("ఎక్కడ ఉన్నావు"):', teToHiRes.translation);

  if (translitPassed && translatePassed && enRes.success && teRes.success && teToHiRes.success) {
    console.log('\n>>> ALL TESTS PASSED SUCCESSFULLY! <<<');
  } else {
    console.error('\n>>> SOME TESTS FAILED <<<');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
