# Vanz Marketplace — Report Summary

---

## 👤 Kittiphat (ID: 67070503459)

### R1 · Delivered Orders *(Simple)*
List all orders with status `delivered` filtered by date range.

| Order ID | Date | Customer Name | Store Name | Total |
|----------|------|---------------|------------|-------|
| 4 | 2025-12-27 | Danai Wongchai | Basil & Rice | 135.59 |
| 17 | 2025-12-24 | Thanaporn Chantara | Golden Temple Cafe | 1899.42 |

---

### R2 · Order Receipt *(Simple)*
Print a receipt for a specific order by Order ID.

| Order Code | Date & Time | Customer | Store | Product | Qty | Unit Price | Extended Price |
|------------|-------------|----------|-------|---------|-----|------------|----------------|
| ORD-000014 | 2025-07-19 | Danai Wongchai | Gai Yang Station | Moo Ping | 1 | 309.34 | 238.5 |
| ORD-000014 | 2025-07-19 | Danai Wongchai | Gai Yang Station | Mango Sticky Rice | 4 | 307.17 | 773.68 |

---

### R3 · Top Selling Products *(Analysis)*
Top N best-selling products by total quantity sold, filtered by Store and date range.

| Ranking | Store Name | Product Name | Store Category | Quantity | Revenue |
|---------|------------|--------------|----------------|----------|---------|
| 1 | Tuk Tuk Treats | Pork Belly Rice | Fusion | 5 | 1646.5 |
| 2 | Siam Spice House | Green Curry | Seafood | 5 | 1550.4 |
| 3 | Green Curry Express | Moo Ping | Thai Food | 5 | 1490.3 |

---

## 👤 Sorawit (ID: 67070503442)

### R1 · Store Products *(Simple)*
Show all products from a specific store filtered by name, price, and status.

| Store Name | Product Name | Unit Price | Status |
|------------|--------------|------------|--------|
| Larb Lab | Tom Yum Goong | 297.94 | unavailable |
| Larb Lab | Papaya Salad | 142.06 | discontinued |
| Larb Lab | Moo Ping | 389.34 | available |

---

### R2 · Favorite Stores *(Simple)*
List all stores marked as favorite by customers.

| Customer Name | Store Name |
|---------------|------------|
| Naphat Srisuk | Night Market Bites |

---

### R3 · Top Deliverers *(Analysis)*
Top N deliverers with the most deliveries in a given date range.

| Deliverer ID | Deliverer Name | Total Deliveries | Total Income |
|--------------|----------------|-----------------|--------------|
| 2 | Naphat Srisuk | 3 | 150 |
| 12 | Sumalee Chantara | 3 | 150 |
| 8 | Siriporn Chaiyasit | 2 | 100 |

---

## 👤 Piti (ID: 67070503467)

### R1 · Unapproved Vouchers *(Simple)*
List expense vouchers excluding `approved` and `rejected` statuses, filtered by date and amount.

| Voucher Date | Total Amount | Status |
|--------------|--------------|--------|
| 2025-07-08 | 115.92 | draft |
| 2025-07-23 | 498.47 | draft |
| 2025-08-03 | 779.15 | paid |

---

### R2 · Deliverer Ranking *(Simple)*
Rank deliverers sorted by their average rating.

| Deliverer Name | Vehicle Type | Rating |
|----------------|--------------|--------|
| Kittipong Rattanakul | Scooter | 4.9 |
| Pimchanok Punyapat | Van | 4.9 |
| Somchai Saetang | Scooter | 4.8 |

---

### R3 · Expense Summary *(Analysis)*
Aggregate expense vouchers using COUNT, SUM, and AVG over a date range.

| Total Vouchers (COUNT) | Total Value (SUM) | Average Value (AVG) |
|------------------------|-------------------|---------------------|
| 30 | ฿19,391.26 | ฿646.38 |

---

## 👤 Panjapong (ID: 67070503423)

### R1 · Deliverer History *(Simple)*
List delivery history for a specific deliverer filtered by date range.

| Delivery ID | Order Code | Store Name | Customer | Type | Pickup Time | Delivery Time | Fee | Order Total |
|-------------|------------|------------|----------|------|-------------|---------------|-----|-------------|
| 21 | ORD-000021 | Lemongrass Lounge | Apinya Wongchai | Scheduled | 2025-10-02 13:24 | 2025-10-02 14:51 | 24.97 | 363.56 |
| 20 | ORD-000020 | Moo Ping Express | Kanya Chaiyasit | Standard | 2025-08-10 08:09 | 2025-08-10 09:20 | 19.37 | 1295.79 |

---

### R2 · Category Products *(Simple)*
List all products in a specific category within a store.

| Product ID | Product Name | Unit Price | Status | Store Name | Category |
|------------|--------------|------------|--------|------------|----------|
| 25 | Banana Roti | 80.85 | discontinued | Larb Lab | Cafe |
| 7 | Papaya Salad | 142.06 | discontinued | Larb Lab | Cafe |
| 17 | Moo Ping | 309.34 | available | Larb Lab | Cafe |

---

### R3 · Promotion Performance *(Analysis)*
Measure which campaigns generated the most revenue and unique products sold, filtered by Store and date range.

| Promotion | Code | Discount Type | Start | End | Orders | Gross Revenue | Discount | Net Revenue | Unique Products | Total Units |
|-----------|------|---------------|-------|-----|--------|---------------|----------|-------------|-----------------|-------------|
| Promo 19 | PROMO-0019 | fixed_amount | 2025-07-28 | 2025-09-16 | 1 | 1449.25 | 188.5 | 1260.75 | 1 | 5 |