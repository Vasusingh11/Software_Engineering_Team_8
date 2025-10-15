const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'loaner_database.sqlite');
const backupDir = path.join(__dirname, '..', 'backups');

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.message);
    process.exit(1);
  }
});

// Helper function for queries
const allQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const getQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Backup database
async function backupDatabase() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `loaner_backup_${timestamp}.sqlite`);
    
    // Copy database file
    fs.copyFileSync(dbPath, backupPath);
    
    console.log(`✅ Database backed up to: ${backupPath}`);
    
    // Also create a human-readable export
    await exportToCSV(timestamp);
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
  }
}

// Export data to CSV files
async function exportToCSV(timestamp) {
  try {
    const csvDir = path.join(backupDir, `csv_export_${timestamp}`);
    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true });
    }

    // Export users (without passwords)
    const users = await allQuery(`
      SELECT id, username, name, email, role, active, created_at 
      FROM users ORDER BY id
    `);
    writeCSV(path.join(csvDir, 'users.csv'), users);

    // Export items with category and location names
    const items = await allQuery(`
      SELECT i.*, c.name as category_name, l.name as location_name
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN locations l ON i.location_id = l.id
      ORDER BY i.asset_id
    `);
    writeCSV(path.join(csvDir, 'items.csv'), items);

    // Export loans with borrower and item details
    const loans = await allQuery(`
      SELECT l.*, i.asset_id, i.type, i.brand, i.model, 
             u.name as borrower_name, u.email as borrower_email,
             a.name as approved_by_name
      FROM loans l
      JOIN items i ON l.item_id = i.id
      JOIN users u ON l.borrower_id = u.id
      LEFT JOIN users a ON l.approved_by = a.id
      ORDER BY l.created_at DESC
    `);
    writeCSV(path.join(csvDir, 'loans.csv'), loans);

    // Export categories and locations
    const categories = await allQuery('SELECT * FROM categories ORDER BY name');
    writeCSV(path.join(csvDir, 'categories.csv'), categories);

    const locations = await allQuery('SELECT * FROM locations ORDER BY name');
    writeCSV(path.join(csvDir, 'locations.csv'), locations);

    console.log(`✅ CSV exports created in: ${csvDir}`);

  } catch (error) {
    console.error('❌ CSV export failed:', error.message);
  }
}

// Write data to CSV file
function writeCSV(filePath, data) {
  if (data.length === 0) {
    fs.writeFileSync(filePath, 'No data available\n');
    return;
  }

  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(value => 
      value === null ? '' : `"${String(value).replace(/"/g, '""')}"`
    ).join(',')
  );
  
  const csv = [headers, ...rows].join('\n');
  fs.writeFileSync(filePath, csv);
}

// Database statistics
async function showStatistics() {
  try {
    console.log('\n📊 DATABASE STATISTICS');
    console.log('=====================');

    const totalUsers = await getQuery('SELECT COUNT(*) as count FROM users WHERE active = 1');
    const totalItems = await getQuery('SELECT COUNT(*) as count FROM items');
    const availableItems = await getQuery('SELECT COUNT(*) as count FROM items WHERE status = "available"');
    const loanedItems = await getQuery('SELECT COUNT(*) as count FROM items WHERE status = "loaned"');
    const maintenanceItems = await getQuery('SELECT COUNT(*) as count FROM items WHERE status = "maintenance"');
    
    const totalLoans = await getQuery('SELECT COUNT(*) as count FROM loans');
    const activeLoans = await getQuery('SELECT COUNT(*) as count FROM loans WHERE status = "active"');
    const pendingLoans = await getQuery('SELECT COUNT(*) as count FROM loans WHERE status = "pending"');
    const overdueLoans = await getQuery(`
      SELECT COUNT(*) as count FROM loans 
      WHERE status = "active" AND expected_return < DATE("now")
    `);

    console.log(`👥 Active Users: ${totalUsers.count}`);
    console.log(`📦 Total Items: ${totalItems.count}`);
    console.log(`  ✅ Available: ${availableItems.count}`);
    console.log(`  📤 On Loan: ${loanedItems.count}`);
    console.log(`  🔧 Maintenance: ${maintenanceItems.count}`);
    console.log(`📋 Total Loans: ${totalLoans.count}`);
    console.log(`  🟢 Active: ${activeLoans.count}`);
    console.log(`  🟡 Pending: ${pendingLoans.count}`);
    console.log(`  🔴 Overdue: ${overdueLoans.count}`);

    // Item breakdown by category
    const itemsByCategory = await allQuery(`
      SELECT c.name as category, COUNT(i.id) as count
      FROM categories c
      LEFT JOIN items i ON c.id = i.category_id
      GROUP BY c.id, c.name
      ORDER BY count DESC
    `);

    console.log('\n📊 Items by Category:');
    itemsByCategory.forEach(cat => {
      console.log(`  ${cat.category}: ${cat.count}`);
    });

    // Recent activity
    const recentLoans = await allQuery(`
      SELECT l.status, COUNT(*) as count
      FROM loans l
      WHERE l.created_at >= DATE('now', '-30 days')
      GROUP BY l.status
      ORDER BY count DESC
    `);

    console.log('\n📅 Loan Activity (Last 30 days):');
    recentLoans.forEach(loan => {
      console.log(`  ${loan.status}: ${loan.count}`);
    });

  } catch (error) {
    console.error('❌ Error generating statistics:', error.message);
  }
}

