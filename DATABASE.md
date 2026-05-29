# DATABASE.md — Vanz Marketplace Delivery Platform

> Version 1.1 · Schema documented 28 May 2026  
> Project: Marketplace Delivery Platform Management System  
> Team: Panjapong Poobancheun, Sorawit Chaithong, Kittiphat Noikate, Piti Srisongkram

---

## Key Legend

| Symbol | Constraint | Meaning |
|--------|-----------|---------|
| PK | Primary Key | Uniquely identifies each row in the table |
| FK | Foreign Key | References the primary key of another table |
| AK | Alternate Key (Unique) | A unique, human-readable business key (e.g. code fields) |

---

## Database Infrastructure

- **DBMS:** PostgreSQL
- **Schema:** `public`
- **ID Strategy:** Auto-increment serial (`int8`) for all primary keys
- **Timestamps:** `datetime` / `timestamps` columns default to `NOW()`
- **Enums:** Used for status fields, types, and categories to enforce data integrity at the DB level
- **Computed Fields:** Calculated by the frontend and validated by the API at write time (e.g. `total_price`, `extend_price`, `total_amount`)
- **Snapshot Pattern:** Address and price fields are copied at transaction time to prevent historical data drift
- **Test Data:** ~30 realistic, relationally consistent records per table

---

## Schema Overview

The schema is organized into six functional groups:

1. Identity & Location
2. Roles
3. Merchant & Products
4. Transactional
5. Logistics & Finance
6. Monitoring & Mid-Processing

---

## 1. Identity & Location

### 1.1 `Address`
Stores physical location details. Used by `Customer` (default delivery address) and `Store` (physical location).

| Key | Column | Data Type | Not Null | Default | Description |
|-----|--------|-----------|----------|---------|-------------|
| PK | id | serial & int8 | YES | — | Auto-increment primary key |
| | address_name | text | YES | — | Label for this address (e.g. Home, Office) |
| | address_type | text | YES | — | Type classification of address |
| | address_line_1 | text | YES | — | First line of street address |
| | address_line_2 | text | NO | NULL | Second line (optional) |
| | city | text | YES | — | City name |
| | province | text | NO | NULL | Province or state |
| | country_code | varchar(2) | YES | — | ISO 3166-1 alpha-2 (e.g. TH) |
| | latitude | numeric | NO | NULL | Geographic latitude coordinate |
| | longitude | numeric | NO | NULL | Geographic longitude coordinate |

**Example Records:**

| id | address_name | address_type | address_line_1 | address_line_2 | city | province | country_code | latitude | longitude |
|----|-------------|-------------|---------------|---------------|------|----------|-------------|---------|---------|
| 1 | Address 1 | store | 225 Silom Rd | Floor 3 | Bangkok | Nonthaburi | TH | 13.652152 | 100.399795 |
| 2 | Address 2 | warehouse | 611 Rama IV Rd | NULL | Chonburi | Khon Kaen | TH | 13.765034 | 100.643124 |
| 3 | Address 3 | home | 697 Thonglor Rd | NULL | Udon Thani | Chiang Mai | TH | 13.836880 | 100.453853 |

---

### 1.2 `Profile`
Stores core personal information shared between `Customer` and `Deliverer` roles.

| Key | Column | Data Type | Not Null | Default | Description |
|-----|--------|-----------|----------|---------|-------------|
| PK | id | serial & int8 | YES | — | Auto-increment primary key |
| | full_name | text | YES | — | Full name of the person |
| | phone | text | YES | — | Contact phone number |
| | email | text | YES | — | Contact email address |
| | created_at | datetime | YES | NOW() | Record creation timestamp |

**Example Records:**

| id | full_name | phone | email | created_at |
|----|----------|-------|-------|-----------|
| 1 | Somchai Saetang | +66824776180 | somchai.saetang@email.com | 2025-11-10 00:27:53 |
| 2 | Naphat Srisuk | +66811834450 | naphat.srisuk@email.com | 2025-06-01 00:21:49 |
| 3 | Kanya Chaiyasit | +66971023819 | kanya.chaiyasit@email.com | 2025-08-07 00:10:47 |

---

## 2. Roles

### 2.1 `Customer`
Represents a registered customer. Linked to a `Profile` and a default `Address`.

