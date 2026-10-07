/**
 * AI Orchestrator for Hindi Assist
 * 
 * Provides an extensible multi-provider abstraction layer.
 * Coordinates between Cloud AI (Gemini) and On-device / Local processing.
 * 
 * Zero user message logging.
 * Clean, structured responses.
 */

import { geminiProvider } from './geminiProvider.js';
import { localProvider } from './localProvider.js';

export class AiOrchestrator {
  constructor() {
    this.gemini = geminiProvider;
    this.local = localProvider;
  }

  getStatus() {
    const isGeminiReady = this.gemini.isAvailable();
    return {
      activeProvider: isGeminiReady ? 'gemini' : 'local',
      geminiAvailable: isGeminiReady,
      geminiModel: this.gemini.modelName,
      fallbackAvailable: true
    };
  }

  /**
   * Helper to format grammar array into object for backward compatibility
   */
  formatGrammarMap(grammarArray) {
    if (!Array.isArray(grammarArray)) return null;
    const map = {};
    grammarArray.forEach(item => {
      if (item && item.source && item.target) {
        map[item.source] = item.target;
      }
    });
    return Object.keys(map).length > 0 ? map : null;
  }

  /**
   * Universal Dynamic Translation
   */
  async translate({
    text,
    sourceLanguage = 'en',
    targetLanguage = 'hi',
    sourceLang,
    targetLang,
    tone = 'Casual',
    style = 'natural',
    mode,
    context = '',
    contextMessage = '',
    isPrivacySensitive = false,
    userConsentCloud = true
  }) {
    // Normalize aliases
    const src = (sourceLanguage || sourceLang || 'auto').toLowerCase();
    const tgt = (targetLanguage || targetLang || 'hi').toLowerCase();
    const chosenTone = tone || 'Casual';
    const chosenStyle = (style || mode || 'natural').toLowerCase();
    const chosenContext = (context || contextMessage || '').trim();
    const cleanText = (text || '').trim();

    if (!cleanText) {
      return {
        success: true,
        translation: '',
        translatedText: '',
        alternatives: [],
        grammar: [],
        grammarBreakdown: null,
        nuance: '',
        explanation: '',
        tone: chosenTone,
        style: chosenStyle,
        sourceLanguage: src,
        targetLanguage: tgt,
        provider: 'local',
        mode: 'on-device',
        processingSource: 'On-device'
      };
    }

    // 1. If privacy sensitive (e.g. passwords/OTPs/private shield), strictly route to on-device
    if (isPrivacySensitive) {
      const localResult = await this.local.translate({
        text: cleanText,
        sourceLanguage: src,
        targetLanguage: tgt,
        tone: chosenTone,
        style: chosenStyle,
        context: chosenContext
      });

      if (!localResult || localResult.success === false) {
        return {
          success: false,
          error: localResult?.error || 'The on-device offline engine cannot confidently translate this sentence.',
          translation: '',
          translatedText: '',
          alternatives: [],
          grammar: [],
          grammarBreakdown: null,
          nuance: '',
          explanation: '',
          tone: chosenTone,
          style: chosenStyle,
          sourceLanguage: src,
          targetLanguage: tgt,
          provider: 'local',
          mode: 'on-device',
          processingSource: 'On-device'
        };
      }

      return {
        success: true,
        translation: localResult.translation,
        translatedText: localResult.translation,
        alternatives: localResult.alternatives || [],
        grammar: localResult.grammar || [],
        grammarBreakdown: this.formatGrammarMap(localResult.grammar),
        nuance: localResult.nuance || '',
        explanation: localResult.nuance || '',
        tone: chosenTone,
        style: chosenStyle,
        sourceLanguage: src,
        targetLanguage: tgt,
        provider: 'local',
        mode: 'on-device',
        processingSource: 'On-device'
      };
    }

    let wasFallback = false;

    // 2. If Gemini is available and allowed, use Cloud AI
    if (this.gemini.isAvailable() && userConsentCloud !== false) {
      try {
        const geminiResult = await this.gemini.translate({
          text: cleanText,
          sourceLanguage: src,
          targetLanguage: tgt,
          tone: chosenTone,
          style: chosenStyle,
          context: chosenContext
        });

        if (geminiResult && geminiResult.translation) {
          return {
            success: true,
            translation: geminiResult.translation,
            translatedText: geminiResult.translation,
            alternatives: geminiResult.alternatives || [],
            grammar: geminiResult.grammar || [],
            grammarBreakdown: this.formatGrammarMap(geminiResult.grammar),
            nuance: geminiResult.nuance || '',
            explanation: geminiResult.nuance || '',
            tone: chosenTone,
            style: chosenStyle,
            sourceLanguage: src,
            targetLanguage: tgt,
            provider: 'gemini',
            mode: 'cloud',
            processingSource: 'Cloud AI'
          };
        }
      } catch (err) {
        wasFallback = true;
        // Log non-sensitive notice without leaking user text or API key
        console.warn('[AiOrchestrator] Gemini translation failed, engaging local engine fallback.');
      }
    }

    // 3. Fallback or Standard Local On-device Provider
    const localResult = await this.local.translate({
      text: cleanText,
      sourceLanguage: src,
      targetLanguage: tgt,
      tone: chosenTone,
      style: chosenStyle,
      context: chosenContext
    });

    if (!localResult || localResult.success === false) {
      return {
        success: false,
        error: localResult?.error || 'The on-device offline engine cannot confidently translate this sentence. Please configure GEMINI_API_KEY in backend/.env to enable Cloud AI translation.',
        translation: '',
        translatedText: '',
        alternatives: [],
        grammar: [],
        grammarBreakdown: null,
        nuance: '',
        explanation: '',
        tone: chosenTone,
        style: chosenStyle,
        sourceLanguage: src,
        targetLanguage: tgt,
        provider: 'local',
        mode: wasFallback ? 'fallback' : 'on-device',
        processingSource: 'On-device'
      };
    }

    return {
      success: true,
      translation: localResult.translation,
      translatedText: localResult.translation,
      alternatives: localResult.alternatives || [],
      grammar: localResult.grammar || [],
      grammarBreakdown: this.formatGrammarMap(localResult.grammar),
      nuance: localResult.nuance || '',
      explanation: localResult.nuance || '',
      tone: chosenTone,
      style: chosenStyle,
      sourceLanguage: src,
      targetLanguage: tgt,
      provider: 'local',
      mode: wasFallback ? 'fallback' : 'on-device',
      processingSource: 'On-device'
    };
  }

