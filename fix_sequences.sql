-- =============================================================================
-- fix_sequences.sql
-- Run this ONCE against your Vanz database to resync all identity sequences
-- with the actual data already in the tables.
--
-- Usage (from terminal):
--   psql -U <user> -d <dbname> -f fix_sequences.sql
-- =============================================================================

DO $$
DECLARE
  v bigint;
BEGIN

  -- address
  SELECT COALESCE(MAX(id), 0) + 1 INTO v FROM address;
  EXECUTE format('ALTER TABLE address ALTER COLUMN id RESTART WITH %s', v);
  RAISE NOTICE 'address → restart with %', v;

  -- customer
  SELECT COALESCE(MAX(id), 0) + 1 INTO v FROM customer;
  EXECUTE format('ALTER TABLE customer ALTER COLUMN id RESTART WITH %s', v);
  RAISE NOTICE 'customer → restart with %', v;

  -- deliverer
  SELECT COALESCE(MAX(id), 0) + 1 INTO v FROM deliverer;
  EXECUTE format('ALTER TABLE deliverer ALTER COLUMN id RESTART WITH %s', v);
  RAISE NOTICE 'deliverer → restart with %', v;

  -- deliverer_location_log
  SELECT COALESCE(MAX(id), 0) + 1 INTO v FROM deliverer_location_log;
  EXECUTE format('ALTER TABLE deliverer_location_log ALTER COLUMN id RESTART WITH %s', v);
  RAISE NOTICE 'deliverer_location_log → restart with %', v;

  -- delivery
  SELECT COALESCE(MAX(id), 0) + 1 INTO v FROM delivery;
  EXECUTE format('ALTER TABLE delivery ALTER COLUMN id RESTART WITH %s', v);
  RAISE NOTICE 'delivery → restart with %', v;

  -- dispatch_assignment
  SELECT COALESCE(MAX(id), 0) + 1 INTO v FROM dispatch_assignment;
  EXECUTE format('ALTER TABLE dispatch_assignment ALTER COLUMN id RESTART WITH %s', v);
  RAISE NOTICE 'dispatch_assignment → restart with %', v;

  -- favorite_store
  SELECT COALESCE(MAX(id), 0) + 1 INTO v FROM favorite_store;
  EXECUTE format('ALTER TABLE favorite_store ALTER COLUMN id RESTART WITH %s', v);
  RAISE NOTICE 'favorite_store → restart with %', v;

  -- "order" (reserved keyword — must be quoted)
  SELECT COALESCE(MAX(id), 0) + 1 INTO v FROM "order";
  EXECUTE format('ALTER TABLE "order" ALTER COLUMN id RESTART WITH %s', v);
  RAISE NOTICE '"order" → restart with %', v;

  -- order_items
  SELECT COALESCE(MAX(id), 0) + 1 INTO v FROM order_items;
  EXECUTE format('ALTER TABLE order_items ALTER COLUMN id RESTART WITH %s', v);
  RAISE NOTICE 'order_items → restart with %', v;

  -- payment
  SELECT COALESCE(MAX(id), 0) + 1 INTO v FROM payment;
  EXECUTE format('ALTER TABLE payment ALTER COLUMN id RESTART WITH %s', v);
  RAISE NOTICE 'payment → restart with %', v;

  -- payment_items
  SELECT COALESCE(MAX(id), 0) + 1 INTO v FROM payment_items;
  EXECUTE format('ALTER TABLE payment_items ALTER COLUMN id RESTART WITH %s', v);
  RAISE NOTICE 'payment_items → restart with %', v;

  -- profile
  SELECT COALESCE(MAX(id), 0) + 1 INTO v FROM profile;
  EXECUTE format('ALTER TABLE profile ALTER COLUMN id RESTART WITH %s', v);
  RAISE NOTICE 'profile → restart with %', v;

  -- promotion
  SELECT COALESCE(MAX(id), 0) + 1 INTO v FROM promotion;
  EXECUTE format('ALTER TABLE promotion ALTER COLUMN id RESTART WITH %s', v);
  RAISE NOTICE 'promotion → restart with %', v;

  -- store
  SELECT COALESCE(MAX(id), 0) + 1 INTO v FROM store;
  EXECUTE format('ALTER TABLE store ALTER COLUMN id RESTART WITH %s', v);
  RAISE NOTICE 'store → restart with %', v;

  -- store_products
  SELECT COALESCE(MAX(id), 0) + 1 INTO v FROM store_products;
  EXECUTE format('ALTER TABLE store_products ALTER COLUMN id RESTART WITH %s', v);
  RAISE NOTICE 'store_products → restart with %', v;

END $$;

-- Verify current sequence positions
SELECT
  'store_products' AS tbl, COALESCE(MAX(id), 0) AS max_id FROM store_products
UNION ALL SELECT 'customer',  COALESCE(MAX(id), 0) FROM customer
UNION ALL SELECT 'deliverer',  COALESCE(MAX(id), 0) FROM deliverer
UNION ALL SELECT 'store',      COALESCE(MAX(id), 0) FROM store
UNION ALL SELECT 'profile',    COALESCE(MAX(id), 0) FROM profile
UNION ALL SELECT 'address',    COALESCE(MAX(id), 0) FROM address
UNION ALL SELECT 'promotion',  COALESCE(MAX(id), 0) FROM promotion
UNION ALL SELECT '"order"',    COALESCE(MAX(id), 0) FROM "order"
ORDER BY tbl;
