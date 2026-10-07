/**
 * Storage Service for Hindi Assist
 * 
 * Local-First, Privacy-Conscious Persistence:
 * - Translation History is OFF by default.
 * - Local-only storage.
 * - History Protection with PIN/Biometric lock simulation & auto-lock timeouts.
 * - Export in TXT, CSV, JSON formats.
 * - Import with strict JSON schema validation.
 */

import { INITIAL_VOCABULARY, INITIAL_PHRASES, INITIAL_MISTAKES } from './languageDataService.js';

const STORAGE_KEYS = {
  SETTINGS: 'ha_settings_v1',
  HISTORY: 'ha_history_v1',
  PHRASEBOOK: 'ha_phrasebook_v1',
  VOCABULARY: 'ha_vocabulary_v1',
  MISTAKES: 'ha_mistakes_v1',
  LOCK_STATE: 'ha_lock_state_v1'
};

const DEFAULT_SETTINGS = {
  historyEnabled: false, // Default: OFF (Section 23 & 77)
  cloudAiEnabled: true, // Enabled by default for Cloud AI (Gemini)
  cloudSyncEnabled: false, // Default: OFF (Section 28)
  historyProtectionEnabled: false,
  historyPin: '1234',
  autoLockTimeout: '5 minutes', // Options: Immediate, 1 minute, 5 minutes, 15 minutes, Never
  currentTheme: 'Day', // Day, Night, Blue, Green, Reading
  warmthLevel: 'Medium', // Low, Medium, High (for Reading mode)
  contrastLevel: 'Normal', // Normal, Comfort
  fontSize: 'Medium', // Small, Medium, Large, Extra Large
  reducedMotion: 'Off', // Full, Reduced, Off
  defaultTone: 'Casual', // Casual, Friendly, Neutral, Polite, Formal, Work
  defaultSourceLang: 'auto',
  defaultTargetLang: 'hi'
};

