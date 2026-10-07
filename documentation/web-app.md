# Web Application & Progressive Web App (PWA)

## 1. Overview
The web application provides an intuitive, responsive interface built with React, Vite, and Vanilla CSS tokens.

## 2. Directory Structure
```
web/frontend/
├── public/
│   ├── manifest.json       # PWA manifest
│   ├── sw.js               # Service worker for offline caching
│   └── logo.svg            # Vector branding
├── src/
│   ├── components/         # Navbar, Sidebar, KeyboardSimulator
│   ├── pages/              # Chat, Translate, Reply, Learn, Practice, Vocab, Phrasebook, History, Privacy, Settings
│   ├── services/           # translationClient, storageService, languageDataService
│   ├── styles/             # index.css (tokens, glassmorphism, responsive grid)
│   ├── App.jsx             # Main layout orchestrator
│   └── main.jsx            # Application entrypoint
├── index.html
├── package.json
└── vite.config.js
```

## 3. PWA Capabilities
- Installable on Android, ChromeOS, Windows, and macOS via `manifest.json`.
- Offline caching via `sw.js` for key assets and scripts.
- Standalone display mode with native look and feel.
