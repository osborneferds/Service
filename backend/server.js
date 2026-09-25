import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import database initialization
import { initializeDatabase } from './database/init.js';

// Import routes
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import leadRoutes from './routes/leads.js';
import portfolioRoutes from './routes/portfolio.js';
import invoiceRoutes from './routes/invoices.js';
import messageRoutes from './routes/messages.js';
import notificationRoutes from './routes/notifications.js';
import clientAccountRoutes from './routes/clientAccounts.js';
import userRoutes from './routes/users.js';
import uploadRoutes from './routes/uploads.js';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static files for uploads
app.use('/uploads', express.static(join(__dirname, '../storage/uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/client-accounts', clientAccountRoutes);
app.use('/api/users', userRoutes);
app.use('/api/uploads', uploadRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: {
      message: 'Route not found',
      path: req.path
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database
    console.log('📦 Initializing database...');
    await initializeDatabase();
    console.log('✅ Database initialized successfully');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Freelancer Website Backend Server                    ║
║                                                           ║
║   Server running on: http://localhost:${PORT}              ║
║   Environment: ${process.env.NODE_ENV || 'development'}                           ║
║   Database: ${process.env.DATABASE_PATH}                  ║
║                                                           ║
║   API Endpoints:                                          ║
║   - POST   /api/auth/login                               ║
║   - GET    /api/auth/me                                  ║
║   - GET    /api/projects                                 ║
║   - POST   /api/projects                                 ║
║   - PUT    /api/projects/:id                             ║
║   - DELETE /api/projects/:id                             ║
║   - GET    /api/leads                                    ║
║   - POST   /api/leads                                    ║
║   - PUT    /api/leads/:id                                ║
║   - DELETE /api/leads/:id                                ║
║   - GET    /api/portfolio                                ║
║   - POST   /api/portfolio                                ║
║   - PUT    /api/portfolio/:id                            ║
║   - DELETE /api/portfolio/:id                            ║
║   - GET    /api/invoices                                 ║
║   - POST   /api/invoices                                 ║
║   - PUT    /api/invoices/:id                             ║
║   - DELETE /api/invoices/:id                             ║
║   - GET    /api/messages                                 ║
║   - POST   /api/messages                                 ║
║   - GET    /api/notifications                            ║
║   - POST   /api/notifications                            ║
║   - GET    /api/client-accounts                          ║
║   - POST   /api/client-accounts                          ║
║   - PUT    /api/client-accounts/:id                      ║
║   - DELETE /api/client-accounts/:id                      ║
║   - GET    /api/users                                    ║
║   - PUT    /api/users/:id                                ║
║   - POST   /api/uploads                                  ║
║                                                           ║
║   Health Check: http://localhost:${PORT}/health            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

startServer();