| Key | Column | Data Type | Not Null | Default | Description |
|-----|--------|-----------|----------|---------|-------------|
| PK | id | serial & int8 | YES | — | Auto-increment primary key |
| FK | profile_id | int8 | YES | — | References Profile.id |
| AK | code | text | YES | — | Unique business code (e.g. CUST-0001) |
| FK | address_id | int8 | YES | — | Default delivery address → Address.id |
| | membership_level | enum | YES | — | STANDARD / GOLD / PLATINUM |
| | total_spent | numeric | YES | 0 | Cumulative spend by this customer |
| | created_at | datetime | YES | NOW() | Record creation timestamp |

**Example Records:**

| id | profile_id | code | address_id | membership_level | total_spent | created_at |
|----|-----------|------|-----------|-----------------|------------|-----------|
| 1 | 1 | CUST-0001 | 22 | Bronze | 36127.84 | 2025-08-16 00:32:19 |
| 2 | 2 | CUST-0002 | 22 | Platinum | 16646.05 | 2025-11-26 00:18:35 |
| 3 | 3 | CUST-0003 | 5 | Silver | 21312.09 | 2025-09-06 00:43:47 |

---

### 2.2 `Deliverer`
Represents a registered delivery person. Linked to a `Profile`. Tracks vehicle info and real-time availability.

| Key | Column | Data Type | Not Null | Default | Description |
|-----|--------|-----------|----------|---------|-------------|
| PK | id | serial & int8 | YES | — | Auto-increment primary key |
| FK | profile_id | int8 | YES | — | References Profile.id |
| AK | code | text | YES | — | Unique business code (e.g. DLV-0001) |
| | vehicle_type | text | YES | — | MOTORCYCLE / CAR / BICYCLE / SCOOTER / VAN / TRUCK |
| | license_plate | text | YES | — | Vehicle license plate number |
| | current_status | enum | YES | — | AVAILABLE / BUSY / OFFLINE |
| | rating | numeric | NO | NULL | Average customer rating (0.0–5.0) |
| | created_at | datetime | YES | NOW() | Record creation timestamp |

**Example Records:**

| id | profile_id | code | vehicle_type | license_plate | current_status | rating | created_at |
|----|-----------|------|------------|--------------|---------------|--------|-----------|
| 1 | 1 | DLV-0001 | Scooter | ขก 5506 | available | 4.8 | 2025-07-17 00:03:16 |
| 2 | 2 | DLV-0002 | Scooter | งง 3286 | busy | 3.8 | 2025-08-23 00:21:48 |
| 3 | 3 | DLV-0003 | Scooter | ขข 7912 | busy | 4.6 | 2025-09-16 00:16:53 |

---

## 3. Merchant & Products

### 3.1 `Store`
Represents a merchant store with a physical address and product catalogue.

| Key | Column | Data Type | Not Null | Default | Description |
|-----|--------|-----------|----------|---------|-------------|
| PK | id | serial & int8 | YES | — | Auto-increment primary key |
| AK | name | text | YES | — | Store display name — unique |
| FK | address_id | int8 | YES | — | Physical store location → Address.id |
| AK | code | text | YES | — | Unique business code (e.g. STR-0001) |
| | category | text | YES | — | RESTAURANT / GROCERY / CAFE / etc. |
| | rating | numeric | NO | NULL | Average customer rating (0.0–5.0) |
| | status | enum | YES | — | ACTIVE / INACTIVE / SUSPENDED |
| | updated_at | timestamps | YES | NOW() | Last update timestamp |

**Example Records:**

| id | name | code | address_id | category | rating | status | updated_at |
|----|------|------|-----------|---------|--------|--------|-----------|
| 1 | Som Tam Paradise | STR-0001 | 9 | Healthy | 5.0 | suspended | 2025-10-31 00:18:06 |
| 2 | Pad Thai House | STR-0002 | 27 | Beverages | 3.6 | inactive | 2025-07-16 00:19:00 |
| 3 | Mango Sticky Rice Bar | STR-0003 | 23 | Fusion | 3.3 | active | 2025-06-14 00:35:18 |

---

### 3.2 `Store_Products`
Product catalogue for a store. Prices and availability managed at the product level.

| Key | Column | Data Type | Not Null | Default | Description |
|-----|--------|-----------|----------|---------|-------------|
| PK | id | int8 | YES | — | Auto-increment primary key |
| FK | store_id | int8 | YES | — | Owning store → Store.id |
| | name | text | YES | — | Product name |
| | unit_price | numeric | YES | — | Selling price per unit |
| | status | enum | YES | — | available / out_of_stock / discontinued / unavailable |
| | updated_at | timestamps | YES | NOW() | Last update timestamp |

**Example Records:**

