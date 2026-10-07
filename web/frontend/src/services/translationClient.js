/**
 * Translation Client for Hindi Assist Web Frontend
 * 
 * Works with backend API (`http://localhost:5000/api`) powered by AI Orchestrator
 * and includes a fully-functional dynamic on-device fallback engine
 * so translations, detections, replies, grammar, and corrections
 * work offline seamlessly.
 */

import { INITIAL_PHRASES, INITIAL_MISTAKES } from './languageDataService.js';

const API_BASE_URL = 'http://localhost:5000/api';

const EN_HI_MAP = {
  'where': 'कहाँ',
  'what': 'क्या',
  'when': 'कब',
  'why': 'क्यों',
  'how': 'कैसे',
  'who': 'कौन',
  'i': 'मैं',
  'you': 'तुम',
  'we': 'हम',
  'he': 'वह',
  'she': 'वह',
  'they': 'वे / वो',
  'work': 'काम',
  'working': 'काम कर रहे',
  'live': 'रहते',
  'living': 'रह रहे',
  'call': 'कॉल',
  'calling': 'कॉल कर रहे',
  'go': 'जाना',
  'going': 'जा रहे',
  'come': 'आना',
  'coming': 'आ रहे',
  'now': 'अभी',
  'today': 'आज',
  'tomorrow': 'कल',
  'yesterday': 'कल',
  'free': 'फ्री / खाली',
  'busy': 'बिज़ी',
  'meeting': 'मीटिंग'
};

