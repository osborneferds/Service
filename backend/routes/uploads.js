import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || join(__dirname, '../storage/uploads');
    
    // Ensure upload directory exists
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only images and documents are allowed'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 }, // 10MB default
  fileFilter
});

// POST /api/uploads - Upload file
router.post('/', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: { message: 'No file uploaded' } });
  }

  const db = getDatabase();

  try {
    const fileId = uuidv4();
    const fileUrl = `/uploads/${req.file.filename}`;

    // Store file metadata in database (optional)
    // You can create a files table if needed
    /*
    db.prepare(`
      INSERT INTO files (id, original_filename, stored_filename, file_path, mime_type, file_size, uploaded_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      fileId,
      req.file.originalname,
      req.file.filename,
      fileUrl,
      req.file.mimetype,
      req.file.size,
      req.user.id
    );
    */

    res.status(201).json({
      id: fileId,
      originalName: req.file.originalname,
      filename: req.file.filename,
      url: fileUrl,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: { message: 'Upload failed' } });
  }
});

// POST /api/uploads/multiple - Upload multiple files
router.post('/multiple', authenticateToken, upload.array('files', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: { message: 'No files uploaded' } });
  }

  try {
    const uploadedFiles = req.files.map(file => ({
      id: uuidv4(),
      originalName: file.originalname,
      filename: file.filename,
      url: `/uploads/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype
    }));

    res.status(201).json({ files: uploadedFiles });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({ error: { message: 'Upload failed' } });
  }
});

// DELETE /api/uploads/:filename - Delete file (admin only)
router.delete('/:filename', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: { message: 'Access denied' } });
  }

  const fs = require('fs');
  const uploadDir = process.env.UPLOAD_DIR || join(__dirname, '../storage/uploads');
  const filePath = join(uploadDir, req.params.filename);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'File deleted successfully' });
    } else {
      res.status(404).json({ error: { message: 'File not found' } });
    }
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: { message: 'Delete failed' } });
  }
});

// Error handling for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: { message: 'File too large' } });
    }
    return res.status(400).json({ error: { message: error.message } });
  }
  next(error);
});

export default router;