| id | store_id | name | unit_price | status | updated_at |
|----|---------|------|-----------|--------|-----------|
| 1 | 1 | Pad Thai | 208.96 | available | 2025-07-28 00:53:58 |
| 2 | 4 | Som Tam | 180.36 | available | 2025-11-13 00:53:09 |
| 3 | 16 | Green Curry | 328.79 | unavailable | 2025-10-09 00:45:17 |

---

### 3.3 `Promotion`
Header record for a promotional campaign belonging to a store.

| Key | Column | Data Type | Not Null | Default | Description |
|-----|--------|-----------|----------|---------|-------------|
| PK | id | int8 | YES | — | Auto-increment primary key |
| FK | store_id | int8 | YES | — | Owning store → Store.id |
| | name | text | YES | — | Promotion name |
| AK | code | text | YES | — | Unique business code (e.g. PROMO-0001) |
| | start_date | date | YES | — | Date the promotion becomes active |
| | end_date | date | YES | — | Date the promotion expires (inclusive) |
| | discount_type | enum | YES | — | PERCENTAGE / FIXED_AMOUNT |

**Example Records:**

| id | store_id | name | code | start_date | end_date | discount_type |
|----|---------|------|------|-----------|---------|--------------|
| 1 | 9 | Promo 1 | PROMO-0001 | 2025-09-17 | 2025-11-07 | fixed_amount |
| 2 | 13 | Promo 2 | PROMO-0002 | 2025-08-17 | 2025-09-05 | fixed_amount |
| 3 | 13 | Promo 3 | PROMO-0003 | 2025-06-28 | 2025-07-20 | fixed_amount |

---

### 3.4 `Promotion_Items`
Line items of a promotion — each row binds a product to a discount value.

| Key | Column | Data Type | Not Null | Default | Description |
|-----|--------|-----------|----------|---------|-------------|
| PK | id | int8 | YES | — | Auto-increment primary key |
| FK | promotion_id | int8 | YES | — | Parent promotion → Promotion.id |
| FK | product_id | int8 | YES | — | Discounted product → Store_Products.id |
| | discount_value | numeric | YES | — | Discount amount or percentage applied |

**Example Records:**

| id | promotion_id | product_id | discount_value |
|----|-------------|-----------|---------------|
| 1 | 22 | 24 | 36.34 |
| 2 | 19 | 24 | 37.70 |
| 3 | 21 | 4 | 42.52 |

---

### 3.5 `Favorite_Store`
Many-to-many join table between `Customer` and `Store`.

| Key | Column | Data Type | Not Null | Description |
|-----|--------|-----------|----------|-------------|
| PK | id | int8 | YES | Auto-increment primary key |
| FK | customer_id | int8 | YES | FK → Customer.id |
| FK | store_id | int8 | YES | FK → Store.id |

**Example Records:**

| id | customer_id | store_id |
|----|-----------|---------|
| 1 | 2 | 10 |
| 2 | 2 | 19 |
| 3 | 3 | 3 |

---

### 3.6 `Review`
Customer review submitted after an order. `target` distinguishes store vs deliverer reviews.

| Key | Column | Data Type | Not Null | Default | Description |
|-----|--------|-----------|----------|---------|-------------|
| PK | id | int8 | YES | — | Auto-increment primary key |
| FK | order_id | int8 | YES | — | Reviewed order → Order.id |
| FK | customer_id | int8 | YES | — | Reviewing customer → Customer.id |
| | rating | numeric | YES | — | Rating score (1.0–5.0) |
| | comment | text | NO | NULL | Optional text comment |
| | target | enum | YES | — | STORE / DELIVERER |
| | created_at | timestamps | YES | NOW() | Record creation timestamp |

**Example Records:**

| id | order_id | customer_id | rating | comment | target | created_at |
|----|---------|-----------|--------|---------|--------|-----------|
| 1 | 5 | 2 | 5.0 | Great food, very fresh! | STORE | 2025-09-15 14:22:00 |
| 2 | 5 | 2 | 4.5 | Delivery was fast and polite. | DELIVERER | 2025-09-15 14:25:00 |
| 3 | 12 | 7 | 3.0 | Food was okay, packaging could be better. | STORE | 2025-10-02 18:47:00 |

---

## 4. Transactional

### 4.1 `Order`
Header record for a customer order placed at a specific store.

