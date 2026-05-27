'use strict';
const pool = require('../db/pool');

function fmt(r) {
  if (!r) return null;
  return { profile_id: r.id, full_name: r.full_name, phone: r.phone, email: r.email, created_at: r.created_at };
}

exports.findAll = async (f) => {
  let q = 'SELECT * FROM profile WHERE 1=1';
  const p = [];
  if (f.profile_id) { p.push(f.profile_id); q += ` AND id = $${p.length}`; }
  if (f.email)      { p.push(`%${f.email}%`); q += ` AND email ILIKE $${p.length}`; }
  if (f.phone)      { p.push(`%${f.phone}%`); q += ` AND phone ILIKE $${p.length}`; }
  q += ' ORDER BY id';
  const { rows } = await pool.query(q, p);
  return rows.map(fmt);
};

exports.create = async (data) => {
  const { rows: [r] } = await pool.query(
    'INSERT INTO profile (full_name,phone,email) VALUES ($1,$2,$3) RETURNING *',
    [data.full_name, data.phone, data.email]
  );
  return fmt(r);
};

exports.findById = async (id) => {
  const { rows: [r] } = await pool.query('SELECT * FROM profile WHERE id = $1', [id]);
  return fmt(r);
};

exports.update = async (id, data) => {
  const allowed = ['full_name','phone','email'];
  const sets = []; const p = [];
  allowed.forEach(k => { if (data[k] !== undefined) { p.push(data[k]); sets.push(`${k} = $${p.length}`); }});
  if (!sets.length) return exports.findById(id);
  p.push(id);
  const { rows: [r] } = await pool.query(`UPDATE profile SET ${sets.join(',')} WHERE id = $${p.length} RETURNING *`, p);
  return fmt(r);
};

exports.deleteById = (id) => pool.query('DELETE FROM profile WHERE id = $1', [id]);

exports.isReferenced = async (id) => {
  const { rows: [c] } = await pool.query(
    'SELECT (SELECT COUNT(*) FROM customer WHERE profile_id=$1)+(SELECT COUNT(*) FROM deliverer WHERE profile_id=$1) AS cnt', [id]);
  return parseInt(c.cnt, 10) > 0;
};
