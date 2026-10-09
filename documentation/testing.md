# Verification & Testing Guide

## 1. Automated Test Execution
Run the automated test suite in the backend directory:
```bash
cd hindi-assist/backend
npm test
```
Outputs:
- Language detection tests (English, Hindi, Telugu).
- Nuance check: "Are you free now?" → "फ्री" without "स्वतंत्र".
- Entity preservation: URLs, emojis, names untouched.
- Tone adaptation: Casual vs Polite.
- Reply assistant generation across tones.
- Correction engine ("Yesterday I am going" → "went").

## 2. WhatsApp End-to-End Workflow Verification
1. User receives WhatsApp message: *"Why didn't you come yesterday?"*
2. User copies message into clipboard.
3. User opens Hindi Assist Keyboard.
4. User taps `[📋 Clipboard]`.
5. Language is automatically identified as English and translated to Hindi: *"तुम कल क्यों नहीं आए?"*.
6. User writes Hindi reply: *"कल थोड़ा काम था।"*.
7. User selects `HI → EN`.
8. Translation candidate displays: *"Had some work yesterday."*.
9. User taps `[Insert]`. Text is committed into WhatsApp text field.
10. User manually taps Send in WhatsApp.
