# Vanz — Feature Status

> Legend: **DONE** = working end-to-end (live data + real API mutations) · **UI-ONLY** = page renders but mutations are not wired to backend (toast only) · **PENDING** = not yet implemented or broken

> Updated: 28 May 2026

---

## Dashboard

| Feature | Status | Notes |
|---------|--------|-------|
| Summary stat cards | PENDING | Numbers are hardcoded (24, 12, ฿3,480, 5) — not from API |
| Prepared orders queue | DONE | Reads live data from API |
| Recent expense vouchers list | DONE | Reads live data from API |
| Quick-navigate buttons | DONE | Navigate to Dispatch / Expense Form |

---

## Master Data

> All list pages use per-view reactive loading (`useEffect([tick])`) — independent fetches, no shared startup snapshot. Add / Edit / Delete all call real API endpoints and refresh the list on completion.

| Page | View Data | Add | Edit | Delete | Overall |
|------|-----------|-----|------|--------|---------|
| Customer List | ✅ Live | ✅ Real API | ✅ Real API | ✅ Real API | **DONE** |
| Deliverer List | ✅ Live | ✅ Real API | ✅ Real API | ✅ Real API | **DONE** |
| Store List | ✅ Live | ✅ Real API | ✅ Real API | ✅ Real API | **DONE** |
| Product List | ✅ Live | ✅ Real API | ✅ Real API | ✅ Real API | **DONE** |
| Promotion List | ✅ Live | → Promotion Form | — | — | **UI-ONLY** |
| Promotion Form (Create) | ✅ Live LOV | UI-ONLY | — | — | **UI-ONLY** |

---

## Operations

> All views load data via per-view `useEffect` — no shared mock snapshot.

| Page | View Data | Action | Status |
|------|-----------|--------|--------|
| Customer Order List | ✅ Live — GET /orders + /customers + /profiles + /stores | Search + status filter | **DONE** |
| Customer Order Form (Create) | ✅ Live LoV — customers, stores, products from API; products filtered by selected store | POST /orders | **DONE** |
| Deliverer Dispatch | ✅ Live — PREPARED orders queue + all deliverers from API | POST /dispatch-assignments | **DONE** |

---

## Finance

> All views load data via per-view `useEffect` — no shared mock snapshot.

| Page | View Data | Action | Status |
|------|-----------|--------|--------|
| Expense Voucher List | ✅ Live — GET /expense-vouchers + joins via /deliveries /deliverers /profiles | Search + status filter | **DONE** |
| Expense Voucher Form (Create) | ✅ Live LoV — deliverers from API | POST /expense-vouchers (links latest delivery) | **DONE** |
| Deliverer Payment List | ✅ Live — GET /payments + joins via /deliveries /deliverers /profiles | Search + status filter | **DONE** |
| Deliverer Payment Form (Create) | ✅ Live LoV — deliverers + "Load Deliveries" fetches GET /deliveries per deliverer | POST /payments | **DONE** |
| Revenue Per Trip | ✅ Live — GET /deliveries → monthly avg fee computed client-side | View-only table + refresh | **DONE** |

---

## Reports — Simple

| Report | View Data | Filter | Status |
|--------|-----------|--------|--------|
| Delivered Orders | ✅ Live delivered orders | — | **DONE** |
| Order Receipt | ✅ Live first delivered order items | — | **DONE** |
| Store Products Catalog | ✅ Live store-products | By store | **DONE** |
| Favorite Stores | ✅ Live favorite_store join | — | **DONE** |
| Unapproved Vouchers | ✅ Live expense vouchers (PENDING status) | — | **DONE** |
| Deliverer Ranking | ✅ Live deliveries aggregated | — | **DONE** |
| Deliverer History | ✅ Live deliveries by deliverer | LOV picker | **DONE** |
| Products by Category | ✅ Live store-products | By category | **DONE** |

---

## Reports — Analytics

| Report | View Data | Status |
|--------|-----------|--------|
| Top 10 Products | ✅ Aggregated from live order_items | **DONE** |
| Top 10 Deliverers | ✅ Aggregated from live deliveries | **DONE** |
| Expense Summary Stats | ✅ Count / Sum / Avg from live vouchers | **DONE** |
| Promotion Performance | ✅ Live promotions with item count | **DONE** |

---

## API Endpoints (Backend)

All 15 resource routes exist with full CRUD. Frontend currently uses only `GET` (list).

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

## Data Loading / Cache

| Task | Status | Notes |
|------|--------|-------|
| Centralized live-data facade | DONE | UI imports from `client/src/data/liveData.js` instead of the old mock-data path |
| Shared startup data load | DONE | Real API data is loaded once and reused across pages |
| Auto-refresh after create/update/delete | PENDING | Lists do not refresh automatically after mutations |
| Per-page API fetch separation | PENDING | Possible and recommended for maintainability and smaller data scope per page |
| Client-side cache for API responses | PENDING | Possible; recommended to use a query/cache layer or a small custom cache with TTL + invalidation |
| Cache invalidation after mutation | PENDING | Required if caching is added, otherwise stale data will remain visible |

### Recommended Direction

If we continue this work, the clean path is:

1. Separate each page to fetch only the data it needs.
2. Add a cache layer for GET requests.
3. Invalidate or refresh affected cache entries after POST/PUT/DELETE.

This is possible in the current project. The main tradeoff is implementation time versus keeping the current simple startup-load approach.

---

## Known Issues / Remaining Work

| # | Item | Priority | Status |
|---|------|----------|--------|
| 1 | Dashboard stat cards show hardcoded values (not from API) | Medium | Open |
| 2 | ~~Master list tables not auto-refreshed after save~~ | ~~Medium~~ | **Fixed** |
| 3 | ~~Master Data Add/Edit/Delete UI-only~~ | ~~High~~ | **Fixed** — all 4 master views fully wired |
| 4 | ~~Operations/Finance forms still UI-ONLY~~ | ~~High~~ | **Fixed** — all 7 ops/finance views now use live API |
| 5 | ~~Revenue Per Trip using boot-time mock data~~ | ~~Medium~~ | **Fixed** — now fetches GET /deliveries directly |
| 6 | Expense Voucher save links to "latest delivery" for deliverer — no explicit delivery selector | Medium | Open |
| 7 | Payment form: "Load Deliveries" shows all deliveries; no filter for already-paid ones | Medium | Open |
| 8 | Promotion List/Form not wired to real API | Medium | Open |
| 9 | Dashboard stat cards still hardcoded | Medium | Open |
| 10 | JWT middleware only checks Bearer header format — does NOT verify signature | Medium | Open |
| 11 | Reports still use boot-time snapshot from mockData.js (not per-view fetch) | Low | Open |
| 12 | API response caching with invalidation not implemented | Low | Open |
