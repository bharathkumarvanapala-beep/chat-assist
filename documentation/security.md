# Security & Threat Model

## 1. Threat Mitigation Strategies

| Threat Vector | Mitigation Strategy | Status |
| :--- | :--- | :--- |
| **Keystroke Logging** | Keyboard does not record key events or upload analytics | Verified |
| **WhatsApp Database Infiltration** | No accessibility scraping or root DB access. Standard InputConnection only | Verified |
| **Credential & OTP Exposure** | Automatic detection of password & OTP fields to disable translation assistance | Verified |
| **Continuous Clipboard Peeking** | Clipboard is read strictly upon deliberate user click | Verified |
| **Silent Cloud Transmission** | Cloud AI is disabled by default; requires explicit consent | Verified |
| **Server-Side Message Retention** | Zero-log policy: request payloads are scrubbed from server logs | Verified |

## 2. API Hardening
- Payloads capped at 5,000 characters to prevent buffer overflow attacks.
- CORS restricted to known local origins in production.
- Sanitized input validation on all translation endpoints.
