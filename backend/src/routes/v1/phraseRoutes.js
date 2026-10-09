import express from 'express';
import { db } from '../../db/database.js';
import { requireAdminAuth } from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/v1/phrases/search?q=where
 */
router.get('/search', (req, res) => {
  const query = req.query.q || req.query.query || '';
  const result = db.getPhrases({
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
 * GET /api/v1/phrases
 * Query params: category, search, page, limit, includeInactive
 */
router.get('/', (req, res) => {
  const result = db.getPhrases({
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
 * GET /api/v1/phrases/:id
 */
router.get('/:id', (req, res) => {
  const item = db.getPhraseById(req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, error: 'Not Found', message: 'Phrase item not found.' });
  }
  res.json({ success: true, data: item });
});

/**
 * POST /api/v1/phrases (Admin Protected)
 */
router.post('/', requireAdminAuth, (req, res) => {
  try {
    const newItem = db.createPhrase(req.body);
    res.status(201).json({
      success: true,
      message: 'Phrase created successfully.',
      data: newItem,
      version: db.getMetadata().version
    });
  } catch (err) {
    res.status(400).json({ success: false, error: 'Validation Error', message: err.message });
  }
});

/**
 * PUT /api/v1/phrases/:id (Admin Protected)
 */
router.put('/:id', requireAdminAuth, (req, res) => {
  try {
    const updated = db.updatePhrase(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Not Found', message: 'Phrase item not found.' });
    }
    res.json({
      success: true,
      message: 'Phrase updated successfully.',
      data: updated,
      version: db.getMetadata().version
    });
  } catch (err) {
    res.status(400).json({ success: false, error: 'Update Error', message: err.message });
  }
});

/**
 * DELETE /api/v1/phrases/:id (Admin Protected, Soft Delete by default)
 */
router.delete('/:id', requireAdminAuth, (req, res) => {
  const isHardDelete = req.query.hard === 'true';
  const success = db.deletePhrase(req.params.id, !isHardDelete);
  if (!success) {
    return res.status(404).json({ success: false, error: 'Not Found', message: 'Phrase item not found.' });
  }
  res.json({
    success: true,
    message: isHardDelete ? 'Phrase permanently deleted.' : 'Phrase deactivated (soft deleted).',
    version: db.getMetadata().version
  });
});

export default router;
