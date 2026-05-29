# Vanz — Feature Status

> Legend: **DONE** = working end-to-end (live data + real API mutations) · **UI-ONLY** = page renders but mutations are not wired to backend (toast only) · **PENDING** = not yet implemented or broken

> Updated: 29 May 2026

---

## Dashboard

| Feature | Status | Notes |
|---------|--------|-------|
| Summary stat cards | **DONE** | Live from API — Orders Today, Active Deliverers, Revenue Today, Pending Vouchers |
| Dispatch queue panel | **DONE** | Shows CONFIRMED / PREPARING orders from live API |
| Recent expense vouchers list | **DONE** | Last 5 vouchers from live API with deliverer name resolution |
| Quick-navigate buttons | **DONE** | Navigate to Dispatch / Expense List |

---

## Master Data

> All list pages use per-view reactive loading (`useEffect([tick])`) — independent fetches, no shared startup snapshot. Add / Edit / Delete all call real API endpoints and refresh the list on completion.  
> Add forms display a **predicted next code** via `codeGen.nextCode()` in a read-only field. The real code is generated server-side on insert.

| Page | View Data | Add | Edit | Delete | Overall |
|------|-----------|-----|------|--------|---------|
| Customer List | ✅ Live — GET /customers + /profiles + /addresses | ✅ Real API (POST profiles → addresses → customers) + code preview | ✅ Real API (PUT profiles + addresses + customers in parallel) | ✅ Real API (DELETE /customers/{code}) | **DONE** |
| Deliverer List | ✅ Live — GET /deliverers + /profiles | ✅ Real API (POST profiles → deliverers) + code preview | ✅ Real API (PUT profiles + deliverers in parallel) | ✅ Real API (DELETE /deliverers/{code}) | **DONE** |
| Store List | ✅ Live — GET /stores + /addresses | ✅ Real API (POST addresses → stores) + code preview | ✅ Real API (PUT addresses + stores in parallel) | ✅ Real API (DELETE /stores/{code}) | **DONE** |
| Product List | ✅ Live — GET /store-products + /stores | ✅ Real API (POST /store-products); store selector via live LoV | ✅ Real API (PUT /store-products/{id}); store read-only on edit | ✅ Real API (DELETE /store-products/{id}) | **DONE** |
| Promotion List | ✅ Live | → Promotion Form | — | ✅ Real API (DELETE) | **DONE** |
| Promotion Form (Create) | ✅ Live LoV (stores + products filtered by store) | ✅ Real API | — | — | **DONE** |

---

## Operations

> All views load data via per-view `useEffect` — no shared mock snapshot.

| Page | View Data | Action | Status |
|------|-----------|--------|--------|
| Customer Order List | ✅ Live — GET /orders + /customers + /profiles + /stores | Search + status filter | **DONE** |
| Customer Order Form (Create) | ✅ Live LoV — customers, stores, products from API; products filtered by selected store | POST /orders | **DONE** |
| Deliverer Dispatch | ✅ Live — CONFIRMED/PREPARING orders queue + all deliverers from API | POST /dispatch-assignments | **DONE** |

---

## Finance

> All views load data via per-view `useEffect` — no shared mock snapshot.

| Page | View Data | Action | Status |
|------|-----------|--------|--------|
| Expense Voucher List | ✅ Live — GET /expense-vouchers + joins via /deliveries /deliverers /profiles | Search + status filter | **DONE** |
| Expense Voucher Form (Create) | ✅ Live LoV — deliverers from API; links to latest delivery for the deliverer | POST /expense-vouchers (delivery_id integer) | **DONE** |
| Deliverer Payment List | ✅ Live — GET /payments + joins via /deliveries /deliverers /profiles | Search + status filter | **DONE** |
| Deliverer Payment Form (Create) | ✅ Live LoV — deliverers + "Load Deliveries" fetches GET /deliveries per deliverer | POST /payments (delivery_id integer) | **DONE** |
| Revenue Per Trip | ✅ Live — GET /deliveries → monthly avg fee computed client-side | View-only table + refresh | **DONE** |

---

## Reports — Simple

| Report | View Data | Filter | Status |
|--------|-----------|--------|--------|
| Delivered Orders | ✅ Live — GET /orders + joins deliveries/deliverers/profiles | Date From/To + Generate button | **DONE** |
| Order Receipt | ✅ Live — LoV from DELIVERED orders, loads full order + items + delivery on demand | Select order + Load Receipt | **DONE** |
| Store Products Catalog | ✅ Live — GET /store-products + /stores | Store LoV, product name, status | **DONE** |
| Favorite Stores | ✅ Live — GET /favorite-stores + joins /customers /profiles /stores | Customer LoV, Store LoV | **DONE** |
| Unapproved Vouchers | ✅ Live — GET /expense-vouchers, filters DRAFT/SUBMITTED client-side | Date, min amount, status | **DONE** |
| Deliverer Ranking | ✅ Live — GET /deliverers + /profiles, sorted by rating | Deliverer LoV, vehicle type, min rating | **DONE** |
| Deliverer History | ✅ Live — GET /deliveries by deliverer_code + joins orders/stores/customers | Deliverer LoV, Date From/To, Search button | **DONE** |
| Products by Category | ✅ Live — GET /store-products + /stores, categories from store.category | Store LoV, category dropdown | **DONE** |

---

## Reports — Analytics

