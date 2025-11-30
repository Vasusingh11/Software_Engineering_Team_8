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

  // Items table
  db.run(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      category_id INTEGER,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      serial_number TEXT UNIQUE NOT NULL,
      purchase_date DATE,
      purchase_price DECIMAL(10,2),
      warranty_expiry DATE,
      status TEXT NOT NULL CHECK(status IN ('available', 'loaned', 'maintenance', 'faulty', 'retired')) DEFAULT 'available',
      condition TEXT NOT NULL CHECK(condition IN ('excellent', 'good', 'fair', 'poor')) DEFAULT 'good',
      location_id INTEGER,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Categories table
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Locations table
  db.run(`
    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Loans table
  db.run(`
    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      borrower_id INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'active', 'returned', 'denied')) DEFAULT 'pending',
      request_date DATE NOT NULL,
      checkout_date DATE,
      expected_return DATE NOT NULL,
      actual_return DATE,
      reason TEXT NOT NULL,
      approved_by INTEGER,
      approved_date DATE,
      return_condition TEXT,
      return_notes TEXT,
      returned_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (item_id) REFERENCES items (id),
      FOREIGN KEY (borrower_id) REFERENCES users (id),
      FOREIGN KEY (approved_by) REFERENCES users (id),
      FOREIGN KEY (returned_by) REFERENCES users (id)
    )
  `);

  // Insert demo users
  const saltRounds = 10;
  const demoUsers = [
    { username: 'admin', password: 'admin123', name: 'System Administrator', email: 'admin@company.com', role: 'admin' },
    { username: 'staff', password: 'staff123', name: 'IT Staff', email: 'staff@company.com', role: 'staff' },
    { username: 'john.doe', password: 'user123', name: 'John Doe', email: 'john@company.com', role: 'borrower' },
    { username: 'jane.smith', password: 'user123', name: 'Jane Smith', email: 'jane@company.com', role: 'borrower' }
  ];

  demoUsers.forEach((user, index) => {
    const hashedPassword = bcrypt.hashSync(user.password, saltRounds);
    db.run(`
      INSERT OR REPLACE INTO users (id, username, password, name, email, role, active) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [index + 1, user.username, hashedPassword, user.name, user.email, user.role, 1]);
  });

  // Insert demo categories
  const demoCategories = [
    { id: 1, name: 'Laptops', description: 'Portable computers for loaning' },
    { id: 2, name: 'Monitors', description: 'External displays' },
    { id: 3, name: 'Accessories', description: 'Cables, adapters, and other accessories' },
    { id: 4, name: 'Tablets', description: 'Tablet devices' }
  ];

  demoCategories.forEach(category => {
    db.run(`
      INSERT OR REPLACE INTO categories (id, name, description) 
      VALUES (?, ?, ?)
    `, [category.id, category.name, category.description]);
  });

  // Insert demo locations
  const demoLocations = [
    { id: 1, name: 'Main Office', description: 'Primary office location' },
    { id: 2, name: 'Branch Office', description: 'Secondary office location' },
    { id: 3, name: 'Storage', description: 'Equipment storage area' },
    { id: 4, name: 'IT Department', description: 'IT department office' }
  ];

  demoLocations.forEach(location => {
    db.run(`
      INSERT OR REPLACE INTO locations (id, name, description) 
      VALUES (?, ?, ?)
    `, [location.id, location.name, location.description]);
  });

  // Insert demo items
  const demoItems = [
    { id: 1, asset_id: 'LAP001', type: 'Laptop', category_id: 1, brand: 'Dell', model: 'Latitude 7420', serial_number: 'DL12345', status: 'available', condition: 'excellent', location_id: 1, purchase_date: '2023-01-15', purchase_price: 1200.00 },
    { id: 2, asset_id: 'LAP002', type: 'Laptop', category_id: 1, brand: 'HP', model: 'EliteBook 840', serial_number: 'HP67890', status: 'loaned', condition: 'good', location_id: 2, purchase_date: '2023-02-20', purchase_price: 1100.00 },
    { id: 3, asset_id: 'MON001', type: 'Monitor', category_id: 2, brand: 'Samsung', model: '27" 4K', serial_number: 'SM11111', status: 'available', condition: 'excellent', location_id: 1, purchase_date: '2023-03-10', purchase_price: 400.00 },
    { id: 4, asset_id: 'CAB001', type: 'Cable', category_id: 3, brand: 'Generic', model: 'USB-C Charger', serial_number: 'GEN001', status: 'available', condition: 'good', location_id: 3, purchase_date: '2023-04-05', purchase_price: 50.00 },
    { id: 5, asset_id: 'LAP003', type: 'Laptop', category_id: 1, brand: 'Apple', model: 'MacBook Pro 14"', serial_number: 'AP99999', status: 'maintenance', condition: 'fair', location_id: 4, purchase_date: '2022-12-01', purchase_price: 2000.00 }
  ];

  demoItems.forEach(item => {
    db.run(`
      INSERT OR REPLACE INTO items (id, asset_id, type, category_id, brand, model, serial_number, status, condition, location_id, purchase_date, purchase_price) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [item.id, item.asset_id, item.type, item.category_id, item.brand, item.model, item.serial_number, item.status, item.condition, item.location_id, item.purchase_date, item.purchase_price]);
  });

  // Insert demo loans
  const demoLoans = [
    { id: 1, item_id: 2, borrower_id: 3, status: 'active', request_date: '2025-06-15', checkout_date: '2025-06-15', expected_return: '2025-06-29', reason: 'Remote work setup', approved_by: 1, approved_date: '2025-06-15' },
    { id: 2, item_id: 1, borrower_id: 4, status: 'pending', request_date: '2025-06-20', expected_return: '2025-07-04', reason: 'Project work' }
  ];

  demoLoans.forEach(loan => {
    db.run(`
      INSERT OR REPLACE INTO loans (id, item_id, borrower_id, status, request_date, checkout_date, expected_return, reason, approved_by, approved_date) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [loan.id, loan.item_id, loan.borrower_id, loan.status, loan.request_date, loan.checkout_date, loan.expected_return, loan.reason, loan.approved_by, loan.approved_date]);
  });

  console.log('Database initialized successfully!');
  console.log('Demo users created:');
  console.log('- admin / admin123 (Administrator)');
  console.log('- staff / staff123 (Staff)');
  console.log('- john.doe / user123 (Borrower)');
  console.log('- jane.smith / user123 (Borrower)');
});

db.close();
