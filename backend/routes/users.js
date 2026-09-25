import express from 'express';
import { body, validationResult } from 'express-validator';
import { getDatabase } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/users - Get all users (admin only)
router.get('/', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: { message: 'Access denied' } });
  }

  const db = getDatabase();

  try {
    const users = db.prepare(`
      SELECT id, email, name, role, company, phone, status, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `).all();

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// GET /api/users/:id - Get user profile
router.get('/:id', authenticateToken, (req, res) => {
  const db = getDatabase();

  try {
    // Users can only view their own profile, admins can view any
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    const user = db.prepare(`
      SELECT id, email, name, role, company, phone, status, created_at, updated_at
      FROM users
      WHERE id = ?
    `).get(req.params.id);

    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// PUT /api/users/:id - Update user profile
router.put('/:id', authenticateToken, [
  body('name').optional().trim().isLength({ max: 200 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('company').optional().trim().isLength({ max: 200 }),
  body('phone').optional().trim().isLength({ max: 50 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
  }

  const db = getDatabase();

  try {
    // Users can only update their own profile, admins can update any
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);

    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    const { name, email, company, phone } = req.body;

    // Check if email is being changed and already exists
    if (email && email !== user.email) {
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, req.params.id);
      if (existingUser) {
        return res.status(409).json({ error: { message: 'Email already in use' } });
      }
    }

    db.prepare(`
      UPDATE users
      SET name = COALESCE(?, name),
          email = COALESCE(?, email),
          company = COALESCE(?, company),
          phone = COALESCE(?, phone),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(name, email, company, phone, req.params.id);

    // Log activity
    db.prepare(`
      INSERT INTO activities (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      require('uuid').v4(),
      req.user.id,
      'update_profile',
      'user',
      req.params.id,
      JSON.stringify({ name: name || user.name, email: email || user.email })
    );

    const updated = db.prepare(`
      SELECT id, email, name, role, company, phone, status, created_at, updated_at
      FROM users
      WHERE id = ?
    `).get(req.params.id);

    res.json(updated);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// PUT /api/users/:id/status - Update user status (admin only)
router.put('/:id/status', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: { message: 'Access denied' } });
  }

  const db = getDatabase();
  const { status } = req.body;

  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ error: { message: 'Invalid status' } });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);

    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    // Prevent admin from deactivating themselves
    if (req.params.id === req.user.id && status === 'inactive') {
      return res.status(400).json({ error: { message: 'Cannot deactivate your own account' } });
    }

    db.prepare(`
      UPDATE users
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(status, req.params.id);

    // Log activity
    const { v4: uuidv4 } = require('uuid');
    db.prepare(`
      INSERT INTO activities (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), req.user.id, 'update_status', 'user', req.params.id, JSON.stringify({ status }));

    const updated = db.prepare(`
      SELECT id, email, name, role, company, phone, status, created_at, updated_at
      FROM users
      WHERE id = ?
    `).get(req.params.id);

    res.json(updated);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// GET /api/users/me/projects - Get current user's projects
router.get('/me/projects', authenticateToken, (req, res) => {
  const db = getDatabase();

  try {
    const projects = db.prepare(`
      SELECT * FROM projects
      WHERE client_email = ?
      ORDER BY created_at DESC
    `).all(req.user.email);

    res.json(projects);
  } catch (error) {
    console.error('Get user projects error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// GET /api/users/me/invoices - Get current user's invoices
router.get('/me/invoices', authenticateToken, (req, res) => {
  const db = getDatabase();

  try {
    const invoices = db.prepare(`
      SELECT * FROM invoices
      WHERE client_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id);

    const parsedInvoices = invoices.map(inv => ({
      ...inv,
      items: JSON.parse(inv.items || '[]')
    }));

    res.json(parsedInvoices);
  } catch (error) {
    console.error('Get user invoices error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

export default router;
