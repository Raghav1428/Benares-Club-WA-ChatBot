import express from 'express';
import { FeedbackController } from '../controllers/feedback.controllers.js';
import { authMiddleware } from '../middlewares/auth.middlewares.js';

const router = express.Router();

/**
 * GET /api/feedback
 * Get all feedback with optional filters
 * Query parameters:
 * - fromPhone: Filter by phone number
 * - category: Filter by category
 * - processed: Filter by processed status (true/false)
 * - hasMedia: Filter records with/without media (true/false)
 * - dateFrom: Filter from date (YYYY-MM-DD)
 * - dateTo: Filter to date (YYYY-MM-DD)
 * - search: Search in caption text
 * - limit: Limit number of results (default: 50)
 * - offset: Offset for pagination (default: 0)
 * - sortBy: Sort field (default: 'created_at')
 * - sortOrder: Sort order 'asc' or 'desc' (default: 'desc')
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const filters = {
      fromPhone: req.query.fromPhone,
      category: req.query.category,
      processed: req.query.processed ? req.query.processed === 'true' : undefined,
      hasMedia: req.query.hasMedia ? req.query.hasMedia === 'true' : undefined,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      search: req.query.search,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset) : undefined,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const result = await FeedbackController.getAllFeedback(filters);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        count: result.count
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Route error in GET /feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/feedback/stats
 * Get feedback statistics
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const result = await FeedbackController.getFeedbackStats();

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Route error in GET /feedback/stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/feedback/categories
 * Get unique categories
 */
router.get('/categories', authMiddleware, async (req, res) => {
  try {
    const result = await FeedbackController.getCategories();

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Route error in GET /feedback/categories:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/feedback/phones
 * Get unique phone numbers
 */
router.get('/phones',authMiddleware, async (req, res) => {
  try {
    const result = await FeedbackController.getPhoneNumbers();

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Route error in GET /feedback/phones:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/feedback/:id
 * Get feedback by ID
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await FeedbackController.getFeedbackById(id);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      const statusCode = result.error === 'Feedback not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Route error in GET /feedback/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/feedback/:id/processed
 * Update feedback processed status
 * Body: { processed: boolean }
 */
router.put('/:id/processed', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { processed } = req.body;
    const userId = req.user?.id;

    if (typeof processed !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Processed status must be a boolean'
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const result = await FeedbackController.updateProcessedStatus(id, processed, userId);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Route error in PUT /feedback/:id/processed:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/feedback/:id
 * Delete feedback by ID
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const result = await FeedbackController.deleteFeedback(id, userId);

    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      return res.status(403).json({ error: result.error });
    }

  } catch (error) {
    console.error('❌ Route error in DELETE /feedback/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;