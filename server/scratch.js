const pool = require('./src/db/pool');
pool.query("SELECT * FROM \"order\" WHERE code = 'ORD-000013'").then(res => { console.log(res.rows[0]); return pool.query("SELECT * FROM order_items WHERE order_id = $1", [res.rows[0].id]); }).then(res => { console.log(res.rows); pool.end(); });
