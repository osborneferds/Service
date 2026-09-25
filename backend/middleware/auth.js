import jwt from 'jsonwebtoken';
import { getDatabase } from '../database/init.js';

// Authenticate JWT token
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: {
        message: 'Access token required',
        code: 'UNAUTHORIZED'
      }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDatabase();
    
    // Verify user exists and is active
    const user = db.prepare(`
      SELECT id, email, name, role, status 
      FROM users 
      WHERE id = ? AND status = 'active'
    `).get(decoded.id);

    if (!user) {
      return res.status(401).json({ 
        error: {
          message: 'User not found or inactive',
          code: 'UNAUTHORIZED'
        }
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: {
          message: 'Token expired',
          code: 'TOKEN_EXPIRED'
        }
      });
    }
    
    return res.status(403).json({ 
      error: {
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      }
    });
  }
}

// Require specific role
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: {
          message: 'Authentication required',
          code: 'UNAUTHORIZED'
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: {
          message: 'Insufficient permissions',
          code: 'FORBIDDEN'
        }
      });
    }

    next();
  };
}

// Generate JWT token
export function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d' 
    }
  );
}

// Optional authentication (doesn't fail if no token)
export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDatabase();
    
    const user = db.prepare(`
      SELECT id, email, name, role, status 
      FROM users 
      WHERE id = ? AND status = 'active'
    `).get(decoded.id);

    if (user) {
      req.user = user;
    }
  } catch (error) {
    // Token invalid, continue without user
  }

  next();
}
