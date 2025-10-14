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

// Add error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Database connection
const dbPath = path.join(__dirname, '..', 'loaner_database.sqlite');
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

// Check if the users table exists; if not, run the init script
const ensureDatabaseInitialized = () => {
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
    if (err) {
      console.error('Error checking database schema:', err);
      return;
    }
    if (!row) {
      console.log('Users table missing — running database initializer.');
      try {
        require('./initDatabase');
        console.log('Database initializer executed.');
      } catch (e) {
        console.error('Failed to run initDatabase.js:', e);
      }
    } else {
      console.log('Database schema OK.');
    }
  });
};

// Run the check after a small delay to ensure DB connection is ready
setTimeout(ensureDatabaseInitialized, 200);

// Middleware
const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Request Headers:', req.headers);
  console.log('Request Body:', req.body);
  next();
});

// Root route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
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

// Login
// Helper function to run SQL queries
const getQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('Database error:', err);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login attempt received:', { 
      headers: req.headers,
      body: req.body 
    });
    
    const { username, password } = req.body;
    
    if (!username || !password) {
      console.log('Login failed: Missing username or password');
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

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`👉 API endpoint available at http://localhost:${PORT}/api`);
});
