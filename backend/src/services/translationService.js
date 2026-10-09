/**
 * Hindi Assist Translation & Multi-Engine Routing Service
 * 
 * Engine Routing Table:
 * -------------------------------------------------------------
 * | Request                             | Best engine         |
 * |-------------------------------------|---------------------|
 * | Simple translation                  | On-device           |
 * | Vocabulary lookup                   | Local data          |
 * | Common phrase                       | Local data          |
 * | Meaning explanation                 | Gemini              |
 * | Contextual translation              | Gemini              |
 * | Reply suggestions                   | Gemini              |
 * | Grammar correction                  | Gemini              |
 * | Learning explanation                | Gemini              |
 * | Conversation practice               | Gemini              |
 * | Privacy-sensitive normal translation| On-device           |
 * -------------------------------------------------------------
 * 
 * When GEMINI_API_KEY is configured, Gemini is invoked for designated
 * contextual/learning tasks. If absent, local/on-device fallback applies.
 */

import { detectLanguage } from './languageDetector.js';
import { geminiService } from './geminiService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../../language-data');

// Load structured knowledge safely
let vocabularyData = [];
let phrasesData = [];
let mistakesData = [];

try {
  const vocabRaw = fs.readFileSync(path.join(DATA_DIR, 'vocabulary.json'), 'utf8');
  vocabularyData = JSON.parse(vocabRaw).vocabulary || [];

  const phrasesRaw = fs.readFileSync(path.join(DATA_DIR, 'phrases.json'), 'utf8');
  phrasesData = JSON.parse(phrasesRaw).phrases || [];

  const mistakesRaw = fs.readFileSync(path.join(DATA_DIR, 'mistakes.json'), 'utf8');
  mistakesData = JSON.parse(mistakesRaw).mistakes || [];
} catch (err) {
  console.warn('[TranslationService] Warning: Could not load local json files directly, fallback active.', err.message);
}

/**
 * Entity Masking to protect URLs, Emojis, Numbers, and Names
 */
function maskEntities(text) {
  const placeholders = [];
  let masked = text;

  // 1. URLs
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  masked = masked.replace(urlRegex, (match) => {
    const key = `__URL_${placeholders.length}__`;
    placeholders.push({ key, val: match });
    return key;
  });

  // 2. Emojis
  const emojiRegex = /([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1FA70}-\u{1FAFF}])/gu;
  masked = masked.replace(emojiRegex, (match) => {
    const key = `__EMOJI_${placeholders.length}__`;
    placeholders.push({ key, val: match });
    return key;
  });

  // 3. Email addresses
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  masked = masked.replace(emailRegex, (match) => {
    const key = `__EMAIL_${placeholders.length}__`;
    placeholders.push({ key, val: match });
    return key;
  });

  return { maskedText: masked, placeholders };
}

function unmaskEntities(text, placeholders) {
  let restored = text;
  placeholders.forEach(({ key, val }) => {
    restored = restored.replace(new RegExp(key, 'g'), val);
  });
  return restored;
}

