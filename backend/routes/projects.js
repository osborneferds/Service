import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { getDatabase } from '../database/init.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /api/projects - Get all projects (admin) or client's projects
router.get('/', authenticateToken, [
  query('status').optional().isIn(['pending', 'in-progress', 'completed', 'review']),
  query('category').optional().isString(),
  query('priority').optional().isIn(['low', 'medium', 'high']),
  query('search').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
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

  const db = getDatabase();
  const { status, category, priority, search, limit = 50, offset = 0 } = req.query;

  try {
    let sql = 'SELECT * FROM projects WHERE 1=1';
    const params = [];

    // Clients can only see their own projects
    if (req.user.role === 'client') {
      sql += ' AND client_email = ?';
      params.push(req.user.email);
    }

    // Apply filters
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (priority) {
      sql += ' AND priority = ?';
      params.push(priority);
    }

    if (search) {
      sql += ' AND (title LIKE ? OR description LIKE ? OR client_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const projects = db.prepare(sql).all(...params);

    // Get total count for pagination
    let countSql = 'SELECT COUNT(*) as total FROM projects WHERE 1=1';
    const countParams = [];

    if (req.user.role === 'client') {
      countSql += ' AND client_email = ?';
      countParams.push(req.user.email);
    }

    if (status) {
      countSql += ' AND status = ?';
      countParams.push(status);
    }

    if (category) {
      countSql += ' AND category = ?';
      countParams.push(category);
    }

    if (priority) {
      countSql += ' AND priority = ?';
      countParams.push(priority);
    }

    if (search) {
      countSql += ' AND (title LIKE ? OR description LIKE ? OR client_name LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const { total } = db.prepare(countSql).get(...countParams);

    res.json({
      projects,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ 
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
});

// GET /api/projects/:id - Get single project
router.get('/:id', authenticateToken, (req, res) => {
  const db = getDatabase();

  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);

    if (!project) {
      return res.status(404).json({ 
        error: {
          message: 'Project not found',
          code: 'NOT_FOUND'
        }
      });
    }

    // Clients can only view their own projects
    if (req.user.role === 'client' && project.client_email !== req.user.email) {
      return res.status(403).json({ 
        error: {
          message: 'Access denied',
          code: 'FORBIDDEN'
        }
      });
    }

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ 
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
});

// POST /api/projects - Create project (admin only)
router.post('/', authenticateToken, requireRole('admin'), [
  body('client_name').trim().notEmpty().withMessage('Client name is required').isLength({ max: 200 }),
  body('client_email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 5000 }),
  body('budget').trim().notEmpty().withMessage('Budget is required'),
  body('timeline').trim().notEmpty().withMessage('Timeline is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('progress').optional().isInt({ min: 0, max: 100 }),
  body('notes').optional().trim().isLength({ max: 2000 })
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

  const db = getDatabase();
  const { client_name, client_email, title, description, budget, timeline, category, priority = 'medium', progress = 0, notes } = req.body;

  try {
    // Projects must belong to a real client account so the client can authenticate and see them.
    const client = db.prepare('SELECT id FROM users WHERE email = ? AND role = ? AND status = ?').get(client_email, 'client', 'active');
    if (!client) {
      return res.status(400).json({
        error: {
          message: 'No active client account exists for this email. Create the client account first, then create the project.',
          code: 'CLIENT_ACCOUNT_REQUIRED'
        }
      });
    }

    const projectId = uuidv4();

    db.prepare(`
      INSERT INTO projects (id, client_id, client_name, client_email, title, description, budget, timeline, category, priority, progress, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      projectId,
      client.id,
      client_name,
      client_email,
      title,
      description,
      budget,
      timeline,
      category,
      priority,
      progress,
      notes || null,
      'pending'
    );

    // Log activity
    db.prepare(`
      INSERT INTO activities (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      req.user.id,
      'create_project',
      'project',
      projectId,
      JSON.stringify({ title, client_name })
    );

    // Create notification for client
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, link)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(),
        client.id,
        'project',
        'New Project Assigned',
        `You have been assigned a new project: ${title}`,
        `/client-portal/projects/${projectId}`
      );
    }

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ 
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
});

// PUT /api/projects/:id - Update project (admin only)
router.put('/:id', authenticateToken, requireRole('admin'), [
  body('client_name').optional().trim().isLength({ max: 200 }),
  body('client_email').optional().isEmail().normalizeEmail(),
  body('title').optional().trim().isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 5000 }),
  body('budget').optional().trim(),
  body('timeline').optional().trim(),
  body('status').optional().isIn(['pending', 'in-progress', 'completed', 'review']),
  body('category').optional().trim(),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('progress').optional().isInt({ min: 0, max: 100 }),
  body('notes').optional().trim().isLength({ max: 2000 })
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

  const db = getDatabase();

  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);

    if (!project) {
      return res.status(404).json({ 
        error: {
          message: 'Project not found',
          code: 'NOT_FOUND'
        }
      });
    }

    const { client_name, client_email, title, description, budget, timeline, status, category, priority, progress, notes } = req.body;
    const oldStatus = project.status;

    db.prepare(`
      UPDATE projects
      SET client_name = COALESCE(?, client_name),
          client_email = COALESCE(?, client_email),
          title = COALESCE(?, title),
          description = COALESCE(?, description),
          budget = COALESCE(?, budget),
          timeline = COALESCE(?, timeline),
          status = COALESCE(?, status),
          category = COALESCE(?, category),
          priority = COALESCE(?, priority),
          progress = COALESCE(?, progress),
          notes = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(
      client_name,
      client_email,
      title,
      description,
      budget,
      timeline,
      status,
      category,
      priority,
      progress,
      notes !== undefined ? notes : project.notes,
      req.params.id
    );

    // Log activity
    let action = 'update_project';
    let details = { title: title || project.title };

    if (status && status !== oldStatus) {
      action = 'status_change';
      details.old_status = oldStatus;
      details.new_status = status;
    }

    db.prepare(`
      INSERT INTO activities (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      req.user.id,
      action,
      'project',
      req.params.id,
      JSON.stringify(details)
    );

    // Notify client of status change
    if (status && status !== oldStatus) {
      const client = db.prepare('SELECT id FROM users WHERE email = ?').get(project.client_email);
      
      if (client) {
        db.prepare(`
          INSERT INTO notifications (id, user_id, type, title, message, link)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          uuidv4(),
          client.id,
          'project',
          'Project Status Updated',
          `Your project "${title || project.title}" status has been updated to: ${status}`,
          `/client-portal/projects/${req.params.id}`
        );
      }
    }

    const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);

    res.json(updated);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ 
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
});

// DELETE /api/projects/:id - Delete project (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  const db = getDatabase();

  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);

    if (!project) {
      return res.status(404).json({ 
        error: {
          message: 'Project not found',
          code: 'NOT_FOUND'
        }
      });
    }

    // Log activity before deletion
    db.prepare(`
      INSERT INTO activities (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      req.user.id,
      'delete_project',
      'project',
      req.params.id,
      JSON.stringify({ title: project.title, client_name: project.client_name })
    );

    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ 
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
});

// GET /api/projects/stats/overview - Get project statistics (admin only)
router.get('/stats/overview', authenticateToken, requireRole('admin'), (req, res) => {
  const db = getDatabase();

  try {
    const stats = {
      total: db.prepare('SELECT COUNT(*) as count FROM projects').get().count,
      byStatus: {
        pending: db.prepare('SELECT COUNT(*) as count FROM projects WHERE status = ?').get('pending').count,
        'in-progress': db.prepare('SELECT COUNT(*) as count FROM projects WHERE status = ?').get('in-progress').count,
        review: db.prepare('SELECT COUNT(*) as count FROM projects WHERE status = ?').get('review').count,
        completed: db.prepare('SELECT COUNT(*) as count FROM projects WHERE status = ?').get('completed').count
      },
      byPriority: {
        high: db.prepare('SELECT COUNT(*) as count FROM projects WHERE priority = ?').get('high').count,
        medium: db.prepare('SELECT COUNT(*) as count FROM projects WHERE priority = ?').get('medium').count,
        low: db.prepare('SELECT COUNT(*) as count FROM projects WHERE priority = ?').get('low').count
      },
      averageProgress: db.prepare('SELECT AVG(progress) as avg FROM projects').get().avg || 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
});

export default router;
