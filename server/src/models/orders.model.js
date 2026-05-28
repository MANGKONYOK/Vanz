'use strict';
const pool = require('../db/pool');

function fmtHeader(r) {
  if (!r) return null;
  return {
    order_id:         r.id,
    customer_id:      r.customer_id,
    store_id:         r.store_id,
    order_code:       r.code,
    order_date:       r.updated_at,
    total_price:      r.total_price,
    address_snapshot: r.address_snapshot,
    status:           r.status,
  };
}

function fmtItem(r) {
  return {
    order_item_id: r.id,
    order_id:      r.order_id,
    product_id:    r.product_id,
    quantity:      r.quantity,
    unit_price:    r.unit_price,
    extend_price:  r.extended_price,
  };
}

async function withItems(header) {
  if (!header) return null;
  const { rows } = await pool.query('SELECT * FROM order_items WHERE order_id=$1 ORDER BY id', [header.order_id]);
  return { ...header, order_items: rows.map(fmtItem) };
}

async function attachItemsBatch(headers) {
  if (!headers.length) return [];
  const ids = headers.map(h => h.order_id);
  const { rows } = await pool.query('SELECT * FROM order_items WHERE order_id = ANY($1) ORDER BY order_id, id', [ids]);
  const byOrderId = {};
  for (const row of rows) {
    (byOrderId[row.order_id] = byOrderId[row.order_id] || []).push(fmtItem(row));
  }
  return headers.map(h => ({ ...h, order_items: byOrderId[h.order_id] || [] }));
}

exports.findAll = async (f) => {
  let q = 'SELECT * FROM "order" WHERE 1=1';
  const p = [];
  if (f.order_code)  { p.push(f.order_code);  q += ` AND code = $${p.length}`; }
  if (f.customer_id) { p.push(f.customer_id); q += ` AND customer_id = $${p.length}`; }
  if (f.status)      { p.push(f.status);       q += ` AND status = $${p.length}`; }
  q += ' ORDER BY id DESC';
  const { rows } = await pool.query(q, p);
  return attachItemsBatch(rows.map(fmtHeader));
};

exports.findByCode = async (code) => {
  const { rows: [r] } = await pool.query('SELECT * FROM "order" WHERE code=$1', [code]);
  return withItems(fmtHeader(r));
};

exports.create = async (data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [cust] } = await client.query('SELECT id FROM customer WHERE code=$1', [data.customer_code]);
    if (!cust) throw Object.assign(new Error(`Customer ${data.customer_code} not found`), { name: 'NotFoundError' });
    const { rows: [store] } = await client.query('SELECT id FROM store WHERE code=$1', [data.store_code]);
    if (!store) throw Object.assign(new Error(`Store ${data.store_code} not found`), { name: 'NotFoundError' });
    const { rows: [ins] } = await client.query(
      'INSERT INTO "order" (customer_id,store_id,total_price,address_snapshot,status,code) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [cust.id, store.id, data.total_price, data.address_snapshot, 'PENDING', 'ORD-TMP-' + Date.now()]
    );
    const year = new Date().getFullYear();
    const code = 'ORD-' + year + '-' + String(ins.id).padStart(6, '0');
    const { rows: [hdr] } = await client.query('UPDATE "order" SET code=$1 WHERE id=$2 RETURNING *', [code, ins.id]);
    const items = [];
    for (const item of data.order_items) {
      const { rows: [i] } = await client.query(
        'INSERT INTO order_items (order_id,product_id,quantity,unit_price,extended_price) VALUES ($1,$2,$3,$4,$5) RETURNING *',
        [ins.id, item.product_id, item.quantity, item.unit_price, item.extend_price]
      );
      items.push(fmtItem(i));
    }
    await client.query('COMMIT');
    return { ...fmtHeader(hdr), order_items: items };
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
};

exports.update = async (id, data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const hdrFields = ['status','address_snapshot','total_price'];
    const sets = []; const p = [];
    hdrFields.forEach(k => { if (data[k] !== undefined) { p.push(data[k]); sets.push(`${k} = $${p.length}`); }});
    let hdr;
    if (sets.length) {
      p.push(id);
      const { rows: [r] } = await client.query(
        `UPDATE "order" SET ${sets.join(',')},updated_at=NOW() WHERE id=$${p.length} RETURNING *`, p);
      hdr = fmtHeader(r);
    } else {
      const { rows: [r] } = await client.query('SELECT * FROM "order" WHERE id=$1', [id]);
      hdr = fmtHeader(r);
    }
    let items;
    if (Array.isArray(data.order_items)) {
      await client.query('DELETE FROM order_items WHERE order_id=$1', [id]);
      items = [];
      for (const item of data.order_items) {
        const { rows: [i] } = await client.query(
          'INSERT INTO order_items (order_id,product_id,quantity,unit_price,extended_price) VALUES ($1,$2,$3,$4,$5) RETURNING *',
          [id, item.product_id, item.quantity, item.unit_price, item.extend_price]
        );
        items.push(fmtItem(i));
      }
    } else {
      const { rows } = await client.query('SELECT * FROM order_items WHERE order_id=$1 ORDER BY id', [id]);
      items = rows.map(fmtItem);
    }
    await client.query('COMMIT');
    return { ...hdr, order_items: items };
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
};

exports.deleteById = async (id) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM order_items WHERE order_id=$1', [id]);
    await client.query('DELETE FROM "order" WHERE id=$1', [id]);
    await client.query('COMMIT');
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
};
