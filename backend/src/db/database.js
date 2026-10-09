import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SEED_CATEGORIES, SEED_VOCABULARY, SEED_PHRASES } from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');

class DatabaseService {
  constructor() {
    this.dataDir = DATA_DIR;
    this.ensureDirectory();
    this.initDatabase();
  }

  ensureDirectory() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  getFilePath(collectionName) {
    return path.join(this.dataDir, `${collectionName}.json`);
  }

  readCollection(collectionName) {
    const file = this.getFilePath(collectionName);
    try {
      if (!fs.existsSync(file)) return [];
      const content = fs.readFileSync(file, 'utf8');
      return JSON.parse(content);
    } catch (err) {
      console.error(`[DB] Error reading collection ${collectionName}:`, err.message);
      return [];
    }
  }

  writeCollection(collectionName, data) {
    const file = this.getFilePath(collectionName);
    const tempFile = `${file}.tmp`;
    try {
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempFile, file);
      return true;
    } catch (err) {
      console.error(`[DB] Error writing collection ${collectionName}:`, err.message);
      if (fs.existsSync(tempFile)) {
        try { fs.unlinkSync(tempFile); } catch {}
      }
      return false;
    }
  }

  getMetadata() {
    const file = this.getFilePath('metadata');
    try {
      if (!fs.existsSync(file)) {
        const initial = {
          version: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        this.writeCollection('metadata', initial);
        return initial;
      }
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      return {
        version: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString()
      };
    }
  }

  touchVersion() {
    const now = new Date().toISOString();
    const meta = {
      ...this.getMetadata(),
      version: now,
      lastUpdatedAt: now
    };
    this.writeCollection('metadata', meta);
    return meta;
  }

  initDatabase() {
    const catFile = this.getFilePath('categories');
    const vocabFile = this.getFilePath('vocabulary');
    const phraseFile = this.getFilePath('phrases');

    let seeded = false;
    if (!fs.existsSync(catFile)) {
      this.writeCollection('categories', SEED_CATEGORIES);
      seeded = true;
    }
    if (!fs.existsSync(vocabFile)) {
      this.writeCollection('vocabulary', SEED_VOCABULARY);
      seeded = true;
    }
    if (!fs.existsSync(phraseFile)) {
      this.writeCollection('phrases', SEED_PHRASES);
      seeded = true;
    }
    if (seeded || !fs.existsSync(this.getFilePath('metadata'))) {
      this.touchVersion();
      console.log('[DB] Database initialized and seeded successfully.');
    }
  }

  // ==========================================
  // CATEGORIES
  // ==========================================

  getCategories({ type, isActive = true, includeInactive = false } = {}) {
    let items = this.readCollection('categories');
    if (!includeInactive) {
      items = items.filter(c => c.isActive !== false);
    }
    if (type && type !== 'all') {
      items = items.filter(c => c.type === 'both' || c.type === type);
    }
    return items.sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
  }

  getCategoryById(id) {
    const items = this.readCollection('categories');
    return items.find(c => c.id === id) || null;
  }

  createCategory(data) {
    const items = this.readCollection('categories');
    const now = new Date().toISOString();
    const newCategory = {
      id: data.id || `cat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: String(data.name || '').trim(),
      type: data.type || 'both',
      description: String(data.description || '').trim(),
      isActive: data.isActive !== false,
      sortOrder: Number(data.sortOrder) || items.length + 1,
      createdAt: now,
      updatedAt: now
    };

    if (!newCategory.name) throw new Error('Category name is required.');

    items.push(newCategory);
    this.writeCollection('categories', items);
    this.touchVersion();
    return newCategory;
  }

  updateCategory(id, data) {
    const items = this.readCollection('categories');
    const index = items.findIndex(c => c.id === id);
    if (index === -1) return null;

    const existing = items[index];
    const now = new Date().toISOString();
    const updated = {
      ...existing,
      ...data,
      id: existing.id, // prevent changing ID
      updatedAt: now
    };

    items[index] = updated;
    this.writeCollection('categories', items);
    this.touchVersion();
    return updated;
  }

  deleteCategory(id, soft = true) {
    const items = this.readCollection('categories');
    const index = items.findIndex(c => c.id === id);
    if (index === -1) return false;

    if (soft) {
      items[index].isActive = false;
      items[index].updatedAt = new Date().toISOString();
    } else {
      items.splice(index, 1);
    }

    this.writeCollection('categories', items);
    this.touchVersion();
    return true;
  }

  // ==========================================
  // VOCABULARY
  // ==========================================

  getVocabulary({ categoryId, search, page = 1, limit = 50, isActive = true, includeInactive = false } = {}) {
    let items = this.readCollection('vocabulary');
    if (!includeInactive) {
      items = items.filter(v => v.isActive !== false);
    }
    if (categoryId && categoryId !== 'All') {
      items = items.filter(v => v.categoryId === categoryId || v.category?.toLowerCase() === categoryId.toLowerCase());
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(v => {
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

    // Sort by sortOrder or newest
    items.sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999) || new Date(b.createdAt) - new Date(a.createdAt));

    const total = items.length;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;
    const paginated = items.slice(offset, offset + limitNum);

    return {
      items: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  getVocabularyById(id) {
    const items = this.readCollection('vocabulary');
    return items.find(v => v.id === id) || null;
  }

  createVocabulary(data) {
    const items = this.readCollection('vocabulary');
    const now = new Date().toISOString();

    if (!data.english?.trim()) throw new Error('English word is required.');
    if (!data.hindi?.trim()) throw new Error('Hindi translation is required.');

    const newVocab = {
      id: data.id || `vocab-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      english: String(data.english).trim(),
      hindi: String(data.hindi).trim(),
      telugu: String(data.telugu || '').trim(),
      transliteration: String(data.transliteration || '').trim(),
      pronunciation: String(data.pronunciation || '').trim(),
      definition: String(data.definition || '').trim(),
      exampleEnglish: String(data.exampleEnglish || data.example_en || '').trim(),
      exampleHindi: String(data.exampleHindi || data.example_hi || '').trim(),
      exampleTelugu: String(data.exampleTelugu || data.example_te || '').trim(),
      categoryId: data.categoryId || 'cat-conversational',
      category: data.category || 'Conversational',
      tags: Array.isArray(data.tags) ? data.tags : (typeof data.tags === 'string' ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : []),
      isActive: data.isActive !== false,
      sortOrder: Number(data.sortOrder) || items.length + 1,
      createdAt: now,
      updatedAt: now,
      version: 1
    };

    items.push(newVocab);
    this.writeCollection('vocabulary', items);
    this.touchVersion();
    return newVocab;
  }

  updateVocabulary(id, data) {
    const items = this.readCollection('vocabulary');
    const index = items.findIndex(v => v.id === id);
    if (index === -1) return null;

    const existing = items[index];
    const now = new Date().toISOString();

    const updated = {
      ...existing,
      ...data,
      id: existing.id, // prevent changing ID
      tags: Array.isArray(data.tags) ? data.tags : (data.tags !== undefined ? (typeof data.tags === 'string' ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : existing.tags) : existing.tags),
      version: (existing.version || 1) + 1,
      updatedAt: now
    };

    items[index] = updated;
    this.writeCollection('vocabulary', items);
    this.touchVersion();
    return updated;
  }

  deleteVocabulary(id, soft = true) {
    const items = this.readCollection('vocabulary');
    const index = items.findIndex(v => v.id === id);
    if (index === -1) return false;

    if (soft) {
      items[index].isActive = false;
      items[index].updatedAt = new Date().toISOString();
      items[index].version = (items[index].version || 1) + 1;
    } else {
      items.splice(index, 1);
    }

    this.writeCollection('vocabulary', items);
    this.touchVersion();
    return true;
  }

  // ==========================================
  // PHRASES
  // ==========================================

  getPhrases({ categoryId, search, page = 1, limit = 50, isActive = true, includeInactive = false } = {}) {
    let items = this.readCollection('phrases');
    if (!includeInactive) {
      items = items.filter(p => p.isActive !== false);
    }
    if (categoryId && categoryId !== 'All') {
      items = items.filter(p => p.categoryId === categoryId || p.category?.toLowerCase() === categoryId.toLowerCase());
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(p => {
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

    // Sort by sortOrder or newest
    items.sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999) || new Date(b.createdAt) - new Date(a.createdAt));

    const total = items.length;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;
    const paginated = items.slice(offset, offset + limitNum);

    return {
      items: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  getPhraseById(id) {
    const items = this.readCollection('phrases');
    return items.find(p => p.id === id) || null;
  }

  createPhrase(data) {
    const items = this.readCollection('phrases');
    const now = new Date().toISOString();

    if (!data.english?.trim()) throw new Error('English phrase is required.');
    if (!data.hindi?.trim()) throw new Error('Hindi phrase is required.');

    const newPhrase = {
      id: data.id || `phrase-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      english: String(data.english).trim(),
      hindi: String(data.hindi).trim(),
      telugu: String(data.telugu || '').trim(),
      transliteration: String(data.transliteration || '').trim(),
      pronunciation: String(data.pronunciation || '').trim(),
      categoryId: data.categoryId || 'cat-friends',
      category: data.category || 'Friends',
      note: String(data.note || data.userNote || '').trim(),
      tags: Array.isArray(data.tags) ? data.tags : (typeof data.tags === 'string' ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : []),
      isActive: data.isActive !== false,
      sortOrder: Number(data.sortOrder) || items.length + 1,
      createdAt: now,
      updatedAt: now,
      version: 1
    };

    items.push(newPhrase);
    this.writeCollection('phrases', items);
    this.touchVersion();
    return newPhrase;
  }

  updatePhrase(id, data) {
    const items = this.readCollection('phrases');
    const index = items.findIndex(p => p.id === id);
    if (index === -1) return null;

    const existing = items[index];
    const now = new Date().toISOString();

    const updated = {
      ...existing,
      ...data,
      id: existing.id, // prevent changing ID
      tags: Array.isArray(data.tags) ? data.tags : (data.tags !== undefined ? (typeof data.tags === 'string' ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : existing.tags) : existing.tags),
      version: (existing.version || 1) + 1,
      updatedAt: now
    };

    items[index] = updated;
    this.writeCollection('phrases', items);
    this.touchVersion();
    return updated;
  }

  deletePhrase(id, soft = true) {
    const items = this.readCollection('phrases');
    const index = items.findIndex(p => p.id === id);
    if (index === -1) return false;

    if (soft) {
      items[index].isActive = false;
      items[index].updatedAt = new Date().toISOString();
      items[index].version = (items[index].version || 1) + 1;
    } else {
      items.splice(index, 1);
    }

    this.writeCollection('phrases', items);
    this.touchVersion();
    return true;
  }

  // ==========================================
  // SYNCHRONIZATION
  // ==========================================

  getSyncDiff(sinceTimestamp) {
    const meta = this.getMetadata();
    const categories = this.readCollection('categories');
    const vocabulary = this.readCollection('vocabulary');
    const phrases = this.readCollection('phrases');

    // If client has no timestamp or invalid date, return all active items
    if (!sinceTimestamp) {
      return {
        version: meta.version,
        isIncremental: false,
        categories: {
          added: categories.filter(c => c.isActive !== false),
          updated: [],
          deleted: []
        },
        vocabulary: {
          added: vocabulary.filter(v => v.isActive !== false),
          updated: [],
          deleted: []
        },
        phrases: {
          added: phrases.filter(p => p.isActive !== false),
          updated: [],
          deleted: []
        }
      };
    }

    const sinceDate = new Date(sinceTimestamp);
    if (isNaN(sinceDate.getTime())) {
      return this.getSyncDiff(null);
    }

    const partition = (list) => {
      const added = [];
      const updated = [];
      const deleted = [];

      for (const item of list) {
        const itemUpdated = new Date(item.updatedAt || item.createdAt);
        if (itemUpdated > sinceDate) {
          if (item.isActive === false) {
            deleted.push(item.id);
          } else {
            const itemCreated = new Date(item.createdAt);
            if (itemCreated > sinceDate) {
              added.push(item);
            } else {
              updated.push(item);
            }
          }
        }
      }
      return { added, updated, deleted };
    };

    return {
      version: meta.version,
      isIncremental: true,
      categories: partition(categories),
      vocabulary: partition(vocabulary),
      phrases: partition(phrases)
    };
  }

  // ==========================================
  // BULK IMPORT
  // ==========================================

  bulkImport(type, items) {
    if (!Array.isArray(items)) {
      throw new Error('Items must be an array');
    }

    let imported = 0;
    let rejected = 0;
    const errors = [];

    if (type === 'vocabulary') {
      for (let i = 0; i < items.length; i++) {
        const row = items[i];
        if (!row.english || !row.hindi) {
          rejected++;
          errors.push(`Row ${i + 1}: English and Hindi are required.`);
          continue;
        }
        try {
          this.createVocabulary(row);
          imported++;
        } catch (e) {
          rejected++;
          errors.push(`Row ${i + 1}: ${e.message}`);
        }
      }
    } else if (type === 'phrases') {
      for (let i = 0; i < items.length; i++) {
        const row = items[i];
        if (!row.english || !row.hindi) {
          rejected++;
          errors.push(`Row ${i + 1}: English and Hindi are required.`);
          continue;
        }
        try {
          this.createPhrase(row);
          imported++;
        } catch (e) {
          rejected++;
          errors.push(`Row ${i + 1}: ${e.message}`);
        }
      }
    } else if (type === 'categories') {
      for (let i = 0; i < items.length; i++) {
        const row = items[i];
        if (!row.name) {
          rejected++;
          errors.push(`Row ${i + 1}: Category name is required.`);
          continue;
        }
        try {
          this.createCategory(row);
          imported++;
        } catch (e) {
          rejected++;
          errors.push(`Row ${i + 1}: ${e.message}`);
        }
      }
    } else {
      throw new Error(`Unsupported import type: ${type}`);
    }

    return { imported, rejected, errors };
  }
}

export const db = new DatabaseService();