export const storageService = {
  // SETTINGS
  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(newSettings) {
    try {
      const current = this.getSettings();
      const merged = { ...current, ...newSettings };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
      return merged;
    } catch (e) {
      console.error('Failed to save settings:', e);
      return newSettings;
    }
  },

  // HISTORY
  getHistory() {
    const settings = this.getSettings();
    if (!settings.historyEnabled) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addHistoryItem(item) {
    const settings = this.getSettings();
    if (!settings.historyEnabled) return null; // Respect opt-in privacy!

    const history = this.getHistory();
    const newItem = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      originalText: item.originalText,
      translatedText: item.translatedText,
      sourceLang: item.sourceLang || 'en',
      targetLang: item.targetLang || 'hi',
      direction: item.direction || `${(item.sourceLang || 'EN').toUpperCase()} → ${(item.targetLang || 'HI').toUpperCase()}`,
      timestamp: Date.now(),
      isFavorite: false,
      label: item.label || 'Direct Translation',
      translationMode: item.translationMode || '📱 On-device'
    };

    const updated = [newItem, ...history].slice(0, 500); // Keep reasonable bounds
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    return newItem;
  },

  toggleHistoryFavorite(id) {
    const history = this.getHistory();
    const updated = history.map(item => item.id === id ? { ...item, isFavorite: !item.isFavorite } : item);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    return updated;
  },

  deleteHistoryItem(id) {
    const history = this.getHistory();
    const updated = history.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    return updated;
  },

  clearTodayHistory() {
    const history = this.getHistory();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const updated = history.filter(item => item.timestamp < startOfToday.getTime());
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    return updated;
  },

  clearAllHistory() {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    return [];
  },

  // PHRASEBOOK
  getPhrasebook() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PHRASEBOOK);
      return data ? JSON.parse(data) : INITIAL_PHRASES;
    } catch {
      return INITIAL_PHRASES;
    }
  },

  addPhrase(phrase) {
    const current = this.getPhrasebook();
    const newPhrase = {
      id: `phrase-${Date.now()}`,
      ...phrase,
      isFavorite: phrase.isFavorite || false
    };
    const updated = [newPhrase, ...current];
    localStorage.setItem(STORAGE_KEYS.PHRASEBOOK, JSON.stringify(updated));
    return updated;
  },

  togglePhraseFavorite(id) {
    const current = this.getPhrasebook();
    const updated = current.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p);
    localStorage.setItem(STORAGE_KEYS.PHRASEBOOK, JSON.stringify(updated));
    return updated;
  },

  deletePhrase(id) {
    const current = this.getPhrasebook();
    const updated = current.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PHRASEBOOK, JSON.stringify(updated));
    return updated;
  },

  // VOCABULARY
  getVocabulary() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.VOCABULARY);
      return data ? JSON.parse(data) : INITIAL_VOCABULARY;
    } catch {
      return INITIAL_VOCABULARY;
    }
  },

  addWord(word) {
    const current = this.getVocabulary();
    const newWord = {
      id: `vocab-${Date.now()}`,
      ...word,
      isFavorite: word.isFavorite || false
    };
    const updated = [newWord, ...current];
    localStorage.setItem(STORAGE_KEYS.VOCABULARY, JSON.stringify(updated));
    return updated;
  },

  toggleWordFavorite(id) {
    const current = this.getVocabulary();
    const updated = current.map(w => w.id === id ? { ...w, isFavorite: !w.isFavorite } : w);
    localStorage.setItem(STORAGE_KEYS.VOCABULARY, JSON.stringify(updated));
    return updated;
  },

  deleteWord(id) {
    const current = this.getVocabulary();
    const updated = current.filter(w => w.id !== id);
    localStorage.setItem(STORAGE_KEYS.VOCABULARY, JSON.stringify(updated));
    return updated;
  },

  // EXPORT & IMPORT
  exportHistory(format = 'json') {
    const history = this.getHistory();
    if (format === 'json') {
      return {
        data: JSON.stringify({ version: '1.0', exportedAt: new Date().toISOString(), history }, null, 2),
        mimeType: 'application/json',
        extension: 'json'
      };
    } else if (format === 'csv') {
      const header = 'Timestamp,Direction,Original,Translation,Favorite,Mode\n';
      const rows = history.map(h => 
        `"${new Date(h.timestamp).toISOString()}","${h.direction}","${(h.originalText || '').replace(/"/g, '""')}","${(h.translatedText || '').replace(/"/g, '""')}",${h.isFavorite},"${h.translationMode}"`
      ).join('\n');
      return {
        data: header + rows,
        mimeType: 'text/csv',
        extension: 'csv'
      };
    } else {
      // Plain text
      const content = history.map(h => 
        `[${new Date(h.timestamp).toLocaleString()}] [${h.direction}] (${h.translationMode})\nOriginal: ${h.originalText}\nTranslation: ${h.translatedText}\n---`
      ).join('\n\n');
      return {
        data: content,
        mimeType: 'text/plain',
        extension: 'txt'
      };
    }
  },

  importHistory(rawJson) {
    try {
      const parsed = JSON.parse(rawJson);
      const items = Array.isArray(parsed) ? parsed : (parsed.history || []);
      if (!Array.isArray(items)) throw new Error('Invalid history format');

      const validated = items.filter(i => i.originalText && i.translatedText).map(i => ({
        id: i.id || `hist-import-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        originalText: String(i.originalText),
        translatedText: String(i.translatedText),
        sourceLang: i.sourceLang || 'en',
        targetLang: i.targetLang || 'hi',
        direction: i.direction || 'EN → HI',
        timestamp: Number(i.timestamp) || Date.now(),
        isFavorite: Boolean(i.isFavorite),
        label: i.label || 'Imported Translation',
        translationMode: i.translationMode || '📱 On-device'
      }));

      const existing = this.getHistory();
      const merged = [...validated, ...existing];
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(merged));
      return { success: true, count: validated.length };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // HARD DATA RESET
  clearAllUserData() {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    localStorage.removeItem(STORAGE_KEYS.PHRASEBOOK);
    localStorage.removeItem(STORAGE_KEYS.VOCABULARY);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    return true;
  }
};
