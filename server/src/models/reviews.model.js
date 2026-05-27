'use strict';
const pool = require('../db/pool');

function fmt(r) {
  if (!r) return null;
  return {
    review_id:   r.id,
    order_id:    r.order_id,
    customer_id: r.customer_id,
    rating:      r.rating,
    comment:     r.comment,
    target:      r.target,
    created_at:  r.created_at,
  };
}

exports.findAll = async (f) => {
  let q = `SELECT rv.* FROM review rv
           LEFT JOIN "order" o ON rv.order_id=o.id
           LEFT JOIN customer c ON rv.customer_id=c.id
           WHERE 1=1`;
  const p = [];
  if (f.review_id)     { p.push(f.review_id);     q += ` AND rv.id = $${p.length}`; }
  if (f.order_code)    { p.push(f.order_code);     q += ` AND o.code = $${p.length}`; }
  if (f.customer_code) { p.push(f.customer_code);  q += ` AND c.code = $${p.length}`; }
  if (f.target)        { p.push(f.target);         q += ` AND rv.target = $${p.length}`; }
  q += ' ORDER BY rv.id';
  const { rows } = await pool.query(q, p);
  return rows.map(fmt);
};

exports.create = async (data) => {
  const { rows: [o] } = await pool.query('SELECT id FROM "order" WHERE code=$1', [data.order_code]);
  if (!o) throw Object.assign(new Error(`Order ${data.order_code} not found`), { name: 'NotFoundError' });
  const { rows: [c] } = await pool.query('SELECT id FROM customer WHERE code=$1', [data.customer_code]);
  if (!c) throw Object.assign(new Error(`Customer ${data.customer_code} not found`), { name: 'NotFoundError' });
  const { rows: [r] } = await pool.query(
    'INSERT INTO review (order_id,customer_id,rating,comment,target) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [o.id, c.id, data.rating, data.comment || null, data.target]
  );
  return fmt(r);
};

exports.findById = async (id) => {
  const { rows: [r] } = await pool.query('SELECT * FROM review WHERE id=$1', [id]);
  return fmt(r);
};

exports.update = async (id, data) => {
  const allowed = ['rating','comment','target'];
  const sets = []; const p = [];
  allowed.forEach(k => { if (data[k] !== undefined) { p.push(data[k]); sets.push(`${k} = $${p.length}`); }});
  if (!sets.length) return exports.findById(id);
  p.push(id);
  const { rows: [r] } = await pool.query(`UPDATE review SET ${sets.join(',')} WHERE id=$${p.length} RETURNING *`, p);
  return fmt(r);
};

exports.deleteById = (id) => pool.query('DELETE FROM review WHERE id=$1', [id]);