| Report | View Data | Status |
|--------|-----------|--------|
| Top N Products | ✅ Live — aggregated from GET /orders order_items by qty + revenue | Store LoV, Top N, Date range, Generate button | **DONE** |
| Top N Deliverers | ✅ Live — aggregated from GET /deliveries + /payments earnings | Top N, Date range, Generate button | **DONE** |
| Expense Summary Stats | ✅ Live — COUNT/SUM/AVG + status breakdown + top expense type from GET /expense-vouchers | Date range, Calculate button | **DONE** |
| Promotion Performance | ✅ Live — promotions + orders aggregated per campaign (orders in promo period per store) | Store LoV, Date range, Generate button | **DONE** |

---

## API Endpoints (Backend)

All 15 resource routes exist with full CRUD.

| Resource | GET list | POST create | PUT update | DELETE |
|----------|----------|-------------|------------|--------|
| `/addresses` | ✅ | ✅ | ✅ | ✅ |
| `/profiles` | ✅ | ✅ | ✅ | ✅ |
| `/customers` | ✅ | ✅ | ✅ | ✅ |
| `/deliverers` | ✅ | ✅ | ✅ | ✅ |
| `/stores` | ✅ | ✅ | ✅ | ✅ |
| `/store-products` | ✅ | ✅ | ✅ | ✅ |
| `/orders` | ✅ | ✅ | ✅ | ✅ |
| `/deliveries` | ✅ | ✅ | ✅ | ✅ |
| `/dispatch-assignments` | ✅ | ✅ | ✅ | ✅ |
| `/expense-vouchers` | ✅ | ✅ | ✅ | ✅ |
| `/payments` | ✅ | ✅ | ✅ | ✅ |
| `/promotions` | ✅ | ✅ | ✅ | ✅ |
| `/favorite-stores` | ✅ | ✅ | ✅ | ✅ |
| `/delivery-location-logs` | ✅ | ✅ | ✅ | ✅ |
| `/reviews` | ✅ | ✅ | ✅ | ✅ |

---

## Bug Fixes Applied

| # | Bug | Fix |
|---|-----|-----|
| 1 | `payments.service.js` validated `delivery_code` but API spec + DB require `delivery_id` (integer) | Changed to `delivery_id` validation in service + model |
| 2 | `expense-vouchers.service.js` same `delivery_code` mismatch | Changed to `delivery_id` in service + model |
| 3 | `ExpenseFormView.jsx` sent `delivery_code: String(id)` instead of `delivery_id: integer` | Fixed field name and type |
| 4 | `ExpenseFormView.jsx` had `PARKING` expense type (not in API spec; valid: FUEL/MAINTENANCE/TOLL/OTHER) | Removed PARKING |
| 5 | `DelivererPaymentView.jsx` sent `delivery_code` instead of `delivery_id` | Fixed field name; added `payment_datetime` |
| 6 | `DelivererDispatchView.jsx` filtered `status === 'PREPARED'` which doesn't exist in order status enum | Changed to `CONFIRMED` or `PREPARING` |
| 7 | `PromotionFormView.jsx` used MOCK_STORES / MOCK_PRODUCTS for LoV instead of live API | Replaced with getJson('/stores') + getJson('/store-products') |
| 8 | `CustomerListView` / `DelivererListView` / `StoreListView` / `ProductListView` used `MOCK_*` data — no live API | Rewritten with `useEffect([tick])` + parallel live API fetches + real CRUD mutations |
| 9 | `CustomerFormView` / `DelivererFormView` / `StoreFormView` showed toast only (no API call) | Rewritten to POST/PUT real endpoints; `StoreFormView` removed `phone`/`operating_hours` not in DB |
| 10 | `ProductFormView` used `MOCK_STORES` for LoV | Replaced with live store list passed from `ProductListView` (fetched once, shared) |

---

## Data Loading Strategy

All views (including Dashboard and all Reports) now use **per-view reactive loading** via `useEffect`. There is no shared boot-time mock snapshot. The `mockData.js` and `liveData.js` files are now unused by any view — they remain in the codebase but are no longer imported by any view component.

---

## Code Generator (`src/api/codeGen.js`)

Utility that computes the next business code from a list of existing codes. Used by Add forms to display a predicted code before save. The server always generates the authoritative code.

| Function | Usage |
|----------|-------|
| `nextCode(codes, prefix, padLen)` | Fixed-prefix codes: `CUST-`, `DLV-`, `STR-`, `PROMO-` |
| `nextYearCode(codes, shortPrefix, year, padLen)` | Year-scoped codes: `ORD-YYYY-`, `PAY-YYYY-`, `EXP-YYYY-` |

**Algorithm:** filter codes by prefix → extract numeric suffix → `Math.max` → `+1` → `padStart`.

---

## Known Issues / Remaining Work

| # | Item | Priority | Status |
|---|------|----------|--------|
| 1 | Expense Voucher Form links to "latest delivery" for deliverer — no explicit delivery selector | Medium | Open |
| 2 | Payment Form shows all deliveries; no filter to exclude already-paid ones | Medium | Open |
| 3 | JWT middleware only checks Bearer header format — does NOT verify signature | Medium | Open |
| 4 | API response caching with invalidation not implemented | Low | Open |
| 5 | `mockData.js` / `liveData.js` still exist in codebase but are unused — can be deleted | Low | Open |
| 6 | Customer / Store forms always use `country_code: 'TH'` — no UI selector for international addresses | Low | Open |