| Key | Column | Data Type | Not Null | Default | Description |
|-----|--------|-----------|----------|---------|-------------|
| PK | id | int8 | YES | — | Auto-increment primary key |
| FK | customer_id | int8 | YES | — | Placing customer → Customer.id |
| FK | store_id | int8 | YES | — | Target store → Store.id |
| AK | code | text | YES | — | Unique order code (e.g. ORD-2026-000123) |
| | total_price | numeric | YES | — | Total order amount — computed at order time |
| | address_snapshot | text | YES | — | Delivery address captured at moment of ordering |
| | status | text | YES | — | PENDING / CONFIRMED / PREPARING / PICKED_UP / DELIVERING / DELIVERED / CANCELLED |
| | updated_at | timestamps | YES | NOW() | Last update timestamp |

**Example Records:**

| id | customer_id | store_id | code | total_price | address_snapshot | status | updated_at |
|----|-----------|---------|------|------------|-----------------|--------|-----------|
| 1 | 4 | 19 | ORD-000001 | 1054.23 | 70 Charoennakorn Rd, Phuket, Nonthaburi | preparing | 2025-12-16 00:30:14 |
| 2 | 4 | 12 | ORD-000002 | 1703.12 | 627 Ekkamai Rd, Udon Thani, Chiang Mai | delivering | 2025-07-30 00:48:17 |
| 3 | 8 | 26 | ORD-000003 | 903.90 | 925 Sukhumvit Rd, Bangkok, Nakhon Ratchasima | pending | 2025-12-03 00:59:42 |

---

### 4.2 `Order_Items`
Line items of an order. `unit_price` and `extend_price` are snapshotted at order time.

| Key | Column | Data Type | Not Null | Default | Description |
|-----|--------|-----------|----------|---------|-------------|
| PK | id | int8 | YES | — | Auto-increment primary key |
| FK | order_id | int8 | YES | — | Parent order → Order.id |
| FK | product_id | int8 | YES | — | Ordered product → Store_Products.id |
| | quantity | numeric | YES | — | Number of units ordered |
| | unit_price | text | YES | — | Price per unit captured at order time |
| | extend_price | numeric | YES | — | quantity × unit_price — calculated at order time |
| | updated_at | timestamps | YES | NOW() | Last update timestamp |

**Example Records:**

| id | order_id | product_id | quantity | unit_price | extend_price | updated_at |
|----|---------|-----------|---------|-----------|-------------|-----------|
| 1 | 23 | 15 | 2 | 47.33 | 94.66 | 2025-10-21 00:33:33 |
| 2 | 12 | 30 | 5 | 85.01 | 425.05 | 2025-09-11 00:24:26 |
| 3 | 2 | 26 | 3 | 248.85 | 746.55 | 2025-12-09 00:41:21 |

---

## 5. Logistics & Finance

### 5.1 `Delivery`
Tracks the physical delivery of a single order — assigned deliverer, timing, and fee.

| Key | Column | Data Type | Not Null | Default | Description |
|-----|--------|-----------|----------|---------|-------------|
| PK | id | int8 | YES | — | Auto-increment primary key |
| FK | order_id | int8 | YES | — | Fulfilled order → Order.id |
| FK | deliverer_id | int8 | YES | — | Assigned deliverer → Deliverer.id |
| | delivery_type | enum | YES | — | STANDARD / HURRY / EXPRESS / SCHEDULED |
| | pickup_time | timestamps | NO | NULL | Timestamp when deliverer picked up the order |
| | delivery_time | timestamps | NO | NULL | Timestamp when order was delivered |
| | delivery_fee | numeric | YES | — | Fee charged for this delivery |

**Example Records:**

| id | order_id | deliverer_id | delivery_type | pickup_time | delivery_time | delivery_fee |
|----|---------|------------|--------------|------------|--------------|-------------|
| 1 | 1 | 21 | Scheduled | 2025-11-05 17:34:00 | 2025-11-05 17:51:00 | 52.38 |
| 2 | 2 | 20 | Express | 2025-08-06 12:27:00 | 2025-08-06 12:42:00 | 30.64 |
| 3 | 3 | 17 | Express | 2025-10-15 10:42:00 | 2025-10-15 11:07:00 | 19.40 |

---

### 5.2 `Expense_Voucher`
Header for a deliverer expense claim associated with a delivery.

| Key | Column | Data Type | Not Null | Default | Description |
|-----|--------|-----------|----------|---------|-------------|
| PK | id | int8 | YES | — | Auto-increment primary key |
| FK | delivery_id | int8 | YES | — | Associated delivery → Delivery.id |
| AK | code | text | YES | — | Unique business code (e.g. EXP-2026-000789) |
| | voucher_date | date | YES | — | Date the expenses were incurred |
| | status | enum | YES | — | DRAFT / SUBMITTED / APPROVED / REJECTED / PAID |
| | total_amount | numeric | YES | — | Sum of all expense item amounts — computed |
| | updated_at | timestamps | YES | NOW() | Last update timestamp |

