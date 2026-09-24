import express from 'express';
import { body, validationResult } from 'express-validator';
import { getDatabase } from '../database/init.js';
import { authenticateToken, requireRole, optionalAuth } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /api/portfolio - Get all portfolio items (public)
router.get('/', optionalAuth, (req, res) => {
  const db = getDatabase();

  try {
    const items = db.prepare('SELECT * FROM portfolio ORDER BY created_at DESC').all();
    
    // Parse tags from JSON string
    const parsedItems = items.map(item => ({
      ...item,
      tags: JSON.parse(item.tags || '[]'),
      featured: item.featured === 1
    }));

    res.json(parsedItems);
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// GET /api/portfolio/:id - Get single portfolio item
router.get('/:id', optionalAuth, (req, res) => {
  const db = getDatabase();

  try {
    const item = db.prepare('SELECT * FROM portfolio WHERE id = ?').get(req.params.id);

    if (!item) {
      return res.status(404).json({ error: { message: 'Portfolio item not found' } });
    }

    res.json({
      ...item,
      tags: JSON.parse(item.tags || '[]'),
      featured: item.featured === 1
    });
  } catch (error) {
    console.error('Get portfolio item error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// POST /api/portfolio - Create portfolio item (admin only)
router.post('/', authenticateToken, requireRole('admin'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('category').isIn(['web', 'design', 'mobile', 'branding']).withMessage('Invalid category'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('image').trim().notEmpty().withMessage('Image is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
  }

  const db = getDatabase();
  const { title, category, description, tags = [], image, link, featured = false } = req.body;

  try {
    const itemId = uuidv4();

    db.prepare(`
      INSERT INTO portfolio (id, title, category, description, tags, image, link, featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(itemId, title, category, description, JSON.stringify(tags), image, link || null, featured ? 1 : 0);

    // Log activity
    db.prepare(`
      INSERT INTO activities (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), req.user.id, 'create_portfolio', 'portfolio', itemId, JSON.stringify({ title }));

    const item = db.prepare('SELECT * FROM portfolio WHERE id = ?').get(itemId);

    res.status(201).json({
      ...item,
      tags: JSON.parse(item.tags || '[]'),
      featured: item.featured === 1
    });
  } catch (error) {
    console.error('Create portfolio error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// PUT /api/portfolio/:id - Update portfolio item (admin only)
router.put('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  const db = getDatabase();

  try {
    const item = db.prepare('SELECT * FROM portfolio WHERE id = ?').get(req.params.id);

    if (!item) {
      return res.status(404).json({ error: { message: 'Portfolio item not found' } });
    }

    const { title, category, description, tags, image, link, featured } = req.body;

    db.prepare(`
      UPDATE portfolio
      SET title = COALESCE(?, title),
          category = COALESCE(?, category),
          description = COALESCE(?, description),
          tags = COALESCE(?, tags),
          image = COALESCE(?, image),
          link = ?,
          featured = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(
      title,
      category,
      description,
      tags ? JSON.stringify(tags) : item.tags,
      image,
      link !== undefined ? link : item.link,
      featured !== undefined ? (featured ? 1 : 0) : item.featured,
      req.params.id
    );

    // Log activity
    db.prepare(`
      INSERT INTO activities (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), req.user.id, 'update_portfolio', 'portfolio', req.params.id, JSON.stringify({ title: title || item.title }));

    const updated = db.prepare('SELECT * FROM portfolio WHERE id = ?').get(req.params.id);

    res.json({
      ...updated,
      tags: JSON.parse(updated.tags || '[]'),
      featured: updated.featured === 1
    });
  } catch (error) {
    console.error('Update portfolio error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// DELETE /api/portfolio/:id - Delete portfolio item (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  const db = getDatabase();

  try {
    const item = db.prepare('SELECT * FROM portfolio WHERE id = ?').get(req.params.id);

    if (!item) {
      return res.status(404).json({ error: { message: 'Portfolio item not found' } });
    }

    // Log activity
    db.prepare(`
      INSERT INTO activities (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), req.user.id, 'delete_portfolio', 'portfolio', req.params.id, JSON.stringify({ title: item.title }));

    db.prepare('DELETE FROM portfolio WHERE id = ?').run(req.params.id);
    res.json({ message: 'Portfolio item deleted successfully' });
  } catch (error) {
    console.error('Delete portfolio error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

export default router;
