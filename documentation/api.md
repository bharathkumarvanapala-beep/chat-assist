# Backend REST API Specification

## 1. Endpoints Overview

| Method | Endpoint | Description | Zero-Log Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Health check & privacy audit | Verified |
| `POST` | `/api/translate` | Synthesize translation with tone | Enforced |
| `POST` | `/api/detect-language` | Detect script and language code | Enforced |
| `POST` | `/api/reply-suggestions`| Generate conversational responses | Enforced |
| `POST` | `/api/explain` | Grammar breakdown & nuance note | Enforced |
| `POST` | `/api/correct` | Check English/Hindi grammar | Enforced |

## 2. POST /api/translate
### Request Headers
- `Content-Type: application/json`
- `x-cloud-consent: false` *(Default: false)*

### Request Body
```json
{
  "text": "Are you free now?",
  "sourceLang": "en",
  "targetLang": "hi",
  "tone": "Casual",
  "mode": "natural",
  "consentCloud": false
}
```

### Response Body
```json
{
  "success": true,
  "translatedText": "क्या तुम अभी फ्री हो?",
  "detectedLanguage": "en",
  "sourceLang": "en",
  "targetLang": "hi",
  "tone": "Casual",
  "mode": "natural",
  "processingSource": "📱 On-device",
  "alternatives": [
    "क्या तुम अभी फ्री हो?",
    "अभी बात हो सकती है?",
    "फ्री हो क्या?"
  ],
  "grammarBreakdown": {
    "free": "फ्री (not स्वतंत्र)",
    "now": "अभी"
  },
  "explanation": "Conversational use: 'फ्री' is used instead of rigid 'स्वतंत्र'."
}
```
