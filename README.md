# HINDI ASSIST

> **Understand every message. Reply naturally.**  
> *English • Hindi • Telugu*

<<<<<<< HEAD
The complete production codebase for **Hindi Assist** is located inside the [hindi-assist/](file:///c:/Users/AI%20PC/Desktop/chat%20assist/hindi-assist) directory.

### Quick Links
- **Android Kotlin App & Translation Keyboard**: [hindi-assist/android](file:///c:/Users/AI%20PC/Desktop/chat%20assist/hindi-assist/android)
- **Responsive React Web Application & PWA**: [hindi-assist/web/frontend](file:///c:/Users/AI%20PC/Desktop/chat%20assist/hindi-assist/web/frontend)
- **Stateless Zero-Log Backend API**: [hindi-assist/backend](file:///c:/Users/AI%20PC/Desktop/chat%20assist/hindi-assist/backend)
- **Central Language Resources**: [hindi-assist/language-data](file:///c:/Users/AI%20PC/Desktop/chat%20assist/hindi-assist/language-data)
- **Detailed Documentation**: [hindi-assist/documentation](file:///c:/Users/AI%20PC/Desktop/chat%20assist/hindi-assist/documentation)
- **Project Master README**: [hindi-assist/README.md](file:///c:/Users/AI%20PC/Desktop/chat%20assist/hindi-assist/README.md)
=======
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Privacy](https://img.shields.io/badge/Privacy-Zero--Log_Default-green.svg)](#privacy-first-architecture)
[![Platform](https://img.shields.io/badge/Platform-Android_Keyboard_%E2%80%A2_Web_PWA_%E2%80%A2_API-indigo.svg)](#platforms)

**Hindi Assist** is a privacy-first multilingual communication assistant, on-device translation engine, and language-learning platform designed specifically for real-world conversational messaging across English, Hindi, and Telugu.

---

## 📖 Table of Contents
1. [Product Vision & Differentiation](#product-vision--differentiation)
2. [Primary Platforms](#primary-platforms)
3. [The WhatsApp Communication Workflow](#the-whatsapp-communication-workflow)
4. [Privacy-First Architecture](#privacy-first-architecture)
5. [Translation Quality & Conversational Nuance](#translation-quality--conversational-nuance)
6. [Learning & Pedagogical Suite](#learning--pedagogical-suite)
7. [Five Curated Themes & Reading Comfort](#five-curated-themes--reading-comfort)
8. [Project Structure](#project-structure)
9. [Installation & Getting Started](#installation--getting-started)
10. [Testing & Verification](#testing--verification)
11. [Documentation Index](#documentation-index)

---

## 🎯 Product Vision & Differentiation
Traditional translation applications are rigid, Sanskrit-heavy, and disconnect users from the context of their daily messaging apps.

**Hindi Assist unites ten capabilities into one cohesive experience:**
1. **On-Device Translation**: Native Google ML Kit and conversational heuristics.
2. **Android Translation Keyboard**: Official `InputMethodService` toolbar assistant.
3. **Conversational Nuance**: Modern spoken Hindi (e.g., *"क्या तुम अभी फ्री हो?"*, never *"स्वतंत्र"* for schedules).
4. **Help Me Reply**: Context-aware suggested responses across 6 tones (Casual, Friendly, Polite, Short, Detailed).
5. **Private Local History**: Default OFF, biometric/PIN protection, auto-lock timeouts, TXT/CSV/JSON export.
6. **My Phrasebook**: Reusable curated and custom messaging phrases.
7. **My Vocabulary**: Searchable 3-language lexicon with pronunciation notes and examples.
8. **Learning Suite**: "Explain Like I'm a Beginner", Sentence Patterns builder, Three-Language Bridge.
9. **Interactive Practice**: "Correct My English", Common Mistakes workbook, Word of the Day, and Roleplays.
10. **Five Visual Themes**: Day, Night, Blue, Green, and warm Reading / Eye Comfort mode.

---

## 📱 Primary Platforms
- **Android Translation Keyboard**: Built in Kotlin with Android `InputMethodService`, `InputConnection`, sensitive field detection, and Google ML Kit.
- **Responsive Web Application & PWA**: Built in React + Vite with responsive design tokens, glassmorphism, and an interactive keyboard simulator.
- **Stateless Backend API**: Built with Node.js and Express under a strict Zero-Log policy.

---

## 💬 The WhatsApp Communication Workflow

```
[Incoming WhatsApp Message] 
       ↓ 
User copies message 
       ↓ 
User opens Hindi Assist Keyboard 
       ↓ 
User taps [📋 Clipboard] 
       ↓ 
On-device detection & translation 
       ↓ 
User reads & understands 
       ↓ 
User types Hindi reply (e.g., "कल थोड़ा काम था") 
       ↓ 
Selects [HI → EN] (Yields "Had some work yesterday.") 
       ↓ 
User taps [Insert] (InputConnection commits text into field) 
       ↓ 
User manually presses WhatsApp's Send button!
```

> **Strict Non-Interference Policy:**  
> Hindi Assist **never** reverse engineers WhatsApp, **never** scrapes accessibility trees, **never** reads private databases, and **never** automatically sends messages. The user is in full control at every stage.

---

## 🛡️ Privacy-First Architecture
- **On-Device Default**: Normal translation does not dispatch text to remote servers.
- **Zero Keystroke Logging**: The keyboard never logs typed characters or records telemetry.
- **Sensitive Input Shield**: Fields marked as `TYPE_TEXT_VARIATION_PASSWORD`, `WEB_PASSWORD`, or numeric passwords automatically disable translation assistance.
- **Explicit-Only Clipboard Access**: Clipboard contents are inspected solely upon an intentional tap on `[Clipboard]`.
- **Zero-Log API**: The Express backend scrubs request text from console logs and operates completely statelessly.
- **Cloud AI Opt-In**: Cloud AI is disabled by default and requires explicit user consent.

---

## 🎨 Five Curated Themes & Reading Comfort
Hindi Assist includes five visual themes with customizable warmth and contrast:
- **Day Mode**: Crisp daylight contrast, soft glare-free cards.
- **Night Mode**: Deep ergonomic slate navy with cyan accents.
- **Blue Theme**: Professional sapphire surface tones.
- **Green Theme**: Emerald and sage natural atmosphere.
- **Reading / Eye Comfort**: Softer sepia tones with adjustable warmth (Low, Medium, High) and contrast levels.

---

## 📁 Project Structure
```
hindi-assist/
├── android/                   # Native Android Application & Keyboard (Kotlin)
│   ├── app/src/main/
│   │   ├── AndroidManifest.xml
│   │   ├── res/               # Themes, colors, strings, method.xml
│   │   └── java/com/hindiassist/
│   │       ├── keyboard/      # HindiAssistInputMethodService, KeyboardView
│   │       ├── translation/   # TranslationManager, ModelManager, LanguageDetector
│   │       ├── clipboard/     # Explicit ClipboardManager
│   │       ├── theme/         # ThemeManager, ColorTheme
│   │       ├── history/       # Room Database (TranslationHistory, HistoryDao)
│   │       └── settings/      # SettingsActivity, SettingsRepository
│   └── build.gradle.kts
│
├── web/frontend/              # React + Vite Progressive Web App
│   ├── src/
│   │   ├── components/        # Navbar, Sidebar, KeyboardSimulator
│   │   ├── pages/             # Chat, Translate, Reply, Learn, Practice, Vocab, etc.
│   │   ├── services/          # translationClient, storageService, languageDataService
│   │   ├── styles/            # index.css (tokens, glassmorphism, responsive grid)
│   │   └── App.jsx
│   ├── index.html
│   └── vite.config.js
│
├── backend/                   # Stateless Node.js / Express Translation API
│   ├── src/
│   │   ├── middleware/        # privacyMiddleware.js (Zero-Log policy)
│   │   ├── services/          # translationService.js, languageDetector.js
│   │   ├── routes/            # api.js
│   │   └── server.js
│   └── tests/                 # Unit tests (translation, entities, privacy)
│
├── language-data/             # Central Structured Resources
│   ├── vocabulary.json        # 3-language vocabulary bank
│   ├── phrases.json           # Conversational WhatsApp phrases
│   ├── patterns.json          # Sentence pattern formulas
│   ├── mistakes.json          # Indian English & Hindi correction catalog
│   └── roleplays.json         # Real-world conversational dialogue scenarios
│
└── documentation/             # Detailed Architecture & Module Guides
    ├── architecture.md
    ├── android-keyboard.md
    ├── translation.md
    ├── privacy.md
    ├── themes.md
    ├── web-app.md
    ├── api.md
    ├── testing.md
    ├── user-guide.md
    ├── learning-system.md
    ├── history.md
    ├── phrasebook.md
    ├── vocabulary.md
    └── security.md
```

---

## 🚀 Installation & Getting Started

### 1. Web Frontend & PWA
```bash
cd hindi-assist/web/frontend
npm install
npm run dev
```
Navigate to `http://localhost:3000`.

To build the production bundle:
```bash
npm run build
```

### 2. Backend API Service
```bash
cd hindi-assist/backend
npm install
npm start
```
The API will be available at `http://localhost:5000` with the health check at `http://localhost:5000/api/health`.

### 3. Android Application & Keyboard
Open `hindi-assist/android` in Android Studio (Giraffe or newer).
Build and deploy the debug APK to an Android device or emulator:
```bash
./gradlew assembleDebug
```
Then enable **Hindi Assist Keyboard** in Android Settings.

---

## 🧪 Testing & Verification
Execute the test suite in the backend directory:
```bash
cd hindi-assist/backend
npm test
```

Tests verify:
- Language detection across English, Devanagari Hindi, and Telugu.
- Conversational word choice ("free" → "फ्री", not "स्वतंत्र").
- Entity preservation (URLs, emojis, names, numbers remain untouched).
- Tone adaptation (Casual vs Polite).
- Multi-tone reply suggestions.
- Grammar corrections ("Yesterday I am going" → "went").

---

## 📚 Documentation Index
Comprehensive guides are located in the [documentation/](file:///c:/Users/AI%20PC/Desktop/chat%20assist/hindi-assist/documentation) directory:
- [System Architecture](file:///c:/Users/AI%20PC/Desktop/chat%20assist/hindi-assist/documentation/architecture.md)
- [Android Keyboard Implementation](file:///c:/Users/AI%20PC/Desktop/chat%20assist/hindi-assist/documentation/android-keyboard.md)
- [Translation Nuance Standards](file:///c:/Users/AI%20PC/Desktop/chat%20assist/hindi-assist/documentation/translation.md)
- [Privacy Architecture](file:///c:/Users/AI%20PC/Desktop/chat%20assist/hindi-assist/documentation/privacy.md)
- [Theme System & Design Tokens](file:///c:/Users/AI%20PC/Desktop/chat%20assist/hindi-assist/documentation/themes.md)
- [Web App & PWA](file:///c:/Users/AI%20PC/Desktop/chat%20assist/hindi-assist/documentation/web-app.md)
- [REST API Specification](file:///c:/Users/AI%20PC/Desktop/chat%20assist/hindi-assist/documentation/api.md)
- [Testing & Verification Guide](file:///c:/Users/AI%20PC/Desktop/chat%20assist/hindi-assist/documentation/testing.md)
- [User Guide](file:///c:/Users/AI%20PC/Desktop/chat%20assist/hindi-assist/documentation/user-guide.md)
- [Learning System Pedagogy](file:///c:/Users/AI%20PC/Desktop/chat%20assist/hindi-assist/documentation/learning-system.md)
- [Translation History Lifecycle](file:///c:/Users/AI%20PC/Desktop/chat%20assist/hindi-assist/documentation/history.md)
- [Phrasebook System](file:///c:/Users/AI%20PC/Desktop/chat%20assist/hindi-assist/documentation/phrasebook.md)
- [Vocabulary Architecture](file:///c:/Users/AI%20PC/Desktop/chat%20assist/hindi-assist/documentation/vocabulary.md)
- [Security & Threat Model](file:///c:/Users/AI%20PC/Desktop/chat%20assist/hindi-assist/documentation/security.md)

---

## 📄 License
Hindi Assist is distributed under the Apache-2.0 License.
>>>>>>> 5b2ea2dcebbf87f8e6491f9b47cbcf59eba39fd5