  /**
   * Reply Assistant ("Help Me Reply")
   */
  async generateReplies({ incomingText, targetLanguage = 'hi', tone = 'Casual', context = '' }) {
    if (this.gemini.isAvailable()) {
      try {
        const suggestions = await this.gemini.generateReplies({
          incomingText,
          targetLanguage,
          tone,
          context
        });
        if (suggestions && suggestions.length > 0) {
          return {
            provider: 'gemini',
            mode: 'cloud',
            suggestions
          };
        }
      } catch (err) {
        console.warn('[AiOrchestrator] Gemini replies failed, falling back to local.');
      }
    }

    const suggestions = await this.local.generateReplies({
      incomingText,
      targetLanguage,
      tone,
      context
    });

    return {
      provider: 'local',
      mode: 'on-device',
      suggestions
    };
  }

  /**
   * Dynamic Chat Assistant (handles arbitrary user questions)
   */
  async chatAssistant({ query, dialogueHistory = [], targetLanguage = 'hi', tone = 'Casual' }) {
    if (this.gemini.isAvailable()) {
      try {
        const result = await this.gemini.chatAssistant({
          query,
          dialogueHistory,
          targetLanguage,
          tone
        });
        if (result && result.reply) {
          return {
            success: true,
            provider: 'gemini',
            mode: 'cloud',
            processingSource: '✨ Gemini AI',
            ...result
          };
        }
      } catch (err) {
        console.warn('[AiOrchestrator] Gemini chat failed, falling back to local.');
      }
    }

    const localResult = await this.local.chatAssistant({
      query,
      dialogueHistory,
      targetLanguage,
      tone
    });

    return {
      success: true,
      provider: 'local',
      mode: 'on-device',
      processingSource: '📱 On-device Assistant',
      ...localResult
    };
  }

  /**
   * Meaning Explanation
   */
  async explain({ text, translation, sourceLanguage = 'en', targetLanguage = 'hi' }) {
    if (this.gemini.isAvailable()) {
      try {
        const result = await this.gemini.explain({ text, translation, sourceLanguage, targetLanguage });
        if (result) return { provider: 'gemini', ...result };
      } catch {}
    }
    const localResult = await this.local.explain({ text, translation, sourceLanguage, targetLanguage });
    return { provider: 'local', ...localResult };
  }

  /**
   * Grammar Correction
   */
  async correct({ text, language = 'en' }) {
    if (this.gemini.isAvailable()) {
      try {
        const result = await this.gemini.correct({ text, language });
        if (result) return { provider: 'gemini', ...result };
      } catch {}
    }
    const localResult = await this.local.correct({ text, language });
    return { provider: 'local', ...localResult };
  }
}

export const aiOrchestrator = new AiOrchestrator();
