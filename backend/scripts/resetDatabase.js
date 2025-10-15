const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Database file path
const dbPath = path.join(__dirname, '..', 'loaner_database.sqlite');

// Delete existing database if it exists
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('🗑️ Existing database deleted');
}

// Create new database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error creating database:', err.message);
    return;
  }
  console.log('✅ Connected to SQLite database');
});

console.log('🚀 Creating GSU Loaner Laptop Management Database...');
console.log(`📍 Database location: ${dbPath}`);

db.serialize(() => {
  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  // Create users table with GSU-specific fields
  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'staff', 'borrower')),
      panther_id TEXT UNIQUE,
      phone TEXT,
      user_type TEXT DEFAULT 'student' CHECK(user_type IN ('student', 'GSU Team', 'faculty', 'staff', 'admin')),
      created_by_staff INTEGER DEFAULT 0,
      requires_password_reset INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating users table:', err);
    else console.log('✅ Users table created with GSU fields');
  });

  // Create categories table
  db.run(`
    CREATE TABLE categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating categories table:', err);
    else console.log('✅ Categories table created');
  });

  // Create locations table
  db.run(`
    CREATE TABLE locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating locations table:', err);
    else console.log('✅ Locations table created');
  });

  // Create items table with enhanced GSU fields
  db.run(`
    CREATE TABLE items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id TEXT UNIQUE NOT NULL,
      rcb_sticker_number TEXT UNIQUE,
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
      specifications TEXT,
      parts_used TEXT,
      can_leave_building INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories (id),
      FOREIGN KEY (location_id) REFERENCES locations (id)
    )
  `, (err) => {
    if (err) console.error('Error creating items table:', err);
    else console.log('✅ Items table created with GSU fields');
  });

  // Create loans table with comprehensive GSU tracking
  db.run(`
    CREATE TABLE loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      borrower_id INTEGER NOT NULL,
      approved_by INTEGER,
      status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'active', 'returned', 'denied', 'overdue')) DEFAULT 'pending',
      request_date DATE NOT NULL,
      approved_date DATE,
      checkout_date DATE,
      expected_return DATE NOT NULL,
      actual_return DATE,
      reason TEXT NOT NULL,
      panther_id TEXT,
      phone TEXT,
      user_type TEXT,
      application_type TEXT DEFAULT 'user_created' CHECK(application_type IN ('user_created', 'staff_created')),
      created_by_staff INTEGER,
      returned_by INTEGER,
      return_condition TEXT CHECK(return_condition IN ('excellent', 'good', 'fair', 'poor', 'damaged')),
      return_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE,
      FOREIGN KEY (borrower_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (approved_by) REFERENCES users (id),
      FOREIGN KEY (created_by_staff) REFERENCES users (id),
      FOREIGN KEY (returned_by) REFERENCES users (id)
    )
  `, (err) => {
    if (err) console.error('Error creating loans table:', err);
    else console.log('✅ Loans table created with GSU tracking');
  });

  // Create maintenance_logs table
  db.run(`
    CREATE TABLE maintenance_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      performed_by INTEGER,
      maintenance_type TEXT NOT NULL,
      description TEXT NOT NULL,
      cost DECIMAL(10,2),
      maintenance_date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE,
      FOREIGN KEY (performed_by) REFERENCES users (id)
    )
  `, (err) => {
    if (err) console.error('Error creating maintenance_logs table:', err);
    else console.log('✅ Maintenance logs table created');
  });

  // Insert default categories
  const categories = [
    { name: 'Laptops', description: 'Portable computers for students and staff' },
    { name: 'Monitors', description: 'External displays and screens' },
    { name: 'Cables & Adapters', description: 'Connectivity accessories and chargers' },
    { name: 'Peripherals', description: 'Keyboards, mice, webcams, clickers' },
    { name: 'Mobile Devices', description: 'Tablets, phones, hotspots' },
    { name: 'Audio/Video', description: 'Headsets, speakers, cameras, microphones' }
  ];

  categories.forEach((cat, index) => {
    db.run(`INSERT INTO categories (id, name, description) VALUES (?, ?, ?)`,
      [index + 1, cat.name, cat.description], (err) => {
        if (err) console.error('Error inserting category:', err);
      });
  });

  // Insert GSU locations
  const locations = [
    { 
      name: 'Buckhead Center - Main Floor', 
      description: 'Primary GSU Buckhead campus location', 
      address: '35 Broad Street NW, Atlanta, GA 30303' 
    },
    { 
      name: 'Buckhead Center - IT Support Desk', 
      description: 'Tech support and equipment checkout area', 
      address: 'Buckhead Center - Room 101' 
    },
    { 
      name: 'IT Storage Room', 
      description: 'Central equipment storage and maintenance', 
      address: 'Buckhead Center - Storage Room B12' 
    },
    { 
      name: 'Faculty Offices', 
      description: 'Equipment assigned to faculty members', 
      address: 'Buckhead Center - Faculty Wing' 
    },
    { 
      name: 'Student Study Areas', 
      description: 'Equipment available in student spaces', 
      address: 'Buckhead Center - Study Rooms' 
    },
    { 
      name: 'External Repair', 
      description: 'Items sent to external repair services', 
      address: 'Off-site repair facility' 
    }
  ];

  locations.forEach((loc, index) => {
    db.run(`INSERT INTO locations (id, name, description, address) VALUES (?, ?, ?, ?)`,
      [index + 1, loc.name, loc.description, loc.address], (err) => {
        if (err) console.error('Error inserting location:', err);
      });
  });

  // Insert demo users with GSU-specific information
  const saltRounds = 10;
  const demoUsers = [
    { 
      username: 'admin', 
      password: 'admin123', 
      name: 'System Administrator', 
      email: 'admin@gsu.edu', 
      role: 'admin',
      panther_id: '900000001',
      phone: '(404) 555-0101',
      user_type: 'admin'
    },
    { 
      username: 'staff', 
      password: 'staff123', 
      name: 'IT Support Staff', 
      email: 'itsupport@gsu.edu', 
      role: 'staff',
      panther_id: '900000002',
      phone: '(404) 555-0102',
      user_type: 'GSU Team'
    },
    { 
      username: 'john.doe', 
      password: 'user123', 
      name: 'John Doe', 
      email: 'jdoe3@student.gsu.edu', 
      role: 'borrower',
      panther_id: '002123456',
      phone: '(678) 555-0201',
      user_type: 'student'
    },
    { 
      username: 'jane.smith', 
      password: 'user123', 
      name: 'Jane Smith', 
      email: 'jsmith42@student.gsu.edu', 
      role: 'borrower',
      panther_id: '002654321',
      phone: '(770) 555-0202',
      user_type: 'student'
    },
    { 
      username: 'mike.wilson', 
      password: 'user123', 
      name: 'Mike Wilson', 
      email: 'mwilson@gsu.edu', 
      role: 'borrower',
      panther_id: '900000003',
      phone: '(404) 555-0203',
      user_type: 'faculty'
    },
    {
      username: 'sarah.johnson',
      password: 'user123',
      name: 'Sarah Johnson',
      email: 'sjohnson89@student.gsu.edu',
      role: 'borrower',
      panther_id: '002789123',
      phone: '(678) 555-0204',
      user_type: 'student'
    }
  ];

  demoUsers.forEach((user, index) => {
    const hashedPassword = bcrypt.hashSync(user.password, saltRounds);
    db.run(`
      INSERT INTO users (id, username, password, name, email, role, panther_id, phone, user_type) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [index + 1, user.username, hashedPassword, user.name, user.email, user.role, user.panther_id, user.phone, user.user_type], (err) => {
      if (err) console.error('Error inserting user:', err);
    });
  });

  // Insert comprehensive demo items with GSU details
  const demoItems = [
    {
      id: 1, asset_id: 'GSU-LAP-001', rcb_sticker_number: 'RCB001', type: 'Laptop', category_id: 1, 
      brand: 'Dell', model: 'Latitude 7420', serial_number: 'DL7420GSU001', 
      purchase_date: '2024-01-15', purchase_price: 1299.99, warranty_expiry: '2027-01-15', 
      status: 'available', condition: 'excellent', location_id: 2, can_leave_building: 0,
      notes: 'High-performance laptop for student checkout',
      specifications: 'Intel i7, 16GB RAM, 512GB SSD, 14" FHD Display',
      parts_used: 'Laptop, Dell Charger, Laptop Bag'
    },
    {
      id: 2, asset_id: 'GSU-LAP-002', rcb_sticker_number: 'RCB002', type: 'Laptop', category_id: 1,
      brand: 'HP', model: 'EliteBook 840 G8', serial_number: 'HP840GSU002',
      purchase_date: '2024-02-10', purchase_price: 1199.99, warranty_expiry: '2027-02-10',
      status: 'loaned', condition: 'good', location_id: 4, can_leave_building: 0,
      notes: 'Currently on loan to student',
      specifications: 'Intel i5, 8GB RAM, 256GB SSD, 14" FHD Display',
      parts_used: 'Laptop, HP Charger'
    },
    {
      id: 3, asset_id: 'GSU-LAP-003', rcb_sticker_number: 'RCB003', type: 'Laptop', category_id: 1,
      brand: 'Apple', model: 'MacBook Air M2', serial_number: 'APLMBAGSU003',
      purchase_date: '2024-03-05', purchase_price: 1199.99, warranty_expiry: '2027-03-05',
      status: 'available', condition: 'excellent', location_id: 2, can_leave_building: 0,
      notes: 'MacBook for design and media students',
      specifications: 'Apple M2 Chip, 8GB RAM, 256GB SSD, 13" Retina Display',
      parts_used: 'MacBook Air, Apple MagSafe Charger, USB-C Adapter'
    },
    {
      id: 4, asset_id: 'GSU-MON-001', rcb_sticker_number: 'RCB004', type: 'Monitor', category_id: 2,
      brand: 'Samsung', model: '27" 4K U28E590D', serial_number: 'SAM27GSU001',
      purchase_date: '2024-01-20', purchase_price: 299.99, warranty_expiry: '2027-01-20',
      status: 'available', condition: 'excellent', location_id: 5, can_leave_building: 0,
      notes: 'Available in study rooms',
      specifications: '27" 4K UHD, USB-C, HDMI, DisplayPort',
      parts_used: 'Monitor, Power Cable, HDMI Cable, USB-C Cable'
    },
    {
      id: 5, asset_id: 'GSU-MON-002', rcb_sticker_number: 'RCB005', type: 'Monitor', category_id: 2,
      brand: 'LG', model: '24" UltraFine 4K', serial_number: 'LG24GSU002',
      purchase_date: '2024-02-15', purchase_price: 399.99, warranty_expiry: '2027-02-15',
      status: 'loaned', condition: 'good', location_id: 4, can_leave_building: 0,
      notes: 'On loan with MacBook setup',
      specifications: '24" 4K UHD, Thunderbolt 3, USB-C Hub',
      parts_used: 'Monitor, Thunderbolt Cable, Power Adapter'
    },
    {
      id: 6, asset_id: 'GSU-CHG-001', rcb_sticker_number: 'RCB006', type: 'Charger', category_id: 3,
      brand: 'Dell', model: '65W USB-C Charger', serial_number: 'DLCHGGSU001',
      purchase_date: '2024-01-10', purchase_price: 49.99, warranty_expiry: '2026-01-10',
      status: 'available', condition: 'good', location_id: 3, can_leave_building: 1,
      notes: 'Universal USB-C charger for Dell laptops',
      specifications: '65W USB-C PD, Compatible with Dell Latitude series',
      parts_used: 'Charger, USB-C Cable'
    },
    {
      id: 7, asset_id: 'GSU-TAB-001', rcb_sticker_number: 'RCB007', type: 'Tablet', category_id: 5,
      brand: 'Apple', model: 'iPad Air 5th Gen', serial_number: 'IPAIRGSU001',
      purchase_date: '2024-03-01', purchase_price: 599.99, warranty_expiry: '2027-03-01',
      status: 'maintenance', condition: 'fair', location_id: 3, can_leave_building: 0,
      notes: 'In maintenance - screen replacement needed',
      specifications: 'Apple M1 Chip, 64GB Storage, 10.9" Liquid Retina Display',
      parts_used: 'iPad Air, Apple Pencil, Smart Folio Case, USB-C Charger'
    },
    {
      id: 8, asset_id: 'GSU-CAM-001', rcb_sticker_number: 'RCB008', type: 'Webcam', category_id: 6,
      brand: 'Logitech', model: 'C920 HD Pro', serial_number: 'LOGC920GSU001',
      purchase_date: '2024-01-25', purchase_price: 79.99, warranty_expiry: '2026-01-25',
      status: 'available', condition: 'excellent', location_id: 2, can_leave_building: 1,
      notes: 'High-quality webcam for presentations',
      specifications: '1080p HD, Stereo Audio, USB-A Connection',
      parts_used: 'Webcam, USB Extension Cable, Mounting Clip'
    },
    {
      id: 9, asset_id: 'GSU-CLK-001', rcb_sticker_number: 'RCB009', type: 'Clickers', category_id: 4,
      brand: 'Turning Technologies', model: 'ResponseCard RF', serial_number: 'TTRCGSU001',
      purchase_date: '2024-02-01', purchase_price: 25.99, warranty_expiry: '2026-02-01',
      status: 'available', condition: 'good', location_id: 2, can_leave_building: 0,
      notes: 'Student response system for classroom interaction',
      specifications: 'RF Technology, LCD Display, Battery Powered',
      parts_used: 'Clicker, Batteries, Quick Start Guide'
    },
    {
      id: 10, asset_id: 'GSU-ADP-001', rcb_sticker_number: 'RCB010', type: 'Adapter', category_id: 3,
      brand: 'Apple', model: 'USB-C to USB Adapter', serial_number: 'APLADPGSU001',
      purchase_date: '2024-01-05', purchase_price: 19.99, warranty_expiry: '2026-01-05',
      status: 'available', condition: 'excellent', location_id: 3, can_leave_building: 1,
      notes: 'Essential adapter for USB-A device compatibility',
      specifications: 'USB-C to USB-A, USB 3.0 Compatible',
      parts_used: 'Adapter Only'
    }
  ];

  demoItems.forEach(item => {
    db.run(`
      INSERT INTO items (
        id, asset_id, rcb_sticker_number, type, category_id, brand, model, serial_number, 
        purchase_date, purchase_price, warranty_expiry, status, condition, location_id, 
        notes, specifications, parts_used, can_leave_building
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      item.id, item.asset_id, item.rcb_sticker_number, item.type, item.category_id, 
      item.brand, item.model, item.serial_number, item.purchase_date, item.purchase_price, 
      item.warranty_expiry, item.status, item.condition, item.location_id, 
      item.notes, item.specifications, item.parts_used, item.can_leave_building
    ], (err) => {
      if (err) console.error('Error inserting item:', err);
    });
  });

  // Insert comprehensive demo loans with GSU tracking
  const demoLoans = [
    { 
      id: 1, 
      item_id: 2, 
      borrower_id: 3, 
      approved_by: 1,
      status: 'active', 
      request_date: '2025-06-15', 
      approved_date: '2025-06-15',
      checkout_date: '2025-06-16', 
      expected_return: '2025-06-30', 
      reason: 'Remote coursework and online exam preparation',
      panther_id: '002123456',
      phone: '(678) 555-0201',
      user_type: 'student',
      application_type: 'user_created'
    },
    { 
      id: 2, 
      item_id: 5, 
      borrower_id: 4, 
      approved_by: 2,
      status: 'active', 
      request_date: '2025-06-18', 
      approved_date: '2025-06-18',
      checkout_date: '2025-06-19', 
      expected_return: '2025-07-03', 
      reason: 'Dual monitor setup for capstone project development',
      panther_id: '002654321',
      phone: '(770) 555-0202',
      user_type: 'student',
      application_type: 'user_created'
    },
    { 
      id: 3, 
      item_id: 1, 
      borrower_id: 6, 
      status: 'pending', 
      request_date: '2025-06-20', 
      expected_return: '2025-07-05', 
      reason: 'Summer course requirements and research project',
      panther_id: '002789123',
      phone: '(678) 555-0204',
      user_type: 'student',
      application_type: 'staff_created',
      created_by_staff: 2
    },
    {
      id: 4,
      item_id: 3,
      borrower_id: 5,
      approved_by: 1,
      status: 'returned',
      request_date: '2025-06-01',
      approved_date: '2025-06-01',
      checkout_date: '2025-06-02',
      expected_return: '2025-06-15',
      actual_return: '2025-06-14',
      reason: 'Faculty presentation preparation and grading',
      panther_id: '900000003',
      phone: '(404) 555-0203',
      user_type: 'faculty',
      application_type: 'user_created',
      return_condition: 'excellent',
      return_notes: 'Returned in perfect condition, no issues',
      returned_by: 2
    }
  ];

  demoLoans.forEach(loan => {
    const fields = Object.keys(loan).join(', ');
    const placeholders = Object.keys(loan).map(() => '?').join(', ');
    const values = Object.values(loan);
    
    db.run(`INSERT INTO loans (${fields}) VALUES (${placeholders})`, values, (err) => {
      if (err) console.error('Error inserting loan:', err);
    });
  });

  // Insert sample maintenance logs
  const maintenanceLogs = [
    {
      item_id: 7,
      performed_by: 2,
      maintenance_type: 'Screen Repair',
      description: 'iPad screen cracked during student use, replacement screen ordered and installed',
      cost: 149.99,
      maintenance_date: '2025-06-18'
    },
    {
      item_id: 2,
      performed_by: 2,
      maintenance_type: 'Software Update',
      description: 'Updated to latest Windows 11 version, installed Office 365, security patches applied',
      cost: 0.00,
      maintenance_date: '2025-06-10'
    }
  ];

  maintenanceLogs.forEach(log => {
    db.run(`
      INSERT INTO maintenance_logs (item_id, performed_by, maintenance_type, description, cost, maintenance_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [log.item_id, log.performed_by, log.maintenance_type, log.description, log.cost, log.maintenance_date], (err) => {
      if (err) console.error('Error inserting maintenance log:', err);
    });
  });

  console.log('\n🎯 GSU Loaner Database initialization complete!');
  console.log('\n👥 Demo users created:');
  console.log('   🔑 admin / admin123 (System Administrator)');
  console.log('   🔑 staff / staff123 (IT Support Staff)');
  console.log('   🔑 john.doe / user123 (Student - John Doe)');
  console.log('   🔑 jane.smith / user123 (Student - Jane Smith)');
  console.log('   🔑 mike.wilson / user123 (Faculty - Mike Wilson)');
  console.log('   🔑 sarah.johnson / user123 (Student - Sarah Johnson)');
  console.log('\n📦 Enhanced inventory with GSU-specific tracking:');
  console.log('   • RCB sticker numbers for all equipment');
  console.log('   • Building exit restrictions implemented');
  console.log('   • Comprehensive specifications and parts tracking');
  console.log('   • GSU Buckhead Center location mapping');
  console.log('\n🏢 GSU-specific features enabled:');
  console.log('   • Panther ID tracking for all users');
  console.log('   • Student vs GSU Team vs Faculty user types');
  console.log('   • Staff-created loan applications');
  console.log('   • Equipment building exit controls');
  console.log('   • Comprehensive audit trail');
  console.log('\n📋 Sample data includes:');
  console.log('   • 2 Active loan transactions');
  console.log('   • 1 Pending loan request (staff-created)');
  console.log('   • 1 Completed loan with return details');
  console.log('   • Equipment maintenance logs');
  console.log(`\n💾 Database saved to: ${dbPath}`);
  console.log('\nNext steps:');
  console.log('1. Run: npm run dev (to start the API server)');
  console.log('2. Test API at: http://localhost:5000/api/health');
  console.log('3. Access application at: http://localhost:3000');
});

// Close database after all operations
db.close((err) => {
  if (err) {
    console.error('❌ Error closing database:', err.message);
  } else {
    console.log('✅ Database connection closed');
  }
});