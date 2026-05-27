'use strict';
const pool = require('../db/pool');

function fmt(r) {
  if (!r) return null;
  return {
    location_log_id: r.id,
    deliverer_id:    r.deliverer_id,
    deliverer_code:  r.deliverer_code,
    latitude:        r.latitude,
    longitude:       r.longitude,
    capture_at:      r.captured_at,
  };
}

exports.findAll = async (f) => {
  let q = `SELECT log.*, dlv.code AS deliverer_code
           FROM deliverer_location_log log
           JOIN deliverer dlv ON log.deliverer_id=dlv.id
           WHERE 1=1`;
  const p = [];
  if (f.location_log_id) { p.push(f.location_log_id); q += ` AND log.id = $${p.length}`; }
  if (f.deliverer_code)  { p.push(f.deliverer_code);  q += ` AND dlv.code = $${p.length}`; }
  if (f.captured_from)   { p.push(f.captured_from);   q += ` AND log.captured_at >= $${p.length}`; }
  if (f.captured_to)     { p.push(f.captured_to);     q += ` AND log.captured_at <= $${p.length}`; }
  q += ' ORDER BY log.id';
  const { rows } = await pool.query(q, p);
  return rows.map(fmt);
};

exports.create = async (data) => {
  const { rows: [dlv] } = await pool.query('SELECT id,code FROM deliverer WHERE code=$1', [data.deliverer_code]);
  if (!dlv) throw Object.assign(new Error(`Deliverer ${data.deliverer_code} not found`), { name: 'NotFoundError' });
  const { rows: [r] } = await pool.query(
    'INSERT INTO deliverer_location_log (deliverer_id,latitude,longitude,captured_at) VALUES ($1,$2,$3,$4) RETURNING *',
    [dlv.id, data.latitude, data.longitude, data.capture_at || new Date()]
  );
  return fmt({ ...r, deliverer_code: dlv.code });
};

exports.findById = async (id) => {
  const { rows: [r] } = await pool.query(
    `SELECT log.*, dlv.code AS deliverer_code
     FROM deliverer_location_log log
     JOIN deliverer dlv ON log.deliverer_id=dlv.id
     WHERE log.id=$1`, [id]);
  return fmt(r);
};

exports.update = async (id, data) => {
  const allowed = ['latitude','longitude','captured_at'];
  const sets = []; const p = [];
  const payload = {
    ...data,
    captured_at: data.captured_at !== undefined ? data.captured_at : data.capture_at,
  };
  allowed.forEach(k => { if (payload[k] !== undefined) { p.push(payload[k]); sets.push(`${k} = $${p.length}`); }});
  if (!sets.length) return exports.findById(id);
  p.push(id);
  await pool.query(`UPDATE deliverer_location_log SET ${sets.join(',')} WHERE id=$${p.length}`, p);
  return exports.findById(id);
};

exports.deleteById = (id) => pool.query('DELETE FROM deliverer_location_log WHERE id=$1', [id]);
