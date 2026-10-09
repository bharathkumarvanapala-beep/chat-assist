# Privacy Architecture & Security Policies

## 1. Core Principles
1. **Private by Default**: Translation History and Cloud AI are set to **OFF** by default.
2. **User Controlled by Design**: The user explicitly initiates every translation, copy, and insertion.
3. **Zero Interception**: No background WhatsApp monitoring, no continuous clipboard listening.

## 2. WhatsApp Integration Boundaries
- **No reverse engineering**: Hindi Assist interacts with WhatsApp strictly through the standard Android Input Connection.
- **No auto-sending**: The user must always press WhatsApp's native Send button manually.
- **No background clipboard tracking**: Clipboard data is only read when the user taps `[Clipboard]`.

## 3. Storage Safeguards
- History is saved locally using Android Room DB and HTML5 LocalStorage.
- Protection feature provides PIN / Biometric authentication with configurable timeouts (Immediate, 1m, 5m, 15m, Never).
- Export warning informs the user before exporting history to unencrypted formats.
