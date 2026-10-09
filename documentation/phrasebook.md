# Phrasebook System Architecture

## 1. Distinction from History
- **History**: Ephemeral log of past translation queries.
- **Phrasebook**: Deliberately curated library of reusable expressions categorized for immediate communication.

## 2. Categories Supported
- Greetings
- Friends
- Family
- Work
- Travel
- Common Replies
- Important
- Custom

## 3. Data Schema
```json
{
  "id": "phrase-1",
  "english": "Are you free now?",
  "hindi": "क्या तुम अभी फ्री हो?",
  "telugu": "నువ్వు ఇప్పుడు ఖాళీగా ఉన్నావా?",
  "category": "Friends",
  "tone": "Casual",
  "isFavorite": true,
  "userNote": "Conversational WhatsApp phrase."
}
```
