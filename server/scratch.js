const pool = require('./src/db/pool');
pool.query("SELECT DISTINCT membership_level FROM customer").then(res => { console.log(res.rows); pool.end(); });