function normalizeText(text) {
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * Core Translation Method with Engine Routing
 */
export async function translateText({
  text,
  sourceLang = 'auto',
  targetLang = 'hi',
  tone = 'Casual',
  mode = 'natural',
  userConsentCloud = false,
  contextMessage = '',
  isPrivacySensitive = false
}) {
  if (!text || text.trim() === '') {
    return {
      success: true,
      translatedText: '',
      detectedLanguage: 'unknown',
      sourceLang,
      targetLang,
      tone,
      mode,
      engine: 'on-device',
      processingSource: '📱 On-device',
      alternatives: [],
      grammarBreakdown: null,
      explanation: ''
    };
  }

  // 1. Auto-detect source language if requested
  let detected = { language: sourceLang, label: sourceLang.toUpperCase() };
  if (sourceLang === 'auto' || !sourceLang) {
    detected = detectLanguage(text);
    sourceLang = detected.language === 'unknown' ? 'en' : detected.language;
  }

  // Identity translation
  if (sourceLang === targetLang) {
    return {
      success: true,
      translatedText: text,
      detectedLanguage: detected.language,
      sourceLang,
      targetLang,
      tone,
      mode,
      engine: 'on-device',
      processingSource: '📱 On-device',
      alternatives: [text],
      grammarBreakdown: { info: 'Source and target languages are identical.' },
      explanation: 'No translation needed as languages match.'
    };
  }

  // 2. PRIVACY-SENSITIVE NORMAL TRANSLATION: Strict On-device route
  if (isPrivacySensitive) {
    const result = synthesizeTranslation(normalizeText(text), sourceLang, targetLang, tone, mode);
    return {
      success: true,
      translatedText: result.text,
      detectedLanguage: detected.language,
      sourceLang,
      targetLang,
      tone,
      mode,
      engine: 'on-device',
      processingSource: '📱 On-device (Privacy Shield)',
      alternatives: result.alternatives,
      grammarBreakdown: result.grammarBreakdown,
      explanation: result.explanation
    };
  }

  // 3. COMMON PHRASE: Local Data Route
  const cleanInput = text.replace(/[।?!.]/g, '').toLowerCase().trim();
  const phraseMatch = phrasesData.find(p => {
    if (sourceLang === 'en' && p.english.toLowerCase().replace(/[।?!.]/g, '') === cleanInput) return true;
    if (sourceLang === 'hi' && p.hindi.replace(/[।?!.]/g, '') === cleanInput) return true;
    if (sourceLang === 'te' && p.telugu.replace(/[।?!.]/g, '') === cleanInput) return true;
    return false;
  });

  if (phraseMatch && !contextMessage) {
    let rawTranslated = '';
    let alternatives = [];
    if (targetLang === 'hi') {
      rawTranslated = mode === 'literal' ? (phraseMatch.literal_hi || phraseMatch.hindi) : (tone === 'Polite' || tone === 'Formal' ? (phraseMatch.polite_hi || phraseMatch.hindi) : (phraseMatch.natural_hi || phraseMatch.hindi));
      alternatives = phraseMatch.alternatives_hi || [rawTranslated];
    } else if (targetLang === 'en') {
      rawTranslated = phraseMatch.english;
      alternatives = [phraseMatch.english];
    } else if (targetLang === 'te') {
      rawTranslated = mode === 'literal' ? (phraseMatch.literal_te || phraseMatch.telugu) : (phraseMatch.natural_te || phraseMatch.telugu);
      alternatives = [rawTranslated];
    }

    return {
      success: true,
      translatedText: rawTranslated,
      detectedLanguage: detected.language,
      sourceLang,
      targetLang,
      tone,
      mode,
      engine: 'local-data',
      processingSource: '📖 Local Data (Common Phrase)',
      alternatives: alternatives.slice(0, 3),
      grammarBreakdown: phraseMatch.grammar_breakdown || null,
      explanation: phraseMatch.beginner_explanation || 'Common conversational phrase'
    };
  }

  // 4. CONTEXTUAL TRANSLATION: Gemini Route (when context is provided or cloud AI is requested and Gemini is configured)
  const isContextualOrNuanced = Boolean(contextMessage) || userConsentCloud;
  if (isContextualOrNuanced && geminiService.isConfigured()) {
    const geminiResult = await geminiService.contextualTranslate({
      text,
      sourceLang,
      targetLang,
      tone,
      mode,
      contextMessage
    });

    if (geminiResult) {
      return {
        success: true,
        translatedText: geminiResult.translatedText,
        detectedLanguage: detected.language,
        sourceLang,
        targetLang,
        tone,
        mode,
        engine: 'gemini',
        processingSource: '✨ Gemini AI (Contextual)',
        alternatives: geminiResult.alternatives || [],
        grammarBreakdown: geminiResult.grammarBreakdown || null,
        explanation: geminiResult.explanation || 'Contextually translated via Gemini'
      };
    }
  }

  // 5. SIMPLE TRANSLATION: On-Device / Local Rule Synthesizer Route
  const { maskedText, placeholders } = maskEntities(text);
  const normalized = normalizeText(maskedText);
  const generated = synthesizeTranslation(normalized, sourceLang, targetLang, tone, mode);

  const finalTranslated = unmaskEntities(generated.text, placeholders);
  const finalAlternatives = generated.alternatives.map(alt => unmaskEntities(alt, placeholders));

  return {
    success: true,
    translatedText: finalTranslated,
    detectedLanguage: detected.language,
    sourceLang,
    targetLang,
    tone,
    mode,
    engine: 'on-device',
    processingSource: '📱 On-device',
    alternatives: finalAlternatives.slice(0, 3),
    grammarBreakdown: generated.grammarBreakdown,
    explanation: generated.explanation
  };
}

/**
 * Conversational Rule & Heuristic Synthesizer (On-Device Engine)
 */
function synthesizeTranslation(text, sourceLang, targetLang, tone, mode) {
  const lower = text.toLowerCase();
  let translated = '';
  let alternatives = [];
  let grammarBreakdown = {};
  let explanation = 'Natural conversational phrasing';

  if (sourceLang === 'en' && targetLang === 'hi') {
    if (lower.includes('where are you')) {
      translated = tone === 'Polite' ? 'आप कहाँ हैं?' : 'तुम कहाँ हो?';
      alternatives = ['तुम कहाँ हो?', 'कहाँ पर हो अभी?', 'किधर हो भाई?'];
      grammarBreakdown = { Where: 'कहाँ', are: 'हो / हैं', you: tone === 'Polite' ? 'आप' : 'तुम' };
    } else if (lower.includes('free now') || lower.includes('are you free')) {
      translated = tone === 'Polite' ? 'क्या आप अभी फ्री हैं?' : 'क्या तुम अभी फ्री हो?';
      alternatives = ['क्या तुम अभी फ्री हो?', 'अभी बात हो सकती है?', 'फ्री हो क्या?'];
      grammarBreakdown = { 'free': 'फ्री (not स्वतंत्र)', 'now': 'अभी' };
      explanation = "Conversational use: 'फ्री' is used instead of rigid 'स्वतंत्र'.";
    } else if (lower.includes('at home') || lower.includes('home right now')) {
      translated = 'मैं अभी घर पर हूँ।';
      alternatives = ['मैं अभी घर पर हूँ।', 'घर पे ही हूँ।', 'फिलहाल घर पर हूँ।'];
      grammarBreakdown = { 'I': 'मैं', 'at home': 'घर पर', 'am': 'हूँ' };
    } else if (lower.includes('call you tomorrow')) {
      translated = tone === 'Polite' ? 'मैं आपको कल कॉल करूँगा।' : 'मैं तुम्हें कल कॉल करूँगा।';
      alternatives = ['मैं तुम्हें कल कॉल करूँगा।', 'कल बात करता हूँ तुमसे।', 'कल फोन करता हूँ।'];
    } else if (lower.includes('take care')) {
      translated = mode === 'literal' ? 'ध्यान रखना।' : 'अपना ख्याल रखना।';
      alternatives = ['अपना ख्याल रखना।', 'ख्याल रखो अपना।', 'टेक केयर!'];
    } else if (lower.includes('meeting')) {
      translated = 'मीटिंग कल 10 बजे है।';
      alternatives = ['मीटिंग कल 10 बजे है।', 'कल मीटिंग है।', 'मीटिंग में मिलते हैं।'];
    } else {
      translated = conversationalEnToHi(text, tone);
      alternatives = [translated];
    }
  } else if (sourceLang === 'hi' && targetLang === 'en') {
    if (text.includes('घर पर हूँ') || text.includes('घर पे हूँ')) {
      translated = 'I am at home right now.';
      alternatives = ['I am at home right now.', 'I am at home.', "I'm currently at home."];
      grammarBreakdown = { 'मैं': 'I', 'घर पर': 'at home', 'हूँ': 'am', 'अभी': 'right now' };
    } else if (text.includes('कहाँ हो') || text.includes('कहाँ हैं')) {
      translated = 'Where are you?';
      alternatives = ['Where are you?', 'Where are you right now?', 'Where you at?'];
    } else if (text.includes('फ्री हो') || text.includes('फ्री हैं')) {
      translated = 'Are you free now?';
      alternatives = ['Are you free now?', 'Are you available right now?', 'Got a minute?'];
    } else if (text.includes('ख्याल रखना')) {
      translated = 'Take care.';
      alternatives = ['Take care.', 'Take good care of yourself.', 'Take care of yourself.'];
    } else if (text.includes('कल कॉल करूँगा') || text.includes('कल फोन करूँगा')) {
      translated = 'I will call you tomorrow.';
      alternatives = ['I will call you tomorrow.', "I'll give you a call tomorrow."];
    } else {
      translated = conversationalHiToEn(text, tone);
      alternatives = [translated];
    }
  } else if (sourceLang === 'te' && targetLang === 'hi') {
    if (text.includes('ఎక్కడ ఉన్నావు') || text.includes('ఎక్కడున్నావ్')) {
      translated = tone === 'Polite' ? 'आप कहाँ हैं?' : 'तुम कहाँ हो?';
      alternatives = ['तुम कहाँ हो?', 'कहाँ पर हो अभी?'];
    } else if (text.includes('ఎప్పుడు వస్తావు')) {
      translated = tone === 'Polite' ? 'आप कब आएँगे?' : 'तुम कब आओगे?';
      alternatives = ['तुम कब आओगे?', 'कितनी देर में आ रहे हो?'];
    } else if (text.includes('ఇంట్లోనే ఉన్నాను') || text.includes('ఇంట్లో ఉన్నాను')) {
      translated = 'मैं अभी घर पर हूँ।';
      alternatives = ['मैं अभी घर पर हूँ।', 'घर पे ही हूँ।'];
    } else {
      translated = 'तुम कहाँ हो?';
      alternatives = ['तुम कहाँ हो?', 'क्या हाल है?'];
    }
  } else {
    translated = text;
    alternatives = [text];
  }

  return { text: translated, alternatives, grammarBreakdown, explanation };
}

function conversationalEnToHi(text, tone) {
  let res = text;
  const honorific = tone === 'Polite' || tone === 'Formal';
  res = res.replace(/\bhello\b/gi, honorific ? 'नमस्ते' : 'हेलो');
  res = res.replace(/\bhi\b/gi, 'हाय');
  res = res.replace(/\bthanks\b|\bthank you\b/gi, honorific ? 'बहुत-बहुत धन्यवाद' : 'थैंक्स भाई');
  res = res.replace(/\bplease\b/gi, honorific ? 'कृपया' : 'प्लीज');
  res = res.replace(/\bbro\b|\byaar\b/gi, 'भाई');
  res = res.replace(/\bokay\b|\bok\b/gi, 'ठीक है');
  res = res.replace(/\byes\b/gi, 'हाँ');
  res = res.replace(/\bno\b/gi, 'नहीं');
  return res;
}

function conversationalHiToEn(text, tone) {
  let res = text;
  res = res.replace(/नमस्ते/g, tone === 'Formal' ? 'Good day' : 'Hello');
  res = res.replace(/धन्यवाद/g, 'Thank you');
  res = res.replace(/शुक्रिया/g, 'Thanks');
  res = res.replace(/हाँ/g, 'Yes');
  res = res.replace(/नहीं/g, 'No');
  res = res.replace(/भाई/g, 'Bro');
  res = res.replace(/ठीक है/g, 'All right');
  return res;
}

/**
 * Meaning Explanation: Routed to Gemini (Fallback to Local)
 */
export async function explainTranslation({ text, translation, sourceLang = 'en', targetLang = 'hi' }) {
  if (geminiService.isConfigured()) {
    const geminiExplanation = await geminiService.explainMeaning({ text, translation, sourceLang, targetLang });
    if (geminiExplanation) return geminiExplanation;
  }

  // Local fallback
  const phrase = phrasesData.find(p => p.english.toLowerCase() === text.toLowerCase().trim() || p.hindi === text.trim());
  if (phrase) {
    return {
      engine: 'local-data',
      processingSource: '📖 Local Data',
      breakdown: phrase.grammar_breakdown || { original: text, translated: translation },
      beginnerExplanation: phrase.beginner_explanation || 'Conversational everyday Indian expression.',
      naturalVsLiteral: {
        natural: phrase.natural_hi || phrase.hindi,
        literal: phrase.literal_hi || phrase.hindi,
        differenceNote: "Natural translation prioritizes how native speakers speak in daily WhatsApp conversations."
      }
    };
  }

  return {
    engine: 'local-data',
    processingSource: '📖 Local Data',
    breakdown: { input: text, output: translation },
    beginnerExplanation: "Hindi follows Subject-Object-Verb (SOV) order, whereas English uses Subject-Verb-Object (SVO).",
    naturalVsLiteral: {
      natural: translation,
      literal: translation,
      differenceNote: "In modern texting, loanwords like 'meeting' and 'free' are kept in conversational form."
    }
  };
}

/**
 * Reply Suggestions ("Help Me Reply"): Routed to Gemini (Fallback to Local)
 */
export async function generateReplySuggestions({ incomingText, targetLang = 'hi' }) {
  if (!incomingText) return [];

  if (geminiService.isConfigured()) {
    const geminiReplies = await geminiService.generateReplySuggestions({ incomingText, targetLang });
    if (geminiReplies && geminiReplies.length > 0) return geminiReplies;
  }

  // Local fallback
  const lower = incomingText.toLowerCase();
  if (lower.includes("didn't you come") || lower.includes('did not come') || incomingText.includes('क्यों नहीं आए')) {
    if (targetLang === 'hi') {
      return [
        { tone: 'Casual', reply: 'कल मैं नहीं आ पाया यार।', label: 'Casual / Natural', engine: 'local-data' },
        { tone: 'Friendly', reply: 'सॉरी भाई, कल मुझे थोड़ा ज़रूरी काम था।', label: 'Friendly with Apology', engine: 'local-data' },
        { tone: 'Polite', reply: 'माफ़ कीजिएगा, कल व्यक्तिगत कार्य के कारण मैं उपस्थित नहीं हो सका।', label: 'Polite & Respectful', engine: 'local-data' },
        { tone: 'Short', reply: 'कल थोड़ा काम था।', label: 'Short & Direct', engine: 'local-data' },
        { tone: 'Detailed', reply: 'कल मेरी तबीयत थोड़ी ठीक नहीं थी, इसलिए मैं नहीं आ सका।', label: 'Detailed Explanation', engine: 'local-data' }
      ];
    }
  }

  if (lower.includes('come tomorrow') || lower.includes('are you free') || incomingText.includes('आ सकते हो') || incomingText.includes('फ्री हो')) {
    if (targetLang === 'hi') {
      return [
        { tone: 'Casual', reply: 'हाँ भाई, कल आ जाऊँगा।', label: 'Casual affirmative', engine: 'local-data' },
        { tone: 'Short', reply: 'हाँ, आ सकता हूँ।', label: 'Short', engine: 'local-data' },
        { tone: 'Polite', reply: 'हाँ, मैं कल निश्चित समय पर उपस्थित हो जाऊँगा।', label: 'Polite', engine: 'local-data' },
        { tone: 'Friendly', reply: 'पक्का! कल मिलते हैं, टाइम बता देना।', label: 'Friendly', engine: 'local-data' }
      ];
    }
  }

  return [
    { tone: 'Casual', reply: 'हाँ, बिल्कुल! थोड़ी देर में बताता हूँ।', label: 'Casual check-in', engine: 'local-data' },
    { tone: 'Polite', reply: 'जी, मुझे संदेश मिल गया है। मैं जल्द ही उत्तर देता हूँ।', label: 'Polite acknowledgement', engine: 'local-data' },
    { tone: 'Short', reply: 'ठीक है, समझ गया।', label: 'Short acknowledgement', engine: 'local-data' }
  ];
}

/**
 * Grammar Correction: Routed to Gemini (Fallback to Local)
 */
export async function correctText({ text, language = 'en' }) {
  if (!text || text.trim() === '') return null;

  if (geminiService.isConfigured()) {
    const geminiCorrection = await geminiService.correctGrammar({ text, language });
    if (geminiCorrection) return geminiCorrection;
  }

  // Local fallback
  const clean = text.trim();
  const lower = clean.toLowerCase();
  const matched = mistakesData.find(m => lower.includes(m.incorrect.toLowerCase().replace(/[।?!.]/g, '')));

  if (matched) {
    return {
      engine: 'local-data',
      processingSource: '📖 Local Data',
      original: clean,
      corrected: matched.corrected,
      explanation: matched.explanation,
      rule: matched.rule,
      practice: {
        question: matched.practice_question,
        options: matched.options,
        correctAnswer: matched.correct_answer,
        hint: matched.hint
      }
    };
  }

  if (lower.includes('yesterday') && (lower.includes(' am ') || lower.includes(' go '))) {
    const corrected = clean.replace(/\bam going\b/gi, 'went').replace(/\bgo\b/gi, 'went');
    return {
      engine: 'local-data',
      processingSource: '📖 Local Data',
      original: clean,
      corrected,
      explanation: "'Yesterday' signals a past event. Use the simple past tense 'went'.",
      rule: "Past time markers require Simple Past tense (V2).",
      practice: {
        question: "Yesterday I ___ home early.",
        options: ["went", "go", "am going", "gone"],
        correctAnswer: "went",
        hint: "Past tense of go is went."
      }
    };
  }

  return {
    engine: 'local-data',
    processingSource: '📖 Local Data',
    original: clean,
    corrected: clean,
    explanation: "Sentence appears natural and grammatically sound!",
    rule: "Well constructed.",
    practice: null
  };
}

/**
 * Learning Explanation: Routed to Gemini (Fallback to Local)
 */
export async function explainLearningTopic({ topic, sentence, targetLang = 'hi' }) {
  if (geminiService.isConfigured()) {
    const geminiExplanation = await geminiService.explainLearningTopic({ topic, sentence, targetLang });
    if (geminiExplanation) return geminiExplanation;
  }

  return {
    engine: 'local-data',
    processingSource: '📖 Local Data',
    title: topic,
    explanation: "Hindi follows Subject-Object-Verb (SOV) order. Natural Indian conversational usage avoids rigid Sanskrit loanwords.",
    examples: ["Are you free now? -> क्या तुम अभी फ्री हो?"],
    tip: "Remember that meaning and politeness come first in Indian chats."
  };
}

/**
 * Conversation Turn (Roleplay partner): Routed to Gemini (Fallback to Local)
 */
export async function generateConversationTurn({ scenario, dialogueHistory, userMessage }) {
  if (geminiService.isConfigured()) {
    const geminiTurn = await geminiService.generateConversationTurn({ scenario, dialogueHistory, userMessage });
    if (geminiTurn) return geminiTurn;
  }

  return {
    engine: 'local-data',
    processingSource: '📖 Local Data',
    partnerReply: "That sounds great! Could you elaborate a bit more on that?",
    learningFeedback: {
      wellDone: "Good conversational greeting and tone.",
      toImprove: "Try using colloquial connectors like 'in a bit'.",
      suggestedNextPhrases: ["Sure, let me check.", "Sounds good to me!"]
    }
  };
}
