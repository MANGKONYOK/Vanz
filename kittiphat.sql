-- 1. Delivered Orders (Simple Report)
-- รายงานสรุปยอดออร์เดอร์ที่จัดส่งสำเร็จแล้ว ตามช่วงเวลา
-- ใช้ Parameter :date_from และ :date_to ในการกรองผ่านโปรแกรม
SELECT 
    o.id AS order_id,
    o.order_date,
    c.name AS customer_name,
    s.name AS store_name,
    d.name AS deliverer_name,
    -- คำนวณเวลาจัดส่งจาก Timestamps (ถ้ามีฟิลด์ created_at และ delivered_at)
    EXTRACT(EPOCH FROM (o.delivered_at - o.created_at))/60 || ' mins' AS duration,
    -- คิดราคารวมของบิล (ค่าอาหาร + ค่าส่ง)
    (SELECT SUM(total_price) FROM order_items WHERE order_id = o.id) + o.delivery_fee AS total_amount
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN stores s ON o.store_id = s.id
JOIN deliverers d ON o.deliverer_id = d.id
WHERE 
    o.status = 'Delivered'
    AND o.order_date >= '2026-03-01' -- :date_from
    AND o.order_date <= '2026-03-23' -- :date_to
ORDER BY o.order_date DESC;

-- 2. Order Receipt (Simple Report)
-- ดึงข้อมูลสำหรับพิมพ์ใบเสร็จของออร์เดอร์นั้นๆ (แบ่งเป็นส่วน Header ที่บอกรายละเอียดลูกค้า และ Item ที่เป็นรายการอาหาร)
-- 2.1 ดึงส่วนหัวของใบเสร็จ (Receipt Info)
SELECT 
    o.id AS order_id,
    o.order_date AS datetime,
    c.name AS customer_name,
    s.name AS store_name,
    d.name AS deliverer_name,
    o.delivery_fee,
    (SELECT SUM(total_price) FROM order_items WHERE order_id = o.id) AS subtotal
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN stores s ON o.store_id = s.id
JOIN deliverers d ON o.deliverer_id = d.id
WHERE o.id = 'ORD-8001'; -- :order_id

-- 2.2 ดึงรายการอาหารในบิลนั้น (Receipt Items)
SELECT 
    p.name AS product_name,
    oi.quantity AS qty,
    oi.unit_price,
    oi.total_price AS total
FROM order_items oi
JOIN products p ON oi.product_id = p.id
WHERE oi.order_id = 'ORD-8001'; -- :order_id

-- 3. Top Selling Products (Analysis Report)
-- รายงานวิเคราะห์สินค้าขายดี โดยเรียงลำดับจากจำนวนชิ้นที่ขายได้
-- สามารถเลือกส่ง Store ID มาครอบได้ (บรรทัด AND s.id = ...)
SELECT 
    ROW_NUMBER() OVER(ORDER BY SUM(oi.quantity) DESC) AS rank,
    s.name AS store_name,
    p.name AS product_name,
    p.category,
    SUM(oi.quantity) AS qty_sold,
    SUM(oi.total_price) AS revenue
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN products p ON oi.product_id = p.id
JOIN stores s ON p.store_id = s.id
WHERE 
    o.status = 'Delivered'
    AND o.order_date >= '2026-03-01' -- :date_from
    AND o.order_date <= '2026-03-23' -- :date_to
    -- AND s.id = 'ST-001' -- (Optional: ถ้าเลือก Store ค่อยส่งเงื่อนไขนี้มา)
GROUP BY 
    s.name, 
    p.name, 
    p.category
ORDER BY 
    qty_sold DESC
LIMIT 10; -- :top_n (แสดงแค่ 10 อันดับแรก)

