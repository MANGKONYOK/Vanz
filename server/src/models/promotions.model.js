'use strict';
const pool = require('../db/pool');

function fmtHeader(r) {
  if (!r) return null;
  return {
    promotion_id:   r.id,
    store_id:       r.store_id,
    promotion_code: r.code,
    name:           r.name,
    start_date:     r.start_date,
    end_date:       r.end_date,
    discount_type:  r.discount_type,
  };
}

function fmtItem(r) {
  return {
    promotion_item_id: r.id,
    promotion_id:      r.promotion_id,
    product_id:        r.product_id,
    discount_value:    r.discount_value,
  };
}

async function withItems(header) {
  if (!header) return null;
  const { rows } = await pool.query('SELECT * FROM promotion_items WHERE promotion_id=$1 ORDER BY id', [header.promotion_id]);
  return { ...header, promotion_items: rows.map(fmtItem) };
}

async function attachItemsBatch(headers) {
  if (!headers.length) return [];
  const ids = headers.map(h => h.promotion_id);
  const { rows } = await pool.query('SELECT * FROM promotion_items WHERE promotion_id = ANY($1) ORDER BY promotion_id, id', [ids]);
  const byPromotionId = {};
  for (const row of rows) {
    (byPromotionId[row.promotion_id] = byPromotionId[row.promotion_id] || []).push(fmtItem(row));
  }
  return headers.map(h => ({ ...h, promotion_items: byPromotionId[h.promotion_id] || [] }));
}

exports.findAll = async (f) => {
  let q = `SELECT p.* FROM promotion p
             JOIN store s ON p.store_id=s.id
             WHERE 1=1`;
  const p = [];
  if (f.store_code) { p.push(f.store_code); q += ` AND s.code = $${p.length}`; }
  q += ' ORDER BY p.id';
  const { rows } = await pool.query(q, p);
  return attachItemsBatch(rows.map(fmtHeader));
};

exports.create = async (data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [s] } = await client.query('SELECT id FROM store WHERE code=$1', [data.store_code]);
    if (!s) throw Object.assign(new Error(`Store ${data.store_code} not found`), { name: 'NotFoundError' });
    const { rows: [ins] } = await client.query(
      'INSERT INTO promotion (store_id,name,start_date,end_date,discount_type) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [s.id, data.name, data.start_date, data.end_date, data.discount_type]
    );
    const code = 'PROMO-' + String(ins.id).padStart(4, '0');
    const { rows: [hdr] } = await client.query('UPDATE promotion SET code=$1 WHERE id=$2 RETURNING *', [code, ins.id]);
    const items = [];
    for (const item of data.promotion_items) {
      const { rows: [i] } = await client.query(
        'INSERT INTO promotion_items (promotion_id,product_id,discount_value) VALUES ($1,$2,$3) RETURNING *',
        [ins.id, item.product_id, item.discount_value]
      );
      items.push(fmtItem(i));
    }
    await client.query('COMMIT');
    return { ...fmtHeader(hdr), promotion_items: items };
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
};

exports.update = async (id, data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const hdrFields = ['name','start_date','end_date','discount_type'];
    const sets = []; const p = [];
    hdrFields.forEach(k => { if (data[k] !== undefined) { p.push(data[k]); sets.push(`${k} = $${p.length}`); }});
    let hdr;
    if (sets.length) {
      p.push(id);
      const { rows: [r] } = await client.query(`UPDATE promotion SET ${sets.join(',')} WHERE id=$${p.length} RETURNING *`, p);
      hdr = fmtHeader(r);
    } else {
      const { rows: [r] } = await client.query('SELECT * FROM promotion WHERE id=$1', [id]);
      hdr = fmtHeader(r);
    }
    let items;
    if (Array.isArray(data.promotion_items)) {
      await client.query('DELETE FROM promotion_items WHERE promotion_id=$1', [id]);
      items = [];
      for (const item of data.promotion_items) {
        const { rows: [i] } = await client.query(
          'INSERT INTO promotion_items (promotion_id,product_id,discount_value) VALUES ($1,$2,$3) RETURNING *',
          [id, item.product_id, item.discount_value]
        );
        items.push(fmtItem(i));
      }
    } else {
      const { rows } = await client.query('SELECT * FROM promotion_items WHERE promotion_id=$1 ORDER BY id', [id]);
      items = rows.map(fmtItem);
    }
    await client.query('COMMIT');
    return { ...hdr, promotion_items: items };
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
};

exports.deleteById = async (id) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM promotion_items WHERE promotion_id=$1', [id]);
    await client.query('DELETE FROM promotion WHERE id=$1', [id]);
    await client.query('COMMIT');
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
};
