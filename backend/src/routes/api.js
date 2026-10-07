import express from 'express';
import { aiOrchestrator } from '../ai/aiOrchestrator.js';
import { detectLanguage } from '../services/languageDetector.js';
import { explainLearningTopic, generateConversationTurn } from '../services/translationService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../../language-data');

function safeReadJson(filename, key) {
  try {
    const raw = fs.readFileSync(path.join(DATA_DIR, filename), 'utf8');
    const parsed = JSON.parse(raw);
    return key ? (parsed[key] || []) : parsed;
  } catch {
    return [];
  }
}

/**
 * GET /api/health
 * Public health check and engine routing status
 */
router.get('/health', (req, res) => {
  const orchestratorStatus = aiOrchestrator.getStatus();
  const isGeminiReady = orchestratorStatus.geminiAvailable;

  res.json({
    status: 'ok',
    service: 'Hindi Assist Translation & Learning API',
    version: '1.2.0',
    orchestrator: orchestratorStatus,
    engine_routing: {
      simple_translation: 'On-device',
      vocabulary_lookup: 'Local data',
      common_phrase: 'Local data',
      meaning_explanation: isGeminiReady ? 'Gemini (Active)' : 'Gemini (Fallback to Local Data)',
      contextual_translation: isGeminiReady ? 'Gemini (Active)' : 'Gemini (Fallback to On-device)',
      reply_suggestions: isGeminiReady ? 'Gemini (Active)' : 'Gemini (Fallback to Local Data)',
      grammar_correction: isGeminiReady ? 'Gemini (Active)' : 'Gemini (Fallback to Local Data)',
      learning_explanation: isGeminiReady ? 'Gemini (Active)' : 'Gemini (Fallback to Local Data)',
      conversation_practice: isGeminiReady ? 'Gemini (Active)' : 'Gemini (Fallback to Local Data)',
      privacy_sensitive_translation: 'On-device'
    },
    gemini_status: isGeminiReady ? 'ACTIVE' : 'WAITING_FOR_API_KEY',
    gemini_model: orchestratorStatus.geminiModel,
    privacy_policy: {
      zero_log_active: true,
      on_device_default: true,
      user_data_retention: 'None (Stateless)'
    },
    supported_languages: ['en', 'hi', 'te'],
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/translate
 * Translates input text dynamically via AI Orchestrator
 */
router.post('/translate', async (req, res) => {
  try {
    const {
      text,
      sourceLanguage,
      targetLanguage,
      sourceLang,
      targetLang,
      tone = 'Casual',
      style = 'natural',
      mode,
      consentCloud = false,
      context = '',
      contextMessage = '',
      isPrivacySensitive = false
    } = req.body;

    if (typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        message: 'Please provide valid text to translate.'
      });
    }

    if (!text.trim()) {
      return res.json({
        success: true,
        translation: '',
        translatedText: '',
        alternatives: [],
        grammar: [],
        grammarBreakdown: null,
        nuance: '',
        explanation: '',
        tone,
        style: style || mode || 'natural',
        sourceLanguage: sourceLanguage || sourceLang || 'auto',
        targetLanguage: targetLanguage || targetLang || 'hi',
        provider: 'local',
        mode: 'on-device',
        processingSource: 'On-device'
      });
    }

    const hasCloudConsent = consentCloud === true || req.headers['x-cloud-consent'] === 'true' || (consentCloud === undefined && req.headers['x-cloud-consent'] !== 'false');

    // Auto-detect language if needed
    let effectiveSrc = (sourceLanguage || sourceLang || 'auto').toLowerCase();
    if (effectiveSrc === 'auto') {
      const detected = detectLanguage(text);
      effectiveSrc = detected.language === 'unknown' ? 'en' : detected.language;
    }

    const effectiveTgt = (targetLanguage || targetLang || 'hi').toLowerCase();
    const effectiveTone = tone || 'Casual';
    const effectiveStyle = (style || mode || 'natural').toLowerCase();
    const effectiveContext = (context || contextMessage || '').trim();

    const result = await aiOrchestrator.translate({
      text: text.trim(),
      sourceLanguage: effectiveSrc,
      targetLanguage: effectiveTgt,
      tone: effectiveTone,
      style: effectiveStyle,
      context: effectiveContext,
      isPrivacySensitive,
      userConsentCloud: hasCloudConsent
    });

    if (result.success === false) {
      return res.json({
        success: false,
        error: result.error || 'The offline engine cannot confidently translate this sentence.',
        message: result.error || 'The offline engine cannot confidently translate this sentence.',
        translation: '',
        translatedText: '',
        alternatives: [],
        grammar: [],
        grammarBreakdown: null,
        nuance: '',
        explanation: '',
        tone: effectiveTone,
        style: effectiveStyle,
        mode: result.mode,
        sourceLanguage: effectiveSrc,
        targetLanguage: effectiveTgt,
        provider: result.provider || 'local',
        processingSource: result.processingSource || 'On-device'
      });
    }

    res.json({
      success: true,
      translation: result.translation,
      translatedText: result.translation, // backward-compat
      alternatives: result.alternatives || [],
      grammar: result.grammar || [],
      grammarBreakdown: result.grammarBreakdown || null, // backward-compat
      nuance: result.nuance || '',
      explanation: result.nuance || '', // backward-compat
      tone: effectiveTone,
      style: effectiveStyle,
      mode: result.mode,
      sourceLanguage: effectiveSrc,
      targetLanguage: effectiveTgt,
      provider: result.provider,
      processingSource: result.processingSource
    });
  } catch (error) {
    // Return friendly non-technical error without exposing stack traces or API keys
    res.status(500).json({
      success: false,
      error: 'Translation processing error',
      message: 'Unable to complete translation synthesis at this time. Please try again.'
    });
  }
});

/**
 * POST /api/detect-language
 */
router.post('/detect-language', (req, res) => {
  const { text } = req.body;
  const detection = detectLanguage(text);
  res.json(detection);
});

/**
 * POST /api/reply-suggestions
 * Meaning & Reply Assistant ("Help Me Reply")
 */
router.post('/reply-suggestions', async (req, res) => {
  try {
    const { incomingText, targetLanguage, targetLang = 'hi', tone = 'Casual', context = '' } = req.body;
    const tgt = (targetLanguage || targetLang || 'hi').toLowerCase();

    if (!incomingText || typeof incomingText !== 'string') {
      return res.status(400).json({ error: 'incomingText is required' });
    }

    const result = await aiOrchestrator.generateReplies({
      incomingText: incomingText.trim(),
      targetLanguage: tgt,
      tone,
      context
    });

    res.json({
      success: true,
      incomingText,
      targetLanguage: tgt,
      provider: result.provider,
      mode: result.mode,
      suggestions: result.suggestions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Reply generation error',
      message: 'Unable to generate reply suggestions. Please try again.'
    });
  }
});

/**
 * POST /api/chat-assistant
 * Conversational and multilingual assistant for arbitrary user queries
 */
router.post('/chat-assistant', async (req, res) => {
  try {
    const { query, dialogueHistory = [], targetLanguage = 'hi', targetLang, tone = 'Casual' } = req.body;
    const tgt = (targetLanguage || targetLang || 'hi').toLowerCase();

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'query is required' });
    }

    const result = await aiOrchestrator.chatAssistant({
      query: query.trim(),
      dialogueHistory,
      targetLanguage: tgt,
      tone
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Chat assistant error',
      message: 'Unable to process your question right now. Please try again.'
    });
  }
});

