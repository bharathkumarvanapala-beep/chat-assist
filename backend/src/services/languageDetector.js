/**
 * Language Detector for Hindi Assist
 * 
 * Accurately detects English, Hindi (Devanagari script & romanized cues),
 * and Telugu (Telugu script & romanized cues).
 * Returns language code and confidence level.
 */

export function detectLanguage(text) {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return {
      language: 'unknown',
      confidence: 0,
      label: 'Language uncertain.'
    };
  }

  const cleanText = text.trim();

  // 1. Unicode Block Analysis
  // Devanagari range: \u0900-\u097F
  const devanagariCount = (cleanText.match(/[\u0900-\u097F]/g) || []).length;
  // Telugu range: \u0C00-\u0C7F
  const teluguCount = (cleanText.match(/[\u0C00-\u0C7F]/g) || []).length;
  // Latin / English range: a-z, A-Z
  const latinCount = (cleanText.match(/[a-zA-Z]/g) || []).length;

  const totalChars = cleanText.replace(/[\s\d\p{P}\p{S}]/gu, '').length;

  if (totalChars === 0) {
    return {
      language: 'unknown',
      confidence: 0,
      label: 'Language uncertain.'
    };
  }

  // Devanagari script dominance
  if (devanagariCount > 0 && devanagariCount >= teluguCount && devanagariCount >= latinCount * 0.4) {
    const confidence = Math.min(1, Math.round((devanagariCount / totalChars) * 100) / 100);
    return {
      language: 'hi',
      confidence: confidence >= 0.3 ? confidence : 0.4,
      label: 'Hindi'
    };
  }

  // Telugu script dominance
  if (teluguCount > 0 && teluguCount >= devanagariCount && teluguCount >= latinCount * 0.4) {
    const confidence = Math.min(1, Math.round((teluguCount / totalChars) * 100) / 100);
    return {
      language: 'te',
      confidence: confidence >= 0.3 ? confidence : 0.4,
      label: 'Telugu'
    };
  }

  // Check Romanized Hinglish / Tenglish vs Standard English
  const lower = cleanText.toLowerCase();

  // Common Romanized Hindi markers
  const hinglishMarkers = [
    'kya', 'hai', 'hain', 'ho', 'kaha', 'kahan', 'kyu', 'kyun', 'kal',
    'aaj', 'mai', 'main', 'tum', 'aap', 'nahi', 'nahin', 'bhai', 'yaar',
    'bol', 'raha', 'rahe', 'rahi', 'karo', 'karna', 'kardo', 'chahiye'
  ];

  // Common Romanized Telugu markers
  const tenglishMarkers = [
    'nuvvu', 'ekkada', 'unnav', 'unnava', 'enti', 'ela', 'cheyyi', 'cheppu',
    'ra', 'repu', 'ninna', 'nenu', 'meeru', 'undi', 'ledu', 'vastavu', 'kavali'
  ];

  const words = lower.split(/\s+/).map(w => w.replace(/[^\w]/g, ''));
  let hinglishHits = 0;
  let tenglishHits = 0;

  words.forEach(w => {
    if (hinglishMarkers.includes(w)) hinglishHits++;
    if (tenglishMarkers.includes(w)) tenglishHits++;
  });

  if (hinglishHits >= 2 || (words.length <= 4 && hinglishHits >= 1)) {
    return {
      language: 'hi',
      romanized: true,
      confidence: 0.85,
      label: 'Hindi (Romanized)'
    };
  }

  if (tenglishHits >= 2 || (words.length <= 4 && tenglishHits >= 1)) {
    return {
      language: 'te',
      romanized: true,
      confidence: 0.85,
      label: 'Telugu (Romanized)'
    };
  }

  // Latin Dominance
  if (latinCount > 0 && totalChars > 0) {
    const confidence = Math.min(1, Math.round((latinCount / totalChars) * 100) / 100);
    if (confidence < 0.4) {
      return {
        language: 'unknown',
        confidence,
        label: 'Language uncertain.'
      };
    }
    return {
      language: 'en',
      confidence,
      label: 'English'
    };
  }

  return {
    language: 'unknown',
    confidence: 0,
    label: 'Language uncertain.'
  };
}
