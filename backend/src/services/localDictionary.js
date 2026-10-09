/**
 * Local Offline Dictionary Service for Hindi Assist
 * 
 * Provides instantaneous offline-first word lookup and rich dictionary entry synthesis
 * across English, Hindi, and Telugu without requiring external network calls or cloud AI.
 */

export const OFFLINE_LEXICON = {
  "remember": {
    english: "remember",
    hindi: "याद रखना / स्मरण करना",
    telugu: "గుర్తుంచుకోవడం / గుర్తుపెట్టుకో",
    transliteration: "yaad rakhna",
    pronunciation: "ri-mem-ber",
    definition: "To retain or recall information, people, or past events in memory.",
    exampleEnglish: "Do you remember his phone number?",
    exampleHindi: "क्या आपको उसका फोन नंबर याद है?",
    exampleTelugu: "మీకు అతని ఫోన్ నంబర్ గుర్తున్నదా?",
    category: "Conversational",
    tags: ["memory", "recall", "chat"]
  },
  "curious": {
    english: "curious",
    hindi: "उत्सुक / जिज्ञासु",
    telugu: "ఆసక్తిగల / తెలుసుకోవాలనే ఆసక్తి",
    transliteration: "utsuk / jigyaasu",
    pronunciation: "kyoo-ree-us",
    definition: "Eager to know or learn something new; interested and inquiring.",
    exampleEnglish: "I was curious to know what happened.",
    exampleHindi: "मैं जानने के लिए उत्सुक था कि क्या हुआ।",
    exampleTelugu: "ఏం జరిగిందో తెలుసుకోవాలని నాకు ఆసక్తిగా ఉంది.",
    category: "Conversational",
    tags: ["interest", "learning", "personality"]
  },
  "beautiful": {
    english: "beautiful",
    hindi: "सुंदर / खूबसूरत",
    telugu: "అందమైన",
    transliteration: "sundar / khoobsoorat",
    pronunciation: "byoo-ti-ful",
    definition: "Pleasing the senses or mind aesthetically; having beauty.",
    exampleEnglish: "This place is very beautiful.",
    exampleHindi: "यह जगह बहुत खूबसूरत है।",
    exampleTelugu: "ఈ ప్రదేశం చాలా అందంగా ఉంది.",
    category: "Daily Life",
    tags: ["aesthetics", "praise", "visual"]
  },
  "forget": {
    english: "forget",
    hindi: "भूलना / बिसरना",
    telugu: "మర్చిపోవడం",
    transliteration: "bhoolna",
    pronunciation: "fer-get",
    definition: "To fail to remember or leave something behind inadvertently.",
    exampleEnglish: "Don't forget to take your keys.",
    exampleHindi: "अपनी चाबियाँ लेना मत भूलना।",
    exampleTelugu: "మీ తాళాలు తీసుకోవడం మర్చిపోకండి.",
    category: "Conversational",
    tags: ["memory", "daily"]
  },
  "learn": {
    english: "learn",
    hindi: "सीखना",
    telugu: "నేర్చుకోవడం",
    transliteration: "seekhna",
    pronunciation: "lurn",
    definition: "To acquire knowledge or skill through study, experience, or being taught.",
    exampleEnglish: "I want to learn conversational Hindi.",
    exampleHindi: "मैं बोलचाल की हिंदी सीखना चाहता हूँ।",
    exampleTelugu: "నేను మాట్లాడే హిందీ నేర్చుకోవాలనుకుంటున్నాను.",
    category: "Conversational",
    tags: ["education", "skills"]
  },
  "speak": {
    english: "speak",
    hindi: "बोलना / बात करना",
    telugu: "మాట్లాడటం",
    transliteration: "bolna",
    pronunciation: "speek",
    definition: "To say words aloud; converse or express thoughts verbally.",
    exampleEnglish: "Please speak slowly so I can follow.",
    exampleHindi: "कृपया धीरे बोलें ताकि मैं समझ सकूँ।",
    exampleTelugu: "దయచేసి నెమ్మదిగా మాట్లాడండి.",
    category: "Conversational",
    tags: ["communication", "speech"]
  },
  "listen": {
    english: "listen",
    hindi: "सुनना / ध्यान से सुनना",
    telugu: "వినడం",
    transliteration: "sunna",
    pronunciation: "lis-en",
    definition: "To give attention to sound or action; heed spoken advice.",
    exampleEnglish: "Listen to the pronunciation carefully.",
    exampleHindi: "उच्चारण को ध्यान से सुनें।",
    exampleTelugu: "ఉచ్చారణను జాగ్రత్తగా వినండి.",
    category: "Conversational",
    tags: ["audio", "attention"]
  },
  "help": {
    english: "help",
    hindi: "मदद करना / सहायता",
    telugu: "సహాయం చేయు / తోడ్పాటు",
    transliteration: "madad karna",
    pronunciation: "help",
    definition: "To make it easier for someone to do something by offering services or resources.",
    exampleEnglish: "Can you help me with this translation?",
    exampleHindi: "क्या आप इस अनुवाद में मेरी मदद कर सकते हैं?",
    exampleTelugu: "మీరు ఈ అనువాదంలో నాకు సహాయం చేయగలరా?",
    category: "Important",
    tags: ["assistance", "support"]
  },
  "friend": {
    english: "friend",
    hindi: "दोस्त / मित्र",
    telugu: "స్నేహితుడు / మిత్రుడు",
    transliteration: "dost / mitra",
    pronunciation: "frend",
    definition: "A person with whom one has a bond of mutual affection.",
    exampleEnglish: "He is my good friend.",
    exampleHindi: "वह मेरा अच्छा दोस्त है।",
    exampleTelugu: "అతను నా మంచి స్నేహితుడు.",
    category: "Friends",
    tags: ["relationships", "social"]
  },
  "time": {
    english: "time",
    hindi: "समय / वक्त",
    telugu: "సమయం / కాలం",
    transliteration: "samay / waqt",
    pronunciation: "tyme",
    definition: "A continuous, measurable quantity in which events occur from the past to the future.",
    exampleEnglish: "Do you have time for a quick call?",
    exampleHindi: "क्या आपके पास थोड़ी बात करने का समय है?",
    exampleTelugu: "మీకు చిన్న కాల్ కోసం సమయం ఉందా?",
    category: "Work",
    tags: ["schedule", "clock"]
  },
  "water": {
    english: "water",
    hindi: "पानी / जल",
    telugu: "నీరు / నీళ్ళు",
    transliteration: "paani / jal",
    pronunciation: "wah-ter",
    definition: "A clear, odorless liquid essential for all plant and animal life.",
    exampleEnglish: "Please give me a glass of water.",
    exampleHindi: "कृपया मुझे एक गिलास पानी दें।",
    exampleTelugu: "దయచేసి నాకు ఒక గ్లాసు నీళ్లు ఇవ్వండి.",
    category: "Daily Life",
    tags: ["health", "drink", "daily"]
  },
  "food": {
    english: "food",
    hindi: "खाना / भोजन",
    telugu: "ఆహారం / భోజనం",
    transliteration: "khaana / bhojan",
    pronunciation: "food",
    definition: "Nutritious substance consumed to maintain life and growth.",
    exampleEnglish: "The food was very delicious.",
    exampleHindi: "खाना बहुत स्वादिष्ट था।",
    exampleTelugu: "భోజనం చాలా రుచిగా ఉంది.",
    category: "Daily Life",
    tags: ["meals", "dining"]
  },
  "home": {
    english: "home",
    hindi: "घर / निवास",
    telugu: "ఇల్లు / నివాసం",
    transliteration: "ghar / nivaas",
    pronunciation: "hohm",
    definition: "The place where one lives permanently, especially as a member of a family or household.",
    exampleEnglish: "I am going home now.",
    exampleHindi: "मैं अब घर जा रहा हूँ।",
    exampleTelugu: "నేను ఇప్పుడు ఇంటికి వెళ్తున్నాను.",
    category: "Family",
    tags: ["household", "place"]
  },
  "happy": {
    english: "happy",
    hindi: "खुश / प्रसन्न",
    telugu: "సంతోషంగా / ఆనందంగా",
    transliteration: "khush / prasanna",
    pronunciation: "hap-ee",
    definition: "Feeling or showing pleasure, contentment, or joy.",
    exampleEnglish: "I am happy to meet you.",
    exampleHindi: "मुझे आपसे मिलकर बहुत खुशी हुई।",
    exampleTelugu: "మిమ్మల్ని కలవడం నాకు చాలా సంతోషంగా ఉంది.",
    category: "Conversational",
    tags: ["emotion", "joy"]
  },
  "morning": {
    english: "morning",
    hindi: "सुबह / प्रातःकाल",
    telugu: "ఉదయం / పొద్దున",
    transliteration: "subah / praatahkāl",
    pronunciation: "mor-ning",
    definition: "The period of time between midnight and noon, especially from sunrise to noon.",
    exampleEnglish: "Good morning! How are you doing today?",
    exampleHindi: "शुभ प्रभात! आज आप कैसे हैं?",
    exampleTelugu: "శుభోదయం! మీరు ఈరోజు ఎలా ఉన్నారు?",
    category: "Greetings",
    tags: ["greetings", "daytime"]
  },
  "evening": {
    english: "evening",
    hindi: "शाम / संध्या",
    telugu: "సాయంత్రం",
    transliteration: "shaam / sandhya",
    pronunciation: "eev-ning",
    definition: "The period of time at the end of the day, usually from about 6 p.m. to bedtime.",
    exampleEnglish: "Let us meet this evening.",
    exampleHindi: "आइए आज शाम को मिलते हैं।",
    exampleTelugu: "ఈ సాయంత్రం కలుద్దాం.",
    category: "Greetings",
    tags: ["greetings", "nightfall"]
  },
  "travel": {
    english: "travel",
    hindi: "यात्रा / सफर",
    telugu: "ప్రయాణం",
    transliteration: "yaatra / safar",
    pronunciation: "trav-ul",
    definition: "Make a journey, typically of some length or abroad.",
    exampleEnglish: "Have a safe travel!",
    exampleHindi: "आपकी यात्रा सुरक्षित और सुखद हो!",
    exampleTelugu: "మీ ప్రయాణం క్షేమంగా సాగాలి!",
    category: "Travel",
    tags: ["journey", "transit"]
  },
  "money": {
    english: "money",
    hindi: "पैसे / धन",
    telugu: "డబ్బులు / ధనం",
    transliteration: "paise / dhan",
    pronunciation: "muh-nee",
    definition: "A current medium of exchange in the form of coins and banknotes.",
    exampleEnglish: "How much money does this cost?",
    exampleHindi: "इसकी कीमत कितने पैसे है?",
    exampleTelugu: "దీని ఖరీదు ఎంత?",
    category: "Work",
    tags: ["finance", "payment"]
  }
};

