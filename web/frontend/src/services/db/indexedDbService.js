/**
 * Native IndexedDB Service for Hindi Assist
 * 
 * Provides offline-first persistence for:
 * 1. Official Vocabulary & Phrases (synced from backend)
 * 2. Official Categories (synced from backend)
 * 3. User-Specific State (Favorites, Learned status - strictly separated from official content)
 * 4. User Custom Phrases (offline-first personal phrases)
 * 5. Sync Metadata
 */

const DB_NAME = 'HindiAssistDB';
const DB_VERSION = 1;

class IndexedDbService {
  constructor() {
    this.db = null;
    this.initPromise = null;
  }

  async getDb() {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB is not supported in this environment.'));
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Official Vocabulary Store
        if (!db.objectStoreNames.contains('vocabulary')) {
          const vocabStore = db.createObjectStore('vocabulary', { keyPath: 'id' });
          vocabStore.createIndex('category', 'category', { unique: false });
          vocabStore.createIndex('categoryId', 'categoryId', { unique: false });
        }

        // Official Phrases Store
        if (!db.objectStoreNames.contains('phrases')) {
          const phraseStore = db.createObjectStore('phrases', { keyPath: 'id' });
          phraseStore.createIndex('category', 'category', { unique: false });
          phraseStore.createIndex('categoryId', 'categoryId', { unique: false });
        }

        // Categories Store
        if (!db.objectStoreNames.contains('categories')) {
          const catStore = db.createObjectStore('categories', { keyPath: 'id' });
          catStore.createIndex('type', 'type', { unique: false });
        }

        // User State for Vocabulary (Favorites, Learned status)
        if (!db.objectStoreNames.contains('user_state_vocab')) {
          db.createObjectStore('user_state_vocab', { keyPath: 'vocabId' });
        }

        // User State for Phrases (Favorites)
        if (!db.objectStoreNames.contains('user_state_phrases')) {
          db.createObjectStore('user_state_phrases', { keyPath: 'phraseId' });
        }

        // User Custom Phrases (personal phrases created locally)
        if (!db.objectStoreNames.contains('user_custom_phrases')) {
          const customStore = db.createObjectStore('user_custom_phrases', { keyPath: 'id' });
          customStore.createIndex('category', 'category', { unique: false });
        }

        // Sync Metadata Store
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('[IndexedDB] Open error:', event.target.error);
        reject(event.target.error);
      };
    });

    return this.initPromise;
  }

  // ==========================================
  // VOCABULARY
  // ==========================================

  async getAllVocabulary({ category, search, onlyFavorites, learnedFilter } = {}) {
    const db = await this.getDb();
    const vocabList = await this._getAll(db, 'vocabulary');
    const userStateMap = await this._getAllAsMap(db, 'user_state_vocab', 'vocabId');

    // Merge official vocab with user state
    let merged = vocabList.map(item => {
      const uState = userStateMap[item.id] || {};
      return {
        ...item,
        isFavorite: Boolean(uState.isFavorite),
        learnedStatus: uState.learnedStatus || 'new' // 'new' | 'learning' | 'learned'
      };
    });

    if (category && category !== 'All') {
      merged = merged.filter(v => v.category === category || v.categoryId === category);
    }

    if (onlyFavorites) {
      merged = merged.filter(v => v.isFavorite);
    }

    if (learnedFilter && learnedFilter !== 'All') {
      if (learnedFilter === 'Learned') {
        merged = merged.filter(v => v.learnedStatus === 'learned');
      } else if (learnedFilter === 'Not Learned') {
        merged = merged.filter(v => v.learnedStatus !== 'learned');
      }
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      merged = merged.filter(v => {
        return (
          (v.english && v.english.toLowerCase().includes(q)) ||
          (v.hindi && v.hindi.toLowerCase().includes(q)) ||
          (v.telugu && v.telugu.toLowerCase().includes(q)) ||
          (v.transliteration && v.transliteration.toLowerCase().includes(q)) ||
          (v.definition && v.definition.toLowerCase().includes(q)) ||
          (v.tags && Array.isArray(v.tags) && v.tags.some(t => t.toLowerCase().includes(q)))
        );
      });
    }

    return merged.sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
  }

  async getVocabularyCount() {
    const db = await this.getDb();
    return this._count(db, 'vocabulary');
  }

  async putVocabularyList(items) {
    const db = await this.getDb();
    return this._putBatch(db, 'vocabulary', items);
  }

  async deleteVocabularyByIds(ids) {
    const db = await this.getDb();
    return this._deleteBatch(db, 'vocabulary', ids);
  }

  async toggleVocabFavorite(vocabId) {
    const db = await this.getDb();
    const state = (await this._get(db, 'user_state_vocab', vocabId)) || { vocabId };
    state.isFavorite = !state.isFavorite;
    state.updatedAt = Date.now();
    await this._put(db, 'user_state_vocab', state);
    return state.isFavorite;
  }

  async setVocabLearnedStatus(vocabId, status) {
    const db = await this.getDb();
    const state = (await this._get(db, 'user_state_vocab', vocabId)) || { vocabId };
    state.learnedStatus = status; // 'new' | 'learning' | 'learned'
    state.updatedAt = Date.now();
    await this._put(db, 'user_state_vocab', state);
    return state.learnedStatus;
  }

  // ==========================================
  // PHRASES (Official + User Custom)
  // ==========================================

  async getAllPhrases({ category, search, onlyFavorites, onlyCustom } = {}) {
    const db = await this.getDb();
    const officialList = await this._getAll(db, 'phrases');
    const customList = await this._getAll(db, 'user_custom_phrases');
    const userStateMap = await this._getAllAsMap(db, 'user_state_phrases', 'phraseId');

    // Combine official with custom phrases
    let all = [
      ...officialList.map(item => {
        const uState = userStateMap[item.id] || {};
        return {
          ...item,
          isFavorite: Boolean(uState.isFavorite),
          source: 'admin'
        };
      }),
      ...customList.map(item => ({
        ...item,
        isCustom: true,
        source: 'user'
      }))
    ];

    if (onlyCustom) {
      all = all.filter(p => p.source === 'user');
    }

    if (category && category !== 'All') {
      if (category === 'Custom') {
        all = all.filter(p => p.source === 'user');
      } else {
        all = all.filter(p => p.category === category || p.categoryId === category);
      }
    }

    if (onlyFavorites) {
      all = all.filter(p => p.isFavorite);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      all = all.filter(p => {
        return (
          (p.english && p.english.toLowerCase().includes(q)) ||
          (p.hindi && p.hindi.toLowerCase().includes(q)) ||
          (p.telugu && p.telugu.toLowerCase().includes(q)) ||
          (p.transliteration && p.transliteration.toLowerCase().includes(q)) ||
          (p.note && p.note.toLowerCase().includes(q)) ||
          (p.userNote && p.userNote.toLowerCase().includes(q)) ||
          (p.tags && Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(q)))
        );
      });
    }

    return all.sort((a, b) => {
      // Put custom phrases on top or by sortOrder
      if (a.source === 'user' && b.source !== 'user') return -1;
      if (b.source === 'user' && a.source !== 'user') return 1;
      return (a.sortOrder || 999) - (b.sortOrder || 999);
    });
  }

  async getPhrasesCount() {
    const db = await this.getDb();
    return this._count(db, 'phrases');
  }

  async putPhrasesList(items) {
    const db = await this.getDb();
    return this._putBatch(db, 'phrases', items);
  }

  async deletePhrasesByIds(ids) {
    const db = await this.getDb();
    return this._deleteBatch(db, 'phrases', ids);
  }

  async togglePhraseFavorite(phraseId) {
    const db = await this.getDb();
    // Check if it's a custom phrase
    const custom = await this._get(db, 'user_custom_phrases', phraseId);
    if (custom) {
      custom.isFavorite = !custom.isFavorite;
      await this._put(db, 'user_custom_phrases', custom);
      return custom.isFavorite;
    }

    // Official phrase favorite
    const state = (await this._get(db, 'user_state_phrases', phraseId)) || { phraseId };
    state.isFavorite = !state.isFavorite;
    state.updatedAt = Date.now();
    await this._put(db, 'user_state_phrases', state);
    return state.isFavorite;
  }

  async addCustomPhrase(phrase) {
    const db = await this.getDb();
    const newPhrase = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      english: String(phrase.english).trim(),
      hindi: String(phrase.hindi).trim(),
      telugu: String(phrase.telugu || '').trim(),
      category: phrase.category || 'Custom',
      categoryId: 'cat-custom',
      note: String(phrase.note || phrase.userNote || '').trim(),
      userNote: String(phrase.note || phrase.userNote || '').trim(),
      isFavorite: Boolean(phrase.isFavorite),
      source: 'user',
      createdAt: new Date().toISOString()
    };
    await this._put(db, 'user_custom_phrases', newPhrase);
    return newPhrase;
  }

  async deleteCustomPhrase(phraseId) {
    const db = await this.getDb();
    return this._delete(db, 'user_custom_phrases', phraseId);
  }

  // ==========================================
  // CATEGORIES
  // ==========================================

  async getAllCategories(type = 'both') {
    const db = await this.getDb();
    let categories = await this._getAll(db, 'categories');
    if (type && type !== 'all' && type !== 'both') {
      categories = categories.filter(c => c.type === 'both' || c.type === type);
    }
    return categories.sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
  }

  async getCategoriesCount() {
    const db = await this.getDb();
    return this._count(db, 'categories');
  }

  async putCategoriesList(items) {
    const db = await this.getDb();
    return this._putBatch(db, 'categories', items);
  }

  async deleteCategoriesByIds(ids) {
    const db = await this.getDb();
    return this._deleteBatch(db, 'categories', ids);
  }

  // ==========================================
  // METADATA
  // ==========================================

  async getMeta(key) {
    const db = await this.getDb();
    const record = await this._get(db, 'meta', key);
    return record ? record.value : null;
  }

  async setMeta(key, value) {
    const db = await this.getDb();
    await this._put(db, 'meta', { key, value, updatedAt: Date.now() });
  }

  // ==========================================
  // INTERNAL PROMISE HELPERS
  // ==========================================

  _getAll(db, storeName) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async _getAllAsMap(db, storeName, keyProp) {
    const list = await this._getAll(db, storeName);
    const map = {};
    for (const item of list) {
      if (item[keyProp]) map[item[keyProp]] = item;
    }
    return map;
  }

  _get(db, storeName, key) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  _put(db, storeName, item) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  _delete(db, storeName, key) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  _putBatch(db, storeName, items) {
    if (!items || items.length === 0) return Promise.resolve(0);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      for (const item of items) {
        store.put(item);
      }
      tx.oncomplete = () => resolve(items.length);
      tx.onerror = () => reject(tx.error);
    });
  }

  _count(db, storeName) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.count();
      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => reject(req.error);
    });
  }

  _deleteBatch(db, storeName, keys) {
    if (!keys || keys.length === 0) return Promise.resolve(0);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      for (const key of keys) {
        store.delete(key);
      }
      tx.oncomplete = () => resolve(keys.length);
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const idbService = new IndexedDbService();
