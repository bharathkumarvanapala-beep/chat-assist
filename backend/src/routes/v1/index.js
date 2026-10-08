import express from 'express';
import vocabularyRoutes from './vocabularyRoutes.js';
import phraseRoutes from './phraseRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import contentRoutes from './contentRoutes.js';

const router = express.Router();

router.use('/vocabulary', vocabularyRoutes);
router.use('/phrases', phraseRoutes);
router.use('/categories', categoryRoutes);
router.use('/content', contentRoutes);

export default router;
