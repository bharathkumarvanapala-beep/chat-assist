# Translation Nuance & Quality Standards

## 1. Conversational Priority
In accordance with Section 5 of the Product Specification, Hindi Assist follows strict priority:
1. Meaning
2. Natural conversation
3. Context
4. Tone
5. Grammar
6. Politeness
7. Indian conversational usage

## 2. Nuance Case Studies

### 2.1 The "Free" Context
- **English**: "Are you free now?"
- **Natural Hindi**: "क्या तुम अभी फ्री हो?" (or "क्या तुम अभी खाली हो?")
- **Incorrect Robotic**: "क्या तुम अभी स्वतंत्र हो?" (Never translate availability as political freedom/independence).

### 2.2 Preservation of Critical Entities
Entity masking safeguards URLs, emojis, numbers, and proper names before translation:
- Names: "Bharath, I will call you tomorrow." → "Bharath, मैं तुम्हें कल कॉल करूँगा।"
- URLs: "Check https://example.com" → Preserved untouched.
- Emojis: "Are you coming tomorrow? 😊" → "क्या तुम कल आ रहे हो? 😊"

### 2.3 Tone Variations
- **Casual**: "तुम कब आ रहे हो?"
- **Polite**: "आप कब आ रहे हैं?"
- **Formal**: "कृपया अपने आगमन का समय सूचित करें।"
