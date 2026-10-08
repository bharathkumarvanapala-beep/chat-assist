import express from 'express';
import { db } from '../../db/database.js';
import { requireAdminAuth } from '../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/v1/categories
 * Query params: type ('vocabulary' | 'phrasebook' | 'both' | 'all')
 */
router.get('/', (req, res) => {
  const categories = db.getCategories({
    type: req.query.type,
    includeInactive: req.query.includeInactive === 'true'
  });

  res.json({
    success: true,
    data: categories,
    version: db.getMetadata().version
  });
});

/**
 * GET /api/v1/categories/:id
 */
router.get('/:id', (req, res) => {
  const category = db.getCategoryById(req.params.id);
  if (!category) {
    return res.status(404).json({ success: false, error: 'Not Found', message: 'Category not found.' });
  }
  res.json({ success: true, data: category });
});

/**
 * POST /api/v1/categories (Admin Protected)
 */
router.post('/', requireAdminAuth, (req, res) => {
  try {
    const newCategory = db.createCategory(req.body);
    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      data: newCategory,
      version: db.getMetadata().version
    });
  } catch (err) {
    res.status(400).json({ success: false, error: 'Validation Error', message: err.message });
  }
});

/**
 * PUT /api/v1/categories/:id (Admin Protected)
 */
router.put('/:id', requireAdminAuth, (req, res) => {
  try {
    const updated = db.updateCategory(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Not Found', message: 'Category not found.' });
    }
    res.json({
      success: true,
      message: 'Category updated successfully.',
      data: updated,
      version: db.getMetadata().version
    });
  } catch (err) {
    res.status(400).json({ success: false, error: 'Update Error', message: err.message });
  }
});

/**
 * DELETE /api/v1/categories/:id (Admin Protected)
 */
router.delete('/:id', requireAdminAuth, (req, res) => {
  const isHardDelete = req.query.hard === 'true';
  const success = db.deleteCategory(req.params.id, !isHardDelete);
  if (!success) {
    return res.status(404).json({ success: false, error: 'Not Found', message: 'Category not found.' });
  }
  res.json({
    success: true,
    message: isHardDelete ? 'Category permanently deleted.' : 'Category deactivated (soft deleted).',
    version: db.getMetadata().version
  });
});

export default router;