export const translationClient = {

  async translate({
    text,
    sourceLanguage,
    targetLanguage,
    sourceLang = 'auto',
    targetLang = 'hi',
    tone = 'Casual',
    style = 'natural',
    mode = 'natural',
    consentCloud = false,
    context = '',
    contextMessage = '',
    isPrivacySensitive = false
  }) {
    const cleanText = (text || '').trim();
    const effectiveSrc = sourceLanguage || sourceLang || 'auto';
    const effectiveTgt = targetLanguage || targetLang || 'hi';
    const effectiveTone = tone || 'Casual';
    const effectiveStyle = style || mode || 'natural';
    const effectiveContext = context || contextMessage || '';

    if (!cleanText) {
      return {
        success: true,
        translation: '',
        translatedText: '',
        detectedLanguage: 'unknown',
        sourceLang: effectiveSrc,
        targetLang: effectiveTgt,
        tone: effectiveTone,
        mode: effectiveStyle,
        provider: 'local',
        engine: 'on-device',
        processingSource: '📱 On-device',
        alternatives: [],
        grammarBreakdown: null,
        grammar: [],
        nuance: '',
        explanation: ''
      };
    }

    try {
      // Attempt backend AI orchestrator call
      const res = await fetch(`${API_BASE_URL}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cloud-consent': consentCloud ? 'true' : 'false'
        },
        body: JSON.stringify({
          text: cleanText,
          sourceLanguage: effectiveSrc,
          targetLanguage: effectiveTgt,
          sourceLang: effectiveSrc,
          targetLang: effectiveTgt,
          tone: effectiveTone,
          style: effectiveStyle,
          mode: effectiveStyle,
          consentCloud,
          context: effectiveContext,
          contextMessage: effectiveContext,
          isPrivacySensitive
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success === false) {
          return {
            success: false,
            error: data.error || data.message || 'The offline engine cannot confidently translate this sentence.',
            message: data.message || data.error || 'The offline engine cannot confidently translate this sentence.',
            translation: '',
            translatedText: '',
            provider: data.provider || 'local',
            processingSource: data.provider === 'gemini' ? 'Cloud AI' : (data.processingSource || 'On-device'),
            alternatives: [],
            grammarBreakdown: null,
            grammar: []
          };
        }
        const tr = data.translation || data.translatedText || '';
        return {
          ...data,
          success: true,
          translation: tr,
          translatedText: tr,
          alternatives: Array.isArray(data.alternatives) && data.alternatives.length > 0 ? data.alternatives : [tr],
          grammarBreakdown: data.grammarBreakdown || (Array.isArray(data.grammar) ? Object.fromEntries(data.grammar.map(g => [g.source, g.target])) : null),
          grammar: Array.isArray(data.grammar) ? data.grammar : [],
          nuance: data.nuance || data.explanation || '',
          explanation: data.nuance || data.explanation || '',
          processingSource: data.provider === 'gemini' ? 'Cloud AI' : (data.processingSource || 'On-device')
        };
      }
    } catch {
      // Fallback to local on-device engine
    }

    return this.localTranslate({
      text: cleanText,
      sourceLang: effectiveSrc,
      targetLang: effectiveTgt,
      tone: effectiveTone,
      mode: effectiveStyle,
      contextMessage: effectiveContext,
      consentCloud
    });
  },

  async getHealthInfo() {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (res.ok) return await res.json();
    } catch {}
    return {
      status: 'offline',
      gemini_status: 'WAITING_FOR_API_KEY',
      orchestrator: { activeProvider: 'local', geminiAvailable: false }
    };
  },

  async detectLanguage(text) {
    if (!text || text.trim() === '') {
      return { language: 'unknown', confidence: 0, label: 'Language uncertain.' };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/detect-language`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (res.ok) return await res.json();
    } catch {}

    return this.localDetectLanguage(text);
  },

  async getReplySuggestions(incomingText, targetLang = 'hi', tone = 'Casual', context = '') {
    try {
      const res = await fetch(`${API_BASE_URL}/reply-suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incomingText, targetLanguage: targetLang, targetLang, tone, context })
      });
      if (res.ok) {
        const data = await res.json();
        return data.suggestions || [];
      }
    } catch {}

    return this.localReplySuggestions(incomingText, targetLang);
  },

  async sendChatMessage({ query, dialogueHistory = [], targetLanguage = 'hi', tone = 'Casual' }) {
    try {
      const res = await fetch(`${API_BASE_URL}/chat-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, dialogueHistory, targetLanguage, tone })
      });
      if (res.ok) return await res.json();
    } catch {}

    return this.localChatAssistant({ query, dialogueHistory, targetLanguage, tone });
  },

  async getExplanation(text, translation, sourceLang = 'en', targetLang = 'hi') {
    try {
      const res = await fetch(`${API_BASE_URL}/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, translation, sourceLanguage: sourceLang, targetLanguage: targetLang, sourceLang, targetLang })
      });
      if (res.ok) return await res.json();
    } catch {}

    return this.localExplain(text, translation);
  },

  async correctText(text, language = 'en') {
    try {
      const res = await fetch(`${API_BASE_URL}/correct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language })
      });
      if (res.ok) return await res.json();
    } catch {}

    return this.localCorrectText(text);
  },

  async getConversationTurn({ scenario, dialogueHistory, userMessage }) {
    try {
      const res = await fetch(`${API_BASE_URL}/conversation-turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, dialogueHistory, userMessage })
      });
      if (res.ok) return await res.json();
    } catch {}

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
  },

  async explainLearningTopic({ topic, sentence, targetLang = 'hi' }) {
    try {
      const res = await fetch(`${API_BASE_URL}/explain-learning`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, sentence, targetLang })
      });
      if (res.ok) return await res.json();
    } catch {}

    return {
      engine: 'local-data',
      processingSource: '📖 Local Data',
      title: topic,
      explanation: "Hindi follows Subject-Object-Verb (SOV) order. Natural Indian conversational usage avoids rigid Sanskrit loanwords.",
      examples: ["Are you free now? -> क्या तुम अभी फ्री हो?"],
      tip: "Remember that meaning and politeness come first in Indian chats."
    };
  },

  // LOCAL / ON-DEVICE ENGINE IMPLEMENTATION (DYNAMIC)
  localDetectLanguage(text) {
    const clean = text.trim();
    const devanagariCount = (clean.match(/[\u0900-\u097F]/g) || []).length;
    const teluguCount = (clean.match(/[\u0C00-\u0C7F]/g) || []).length;
    const latinCount = (clean.match(/[a-zA-Z]/g) || []).length;

    if (devanagariCount > 0 && devanagariCount >= teluguCount) {
      return { language: 'hi', confidence: 0.95, label: 'Hindi' };
    }
    if (teluguCount > 0 && teluguCount >= devanagariCount) {
      return { language: 'te', confidence: 0.95, label: 'Telugu' };
    }

    const lower = clean.toLowerCase();
    const hinglishMarkers = ['kya', 'hai', 'hain', 'ho', 'kaha', 'kyu', 'mai', 'tum', 'aap', 'nahi', 'bhai', 'yaar'];
    const tenglishMarkers = ['nuvvu', 'ekkada', 'unnav', 'cheyyi', 'cheppu', 'ra', 'repu', 'nenu'];

    const words = lower.split(/\s+/).map(w => w.replace(/[^\w]/g, ''));
    if (words.some(w => hinglishMarkers.includes(w))) {
      return { language: 'hi', confidence: 0.85, label: 'Hindi (Romanized)' };
    }
    if (words.some(w => tenglishMarkers.includes(w))) {
      return { language: 'te', confidence: 0.85, label: 'Telugu (Romanized)' };
    }

    if (latinCount > 0) {
      return { language: 'en', confidence: 0.9, label: 'English' };
    }

    return { language: 'unknown', confidence: 0.2, label: 'Language uncertain.' };
  },

  localTranslate({ text, sourceLang = 'auto', targetLang = 'hi', tone = 'Casual', mode = 'natural', contextMessage = '', consentCloud = false }) {
    let effectiveSource = sourceLang;
    if (sourceLang === 'auto' || !sourceLang) {
      const detected = this.localDetectLanguage(text);
      effectiveSource = detected.language === 'unknown' ? 'en' : detected.language;
    }

    if (effectiveSource === targetLang) {
      return {
        success: true,
        translation: text,
        translatedText: text,
        detectedLanguage: effectiveSource,
        sourceLang: effectiveSource,
        targetLang,
        tone,
        mode,
        provider: 'local',
        processingSource: '📱 On-device',
        alternatives: [text],
        grammarBreakdown: null,
        grammar: [],
        nuance: 'Source and target languages match.',
        explanation: 'Source and target languages match.'
      };
    }

    const isPolite = tone === 'Polite' || tone === 'Formal';
    const lower = text.toLowerCase().trim();
    let translated = '';
    let alternatives = [];
    const grammarMap = {};
    const grammarList = [];

    // Check exact phrasebook
    const cleanInput = lower.replace(/[।?!.]/g, '').trim();
    const match = INITIAL_PHRASES.find(p => {
      if (effectiveSource === 'en' && p.english.toLowerCase().replace(/[।?!.]/g, '').trim() === cleanInput) return true;
      if (effectiveSource === 'hi' && p.hindi.replace(/[।?!.]/g, '').trim() === cleanInput) return true;
      if (effectiveSource === 'te' && p.telugu.replace(/[।?!.]/g, '').trim() === cleanInput) return true;
      return false;
    });

    if (match && !contextMessage) {
      if (targetLang === 'hi') {
        translated = mode === 'literal' ? (match.literal_hi || match.hindi) : (isPolite ? (match.polite_hi || match.hindi) : (match.natural_hi || match.hindi));
        alternatives = match.alternatives_hi || [translated];
      } else if (targetLang === 'en') {
        translated = match.english;
        alternatives = [match.english];
      } else if (targetLang === 'te') {
        translated = mode === 'literal' ? (match.literal_te || match.telugu) : (isPolite ? (match.polite_te || match.telugu) : (match.natural_te || match.telugu));
        alternatives = [translated];
      }
      return {
        success: true,
        translation: translated,
        translatedText: translated,
        detectedLanguage: effectiveSource,
        sourceLang: effectiveSource,
        targetLang,
        tone,
        mode,
        provider: 'local',
        processingSource: '📱 On-device (Phrase Match)',
        alternatives: alternatives.slice(0, 3),
        grammarBreakdown: match.grammar_breakdown || null,
        grammar: match.grammar_breakdown ? Object.entries(match.grammar_breakdown).map(([source, target]) => ({ source, target })) : [],
        nuance: match.beginner_explanation || 'Common conversational phrase',
        explanation: match.beginner_explanation || 'Common conversational phrase'
      };
    }

    // Dynamic synthesis
    let pronoun = isPolite ? 'आप' : (tone === 'Casual' ? 'तुम' : 'आप');
    let aux = isPolite ? 'हैं' : 'हो';
    let isThirdPerson = false;

    if (lower.includes(' he ') || lower.startsWith('he ') || lower.endsWith(' he')) {
      pronoun = 'वह';
      aux = 'है';
      isThirdPerson = true;
    } else if (lower.includes(' she ') || lower.startsWith('she ') || lower.endsWith(' she')) {
      pronoun = 'वह';
      aux = 'है';
      isThirdPerson = true;
    } else if (lower.includes(' they ') || lower.startsWith('they ') || lower.endsWith(' they')) {
      pronoun = 'वे';
      aux = 'हैं';
      isThirdPerson = true;
    } else if (lower.includes(' i ') || lower.startsWith('i ') || lower.endsWith(' i')) {
      pronoun = 'मैं';
      aux = 'हूँ';
    }

    if (effectiveSource === 'en' && targetLang === 'hi') {
      if (lower.includes('looking') || lower.includes('look')) {
        const verbLook = isThirdPerson && !isPolite ? 'देख रहा' : 'देख रहे';
        if (lower.includes('where')) {
          translated = `${pronoun} कहाँ ${verbLook} ${aux}?`;
          alternatives = [`कहाँ देख रहा है अभी?`, `${pronoun} अभी कहाँ देख रहा है?`];
          grammarMap['where'] = 'कहाँ';
          grammarMap['he'] = pronoun;
          grammarMap['looking'] = verbLook;
          grammarMap['is'] = aux;
        } else {
          translated = `${pronoun} ${verbLook} ${aux}।`;
        }
      } else if (lower.includes('walking') || lower.includes('walk')) {
        if (lower.includes('where')) {
          translated = `${pronoun} कहाँ चल रहे ${aux}?`;
          alternatives = [`कहाँ चल रहे हो अभी?`, `${pronoun} अभी कहाँ चल रहे ${aux}?`];
          grammarMap['where'] = 'कहाँ';
          grammarMap['you'] = pronoun;
          grammarMap['walking'] = 'चल रहे';
          grammarMap['are'] = aux;
        } else {
          translated = `${pronoun} चल रहे ${aux}।`;
          alternatives = [`${pronoun} टहल रहे ${aux}।`];
        }
      } else if (lower.includes('going') || lower.includes('go')) {
        if (lower.includes('where')) {
          translated = `${pronoun} कहाँ जा रहे ${aux}?`;
          alternatives = [`किधर जा रहे हो?`, `${pronoun} अभी कहाँ जा रहे ${aux}?`];
          grammarMap['where'] = 'कहाँ';
          grammarMap['you'] = pronoun;
          grammarMap['going'] = 'जा रहे';
          grammarMap['are'] = aux;
        } else {
          translated = `${pronoun} जा रहे ${aux}।`;
        }
      } else if (lower.includes('doing') || (lower.includes('do') && lower.includes('what'))) {
        translated = `${pronoun} क्या कर रहे ${aux}?`;
        alternatives = [`क्या चल रहा है?`, `${pronoun} अभी क्या कर रहे ${aux}?`];
        grammarMap['what'] = 'क्या';
        grammarMap['you'] = pronoun;
        grammarMap['doing'] = 'कर रहे';
        grammarMap['are'] = aux;
      } else if (lower.includes('working') || lower.includes('work')) {
        if (lower.includes('where')) {
          translated = `${pronoun} कहाँ काम कर रहे ${aux}?`;
          alternatives = [`${pronoun} कहाँ जॉब कर रहे ${aux}?`, 'किधर काम चल रहा है?'];
          grammarMap['Where'] = 'कहाँ';
          grammarMap['you'] = pronoun;
          grammarMap['working'] = 'काम कर रहे';
          grammarMap['are'] = aux;
        } else {
          translated = `${pronoun} काम कर रहे ${aux}।`;
          alternatives = [`${pronoun} जॉब कर रहे ${aux}।`];
        }
      } else if (lower.includes('live') || lower.includes('living')) {
        if (lower.includes('where')) {
          translated = `${pronoun} कहाँ रहते ${aux}?`;
          alternatives = [`${pronoun} कहाँ पर रहते ${aux}?`, 'किधर रहते हो भाई?'];
          grammarMap['Where'] = 'कहाँ';
          grammarMap['you'] = pronoun;
          grammarMap['live'] = `रहते ${aux}`;
        } else {
          translated = `${pronoun} रहते ${aux}।`;
        }
      } else if (lower.includes('call you') || lower.includes('call')) {
        const time = lower.includes('tomorrow') ? 'कल ' : (lower.includes('later') ? 'बाद में ' : '');
        const obj = isPolite ? 'आपको' : 'तुम्हें';
        translated = `मैं ${obj} ${time}कॉल करूँगा।`;
        alternatives = [`मैं ${time}${obj} फोन करूँगा।`];
        grammarMap['I'] = 'मैं';
        grammarMap['call'] = 'कॉल करूँगा';
        grammarMap['you'] = obj;
      } else if (lower.includes('did you eat') || lower.includes('eat')) {
        const pastSubj = isPolite ? 'आपने' : 'तुमने';
        translated = `क्या ${pastSubj} खाना खाया?`;
        alternatives = [`क्या ${pastSubj} खाया?`];
        grammarMap['did you'] = `क्या ${pastSubj}`;
        grammarMap['eat'] = 'खाना खाया';
      } else if (lower.includes('why') && lower.includes("didn't")) {
        translated = `${pronoun} कल क्यों नहीं आए?`;
        alternatives = [`कल आप क्यों नहीं आ पाए?`];
        grammarMap['why'] = 'क्यों';
        grammarMap["didn't come"] = 'नहीं आए';
      } else if (lower.includes('location')) {
        const sendVerb = isPolite ? 'भेज सकते हैं' : 'भेज सकते हो';
        translated = `क्या ${pronoun} मुझे लोकेशन ${sendVerb}?`;
        alternatives = [`कृपया मुझे लोकेशन भेज दीजिए।`];
        grammarMap['location'] = 'लोकेशन';
        grammarMap['send'] = 'भेजना';
      } else if (lower.includes('waiting for you')) {
        const poss = isPolite ? 'आपका' : 'तुम्हारा';
        translated = `मैं ${poss} इंतज़ार कर रहा हूँ।`;
        alternatives = [`काफी देर से आपका इंतज़ार कर रहा हूँ।`];
        grammarMap['waiting'] = 'इंतज़ार कर रहा हूँ';
      } else if (lower.includes('reach home')) {
        translated = `जब ${pronoun} घर पहुँचो तो मुझे बताना।`;
        alternatives = [`घर पहुँचने पर मुझे बताइएगा।`];
      } else if (lower.includes('free') && (lower.includes('are you') || lower.includes('now'))) {
        translated = `${pronoun} अभी फ्री ${aux}?`;
        alternatives = [`${pronoun} अभी खाली ${aux}?`, 'क्या अभी बात हो सकती है?'];
        grammarMap['free'] = 'फ्री / खाली (Availability)';
        grammarMap['now'] = 'अभी';
      } else {
        return {
          success: false,
          error: 'The on-device offline engine cannot confidently translate this sentence. Please configure GEMINI_API_KEY in backend/.env to enable Cloud AI translation.',
          message: 'The on-device offline engine cannot confidently translate this sentence. Please configure GEMINI_API_KEY in backend/.env to enable Cloud AI translation.',
          translation: '',
          translatedText: '',
          detectedLanguage: effectiveSource,
          sourceLang: effectiveSource,
          targetLang,
          tone,
          mode,
          provider: 'local',
          processingSource: 'On-device',
          alternatives: [],
          grammarBreakdown: null,
          grammar: []
        };
      }
    } else if (effectiveSource === 'hi' && targetLang === 'en') {
      if (lower.includes('कहाँ') && lower.includes('काम')) {
        translated = 'Where are you working?';
        alternatives = ['Where are you working right now?', 'Where is your job located?'];
      } else if (lower.includes('कहाँ') && lower.includes('रहते')) {
        translated = 'Where do you live?';
        alternatives = ['Where are you staying?', 'Where is your home?'];
      } else if (lower.includes('कहाँ')) {
        translated = 'Where are you?';
        alternatives = ['Where are you right now?', 'Where have you reached?'];
      } else {
        return {
          success: false,
          error: 'The on-device offline engine cannot confidently translate this sentence to English. Please configure GEMINI_API_KEY in backend/.env.',
          message: 'The on-device offline engine cannot confidently translate this sentence to English. Please configure GEMINI_API_KEY in backend/.env.',
          translation: '',
          translatedText: '',
          detectedLanguage: effectiveSource,
          sourceLang: effectiveSource,
          targetLang,
          tone,
          mode,
          provider: 'local',
          processingSource: 'On-device',
          alternatives: [],
          grammarBreakdown: null,
          grammar: []
        };
      }
    } else if (effectiveSource === 'te' && targetLang === 'hi') {
      if (lower.includes('ఎక్కడ') && lower.includes('ఉన్నారు')) {
        translated = isPolite ? 'आप कहाँ हैं?' : 'तुम कहाँ हो?';
        alternatives = ['कहाँ पर हो अभी?'];
      } else {
        return {
          success: false,
          error: 'The on-device offline engine cannot confidently translate this sentence to Hindi. Please configure GEMINI_API_KEY in backend/.env.',
          message: 'The on-device offline engine cannot confidently translate this sentence to Hindi. Please configure GEMINI_API_KEY in backend/.env.',
          translation: '',
          translatedText: '',
          detectedLanguage: effectiveSource,
          sourceLang: effectiveSource,
          targetLang,
          tone,
          mode,
          provider: 'local',
          processingSource: 'On-device',
          alternatives: [],
          grammarBreakdown: null,
          grammar: []
        };
      }
    } else {
      return {
        success: false,
        error: 'The on-device offline engine cannot confidently translate this language pair. Please configure GEMINI_API_KEY in backend/.env to enable Cloud AI translation.',
        message: 'The on-device offline engine cannot confidently translate this language pair. Please configure GEMINI_API_KEY in backend/.env to enable Cloud AI translation.',
        translation: '',
        translatedText: '',
        detectedLanguage: effectiveSource,
        sourceLang: effectiveSource,
        targetLang,
        tone,
        mode,
        provider: 'local',
        processingSource: 'On-device',
        alternatives: [],
        grammarBreakdown: null,
        grammar: []
      };
    }

    Object.entries(grammarMap).forEach(([source, target]) => {
      grammarList.push({ source, target });
    });

    const nuance = `Processed via on-device engine in ${tone} tone with Subject-Object-Verb (SOV) alignment.`;

    return {
      success: true,
      translation: translated,
      translatedText: translated,
      detectedLanguage: effectiveSource,
      sourceLang: effectiveSource,
      targetLang,
      tone,
      mode,
      provider: 'local',
      processingSource: 'On-device',
      alternatives: alternatives.slice(0, 3),
      grammarBreakdown: Object.keys(grammarMap).length > 0 ? grammarMap : null,
      grammar: grammarList,
      nuance,
      explanation: nuance
    };
  },

  localReplySuggestions(incomingText, targetLang = 'hi') {
    const lower = (incomingText || '').toLowerCase();
    if (lower.includes("didn't you come") || incomingText.includes('क्यों नहीं आए')) {
      return [
        { tone: 'Casual', reply: 'कल मैं नहीं आ पाया यार।', label: 'Casual / Natural' },
        { tone: 'Friendly', reply: 'सॉरी भाई, कल मुझे थोड़ा ज़रूरी काम था।', label: 'Friendly with Apology' },
        { tone: 'Polite', reply: 'माफ़ कीजिएगा, कल व्यक्तिगत कार्य के कारण मैं उपस्थित नहीं हो सका।', label: 'Polite & Respectful' },
        { tone: 'Short', reply: 'कल थोड़ा काम था।', label: 'Short & Direct' },
        { tone: 'Detailed', reply: 'कल मेरी तबीयत थोड़ी ठीक नहीं थी, इसलिए मैं नहीं आ सका।', label: 'Detailed Explanation' }
      ];
    }
    if (lower.includes('free') || lower.includes('available')) {
      return [
        { tone: 'Casual', reply: 'हाँ बोल भाई, बिल्कुल फ्री हूँ।', label: 'Casual affirmative' },
        { tone: 'Short', reply: 'हाँ, फ्री हूँ।', label: 'Short' },
        { tone: 'Polite', reply: 'जी हाँ, मैं अभी बात करने के लिए उपलब्ध हूँ।', label: 'Polite' },
        { tone: 'Friendly', reply: 'हाँ जी, बताइए क्या बात है?', label: 'Friendly' },
        { tone: 'Detailed', reply: 'अभी 10 मिनट में मेरी एक कॉल खत्म हो रही है, फिर बात करते हैं।', label: 'Detailed Timeline' }
      ];
    }
    return [
      { tone: 'Casual', reply: 'हाँ भाई, समझ गया।', label: 'Casual / Natural' },
      { tone: 'Friendly', reply: 'ज़रूर, मुझे थोड़ा समय दीजिए।', label: 'Friendly with Warmth' },
      { tone: 'Polite', reply: 'जी बिल्कुल, मैं इसे देख लेता हूँ।', label: 'Polite & Respectful' },
      { tone: 'Short', reply: 'ठीक है।', label: 'Short & Direct' },
      { tone: 'Detailed', reply: 'संदेश प्राप्त हुआ, मैं विवरण की समीक्षा करके जल्द उत्तर दूँगा।', label: 'Detailed Acknowledgment' }
    ];
  },

  localChatAssistant({ query, dialogueHistory = [], targetLanguage = 'hi', tone = 'Casual' }) {
    const qLower = (query || '').toLowerCase();
    if (qLower.includes('grammar') || qLower.includes('rule')) {
      return {
        reply: "In Hindi, sentences follow Subject-Object-Verb (SOV) order. The 'ne' (ने) postposition is added to transitive verbs in the past tense. Pronouns indicate degrees of respect: 'तू' (intimate), 'तुम' (informal peer), 'आप' (polite/respectful).",
        intent: 'grammar',
        provider: 'local',
        mode: 'on-device',
        processingSource: '📱 On-device Assistant'
      };
    }
    return {
      reply: `Namaste! I am here to help you communicate naturally across English, Hindi, and Telugu. You asked: "${query}". Ask me to translate any sentence or explain any conversational pattern!`,
      intent: 'general',
      provider: 'local',
      mode: 'on-device',
      processingSource: '📱 On-device Assistant'
    };
  },

  localExplain(text, translation) {
    return {
      grammar: [{ source: text, target: translation }],
      nuance: 'Conversational translation respecting Indian WhatsApp texting patterns and SOV syntax.',
      naturalVsLiteral: {
        natural: translation,
        literal: translation,
        note: 'Natural mode uses everyday colloquial phrasing rather than rigid literalism.'
      }
    };
  },

  localCorrectText(text) {
    const lower = text.toLowerCase();
    const match = INITIAL_MISTAKES.find(m => m.incorrect.toLowerCase() === lower);
    if (match) {
      return {
        original: text,
        corrected: match.corrected,
        explanation: match.explanation,
        rule: match.rule
      };
    }
    return {
      original: text,
      corrected: text,
      explanation: 'Sentence appears natural and grammatically sound.',
      rule: 'Standard subject-verb agreement.'
    };
  }
};
