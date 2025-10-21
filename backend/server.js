const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const multer = require('multer');
const XLSX = require('xlsx');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Database connection
const dbPath = path.join(__dirname, 'loaner_database.sqlite');
console.log(`📍 Database location: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Connected to SQLite database');
    db.run('PRAGMA foreign_keys = ON');
  }
});

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Helper functions for database operations
const runQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) {
        console.error('Database error:', err);
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

const getQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        console.error('Database error:', err);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

const allQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// ============= AUTHENTICATION ROUTES =============

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    const user = await getQuery(
      'SELECT * FROM users WHERE username = ? AND active = 1',
      [username]
    );

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

    console.log(`✅ User ${username} logged in successfully`);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create user for loaner application (staff/admin only) - ENHANCED WITH DEBUGGING
app.post('/api/users/create-for-loaner', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const { username, password, name, email, role } = req.body;

    if (!username || !password || !name || !email) {
      return res.status(400).json({ error: 'Username, password, name, and email are required' });
    }

    console.log(`🔧 Creating user: ${username} (${name}) - ${email} as ${role || 'borrower'}`);

    // Check if user already exists
    const existingUser = await getQuery(
      'SELECT id, username, email, active FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser) {
      console.log(`⚠️ User already exists:`, existingUser);
      return res.status(400).json({ 
        error: 'User with this username or email already exists',
        existingUser: {
          id: existingUser.id,
          username: existingUser.username,
          email: existingUser.email,
          active: existingUser.active
        }
      });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const result = await runQuery(`
      INSERT INTO users (username, password, name, email, role, active) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [username, hashedPassword, name, email, role || 'borrower', 1]);

    // Verify the user was created by fetching it back
    const createdUser = await getQuery(
      'SELECT id, username, name, email, role, active, created_at FROM users WHERE id = ?',
      [result.id]
    );

    console.log(`✅ User created successfully:`, createdUser);

    res.json({ 
      id: result.id, 
      message: 'User created successfully for loaner application',
      createdUser: createdUser,
      username: username,
      email: email,
      created_by: req.user.username
    });

    console.log(`✅ User ${username} created for loaner application by ${req.user.username}`);
  } catch (error) {
    console.error('❌ Error creating user for loaner application:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Username or email already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Check if user exists by search term (admin/staff only)
app.get('/api/users/check/:searchTerm', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const searchTerm = req.params.searchTerm;
    
    const user = await getQuery(`
      SELECT id, username, name, email, role, active, created_at
      FROM users 
      WHERE (username = ? OR name = ? OR email = ?) OR 
            (username LIKE ? OR name LIKE ? OR email LIKE ?)
      ORDER BY 
        CASE 
          WHEN username = ? OR name = ? OR email = ? THEN 1
          ELSE 2
        END
      LIMIT 1
    `, [
      searchTerm, searchTerm, searchTerm,
      `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`,
      searchTerm, searchTerm, searchTerm
    ]);

    if (user) {
      res.json({
        found: true,
        user: user,
        searchTerm: searchTerm,
        message: `User found matching "${searchTerm}"`
      });
    } else {
      res.json({
        found: false,
        user: null,
        searchTerm: searchTerm,
        message: `No user found matching "${searchTerm}"`
      });
    }
  } catch (error) {
    console.error('Error checking user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============= STAFF-CREATED LOAN REQUESTS (AUTO-APPROVED) =============

// Create loan request by staff (staff/admin only) - automatically approved
app.post('/api/loans/staff-create', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const { 
      item_id, 
      borrower_id,
      borrower_name,
      borrower_email,
      expected_return, 
      reason,
      auto_approve 
    } = req.body;
    
    if (!item_id || !expected_return || !reason) {
      return res.status(400).json({ error: 'Required fields: item_id, expected_return, reason' });
    }
    
    // Check if item exists and is available
    const item = await getQuery('SELECT asset_id, status FROM items WHERE id = ?', [item_id]);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    if (item.status !== 'available') {
      return res.status(400).json({ error: 'Item is not available for loan' });
    }

    // If borrower_id is provided, verify the user exists (ANY ACTIVE USER)
    let finalBorrowerId = borrower_id;
    if (!finalBorrowerId && borrower_email) {
      // Try to find user by email - any active user
      const existingUser = await getQuery('SELECT id FROM users WHERE email = ? AND active = 1', [borrower_email]);
      if (existingUser) {
        finalBorrowerId = existingUser.id;
      }
    }

    if (!finalBorrowerId) {
      return res.status(400).json({ error: 'Borrower ID is required or user not found' });
    }

    // Verify the user exists and is active (any role allowed)
    const borrowerUser = await getQuery('SELECT name, email, role FROM users WHERE id = ? AND active = 1', [finalBorrowerId]);
    if (!borrowerUser) {
      return res.status(400).json({ error: 'User not found or inactive' });
    }

    // Check for existing pending/active loan for this user+item combination
    const existingLoan = await getQuery(
      'SELECT id FROM loans WHERE item_id = ? AND borrower_id = ? AND status IN ("pending", "active")',
      [item_id, finalBorrowerId]
    );
    if (existingLoan) {
      return res.status(400).json({ error: 'User already has a pending or active loan for this item' });
    }

    // For staff-created loans, automatically approve them if requested
    const loanStatus = auto_approve ? 'active' : 'pending';
    const approvedBy = auto_approve ? req.user.id : null;
    const approvedDate = auto_approve ? new Date().toISOString().split('T')[0] : null;
    const checkoutDate = auto_approve ? new Date().toISOString().split('T')[0] : null;

    const result = await runQuery(`
      INSERT INTO loans (
        item_id, borrower_id, request_date, expected_return, reason,
        status, approved_by, approved_date, checkout_date
      ) VALUES (?, ?, DATE("now"), ?, ?, ?, ?, ?, ?)
    `, [
      item_id, 
      finalBorrowerId, 
      expected_return, 
      reason,
      loanStatus,
      approvedBy,
      approvedDate,
      checkoutDate
    ]);

    // If auto-approved, update item status to loaned
    if (auto_approve) {
      await runQuery('UPDATE items SET status = "loaned", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [item_id]);
    }

    res.json({ 
      id: result.id, 
      message: auto_approve ? 'Staff loan request created and automatically approved' : 'Staff loan request created successfully',
      item_asset_id: item.asset_id,
      borrower_name: borrower_name || borrowerUser.name,
      borrower_role: borrowerUser.role,
      created_by: req.user.username,
      status: loanStatus,
      auto_approved: auto_approve
    });

    console.log(`✅ Staff loan request ${auto_approve ? 'created and approved' : 'created'} for item ${item.asset_id} to ${borrowerUser.name} (${borrowerUser.role}) by ${req.user.username}`);
  } catch (error) {
    console.error('Error creating staff loan request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register new user (admin only) - COMPATIBLE WITH EXISTING SCHEMA
app.post('/api/auth/register', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { username, password, name, email, role } = req.body;

    if (!username || !password || !name || !email || !role) {
      return res.status(400).json({ error: 'Required fields: username, password, name, email, role' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const result = await runQuery(
      `INSERT INTO users (username, password, name, email, role) VALUES (?, ?, ?, ?, ?)`,
      [username, hashedPassword, name, email, role]
    );

    res.json({ id: result.id, message: 'User created successfully' });
    console.log(`✅ User ${username} created by admin ${req.user.username}`);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Username or email already exists' });
    } else {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// ============= USER ROUTES =============

// Get all users (admin/staff only) - UPDATED TO INCLUDE STAFF ACCESS
app.get('/api/users', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const users = await allQuery(`
      SELECT u.id, u.username, u.name, u.email, u.role, u.active, u.created_at, 
             COUNT(l.id) as active_loans
      FROM users u
      LEFT JOIN loans l ON u.id = l.borrower_id AND l.status = 'active'
      GROUP BY u.id
      ORDER BY u.name
    `);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get users with search functionality (admin/staff only) - SAME AS ADMIN SEARCH
app.get('/api/users/search', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const { q, role, limit = 20 } = req.query;
    
    let query = `
      SELECT u.id, u.username, u.name, u.email, u.role, u.active, u.created_at,
             COUNT(l.id) as active_loans
      FROM users u
      LEFT JOIN loans l ON u.id = l.borrower_id AND l.status = 'active'
      WHERE u.active = 1
    `;
    
    let params = [];

    // Add search criteria if provided
    if (q && q.length >= 1) {
      query += ` AND (
        u.name LIKE ? OR 
        u.username LIKE ? OR 
        u.email LIKE ? OR
        LOWER(u.name) LIKE LOWER(?) OR 
        LOWER(u.username) LIKE LOWER(?) OR 
        LOWER(u.email) LIKE LOWER(?)
      )`;
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Filter by role if specified
    if (role && role !== 'all' && role !== '') {
      query += ' AND u.role = ?';
      params.push(role);
    }

    query += ` GROUP BY u.id ORDER BY u.name LIMIT ?`;
    params.push(parseInt(limit));

    const users = await allQuery(query, params);
    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get borrower users for loan creation (admin/staff only)
app.get('/api/users/borrowers', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const borrowers = await allQuery(`
      SELECT u.id, u.username, u.name, u.email, u.role, u.active,
             COUNT(l.id) as active_loans
      FROM users u
      LEFT JOIN loans l ON u.id = l.borrower_id AND l.status = 'active'
      WHERE u.active = 1
      GROUP BY u.id
      ORDER BY u.name
    `);
    res.json(borrowers);
  } catch (error) {
    console.error('Error fetching borrower users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all active users for staff/admin (admin/staff only)
app.get('/api/users/all-active', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const users = await allQuery(`
      SELECT u.id, u.username, u.name, u.email, u.role, u.active, u.created_at,
             COUNT(l.id) as active_loans
      FROM users u
      LEFT JOIN loans l ON u.id = l.borrower_id AND l.status = 'active'
      WHERE u.active = 1
      GROUP BY u.id
      ORDER BY u.name
    `);
    res.json(users);
  } catch (error) {
    console.error('Error fetching all active users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const user = await getQuery(
      `SELECT id, username, name, email, role, created_at FROM users WHERE id = ?`,
      [req.user.id]
    );
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID (admin/staff only) - FOR LOAN MANAGEMENT
app.get('/api/users/:id', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const user = await getQuery(`
      SELECT u.id, u.username, u.name, u.email, u.role, u.active, u.created_at,
             COUNT(l.id) as active_loans
      FROM users u
      LEFT JOIN loans l ON u.id = l.borrower_id AND l.status = 'active'
      WHERE u.id = ?
      GROUP BY u.id
    `, [req.params.id]);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user (admin only) - KEPT ADMIN-ONLY FOR SECURITY
app.put('/api/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, email, role, active } = req.body;
    const userId = req.params.id;

    const result = await runQuery(
      `UPDATE users SET name = ?, email = ?, role = ?, active = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [name, email, role, active, userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User updated successfully' });
    console.log(`✅ User ${userId} updated by admin ${req.user.username}`);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Staff-friendly user lookup endpoint (admin/staff only)
app.get('/api/users/lookup', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const { search, role, active = '1', limit = 50 } = req.query;
    
    let query = `
      SELECT u.id, u.username, u.name, u.email, u.role, u.active, u.created_at,
             COUNT(l.id) as active_loans,
             MAX(l.created_at) as last_loan_date
      FROM users u
      LEFT JOIN loans l ON u.id = l.borrower_id
      WHERE 1=1
    `;
    
    let params = [];

    // Filter by active status
    if (active !== 'all') {
      query += ' AND u.active = ?';
      params.push(parseInt(active));
    }

    // Add search functionality
    if (search && search.length >= 1) {
      query += ` AND (
        u.name LIKE ? OR 
        u.username LIKE ? OR 
        u.email LIKE ? OR
        LOWER(u.name) LIKE LOWER(?) OR 
        LOWER(u.username) LIKE LOWER(?) OR 
        LOWER(u.email) LIKE LOWER(?)
      )`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Filter by role if specified
    if (role && role !== 'all' && role !== '') {
      query += ' AND u.role = ?';
      params.push(role);
    }

    query += ` GROUP BY u.id ORDER BY u.name LIMIT ?`;
    params.push(parseInt(limit));

    const users = await allQuery(query, params);
    
    res.json({
      users: users,
      total: users.length,
      filters: {
        search: search || '',
        role: role || 'all',
        active: active,
        limit: limit
      },
      generatedBy: req.user.username,
      userRole: req.user.role
    });
  } catch (error) {
    console.error('Error in user lookup:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (admin only) - Soft delete
app.delete('/api/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const userId = req.params.id;
    
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const activeLoans = await getQuery(
      'SELECT COUNT(*) as count FROM loans WHERE borrower_id = ? AND status IN ("active", "pending")',
      [userId]
    );

    if (activeLoans.count > 0) {
      return res.status(400).json({ error: 'Cannot delete user with active or pending loans' });
    }

    const result = await runQuery(
      'UPDATE users SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deactivated successfully' });
    console.log(`✅ User ${userId} deactivated by admin ${req.user.username}`);
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/*
=============================================================================
STAFF USER ACCESS ENDPOINTS - NOW SAME AS ADMIN:

USER SEARCH & LOOKUP (admin/staff):
- GET /api/users - Get all users (now includes staff access)
- GET /api/users/search?q=term&role=&limit= - Search users with filters  
- GET /api/users/lookup?search=term&role=&active=1&limit= - Advanced user lookup
- GET /api/users/:id - Get specific user by ID
- GET /api/users/borrowers - Get all active users (renamed from borrowers)
- GET /api/users/all-active - Get all active users
- GET /api/search/users?q=term&role= - Search for loan creation

USER CREATION (admin/staff):
- POST /api/users/create-for-loaner - Create user for loans

DEBUGGING (admin/staff):
- GET /api/debug/users - See all recent users
- GET /api/debug/search-test/:term - Test search functionality  
- GET /api/users/check/:term - Check if user exists

USER MANAGEMENT (admin only):
- PUT /api/users/:id - Update user (kept admin-only for security)
- DELETE /api/users/:id - Delete user (admin only)
- POST /api/auth/register - Create user via admin panel (admin only)

STAFF NOW HAS SAME SEARCH ACCESS AS ADMIN FOR LOAN CREATION!
=============================================================================
*/

// ============= CATEGORY & LOCATION ROUTES =============

// Get categories
app.get('/api/categories', authenticateToken, async (req, res) => {
  try {
    const categories = await allQuery('SELECT * FROM categories ORDER BY name');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get locations
app.get('/api/locations', authenticateToken, async (req, res) => {
  try {
    const locations = await allQuery('SELECT * FROM locations ORDER BY name');
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============= ITEM ROUTES =============

// Get all items with category and location info
app.get('/api/items', authenticateToken, async (req, res) => {
  try {
    const { status, type, search } = req.query;
    
    let query = `
      SELECT i.*, c.name as category_name, l.name as location_name, l.description as location_description
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN locations l ON i.location_id = l.id
      WHERE 1=1
    `;
    let params = [];

    if (status && status !== 'all') {
      query += ' AND i.status = ?';
      params.push(status);
    }

    if (type && type !== 'all') {
      query += ' AND i.type = ?';
      params.push(type);
    }

    if (search) {
      query += ` AND (i.asset_id LIKE ? OR i.type LIKE ? OR i.brand LIKE ? OR i.model LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY i.asset_id';

    const items = await allQuery(query, params);
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new item (admin/staff only) - COMPATIBLE WITH EXISTING SCHEMA
app.post('/api/items', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const { 
      asset_id, type, category_id, brand, model, serial_number, 
      purchase_date, purchase_price, warranty_expiry, condition, location_id, notes
    } = req.body;
    
    if (!asset_id || !type || !brand || !model || !serial_number) {
      return res.status(400).json({ error: 'Required fields: asset_id, type, brand, model, serial_number' });
    }
    
    const result = await runQuery(`
      INSERT INTO items (
        asset_id, type, category_id, brand, model, serial_number, 
        purchase_date, purchase_price, warranty_expiry, condition, location_id, notes
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      asset_id, type, category_id, brand, model, serial_number, 
      purchase_date, purchase_price, warranty_expiry, condition || 'good', location_id, notes
    ]);

    res.json({ id: result.id, message: 'Item created successfully' });
    console.log(`✅ Item ${asset_id} created by ${req.user.username}`);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Asset ID or serial number already exists' });
    } else {
      console.error('Error creating item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update item (admin/staff only) - COMPATIBLE WITH EXISTING SCHEMA
app.put('/api/items/:id', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const { 
      asset_id, type, category_id, brand, model, serial_number, 
      purchase_date, purchase_price, warranty_expiry, status, condition, location_id, notes
    } = req.body;
    
    const result = await runQuery(`
      UPDATE items SET 
        asset_id = ?, type = ?, category_id = ?, brand = ?, model = ?, 
        serial_number = ?, purchase_date = ?, purchase_price = ?, warranty_expiry = ?, 
        status = ?, condition = ?, location_id = ?, notes = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [
      asset_id, type, category_id, brand, model, serial_number, 
      purchase_date, purchase_price, warranty_expiry, status, condition, location_id, 
      notes, req.params.id
    ]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item updated successfully' });
    console.log(`✅ Item ${req.params.id} updated by ${req.user.username}`);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Import items from Excel - COMPATIBLE WITH EXISTING SCHEMA
app.post('/api/items/import', authenticateToken, requireRole(['admin', 'staff']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    let imported = 0;
    let errors = [];

    for (const row of data) {
      try {
        await runQuery(`
          INSERT INTO items (
            asset_id, type, category_id, brand, model, serial_number, 
            purchase_date, purchase_price, condition, location_id, notes
          ) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          row['Asset ID'] || row['asset_id'],
          row['Type'] || row['type'] || 'Other',
          1, // Default category
          row['Brand'] || row['brand'],
          row['Model'] || row['model'],
          row['Serial Number'] || row['serial_number'],
          row['Purchase Date'] || row['purchase_date'] || null,
          row['Purchase Price'] || row['purchase_price'] || null,
          row['Condition'] || row['condition'] || 'good',
          1, // Default location
          row['Notes'] || row['notes'] || ''
        ]);
        imported++;
      } catch (error) {
        errors.push(`Row ${imported + errors.length + 1}: ${error.message}`);
      }
    }

    // Clean up uploaded file
    require('fs').unlinkSync(req.file.path);

    res.json({ imported, errors, message: `Successfully imported ${imported} items` });
    console.log(`✅ ${imported} items imported by ${req.user.username}`);
  } catch (error) {
    console.error('Error importing items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single item with full details
app.get('/api/items/:id', authenticateToken, async (req, res) => {
  try {
    const item = await getQuery(`
      SELECT i.*, c.name as category_name, l.name as location_name, l.description as location_description
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN locations l ON i.location_id = l.id
      WHERE i.id = ?
    `, [req.params.id]);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark item for maintenance (admin/staff only)
app.post('/api/items/:id/maintenance', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const { maintenance_notes, maintenance_type } = req.body;
    const itemId = req.params.id;

    // Check if item exists and is not currently loaned
    const item = await getQuery('SELECT asset_id, status FROM items WHERE id = ?', [itemId]);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.status === 'loaned') {
      return res.status(400).json({ error: 'Cannot mark loaned item for maintenance. Please return the item first.' });
    }

    // Update item status to maintenance
    await runQuery(`
      UPDATE items SET 
        status = 'maintenance', 
        notes = CASE 
          WHEN notes IS NULL OR notes = '' THEN ?
          ELSE notes || ' | ' || ?
        END,
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [
      `MAINTENANCE: ${maintenance_notes || 'Marked for maintenance'} (${new Date().toISOString().split('T')[0]})`,
      `MAINTENANCE: ${maintenance_notes || 'Marked for maintenance'} (${new Date().toISOString().split('T')[0]})`,
      itemId
    ]);

    res.json({ 
      message: 'Item marked for maintenance successfully',
      asset_id: item.asset_id,
      marked_by: req.user.username,
      maintenance_type: maintenance_type || 'General',
      date: new Date().toISOString().split('T')[0]
    });

    console.log(`✅ Item ${item.asset_id} marked for maintenance by ${req.user.username}`);
  } catch (error) {
    console.error('Error marking item for maintenance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark item as available from maintenance (admin/staff only)
app.post('/api/items/:id/available', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const { completion_notes } = req.body;
    const itemId = req.params.id;

    // Check if item exists and is in maintenance
    const item = await getQuery('SELECT asset_id, status FROM items WHERE id = ?', [itemId]);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.status !== 'maintenance') {
      return res.status(400).json({ error: 'Item is not currently in maintenance' });
    }

    // Update item status to available
    await runQuery(`
      UPDATE items SET 
        status = 'available', 
        notes = CASE 
          WHEN notes IS NULL OR notes = '' THEN ?
          ELSE notes || ' | ' || ?
        END,
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [
      `MAINTENANCE COMPLETED: ${completion_notes || 'Maintenance completed'} (${new Date().toISOString().split('T')[0]})`,
      `MAINTENANCE COMPLETED: ${completion_notes || 'Maintenance completed'} (${new Date().toISOString().split('T')[0]})`,
      itemId
    ]);

    res.json({ 
      message: 'Item marked as available successfully',
      asset_id: item.asset_id,
      completed_by: req.user.username,
      date: new Date().toISOString().split('T')[0]
    });

    console.log(`✅ Item ${item.asset_id} maintenance completed by ${req.user.username}`);
  } catch (error) {
    console.error('Error marking item as available:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.delete('/api/items/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const activeLoan = await getQuery('SELECT id FROM loans WHERE item_id = ? AND status IN ("active", "pending")', [req.params.id]);
    if (activeLoan) {
      return res.status(400).json({ error: 'Cannot delete item with active or pending loans' });
    }

    const result = await runQuery('DELETE FROM items WHERE id = ?', [req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item deleted successfully' });
    console.log(`✅ Item ${req.params.id} deleted by ${req.user.username}`);
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============= LOAN ROUTES =============

// Get loans with full details - ENHANCED WITH RETURNED_BY TRACKING
app.get('/api/loans', authenticateToken, async (req, res) => {
  try {
    const { borrower, status, search } = req.query;
    
    let query = `
      SELECT l.*, 
             i.asset_id, i.type, i.brand, i.model,
             u.name as borrower_name, u.email as borrower_email,
             a.name as approved_by_name,
             r.name as returned_by_name
      FROM loans l
      JOIN items i ON l.item_id = i.id
      LEFT JOIN users u ON l.borrower_id = u.id
      LEFT JOIN users a ON l.approved_by = a.id
      LEFT JOIN users r ON l.returned_by = r.id
      WHERE 1=1
    `;
    let params = [];

    if (req.user.role === 'borrower') {
      query += ' AND l.borrower_id = ?';
      params.push(req.user.id);
    }

    if (borrower && borrower !== 'all') {
      query += ' AND l.borrower_id = ?';
      params.push(borrower);
    }

    if (status && status !== 'all') {
      query += ' AND l.status = ?';
      params.push(status);
    }

    if (search) {
      query += ` AND (i.asset_id LIKE ? OR u.name LIKE ? OR l.reason LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY l.created_at DESC';

    const loans = await allQuery(query, params);
    res.json(loans);
  } catch (error) {
    console.error('Error fetching loans:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create loan request - COMPATIBLE WITH EXISTING SCHEMA
app.post('/api/loans', authenticateToken, async (req, res) => {
  try {
    const { item_id, expected_return, reason } = req.body;
    
    if (!item_id || !expected_return || !reason) {
      return res.status(400).json({ error: 'Required fields: item_id, expected_return, reason' });
    }
    
    const item = await getQuery('SELECT asset_id, status FROM items WHERE id = ?', [item_id]);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    if (item.status !== 'available') {
      return res.status(400).json({ error: 'Item is not available for loan' });
    }

    // Check for existing pending/active loan for this user+item combination
    const existingLoan = await getQuery(
      'SELECT id FROM loans WHERE item_id = ? AND borrower_id = ? AND status IN ("pending", "active")',
      [item_id, req.user.id]
    );
    if (existingLoan) {
      return res.status(400).json({ error: 'You already have a pending or active loan for this item' });
    }

    const result = await runQuery(`
      INSERT INTO loans (item_id, borrower_id, request_date, expected_return, reason) 
      VALUES (?, ?, DATE("now"), ?, ?)
    `, [item_id, req.user.id, expected_return, reason]);

    res.json({ id: result.id, message: 'Loan request created successfully' });
    console.log(`✅ Loan request created for item ${item.asset_id} by ${req.user.username}`);
  } catch (error) {
    console.error('Error creating loan request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve loan (admin only) - UPDATED AUTHORIZATION
app.post('/api/loans/:id/approve', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const loan = await getQuery(
      'SELECT item_id, borrower_id FROM loans WHERE id = ? AND status = "pending"',
      [req.params.id]
    );
    if (!loan) {
      return res.status(404).json({ error: 'Pending loan not found' });
    }

    const item = await getQuery('SELECT status FROM items WHERE id = ?', [loan.item_id]);
    if (item.status !== 'available') {
      return res.status(400).json({ error: 'Item is no longer available' });
    }

    await runQuery(`
      UPDATE loans SET 
        status = "active", 
        approved_by = ?, 
        approved_date = DATE("now"), 
        checkout_date = DATE("now"),
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [req.user.id, req.params.id]);

    await runQuery('UPDATE items SET status = "loaned", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [loan.item_id]);

    res.json({ message: 'Loan approved successfully' });
    console.log(`✅ Loan ${req.params.id} approved by ${req.user.username}`);
  } catch (error) {
    console.error('Error approving loan:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Deny loan (admin only) - UPDATED AUTHORIZATION
app.post('/api/loans/:id/deny', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const result = await runQuery(
      'UPDATE loans SET status = "denied", updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = "pending"',
      [req.params.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Pending loan not found' });
    }

    res.json({ message: 'Loan denied successfully' });
    console.log(`✅ Loan ${req.params.id} denied by ${req.user.username}`);
  } catch (error) {
    console.error('Error denying loan:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Return item (admin/staff only) - WITH RETURNED_BY TRACKING
app.post('/api/loans/:id/return', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const { return_condition, return_notes } = req.body;

    const loan = await getQuery('SELECT item_id FROM loans WHERE id = ? AND status = "active"', [req.params.id]);
    if (!loan) {
      return res.status(404).json({ error: 'Active loan not found' });
    }

    // First check if returned_by column exists, if not, update without it
    try {
      await runQuery(`
        UPDATE loans SET 
          status = "returned", 
          actual_return = DATE("now"),
          return_condition = ?,
          return_notes = ?,
          returned_by = ?,
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [return_condition, return_notes, req.user.id, req.params.id]);
    } catch (error) {
      // If returned_by column doesn't exist, update without it
      if (error.message.includes('no such column: returned_by')) {
        await runQuery(`
          UPDATE loans SET 
            status = "returned", 
            actual_return = DATE("now"),
            return_condition = ?,
            return_notes = ?,
            updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `, [return_condition, return_notes, req.params.id]);
      } else {
        throw error;
      }
    }

    let itemUpdateQuery = 'UPDATE items SET status = "available", updated_at = CURRENT_TIMESTAMP';
    let itemParams = [];
    
    if (return_condition) {
      itemUpdateQuery += ', condition = ?';
      itemParams.push(return_condition);
    }
    
    itemUpdateQuery += ' WHERE id = ?';
    itemParams.push(loan.item_id);
    
    await runQuery(itemUpdateQuery, itemParams);

    res.json({ 
      message: 'Item returned successfully',
      returned_by: req.user.username,
      return_date: new Date().toISOString().split('T')[0]
    });
    console.log(`✅ Item returned for loan ${req.params.id} by ${req.user.username}`);
  } catch (error) {
    console.error('Error returning item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============= DASHBOARD & REPORTS ROUTES =============

// Dashboard statistics
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const [
      totalItems, availableItems, loanedItems, maintenanceItems, 
      pendingLoans, activeLoans, overdueLoans, totalUsers
    ] = await Promise.all([
      getQuery('SELECT COUNT(*) as count FROM items'),
      getQuery('SELECT COUNT(*) as count FROM items WHERE status = "available"'),
      getQuery('SELECT COUNT(*) as count FROM items WHERE status = "loaned"'),
      getQuery('SELECT COUNT(*) as count FROM items WHERE status = "maintenance"'),
      getQuery('SELECT COUNT(*) as count FROM loans WHERE status = "pending"'),
      getQuery('SELECT COUNT(*) as count FROM loans WHERE status = "active"'),
      getQuery('SELECT COUNT(*) as count FROM loans WHERE status = "active" AND expected_return < DATE("now")'),
      getQuery('SELECT COUNT(*) as count FROM users WHERE active = 1')
    ]);

    res.json({
      totalItems: totalItems.count,
      availableItems: availableItems.count,
      loanedItems: loanedItems.count,
      maintenanceItems: maintenanceItems.count,
      pendingLoans: pendingLoans.count,
      activeLoans: activeLoans.count,
      overdueLoans: overdueLoans.count,
      totalUsers: totalUsers.count
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get overdue loans report (admin/staff only)
app.get('/api/reports/overdue', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const overdueLoans = await allQuery(`
      SELECT l.id, l.item_id, l.borrower_id, l.request_date, l.checkout_date, 
             l.expected_return, l.reason, l.status,
             i.asset_id, i.type, i.brand, i.model, 
             u.name as borrower_name, u.email as borrower_email,
             CAST(julianday('now') - julianday(l.expected_return) AS INTEGER) as days_overdue
      FROM loans l
      JOIN items i ON l.item_id = i.id
      LEFT JOIN users u ON l.borrower_id = u.id
      WHERE l.status = 'active' AND l.expected_return < DATE('now')
      ORDER BY days_overdue DESC
    `);

    res.json(overdueLoans);
  } catch (error) {
    console.error('Error fetching overdue loans:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export loans to CSV (admin/staff only)
app.get('/api/reports/loans-csv', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const loans = await allQuery(`
      SELECT 
        l.id as loan_id,
        i.asset_id,
        i.type as item_type,
        i.brand,
        i.model,
        u.name as borrower_name,
        u.email as borrower_email,
        l.status,
        l.request_date,
        l.approved_date,
        l.checkout_date,
        l.expected_return,
        l.actual_return,
        l.reason,
        l.return_condition,
        l.return_notes,
        a.name as approved_by_name,
        r.name as returned_by_name
      FROM loans l
      JOIN items i ON l.item_id = i.id
      LEFT JOIN users u ON l.borrower_id = u.id
      LEFT JOIN users a ON l.approved_by = a.id
      LEFT JOIN users r ON l.returned_by = r.id
      ORDER BY l.created_at DESC
    `);

    // Convert to CSV format
    const headers = [
      'Loan ID', 'Asset ID', 'Item Type', 'Brand', 'Model', 
      'Borrower Name', 'Borrower Email', 'Status', 
      'Request Date', 'Approved Date', 'Checkout Date', 
      'Expected Return', 'Actual Return', 'Reason',
      'Return Condition', 'Return Notes', 'Approved By', 'Returned By'
    ];

    const csvRows = [headers.join(',')];
    
    loans.forEach(loan => {
      const row = [
        loan.loan_id || '',
        loan.asset_id || '',
        loan.item_type || '',
        loan.brand || '',
        loan.model || '',
        loan.borrower_name || '',
        loan.borrower_email || '',
        loan.status || '',
        loan.request_date || '',
        loan.approved_date || '',
        loan.checkout_date || '',
        loan.expected_return || '',
        loan.actual_return || '',
        `"${(loan.reason || '').replace(/"/g, '""')}"`,
        loan.return_condition || '',
        `"${(loan.return_notes || '').replace(/"/g, '""')}"`,
        loan.approved_by_name || '',
        loan.returned_by_name || ''
      ];
      csvRows.push(row.join(','));
    });

    const csv = csvRows.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="loans_export_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);

    console.log(`✅ Loans CSV exported by ${req.user.username}`);
  } catch (error) {
    console.error('Error exporting loans CSV:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export overdue loans to CSV (admin/staff only)
app.get('/api/reports/overdue-csv', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const overdueLoans = await allQuery(`
      SELECT 
        l.id as loan_id,
        i.asset_id,
        i.type as item_type,
        i.brand,
        i.model,
        u.name as borrower_name,
        u.email as borrower_email,
        l.checkout_date,
        l.expected_return,
        l.reason,
        CAST(julianday('now') - julianday(l.expected_return) AS INTEGER) as days_overdue
      FROM loans l
      JOIN items i ON l.item_id = i.id
      LEFT JOIN users u ON l.borrower_id = u.id
      WHERE l.status = 'active' AND l.expected_return < DATE('now')
      ORDER BY days_overdue DESC
    `);

    // Convert to CSV format
    const headers = [
      'Loan ID', 'Asset ID', 'Item Type', 'Brand', 'Model',
      'Borrower Name', 'Borrower Email', 'Checkout Date', 
      'Expected Return', 'Days Overdue', 'Reason'
    ];

    const csvRows = [headers.join(',')];
    
    overdueLoans.forEach(loan => {
      const row = [
        loan.loan_id || '',
        loan.asset_id || '',
        loan.item_type || '',
        loan.brand || '',
        loan.model || '',
        loan.borrower_name || '',
        loan.borrower_email || '',
        loan.checkout_date || '',
        loan.expected_return || '',
        loan.days_overdue || '',
        `"${(loan.reason || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });

    const csv = csvRows.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="overdue_loans_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);

    console.log(`✅ Overdue loans CSV exported by ${req.user.username}`);
  } catch (error) {
    console.error('Error exporting overdue loans CSV:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get maintenance items report (admin/staff only)
app.get('/api/reports/maintenance', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const maintenanceItems = await allQuery(`
      SELECT i.id, i.asset_id, i.type, i.brand, i.model, i.condition, i.notes,
             c.name as category_name, l.name as location_name,
             i.created_at, i.updated_at
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN locations l ON i.location_id = l.id
      WHERE i.status = 'maintenance'
      ORDER BY i.updated_at DESC
    `);

    res.json(maintenanceItems);
  } catch (error) {
    console.error('Error fetching maintenance items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export maintenance items to CSV (admin/staff only)
app.get('/api/reports/maintenance-csv', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const maintenanceItems = await allQuery(`
      SELECT i.id, i.asset_id, i.type, i.brand, i.model, i.condition, i.notes,
             c.name as category_name, l.name as location_name,
             i.created_at, i.updated_at
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN locations l ON i.location_id = l.id
      WHERE i.status = 'maintenance'
      ORDER BY i.updated_at DESC
    `);

    // Convert to CSV format
    const headers = [
      'Asset ID', 'Type', 'Category', 'Brand', 'Model', 'Condition',
      'Location', 'Maintenance Notes', 'Last Updated'
    ];

    const csvRows = [headers.join(',')];
    
    maintenanceItems.forEach(item => {
      const row = [
        item.asset_id || '',
        item.type || '',
        item.category_name || '',
        item.brand || '',
        item.model || '',
        item.condition || '',
        item.location_name || '',
        `"${(item.notes || '').replace(/"/g, '""')}"`,
        item.updated_at || ''
      ];
      csvRows.push(row.join(','));
    });

    const csv = csvRows.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="maintenance_items_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);

    console.log(`✅ Maintenance items CSV exported by ${req.user.username}`);
  } catch (error) {
    console.error('Error exporting maintenance items CSV:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.get('/api/reports/inventory-csv', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const items = await allQuery(`
      SELECT 
        i.*,
        c.name as category_name,
        l.name as location_name
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN locations l ON i.location_id = l.id
      ORDER BY i.asset_id
    `);

    // Convert to CSV format
    const headers = [
      'Asset ID', 'Type', 'Category', 'Brand', 'Model', 'Serial Number',
      'Purchase Date', 'Purchase Price', 'Warranty Expiry', 'Status', 
      'Condition', 'Location', 'Notes'
    ];

    const csvRows = [headers.join(',')];
    
    items.forEach(item => {
      const row = [
        item.asset_id || '',
        item.type || '',
        item.category_name || '',
        item.brand || '',
        item.model || '',
        item.serial_number || '',
        item.purchase_date || '',
        item.purchase_price || '',
        item.warranty_expiry || '',
        item.status || '',
        item.condition || '',
        item.location_name || '',
        `"${(item.notes || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });

    const csv = csvRows.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="inventory_export_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);

    console.log(`✅ Inventory CSV exported by ${req.user.username}`);
  } catch (error) {
    console.error('Error exporting inventory CSV:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/*
=============================================================================
UPDATED USER SEARCH & ACCESS FOR STAFF:

FIXED SEARCH VISIBILITY:
- Removed default role='borrower' restriction from user search
- Staff/Admin can now see ALL active users in search results
- Search now works across name, email, username for any user role
- Increased search results limit to 15 for better coverage

ENHANCED USER ACCESS:
- GET /api/users/borrowers - Now shows ALL active users (not just borrowers)
- GET /api/users/all-active - New endpoint for complete user list
- GET /api/search/users - No role restrictions by default
- Staff can create loans for ANY active user (admin, staff, borrower roles)

LOAN CREATION IMPROVEMENTS:
- Quick loan creation works with any user role
- Staff loan creation accepts any active user
- Auto-population now includes all users created by any profile
- Enhanced logging shows user role in loan creation

=============================================================================
*/

// Health check and database info
app.get('/api/health', async (req, res) => {
  try {
    const testQuery = await getQuery('SELECT COUNT(*) as count FROM users');
    
    res.json({ 
      status: 'OK', 
      message: 'GSU Loaner API is running',
      database: 'Connected',
      users: testQuery.count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Database connection failed',
      error: error.message 
    });
  }
});

// Database maintenance - Add returned_by column if it doesn't exist (admin only)
app.post('/api/maintenance/add-returned-by-column', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // Check if column exists
    const tableInfo = await allQuery("PRAGMA table_info(loans)");
    const hasReturnedBy = tableInfo.some(column => column.name === 'returned_by');
    
    if (!hasReturnedBy) {
      await runQuery('ALTER TABLE loans ADD COLUMN returned_by INTEGER REFERENCES users(id)');
      res.json({ 
        message: 'returned_by column added successfully',
        performed_by: req.user.username 
      });
      console.log(`✅ returned_by column added to loans table by ${req.user.username}`);
    } else {
      res.json({ 
        message: 'returned_by column already exists',
        performed_by: req.user.username 
      });
    }
  } catch (error) {
    console.error('Error adding returned_by column:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('❌ Error closing database:', err.message);
    } else {
      console.log('✅ Database connection closed');
    }
    process.exit(0);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 GSU Loaner API Server Started`);
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`💾 Database: ${dbPath}`);
  console.log(`🕒 Started at: ${new Date().toISOString()}\n`);
});