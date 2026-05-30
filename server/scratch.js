const pool = require('./src/db/pool');
pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'expense_voucher_items'").then(res => { console.log(res.rows); pool.end(); });
