/**
 * Language Data Service
 * 
 * Provides built-in vocabulary, WhatsApp phrases, sentence patterns,
 * mistake books, and roleplay scenarios.
 */

export const INITIAL_VOCABULARY = [
  {
    id: "vocab-1",
    english: "actually",
    hindi: "असल में",
    telugu: "నిజానికి",
    transliteration_hi: "asal mein",
    transliteration_te: "nijaanki",
    category: "Conversational",
    tone: "Casual",
    example_en: "Actually, I am at home right now.",
    example_hi: "असल में, मैं अभी घर पर हूँ।",
    example_te: "నిజానికి, నేను ఇప్పుడు ఇంట్లోనే ఉన్నాను.",
    usage_note: "Commonly used in Indian WhatsApp chats to gently clarify or correct a statement.",
    level: "Beginner",
    isFavorite: true
  },
  {
    id: "vocab-2",
    english: "probably",
    hindi: "शायद",
    telugu: "బహుశా",
    transliteration_hi: "shaayad",
    transliteration_te: "bahushaa",
    category: "Conversational",
    tone: "Neutral",
    example_en: "He will probably come tomorrow.",
    example_hi: "वह शायद कल आएगा।",
    example_te: "అతను బహుశా రేపు వస్తాడు.",
    usage_note: "Expresses likelihood without full commitment.",
    level: "Beginner",
    isFavorite: false
  },
  {
    id: "vocab-3",
    english: "meeting",
    hindi: "मीटिंग / बैठक",
    telugu: "సమావేశం / మీటింగ్",
    transliteration_hi: "meeting / baithak",
    transliteration_te: "samavesham / meeting",
    category: "Work",
    tone: "Work",
    example_en: "We have a meeting at 10 AM.",
    example_hi: "हमारी सुबह 10 बजे मीटिंग है।",
    example_te: "మనకు ఉదయం 10 గంటలకు మీటింగ్ ఉంది.",
    usage_note: "In conversational Hindi and Telugu, 'meeting' is almost always preferred over formal words.",
    level: "Beginner",
    isFavorite: true
  },
  {
    id: "vocab-4",
    english: "free",
    hindi: "फ्री / खाली",
    telugu: "ఖాళీగా",
    transliteration_hi: "free / khaali",
    transliteration_te: "khaaligaa",
    category: "Daily Life",
    tone: "Casual",
    example_en: "Are you free now?",
    example_hi: "क्या तुम अभी फ्री हो?",
    example_te: "నువ్వు ఇప్పుడు ఖాళీగా ఉన్నావా?",
    usage_note: "Do not translate as 'स्वतंत्र' (liberated) in schedule availability contexts.",
    level: "Beginner",
    isFavorite: true
  },
  {
    id: "vocab-5",
    english: "take care",
    hindi: "अपना ख्याल रखना",
    telugu: "జాగ్రత్తగా ఉండు",
    transliteration_hi: "apna khyaal rakhna",
    transliteration_te: "jaagrattagaa undu",
    category: "Greetings",
    tone: "Friendly",
    example_en: "Take care and see you soon.",
    example_hi: "अपना ख्याल रखना और जल्दी मिलते हैं।",
    example_te: "జాగ్రత్తగా ఉండు, త్వరలో కలుద్దాం.",
    usage_note: "Natural expression rather than literal 'ध्यान रखना'.",
    level: "Beginner",
    isFavorite: true
  },
  {
    id: "vocab-6",
    english: "already",
    hindi: "पहले से ही",
    telugu: "ఇప్పటికే",
    transliteration_hi: "pehle se hi",
    transliteration_te: "ippatike",
    category: "Time Expressions",
    tone: "Neutral",
    example_en: "I have already finished the work.",
    example_hi: "मैंने पहले से ही काम पूरा कर लिया है।",
    example_te: "నేను ఇప్పటికే పని పూర్తి చేశాను.",
    usage_note: "Indicates completion before current moment.",
    level: "Intermediate",
    isFavorite: false
  }
];

