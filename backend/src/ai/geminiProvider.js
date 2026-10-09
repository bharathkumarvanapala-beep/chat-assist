/**
 * Gemini Provider for Hindi Assist
 * 
 * Implements Google GenAI SDK integration for professional, complete
 * sentence-level translation across English, Hindi, and Telugu.
 * 
 * Never hardcodes the API key. Reads process.env.GEMINI_API_KEY from backend/.env.
 * Never logs user text or messages to console or files.
 */

import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENV_PATH = path.resolve(__dirname, '../../.env');
dotenv.config({ path: ENV_PATH });

export class GeminiProvider {
  constructor() {
    this.name = 'gemini';
  }

  get modelName() {
    return process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  }

  _syncEnv() {
    try {
      if ((process.env.NODE_ENV === 'test' || process.argv.some(a => a.includes('test'))) && process.env.GEMINI_API_KEY === undefined) {
        return;
      }
      if (fs.existsSync(ENV_PATH)) {
        const envContent = fs.readFileSync(ENV_PATH, 'utf8');
        const keyMatch = envContent.match(/^[ \t]*GEMINI_API_KEY[ \t]*=[ \t]*([^\r\n]*)/m);
        if (keyMatch) {
          const fileKey = keyMatch[1].trim().replace(/^['"]|['"]$/g, '');
          if (fileKey) {
            process.env.GEMINI_API_KEY = fileKey;
          } else if (!process.env.GEMINI_API_KEY_MOCK) {
            process.env.GEMINI_API_KEY = '';
          }
        }
        const modelMatch = envContent.match(/^[ \t]*GEMINI_MODEL[ \t]*=[ \t]*([^\r\n]*)/m);
        if (modelMatch && modelMatch[1].trim()) {
          process.env.GEMINI_MODEL = modelMatch[1].trim().replace(/^['"]|['"]$/g, '');
        }
      }
    } catch {}
  }

  isAvailable() {
    this._syncEnv();
    const key = process.env.GEMINI_API_KEY?.trim();
    return Boolean(key && key.length > 5 && key !== 'your_api_key_here');
  }

  getClient() {
    this._syncEnv();
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
  }

  cleanJson(text) {
    let clean = (text || '').trim();
    if (clean.includes('```json')) {
      clean = clean.split('```json')[1].split('```')[0].trim();
    } else if (clean.includes('```')) {
      clean = clean.split('```')[1].split('```')[0].trim();
    }
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }
    return JSON.parse(clean);
  }

  /**
   * Internal helper to execute prompt against model with graceful fallback cascade
   */
  async generateContentWithFallback(prompt) {
    const ai = this.getClient();
    if (!ai) throw new Error('Gemini API key is not configured.');

    const preferred = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    const fallbackList = [
      preferred,
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-3.7-flash',
      'gemini-flash-latest'
    ];
    // Keep unique list
    const candidateModels = [...new Set(fallbackList.filter(Boolean))];

    let lastError = null;
    for (const model of candidateModels) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: prompt
        });
        return res;
      } catch (err) {
        lastError = err;
        const msg = (err.message || '').toLowerCase();
        if (
          msg.includes('not found') ||
          msg.includes('unsupported') ||
          msg.includes('404') ||
          msg.includes('not supported') ||
          msg.includes('quota') ||
          msg.includes('rate') ||
          msg.includes('resource_exhausted') ||
          msg.includes('high demand') ||
          msg.includes('unavailable') ||
          msg.includes('overloaded') ||
          err.status === 404 ||
          err.status === 429 ||
          err.status === 503 ||
          err.status === 500
        ) {
          continue;
        }
        throw err;
      }
    }
    throw lastError || new Error('Failed to generate content with available Gemini models.');
  }

  /**
   * Complete Sentence-Level Conversational Translation via Gemini
   */
  async translate({ text, sourceLanguage = 'en', targetLanguage = 'hi', tone = 'Casual', style = 'natural', context = '' }) {
    // Prompt adhering to Requirement 14
    const prompt = `You are a professional conversational translator for English, Hindi and Telugu.

Translate the COMPLETE input according to its meaning and context.

Do not translate word-by-word.

Preserve names, URLs, numbers, emojis and abbreviations unless translation is explicitly required.

For Natural mode, produce natural everyday conversational language used by native speakers.

For Literal mode, stay closer to the original structure while remaining grammatically understandable.

Do not leave ordinary source-language words untranslated unless they are proper nouns, intentionally preserved terms, URLs, abbreviations, or mixed-language expressions.

Do not explain the translation inside the translation field.

Return structured JSON.

Translation Parameters:
- Source Language: ${sourceLanguage}
- Target Language: ${targetLanguage}
- Tone: ${tone} (Options: Casual, Friendly, Neutral, Polite, Formal, Work)
- Style: ${style} (Natural vs Literal)
${context ? `- Explicit User Context: "${context}"` : ''}

CRITICAL RULES:
1. Translate the COMPLETE sentence meaning and grammatical intent according to natural conversational speech.
2. ABSOLUTELY PROHIBIT word-by-word translation. Never translate auxiliary verbs (like "do", "does", "did") as separate lexical action verbs.
   - For example: "where do you live" in Hindi MUST be translated as "तुम कहाँ रहते हो?" (Casual) or "आप कहाँ रहते हैं?" (Polite). NEVER "तुम कहाँ करते हो?".
   - "where is he looking" -> "वह कहाँ देख रहा है?"
   - "what are you doing" -> "तुम क्या कर रहे हो?"
   - "where are you going" -> "तुम कहाँ जा रहे हो?"
   - "did you eat" -> "क्या तुमने खाना खाया?"
   - "why didn't you come yesterday" -> "तुम कल क्यों नहीं आए?"
   - "what are you doing now" -> "तुम अभी क्या कर रहे हो?"
   - "where does your brother live" -> "तुम्हारा भाई कहाँ रहता है?"
3. For schedule availability, NEVER translate "free" as "स्वतंत्र" (independent). Use "फ्री" or "खाली".
4. Provide 2-3 natural alternatives in the target language.
5. Provide a token-by-token grammar mapping between source and target tokens.
6. Provide a brief nuance explanation of why this phrasing and tone fit native usage.

Input to translate:
"${text}"

Respond with ONLY valid JSON strictly matching this schema:
{
  "translation": "complete natural sentence translation",
  "alternatives": ["alternative 1", "alternative 2", "alternative 3"],
  "grammar": [
    { "source": "source_token_or_phrase", "target": "target_token_or_phrase" }
  ],
  "nuance": "clear, concise nuance and cultural usage note"
}`;

    const res = await this.generateContentWithFallback(prompt);
    const parsed = this.cleanJson(res.text);

    return {
      translation: (parsed.translation || '').trim(),
      alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives : [],
      grammar: Array.isArray(parsed.grammar) ? parsed.grammar : [],
      nuance: parsed.nuance || ''
    };
  }

  /**
   * Dynamic Reply Assistant ("Help Me Reply")
   */
  async generateReplies({ incomingText, targetLanguage = 'hi', tone = 'Casual', context = '' }) {
    const prompt = `You are Hindi Assist Reply Assistant.
An incoming message was received:
"${incomingText}"

${context ? `Context: "${context}"` : ''}
Target Language for replies: ${targetLanguage}

Generate 5 distinct, natural reply suggestions suitable for real Indian messaging (WhatsApp/SMS):
1. Casual (Everyday natural friend tone)
2. Friendly (Warm, helpful, courteous)
3. Polite (Respectful, soft, deferential)
4. Short (Quick, crisp, to the point)
5. Detailed (Thorough, providing context or explanation)

Respond with ONLY valid JSON strictly matching this schema:
{
  "suggestions": [
    { "tone": "Casual", "reply": "...", "label": "Casual / Natural" },
    { "tone": "Friendly", "reply": "...", "label": "Friendly with Warmth" },
    { "tone": "Polite", "reply": "...", "label": "Polite & Respectful" },
    { "tone": "Short", "reply": "...", "label": "Short & Direct" },
    { "tone": "Detailed", "reply": "...", "label": "Detailed Response" }
  ]
}`;

    const res = await this.generateContentWithFallback(prompt);
    const parsed = this.cleanJson(res.text);
    return Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
  }

  /**
   * Dynamic Chat Assistant
   */
  async chatAssistant({ query, dialogueHistory = [], targetLanguage = 'hi', tone = 'Casual' }) {
    const historyPrompt = dialogueHistory.length > 0
      ? dialogueHistory.slice(-6).map(m => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n')
      : 'None';

    const prompt = `You are Hindi Assist, a helpful, privacy-first conversational and language learning assistant specializing in English, Hindi, and Telugu.
You help users with:
- Translating sentences and phrases with natural Indian nuances
- Explaining grammatical rules (SOV order, the 'ne' postposition, pronouns tu/tum/aap, gender agreements)
- Correcting non-standard sentences gently
- Crafting polite rewrites for work or personal messages
- Learning vocabulary, idioms, and daily conversation patterns
- General language questions

Conversation History:
${historyPrompt}

Current User Query:
"${query}"

Preferred Language: ${targetLanguage}
Tone: ${tone}

Provide a direct, conversational, and culturally accurate response.
If the query asks to translate something, provide the COMPLETE translation, 1-2 natural alternatives, and a brief grammar breakdown.
If the query asks to correct a sentence, provide the correction and a gentle rule explanation.
Keep explanations clear, engaging, and supportive.

Respond with ONLY valid JSON strictly matching this schema:
{
  "reply": "main conversational answer for the user",
  "translation": "if query involved translating, put main translation here, else null",
  "alternatives": ["alternative 1", "alternative 2"],
  "grammarNotes": "optional grammatical or cultural insight, or null",
  "intent": "translation | grammar | correction | reply_suggestion | learning | general"
}`;

    const res = await this.generateContentWithFallback(prompt);
    const parsed = this.cleanJson(res.text);
    return {
      reply: parsed.reply || '',
      translation: parsed.translation || null,
      alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives : [],
      grammarNotes: parsed.grammarNotes || null,
      intent: parsed.intent || 'general'
    };
  }

  async explain({ text, translation, sourceLanguage = 'en', targetLanguage = 'hi' }) {
    const prompt = `You are Hindi Assist Language Tutor.
Explain this complete translation from ${sourceLanguage} to ${targetLanguage}:
Original: "${text}"
Translation: "${translation}"

Respond with ONLY valid JSON:
{
  "grammar": [
    { "source": "token/word", "target": "meaning/role" }
  ],
  "nuance": "beginner-friendly explanation of sentence structure and word choice",
  "naturalVsLiteral": {
    "natural": "natural version",
    "literal": "literal version",
    "note": "why native speakers use natural phrasing"
  }
}`;

    const res = await this.generateContentWithFallback(prompt);
    return this.cleanJson(res.text);
  }

  async correct({ text, language = 'en' }) {
    const prompt = `You are Hindi Assist Grammar Tutor.
Analyze this sentence in ${language}:
"${text}"

Provide gentle correction and explanation.
Respond with ONLY valid JSON:
{
  "original": "${text}",
  "corrected": "corrected natural sentence",
  "explanation": "gentle supportive explanation of the mistake",
  "rule": "core grammar rule to remember"
}`;

    const res = await this.generateContentWithFallback(prompt);
    return this.cleanJson(res.text);
  }
}

export const geminiProvider = new GeminiProvider();
