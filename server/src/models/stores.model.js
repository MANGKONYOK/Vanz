'use strict';
const pool = require('../db/pool');

function fmt(r) {
  if (!r) return null;
  return {
    store_id:   r.id,
    name:       r.name,
    address_id: r.address_id,
    store_code: r.code,
    category:   r.category,
    rating:     r.rating,
    status:     r.status,
    updated_at: r.updated_at,
  };
}

exports.findAll = async (f) => {
  let q = 'SELECT * FROM store WHERE 1=1';
  const p = [];
  if (f.store_code) { p.push(f.store_code);        q += ` AND code = $${p.length}`; }
  if (f.category)   { p.push(`%${f.category}%`);   q += ` AND category ILIKE $${p.length}`; }
  if (f.status)     { p.push(f.status);             q += ` AND status = $${p.length}`; }
  q += ' ORDER BY id';
  const { rows } = await pool.query(q, p);
  return rows.map(fmt);
};

exports.create = async (data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [ins] } = await client.query(
      'INSERT INTO store (name,address_id,category,status) VALUES ($1,$2,$3,$4) RETURNING id',
      [data.name, data.address_id, data.category, data.status || 'ACTIVE']
    );
    const code = 'STR-' + String(ins.id).padStart(4, '0');
    const { rows: [r] } = await client.query('UPDATE store SET code=$1 WHERE id=$2 RETURNING *', [code, ins.id]);
    await client.query('COMMIT');
    return fmt(r);
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
};

exports.findByCode = async (code) => {
  const { rows: [r] } = await pool.query('SELECT * FROM store WHERE code = $1', [code]);
  return fmt(r);
};

exports.update = async (id, data) => {
  const allowed = ['name','address_id','category','status','rating'];
  const sets = []; const p = [];
  allowed.forEach(k => { if (data[k] !== undefined) { p.push(data[k]); sets.push(`${k} = $${p.length}`); }});
  if (!sets.length) { const { rows:[r] } = await pool.query('SELECT * FROM store WHERE id=$1',[id]); return fmt(r); }
  p.push(id);
  const { rows: [r] } = await pool.query(`UPDATE store SET ${sets.join(',')},updated_at=NOW() WHERE id=$${p.length} RETURNING *`, p);
  return fmt(r);
};

exports.deleteById = (id) => pool.query('DELETE FROM store WHERE id = $1', [id]);

exports.hasRelatedData = async (id) => {
  const { rows: [c] } = await pool.query(
    `SELECT (SELECT COUNT(*) FROM store_products WHERE store_id=$1)
          +(SELECT COUNT(*) FROM promotion WHERE store_id=$1)
          +(SELECT COUNT(*) FROM favorite_store WHERE store_id=$1)
          +(SELECT COUNT(*) FROM "order" WHERE store_id=$1) AS cnt`,
    [id]);
  return parseInt(c.cnt, 10) > 0;
};
