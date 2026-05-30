'use strict';
const pool = require('../db/pool');

function fmt(r) {
  if (!r) return null;
  return {
    assignment_id:  r.id,
    order_id:       r.order_id,
    deliverer_id:   r.deliverer_id,
    order_code:     r.order_code,
    deliverer_code: r.deliverer_code,
    status:         r.status,
    assigned_at:    r.assigned_at,
    response_at:    r.responded_at,
  };
}

exports.findAll = async (f) => {
  let q = `SELECT da.*, o.code AS order_code, dlv.code AS deliverer_code
           FROM dispatch_assignment da
           JOIN "order" o ON da.order_id=o.id
           JOIN deliverer dlv ON da.deliverer_id=dlv.id
           WHERE 1=1`;
  const p = [];
  if (f.assignment_id)  { p.push(f.assignment_id);  q += ` AND da.id = $${p.length}`; }
  if (f.order_code)     { p.push(f.order_code);     q += ` AND o.code = $${p.length}`; }
  if (f.deliverer_code) { p.push(f.deliverer_code); q += ` AND dlv.code = $${p.length}`; }
  if (f.status)         { p.push(f.status);         q += ` AND da.status = $${p.length}`; }
  q += ' ORDER BY da.id';
  const { rows } = await pool.query(q, p);
  return rows.map(fmt);
};

exports.create = async (data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [o] } = await client.query('SELECT id FROM "order" WHERE code=$1 FOR UPDATE', [data.order_code]);
    if (!o) throw Object.assign(new Error(`Order ${data.order_code} not found`), { name: 'NotFoundError' });
    const { rows: [dlv] } = await client.query('SELECT id FROM deliverer WHERE code=$1', [data.deliverer_code]);
    if (!dlv) throw Object.assign(new Error(`Deliverer ${data.deliverer_code} not found`), { name: 'NotFoundError' });
    
    const { rows: [r] } = await client.query(
      'INSERT INTO dispatch_assignment (order_id,deliverer_id,status) VALUES ($1,$2,$3) RETURNING id,order_id,deliverer_id,status,assigned_at,responded_at',
      [o.id, dlv.id, 'PENDING']
    );
    
    // Update order status to DISPATCHED so it leaves the prepared queue
    await client.query('UPDATE "order" SET status = $1 WHERE id = $2', ['DISPATCHED', o.id]);
    
    await client.query('COMMIT');
    return fmt({ ...r, order_code: data.order_code, deliverer_code: data.deliverer_code });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

exports.findById = async (id) => {
  const { rows: [r] } = await pool.query(
    `SELECT da.*, o.code AS order_code, dlv.code AS deliverer_code
     FROM dispatch_assignment da
     JOIN "order" o ON da.order_id=o.id
     JOIN deliverer dlv ON da.deliverer_id=dlv.id
     WHERE da.id=$1`, [id]);
  return fmt(r);
};

exports.update = async (id, data) => {
  const sets = []; const p = [];
  if (data.status      !== undefined) { p.push(data.status);      sets.push(`status = $${p.length}`); }
  if (data.response_at !== undefined) { p.push(data.response_at); sets.push(`responded_at = $${p.length}`); }
  if (!sets.length) return exports.findById(id);
  p.push(id);
  await pool.query(`UPDATE dispatch_assignment SET ${sets.join(',')} WHERE id=$${p.length}`, p);
  return exports.findById(id);
};

exports.deleteById = (id) => pool.query('DELETE FROM dispatch_assignment WHERE id=$1', [id]);
