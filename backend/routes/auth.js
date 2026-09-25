import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { getDatabase } from '../database/init.js';
import { authenticateToken, generateToken } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// POST /api/auth/login - Login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  body('password').notEmpty().withMessage('Password is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: {
        message: 'Validation failed',
        details: errors.array()
      }
    });
  }

  const { email, password } = req.body;
  const db = getDatabase();

  try {
    // Find user by email
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return res.status(401).json({ 
        error: {
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(403).json({ 
        error: {
          message: 'Account is inactive',
          code: 'ACCOUNT_INACTIVE'
        }
      });
    }

    // Check account lockout
    if (user.failed_attempts >= 5) {
      return res.status(403).json({ 
        error: {
          message: 'Account locked due to too many failed attempts. Contact administrator.',
          code: 'ACCOUNT_LOCKED'
        }
      });
    }

    // Verify password
    const validPassword = bcrypt.compareSync(password, user.password_hash);

    if (!validPassword) {
      // Increment failed attempts
      db.prepare('UPDATE users SET failed_attempts = failed_attempts + 1, updated_at = datetime(\'now\') WHERE id = ?').run(user.id);
      
      return res.status(401).json({ 
        error: {
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }

    // Reset failed attempts on successful login
    db.prepare(`
      UPDATE users 
      SET failed_attempts = 0, last_login = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).run(user.id);

    // Generate JWT token
    const token = generateToken(user);

    // Log activity
    db.prepare(`
      INSERT INTO activities (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      user.id,
      'login',
      'user',
      user.id,
      JSON.stringify({ email: user.email })
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', authenticateToken, (req, res) => {
  const db = getDatabase();

  try {
    const user = db.prepare(`
      SELECT id, email, name, role, company, phone, status, created_at
      FROM users 
      WHERE id = ?
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({ 
        error: {
          message: 'User not found',
          code: 'NOT_FOUND'
        }
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
});

// POST /api/auth/register - Register new client account (admin only)
router.post('/register', authenticateToken, [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('role').isIn(['admin', 'client']).withMessage('Invalid role')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: {
        message: 'Validation failed',
        details: errors.array()
      }
    });
  }

  // Only admins can register new users
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: {
        message: 'Only admins can register new users',
        code: 'FORBIDDEN'
      }
    });
  }

  const { email, password, name, role, company, phone } = req.body;
  const db = getDatabase();

  try {
    // Check if email already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(409).json({ 
        error: {
          message: 'Email already registered',
          code: 'EMAIL_EXISTS'
        }
      });
    }

    // Hash password
    const passwordHash = bcrypt.hashSync(password, 10);
    const userId = uuidv4();

    // Create user
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, company, phone, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, email, passwordHash, name, role, company || null, phone || null, 'active');

    // Log activity
    db.prepare(`
      INSERT INTO activities (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      req.user.id,
      'register_user',
      'user',
      userId,
      JSON.stringify({ email, name, role })
    );

    // Get created user
    const user = db.prepare(`
      SELECT id, email, name, role, company, phone, status, created_at
      FROM users 
      WHERE id = ?
    `).get(userId);

    res.status(201).json(user);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
});

// POST /api/auth/change-password - Change password
router.post('/change-password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: {
        message: 'Validation failed',
        details: errors.array()
      }
    });
  }

  const { currentPassword, newPassword } = req.body;
  const db = getDatabase();

  try {
    // Get user with password hash
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

    // Verify current password
    const validPassword = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ 
        error: {
          message: 'Current password is incorrect',
          code: 'INVALID_PASSWORD'
        }
      });
    }

    // Hash new password
    const newPasswordHash = bcrypt.hashSync(newPassword, 10);

    // Update password
    db.prepare(`
      UPDATE users 
      SET password_hash = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(newPasswordHash, req.user.id);

    // Log activity
    db.prepare(`
      INSERT INTO activities (id, user_id, action, entity_type, entity_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), req.user.id, 'change_password', 'user', req.user.id);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
});

// POST /api/auth/logout - Logout
router.post('/logout', authenticateToken, (req, res) => {
  const db = getDatabase();

  try {
    // Log activity
    db.prepare(`
      INSERT INTO activities (id, user_id, action, entity_type, entity_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), req.user.id, 'logout', 'user', req.user.id);

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
});

export default router;
