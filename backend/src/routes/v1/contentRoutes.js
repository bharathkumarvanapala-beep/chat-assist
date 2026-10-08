import express from 'express';
import { db } from '../../db/database.js';
import { requireAdminAuth } from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/v1/content/version
 * Checks the current database content version and record counts
 */
router.get('/version', (req, res) => {
  const meta = db.getMetadata();
  const categories = db.getCategories();
  const vocab = db.getVocabulary({ limit: 1 });
  const phrases = db.getPhrases({ limit: 1 });

  res.json({
    success: true,
    version: meta.version,
    lastUpdatedAt: meta.lastUpdatedAt,
    counts: {
      categories: categories.length,
      vocabulary: vocab.pagination.total,
      phrases: phrases.pagination.total
    }
  });
});

/**
 * GET /api/v1/content/sync
 * Sync endpoint supporting client synchronization
 * Query params: since (ISO timestamp of client's cached version), force (boolean)
 */
router.get('/sync', (req, res) => {
  const since = req.query.since;
  const force = req.query.force === 'true';
  const meta = db.getMetadata();

  if (!force && since && since === meta.version) {
    return res.json({
      success: true,
      upToDate: true,
      version: meta.version,
      message: 'Client content is already up to date.'
    });
  }

  const diff = db.getSyncDiff(force ? null : since);
  res.json({
    success: true,
    upToDate: false,
    ...diff
  });
});

/**
 * POST /api/v1/admin/verify
 * Validates the admin passkey from request body or header
 */
router.post('/admin/verify', requireAdminAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Admin authorization key is valid. Webmaster privileges granted.'
  });
});

/**
 * POST /api/v1/admin/import
 * Bulk imports vocabulary or phrases via JSON or CSV format
 */
router.post('/admin/import', requireAdminAuth, (req, res) => {
  try {
    const { type, items, csvContent } = req.body;

    if (!type || !['vocabulary', 'phrases', 'categories'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid type',
        message: 'Import type must be "vocabulary", "phrases", or "categories".'
      });
    }

    let parsedItems = [];

    if (Array.isArray(items)) {
      parsedItems = items;
    } else if (typeof csvContent === 'string' && csvContent.trim()) {
      // Parse CSV line by line
      const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Empty CSV',
          message: 'CSV must contain a header row and at least one data row.'
        });
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      for (let i = 1; i < lines.length; i++) {
        // Simple comma split respecting quotes
        const rowValues = [];
        let cur = '';
        let insideQuotes = false;
        const line = lines[i];

        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"' || char === "'") {
            insideQuotes = !insideQuotes;
          } else if (char === ',' && !insideQuotes) {
            rowValues.push(cur.trim());
            cur = '';
          } else {
            cur += char;
          }
        }
        rowValues.push(cur.trim());

        const rowObj = {};
        headers.forEach((h, idx) => {
          rowObj[h] = rowValues[idx] || '';
        });

        // Normalize CSV fields to expected schema
        if (rowObj.category && !rowObj.categoryid) {
          rowObj.category = rowObj.category;
        }
        if (rowObj.english) rowObj.english = rowObj.english;
        if (rowObj.hindi) rowObj.hindi = rowObj.hindi;
        if (rowObj.telugu) rowObj.telugu = rowObj.telugu;
        if (rowObj.note) rowObj.note = rowObj.note;
        if (rowObj.tags) rowObj.tags = rowObj.tags.split(';').map(t => t.trim());

        parsedItems.push(rowObj);
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'Missing data',
        message: 'Please provide either an "items" array or "csvContent" string.'
      });
    }

    const result = db.bulkImport(type, parsedItems);
    res.json({
      success: true,
      message: `Bulk import processed: ${result.imported} imported, ${result.rejected} rejected.`,
      result,
      version: db.getMetadata().version
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Import processing failed',
      message: err.message
    });
  }
});

export default router;
