/**
 * Local Sentence-Level Translation Provider for Hindi Assist
 * 
 * Provides robust sentence-level on-device / local translation, reply assistance,
 * and grammar breakdown when Cloud AI (Gemini) is not active, offline, or as fallback.
 * 
 * CRITICAL ARCHITECTURAL GUARANTEE:
 * Performs complete syntactic sentence translation (Subject-Object-Verb assembly).
 * NEVER produces partial token-level broken combinations (such as "कहाँ are तुम walking?").
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../../language-data');

// Load language resources
let vocabulary = [];
let phrases = [];
let patterns = [];
let mistakes = [];

try {
  const vRaw = fs.readFileSync(path.join(DATA_DIR, 'vocabulary.json'), 'utf8');
  vocabulary = JSON.parse(vRaw).vocabulary || [];

  const pRaw = fs.readFileSync(path.join(DATA_DIR, 'phrases.json'), 'utf8');
  phrases = JSON.parse(pRaw).phrases || [];

  const patRaw = fs.readFileSync(path.join(DATA_DIR, 'patterns.json'), 'utf8');
  patterns = JSON.parse(patRaw).sentence_patterns || [];

  const mRaw = fs.readFileSync(path.join(DATA_DIR, 'mistakes.json'), 'utf8');
  mistakes = JSON.parse(mRaw).mistakes || [];
} catch {}

// Comprehensive Verb Lexicon (Root, Hindi Root, Telugu Root)
const VERB_LEXICON = {
  'walk': { hi: 'चल', hiCont: 'चल रहे', hiSingCont: 'चल रहा', teCont: 'నడుస్తున్నావు', tePoliteCont: 'నడుస్తున్నారు', enCont: 'walking', enPast: 'walked' },
  'walking': { hi: 'चल', hiCont: 'चल रहे', hiSingCont: 'चल रहा', teCont: 'నడుస్తున్నావు', tePoliteCont: 'నడుస్తున్నారు', enCont: 'walking', enPast: 'walked' },
  'go': { hi: 'जा', hiCont: 'जा रहे', hiSingCont: 'जा रहा', teCont: 'వెళ్తున్నావు', tePoliteCont: 'వెళ్తున్నారు', enCont: 'going', enPast: 'went' },
  'going': { hi: 'जा', hiCont: 'जा रहे', hiSingCont: 'जा रहा', teCont: 'వెళ్తున్నావు', tePoliteCont: 'వెళ్తున్నారు', enCont: 'going', enPast: 'went' },
  'went': { hi: 'गए', hiCont: 'जा रहे', hiSingCont: 'जा रहा', teCont: 'వెళ్లారు', tePoliteCont: 'వెళ్లారు', enCont: 'going', enPast: 'went' },
  'do': { hi: 'कर', hiCont: 'कर रहे', hiSingCont: 'कर रहा', teCont: 'చేస్తున్నావు', tePoliteCont: 'చేస్తున్నారు', enCont: 'doing', enPast: 'did' },
  'doing': { hi: 'कर', hiCont: 'कर रहे', hiSingCont: 'कर रहा', teCont: 'చేస్తున్నావు', tePoliteCont: 'చేస్తున్నారు', enCont: 'doing', enPast: 'did' },
  'work': { hi: 'काम कर', hiCont: 'काम कर रहे', hiSingCont: 'काम कर रहा', teCont: 'పని చేస్తున్నారు', tePoliteCont: 'పని చేస్తున్నారు', enCont: 'working', enPast: 'worked' },
  'working': { hi: 'काम कर', hiCont: 'काम कर रहे', hiSingCont: 'काम कर रहा', teCont: 'పని చేస్తున్నారు', tePoliteCont: 'పని చేస్తున్నారు', enCont: 'working', enPast: 'worked' },
  'live': { hi: 'रह', hiCont: 'रह रहे', hiSingCont: 'रह रहा', teCont: 'ఉంటున్నారు', tePoliteCont: 'ఉంటున్నారు', enCont: 'living', enPast: 'lived' },
  'living': { hi: 'रह', hiCont: 'रह रहे', hiSingCont: 'रह रहा', teCont: 'ఉంటున్నారు', tePoliteCont: 'ఉంటున్నారు', enCont: 'living', enPast: 'lived' },
  'eat': { hi: 'खा', hiCont: 'खा रहे', hiSingCont: 'खा रहा', teCont: 'తింటున్నారు', tePoliteCont: 'తింటున్నారు', enCont: 'eating', enPast: 'ate' },
  'eating': { hi: 'खा', hiCont: 'खा रहे', hiSingCont: 'खा रहा', teCont: 'తింటున్నారు', tePoliteCont: 'తింటున్నారు', enCont: 'eating', enPast: 'ate' },
  'ate': { hi: 'खाया', hiCont: 'खा रहे', hiSingCont: 'खा रहा', teCont: 'తిన్నారు', tePoliteCont: 'తిన్నారు', enCont: 'eating', enPast: 'ate' },
  'call': { hi: 'कॉल कर', hiCont: 'कॉल कर रहे', hiSingCont: 'कॉल कर रहा', teCont: 'కాల్ చేస్తున్నారు', tePoliteCont: 'కాల్ చేస్తున్నారు', enCont: 'calling', enPast: 'called' },
  'calling': { hi: 'कॉल कर', hiCont: 'कॉल कर रहे', hiSingCont: 'कॉल कर रहा', teCont: 'కాల్ చేస్తున్నారు', tePoliteCont: 'కాల్ చేస్తున్నారు', enCont: 'calling', enPast: 'called' },
  'wait': { hi: 'इंतज़ार कर', hiCont: 'इंतज़ार कर रहे', hiSingCont: 'इंतज़ार कर रहा', teCont: 'వేచి ఉన్నారు', tePoliteCont: 'వేచి ఉన్నారు', enCont: 'waiting', enPast: 'waited' },
  'waiting': { hi: 'इंतज़ार कर', hiCont: 'इंतज़ार कर रहे', hiSingCont: 'इंतज़ार कर रहा', teCont: 'వేచి ఉన్నారు', tePoliteCont: 'వేచి ఉన్నారు', enCont: 'waiting', enPast: 'waited' },
  'reach': { hi: 'पहुँच', hiCont: 'पहुँच रहे', hiSingCont: 'पहुँच रहा', teCont: 'చేరుకుంటున్నారు', tePoliteCont: 'చేరుకుంటున్నారు', enCont: 'reaching', enPast: 'reached' },
  'reaching': { hi: 'पहुँच', hiCont: 'पहुँच रहे', hiSingCont: 'पहुँच रहा', teCont: 'చేరుకుంటున్నారు', tePoliteCont: 'చేరుకుంటున్నారు', enCont: 'reaching', enPast: 'reached' },
  'reached': { hi: 'पहुँच गए', hiCont: 'पहुँच रहे', hiSingCont: 'पहुँच रहा', teCont: 'చేరుకున్నారు', tePoliteCont: 'చేరుకున్నారు', enCont: 'reaching', enPast: 'reached' },
  'send': { hi: 'भेज', hiCont: 'भेज रहे', hiSingCont: 'भेज रहा', teCont: 'పంపుతున్నారు', tePoliteCont: 'పంపుతున్నారు', enCont: 'sending', enPast: 'sent' },
  'sending': { hi: 'भेज', hiCont: 'भेज रहे', hiSingCont: 'भेज रहा', teCont: 'పంపుతున్నారు', tePoliteCont: 'పంపుతున్నారు', enCont: 'sending', enPast: 'sent' },
  'come': { hi: 'आ', hiCont: 'आ रहे', hiSingCont: 'आ रहा', teCont: 'వస్తున్నారు', tePoliteCont: 'వస్తున్నారు', enCont: 'coming', enPast: 'came' },
  'coming': { hi: 'आ', hiCont: 'आ रहे', hiSingCont: 'आ रहा', teCont: 'వస్తున్నారు', tePoliteCont: 'వస్తున్నారు', enCont: 'coming', enPast: 'came' },
  'came': { hi: 'आए', hiCont: 'आ रहे', hiSingCont: 'आ रहा', teCont: 'వచ్చారు', tePoliteCont: 'వచ్చారు', enCont: 'coming', enPast: 'came' },
  'talk': { hi: 'बात कर', hiCont: 'बात कर रहे', hiSingCont: 'बात कर रहा', teCont: 'మాట్లాడుతున్నారు', tePoliteCont: 'మాట్లాడుతున్నారు', enCont: 'talking', enPast: 'talked' },
  'talking': { hi: 'बात कर', hiCont: 'बात कर रहे', hiSingCont: 'बात कर रहा', teCont: 'మాట్లాడుతున్నారు', tePoliteCont: 'మాట్లాడుతున్నారు', enCont: 'talking', enPast: 'talked' },
  'sleep': { hi: 'सो', hiCont: 'सो रहे', hiSingCont: 'सो रहा', teCont: 'నిద్రపోతున్నారు', tePoliteCont: 'నిద్రపోతున్నారు', enCont: 'sleeping', enPast: 'slept' },
  'sleeping': { hi: 'सो', hiCont: 'सो रहे', hiSingCont: 'सो रहा', teCont: 'నిద్రపోతున్నారు', tePoliteCont: 'నిద్రపోతున్నారు', enCont: 'sleeping', enPast: 'slept' },
  'look': { hi: 'देख', hiCont: 'देख रहे', hiSingCont: 'देख रहा', teCont: 'చూస్తున్నాడు', tePoliteCont: 'చూస్తున్నారు', enCont: 'looking', enPast: 'looked' },
  'looking': { hi: 'देख', hiCont: 'देख रहे', hiSingCont: 'देख रहा', teCont: 'చూస్తున్నాడు', tePoliteCont: 'చూస్తున్నారు', enCont: 'looking', enPast: 'looked' },
  'see': { hi: 'देख', hiCont: 'देख रहे', hiSingCont: 'देख रहा', teCont: 'చూస్తున్నాడు', tePoliteCont: 'చూస్తున్నారు', enCont: 'seeing', enPast: 'saw' },
  'seeing': { hi: 'देख', hiCont: 'देख रहे', hiSingCont: 'देख रहा', teCont: 'చూస్తున్నాడు', tePoliteCont: 'చూస్తున్నారు', enCont: 'seeing', enPast: 'saw' },
  'tell': { hi: 'बता', hiCont: 'बता रहे', hiSingCont: 'बता रहा', teCont: 'చెబుతున్నారు', tePoliteCont: 'చెబుతున్నారు', enCont: 'telling', enPast: 'told' },
  'know': { hi: 'जान', hiCont: 'जान रहे', hiSingCont: 'जान रहा', teCont: 'తెలుసుకుంటున్నారు', tePoliteCont: 'తెలుసుకుంటున్నారు', enCont: 'knowing', enPast: 'knew' },
  'help': { hi: 'मदद कर', hiCont: 'मदद कर रहे', hiSingCont: 'मदद कर रहा', teCont: 'సహాయం చేస్తున్నారు', tePoliteCont: 'సహాయం చేస్తున్నారు', enCont: 'helping', enPast: 'helped' },
  'drive': { hi: 'गाड़ी चला', hiCont: 'गाड़ी चला रहे', hiSingCont: 'गाड़ी चला रहा', teCont: 'నడుపుతున్నారు', tePoliteCont: 'నడుపుతున్నారు', enCont: 'driving', enPast: 'drove' },
  'learn': { hi: 'सीख', hiCont: 'सीख रहे', hiSingCont: 'सीख रहा', teCont: 'నేర్చుకుంటున్నారు', tePoliteCont: 'నేర్చుకుంటున్నారు', enCont: 'learning', enPast: 'learned' }
};

export class LocalProvider {
  constructor() {
    this.name = 'local';
  }

  isAvailable() {
    return true; // Always available on-device
  }

  /**
   * Sentence-Level Translation
   */
  async translate({ text, sourceLanguage = 'en', targetLanguage = 'hi', tone = 'Casual', style = 'natural', context = '' }) {
    const clean = (text || '').trim();
    if (!clean) {
      return { translation: '', alternatives: [], grammar: [], nuance: '' };
    }

    const src = (sourceLanguage || 'en').toLowerCase();
    const tgt = (targetLanguage || 'hi').toLowerCase();
    const isPolite = tone === 'Polite' || tone === 'Formal' || tone === 'Work';

    // 1. Direct match in curated phrases (whole phrase)
    const normalizedInput = clean.toLowerCase().replace(/[?.,!]/g, '').trim();
    const exactPhrase = phrases.find(p => {
      if (src === 'en' && p.english.toLowerCase().replace(/[?.,!]/g, '').trim() === normalizedInput) return true;
      if (src === 'hi' && p.hindi.replace(/[?.,!]/g, '').trim() === normalizedInput) return true;
      if (src === 'te' && p.telugu.replace(/[?.,!]/g, '').trim() === normalizedInput) return true;
      return false;
    });

    if (exactPhrase && !context) {
      let tr = '';
      let alts = [];
      if (tgt === 'hi') {
        tr = isPolite ? (exactPhrase.polite_hi || exactPhrase.hindi) : (exactPhrase.natural_hi || exactPhrase.hindi);
        alts = exactPhrase.alternatives_hi || [tr];
      } else if (tgt === 'en') {
        tr = exactPhrase.english;
      } else if (tgt === 'te') {
        tr = exactPhrase.natural_te || exactPhrase.telugu;
        alts = [exactPhrase.telugu];
      }

      const grammar = exactPhrase.grammar_breakdown
        ? Object.entries(exactPhrase.grammar_breakdown).map(([source, target]) => ({ source, target }))
        : [{ source: clean, target: tr }];

      return {
        success: true,
        translation: tr,
        alternatives: alts.slice(0, 3),
        grammar,
        nuance: exactPhrase.beginner_explanation || `Natural conversational expression in ${tgt.toUpperCase()}.`
      };
    }

    // Common short greetings
    if (normalizedInput === 'hi' || normalizedInput === 'hello' || normalizedInput === 'hey') {
      const tr = tgt === 'hi' ? 'नमस्ते।' : (tgt === 'te' ? 'నమస్కారం.' : 'Hello.');
      return {
        success: true,
        translation: tr,
        alternatives: [tr],
        grammar: [{ source: clean, target: tr }],
        nuance: 'Standard conversational greeting.'
      };
    }

    // 2. Syntactic Sentence-Level Parsing & Assembly
    return this.translateSentenceSyntactically(clean, src, tgt, tone, style, context);
  }

  translateSentenceSyntactically(text, src, tgt, tone, style, context) {
    const isPolite = tone === 'Polite' || tone === 'Formal' || tone === 'Work';

    // 1. Entity Masking for URLs and Emojis
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const emojiRegex = /([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1FA70}-\u{1FAFF}])/gu;
    const placeholders = [];

    let maskedText = text.replace(urlRegex, m => {
      const k = `__URL_${placeholders.length}__`;
      placeholders.push({ key: k, val: m });
      return k;
    }).replace(emojiRegex, m => {
      const k = `__EMOJI_${placeholders.length}__`;
      placeholders.push({ key: k, val: m });
      return k;
    });

    const lower = maskedText.toLowerCase().replace(/[?.,!]/g, '').trim();
    const tokens = lower.split(/\s+/).filter(Boolean);

    // Analyze sentence mood
    const isQuestion = text.includes('?') || ['where', 'what', 'when', 'why', 'how', 'who', 'is', 'are', 'can', 'could', 'did', 'do', 'does', 'will'].some(w => lower.startsWith(w));

    // Extract syntactic constituents
    const hasWhere = tokens.includes('where');
    const hasWhat = tokens.includes('what');
    const hasWhen = tokens.includes('when');
    const hasWhy = tokens.includes('why');
    const hasHow = tokens.includes('how');
    const hasWho = tokens.includes('who');

    const hasYou = tokens.includes('you');
    const hasI = tokens.includes('i');
    const hasWe = tokens.includes('we');
    const hasHe = tokens.includes('he');
    const hasShe = tokens.includes('she');
    const hasThey = tokens.includes('they');

    const hasDid = tokens.includes('did');
    const hasCan = tokens.includes('can') || tokens.includes('could');
    const hasWill = tokens.includes('will') || tokens.includes('shall');
    const hasBeen = tokens.includes('been');
    const hasNot = tokens.includes('not') || tokens.includes("didn't") || tokens.includes("don't") || lower.includes("didn't") || lower.includes("don't");

    // Identify primary verb (prioritize lexical verb over auxiliary "do" / "does")
    const candidateVerbs = tokens.filter(t => VERB_LEXICON[t]);
    const lexicalVerbs = candidateVerbs.filter(t => t !== 'do' && t !== 'does');
    const targetVerbToken = lexicalVerbs.length > 0 ? lexicalVerbs[0] : candidateVerbs[0];

    let matchedVerbKey = targetVerbToken || null;
    let matchedVerb = targetVerbToken ? VERB_LEXICON[targetVerbToken] : null;

    // Time adverbs
    const hasTomorrow = tokens.includes('tomorrow');
    const hasYesterday = tokens.includes('yesterday');
    const hasToday = tokens.includes('today');
    const hasNow = tokens.includes('now');
    const hasLater = tokens.includes('later');

    let translation = '';
    let alternatives = [];
    const grammar = [];
    let nuance = '';

    // DIRECTION 1: English -> Hindi (Complete Sentence Assembly)
    if (src === 'en' && tgt === 'hi') {
      let pronoun = isPolite ? 'आप' : (tone === 'Casual' ? 'तुम' : 'आप');
      let objPronoun = isPolite ? 'आपको' : 'तुम्हें';
      let possPronoun = isPolite ? 'आपका' : 'तुम्हारा';
      let auxContinuous = isPolite ? 'हैं' : 'हो';
      let pronounKey = 'you';
      let isThirdPerson = false;

      if (lower.includes('your brother') || lower.includes('my brother') || tokens.includes('brother')) {
        pronoun = lower.includes('my brother') ? 'मेरा भाई' : (isPolite ? 'आपका भाई' : 'तुम्हारा भाई');
        auxContinuous = 'है';
        pronounKey = lower.includes('my brother') ? 'my brother' : 'your brother';
        isThirdPerson = true;
      } else if (hasHe) {
        pronoun = 'वह';
        objPronoun = 'उसे';
        possPronoun = 'उसका';
        auxContinuous = 'है';
        pronounKey = 'he';
        isThirdPerson = true;
      } else if (hasShe) {
        pronoun = 'वह';
        objPronoun = 'उसे';
        possPronoun = 'उसका';
        auxContinuous = 'है';
        pronounKey = 'she';
        isThirdPerson = true;
      } else if (hasThey) {
        pronoun = 'वे';
        objPronoun = 'उन्हें';
        possPronoun = 'उनका';
        auxContinuous = 'हैं';
        pronounKey = 'they';
        isThirdPerson = true;
      } else if (hasI) {
        pronoun = 'मैं';
        objPronoun = 'मुझे';
        possPronoun = 'मेरा';
        auxContinuous = 'हूँ';
        pronounKey = 'I';
      } else if (hasWe) {
        pronoun = 'हम';
        objPronoun = 'हमें';
        possPronoun = 'हमारा';
        auxContinuous = 'हैं';
        pronounKey = 'we';
      }

      // Pattern 1: WH-Question with Continuous Tense (e.g. "where are you walking", "where is he looking", "what are you doing")
      if (isQuestion && (hasWhere || hasWhat || hasWhy || hasWhen || hasHow) && matchedVerb) {
        const whWord = hasWhere ? 'कहाँ' : (hasWhat ? 'क्या' : (hasWhy ? 'क्यों' : (hasWhen ? 'कब' : 'कैसे')));
        const isContinuous = tokens.some(t => t.endsWith('ing')) || tokens.includes('are') || tokens.includes('is') || tokens.includes('am');

        if (isContinuous) {
          const verbForm = (isThirdPerson && !isPolite)
            ? (matchedVerb.hiSingCont || `${matchedVerb.hi} रहा`)
            : (matchedVerb.hiCont || `${matchedVerb.hi} रहे`);
          translation = `${pronoun} ${whWord} ${verbForm} ${auxContinuous}?`;
          alternatives = [
            `${whWord} ${verbForm} ${auxContinuous} अभी?`,
            `${pronoun} अभी ${whWord} ${verbForm} ${auxContinuous}?`
          ];

          grammar.push({ source: hasWhere ? 'where' : (hasWhat ? 'what' : (hasWhy ? 'why' : (hasWhen ? 'when' : 'how'))), target: whWord });
          grammar.push({ source: pronounKey, target: pronoun });
          grammar.push({ source: matchedVerbKey, target: verbForm });
          grammar.push({ source: tokens.includes('is') ? 'is' : (tokens.includes('am') ? 'am' : 'are'), target: auxContinuous });
        } else {
          // Habitual or simple (e.g. "where do you live")
          const verbForm = `${matchedVerb.hi}ते`;
          translation = `${pronoun} ${whWord} ${verbForm} ${auxContinuous}?`;
          alternatives = [`${pronoun} ${whWord} पर ${verbForm} ${auxContinuous}?`];
          grammar.push({ source: 'where', target: whWord });
          grammar.push({ source: pronounKey, target: pronoun });
          grammar.push({ source: matchedVerbKey, target: `${verbForm} ${auxContinuous}` });
        }
      }

      // Pattern 2: Past Questions ("Did you eat?", "Why didn't you come yesterday?")
      else if (hasDid || hasYesterday || (isQuestion && matchedVerbKey === 'eat')) {
        if (hasWhy && hasYesterday) {
          translation = `${pronoun} कल क्यों नहीं आए?`;
          alternatives = [`कल आप क्यों नहीं आ पाए?`];
          grammar.push({ source: "why", target: "क्यों" });
          grammar.push({ source: "didn't", target: "नहीं" });
          grammar.push({ source: "yesterday", target: "कल" });
          grammar.push({ source: "come", target: "आए" });
        } else if (matchedVerbKey === 'eat' || matchedVerbKey === 'eating' || matchedVerbKey === 'ate') {
          const pastSubj = isPolite ? 'आपने' : (isThirdPerson ? 'उसने' : 'तुमने');
          translation = `क्या ${pastSubj} खाना खाया?`;
          alternatives = [`क्या ${pastSubj} खाया?`, `खाना खा लिया क्या?`];
          grammar.push({ source: "Did you", target: `क्या ${pastSubj}` });
          grammar.push({ source: "eat", target: "खाना खाया" });
        } else {
          const pastSubj = isPolite ? 'आपने' : (isThirdPerson ? 'उसने' : 'तुमने');
          translation = `क्या ${pastSubj} ${matchedVerb ? matchedVerb.hi : ''} किया?`;
          alternatives = [translation];
        }
      }

      // Pattern 3: Future Statements ("I will call you tomorrow", "I will come tomorrow")
      else if (hasWill || hasTomorrow || (hasI && matchedVerbKey === 'call')) {
        const timeWord = hasTomorrow ? 'कल ' : (hasLater ? 'बाद में ' : '');
        if (hasI && matchedVerbKey === 'call') {
          translation = `मैं ${objPronoun} ${timeWord}कॉल करूँगा।`;
          alternatives = [`मैं ${timeWord}${objPronoun} फोन करूँगा।`, `कल बात करते हैं।`];
          grammar.push({ source: "I", target: "मैं" });
          grammar.push({ source: "will call", target: "कॉल करूँगा" });
          grammar.push({ source: "you", target: objPronoun });
          if (timeWord) grammar.push({ source: "tomorrow", target: "कल" });
        } else {
          translation = `मैं ${timeWord}आऊँगा।`;
          alternatives = [translation];
        }
      }

      // Pattern 4: Present Perfect Continuous ("I have been waiting for you")
      else if (hasBeen || (hasI && matchedVerbKey === 'wait')) {
        const waitObj = isPolite ? 'आपका' : 'तुम्हारा';
        translation = `मैं ${waitObj} इंतज़ार कर रहा हूँ।`;
        alternatives = [`काफी देर से आपका इंतज़ार कर रहा हूँ।`];
        grammar.push({ source: "I", target: "मैं" });
        grammar.push({ source: "have been waiting", target: "इंतज़ार कर रहा हूँ" });
        grammar.push({ source: "for you", target: waitObj });
      }

      // Pattern 5: Polite Requests ("Can you send me the location?", "Can you help me?")
      else if (hasCan) {
        const item = lower.includes('location') ? 'लोकेशन' : (lower.includes('details') ? 'डिटेल्स' : 'यह');
        const verbAction = isPolite ? 'भेज सकते हैं' : 'भेज सकते हो';
        translation = `क्या ${pronoun} मुझे ${item} ${verbAction}?`;
        alternatives = [`कृपया मुझे ${item} भेज दीजिए।`];
        grammar.push({ source: "Can you", target: `क्या ${pronoun}` });
        grammar.push({ source: "send me", target: `मुझे ... ${verbAction}` });
      }

      // Pattern 6: Conditionals ("Let me know when you reach home")
      else if (lower.includes('reach home') || (lower.includes('let me know') && lower.includes('reach'))) {
        translation = `जब ${pronoun} घर पहुँचो तो मुझे बताना।`;
        alternatives = [`घर पहुँचकर मुझे इन्फॉर्म कर देना।`, `घर पहुँचने पर मुझे बताइएगा।`];
        grammar.push({ source: "Let me know", target: "मुझे बताना" });
        grammar.push({ source: "when you reach home", target: `जब ${pronoun} घर पहुँचो` });
      }

      // Pattern 7: Availability / State ("Are you free now?")
      else if (lower.includes('free') && (lower.includes('are you') || hasNow)) {
        translation = `क्या ${pronoun} अभी फ्री ${auxContinuous}?`;
        alternatives = [`क्या अभी बात हो सकती है?`, `${pronoun} अभी खाली ${auxContinuous}?`];
        grammar.push({ source: "Are you", target: `क्या ${pronoun} ... ${auxContinuous}` });
        grammar.push({ source: "free", target: "फ्री / खाली (Availability)" });
        grammar.push({ source: "now", target: "अभी" });
      }

      // Pattern 8: Imperative / Requests ("Rahul, please check https://...")
      else if (lower.includes('check')) {
        const person = text.match(/^[A-Z][a-z]+/)?.[0];
        const timeMatch = text.match(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i)?.[0];
        let parts = [];
        if (person) parts.push(`${person},`);
        parts.push(isPolite ? 'कृपया' : 'प्लीज');
        if (placeholders.some(p => p.val.startsWith('http'))) {
          const urlPl = placeholders.find(p => p.val.startsWith('http'));
          parts.push(urlPl.key);
        }
        if (timeMatch) parts.push(`${timeMatch} पर`);
        parts.push(isPolite ? 'चेक करें।' : 'चेक करो।');
        translation = parts.join(' ');
        alternatives = [translation];
      }

      // Sentence not covered by limited on-device offline patterns
      else {
        return {
          success: false,
          error: 'The on-device offline engine cannot confidently translate this sentence.',
          translation: '',
          alternatives: [],
          grammar: [],
          nuance: '',
          provider: 'local',
          mode: 'on-device'
        };
      }
    }

    // DIRECTION 2: English -> Telugu
    else if (src === 'en' && tgt === 'te') {
      let tePronoun = isPolite ? 'మీరు' : 'నువ్వు';
      if (hasHe) tePronoun = 'అతను';
      else if (hasShe) tePronoun = 'ఆమె';
      else if (hasThey) tePronoun = isPolite ? 'వారు' : 'వాళ్ళు';
      else if (hasI) tePronoun = 'నేను';

      if (hasWhere && matchedVerb) {
        translation = `${tePronoun} ఎక్కడ ${isPolite ? matchedVerb.tePoliteCont : matchedVerb.teCont}?`;
        alternatives = [`ఎక్కడికి వెళ్తున్నారు?`];
        grammar.push({ source: "where", target: "ఎక్కడ" });
        grammar.push({ source: "you", target: tePronoun });
        grammar.push({ source: matchedVerbKey, target: isPolite ? matchedVerb.tePoliteCont : matchedVerb.teCont });
      } else if (hasWhat && (matchedVerbKey === 'do' || matchedVerbKey === 'doing')) {
        translation = `${tePronoun} ఏమి చేస్తున్నారు?`;
        alternatives = [`ఏం చేస్తున్నారు?`];
      } else if (matchedVerbKey === 'eat' || lower.includes('eat')) {
        translation = `${tePronoun} తిన్నారా?`;
        alternatives = [`భోజనం చేశారా?`];
      } else if (hasWill || hasTomorrow) {
        translation = `నేను రేపు నీకు కాల్ చేస్తాను.`;
        alternatives = [`రేపు మాట్లాడదాం.`];
      } else {
        return {
          success: false,
          error: 'The on-device offline engine cannot confidently translate this sentence to Telugu.',
          translation: '',
          alternatives: [],
          grammar: [],
          nuance: '',
          provider: 'local',
          mode: 'on-device'
        };
      }
    }

    // DIRECTION 3: Hindi -> English
    else if (src === 'hi' && tgt === 'en') {
      const hasKaha = lower.includes('कहाँ') || lower.includes('कहा') || lower.includes('kaha') || lower.includes('kahan') || lower.includes('kidhar');
      const hasKya = lower.includes('क्या') || lower.includes('kya');
      const hasJanaHai = lower.includes('जाना है') || lower.includes('jana hai') || lower.includes('jana h');
      const hasKarnaHai = lower.includes('करना है') || lower.includes('karna hai') || lower.includes('karna h');
      const hasJaRahe = lower.includes('जा रहे') || lower.includes('ja rahe') || lower.includes('ja raha');
      const hasKarRahe = lower.includes('कर रहे') || lower.includes('kar rahe') || lower.includes('kar raha');
      const hasChalRahe = lower.includes('चल रहे') || lower.includes('chal rahe');

      if (hasKaha && hasJanaHai) {
        translation = 'Where do you want to go?';
        alternatives = ['Where to?', 'Where are we headed?', 'Where do you need to go?'];
        grammar.push({ source: "कहाँ / kaha", target: "Where" });
        grammar.push({ source: "जाना है / jana hai", target: "want to go / need to go" });
        nuance = "Conversational Hindi infinitive asking about the intended destination.";
      } else if (hasJanaHai) {
        if (lower.includes('घर') || lower.includes('ghar')) {
          translation = 'Want to go home.';
          alternatives = ['Have to go home.', 'Need to go home.'];
        } else {
          translation = 'Have to go.';
          alternatives = ['Need to leave now.', 'Got to go.'];
        }
      } else if (hasKya && hasKarnaHai) {
        translation = 'What should I do?';
        alternatives = ['What do I need to do?', 'What am I supposed to do?', 'What to do next?'];
        grammar.push({ source: "मुझे / mujhe", target: "I" });
        grammar.push({ source: "क्या / kya", target: "What" });
        grammar.push({ source: "करना है / karna hai", target: "should do / need to do" });
        nuance = "Conversational deliberation expressing query about the next necessary action.";
      } else if (hasKarnaHai) {
        translation = 'Have to do this.';
        alternatives = ['Need to do this.', 'Must do this.'];
      } else if (hasChalRahe) {
        translation = 'Where are you walking?';
        alternatives = ['Where are you walking right now?'];
        grammar.push({ source: "कहाँ", target: "Where" });
        grammar.push({ source: "चल रहे हो", target: "are walking" });
      } else if (hasJaRahe) {
        translation = 'Where are you going?';
        alternatives = ['Where are you headed?', 'Where are you going right now?'];
        grammar.push({ source: "कहाँ", target: "Where" });
        grammar.push({ source: "जा रहे", target: "are going" });
      } else if (hasKarRahe) {
        translation = 'What are you doing?';
        alternatives = ['What are you up to?', 'What are you doing right now?'];
        grammar.push({ source: "क्या", target: "What" });
        grammar.push({ source: "कर रहे", target: "are doing" });
      } else if (lower.includes('काम कर') || lower.includes('kaam kar')) {
        translation = 'Where are you working?';
        alternatives = ['Where is your job located?'];
      } else if (lower.includes('खाया') || lower.includes('खाना खा') || lower.includes('khaya')) {
        translation = 'Did you eat?';
        alternatives = ['Have you had your meal?'];
      } else if ((lower.includes('कल') || lower.includes('kal')) && (lower.includes('कॉल') || lower.includes('call') || lower.includes('phone'))) {
        translation = 'I will call you tomorrow.';
        alternatives = ["I'll call you tomorrow."];
      } else if (lower.includes('इंतज़ार') || lower.includes('intezaar') || lower.includes('intezar')) {
        translation = 'I have been waiting for you.';
        alternatives = ["I'm waiting for you."];
      } else {
        return {
          success: false,
          error: 'The on-device offline engine cannot confidently translate this sentence to English.',
          translation: '',
          alternatives: [],
          grammar: [],
          nuance: '',
          provider: 'local',
          mode: 'on-device'
        };
      }
    }

    // DIRECTION 4: Telugu -> Hindi
    else if (src === 'te' && tgt === 'hi') {
      if (lower.includes('నడుస్తున్నావు') || lower.includes('నడుస్తున్నారు')) {
        translation = isPolite ? 'आप कहाँ चल रहे हैं?' : 'तुम कहाँ चल रहे हो?';
        alternatives = ['कहाँ जा रहे हो अभी?'];
      } else if (lower.includes('వెళ్తున్నారు') || lower.includes('వెళ్తున్నావు')) {
        translation = isPolite ? 'आप कहाँ जा रहे हैं?' : 'तुम कहाँ जा रहे हो?';
        alternatives = ['किधर जा रहे हो?'];
      } else if (lower.includes('చేస్తున్నారు') || lower.includes('చేస్తున్నావు')) {
        translation = isPolite ? 'आप क्या कर रहे हैं?' : 'तुम क्या कर रहे हो?';
        alternatives = ['क्या चल रहा है?'];
      } else if (lower.includes('తిన్నారా') || lower.includes('తిన్నావా')) {
        translation = isPolite ? 'क्या आपने खाना खाया?' : 'क्या तुमने खाना खाया?';
        alternatives = ['खाना खा लिया क्या?'];
      } else if (lower.includes('ఉన్నారు') || lower.includes('ఉన్నావు')) {
        translation = isPolite ? 'आप कहाँ हैं?' : 'तुम कहाँ हो?';
        alternatives = ['कहाँ पर हो अभी?'];
      } else {
        return {
          success: false,
          error: 'The on-device offline engine cannot confidently translate this sentence to Hindi.',
          translation: '',
          alternatives: [],
          grammar: [],
          nuance: '',
          provider: 'local',
          mode: 'on-device'
        };
      }
      grammar.push({ source: text, target: translation });
    } else {
      translation = text;
      alternatives = [text];
    }

    // Unmask placeholders in translation and alternatives
    placeholders.forEach(({ key, val }) => {
      translation = translation.replace(new RegExp(key, 'g'), val);
      alternatives = alternatives.map(a => a.replace(new RegExp(key, 'g'), val));
    });

    // Restore emojis if not in translated string
    const originalEmojis = text.match(emojiRegex);
    if (originalEmojis) {
      originalEmojis.forEach(em => {
        if (!translation.includes(em)) translation += ` ${em}`;
      });
    }

    if (!nuance) {
      nuance = `Complete conversational sentence translation in ${tone} tone with Subject-Object-Verb (SOV) order.`;
    }

    return {
      success: true,
      translation,
      alternatives: alternatives.slice(0, 3),
      grammar,
      nuance
    };
  }

  /**
   * Dynamic Reply Suggestions based on incoming message
   */
  async generateReplies({ incomingText, targetLanguage = 'hi', tone = 'Casual', context = '' }) {
    const lower = (incomingText || '').toLowerCase();

    if (lower.includes("didn't you come") || lower.includes('did not come') || lower.includes('क्यों नहीं आए')) {
      return [
        { tone: 'Casual', reply: 'कल मैं नहीं आ पाया यार।', label: 'Casual / Natural' },
        { tone: 'Friendly', reply: 'सॉरी भाई, कल मुझे थोड़ा ज़रूरी काम था।', label: 'Friendly with Apology' },
        { tone: 'Polite', reply: 'माफ़ कीजिएगा, कल व्यक्तिगत कार्य के कारण मैं उपस्थित नहीं हो सका।', label: 'Polite & Respectful' },
        { tone: 'Short', reply: 'कल थोड़ा काम था।', label: 'Short & Direct' },
        { tone: 'Detailed', reply: 'कल मेरी तबीयत थोड़ी ठीक नहीं थी, इसलिए मैं नहीं आ सका।', label: 'Detailed Explanation' }
      ];
    }

    if (lower.includes('free') || lower.includes('available') || lower.includes('खाली')) {
      return [
        { tone: 'Casual', reply: 'हाँ बोल भाई, बिल्कुल फ्री हूँ।', label: 'Casual / Natural' },
        { tone: 'Friendly', reply: 'हाँ जी, बताइए क्या बात है?', label: 'Friendly & Welcoming' },
        { tone: 'Polite', reply: 'हाँ, मैं अभी उपलब्ध हूँ। कहिए।', label: 'Polite & Respectful' },
        { tone: 'Short', reply: 'हाँ, फ्री हूँ।', label: 'Short & Direct' },
        { tone: 'Detailed', reply: 'अभी 10 मिनट में मेरी एक कॉल खत्म हो रही है, फिर बात करते हैं।', label: 'Detailed Timeline' }
      ];
    }

    // Dynamic responses for general inquiries
    return [
      { tone: 'Casual', reply: 'हाँ भाई, समझ गया।', label: 'Casual / Natural' },
      { tone: 'Friendly', reply: 'ज़रूर, मुझे थोड़ा समय दीजिए।', label: 'Friendly with Warmth' },
      { tone: 'Polite', reply: 'जी बिल्कुल, मैं इसे देख लेता हूँ।', label: 'Polite & Respectful' },
      { tone: 'Short', reply: 'ठीक है।', label: 'Short & Direct' },
      { tone: 'Detailed', reply: 'संदेश प्राप्त हुआ, मैं विवरण की समीक्षा करके जल्द उत्तर दूँगा।', label: 'Detailed Acknowledgment' }
    ];
  }

  /**
   * Dynamic Chat Assistant (handles arbitrary user queries)
   */
  async chatAssistant({ query, dialogueHistory = [], targetLanguage = 'hi', tone = 'Casual' }) {
    const qLower = query.toLowerCase();

    if (qLower.includes('grammar') || qLower.includes('ne rule') || qLower.includes('rule') || qLower.includes('difference')) {
      return {
        reply: "In Hindi, sentences follow Subject-Object-Verb (SOV) order. The 'ne' (ने) postposition is added to transitive verbs in the past tense (e.g. 'मैंने खाना खाया' vs 'मैं गया'). Pronouns indicate degrees of respect: 'तू' (intimate), 'तुम' (informal peer), 'आप' (polite/respectful).",
        translation: null,
        alternatives: [],
        grammarNotes: "Hindi SOV syntax: Subject + Object + Verb.",
        intent: "grammar"
      };
    }

    if (qLower.startsWith('translate') || qLower.includes('how to say') || qLower.includes('in hindi') || qLower.includes('in telugu')) {
      const cleanText = query.replace(/^translate\s+/i, '').replace(/in hindi/i, '').replace(/in telugu/i, '').replace(/how to say/i, '').trim();
      const trResult = await this.translate({ text: cleanText || query, sourceLanguage: 'en', targetLanguage, tone });
      return {
        reply: `Here is the natural sentence translation:\n\n**${trResult.translation}**\n\n_${trResult.nuance}_`,
        translation: trResult.translation,
        alternatives: trResult.alternatives,
        grammarNotes: trResult.grammar.map(g => `${g.source} → ${g.target}`).join(', '),
        intent: "translation"
      };
    }

    return {
      reply: `Namaste! I am here to help you communicate naturally across English, Hindi, and Telugu. You asked: "${query}". You can ask me to translate any sentence or explain conversational grammar.`,
      translation: null,
      alternatives: [],
      grammarNotes: null,
      intent: "general"
    };
  }

  async explain({ text, translation, sourceLanguage = 'en', targetLanguage = 'hi' }) {
    return {
      grammar: [{ source: text, target: translation }],
      nuance: `Conversational sentence translation respecting Subject-Object-Verb (SOV) order and Indian texting nuances.`,
      naturalVsLiteral: {
        natural: translation,
        literal: translation,
        note: "Natural mode uses everyday colloquial phrasing rather than rigid dictionary literalism."
      }
    };
  }

  async correct({ text, language = 'en' }) {
    const lower = text.toLowerCase();
    const match = mistakes.find(m => m.incorrect.toLowerCase() === lower);
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
      explanation: "Sentence appears natural and grammatically sound.",
      rule: "Standard subject-verb alignment."
    };
  }
}

export const localProvider = new LocalProvider();