export const INITIAL_PHRASES = [
  {
    id: "phrase-1",
    english: "Where are you?",
    hindi: "तुम कहाँ हो?",
    telugu: "నువ్వు ఎక్కడ ఉన్నావు?",
    category: "Friends",
    tone: "Casual",
    natural_hi: "तुम कहाँ हो?",
    literal_hi: "कहाँ तुम उपस्थित हो?",
    natural_te: "నువ్వు ఎక్కడ ఉన్నావు?",
    literal_te: "ఎక్కడ నువ్వు ఉన్నావు?",
    alternatives_hi: ["तुम कहाँ हो?", "कहाँ पर हो अभी?", "किधर हो भाई?"],
    polite_hi: "आप कहाँ हैं?",
    polite_te: "మీరు ఎక్కడ ఉన్నారు?",
    isFavorite: true,
    userNote: "Frequent WhatsApp check-in."
  },
  {
    id: "phrase-2",
    english: "Are you free now?",
    hindi: "क्या तुम अभी फ्री हो?",
    telugu: "నువ్వు ఇప్పుడు ఖాళీగా ఉన్నావా?",
    category: "Friends",
    tone: "Casual",
    natural_hi: "क्या तुम अभी फ्री हो?",
    literal_hi: "क्या तुम अभी स्वतंत्र हो?",
    natural_te: "నువ్వు ఇప్పుడు ఫ్రీయేనా?",
    literal_te: "నువ్వు ఇప్పుడు బంధవిముక్తుడివా?",
    alternatives_hi: ["क्या तुम अभी फ्री हो?", "अभी कुछ काम तो नहीं है ना?", "क्या अभी बात हो सकती है?"],
    polite_hi: "क्या आप अभी उपलब्ध हैं?",
    polite_te: "మీరు ఇప్పుడు ఖాళీగా ఉన్నారా?",
    isFavorite: true,
    userNote: "Always uses 'फ्री', never 'स्वतंत्र'."
  },
  {
    id: "phrase-3",
    english: "I am at home right now.",
    hindi: "मैं अभी घर पर हूँ।",
    telugu: "నేను ఇప్పుడు ఇంట్లోనే ఉన్నాను.",
    category: "Common Replies",
    tone: "Casual",
    natural_hi: "मैं अभी घर पर हूँ।",
    literal_hi: "मैं हूँ अभी घर पर।",
    natural_te: "నేను ప్రస్తుతం ఇంట్లోనే ఉన్నాను.",
    literal_te: "నేను ఉన్నాను ఇప్పుడు ఇల్లు మీద.",
    alternatives_hi: ["मैं अभी घर पर हूँ।", "फिलहाल घर पर ही हूँ।", "अभी घर पे हूँ, बोलो।"],
    polite_hi: "मैं इस समय घर पर हूँ।",
    polite_te: "నేను ప్రస్తుతం ఇంట్లో ఉన్నాను సర్.",
    isFavorite: false,
    userNote: "Standard response to location queries."
  },
  {
    id: "phrase-4",
    english: "Take care.",
    hindi: "अपना ख्याल रखना।",
    telugu: "జాగ్రత్తగా ఉండు.",
    category: "Greetings",
    tone: "Friendly",
    natural_hi: "अपना ख्याल रखना।",
    literal_hi: "ध्यान रखना।",
    natural_te: "జాగ్రత్తగా ఉండు.",
    literal_te: "శ్రద్ధ తీసుకో.",
    alternatives_hi: ["अपना ख्याल रखना।", "ख्याल रखो अपना।", "टेक केयर!"],
    polite_hi: "आप अपना ध्यान रखिएगा।",
    polite_te: "మీరు జాగ్రత్తగా ఉండండి.",
    isFavorite: true,
    userNote: "Natural conversational sign-off."
  },
  {
    id: "phrase-5",
    english: "I will call you tomorrow.",
    hindi: "मैं तुम्हें कल कॉल करूँगा।",
    telugu: "నేను రేపు నీకు కాల్ చేస్తాను.",
    category: "Work",
    tone: "Casual",
    natural_hi: "मैं तुम्हें कल कॉल करूँगा।",
    literal_hi: "मैं करूँगा कॉल तुम्हें कल।",
    natural_te: "నేను రేపు మార్నింగ్ కాల్ చేస్తాను.",
    literal_te: "నేను నీకు పిలుపు చేస్తాను రేపు.",
    alternatives_hi: ["मैं तुम्हें कल कॉल करूँगा।", "कल बात करता हूँ तुमसे।", "कल फोन लगाता हूँ।"],
    polite_hi: "मैं आपको कल कॉल करूँगा।",
    polite_te: "నేను రేపు మీకు కాల్ చేస్తాను.",
    isFavorite: false,
    userNote: "Keeps 'कॉल' loanword."
  }
];

