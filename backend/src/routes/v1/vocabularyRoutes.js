import express from 'express';
import { db } from '../../db/database.js';
import { requireAdminAuth } from '../../middleware/authMiddleware.js';

import { geminiService } from '../../services/geminiService.js';
import { lookupOfflineLexicon } from '../../services/localDictionary.js';

const router = express.Router();

/**
 * GET /api/v1/vocabulary/lookup?word=remember
 * Checks offline database first; if not present, dynamically looks up the
 * word and stores it in the database for permanent offline caching.
 */
router.get('/lookup', async (req, res) => {
  const word = (req.query.word || req.query.q || '').trim();
  if (!word) {
    return res.status(400).json({ success: false, error: 'Query word is required' });
  }

  // 1. Check local database
  const searchResult = db.getVocabulary({ search: word, limit: 10 });
  const exactMatch = searchResult.items.find(v =>
    v.english.toLowerCase() === word.toLowerCase() ||
    (v.hindi && v.hindi.includes(word)) ||
    (v.telugu && v.telugu.includes(word))
  );

  if (exactMatch) {
    return res.json({
      success: true,
      found: true,
      source: 'database_exact',
      data: exactMatch,
      matches: searchResult.items,
      version: db.getMetadata().version
    });
  }

  if (searchResult.items.length > 0) {
    return res.json({
      success: true,
      found: true,
      source: 'database_match',
      data: searchResult.items[0],
      matches: searchResult.items,
      version: db.getMetadata().version
    });
  }

  // 2. Dynamic lookup via Gemini if word not in database
  let dynamicEntry = null;
  if (geminiService.isConfigured()) {
    try {
      dynamicEntry = await geminiService.lookupDictionaryWord(word);
    } catch (e) {
      console.warn('[Vocabulary] Gemini lookup error:', e.message);
    }
  }

  // 3. Fallback to offline local dictionary if Gemini returned null or hit quota limit
  if (!dynamicEntry || !dynamicEntry.hindi) {
    dynamicEntry = lookupOfflineLexicon(word);
  }

  if (dynamicEntry && dynamicEntry.hindi) {
    try {
      const created = db.createVocabulary({
        english: dynamicEntry.english || word.toLowerCase(),
        hindi: dynamicEntry.hindi,
        telugu: dynamicEntry.telugu || '',
        transliteration: dynamicEntry.transliteration || '',
        pronunciation: dynamicEntry.pronunciation || '',
        definition: dynamicEntry.definition || `Conversational translation for ${word}`,
        exampleEnglish: dynamicEntry.exampleEnglish || `Example for ${word}`,
        exampleHindi: dynamicEntry.exampleHindi || dynamicEntry.hindi,
        exampleTelugu: dynamicEntry.exampleTelugu || dynamicEntry.telugu || '',
        category: dynamicEntry.category || 'Conversational',
        categoryId: 'cat-conversational',
        tags: dynamicEntry.tags || ['dictionary', 'lookup']
      });

      return res.json({
        success: true,
        found: true,
        source: 'dynamically_saved',
        data: created,
        matches: [created],
        version: db.getMetadata().version
      });
    } catch (saveErr) {
      console.warn('[Vocabulary] Error saving dynamic word:', saveErr.message);
    }
  }

  return res.json({
    success: false,
    found: false,
    message: `No dictionary match found for "${word}".`,
    data: null,
    matches: []
  });
});

/**
 * GET /api/v1/vocabulary/search?q=hello
 */
router.get('/search', (req, res) => {
  const query = req.query.q || req.query.query || '';
  const result = db.getVocabulary({
    search: query,
    page: req.query.page,
    limit: req.query.limit,
    includeInactive: req.query.includeInactive === 'true'
  });

  res.json({
    success: true,
    data: result.items,
    pagination: result.pagination,
    version: db.getMetadata().version
  });
});

/**
 * GET /api/v1/vocabulary
 * Query params: category, search, page, limit, includeInactive
 */
router.get('/', (req, res) => {
  const result = db.getVocabulary({
    categoryId: req.query.category || req.query.categoryId,
    search: req.query.search || req.query.q,
    page: req.query.page,
    limit: req.query.limit,
    includeInactive: req.query.includeInactive === 'true'
  });

  res.json({
    success: true,
    data: result.items,
    pagination: result.pagination,
    version: db.getMetadata().version
  });
});

/**
 * GET /api/v1/vocabulary/:id
 */
router.get('/:id', (req, res) => {
  const item = db.getVocabularyById(req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, error: 'Not Found', message: 'Vocabulary item not found.' });
  }
  res.json({ success: true, data: item });
});

/**
 * POST /api/v1/vocabulary (Admin Protected)
 */
router.post('/', requireAdminAuth, (req, res) => {
  try {
    const newItem = db.createVocabulary(req.body);
    res.status(201).json({
      success: true,
      message: 'Vocabulary word created successfully.',
      data: newItem,
      version: db.getMetadata().version
    });
  } catch (err) {
    res.status(400).json({ success: false, error: 'Validation Error', message: err.message });
  }
});

/**
 * PUT /api/v1/vocabulary/:id (Admin Protected)
 */
router.put('/:id', requireAdminAuth, (req, res) => {
  try {
    const updated = db.updateVocabulary(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Not Found', message: 'Vocabulary item not found.' });
    }
    res.json({
      success: true,
      message: 'Vocabulary word updated successfully.',
      data: updated,
      version: db.getMetadata().version
    });
  } catch (err) {
    res.status(400).json({ success: false, error: 'Update Error', message: err.message });
  }
});

/**
 * DELETE /api/v1/vocabulary/:id (Admin Protected, Soft Delete by default)
 */
router.delete('/:id', requireAdminAuth, (req, res) => {
  const isHardDelete = req.query.hard === 'true';
  const success = db.deleteVocabulary(req.params.id, !isHardDelete);
  if (!success) {
    return res.status(404).json({ success: false, error: 'Not Found', message: 'Vocabulary item not found.' });
  }
  res.json({
    success: true,
    message: isHardDelete ? 'Vocabulary item permanently deleted.' : 'Vocabulary item deactivated (soft deleted).',
    version: db.getMetadata().version
  });
});

export default router;
