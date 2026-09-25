import express from 'express';
import { body, validationResult } from 'express-validator';
import { getDatabase } from '../database/init.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /api/leads - Get all leads (admin only)
router.get('/', authenticateToken, requireRole('admin'), (req, res) => {
  const db = getDatabase();

  try {
    const leads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
    res.json(leads);
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// GET /api/leads/:id - Get single lead
router.get('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  const db = getDatabase();

  try {
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);

    if (!lead) {
      return res.status(404).json({ error: { message: 'Lead not found' } });
    }

    res.json(lead);
  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// POST /api/leads - Create lead (admin only)
router.post('/', authenticateToken, requireRole('admin'), [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('status').optional().isIn(['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'])
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
  }

  const db = getDatabase();
  const { name, email, phone, company, source, status = 'new', value, notes } = req.body;

  try {
    const leadId = uuidv4();

    db.prepare(`
      INSERT INTO leads (id, name, email, phone, company, source, status, value, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(leadId, name, email, phone || null, company || null, source || null, status, value || null, notes || null);

    // Log activity
    db.prepare(`
      INSERT INTO activities (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), req.user.id, 'create_lead', 'lead', leadId, JSON.stringify({ name, email }));

    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
    res.status(201).json(lead);
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// PUT /api/leads/:id - Update lead (admin only)
router.put('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  const db = getDatabase();

  try {
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);

    if (!lead) {
      return res.status(404).json({ error: { message: 'Lead not found' } });
    }

    const { name, email, phone, company, source, status, value, notes } = req.body;

    db.prepare(`
      UPDATE leads
      SET name = COALESCE(?, name),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          company = COALESCE(?, company),
          source = COALESCE(?, source),
          status = COALESCE(?, status),
          value = COALESCE(?, value),
          notes = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(name, email, phone, company, source, status, value, notes !== undefined ? notes : lead.notes, req.params.id);

    // Log activity
    db.prepare(`
      INSERT INTO activities (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), req.user.id, 'update_lead', 'lead', req.params.id, JSON.stringify({ name: name || lead.name }));

    const updated = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// DELETE /api/leads/:id - Delete lead (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  const db = getDatabase();

  try {
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);

    if (!lead) {
      return res.status(404).json({ error: { message: 'Lead not found' } });
    }

    // Log activity
    db.prepare(`
      INSERT INTO activities (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), req.user.id, 'delete_lead', 'lead', req.params.id, JSON.stringify({ name: lead.name }));

    db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

export default router;
