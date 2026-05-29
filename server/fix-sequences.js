/**
 * fix-sequences.js
 *
 * Resyncs all GENERATED ALWAYS AS IDENTITY sequences that have drifted
 * behind the actual MAX(id) in each table.
 *
 * Root cause: seed data inserted with explicit IDs leaves the sequence
 * pointing to an ID that already exists → duplicate PK on next INSERT.
 *
 * Run once from the server/ directory:
 *   node fix-sequences.js
 */

'use strict';
const pool = require('./src/db/pool');

const TABLES = [
  'address',
  'customer',
  'deliverer',
  'deliverer_location_log',
  'delivery',
  'dispatch_assignment',
  'favorite_store',
  '"order"',          // reserved keyword — must be quoted
  'order_items',
  'payment',
  'payment_items',
  'profile',
  'promotion',
  'promotion_items',
  'store',
  'store_products',
];

async function fixSequences() {
  const client = await pool.connect();
  try {
    console.log('Checking & resyncing identity sequences…\n');

    for (const tbl of TABLES) {
      const { rows: [{ max_id }] } = await client.query(
        `SELECT COALESCE(MAX(id), 0) AS max_id FROM ${tbl}`
      );
      const nextVal = Number(max_id) + 1;
      await client.query(
        `ALTER TABLE ${tbl} ALTER COLUMN id RESTART WITH ${nextVal}`
      );
      console.log(`  ✓  ${tbl.replace(/"/g, '').padEnd(25)} MAX(id) = ${max_id}  →  next = ${nextVal}`);
    }

    console.log('\nAll sequences resynced successfully.');
  } catch (err) {
    console.error('\n[ERROR]', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

fixSequences();
