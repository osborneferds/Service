import express from 'express';
import { body, validationResult } from 'express-validator';
import { getDatabase } from '../database/init.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Helper function to generate invoice number
function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const db = getDatabase();
  const count = db.prepare('SELECT COUNT(*) as count FROM invoices WHERE invoice_number LIKE ?').get(`INV-${year}-%`).count;
  return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
}

// GET /api/invoices - Get all invoices (admin) or client's invoices
router.get('/', authenticateToken, (req, res) => {
  const db = getDatabase();

  try {
    let sql = 'SELECT * FROM invoices';
    const params = [];

    if (req.user.role === 'client') {
      sql += ' WHERE client_id = ?';
      params.push(req.user.id);
    }

    sql += ' ORDER BY created_at DESC';

    const invoices = db.prepare(sql).all(...params);

    // Parse items from JSON string
    const parsedInvoices = invoices.map(inv => ({
      ...inv,
      items: JSON.parse(inv.items || '[]')
    }));

    res.json(parsedInvoices);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// GET /api/invoices/:id - Get single invoice
router.get('/:id', authenticateToken, (req, res) => {
  const db = getDatabase();

  try {
    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: { message: 'Invoice not found' } });
    }

    // Clients can only view their own invoices
    if (req.user.role === 'client' && invoice.client_id !== req.user.id) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    res.json({
      ...invoice,
      items: JSON.parse(invoice.items || '[]')
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// POST /api/invoices - Create invoice (admin only)
router.post('/', authenticateToken, requireRole('admin'), [
  body('client_id').notEmpty().withMessage('Client ID is required'),
  body('client_name').trim().notEmpty().withMessage('Client name is required'),
  body('client_email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('project_name').trim().notEmpty().withMessage('Project name is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('subtotal').isFloat({ min: 0 }).withMessage('Invalid subtotal'),
  body('tax').isFloat({ min: 0 }).withMessage('Invalid tax'),
  body('total').isFloat({ min: 0 }).withMessage('Invalid total'),
  body('issue_date').isISO8601().withMessage('Invalid issue date'),
  body('due_date').isISO8601().withMessage('Invalid due date')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
  }

  const db = getDatabase();
  const { client_id, client_name, client_email, project_name, items, subtotal, tax, total, issue_date, due_date, notes } = req.body;

  try {
    const invoiceId = uuidv4();
    const invoiceNumber = generateInvoiceNumber();

    db.prepare(`
      INSERT INTO invoices (id, invoice_number, client_id, client_name, client_email, project_name, items, subtotal, tax, total, status, issue_date, due_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(invoiceId, invoiceNumber, client_id, client_name, client_email, project_name, JSON.stringify(items), subtotal, tax, total, 'draft', issue_date, due_date, notes || null);

    // Log activity
    db.prepare(`
      INSERT INTO activities (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), req.user.id, 'create_invoice', 'invoice', invoiceId, JSON.stringify({ invoice_number: invoiceNumber, client_name }));

    // Notify client
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, link)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), client_id, 'invoice', 'New Invoice', `A new invoice has been created: ${invoiceNumber}`, `/client-portal/invoices/${invoiceId}`);

    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);

    res.status(201).json({
      ...invoice,
      items: JSON.parse(invoice.items || '[]')
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// PUT /api/invoices/:id - Update invoice (admin only)
router.put('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  const db = getDatabase();

  try {
    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: { message: 'Invoice not found' } });
    }

    const { items, subtotal, tax, total, status, issue_date, due_date, notes } = req.body;
    const oldStatus = invoice.status;

    db.prepare(`
      UPDATE invoices
      SET items = COALESCE(?, items),
          subtotal = COALESCE(?, subtotal),
          tax = COALESCE(?, tax),
          total = COALESCE(?, total),
          status = COALESCE(?, status),
          issue_date = COALESCE(?, issue_date),
          due_date = COALESCE(?, due_date),
          notes = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(
      items ? JSON.stringify(items) : invoice.items,
      subtotal,
      tax,
      total,
      status,
      issue_date,
      due_date,
      notes !== undefined ? notes : invoice.notes,
      req.params.id
    );

    // Log activity
    let action = 'update_invoice';
    let details = { invoice_number: invoice.invoice_number };

    if (status && status !== oldStatus) {
      action = 'status_change';
      details.old_status = oldStatus;
      details.new_status = status;
    }

    db.prepare(`
      INSERT INTO activities (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), req.user.id, action, 'invoice', req.params.id, JSON.stringify(details));

    // Notify client of status change
    if (status && status !== oldStatus) {
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, link)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), invoice.client_id, 'invoice', 'Invoice Status Updated', `Invoice ${invoice.invoice_number} status changed to: ${status}`, `/client-portal/invoices/${req.params.id}`);
    }

    const updated = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);

    res.json({
      ...updated,
      items: JSON.parse(updated.items || '[]')
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// POST /api/invoices/:id/mark-paid - Mark invoice as paid (admin only)
router.post('/:id/mark-paid', authenticateToken, requireRole('admin'), (req, res) => {
  const db = getDatabase();

  try {
    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: { message: 'Invoice not found' } });
    }

    db.prepare(`
      UPDATE invoices
      SET status = 'paid', paid_date = date('now'), updated_at = datetime('now')
      WHERE id = ?
    `).run(req.params.id);

    // Log activity
    db.prepare(`
      INSERT INTO activities (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), req.user.id, 'mark_paid', 'invoice', req.params.id, JSON.stringify({ invoice_number: invoice.invoice_number }));

    // Notify client
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, link)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), invoice.client_id, 'invoice', 'Payment Received', `Payment for invoice ${invoice.invoice_number} has been received`, `/client-portal/invoices/${req.params.id}`);

    const updated = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);

    res.json({
      ...updated,
      items: JSON.parse(updated.items || '[]')
    });
  } catch (error) {
    console.error('Mark paid error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// DELETE /api/invoices/:id - Delete invoice (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  const db = getDatabase();

  try {
    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: { message: 'Invoice not found' } });
    }

    // Log activity
    db.prepare(`
      INSERT INTO activities (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), req.user.id, 'delete_invoice', 'invoice', req.params.id, JSON.stringify({ invoice_number: invoice.invoice_number }));

    db.prepare('DELETE FROM invoices WHERE id = ?').run(req.params.id);
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// GET /api/invoices/stats/revenue - Get revenue statistics (admin only)
router.get('/stats/revenue', authenticateToken, requireRole('admin'), (req, res) => {
  const db = getDatabase();

  try {
    const stats = {
      totalRevenue: db.prepare('SELECT COALESCE(SUM(total), 0) as total FROM invoices WHERE status = ?').get('paid').total,
      pendingAmount: db.prepare('SELECT COALESCE(SUM(total), 0) as total FROM invoices WHERE status IN (?, ?)').get('sent', 'overdue').total,
      totalInvoices: db.prepare('SELECT COUNT(*) as count FROM invoices').get().count,
      paidInvoices: db.prepare('SELECT COUNT(*) as count FROM invoices WHERE status = ?').get('paid').count,
      pendingInvoices: db.prepare('SELECT COUNT(*) as count FROM invoices WHERE status IN (?, ?)').get('sent', 'overdue').count
    };

    res.json(stats);
  } catch (error) {
    console.error('Get revenue stats error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

export default router;