**Example Records:**

| id | delivery_id | code | voucher_date | status | total_amount | updated_at |
|----|-----------|------|------------|--------|-------------|-----------|
| 1 | 18 | EXP-000001 | 2025-11-24 | approved | 727.74 | 2025-11-19 00:08:39 |
| 2 | 29 | EXP-000002 | 2025-07-23 | draft | 498.47 | 2025-10-31 00:33:26 |
| 3 | 25 | EXP-000003 | 2025-10-13 | rejected | 156.94 | 2025-09-20 00:41:04 |

---

### 5.3 `Expense_Voucher_Items`
Itemised expense lines within a voucher (fuel, maintenance, toll, etc.).

| Key | Column | Data Type | Not Null | Default | Description |
|-----|--------|-----------|----------|---------|-------------|
| PK | id | int8 | YES | — | Auto-increment primary key |
| FK | expense_voucher_id | int8 | YES | — | Parent voucher → Expense_Voucher.id |
| | expense_type | enum | YES | — | FUEL / MAINTENANCE / TOLL / OTHER |
| | description | text | YES | — | Free-text description of the expense |
| | amount | numeric | YES | — | Expense amount (must be > 0) |
| | receipt_reference_code | text | NO | NULL | Optional external receipt reference code |

**Example Records:**

| id | expense_voucher_id | expense_type | description | amount | receipt_reference_code |
|----|------------------|------------|------------|--------|----------------------|
| 1 | 5 | Phone Data | Expense for delivery operation #30 | 314.27 | RCP-270395 |
| 2 | 13 | Insurance | Expense for delivery operation #19 | 181.46 | RCP-968524 |
| 3 | 17 | Bag Replacement | Expense for delivery operation #23 | 290.20 | RCP-597960 |

---

### 5.4 `Payment`
Header for a periodic payment to a deliverer, covering one or more completed deliveries.

| Key | Column | Data Type | Not Null | Default | Description |
|-----|--------|-----------|----------|---------|-------------|
| PK | id | int8 | YES | — | Auto-increment primary key |
| FK | delivery_id | int8 | YES | — | Associated delivery → Delivery.id |
| AK | code | text | YES | — | Unique business code (e.g. PAY-2026-000456) |
| | payment_period_start | datetime | YES | — | Start of the payment period |
| | payment_period_end | datetime | YES | — | End of the payment period |
| | total_payment | numeric | YES | — | Total payment amount for the period |
| | status | enum | YES | — | PENDING / PAID / CANCELLED / FAILED / PROCESSING / COMPLETED |
| | payment_datetime | timestamps | NO | NULL | Actual payment processing timestamp |

**Example Records:**

| id | delivery_id | code | payment_period_start | payment_period_end | total_payment | status | payment_datetime |
|----|-----------|------|--------------------|--------------------|--------------|--------|-----------------|
| 1 | 18 | PAY-000001 | 2025-07-01 | 2025-07-07 | 3745.70 | pending | 2025-07-12 11:00:00 |
| 2 | 29 | PAY-000002 | 2025-07-08 | 2025-07-14 | 4220.50 | pending | 2025-07-16 14:00:00 |
| 3 | 6 | PAY-000003 | 2025-07-15 | 2025-07-21 | 4695.72 | completed | 2025-07-25 15:00:00 |

---

### 5.5 `Payment_Items`
Breakdown of a payment by order — includes delivery fee, bonus, and any adjustment.

| Key | Column | Data Type | Not Null | Default | Description |
|-----|--------|-----------|----------|---------|-------------|
| PK | id | int8 | YES | — | Auto-increment primary key |
| FK | payment_id | int8 | YES | — | Parent payment → Payment.id |
| FK | order_id | int8 | YES | — | Associated order → Order.id |
| | delivery_fee | numeric | YES | — | Delivery fee component for this order |
| | bonus | numeric | YES | 0 | Bonus amount awarded for this order |
| | adjustment_amount | numeric | YES | 0 | Manual adjustment (positive = addition, negative = deduction) |

**Example Records:**

