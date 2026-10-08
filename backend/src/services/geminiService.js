/**
 * Gemini AI Service for Hindi Assist
 * 
 * Powered by Google Gemini (@google/genai SDK).
 * 
 * Routes higher-level contextual and learning tasks to Gemini:
 * - Meaning explanation ("Why this translation?")
 * - Contextual / multi-message translation
 * - Reply suggestions ("Help Me Reply")
 * - Grammar correction ("Correct My English / Hindi")
 * - Learning explanation ("Explain Like I'm a Beginner")
 * - Conversation roleplay practice turns
 * 
 * If GEMINI_API_KEY is not configured or empty, calls return null so
 * the caller seamlessly falls back to the on-device / local data engine.
 */

import { GoogleGenAI } from '@google/genai';

class GeminiService {
  constructor() {
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  }

  get client() {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
  }

  isConfigured() {
    const key = process.env.GEMINI_API_KEY?.trim();
    return Boolean(key && key.length > 5 && key !== 'your_api_key_here');
  }

  /**
   * Helper to parse JSON from Gemini response safely
   */
  cleanJson(text) {
    let clean = text.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/i, '').replace(/```\s*$/i, '');
    }
    return JSON.parse(clean);
  }

  /**
   * 1. Contextual Translation via Gemini
   */
  async contextualTranslate({ text, sourceLang, targetLang, tone = 'Casual', mode = 'natural', contextMessage = '' }) {
    const ai = this.client;
    if (!ai) return null;

    try {
      const prompt = `You are Hindi Assist, a specialized Indian conversational translator (English • Hindi • Telugu).
Translate the following text accurately, naturally, and contextually.

Source Language: ${sourceLang}
Target Language: ${targetLang}
Desired Tone: ${tone} (Options: Casual, Friendly, Neutral, Polite, Formal, Work)
Translation Mode: ${mode} (natural conversational vs literal)
${contextMessage ? `Preceding Conversation Context: "${contextMessage}"` : ''}

CRITICAL RULES:
1. Meaning, context, politeness, and modern Indian texting habits come first.
2. For schedule availability, NEVER translate "free" as "स्वतंत्र" (independent). Use "फ्री" or "खाली".
3. Preserve all URLs, emails, emojis, numbers, and proper names untouched.
4. Support mixed language (Hinglish/Tenglish) naturally.

Text to translate:
"${text}"

Return ONLY a valid JSON object with:
{
  "translatedText": "the main natural translation",
  "alternatives": ["alternative 1", "alternative 2", "alternative 3"],
  "grammarBreakdown": {"token1": "meaning1", "token2": "meaning2"},
  "explanation": "brief conversational nuance explanation"
}`;

      const res = await ai.models.generateContent({
        model: this.modelName,
        contents: prompt
      });

      const parsed = this.cleanJson(res.text);
      return {
        ...parsed,
        engine: 'gemini',
        processingSource: '✨ Gemini AI'
      };
    } catch (err) {
      console.warn('[GeminiService] contextualTranslate error, falling back to local engine:', err.message);
      return null;
    }
  }

  /**
   * 2. Meaning Explanation ("Why this translation?") via Gemini
   */
  async explainMeaning({ text, translation, sourceLang, targetLang }) {
    const ai = this.client;
    if (!ai) return null;

    try {
      const prompt = `You are Hindi Assist language tutor. Explain the translation from ${sourceLang} to ${targetLang} in simple, beginner-friendly terms.

Original: "${text}"
Translation: "${translation}"

Break down:
1. Token/phrase level mapping.
2. Beginner explanation of sentence structure (e.g. Hindi SOV vs English SVO).
3. Natural vs Literal comparison note.

Return ONLY a valid JSON object:
{
  "breakdown": {"word_or_phrase": "translation and grammatical function"},
  "beginnerExplanation": "clear simple explanation without complex linguistic jargon",
  "naturalVsLiteral": {
    "natural": "natural phrasing",
    "literal": "literal rigid phrasing",
    "differenceNote": "why native speakers say it naturally"
  }
}`;

      const res = await ai.models.generateContent({
        model: this.modelName,
        contents: prompt
      });

      return {
        ...this.cleanJson(res.text),
        engine: 'gemini',
        processingSource: '✨ Gemini AI'
      };
    } catch (err) {
      console.warn('[GeminiService] explainMeaning error, falling back:', err.message);
      return null;
    }
  }

  /**
   * 3. Reply Suggestions ("Help Me Reply") via Gemini
   */
  async generateReplySuggestions({ incomingText, targetLang = 'hi' }) {
    const ai = this.client;
    if (!ai) return null;

    try {
      const prompt = `You are Hindi Assist Reply Assistant.
An incoming WhatsApp message was received: "${incomingText}".
Generate 5 diverse, natural replies in language "${targetLang}" across these tones:
1. Casual
2. Friendly
3. Polite
4. Short
5. Detailed

CRITICAL: Keep responses natural as real Indian WhatsApp users chat.
Return ONLY a valid JSON object:
{
  "suggestions": [
    { "tone": "Casual", "reply": "...", "label": "Casual / Natural" },
    { "tone": "Friendly", "reply": "...", "label": "Friendly with warmth" },
    { "tone": "Polite", "reply": "...", "label": "Polite & Respectful" },
    { "tone": "Short", "reply": "...", "label": "Short & Direct" },
    { "tone": "Detailed", "reply": "...", "label": "Detailed explanation" }
  ]
}`;

      const res = await ai.models.generateContent({
        model: this.modelName,
        contents: prompt
      });

      const parsed = this.cleanJson(res.text);
      return (parsed.suggestions || []).map(s => ({
        ...s,
        engine: 'gemini',
        processingSource: '✨ Gemini AI'
      }));
    } catch (err) {
      console.warn('[GeminiService] generateReplySuggestions error, falling back:', err.message);
      return null;
    }
  }

  /**
   * 4. Grammar Correction via Gemini
   */
  async correctGrammar({ text, language = 'en' }) {
    const ai = this.client;
    if (!ai) return null;

    try {
      const prompt = `You are Hindi Assist Grammar Tutor specializing in Indian English and Hindi errors (e.g. "Yesterday I am going", "Did you went", "I am having two brothers", "discuss about").

Sentence to review: "${text}"
Target language: ${language}

Analyze the sentence:
1. Provide the natural, corrected sentence.
2. Explain the mistake gently and supportively without shaming the user.
3. State the core grammar rule.
4. Provide a quick 4-option practice fill-in-the-blank question to reinforce learning.

Return ONLY a valid JSON object:
{
  "original": "${text}",
  "corrected": "...",
  "explanation": "...",
  "rule": "...",
  "practice": {
    "question": "fill-in-the-blank sentence with ___",
    "options": ["opt1", "opt2", "opt3", "opt4"],
    "correctAnswer": "...",
    "hint": "..."
  }
}`;

      const res = await ai.models.generateContent({
        model: this.modelName,
        contents: prompt
      });

      return {
        ...this.cleanJson(res.text),
        engine: 'gemini',
        processingSource: '✨ Gemini AI'
      };
    } catch (err) {
      console.warn('[GeminiService] correctGrammar error, falling back:', err.message);
      return null;
    }
  }

  /**
   * 5. Learning Explanation ("Explain Like I'm a Beginner") via Gemini
   */
  async explainLearningTopic({ topic, sentence, targetLang = 'hi' }) {
    const ai = this.client;
    if (!ai) return null;

    try {
      const prompt = `You are Hindi Assist language teacher. Explain the following grammatical concept or sentence like the user is a total beginner:

Topic: ${topic}
Example Sentence: "${sentence || ''}"

Use simple analogies, Indian conversational examples, and contrast English with Hindi/Telugu.
Return ONLY a valid JSON object:
{
  "title": "${topic}",
  "explanation": "concise, warm, beginner-friendly explanation",
  "examples": ["example 1", "example 2"],
  "tip": "key takeaway to remember"
}`;

      const res = await ai.models.generateContent({
        model: this.modelName,
        contents: prompt
      });

      return {
        ...this.cleanJson(res.text),
        engine: 'gemini',
        processingSource: '✨ Gemini AI'
      };
    } catch (err) {
      console.warn('[GeminiService] explainLearningTopic error:', err.message);
      return null;
    }
  }

  /**
   * 6. Conversation Practice (Roleplay turns) via Gemini
   */
  async generateConversationTurn({ scenario, dialogueHistory = [], userMessage }) {
    const ai = this.client;
    if (!ai) return null;

    try {
      const prompt = `You are a conversational partner in Hindi Assist.
Scenario: ${scenario.title} (${scenario.description})
Difficulty: ${scenario.difficulty}

Conversation History so far:
${dialogueHistory.map(m => `${m.sender}: ${m.text}`).join('\n')}

Latest User Message:
"${userMessage}"

Respond naturally in character in English (with optional Hindi touch if appropriate for the scenario). Keep the dialogue flowing like a real chat.
Also provide a supportive learning evaluation.

Return ONLY a valid JSON object:
{
  "partnerReply": "your natural response in character",
  "learningFeedback": {
    "wellDone": "what the user articulated well",
    "toImprove": "subtle improvement tip",
    "suggestedNextPhrases": ["phrase 1", "phrase 2"]
  }
}`;

      const res = await ai.models.generateContent({
        model: this.modelName,
        contents: prompt
      });

      return {
        ...this.cleanJson(res.text),
        engine: 'gemini',
        processingSource: '✨ Gemini AI'
      };
    } catch (err) {
      console.warn('[GeminiService] generateConversationTurn error:', err.message);
      return null;
    }
  }

  /**
   * 6. Dictionary Word Lookup via Gemini
   */
  async lookupDictionaryWord(word) {
    const ai = this.client;
    if (!ai) return null;

    try {
      const prompt = `You are Hindi Assist Offline Dictionary Engine.
Create a rich, verified dictionary entry for the word: "${word}".
Languages needed: English, Hindi, and Telugu.
Return ONLY a valid JSON object strictly matching this schema:
{
  "english": "${word.toLowerCase().trim()}",
  "hindi": "natural Hindi translation and devanagari equivalents",
  "telugu": "natural Telugu translation",
  "transliteration": "Roman Hindi transliteration (e.g. yaad rakhna)",
  "pronunciation": "phonetic pronunciation (e.g. ri-mem-ber)",
  "definition": "clear, concise definition of the word",
  "exampleEnglish": "natural conversational example sentence in English",
  "exampleHindi": "Hindi translation of the example sentence",
  "exampleTelugu": "Telugu translation of the example sentence",
  "category": "Daily Life",
  "tags": ["dictionary", "vocabulary"]
}`;

      const res = await ai.models.generateContent({
        model: this.modelName,
        contents: prompt
      });

      const parsed = this.cleanJson(res.text);
      return {
        ...parsed,
        source: 'gemini'
      };
    } catch (err) {
      console.warn('[GeminiService] lookupDictionaryWord error:', err.message);
      return null;
    }
  }
}

export const geminiService = new GeminiService();
