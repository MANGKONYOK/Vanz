'use strict';
const pool = require('../db/pool');

function fmt(r) {
  if (!r) return null;
  return {
    deliverer_id:   r.id,
    profile_id:     r.profile_id,
    deliverer_code: r.code,
    vehicle_type:   r.vehicle_type,
    license_plate:  r.license_plate,
    current_status: r.current_status,
    rating:         r.rating,
    created_at:     r.created_at,
  };
}

exports.findAll = async (f) => {
  let q = 'SELECT * FROM deliverer WHERE 1=1';
  const p = [];
  if (f.deliverer_code)  { p.push(f.deliverer_code);            q += ` AND code = $${p.length}`; }
  if (f.current_status)  { p.push(String(f.current_status).toLowerCase()); q += ` AND current_status = $${p.length}`; }
  if (f.vehicle_type)    { p.push(`%${f.vehicle_type}%`);       q += ` AND vehicle_type ILIKE $${p.length}`; }
  q += ' ORDER BY id';
  const { rows } = await pool.query(q, p);
  return rows.map(fmt);
};

exports.create = async (data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let code = data.code;
    if (code && typeof code === 'string' && code.trim()) {
      code = code.trim();
    } else {
      code = 'DLV-TMP-' + Date.now();
    }
    const { rows: [ins] } = await client.query(
      'INSERT INTO deliverer (profile_id,vehicle_type,license_plate,current_status,code) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [data.profile_id, data.vehicle_type, data.license_plate, data.current_status || 'AVAILABLE', code]
    );
    let r;
    if (!data.code || typeof data.code !== 'string' || !data.code.trim()) {
      const fallbackCode = 'DLV-' + String(ins.id).padStart(6, '0');
      const { rows: [updated] } = await client.query('UPDATE deliverer SET code=$1 WHERE id=$2 RETURNING *', [fallbackCode, ins.id]);
      r = updated;
    } else {
      const { rows: [selected] } = await client.query('SELECT * FROM deliverer WHERE id=$1', [ins.id]);
      r = selected;
    }
    await client.query('COMMIT');
    return fmt(r);
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
};

exports.findByCode = async (code) => {
  const { rows: [r] } = await pool.query('SELECT * FROM deliverer WHERE code = $1', [code]);
  return fmt(r);
};

exports.update = async (id, data) => {
  const allowed = ['vehicle_type','license_plate','current_status','rating'];
  const sets = []; const p = [];
  allowed.forEach(k => { if (data[k] !== undefined) { p.push(data[k]); sets.push(`${k} = $${p.length}`); }});
  if (!sets.length) { const { rows:[r] } = await pool.query('SELECT * FROM deliverer WHERE id=$1',[id]); return fmt(r); }
  p.push(id);
  const { rows: [r] } = await pool.query(`UPDATE deliverer SET ${sets.join(',')} WHERE id=$${p.length} RETURNING *`, p);
  return fmt(r);
};

exports.deleteById = (id) => pool.query('DELETE FROM deliverer WHERE id = $1', [id]);

exports.isProfileUsed = async (profileId) => {
  const { rows: [c] } = await pool.query('SELECT COUNT(*) AS cnt FROM deliverer WHERE profile_id=$1', [profileId]);
  return parseInt(c.cnt, 10) > 0;
};

exports.hasRelatedData = async (id) => {
  const { rows: [c] } = await pool.query(
    `SELECT (SELECT COUNT(*) FROM delivery WHERE deliverer_id=$1)
          +(SELECT COUNT(*) FROM dispatch_assignment WHERE deliverer_id=$1)
          +(SELECT COUNT(*) FROM payment p JOIN delivery d ON p.delivery_id=d.id WHERE d.deliverer_id=$1)
          +(SELECT COUNT(*) FROM expense_voucher ev JOIN delivery d ON ev.delivery_id=d.id WHERE d.deliverer_id=$1) AS cnt`,
    [id]);
  return parseInt(c.cnt, 10) > 0;
};
