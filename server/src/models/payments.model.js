'use strict';
const pool = require('../db/pool');

function fmtHeader(r) {
  if (!r) return null;
  return {
    payment_id:           r.id,
    delivery_id:          r.delivery_id,
    payment_code:         r.code,
    payment_period_start: r.payment_period_start,
    payment_period_end:   r.payment_period_end,
    total_payment:        r.total_payment,
    status:               r.status,
    payment_datetime:     r.payment_datetime,
  };
}

function fmtItem(r) {
  return {
    payment_item_id:   r.id,
    payment_id:        r.payment_id,
    order_id:          r.order_id,
    delivery_fee:      r.delivery_fee,
    bonus:             r.bonus,
    adjustment_amount: r.adjustment_amount,
  };
}

async function withItems(header) {
  if (!header) return null;
  const { rows } = await pool.query('SELECT * FROM payment_items WHERE payment_id=$1 ORDER BY id', [header.payment_id]);
  return { ...header, payment_items: rows.map(fmtItem) };
}

async function attachItemsBatch(headers) {
  if (!headers.length) return [];
  const ids = headers.map(h => h.payment_id);
  const { rows } = await pool.query('SELECT * FROM payment_items WHERE payment_id = ANY($1) ORDER BY payment_id, id', [ids]);
  const byPaymentId = {};
  for (const row of rows) {
    (byPaymentId[row.payment_id] = byPaymentId[row.payment_id] || []).push(fmtItem(row));
  }
  return headers.map(h => ({ ...h, payment_items: byPaymentId[h.payment_id] || [] }));
}

exports.findAll = async (f) => {
  let q = `SELECT p.* FROM payment p
           JOIN delivery d ON p.delivery_id=d.id
           JOIN deliverer dlv ON d.deliverer_id=dlv.id
           WHERE 1=1`;
  const p = [];
  if (f.deliverer_code)        { p.push(f.deliverer_code);        q += ` AND dlv.code = $${p.length}`; }
  if (f.payment_period_start)  { p.push(f.payment_period_start);  q += ` AND p.payment_period_start >= $${p.length}`; }
  if (f.payment_period_end)    { p.push(f.payment_period_end);    q += ` AND p.payment_period_end <= $${p.length}`; }
  q += ' ORDER BY p.id';
  const { rows } = await pool.query(q, p);
  return attachItemsBatch(rows.map(fmtHeader));
};

exports.findByCode = async (code) => {
  const { rows: [r] } = await pool.query('SELECT * FROM payment WHERE code=$1', [code]);
  return withItems(fmtHeader(r));
};

exports.create = async (data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const deliveryId = parseInt(data.delivery_id, 10);
    const { rows: [chk] } = await client.query('SELECT id FROM delivery WHERE id=$1', [deliveryId]);
    if (!chk) throw Object.assign(new Error(`Delivery ${data.delivery_id} not found`), { name: 'NotFoundError' });
    const { rows: [ins] } = await client.query(
      'INSERT INTO payment (delivery_id,payment_period_start,payment_period_end,total_payment,status,code,payment_datetime) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
      [deliveryId, data.payment_period_start, data.payment_period_end, data.total_payment, 'pending', 'PAY-TMP-' + Date.now(), data.payment_datetime]
    );
    const year = new Date().getFullYear();
    const code = 'PAY-' + year + '-' + String(ins.id).padStart(6, '0');
    const { rows: [hdr] } = await client.query('UPDATE payment SET code=$1 WHERE id=$2 RETURNING *', [code, ins.id]);
    const items = [];
    for (const item of data.payment_items) {
      const { rows: [o] } = await client.query('SELECT id FROM "order" WHERE code=$1', [item.order_code]);
      if (!o) throw Object.assign(new Error(`Order ${item.order_code} not found`), { name: 'NotFoundError' });
      const { rows: [i] } = await client.query(
        'INSERT INTO payment_items (payment_id,order_id,delivery_fee,bonus,adjustment_amount) VALUES ($1,$2,$3,$4,$5) RETURNING *',
        [ins.id, o.id, item.delivery_fee, item.bonus, item.adjustment_amount ?? 0]
      );
      items.push(fmtItem(i));
    }
    await client.query('COMMIT');
    return { ...fmtHeader(hdr), payment_items: items };
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
};

exports.update = async (id, data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const hdrFields = ['payment_period_start','payment_period_end','status','total_payment','payment_datetime'];
    const sets = []; const p = [];
    hdrFields.forEach(k => { if (data[k] !== undefined) { p.push(data[k]); sets.push(`${k} = $${p.length}`); }});
    let hdr;
    if (sets.length) {
      p.push(id);
      const { rows: [r] } = await client.query(`UPDATE payment SET ${sets.join(',')} WHERE id=$${p.length} RETURNING *`, p);
      hdr = fmtHeader(r);
    } else {
      const { rows: [r] } = await client.query('SELECT * FROM payment WHERE id=$1', [id]);
      hdr = fmtHeader(r);
    }
    let items;
    if (Array.isArray(data.payment_items)) {
      await client.query('DELETE FROM payment_items WHERE payment_id=$1', [id]);
      items = [];
      for (const item of data.payment_items) {
        const { rows: [o] } = await client.query('SELECT id FROM "order" WHERE code=$1', [item.order_code]);
        if (!o) throw Object.assign(new Error(`Order ${item.order_code} not found`), { name: 'NotFoundError' });
        const { rows: [i] } = await client.query(
          'INSERT INTO payment_items (payment_id,order_id,delivery_fee,bonus,adjustment_amount) VALUES ($1,$2,$3,$4,$5) RETURNING *',
          [id, o.id, item.delivery_fee, item.bonus, item.adjustment_amount ?? 0]
        );
        items.push(fmtItem(i));
      }
    } else {
      const { rows } = await client.query('SELECT * FROM payment_items WHERE payment_id=$1 ORDER BY id', [id]);
      items = rows.map(fmtItem);
    }
    await client.query('COMMIT');
    return { ...hdr, payment_items: items };
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
};

exports.deleteById = async (id) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM payment_items WHERE payment_id=$1', [id]);
    await client.query('DELETE FROM payment WHERE id=$1', [id]);
    await client.query('COMMIT');
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
};
