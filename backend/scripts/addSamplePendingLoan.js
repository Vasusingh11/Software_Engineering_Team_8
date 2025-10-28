const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'loaner_database.sqlite');
const db = new sqlite3.Database(dbPath);

(async () => {
  try {
    console.log('Opening DB:', dbPath);

    // Find an available item
    const getAvailableItem = () => new Promise((resolve, reject) => {
      db.get("SELECT id, asset_id FROM items WHERE status = 'available' LIMIT 1", (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    // Find a borrower user
    const getBorrower = () => new Promise((resolve, reject) => {
      db.get("SELECT id, username FROM users WHERE role = 'borrower' AND active = 1 LIMIT 1", (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    const availableItem = await getAvailableItem();
    const borrower = await getBorrower();

    if (!availableItem) {
      console.error('No available item found. Insert an item first.');
      process.exit(1);
    }
    if (!borrower) {
      console.error('No borrower user found. Insert a borrower user first.');
      process.exit(1);
    }

    const insertLoan = () => new Promise((resolve, reject) => {
      const now = new Date().toISOString().split('T')[0];
      // expected return 14 days from now
      const expected = new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0];
      const reason = 'Sample pending loan (test)';
      db.run(`INSERT INTO loans (item_id, borrower_id, status, request_date, expected_return, reason) VALUES (?, ?, 'pending', ?, ?, ?)`,
        [availableItem.id, borrower.id, now, expected, reason], function(err) {
          if (err) return reject(err);
          resolve(this.lastID);
        });
    });

    const loanId = await insertLoan();
    console.log(`Inserted sample pending loan id=${loanId} for item ${availableItem.asset_id} and borrower ${borrower.username}`);
    db.close();
  } catch (err) {
    console.error('Error inserting sample loan:', err);
    db.close();
    process.exit(1);
  }
})();
