import { aiOrchestrator } from '../src/ai/aiOrchestrator.js';
import { localProvider } from '../src/ai/localProvider.js';

console.log('====================================================');
console.log('HINDI ASSIST - COMPREHENSIVE TRANSLATION SUITE');
console.log('Testing Sentence-Level Conversational Architecture');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✓ PASS: ${testName}`);
    if (details) console.log(`   └─ ${details}`);
  } else {
    failedTests++;
    console.error(`✗ FAIL: ${testName}`);
    if (details) console.error(`   └─ ${details}`);
  }
}

async function runTests() {
  console.log('--- TEST GROUP 1: ENGLISH → HINDI (Requirement 20) ---');

  const enToHiCases = [
    { text: 'Where are you going?', expectedKeywords: ['जा रहे', 'कहाँ'] },
    { text: 'What are you doing?', expectedKeywords: ['क्या कर रहे'] },
    { text: 'Where are you walking?', expectedKeywords: ['कहाँ चल रहे', 'तुम', 'आप'] },
    { text: 'I will call you tomorrow.', expectedKeywords: ['कॉल करूँगा', 'कल'] },
    { text: 'Did you eat?', expectedKeywords: ['खाना खाया'] },
    { text: "Why didn't you come yesterday?", expectedKeywords: ['क्यों नहीं आए', 'कल'] },
    { text: 'Can you send me the location?', expectedKeywords: ['लोकेशन', 'भेज'] },
    { text: 'I have been waiting for you.', expectedKeywords: ['इंतज़ार कर रहा'] },
    { text: 'Let me know when you reach home.', expectedKeywords: ['घर पहुँचो', 'बताना'] }
  ];

  for (const c of enToHiCases) {
    const res = await aiOrchestrator.translate({
      text: c.text,
      sourceLanguage: 'en',
      targetLanguage: 'hi',
      tone: 'Casual',
      style: 'natural'
    });

    const isComplete = c.expectedKeywords.some(kw => res.translation.includes(kw));
    const noBrokenEnglishTokens = !res.translation.includes('are') && !res.translation.includes('walking') && !res.translation.includes('going');

    assert(
      res.success && isComplete && noBrokenEnglishTokens,
      `EN → HI: "${c.text}"`,
      `Result: "${res.translation}" | Provider: ${res.provider} | Mode: ${res.mode}`
    );
  }

  console.log('\n--- TEST GROUP 2: ENGLISH → TELUGU (Requirement 20) ---');

  const enToTeCases = [
    { text: 'Where are you walking?', expectedKeywords: ['ఎక్కడ', 'నడుస్తున్నావు', 'నడుస్తున్నారు'] },
    { text: 'Where are you going?', expectedKeywords: ['ఎక్కడ', 'వెళ్తున్నారు', 'వెళ్తున్నావు'] },
    { text: 'What are you doing?', expectedKeywords: ['ఏమి', 'చేస్తున్నారు'] },
    { text: 'Did you eat?', expectedKeywords: ['తిన్నారా', 'భోజనం'] },
    { text: 'I will call you tomorrow.', expectedKeywords: ['రేపు', 'కాల్'] }
  ];

  for (const c of enToTeCases) {
    const res = await aiOrchestrator.translate({
      text: c.text,
      sourceLanguage: 'en',
      targetLanguage: 'te',
      tone: 'Casual',
      style: 'natural'
    });

    const isComplete = c.expectedKeywords.some(kw => res.translation.includes(kw));
    assert(
      res.success && isComplete,
      `EN → TE: "${c.text}"`,
      `Result: "${res.translation}"`
    );
  }

  console.log('\n--- TEST GROUP 3: HINDI → ENGLISH (Requirement 20) ---');

  const hiToEnCases = [
    { text: 'तुम कहाँ चल रहे हो?', expectedKeywords: ['walking', 'Where'] },
    { text: 'तुम कहाँ जा रहे हो?', expectedKeywords: ['going', 'Where'] },
    { text: 'तुम क्या कर रहे हो?', expectedKeywords: ['doing', 'What'] },
    { text: 'क्या तुमने खाना खाया?', expectedKeywords: ['eat', 'Did'] },
    { text: 'मैं तुम्हें कल कॉल करूँगा।', expectedKeywords: ['call', 'tomorrow'] }
  ];

  for (const c of hiToEnCases) {
    const res = await aiOrchestrator.translate({
      text: c.text,
      sourceLanguage: 'hi',
      targetLanguage: 'en',
      tone: 'Casual',
      style: 'natural'
    });

    const isComplete = c.expectedKeywords.some(kw => res.translation.toLowerCase().includes(kw.toLowerCase()));
    assert(
      res.success && isComplete,
      `HI → EN: "${c.text}"`,
      `Result: "${res.translation}"`
    );
  }

  console.log('\n--- TEST GROUP 4: TELUGU → HINDI (Requirement 20) ---');

  const teToHiCases = [
    { text: 'నువ్వు ఎక్కడ నడుస్తున్నావు?', expectedKeywords: ['कहाँ चल रहे'] },
    { text: 'మీరు ఎక్కడ వెళ్తున్నారు?', expectedKeywords: ['कहाँ जा रहे'] },
    { text: 'నువ్వు ఏమి చేస్తున్నావు?', expectedKeywords: ['क्या कर रहे'] },
    { text: 'మీరు తిన్నారా?', expectedKeywords: ['खाना खाया'] }
  ];

  for (const c of teToHiCases) {
    const res = await aiOrchestrator.translate({
      text: c.text,
      sourceLanguage: 'te',
      targetLanguage: 'hi',
      tone: 'Casual',
      style: 'natural'
    });

    const isComplete = c.expectedKeywords.some(kw => res.translation.includes(kw));
    assert(
      res.success && isComplete,
      `TE → HI: "${c.text}"`,
      `Result: "${res.translation}"`
    );
  }

  console.log('\n--- TEST GROUP 5: TONES & STYLES (Requirement 20) ---');

  // Casual tone
  const casualRes = await aiOrchestrator.translate({
    text: 'Where are you walking?',
    sourceLanguage: 'en',
    targetLanguage: 'hi',
    tone: 'Casual',
    style: 'natural'
  });
  assert(casualRes.translation.includes('तुम'), 'Casual tone uses "तुम"', casualRes.translation);

  // Polite tone
  const politeRes = await aiOrchestrator.translate({
    text: 'Where are you walking?',
    sourceLanguage: 'en',
    targetLanguage: 'hi',
    tone: 'Polite',
    style: 'natural'
  });
  assert(politeRes.translation.includes('आप'), 'Polite tone uses "आप"', politeRes.translation);

  // Formal tone
  const formalRes = await aiOrchestrator.translate({
    text: 'Where are you walking?',
    sourceLanguage: 'en',
    targetLanguage: 'hi',
    tone: 'Formal',
    style: 'natural'
  });
  assert(formalRes.translation.includes('आप'), 'Formal tone uses "आप"', formalRes.translation);

  // Natural vs Literal style
  const naturalRes = await aiOrchestrator.translate({
    text: 'Are you free now?',
    sourceLanguage: 'en',
    targetLanguage: 'hi',
    tone: 'Casual',
    style: 'natural'
  });
  assert(!naturalRes.translation.includes('स्वतंत्र'), 'Natural style avoids literal "स्वतंत्र" for free', naturalRes.translation);

  console.log('\n--- TEST GROUP 6: ENTITY PRESERVATION & EDGE CASES (Requirement 20) ---');

  // URL preservation
  const urlRes = await aiOrchestrator.translate({
    text: 'Please check https://example.com/status now',
    sourceLanguage: 'en',
    targetLanguage: 'hi'
  });
  assert(urlRes.translation.includes('https://example.com/status'), 'Preserves URLs intact', urlRes.translation);

  // Emoji preservation
  const emojiRes = await aiOrchestrator.translate({
    text: 'Where are you going? 🚀',
    sourceLanguage: 'en',
    targetLanguage: 'hi'
  });
  assert(emojiRes.translation.includes('🚀'), 'Preserves emojis intact', emojiRes.translation);

  // Name preservation
  const nameRes = await aiOrchestrator.translate({
    text: 'Rahul, please check https://status.com at 5pm',
    sourceLanguage: 'en',
    targetLanguage: 'hi'
  });
  assert(nameRes.translation.includes('Rahul'), 'Preserves names intact', nameRes.translation);

  // Number / Time preservation
  assert(nameRes.translation.includes('5pm'), 'Preserves time/numbers intact', nameRes.translation);

  // Empty input
  const emptyRes = await aiOrchestrator.translate({
    text: '',
    sourceLanguage: 'en',
    targetLanguage: 'hi'
  });
  assert(emptyRes.success && emptyRes.translation === '', 'Empty input handled gracefully without crashing');

  // Very short input
  const shortRes = await aiOrchestrator.translate({
    text: 'Hi',
    sourceLanguage: 'en',
    targetLanguage: 'hi'
  });
  assert(shortRes.success && shortRes.translation.length > 0, 'Very short input handled properly', shortRes.translation);

  // Long input
  const longRes = await aiOrchestrator.translate({
    text: 'Let me know when you reach home and are free to talk about the project.',
    sourceLanguage: 'en',
    targetLanguage: 'hi'
  });
  assert(longRes.success && longRes.translation.length > 0, 'Long sentence translated properly', longRes.translation);

  console.log('\n--- TEST GROUP 7: RESPONSE SCHEMA VALIDATION (Requirement 15) ---');

  const schemaRes = await aiOrchestrator.translate({
    text: 'Where are you walking?',
    sourceLanguage: 'en',
    targetLanguage: 'hi',
    tone: 'Casual',
    style: 'natural'
  });

  const requiredFields = [
    'success',
    'translation',
    'alternatives',
    'grammar',
    'nuance',
    'tone',
    'style',
    'sourceLanguage',
    'targetLanguage',
    'provider',
    'mode'
  ];

  const missingFields = requiredFields.filter(f => !(f in schemaRes));
  assert(
    missingFields.length === 0,
    'Backend response adheres strictly to Requirement 15 schema',
    `Missing fields: ${missingFields.length > 0 ? missingFields.join(', ') : 'none'}`
  );
  assert(Array.isArray(schemaRes.alternatives), 'alternatives is an array');
  assert(Array.isArray(schemaRes.grammar), 'grammar is an array');

  console.log('\n--- TEST GROUP 8: FALLBACK TRANSPARENCY (Requirement 17 & 19) ---');

  // Verify orchestrator returns accurate provider and mode
  assert(schemaRes.provider === 'local' || schemaRes.provider === 'gemini', `Provider is clearly identified: ${schemaRes.provider}`);
  assert(
    schemaRes.processingSource.includes('On-device') || schemaRes.processingSource.includes('Cloud AI'),
    `UI Processing source clearly labeled: ${schemaRes.processingSource}`
  );

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
  console.log('====================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test run failed with unhandled error:', err);
  process.exit(1);
});
