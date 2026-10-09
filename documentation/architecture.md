# Hindi Assist — System Architecture

## 1. Overview
**Hindi Assist** is a privacy-first multilingual communication assistance, on-device translation, and language-learning platform covering English, Hindi, and Telugu.

```mermaid
graph TD
    subgraph Client Environments
        A[WhatsApp / Messaging App]
        B[Android Translation Keyboard<br/>InputMethodService]
        C[Web Application & PWA<br/>React + Vite]
    end

    subgraph Privacy & Processing Layer
        D[Language Detection<br/>Unicode Heuristics + ML Kit]
        E[On-Device Translation<br/>Google ML Kit / Local Lexicon]
        F[Sensitive Field Protection<br/>InputType Password / OTP Detection]
        G[Local Room / Web Storage<br/>History, Phrasebook, Vocab]
    end

    subgraph Optional Cloud Layer
        H[Optional Express API Backend<br/>Stateless, Zero-Log]
        I[Optional Cloud AI<br/>Strict Consent Required]
    end

    A -->|User Copies Message| B
    B -->|User Taps Clipboard| D
    D --> E
    E -->|User Taps Insert| B
    B -->|InputConnection.commitText| A
    A -.->|User Manually Taps Send| A

    C --> D
    C --> E
    C --> G
    C -.->|With Explicit Consent| H
    H -.-> I
```

## 2. Architectural Pillars

### 2.1 Separation of Concerns
1. **Android Keyboard (`android/`)**: Pure Kotlin Android Input Method Service interacting via official `InputMethodService` and `InputConnection` APIs. Independent from web logic.
2. **Web Frontend (`web/frontend/`)**: Modern React + Vite application with PWA installation, comprehensive design token theming, and an interactive keyboard simulator.
3. **Backend Service (`backend/`)**: Stateless Node.js Express service providing fallback synthesis and extensibility without retaining user messages.
4. **Structured Language Resources (`language-data/`)**: Central JSON schemas for vocabulary, phrases, patterns, mistakes, and dialogues.

### 2.2 Privacy-By-Design Guarantee
- **On-Device Default**: Translation priority is local execution via Google ML Kit on Android and local synthesis in browser.
- **Zero-Log Enforcement**: Requests strictly scrub user payload from logs.
- **Explicit-Only Clipboard Access**: Clipboard is accessed solely upon direct user action.
- **Zero WhatsApp Scraping**: No accessibility service snooping, no database introspection, no network sniffing.
