'use strict';
const pool = require('../db/pool');

function fmtHeader(r) {
  if (!r) return null;
  return {
    expense_voucher_id: r.id,
    delivery_id:        r.delivery_id,
    voucher_code:       r.code,
    voucher_date:       r.voucher_date,
    status:             r.status,
    total_amount:       r.total_amount,
    updated_at:         r.updated_at,
  };
}

function fmtItem(r) {
  return {
    expense_item_id:        r.id,
    expense_voucher_id:     r.expense_voucher_id,
    expense_type:           r.expense_type,
    description:            r.description,
    amount:                 r.amount,
    receipt_reference_code: r.receipt_reference_code,
  };
}

async function withItems(header) {
  if (!header) return null;
  const { rows } = await pool.query('SELECT * FROM expense_voucher_items WHERE expense_voucher_id=$1 ORDER BY id', [header.expense_voucher_id]);
  return { ...header, expense_items: rows.map(fmtItem) };
}

async function attachItemsBatch(headers) {
  if (!headers.length) return [];
  const ids = headers.map(h => h.expense_voucher_id);
  const { rows } = await pool.query('SELECT * FROM expense_voucher_items WHERE expense_voucher_id = ANY($1) ORDER BY expense_voucher_id, id', [ids]);
  const byVoucherId = {};
  for (const row of rows) {
    (byVoucherId[row.expense_voucher_id] = byVoucherId[row.expense_voucher_id] || []).push(fmtItem(row));
  }
  return headers.map(h => ({ ...h, expense_items: byVoucherId[h.expense_voucher_id] || [] }));
}

exports.findAll = async (f) => {
  let q = `SELECT ev.* FROM expense_voucher ev
           JOIN delivery d ON ev.delivery_id=d.id
           JOIN deliverer dlv ON d.deliverer_id=dlv.id
           WHERE 1=1`;
  const p = [];
  if (f.deliverer_code) { p.push(f.deliverer_code); q += ` AND dlv.code = $${p.length}`; }
  if (f.voucher_date)   { p.push(f.voucher_date);   q += ` AND ev.voucher_date = $${p.length}`; }
  q += ' ORDER BY ev.id';
  const { rows } = await pool.query(q, p);
  return attachItemsBatch(rows.map(fmtHeader));
};

exports.findByCode = async (code) => {
  const { rows: [r] } = await pool.query('SELECT * FROM expense_voucher WHERE code=$1', [code]);
  return withItems(fmtHeader(r));
};

exports.create = async (data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const deliveryId = parseInt(data.delivery_code, 10);
    const { rows: [chk] } = await client.query('SELECT id FROM delivery WHERE id=$1', [deliveryId]);
    if (!chk) throw Object.assign(new Error(`Delivery ${data.delivery_code} not found`), { name: 'NotFoundError' });
    const { rows: [ins] } = await client.query(
      'INSERT INTO expense_voucher (delivery_id,voucher_date,status,total_amount) VALUES ($1,$2,$3,$4) RETURNING id',
      [deliveryId, data.voucher_date, 'DRAFT', data.total_amount]
    );
    const year = new Date().getFullYear();
    const code = 'EXP-' + year + '-' + String(ins.id).padStart(6, '0');
    const { rows: [hdr] } = await client.query('UPDATE expense_voucher SET code=$1 WHERE id=$2 RETURNING *', [code, ins.id]);
    const items = [];
    for (const item of data.expense_items) {
      const { rows: [i] } = await client.query(
        'INSERT INTO expense_voucher_items (expense_voucher_id,expense_type,description,amount,receipt_reference_code) VALUES ($1,$2,$3,$4,$5) RETURNING *',
        [ins.id, item.expense_type, item.description, item.amount, item.receipt_reference_code || null]
      );
      items.push(fmtItem(i));
    }
    await client.query('COMMIT');
    return { ...fmtHeader(hdr), expense_items: items };
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
};

exports.update = async (id, data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const hdrFields = ['voucher_date','status','total_amount'];
    const sets = []; const p = [];
    hdrFields.forEach(k => { if (data[k] !== undefined) { p.push(data[k]); sets.push(`${k} = $${p.length}`); }});
    let hdr;
    if (sets.length) {
      p.push(id);
      const { rows: [r] } = await client.query(
        `UPDATE expense_voucher SET ${sets.join(',')},updated_at=NOW() WHERE id=$${p.length} RETURNING *`, p);
      hdr = fmtHeader(r);
    } else {
      const { rows: [r] } = await client.query('SELECT * FROM expense_voucher WHERE id=$1', [id]);
      hdr = fmtHeader(r);
    }
    let items;
    if (Array.isArray(data.expense_items)) {
      await client.query('DELETE FROM expense_voucher_items WHERE expense_voucher_id=$1', [id]);
      items = [];
      for (const item of data.expense_items) {
        const { rows: [i] } = await client.query(
          'INSERT INTO expense_voucher_items (expense_voucher_id,expense_type,description,amount,receipt_reference_code) VALUES ($1,$2,$3,$4,$5) RETURNING *',
          [id, item.expense_type, item.description, item.amount, item.receipt_reference_code || null]
        );
        items.push(fmtItem(i));
      }
    } else {
      const { rows } = await client.query('SELECT * FROM expense_voucher_items WHERE expense_voucher_id=$1 ORDER BY id', [id]);
      items = rows.map(fmtItem);
    }
    await client.query('COMMIT');
    return { ...hdr, expense_items: items };
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
};

exports.deleteById = async (id) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM expense_voucher_items WHERE expense_voucher_id=$1', [id]);
    await client.query('DELETE FROM expense_voucher WHERE id=$1', [id]);
    await client.query('COMMIT');
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
};