/**
 * POST /api/explain
 * Meaning explanation / "Why this translation?"
 */
router.post('/explain', async (req, res) => {
  try {
    const { text, translation, sourceLanguage, targetLanguage, sourceLang = 'en', targetLang = 'hi' } = req.body;
    const src = (sourceLanguage || sourceLang || 'en').toLowerCase();
    const tgt = (targetLanguage || targetLang || 'hi').toLowerCase();

    const result = await aiOrchestrator.explain({ text, translation, sourceLanguage: src, targetLanguage: tgt });
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Explanation error', message: 'Unable to explain translation at this moment.' });
  }
});

/**
 * POST /api/correct
 * Grammar correction
 */
router.post('/correct', async (req, res) => {
  try {
    const { text, language = 'en' } = req.body;
    const result = await aiOrchestrator.correct({ text, language });
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Correction error', message: 'Unable to correct text at this moment.' });
  }
});

/**
 * POST /api/explain-learning
 */
router.post('/explain-learning', async (req, res) => {
  const { topic, sentence, targetLang = 'hi' } = req.body;
  const explanation = await explainLearningTopic({ topic, sentence, targetLang });
  res.json(explanation);
});

/**
 * POST /api/conversation-turn
 */
router.post('/conversation-turn', async (req, res) => {
  const { scenario, dialogueHistory, userMessage } = req.body;
  const turn = await generateConversationTurn({ scenario, dialogueHistory, userMessage });
  res.json(turn);
});

/**
 * Structured Language Resource Endpoints (Local Data)
 */
router.get('/vocabulary', (req, res) => {
  const data = safeReadJson('vocabulary.json', 'vocabulary');
  res.json({ engine: 'local-data', count: data.length, data });
});

router.get('/phrases', (req, res) => {
  const data = safeReadJson('phrases.json', 'phrases');
  res.json({ engine: 'local-data', count: data.length, data });
});

router.get('/patterns', (req, res) => {
  const data = safeReadJson('patterns.json', 'sentence_patterns');
  res.json({ engine: 'local-data', count: data.length, data });
});

router.get('/mistakes', (req, res) => {
  const data = safeReadJson('mistakes.json', 'mistakes');
  res.json({ engine: 'local-data', count: data.length, data });
});

router.get('/roleplays', (req, res) => {
  const data = safeReadJson('roleplays.json', 'roleplays');
  res.json({ engine: 'local-data', count: data.length, data });
});

export default router;
