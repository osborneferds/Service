import express from 'express';
import { body, validationResult } from 'express-validator';
import { getDatabase } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /api/messages - Get conversations for current user
router.get('/', authenticateToken, (req, res) => {
  const db = getDatabase();

  try {
    let conversations;

    if (req.user.role === 'admin') {
      // Admin sees all conversations
      conversations = db.prepare(`
        SELECT c.*, 
               (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.recipient_id = ? AND m.read = 0) as unread_count
        FROM conversations c
        ORDER BY c.last_message_time DESC
      `).all(req.user.id);
    } else {
      // Client sees only their conversations
      conversations = db.prepare(`
        SELECT c.*, 
               (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.recipient_id = ? AND m.read = 0) as unread_count
        FROM conversations c
        WHERE c.participant_id = ?
        ORDER BY c.last_message_time DESC
      `).all(req.user.id, req.user.id);
    }

    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// GET /api/messages/:conversationId - Get messages in a conversation
router.get('/:conversationId', authenticateToken, (req, res) => {
  const db = getDatabase();

  try {
    const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({ error: { message: 'Conversation not found' } });
    }

    // Check access
    if (req.user.role === 'client' && conversation.participant_id !== req.user.id) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    const messages = db.prepare(`
      SELECT * FROM messages 
      WHERE conversation_id = ? 
      ORDER BY created_at ASC
    `).all(req.params.conversationId);

    // Mark messages as read
    db.prepare(`
      UPDATE messages 
      SET read = 1 
      WHERE conversation_id = ? AND recipient_id = ? AND read = 0
    `).run(req.params.conversationId, req.user.id);

    // Update unread count
    db.prepare(`
      UPDATE conversations 
      SET unread_count = 0 
      WHERE id = ? AND participant_id = ?
    `).run(req.params.conversationId, req.user.id);

    res.json({ conversation, messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// POST /api/messages - Send message
router.post('/', authenticateToken, [
  body('conversation_id').optional().isString(),
  body('recipient_id').notEmpty().withMessage('Recipient ID is required'),
  body('content').trim().notEmpty().withMessage('Message content is required').isLength({ max: 5000 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
  }

  const db = getDatabase();
  const { conversation_id, recipient_id, content } = req.body;

  try {
    let conversationId = conversation_id;

    // Get recipient info
    const recipient = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(recipient_id);

    if (!recipient) {
      return res.status(404).json({ error: { message: 'Recipient not found' } });
    }

    // Create conversation if it doesn't exist
    if (!conversationId) {
      conversationId = uuidv4();
      
      db.prepare(`
        INSERT INTO conversations (id, participant_id, participant_name, participant_email, last_message, last_message_time, unread_count)
        VALUES (?, ?, ?, ?, ?, datetime('now'), 1)
      `).run(conversationId, recipient_id, recipient.name, recipient.email, content);
    } else {
      // Update conversation
      db.prepare(`
        UPDATE conversations 
        SET last_message = ?, last_message_time = datetime('now'), unread_count = unread_count + 1, updated_at = datetime('now')
        WHERE id = ?
      `).run(content, conversationId);
    }

    // Create message
    const messageId = uuidv4();
    
    db.prepare(`
      INSERT INTO messages (id, conversation_id, sender_id, sender_name, sender_role, recipient_id, recipient_name, content, read)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(messageId, conversationId, req.user.id, req.user.name, req.user.role, recipient_id, recipient.name, content);

    // Create notification for recipient
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, link)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), recipient_id, 'message', 'New Message', `You have a new message from ${req.user.name}`, '/client-portal/messages');

    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId);

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// PUT /api/messages/:id/read - Mark message as read
router.put('/:id/read', authenticateToken, (req, res) => {
  const db = getDatabase();

  try {
    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id);

    if (!message) {
      return res.status(404).json({ error: { message: 'Message not found' } });
    }

    if (message.recipient_id !== req.user.id) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    db.prepare('UPDATE messages SET read = 1 WHERE id = ?').run(req.params.id);

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// GET /api/messages/unread/count - Get unread message count
router.get('/unread/count', authenticateToken, (req, res) => {
  const db = getDatabase();

  try {
    const count = db.prepare('SELECT COUNT(*) as count FROM messages WHERE recipient_id = ? AND read = 0').get(req.user.id).count;
    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

export default router;
