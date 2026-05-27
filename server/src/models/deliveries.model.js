'use strict';
const pool = require('../db/pool');

function fmt(r) {
  if (!r) return null;
  return {
    delivery_id:   r.id,
    order_id:      r.order_id,
    deliverer_id:  r.deliverer_id,
    delivery_type: r.delivery_type,
    pickup_time:   r.pickup_time,
    delivery_time: r.delivery_time,
    delivery_fee:  r.delivery_fee,
  };
}

exports.findAll = async (f) => {
  let q = `SELECT d.* FROM delivery d
           LEFT JOIN "order" o ON d.order_id=o.id
           LEFT JOIN deliverer dlv ON d.deliverer_id=dlv.id
           WHERE 1=1`;
  const p = [];
  if (f.delivery_id)    { p.push(f.delivery_id);    q += ` AND d.id = $${p.length}`; }
  if (f.order_code)     { p.push(f.order_code);     q += ` AND o.code = $${p.length}`; }
  if (f.deliverer_code) { p.push(f.deliverer_code); q += ` AND dlv.code = $${p.length}`; }
  q += ' ORDER BY d.id';
  const { rows } = await pool.query(q, p);
  return rows.map(fmt);
};

exports.create = async (data) => {
  const { rows: [o] } = await pool.query('SELECT id FROM "order" WHERE code=$1', [data.order_code]);
  if (!o) throw Object.assign(new Error(`Order ${data.order_code} not found`), { name: 'NotFoundError' });
  const { rows: [dlv] } = await pool.query('SELECT id FROM deliverer WHERE code=$1', [data.deliverer_code]);
  if (!dlv) throw Object.assign(new Error(`Deliverer ${data.deliverer_code} not found`), { name: 'NotFoundError' });
  const { rows: [r] } = await pool.query(
    'INSERT INTO delivery (order_id,deliverer_id,delivery_type,pickup_time,delivery_time,delivery_fee) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [o.id, dlv.id, data.delivery_type, data.pickup_time || null, data.delivery_time || null, data.delivery_fee]
  );
  return fmt(r);
};

exports.findById = async (id) => {
  const { rows: [r] } = await pool.query('SELECT * FROM delivery WHERE id=$1', [id]);
  return fmt(r);
};

exports.update = async (id, data) => {
  const sets = []; const p = [];
  if (data.deliverer_code !== undefined) {
    const { rows: [dlv] } = await pool.query('SELECT id FROM deliverer WHERE code=$1', [data.deliverer_code]);
    if (dlv) { p.push(dlv.id); sets.push(`deliverer_id = $${p.length}`); }
  }
  const allowed = ['delivery_type','pickup_time','delivery_time','delivery_fee'];
  allowed.forEach(k => { if (data[k] !== undefined) { p.push(data[k]); sets.push(`${k} = $${p.length}`); }});
  if (!sets.length) return exports.findById(id);
  p.push(id);
  const { rows: [r] } = await pool.query(`UPDATE delivery SET ${sets.join(',')} WHERE id=$${p.length} RETURNING *`, p);
  return fmt(r);
};

exports.deleteById = (id) => pool.query('DELETE FROM delivery WHERE id=$1', [id]);

exports.isReferenced = async (id) => {
  const { rows: [c] } = await pool.query(
    'SELECT (SELECT COUNT(*) FROM payment WHERE delivery_id=$1)+(SELECT COUNT(*) FROM expense_voucher WHERE delivery_id=$1) AS cnt', [id]);
  return parseInt(c.cnt, 10) > 0;
};