// Database integrity check
async function checkIntegrity() {
  try {
    console.log('\n🔍 INTEGRITY CHECK');
    console.log('=================');

    // Check for orphaned loans (items or users that don't exist)
    const orphanedLoans = await allQuery(`
      SELECT l.id, l.item_id, l.borrower_id
      FROM loans l
      LEFT JOIN items i ON l.item_id = i.id
      LEFT JOIN users u ON l.borrower_id = u.id
      WHERE i.id IS NULL OR u.id IS NULL
    `);

    if (orphanedLoans.length > 0) {
      console.log(`⚠️ Found ${orphanedLoans.length} orphaned loans:`);
      orphanedLoans.forEach(loan => {
        console.log(`  Loan ID: ${loan.id}, Item ID: ${loan.item_id}, Borrower ID: ${loan.borrower_id}`);
      });
    } else {
      console.log('✅ No orphaned loans found');
    }

    // Check for items with inconsistent loan status
    const inconsistentItems = await allQuery(`
      SELECT i.id, i.asset_id, i.status, COUNT(l.id) as active_loans
      FROM items i
      LEFT JOIN loans l ON i.id = l.item_id AND l.status = 'active'
      GROUP BY i.id
      HAVING (i.status = 'loaned' AND active_loans = 0) OR 
             (i.status = 'available' AND active_loans > 0)
    `);

    if (inconsistentItems.length > 0) {
      console.log(`⚠️ Found ${inconsistentItems.length} items with inconsistent status:`);
      inconsistentItems.forEach(item => {
        console.log(`  ${item.asset_id}: Status=${item.status}, Active Loans=${item.active_loans}`);
      });
    } else {
      console.log('✅ All item statuses are consistent with loan records');
    }

    // Check for duplicate asset IDs or serial numbers
    const duplicateAssets = await allQuery(`
      SELECT asset_id, COUNT(*) as count
      FROM items
      GROUP BY asset_id
      HAVING count > 1
    `);

    if (duplicateAssets.length > 0) {
      console.log(`⚠️ Found duplicate asset IDs:`);
      duplicateAssets.forEach(dup => {
        console.log(`  ${dup.asset_id}: ${dup.count} items`);
      });
    } else {
      console.log('✅ No duplicate asset IDs found');
    }

  } catch (error) {
    console.error('❌ Integrity check failed:', error.message);
  }
}

// Clean up old backups (keep last 10)
async function cleanupBackups() {
  try {
    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('loaner_backup_') && file.endsWith('.sqlite'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        stat: fs.statSync(path.join(backupDir, file))
      }))
      .sort((a, b) => b.stat.mtime - a.stat.mtime);

    if (files.length > 10) {
      const filesToDelete = files.slice(10);
      console.log(`🧹 Cleaning up ${filesToDelete.length} old backup files...`);
      
      filesToDelete.forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`  Deleted: ${file.name}`);
      });
    } else {
      console.log('✅ No old backups to clean up');
    }

  } catch (error) {
    console.error('❌ Backup cleanup failed:', error.message);
  }
}

// Main menu
async function mainMenu() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('\n🛠️  LOANER DATABASE MAINTENANCE');
    console.log('==============================');
    console.log('Available commands:');
    console.log('  backup    - Create database backup');
    console.log('  stats     - Show database statistics');
    console.log('  check     - Run integrity checks');
    console.log('  cleanup   - Clean up old backups');
    console.log('  export    - Export data to CSV');
    console.log('  all       - Run all maintenance tasks');
    console.log('\nUsage: node scripts/maintenance.js <command>');
    return;
  }

  const command = args[0].toLowerCase();

  switch (command) {
    case 'backup':
      await backupDatabase();
      break;
    case 'stats':
      await showStatistics();
      break;
    case 'check':
      await checkIntegrity();
      break;
    case 'cleanup':
      await cleanupBackups();
      break;
    case 'export':
      await exportToCSV(new Date().toISOString().replace(/[:.]/g, '-'));
      break;
    case 'all':
      console.log('🚀 Running full maintenance suite...\n');
      await showStatistics();
      await checkIntegrity();
      await backupDatabase();
      await cleanupBackups();
      console.log('\n✅ Maintenance complete!');
      break;
    default:
      console.log('❌ Unknown command:', command);
      console.log('Available commands: backup, stats, check, cleanup, export, all');
  }
}

// Run the maintenance script
mainMenu().finally(() => {
  db.close((err) => {
    if (err) {
      console.error('❌ Error closing database:', err.message);
    }
    process.exit(0);
  });
});