const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// Create database file
const dbPath = path.join(__dirname, '..', 'loaner_database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Initializing database...');

// Create tables
db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'staff', 'borrower')),
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  const saltRounds = 10;
  const demoUsers = [
    { username: 'admin', password: 'admin123', name: 'System Administrator', email: 'admin@company.com', role: 'admin' },
    { username: 'staff', password: 'staff123', name: 'IT Staff', email: 'staff@company.com', role: 'staff' },
    { username: 'user1', password: 'user123', name: 'John Doe', email: 'john@company.com', role: 'borrower' },
    { username: 'user2', password: 'user123', name: 'Jane Smith', email: 'jane@company.com', role: 'borrower' }
  ];

  demoUsers.forEach((user, index) => {
    const hashedPassword = bcrypt.hashSync(user.password, saltRounds);
    db.run(`
      INSERT OR REPLACE INTO users (id, username, password, name, email, role, active) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [index + 1, user.username, hashedPassword, user.name, user.email, user.role, 1]);
  });
  });

  db.close();
  console.log('Database initialized at', dbPath);