export const INITIAL_PATTERNS = [
  {
    id: "pattern-1",
    pattern: "I want to + [verb]",
    explanation: "Used to express a direct personal desire or intention.",
    hindi_formula: "मैं + [verb root] + ना चाहता हूँ / चाहती हूँ",
    telugu_formula: "నేను + [verb] + అనుకుంటున్నాను",
    examples: [
      { english: "I want to learn English.", hindi: "मैं अंग्रेजी सीखना चाहता हूँ।", telugu: "నేను ఇంగ్లీష్ నేర్చుకోవాలనుకుంటున్నాను." },
      { english: "I want to go home.", hindi: "मैं घर जाना चाहता हूँ।", telugu: "నేను ఇంటికి వెళ్ళాలనుకుంటున్నాను." },
      { english: "I want to talk to you.", hindi: "मैं तुमसे बात करना चाहता हूँ।", telugu: "నేను నీతో మాట్లాడాలనుకుంటున్నాను." }
    ],
    practice_prompt: "Try building: 'I want to drink water.'"
  },
  {
    id: "pattern-2",
    pattern: "Can you please + [verb]?",
    explanation: "Polite request to ask someone to perform an action.",
    hindi_formula: "क्या आप कृपया + [verb] + कर सकते हैं?",
    telugu_formula: "మీరు దయచేసి + [verb] + చేయగలరా?",
    examples: [
      { english: "Can you please call me?", hindi: "क्या आप कृपया मुझे कॉल कर सकते हैं?", telugu: "మీరు దయచేసి నాకు కాల్ చేయగలరా?" },
      { english: "Can you please send the details?", hindi: "क्या आप कृपया डिटेल्स भेज सकते हैं?", telugu: "మీరు దయచేసి వివరాలు పంపగలరా?" }
    ],
    practice_prompt: "Try building: 'Can you please help me?'"
  },
  {
    id: "pattern-3",
    pattern: "I have been [verb-ing] for [time duration]",
    explanation: "Present perfect continuous: activities started in the past and continuing into the present moment.",
    hindi_formula: "मैं + [time] + से + [verb] + कर रहा हूँ",
    telugu_formula: "నేను + [time] + నుండి + [verb] + చేస్తున్నాను",
    examples: [
      { english: "I have been working here for two years.", hindi: "मैं यहाँ दो साल से काम कर रहा हूँ।", telugu: "నేను ఇక్కడ రెండు సంవత్సరాల నుండి పనిచేస్తున్నాను." },
      { english: "I have been waiting for 30 minutes.", hindi: "मैं 30 मिनट से इंतज़ार कर रहा हूँ।", telugu: "నేను 30 నిమిషాల నుండి వేచి చూస్తున్నాను." }
    ],
    practice_prompt: "Try building: 'I have been studying since morning.'"
  }
];