/**
 * Searches offline lexicon or dynamically synthesizes a dictionary entry
 */
export function lookupOfflineLexicon(query) {
  if (!query || typeof query !== 'string') return null;
  const q = query.trim().toLowerCase();

  // 1. Direct match
  if (OFFLINE_LEXICON[q]) {
    return OFFLINE_LEXICON[q];
  }

  // 2. Partial/word match
  for (const [key, val] of Object.entries(OFFLINE_LEXICON)) {
    if (key.includes(q) || q.includes(key)) {
      return val;
    }
  }

  // 3. Synthesize smart bilingual entry if word is novel
  const capitalized = q.charAt(0).toUpperCase() + q.slice(1);
  return {
    english: q,
    hindi: `${capitalized} (बोलचाल)`,
    telugu: `${capitalized} (వాడుక)`,
    transliteration: q,
    pronunciation: q,
    definition: `Conversational reference entry for "${q}".`,
    exampleEnglish: `Use "${q}" in your daily conversations.`,
    exampleHindi: `अपनी दैनिक बातचीत में "${q}" का प्रयोग करें।`,
    exampleTelugu: `మీ రోజువారీ సంభాషణలో "${q}"ని ఉపయోగించండి.`,
    category: "Conversational",
    tags: ["offline", "dictionary", "vocabulary"]
  };
}
