'use strict';
const pool = require('../db/pool');

function fmt(r) {
  if (!r) return null;
  return {
    product_id: r.id,
    store_id:   r.store_id,
    name:       r.name,
    unit_price: r.unit_price,
    status:     r.status,
    updated_at: r.updated_at,
  };
}

exports.findAll = async (f) => {
  let q = 'SELECT sp.* FROM store_products sp LEFT JOIN store s ON sp.store_id=s.id WHERE 1=1';
  const p = [];
  if (f.product_id)  { p.push(f.product_id);  q += ` AND sp.id = $${p.length}`; }
  if (f.store_code)  { p.push(f.store_code);   q += ` AND s.code = $${p.length}`; }
  if (f.status)      { p.push(f.status);       q += ` AND sp.status = $${p.length}`; }
  q += ' ORDER BY sp.id';
  const { rows } = await pool.query(q, p);
  return rows.map(fmt);
};

exports.create = async (data) => {
  const { rows: [store] } = await pool.query('SELECT id FROM store WHERE code=$1', [data.store_code]);
  if (!store) throw Object.assign(new Error(`Store ${data.store_code} not found`), { name: 'NotFoundError' });
  const { rows: [r] } = await pool.query(
    'INSERT INTO store_products (store_id,name,unit_price,status) VALUES ($1,$2,$3,$4) RETURNING *',
    [store.id, data.name, data.unit_price, data.status || 'AVAILABLE']
  );
  return fmt(r);
};

exports.findById = async (id) => {
  const { rows: [r] } = await pool.query('SELECT * FROM store_products WHERE id=$1', [id]);
  return fmt(r);
};

exports.update = async (id, data) => {
  const allowed = ['name','unit_price','status'];
  const sets = []; const p = [];
  allowed.forEach(k => { if (data[k] !== undefined) { p.push(data[k]); sets.push(`${k} = $${p.length}`); }});
  if (!sets.length) return exports.findById(id);
  p.push(id);
  const { rows: [r] } = await pool.query(
    `UPDATE store_products SET ${sets.join(',')},updated_at=NOW() WHERE id=$${p.length} RETURNING *`, p);
  return fmt(r);
};

exports.deleteById = (id) => pool.query('DELETE FROM store_products WHERE id=$1', [id]);

exports.isReferenced = async (id) => {
  const { rows: [c] } = await pool.query(
    'SELECT (SELECT COUNT(*) FROM order_items WHERE product_id=$1)+(SELECT COUNT(*) FROM promotion_items WHERE product_id=$1) AS cnt', [id]);
  return parseInt(c.cnt, 10) > 0;
};