| id | payment_id | order_id | delivery_fee | bonus | adjustment_amount |
|----|-----------|---------|-------------|-------|-----------------|
| 1 | 18 | 5 | 39.42 | 34.14 | 9.71 |
| 2 | 18 | 13 | 57.48 | 17.39 | -19.29 |
| 3 | 1 | 25 | 49.37 | 36.39 | -16.64 |

---

## 6. Monitoring & Mid-Processing

### 6.1 `Dispatch_Assignment`
Records each attempt to offer an order to a deliverer. Multiple rows may exist per order if a deliverer rejects.

| Key | Column | Data Type | Not Null | Default | Description |
|-----|--------|-----------|----------|---------|-------------|
| PK | id | int8 | YES | — | Auto-increment primary key |
| FK | order_id | int8 | YES | — | Order being dispatched → Order.id |
| FK | deliverer_id | int8 | YES | — | Deliverer being offered the order → Deliverer.id |
| | status | enum | YES | — | PENDING / ACCEPTED / REJECTED / EXPIRED |
| | assigned_at | timestamps | YES | NOW() | Timestamp when assignment was created |
| | responded_at | timestamps | NO | NULL | Timestamp when deliverer responded |

**Example Records:**

| id | order_id | deliverer_id | status | assigned_at | responded_at |
|----|---------|------------|--------|------------|-------------|
| 1 | 11 | 14 | pending | 2025-09-20 22:13:00 | 2025-09-20 22:16:19 |
| 2 | 1 | 9 | expired | 2025-11-22 21:14:00 | 2025-11-22 21:15:24 |
| 3 | 8 | 13 | accepted | 2025-09-14 10:12:00 | 2025-09-14 10:14:58 |

---

### 6.2 `Deliverer_Location_Log`
GPS log for active deliverers. Used for real-time tracking and audit.

| Key | Column | Data Type | Not Null | Default | Description |
|-----|--------|-----------|----------|---------|-------------|
| PK | id | int8 | YES | — | Auto-increment primary key |
| FK | deliverer_id | int8 | YES | — | Tracked deliverer → Deliverer.id |
| | latitude | numeric | YES | — | GPS latitude at capture time |
| | longitude | numeric | YES | — | GPS longitude at capture time |
| | captured_at | timestamps | YES | NOW() | Timestamp of the location capture |

**Example Records:**

| id | deliverer_id | latitude | longitude | captured_at |
|----|------------|---------|---------|------------|
| 1 | 3 | 13.663489 | 100.453800 | 2025-12-18 20:09:47 |
| 2 | 13 | 13.682971 | 100.344420 | 2025-06-02 09:28:23 |
| 3 | 25 | 13.664207 | 100.354803 | 2025-07-18 13:28:35 |

---

## Entity Relationship Summary

```
Profile ──< Customer >── Favorite_Store >── Store ──< Store_Products
                │                                          │
                │                              Promotion ──< Promotion_Items
                │
                └──< Order ──< Order_Items
                        │
                     Delivery ──< Dispatch_Assignment
                        │
                        ├──< Expense_Voucher ──< Expense_Voucher_Items
                        │
                        └──< Payment ──< Payment_Items

Profile ──< Deliverer ──< Delivery
                   │
           Deliverer_Location_Log

Customer ──< Review
Order ──< Review
```

---

## Business Code Formats

| Entity | Format | Example |
|--------|--------|---------|
| Customer | CUST-NNNN | CUST-0001 |
| Deliverer | DLV-NNNN | DLV-0001 |
| Store | STR-NNNN | STR-0001 |
| Order | ORD-YYYY-NNNNNN | ORD-2026-000123 |
| Payment | PAY-YYYY-NNNNNN | PAY-2026-000456 |
| Expense Voucher | EXP-YYYY-NNNNNN | EXP-2026-000789 |
| Promotion | PROMO-NNNN | PROMO-0001 |

---

## Key Design Decisions

**Snapshot pattern** — `Order.address_snapshot` and `Order_Items.unit_price` are copied at write time so historical records are unaffected by future master data changes.

**Computed fields stored** — `total_price`, `extend_price`, `total_amount`, and `total_payment` are calculated by the frontend, validated by the API, and persisted.

**Single Profile, multiple roles** — One `Profile` record can be linked to both a `Customer` and a `Deliverer` row, allowing a person to operate in both capacities without duplicate personal data.

**GPS log corrections supported** — `Deliverer_Location_Log` has create/update/delete API operations for correction workflows.

**Dispatch retry support** — `Dispatch_Assignment` allows multiple rows per order, supporting the workflow where a deliverer rejects or an assignment expires and the order is re-offered.