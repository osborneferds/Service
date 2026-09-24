import express from 'express';
import { getDatabase } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /api/notifications - Get notifications for current user
router.get('/', authenticateToken, (req, res) => {
  const db = getDatabase();

  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    let notifications;
    let total;

    if (req.user.role === 'admin') {
      // Admin sees all notifications
      notifications = db.prepare(`
        SELECT n.*, u.name as user_name, u.email as user_email
        FROM notifications n
        LEFT JOIN users u ON n.user_id = u.id
        ORDER BY n.created_at DESC
        LIMIT ? OFFSET ?
      `).all(limit, offset);

      total = db.prepare('SELECT COUNT(*) as count FROM notifications').get().count;
    } else {
      // Client sees only their notifications
      notifications = db.prepare(`
        SELECT * FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).all(req.user.id, limit, offset);

      total = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ?').get(req.user.id).count;
    }

    res.json({
      notifications,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// GET /api/notifications/unread/count - Get unread notification count
router.get('/unread/count', authenticateToken, (req, res) => {
  const db = getDatabase();

  try {
    let count;

    if (req.user.role === 'admin') {
      count = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE read = 0').get().count;
    } else {
      count = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0').get(req.user.id).count;
    }

    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', authenticateToken, (req, res) => {
  const db = getDatabase();

  try {
    const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: { message: 'Notification not found' } });
    }

    // Check access
    if (req.user.role === 'client' && notification.user_id !== req.user.id) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(req.params.id);

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', authenticateToken, (req, res) => {
  const db = getDatabase();

  try {
    if (req.user.role === 'admin') {
      db.prepare('UPDATE notifications SET read = 1 WHERE read = 0').run();
    } else {
      db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0').run(req.user.id);
    }

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', authenticateToken, (req, res) => {
  const db = getDatabase();

  try {
    const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: { message: 'Notification not found' } });
    }

    // Check access
    if (req.user.role === 'client' && notification.user_id !== req.user.id) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    db.prepare('DELETE FROM notifications WHERE id = ?').run(req.params.id);

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// POST /api/notifications - Create notification (admin only or system)
router.post('/', authenticateToken, (req, res) => {
  const db = getDatabase();
  const { user_id, type, title, message, link } = req.body;

  try {
    const notificationId = uuidv4();

    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, link)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(notificationId, user_id || null, type, title, message, link || null);

    const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(notificationId);

    res.status(201).json(notification);
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

export default router;
