import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { getDatabase } from '../database/init.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /api/client-accounts - Get all client accounts (admin only)
router.get('/', authenticateToken, requireRole('admin'), (req, res) => {
  const db = getDatabase();

  try {
    const accounts = db.prepare(`
      SELECT id, email, name, role, company, phone, status, notes, created_at, updated_at
      FROM users
      WHERE role = 'client'
      ORDER BY created_at DESC
    `).all();

    res.json(accounts);
  } catch (error) {
    console.error('Get client accounts error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// GET /api/client-accounts/:id - Get single client account (admin only)
router.get('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  const db = getDatabase();

  try {
    const account = db.prepare(`
      SELECT id, email, name, role, company, phone, status, notes, created_at, updated_at
      FROM users
      WHERE id = ? AND role = 'client'
    `).get(req.params.id);

    if (!account) {
      return res.status(404).json({ error: { message: 'Client account not found' } });
    }

    res.json(account);
  } catch (error) {
    console.error('Get client account error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// POST /api/client-accounts - Create client account (admin only)
router.post('/', authenticateToken, requireRole('admin'), [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('status').optional().isIn(['active', 'inactive'])
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
  }

  const db = getDatabase();
  const { email, password, name, company, phone, status = 'active', notes } = req.body;

  try {
    // Check if email already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(409).json({ error: { message: 'Email already registered' } });
    }

    const userId = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);

    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, company, phone, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, email, passwordHash, name, 'client', company || null, phone || null, status, notes || null);

    // Log activity
    db.prepare(`
      INSERT INTO activities (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), req.user.id, 'create_client', 'user', userId, JSON.stringify({ email, name }));

    const account = db.prepare(`
      SELECT id, email, name, role, company, phone, status, notes, created_at
      FROM users
      WHERE id = ?
    `).get(userId);

    res.status(201).json(account);
  } catch (error) {
    console.error('Create client account error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// PUT /api/client-accounts/:id - Update client account (admin only)
router.put('/:id', authenticateToken, requireRole('admin'), [
  body('email').optional().isEmail().normalizeEmail(),
  body('password').optional().isLength({ min: 8 }),
  body('status').optional().isIn(['active', 'inactive'])
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
  }

  const db = getDatabase();

  try {
    const account = db.prepare('SELECT * FROM users WHERE id = ? AND role = ?').get(req.params.id, 'client');

    if (!account) {
      return res.status(404).json({ error: { message: 'Client account not found' } });
    }

    const { email, password, name, company, phone, status, notes } = req.body;

    let passwordHash = account.password_hash;
    if (password) {
      passwordHash = bcrypt.hashSync(password, 10);
    }

    // Check if email is being changed and already exists
    if (email && email !== account.email) {
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, req.params.id);
      if (existingUser) {
        return res.status(409).json({ error: { message: 'Email already registered' } });
      }
    }

    db.prepare(`
      UPDATE users
      SET email = COALESCE(?, email),
          password_hash = ?,
          name = COALESCE(?, name),
          company = COALESCE(?, company),
          phone = COALESCE(?, phone),
          status = COALESCE(?, status),
          notes = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(
      email,
      passwordHash,
      name,
      company,
      phone,
      status,
      notes !== undefined ? notes : account.notes,
      req.params.id
    );

    // Log activity
    db.prepare(`
      INSERT INTO activities (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), req.user.id, 'update_client', 'user', req.params.id, JSON.stringify({ email: email || account.email }));

    const updated = db.prepare(`
      SELECT id, email, name, role, company, phone, status, notes, created_at, updated_at
      FROM users
      WHERE id = ?
    `).get(req.params.id);

    res.json(updated);
  } catch (error) {
    console.error('Update client account error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// DELETE /api/client-accounts/:id - Delete client account (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  const db = getDatabase();

  try {
    const account = db.prepare('SELECT * FROM users WHERE id = ? AND role = ?').get(req.params.id, 'client');

    if (!account) {
      return res.status(404).json({ error: { message: 'Client account not found' } });
    }

    // Log activity
    db.prepare(`
      INSERT INTO activities (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), req.user.id, 'delete_client', 'user', req.params.id, JSON.stringify({ email: account.email, name: account.name }));

    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);

    res.json({ message: 'Client account deleted successfully' });
  } catch (error) {
    console.error('Delete client account error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// POST /api/client-accounts/:id/reset-password - Reset client password (admin only)
router.post('/:id/reset-password', authenticateToken, requireRole('admin'), [
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
  }

  const db = getDatabase();
  const { newPassword } = req.body;

  try {
    const account = db.prepare('SELECT * FROM users WHERE id = ? AND role = ?').get(req.params.id, 'client');

    if (!account) {
      return res.status(404).json({ error: { message: 'Client account not found' } });
    }

    const passwordHash = bcrypt.hashSync(newPassword, 10);

    db.prepare(`
      UPDATE users
      SET password_hash = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(passwordHash, req.params.id);

    // Log activity
    db.prepare(`
      INSERT INTO activities (id, user_id, action, entity_type, entity_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), req.user.id, 'reset_password', 'user', req.params.id);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

export default router;