export const INITIAL_MISTAKES = [
  {
    id: "mistake-1",
    category: "Past Tense",
    incorrect: "Yesterday I am going market.",
    corrected: "Yesterday, I went to the market.",
    hindi_translation: "कल मैं बाज़ार गया था।",
    telugu_translation: "నిన్న నేను మార్కెట్‌కు వెళ్ళాను.",
    explanation: "'Yesterday' signals completed past time. We must use the simple past tense 'went' (past of 'go').",
    rule: "Past time marker requires Simple Past tense.",
    practice_question: "Yesterday I ___ to the office.",
    options: ["went", "go", "am going", "gone"],
    correct_answer: "went",
    hint: "Think of the past form of 'go'."
  },
  {
    id: "mistake-2",
    category: "Did + Base Verb",
    incorrect: "Did you went there?",
    corrected: "Did you go there?",
    hindi_translation: "क्या तुम वहाँ गए थे?",
    telugu_translation: "నువ్వు అక్కడికి వెళ్ళావా?",
    explanation: "When 'did' is used as the past auxiliary, the main verb remains in base form (V1). Never say 'did you went'.",
    rule: "Did + subject + base verb (V1).",
    practice_question: "Did you ___ him yesterday?",
    options: ["call", "called", "calling", "calls"],
    correct_answer: "call",
    hint: "'Did' already carries the past tense."
  },
  {
    id: "mistake-3",
    category: "Stative Verb (Have vs Having)",
    incorrect: "I am having two brothers.",
    corrected: "I have two brothers.",
    hindi_translation: "मेरे दो भाई हैं।",
    telugu_translation: "నాకు ఇద్దరు సోదరులు ఉన్నారు.",
    explanation: "Possession and family relationships in English use simple 'have', not the continuous 'having'.",
    rule: "Use 'I have' for possession or relationships.",
    practice_question: "I ___ a car and a bike.",
    options: ["have", "am having", "having", "has"],
    correct_answer: "have",
    hint: "Possession uses simple 'have'."
  }
];

export const INITIAL_ROLEPLAYS = [
  {
    id: "scenario-friend",
    title: "Catching Up With a Friend",
    icon: "👋",
    category: "Daily Life",
    difficulty: "Beginner",
    description: "Casual conversation asking how your friend is doing and weekend plans.",
    initial_message_en: "Hey! Long time no see! How have you been?",
    initial_message_hi: "अरे! बहुत दिनों बाद मिले! तुम कैसे हो सब कैसा चल रहा है?",
    initial_message_te: "హే! చాలా రోజులైంది చూసి! ఎలా ఉన్నావు?",
    suggested_replies_en: [
      "I'm doing great! Just busy with work. How about you?",
      "Everything is good! Are you free this weekend?",
      "Hey! Really long time. Let's catch up soon!"
    ],
    learning_focus: "Casual greeting, using 'how have you been', friendly tones."
  },
  {
    id: "scenario-shop",
    title: "At a Grocery or Tech Store",
    icon: "🛒",
    category: "Shopping",
    difficulty: "Elementary",
    description: "Asking about product availability, prices, discounts, and payment methods.",
    initial_message_en: "Hello! Welcome to our store. Are you looking for anything specific today?",
    initial_message_hi: "नमस्ते! हमारी दुकान में आपका स्वागत है। क्या आप आज कुछ खास ढूँढ रहे हैं?",
    initial_message_te: "నమస్కారం! మా దుకాణానికి స్వాగతం. మీరు ఏదైనా ప్రత్యేకంగా చూస్తున్నారా?",
    suggested_replies_en: [
      "Yes, do you have this item in stock?",
      "How much does this cost? Is there any discount?",
      "Do you accept UPI or card payment?"
    ],
    learning_focus: "Polite shopping inquiries, asking prices, payment methods."
  },
  {
    id: "scenario-work",
    title: "Work Meeting & Project Update",
    icon: "💼",
    category: "Work",
    difficulty: "Intermediate",
    description: "Discussing project progress, deadlines, file sharing, and next steps.",
    initial_message_en: "Good morning! Can you give a quick update on where we stand with the presentation?",
    initial_message_hi: "सुप्रभात! क्या आप प्रेजेंटेशन की वर्तमान स्थिति के बारे में संक्षेप में बता सकते हैं?",
    initial_message_te: "శుభోదయం! ప్రజంటేషన్ ఏ దశలో ఉందో సంక్షిప్తంగా చెప్పగలరా?",
    suggested_replies_en: [
      "Good morning! I have completed the initial draft and sent the file to your email.",
      "Almost done, just finalizing the metrics slides. I'll share it by 2 PM.",
      "Could we do a quick 5-minute review call before sending it to the client?"
    ],
    learning_focus: "Professional tone, work deadlines, scheduling follow-ups."
  }
];
