'use strict';
const pool = require('../db/pool');

function fmt(r) {
  if (!r) return null;
  return {
    customer_id:   r.customer_id,
    store_id:      r.store_id,
    customer_code: r.customer_code,
    store_code:    r.store_code,
  };
}

exports.findAll = async (f) => {
  let q = `SELECT fs.customer_id, fs.store_id, c.code AS customer_code, s.code AS store_code
           FROM favorite_store fs
           JOIN customer c ON fs.customer_id=c.id
           JOIN store    s ON fs.store_id=s.id
           WHERE 1=1`;
  const p = [];
  if (f.customer_code) { p.push(f.customer_code); q += ` AND c.code = $${p.length}`; }
  if (f.store_code)    { p.push(f.store_code);    q += ` AND s.code = $${p.length}`; }
  q += ' ORDER BY fs.customer_id, fs.store_id';
  const { rows } = await pool.query(q, p);
  return rows.map(fmt);
};

exports.create = async (data) => {
  const { rows: [c] } = await pool.query('SELECT id FROM customer WHERE code=$1', [data.customer_code]);
  if (!c) throw Object.assign(new Error(`Customer ${data.customer_code} not found`), { name: 'NotFoundError' });
  const { rows: [s] } = await pool.query('SELECT id FROM store WHERE code=$1', [data.store_code]);
  if (!s) throw Object.assign(new Error(`Store ${data.store_code} not found`), { name: 'NotFoundError' });
  await pool.query('INSERT INTO favorite_store (customer_id,store_id) VALUES ($1,$2)', [c.id, s.id]);
  const { rows: [r] } = await pool.query(
    `SELECT fs.customer_id, fs.store_id, c.code AS customer_code, s.code AS store_code
     FROM favorite_store fs JOIN customer c ON fs.customer_id=c.id JOIN store s ON fs.store_id=s.id
     WHERE fs.customer_id=$1 AND fs.store_id=$2`, [c.id, s.id]);
  return fmt(r);
};

exports.findOne = async (customerCode, storeCode) => {
  const { rows: [r] } = await pool.query(
    `SELECT fs.customer_id, fs.store_id, c.code AS customer_code, s.code AS store_code
     FROM favorite_store fs JOIN customer c ON fs.customer_id=c.id JOIN store s ON fs.store_id=s.id
     WHERE c.code=$1 AND s.code=$2`, [customerCode, storeCode]);
  return fmt(r);
};

exports.update = async (customerCode, storeCode, data) => {
  const { rows: [oc] } = await pool.query('SELECT id FROM customer WHERE code=$1', [customerCode]);
  const { rows: [os] } = await pool.query('SELECT id FROM store WHERE code=$1', [storeCode]);
  if (!oc || !os) throw Object.assign(new Error('Favourite store not found'), { name: 'NotFoundError' });
  const { rows: [nc] } = await pool.query('SELECT id FROM customer WHERE code=$1', [data.new_customer_code]);
  const { rows: [ns] } = await pool.query('SELECT id FROM store WHERE code=$1', [data.new_store_code]);
  if (!nc) throw Object.assign(new Error(`Customer ${data.new_customer_code} not found`), { name: 'NotFoundError' });
  if (!ns) throw Object.assign(new Error(`Store ${data.new_store_code} not found`), { name: 'NotFoundError' });
  await pool.query('DELETE FROM favorite_store WHERE customer_id=$1 AND store_id=$2', [oc.id, os.id]);
  await pool.query('INSERT INTO favorite_store (customer_id,store_id) VALUES ($1,$2)', [nc.id, ns.id]);
  const { rows: [r] } = await pool.query(
    `SELECT fs.customer_id, fs.store_id, c.code AS customer_code, s.code AS store_code
     FROM favorite_store fs JOIN customer c ON fs.customer_id=c.id JOIN store s ON fs.store_id=s.id
     WHERE fs.customer_id=$1 AND fs.store_id=$2`, [nc.id, ns.id]);
  return fmt(r);
};

exports.deleteOne = (customerCode, storeCode) => pool.query(
  `DELETE FROM favorite_store WHERE
   customer_id=(SELECT id FROM customer WHERE code=$1) AND
   store_id=(SELECT id FROM store WHERE code=$2)`,
  [customerCode, storeCode]
);
