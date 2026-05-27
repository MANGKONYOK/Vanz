'use strict';
const pool = require('../db/pool');

function fmt(r) {
  if (!r) return null;
  return {
    address_id:    r.id,
    address_name:  r.address_name,
    address_type:  r.address_type,
    address_line_1:r.address_line_1,
    address_line_2:r.address_line_2,
    city:          r.city,
    province:      r.province,
    country_code:  r.country_code,
    latitude:      r.latitude,
    longitude:     r.longitude,
  };
}

exports.findAll = async (f) => {
  let q = 'SELECT * FROM address WHERE 1=1';
  const p = [];
  if (f.address_id)   { p.push(f.address_id);           q += ` AND id = $${p.length}`; }
  if (f.address_type) { p.push(`%${f.address_type}%`);  q += ` AND address_type ILIKE $${p.length}`; }
  if (f.city)         { p.push(`%${f.city}%`);          q += ` AND city ILIKE $${p.length}`; }
  if (f.country_code) { p.push(f.country_code);         q += ` AND country_code = $${p.length}`; }
  q += ' ORDER BY id';
  const { rows } = await pool.query(q, p);
  return rows.map(fmt);
};

exports.create = async (data) => {
  const { rows: [r] } = await pool.query(
    `INSERT INTO address (address_name,address_type,address_line_1,address_line_2,city,province,country_code,latitude,longitude)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [data.address_name, data.address_type, data.address_line_1,
     data.address_line_2 || null, data.city, data.province || null,
     data.country_code, data.latitude ?? null, data.longitude ?? null]
  );
  return fmt(r);
};

exports.findById = async (id) => {
  const { rows: [r] } = await pool.query('SELECT * FROM address WHERE id = $1', [id]);
  return fmt(r);
};

exports.update = async (id, data) => {
  const allowed = ['address_name','address_type','address_line_1','address_line_2','city','province','country_code','latitude','longitude'];
  const sets = []; const p = [];
  allowed.forEach(k => { if (data[k] !== undefined) { p.push(data[k]); sets.push(`${k} = $${p.length}`); }});
  if (!sets.length) return exports.findById(id);
  p.push(id);
  const { rows: [r] } = await pool.query(`UPDATE address SET ${sets.join(',')} WHERE id = $${p.length} RETURNING *`, p);
  return fmt(r);
};

exports.deleteById = (id) => pool.query('DELETE FROM address WHERE id = $1', [id]);

exports.isReferenced = async (id) => {
  const { rows: [c] } = await pool.query(
    'SELECT (SELECT COUNT(*) FROM customer WHERE address_id=$1)+(SELECT COUNT(*) FROM store WHERE address_id=$1) AS cnt', [id]);
  return parseInt(c.cnt, 10) > 0;
};
