import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database file path
const dbPath = process.env.DATABASE_PATH || join(__dirname, 'production.sqlite3');

// Ensure database directory exists
const dbDir = dirname(dbPath);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

// Create database instance with optimizations
const db = new Database(dbPath, {
  verbose: process.env.NODE_ENV === 'development' ? console.log : null
});

// Configure SQLite for production
db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency
db.pragma('synchronous = NORMAL'); // Balance between safety and performance
db.pragma('cache_size = -64000'); // 64MB cache
db.pragma('foreign_keys = ON'); // Enforce foreign key constraints
db.pragma('busy_timeout = 5000'); // Wait 5 seconds for locks

// Initialize database schema
export function initializeDatabase() {
  console.log('📦 Initializing database schema...');
  
  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'client')),
      company TEXT,
      phone TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      failed_attempts INTEGER DEFAULT 0,
      last_login TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Create projects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      client_name TEXT NOT NULL,
      client_email TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      budget TEXT NOT NULL,
      timeline TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in-progress', 'completed', 'review')),
      category TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
      progress INTEGER NOT NULL DEFAULT 0 CHECK(progress >= 0 AND progress <= 100),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create leads table
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      company TEXT,
      source TEXT,
      status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost')),
      value TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Create portfolio table
  db.exec(`
    CREATE TABLE IF NOT EXISTS portfolio (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('web', 'design', 'mobile', 'branding')),
      description TEXT NOT NULL,
      tags TEXT NOT NULL,
      image TEXT NOT NULL,
      link TEXT,
      featured INTEGER NOT NULL DEFAULT 0 CHECK(featured IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Create invoices table
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT UNIQUE NOT NULL,
      client_id TEXT NOT NULL,
      client_name TEXT NOT NULL,
      client_email TEXT NOT NULL,
      project_name TEXT NOT NULL,
      items TEXT NOT NULL,
      subtotal REAL NOT NULL,
      tax REAL NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
      issue_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      paid_date TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_role TEXT NOT NULL CHECK(sender_role IN ('admin', 'client')),
      recipient_id TEXT NOT NULL,
      recipient_name TEXT NOT NULL,
      content TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0 CHECK(read IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Create conversations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      participant_id TEXT NOT NULL,
      participant_name TEXT NOT NULL,
      participant_email TEXT NOT NULL,
      last_message TEXT,
      last_message_time TEXT,
      unread_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (participant_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create notifications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      type TEXT NOT NULL CHECK(type IN ('message', 'project', 'invoice', 'lead', 'system')),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0 CHECK(read IN (0, 1)),
      link TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create activities table
  db.exec(`
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Create settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Create indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
    
    CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
    CREATE INDEX IF NOT EXISTS idx_projects_client_email ON projects(client_email);
    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
    CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
    
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
    CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
    
    CREATE INDEX IF NOT EXISTS idx_portfolio_category ON portfolio(category);
    CREATE INDEX IF NOT EXISTS idx_portfolio_featured ON portfolio(featured);
    
    CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
    CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
    
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
    CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
    CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
    
    CREATE INDEX IF NOT EXISTS idx_conversations_participant_id ON conversations(participant_id);
    
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
    CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
    
    CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
    CREATE INDEX IF NOT EXISTS idx_activities_entity_type ON activities(entity_type);
    CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);
  `);

  console.log('✅ Database schema initialized');
}

// Seed default data
export function seedDefaultData() {
  console.log('🌱 Seeding default data...');
  
  // Check if admin user exists
  const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get(process.env.ADMIN_EMAIL || 'admin@osborne.dev');
  
  if (!adminExists) {

    // Create admin user
    const adminPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
    const adminId = randomUUID();
    
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      adminId,
      process.env.ADMIN_EMAIL || 'admin@osborne.dev',
      adminPassword,
      'Osborne Fernandes',
      'admin',
      'active'
    );
    
    console.log('✅ Admin user created');
    
    // Create demo client
    const clientPassword = bcrypt.hashSync('client123', 10);
    const clientId = randomUUID();
    
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, company, phone, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      clientId,
      'client@demo.com',
      clientPassword,
      'John Smith',
      'client',
      'Demo Company',
      '+1 555-0100',
      'active'
    );
    
    console.log('✅ Demo client created');
    
    // Create sample projects
    const projects = [
      {
        id: randomUUID(),
        client_id: clientId,
        client_name: 'John Smith',
        client_email: 'client@demo.com',
        title: 'E-commerce Website Redesign',
        description: 'Complete redesign of the online store with modern UI/UX, improved checkout flow, and mobile responsiveness.',
        budget: '$8,500',
        timeline: '6 weeks',
        status: 'in-progress',
        category: 'Web Development',
        priority: 'high',
        progress: 65,
        notes: 'Client prefers minimalist design with dark mode option'
      },
      {
        id: randomUUID(),
        client_id: clientId,
        client_name: 'John Smith',
        client_email: 'client@demo.com',
        title: 'Mobile App Development',
        description: 'Cross-platform mobile application for iOS and Android with user authentication and real-time notifications.',
        budget: '$12,000',
        timeline: '10 weeks',
        status: 'pending',
        category: 'Mobile Development',
        priority: 'medium',
        progress: 15,
        notes: 'Waiting for final design approval'
      },
      {
        id: randomUUID(),
        client_id: clientId,
        client_name: 'John Smith',
        client_email: 'client@demo.com',
        title: 'Brand Identity Package',
        description: 'Complete brand identity including logo design, color palette, typography, and brand guidelines document.',
        budget: '$3,200',
        timeline: '3 weeks',
        status: 'completed',
        category: 'Branding',
        priority: 'medium',
        progress: 100,
        notes: 'Project delivered on time. Client very satisfied.'
      }
    ];
    
    const insertProject = db.prepare(`
      INSERT INTO projects (id, client_id, client_name, client_email, title, description, budget, timeline, status, category, priority, progress, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const project of projects) {
      insertProject.run(
        project.id,
        project.client_id,
        project.client_name,
        project.client_email,
        project.title,
        project.description,
        project.budget,
        project.timeline,
        project.status,
        project.category,
        project.priority,
        project.progress,
        project.notes
      );
    }
    
    console.log('✅ Sample projects created');
    
    // Create sample invoices
    const invoices = [
      {
        id: randomUUID(),
        invoice_number: 'INV-2024-0001',
        client_id: clientId,
        client_name: 'John Smith',
        client_email: 'client@demo.com',
        project_name: 'E-commerce Website Redesign',
        items: JSON.stringify([
          { description: 'UI/UX Design', quantity: 1, rate: 2500, amount: 2500 },
          { description: 'Frontend Development', quantity: 1, rate: 3500, amount: 3500 }
        ]),
        subtotal: 6000,
        tax: 600,
        total: 6600,
        status: 'paid',
        issue_date: '2024-01-10',
        due_date: '2024-01-25',
        paid_date: '2024-01-20',
        notes: 'Thank you for your prompt payment!'
      },
      {
        id: randomUUID(),
        invoice_number: 'INV-2024-0002',
        client_id: clientId,
        client_name: 'John Smith',
        client_email: 'client@demo.com',
        project_name: 'Mobile App Development',
        items: JSON.stringify([
          { description: 'App Development - Phase 1', quantity: 1, rate: 5000, amount: 5000 },
          { description: 'Testing & QA', quantity: 1, rate: 1500, amount: 1500 }
        ]),
        subtotal: 6500,
        tax: 650,
        total: 7150,
        status: 'sent',
        issue_date: '2024-01-25',
        due_date: '2024-02-10',
        notes: 'Payment due within 15 days'
      },
      {
        id: randomUUID(),
        invoice_number: 'INV-2024-0003',
        client_id: clientId,
        client_name: 'John Smith',
        client_email: 'client@demo.com',
        project_name: 'Brand Identity Package',
        items: JSON.stringify([
          { description: 'Logo Design', quantity: 1, rate: 1500, amount: 1500 },
          { description: 'Brand Guidelines', quantity: 1, rate: 1000, amount: 1000 },
          { description: 'Business Card Design', quantity: 1, rate: 500, amount: 500 }
        ]),
        subtotal: 3000,
        tax: 300,
        total: 3300,
        status: 'paid',
        issue_date: '2024-01-05',
        due_date: '2024-01-20',
        paid_date: '2024-01-15'
      }
    ];
    
    const insertInvoice = db.prepare(`
      INSERT INTO invoices (id, invoice_number, client_id, client_name, client_email, project_name, items, subtotal, tax, total, status, issue_date, due_date, paid_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const invoice of invoices) {
      insertInvoice.run(
        invoice.id,
        invoice.invoice_number,
        invoice.client_id,
        invoice.client_name,
        invoice.client_email,
        invoice.project_name,
        invoice.items,
        invoice.subtotal,
        invoice.tax,
        invoice.total,
        invoice.status,
        invoice.issue_date,
        invoice.due_date,
        invoice.paid_date,
        invoice.notes
      );
    }
    
    console.log('✅ Sample invoices created');
    
    // Create sample conversations and messages
    const conversationId = randomUUID();
    
    db.prepare(`
      INSERT INTO conversations (id, participant_id, participant_name, participant_email, last_message, last_message_time, unread_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      conversationId,
      clientId,
      'John Smith',
      'client@demo.com',
      'Hi! I\'ve completed the initial design mockups. Please review when you have time.',
      '2024-01-28T10:30:00.000Z',
      1
    );
    
    const messages = [
      {
        id: randomUUID(),
        conversation_id: conversationId,
        sender_id: 'admin',
        sender_name: 'Osborne Fernandes',
        sender_role: 'admin',
        recipient_id: clientId,
        recipient_name: 'John Smith',
        content: 'Hi John! I\'ve started working on your e-commerce website redesign. I\'ll have the initial mockups ready by Friday.',
        read: 1,
        created_at: '2024-01-25T09:00:00.000Z'
      },
      {
        id: randomUUID(),
        conversation_id: conversationId,
        sender_id: clientId,
        sender_name: 'John Smith',
        sender_role: 'client',
        recipient_id: 'admin',
        recipient_name: 'Osborne Fernandes',
        content: 'That sounds great! Looking forward to seeing the designs.',
        read: 1,
        created_at: '2024-01-25T10:15:00.000Z'
      },
      {
        id: randomUUID(),
        conversation_id: conversationId,
        sender_id: 'admin',
        sender_name: 'Osborne Fernandes',
        sender_role: 'admin',
        recipient_id: clientId,
        recipient_name: 'John Smith',
        content: 'Hi! I\'ve completed the initial design mockups. Please review when you have time.',
        read: 0,
        created_at: '2024-01-28T10:30:00.000Z'
      }
    ];
    
    const insertMessage = db.prepare(`
      INSERT INTO messages (id, conversation_id, sender_id, sender_name, sender_role, recipient_id, recipient_name, content, read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const message of messages) {
      insertMessage.run(
        message.id,
        message.conversation_id,
        message.sender_id,
        message.sender_name,
        message.sender_role,
        message.recipient_id,
        message.recipient_name,
        message.content,
        message.read,
        message.created_at
      );
    }
    
    console.log('✅ Sample messages created');
  }
  
  console.log('✅ Default data seeded');
}

// Database backup function
export function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = join(__dirname, `../backups/backup-${timestamp}.sqlite3`);
  
  try {
    db.backup(backupPath);
    console.log(`✅ Database backed up to: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error('❌ Database backup failed:', error);
    throw error;
  }
}

// Get database instance
export function getDatabase() {
  return db;
}

// Close database connection
export function closeDatabase() {
  db.close();
  console.log('✅ Database connection closed');
}

// Initialize and seed on import
initializeDatabase();
seedDefaultData();
