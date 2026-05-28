'use strict';
const pool = require('../db/pool');

function fmt(r) {
  if (!r) return null;
  return {
    customer_id:      r.id,
    profile_id:       r.profile_id,
    customer_code:    r.code,
    address_id:       r.address_id,
    membership_level: r.membership_level,
    total_spent:      r.total_spent,
    created_at:       r.created_at,
  };
}

exports.findAll = async (f) => {
  let q = 'SELECT * FROM customer WHERE 1=1';
  const p = [];
  if (f.customer_code)    { p.push(f.customer_code);    q += ` AND code = $${p.length}`; }
  if (f.membership_level) { p.push(f.membership_level); q += ` AND membership_level = $${p.length}`; }
  if (f.profile_id)       { p.push(f.profile_id);       q += ` AND profile_id = $${p.length}`; }
  q += ' ORDER BY id';
  const { rows } = await pool.query(q, p);
  return rows.map(fmt);
};

exports.create = async (data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [ins] } = await client.query(
      'INSERT INTO customer (profile_id,address_id,membership_level,total_spent,code) VALUES ($1,$2,$3,0,$4) RETURNING id',
      [data.profile_id, data.address_id, data.membership_level, 'CUST-TMP-' + Date.now()]
    );
    const code = 'CUST-' + String(ins.id).padStart(4, '0');
    const { rows: [r] } = await client.query(
      'UPDATE customer SET code=$1 WHERE id=$2 RETURNING *', [code, ins.id]);
    await client.query('COMMIT');
    return fmt(r);
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
};

exports.findByCode = async (code) => {
  const { rows: [r] } = await pool.query('SELECT * FROM customer WHERE code = $1', [code]);
  return fmt(r);
};

exports.update = async (id, data) => {
  const allowed = ['address_id','membership_level'];
  const sets = []; const p = [];
  allowed.forEach(k => { if (data[k] !== undefined) { p.push(data[k]); sets.push(`${k} = $${p.length}`); }});
  if (!sets.length) { const { rows:[r] } = await pool.query('SELECT * FROM customer WHERE id=$1',[id]); return fmt(r); }
  p.push(id);
  const { rows: [r] } = await pool.query(`UPDATE customer SET ${sets.join(',')} WHERE id=$${p.length} RETURNING *`, p);
  return fmt(r);
};

exports.deleteById = (id) => pool.query('DELETE FROM customer WHERE id = $1', [id]);

exports.isProfileUsed = async (profileId) => {
  const { rows: [c] } = await pool.query('SELECT COUNT(*) AS cnt FROM customer WHERE profile_id=$1', [profileId]);
  return parseInt(c.cnt, 10) > 0;
};

exports.hasRelatedData = async (id) => {
  const { rows: [c] } = await pool.query(
    'SELECT (SELECT COUNT(*) FROM "order" WHERE customer_id=$1)+(SELECT COUNT(*) FROM review WHERE customer_id=$1)+(SELECT COUNT(*) FROM favorite_store WHERE customer_id=$1) AS cnt', [id]);
  return parseInt(c.cnt, 10) > 0;
};
