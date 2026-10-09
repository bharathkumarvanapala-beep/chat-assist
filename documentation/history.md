# Translation History & Data Lifecycle

## 1. Local-First Default
- Translation history is **OFF by default** (Section 23, 200).
- When turned on, data is saved strictly to local device storage (Android Room DB or browser LocalStorage).
- No periodic cloud uploads or automated synchronization.

## 2. History Security
- **History Protection**: Can be secured behind a device PIN or biometric lock.
- **Auto-Lock Timeouts**: Immediately, 1 minute, 5 minutes (default), 15 minutes, Never.
- **Wipe Actions**: Delete individual items, delete today's translations, or delete all history.

## 3. Data Portability
- **Export Formats**: TXT, CSV, JSON.
- **Import Validation**: Validates schema and ensures integrity before merging.
- **Unified "My Language" Search**: Simultaneously searches past history, phrasebook entries, and saved vocabulary words.
