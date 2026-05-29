# DESIGN.md — Vanz Frontend Architecture & UI Design

> Version 1.4 · Updated 29 May 2026  
> Tech Stack: React 18 · Vite · Tailwind CSS v4 · Lucide React

---

## 1. CSS Theme

### 1.1 Typography

| Role | Font | Class |
|------|------|-------|
| Body / UI | DM Sans (400–800) | default |
| Monospace — codes, IDs, prices | DM Mono (400–500) | `.mono` |

### 1.2 Color Palette

**Layout surfaces**

| Area | Tailwind | Role |
|------|----------|------|
| Sidebar | `bg-red-800` / `bg-red-900` | Nav background / header-footer |
| App header | `bg-slate-900` | Top bar |
| Page background | `bg-slate-100` | Behind cards |
| Card / panel | `bg-white` | Content surface |
| Table header row | `bg-slate-100` | `<thead>` |
| Input border | `border-slate-200` | Default; `border-red-400` on focus |
| Focus ring | `ring-red-100` | 2px ring on focus |

**Brand actions**

| State | Class | Used for |
|-------|-------|----------|
| Primary button / active nav | `bg-red-600` | CTA, save, submit |
| Primary hover | `bg-red-700` | Button hover |
| Active nav indicator | `border-l-[3px] border-white bg-black/30` | `.nav-active` |

**Semantic status — Badge & panels**

| Status | `color` prop | Bg / Text | Applies to |
|--------|-------------|-----------|------------|
| Success / Approved / Active | `green` | `emerald-100` / `emerald-700` | approved, paid, active, delivered |
| Warning / Pending | `amber` | `amber-100` / `amber-700` | submitted, pending, preparing |
| Danger / Rejected | `red` | `red-100` / `red-700` | rejected, cancelled |
| Info | `blue` | `blue-100` / `blue-700` | Informational |
| Default | `gray` | `slate-100` / `slate-700` | Other / unknown |

**StatCard icon colors**

| `color` prop | Icon bg / text | Typical metric |
|-------------|----------------|----------------|
| `red` | `red-50` / `red-600` | Orders |
| `blue` | `blue-50` / `blue-600` | Counts / deliverers |
| `green` | `emerald-50` / `emerald-600` | Revenue / approved |
| `amber` | `amber-50` / `amber-700` | Pending / vouchers |

### 1.3 Custom CSS (`App.css`)

| Class | Effect |
|-------|--------|
| `.mono` | DM Mono font |
| `.fade-in` | Slide-up + fade in — 0.25s; applied on every view root div |
| `.toast-in` | Slide in from right — 0.3s; applied on toast notification |
| `.nav-active` | Active sidebar item: dark bg + 3px left white border |
| `.nav-item-hover` | Hover: `bg-black/20` overlay |
| `.stat-card` | `translateY(-2px)` + shadow lift on hover |
| `.custom-scrollbar` | 5px thin scrollbar for sidebar |
| `.main-scrollbar` | 6px thin scrollbar for content area |

---

## 2. Architecture

### 2.1 Tech Stack

| Layer | Tool |
|-------|------|
| Framework | React 18 (JSX) |
| Bundler | Vite |
| Styling | Tailwind CSS v4 (`@import "tailwindcss"`) |
| Icons | Lucide React |
| HTTP client | Axios (`src/api/http.js`) — Bearer token injected via default header |
| State management | `useState` per view — no Redux / Zustand |
| Routing | State-based: `currentView` string in `App.jsx` |
| Fonts | Google Fonts CDN (DM Sans, DM Mono) |

### 2.2 Data Loading Strategy

**Per-view reactive loading** (all views — Dashboard, Master Data, Operations, Finance, Reports)  
Every view manages its own data lifecycle independently. There is no shared boot-time snapshot. `mockData.js` and `liveData.js` remain in the codebase but are no longer imported by any view component.

```
useState([]) + useEffect → getJson() → setRows()   ← initial load
refresh() (tick increment) → useEffect re-fires    ← after mutate
```

| Hook | Trigger | Effect |
|------|---------|--------|
| `useEffect([tick])` | mount + every `tick` increment | Fetches fresh data from API |
| `refresh()` | after create / update / delete | Sets `tick = tick + 1` → re-fetch |
| Loading state | between fetch start and completion | Shows "Loading…" placeholder row |

Dashboard and all Report views use `useEffect([])` (single fetch on mount, no tick/refresh cycle needed since they are read-only).

**Joins are performed client-side** (parallel fetch, then Map lookup):
- Customer list = `/customers` + `/profiles` + `/addresses` joined by `profile_id` / `address_id`
- Deliverer list = `/deliverers` + `/profiles` joined by `profile_id`
- Store list = `/stores` + `/addresses` joined by `address_id`
- Product list = `/store-products` + `/stores` joined by `store_id`
- Dashboard = `/orders` + `/deliverers` + `/expense-vouchers` + `/deliveries` + `/stores` + `/customers` + `/profiles`

**Business code preview (Add forms)** — `src/api/codeGen.js`:  
Every "Add" form (Customer, Deliverer, Store) displays a predicted next code in a read-only field. The code is computed client-side by fetching the current list and calling `nextCode(codes, prefix, padLen)`. The server always generates the *real* code from the inserted row's ID and the preview is purely informational.

| Form | Prefix | Pad | Example |
|------|--------|-----|---------|
| Customer | `CUST-` | 4 | `CUST-0007` |
| Deliverer | `DLV-` | 4 | `DLV-0003` |
| Store | `STR-` | 4 | `STR-0012` |
| Promotion | `PROMO-` | 4 | `PROMO-0005` |
| Order (year-scoped) | `ORD-YYYY-` | 6 | `ORD-2026-000042` |
| Payment (year-scoped) | `PAY-YYYY-` | 6 | `PAY-2026-000018` |
| Expense Voucher (year-scoped) | `EXP-YYYY-` | 6 | `EXP-2026-000009` |

### 2.2 Folder Structure

```
client/src/
├── App.jsx                        ← Shell layout + view router
├── App.css                        ← Custom CSS (fonts, animations, scrollbars)
├── index.css                      ← Tailwind import + body reset
├── main.jsx                       ← ReactDOM entry
├── assets/                        ← Static images
├── api/
│   ├── http.js                    ← Axios client (baseURL, Bearer token, helpers)
│   └── codeGen.js                 ← Business code generator (nextCode, nextYearCode)
├── data/
│   ├── mockData.js                ← Legacy boot-time loader (unused — no view imports it)
│   └── liveData.js                ← Re-exports from mockData (unused — compatibility layer)
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx            ← Collapsible nav (240px, bg-red-800)
│   │   └── AppHeader.jsx          ← Top bar with sidebar toggle
│   └── ui/                        ← Reusable atomic components
│       ├── index.js               ← Barrel export
│       ├── Btn.jsx
│       ├── Badge.jsx
│       ├── Card.jsx / CardHeader.jsx
│       ├── FilterBar.jsx / FilterField.jsx
│       ├── FormField.jsx
│       ├── Input.jsx / Select.jsx
│       ├── LovInput.jsx / LovModal.jsx
│       ├── PageHeader.jsx
│       ├── Pagination.jsx
│       ├── RankBadge.jsx
│       ├── StatCard.jsx
│       └── Table.jsx              ← exports: Table (default), Tr, Td
└── views/
    ├── index.js
    ├── DashboardView.jsx
    ├── operations/
    │   ├── CustomerOrderListView.jsx
    │   ├── CustomerOrderFormView.jsx
    │   └── DelivererDispatchView.jsx
    ├── finance/
    │   ├── ExpenseListView.jsx
    │   ├── ExpenseFormView.jsx
    │   ├── DelivererPaymentListView.jsx
    │   ├── DelivererPaymentView.jsx
    │   └── RevenueTripView.jsx
    ├── master/
    │   ├── CustomerListView.jsx
    │   ├── DelivererListView.jsx
    │   ├── StoreListView.jsx
    │   ├── ProductListView.jsx
    │   ├── PromotionListView.jsx
    │   └── PromotionFormView.jsx
    └── reports/
        ├── simple/                ← 8 views
        └── analytics/             ← 4 views
```

### 2.3 View Router

Navigation is driven by a single `currentView` string in `App.jsx` state. No React Router. Each view is conditionally rendered with `{currentView === 'key' && <View />}`.

| `currentView` | View Component |
|---------------|----------------|
| `dashboard` | DashboardView |
| `customer_order_list` | CustomerOrderListView |
| `customer_order_form` | CustomerOrderFormView |
| `dispatch_form` | DelivererDispatchView |
| `expense_list` | ExpenseListView |
| `expense_form` | ExpenseFormView |
| `payment_list` | DelivererPaymentListView |
| `payment_form` | DelivererPaymentView |
| `revenue_trip` | RevenueTripView |
| `customer_list` | CustomerListView |
| `deliverer_list` | DelivererListView |
| `store_list` | StoreListView |
| `product_list` | ProductListView |
| `promotion_list` | PromotionListView |
| `promotion_form` | PromotionFormView |
| `report_delivered_orders` | DeliveredOrdersReportView |
| `report_order_receipt` | OrderReceiptView |
| `report_store_products` | StoreProductsReportView |
| `report_fav_stores` | FavStoresReportView |
| `report_unapproved_vouchers` | UnapprovedVouchersReportView |
| `report_deliverer_ranking` | DelivererRankingReportView |
| `report_deliverer_history` | DelivererHistoryReportView |
| `report_category_products` | CategoryProductsReportView |
| `report_top_products` | ReportTopProductsView |
| `report_top_deliverers` | TopDeliverersReportView |
| `report_expense_summary` | ExpenseSummaryReportView |
| `report_promo_perf` | PromoPerfReportView |

### 2.4 Global Shell Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Sidebar (w-[240px], collapsible to w-0)                      │
│  bg-red-800                                                  │
│  ┌─────────────────────────┐  ┌───────────────────────────┐  │
│  │[🛍] Vanz ADMIN    [←]  │  │ AppHeader  h-14 bg-slate-900│  │
│  ├─────────────────────────┤  ├───────────────────────────┤  │
│  │ NavItems + Sections      │  │ Main content              │  │
│  │ NavGroups (collapsible)  │  │ overflow-y-auto p-5       │  │
│  │                          │  │ max-w-5xl mx-auto         │  │
│  ├─────────────────────────┤  │                           │  │
│  │ AD  Admin User           │  │ <CurrentView />           │  │
│  └─────────────────────────┘  └───────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

- Sidebar: slides from `w-[240px]` → `w-0` (content clipped, not unmounted)
- AppHeader: shows `☰` hamburger only when sidebar is closed
- Toast: `fixed top-5 right-5 z-[999]` — success (emerald) or error (red) — auto-dismiss 3s

---

## 3. UI Component Library

Quick reference. All components in `src/components/ui/`.

| Component | Props | Purpose |
|-----------|-------|---------|
| `Btn` | `variant` (primary/secondary/ghost/danger), `size` (sm/md/lg), `disabled`, `onClick` | All buttons |
| `Badge` | `color` (green/amber/red/blue/gray) | Status pill — `rounded-md text-xs font-semibold` |
| `Card` | `className` | White panel: `rounded-xl border-slate-200 shadow-sm` |
| `CardHeader` | `title`, `action` | Title bar inside Card with optional right-slot action |
| `PageHeader` | `title`, `subtitle`, `action` | Top heading of every view |
| `Input` | `icon` (Lucide), all input props | Text input — red focus ring; icon in left padding |
| `Select` | all select props | Dropdown with red focus ring |
| `LovInput` | `value`, `onLov`, `placeholder` | Read-only text + dark `LoV` button to open modal |
| `LovModal` | `isOpen`, `onClose`, `title`, `columns`, `data`, `onSelect` | Full-screen portal with live-search table |
| `FormField` | `label`, `required` | Labeled wrapper — adds red `*` when required |
| `FilterBar` | children | White card wrapping filter inputs (`flex flex-wrap gap-3`) |
| `FilterField` | `label` | Labeled slot `min-w-[140px] max-w-[200px]` |
| `Table` | `headers[]`, `onSort`, `sortConfig`, `minWidth` | Data table with optional sort chevrons |
| `Tr` | `onClick` | Table row — hover `bg-slate-50`; clickable when `onClick` given |
| `Td` | `right`, `center`, `bold`, `mono` | Table cell with alignment/style modifiers |
| `Pagination` | `totalItems`, `itemsPerPage`, `currentPage`, `onPageChange`, `onItemsPerPageChange`, `itemLabel` | Page navigator — size options 10/25/50/100 |
| `StatCard` | `label`, `value`, `icon`, `sub`, `color` | KPI card — `text-3xl font-black` value + `.stat-card` hover |
| `RankBadge` | `rank` | #1 amber · #2 slate · #3 orange · #4+ mono text |

---

## 4. Dashboard

**Route:** `dashboard`

### Components

| Component | Role |
|-----------|------|
| `StatCard` × 4 | KPI row — Orders Today, Active Deliverers, Revenue Today, Pending Vouchers |
| `Card` + `CardHeader` × 2 | Prepared Queue panel · Recent Vouchers panel |
| `Badge` | Status pill on voucher rows |
| `Btn` (secondary, sm) | "Open Dispatch →" · "View All →" navigation shortcuts |

### Layout

```
Greeting text (h2 + p)

[Orders Today]  [Active Deliverers]  [Revenue Today]  [Pending Vouchers]
   red/Package      blue/Truck          green/TrendingUp   amber/Receipt
   grid-cols-2 lg:grid-cols-4

[Dispatch Queue Card]            [Recent Vouchers Card]
  amber rows (animate-pulse dot)   Badge + bold amount rows
  → navigates to dispatch_form     → navigates to expense_list
   grid-cols-1 lg:grid-cols-2
```

### State

| Variable | Type | Purpose |
|----------|------|---------|
| `pendingOrders[]` | array | CONFIRMED/PREPARING orders for dispatch queue (up to 5) |
| `recentVouchers[]` | array | Last 5 expense vouchers sorted by `updated_at` |
| `stats` | `{orders, deliverers, revenue, pendingVouchers}` | Live KPI values |
| `loading` | boolean | Single loading flag for all parallel fetches |

### Actions

| Action | Result |
|--------|--------|
| "Open Dispatch →" | `onNavigate('dispatch_form')` |
| "View All →" | `onNavigate('expense_list')` |

### API (7 parallel calls on mount)
- `GET /api/v1/orders` — today's orders count + CONFIRMED/PREPARING dispatch queue
- `GET /api/v1/deliverers` — non-OFFLINE count
- `GET /api/v1/expense-vouchers` — SUBMITTED count + recent vouchers list
- `GET /api/v1/deliveries` — delivery→deliverer join for vouchers panel
- `GET /api/v1/stores` — store name join for queue
- `GET /api/v1/customers` — customer→profile join for queue
- `GET /api/v1/profiles` — name resolution for customers and deliverers

---

## 5. Operations

### 5.1 Customer Order List

**Route:** `customer_order_list`  
**File:** `views/operations/CustomerOrderListView.jsx`

#### Components

| Component | Role |
|-----------|------|
| `PageHeader` | Title "Customer Orders" + "Create Order" action button |
| `Btn` (primary) | Navigate to `customer_order_form` |
| `Card` | Table wrapper |
| `Table` / `Tr` / `Td` | Order rows |
| `Badge` | Order status (amber = pending, green = paid) |

#### Table Columns

| Column | Style | Source |
|--------|-------|--------|
| Order ID | mono, red-600, bold | `Order.code` |
| Date | default | `Order.order_date` |
| Customer | bold | `Profile.full_name` via Customer |
| Status | `Badge` (amber/green) | `Order.status` |
| Deliverer | default | `Profile.full_name` via Deliverer |

#### State

| Variable | Purpose |
|----------|---------|
| — | Stateless; no filter/pagination yet |

#### Actions

| Action | Result |
|--------|--------|
| "Create Order" button | navigate to `customer_order_form` |

#### API
- `GET /api/v1/orders`

---

### 5.2 Customer Order Form

**Route:** `customer_order_form`  
**File:** `views/operations/CustomerOrderFormView.jsx`

#### Components

| Component | Role |
|-----------|------|
| `PageHeader` | "Customer Order" |
| `Card` (×2) | Header card · Cart Items card |
| `CardHeader` | "Cart Items" + "Add Item" button |
| `FormField` + `Input` | Order Code (read-only), Delivery Address, Order Date |
| `FormField` + `LovInput` | Customer selector · Store selector |
| `LovModal` | Customer / Store / Product picker |
| `Table` / `Td` | Cart line items (inline editable) |
| `Select` | — *(UI only — payment method not in DB schema)* |
| `Btn` (secondary) | Add Item |
| `Btn` (primary, lg) | Place Order |

#### Card 1 — Order Details (grid 3-col)

| Field | Type | Notes |
|-------|------|-------|
| Order Code | Input read-only mono | Auto-generated: `ORD-YYYY-NNNNNN` |
| Customer | LovInput → LovModal | columns: id, name, phone |
| Store | LovInput → LovModal | columns: id, name, category |
| Delivery Address | Input | Editable snapshot |
| Address Snapshot | textarea read-only | Locked copy |
| Order Date | Input type=date | |

#### Card 2 — Cart Items (line-item table)

| Column | Type | Editable |
|--------|------|----------|
| Product | LovInput inline | LoV per row |
| Qty | number input | Yes |
| Unit Price | Td right | Read from product |
| Extended Price | Td right bold | **Frontend: `qty × unit_price`** |
| Delete | icon button | Removes row |

Footer: `Order Total = Σ(extend_price)` — displayed as `฿{total}` — **frontend-calculated**.

#### State

| Variable | Type | Purpose |
|----------|------|---------|
| `customer` | string | Selected `"id – name"` |
| `store` | string | Selected `"id – name"` |
| `items[]` | `{id, productId, productName, qty, price}` | Cart rows |
| `activeLov` | `{type, index?}` | Which LoV modal is open + which row |

#### Computed (frontend only)

| Field | Formula |
|-------|---------|
| `extend_price` per row | `qty × unit_price` |
| `total_price` | `Σ extend_price` |

#### Validation (on save)

- Customer selected
- Store selected
- At least 1 item
- Every item has a product and `qty > 0`

#### Actions

| Action | Result |
|--------|--------|
| "LoV" on Customer | opens LovModal, type=customer |
| "LoV" on Store | opens LovModal, type=store |
| "LoV" per cart row | opens LovModal, type=product, stores index |
| Select in modal | sets state; closes modal |
| Add Item | appends empty row to `items[]` |
| Trash icon | removes row from `items[]` |
| Place Order | validate → `POST /api/v1/orders` (sends `total_price` + `extend_price`) |
| Back link | navigate to `customer_order_list` |

#### API
- `POST /api/v1/orders` — body includes `total_price` and `extend_price` per item

---

### 5.3 Deliverer Dispatch

**Route:** `dispatch_form`  
**File:** `views/operations/DelivererDispatchView.jsx`

#### Components

| Component | Role |
|-----------|------|
| `PageHeader` | "Dispatching" |
| `Card` (×2) | Assignment form · Prepared Queue table |
| `CardHeader` | "Prepared Queue" |
| `FormField` + `LovInput` | Order ID selector · Deliverer selector |
| `Input` | Estimated time (minutes) |
| `LovModal` | Order list / Deliverer list |
| `Table` / `Tr` / `Td` / `Badge` | Queue rows with waiting-time badge |
| `Btn` (primary) | Dispatch button (header form) |
| `Btn` (primary, sm) | ⚡ Dispatch per row |

#### Card 1 — Assign Deliverer (flex row)

| Field | Type |
|-------|------|
| Order ID* | LovInput → queue list (id, store, customer) |
| Deliverer* | LovInput → deliverer list (id, name, vehicle) |
| Est. Time (Mins) | Input number |

#### Card 2 — Dispatch Queue Table

| Column | Style |
|--------|-------|
| Order ID | mono bold |
| Store | default |
| Customer | default |
| Waiting | `Badge color="amber"` |
| — | `Btn` "⚡ Dispatch" per row |

Empty state: "All orders have been dispatched ✓"

#### State

| Variable | Purpose |
|----------|---------|
| `queue[]` | CONFIRMED or PREPARING orders waiting for dispatch |
| `orderId` | Selected order from LoV |
| `delivererId` | Selected deliverer from LoV |
| `lovTarget` | `'order'` or `'deliverer'` |

#### Actions

| Action | Result |
|--------|--------|
| LoV — Order | opens modal with current queue |
| LoV — Deliverer | opens modal with available deliverers |
| Dispatch (form) | validate → creates assignment → removes from queue |
| ⚡ Dispatch (per row) | directly dispatches that order |

#### API
- `POST /api/v1/dispatch-assignments`

---

## 6. Finance

### 6.1 Expense Voucher List

**Route:** `expense_list`  
**File:** `views/finance/ExpenseListView.jsx`

#### Components

| Component | Role |
|-----------|------|
| `PageHeader` | "Expense Vouchers" + "Create Voucher" |
| `FilterBar` + `FilterField` | Search input + Status dropdown |
| `Card` | Table wrapper |
| `Table` / `Tr` / `Td` / `Badge` | Voucher rows |
| `Btn` (secondary/danger, sm) | Edit / Delete per `draft` row |

#### Table Columns

| Column | Style |
|--------|-------|
| Voucher Code | mono red-600 bold |
| Date | xs slate-500 |
| Deliverer | bold |
| Status | `Badge` (gray=draft, amber=submitted, green=approved, red=rejected) |
| Amount | right bold mono `฿` |
| Actions | Edit + Delete (draft only); `—` otherwise |

#### State

| Variable | Purpose |
|----------|---------|
| `editing` | `null` = list; row object = edit form (renders `ExpenseFormView`) |
| `rows` | Live joined vouchers |
| `tick` | Re-fetch trigger |
| `search` | Voucher code / deliverer filter |
| `statusFilter` | Status filter |

#### CRUD
- **Create:** "Create Voucher" navigates to `expense_form` via `onNavigate`
- **Edit:** Opens `ExpenseFormView` inline (draft only) — `setEditing(row)`
- **Delete:** `DELETE /api/v1/expense-vouchers/{voucher_code}` (draft only) → `refresh()`

#### API
- `GET /api/v1/expense-vouchers` · `GET /api/v1/deliveries` · `GET /api/v1/deliverers` · `GET /api/v1/profiles`

---

### 6.2 Expense Voucher Form

**Route:** `expense_form`  
**File:** `views/finance/ExpenseFormView.jsx`

#### Components

| Component | Role |
|-----------|------|
| `Card` (×2) | Voucher Header · Expense Items |
| `CardHeader` | "Expense Items" + "Add Row" |
| `FormField` + `Input` | Voucher Code (read-only), Date, Approved By |
| `FormField` + `LovInput` | Deliverer selector |
| `FormField` + `Select` | Status |
| `LovModal` | Deliverer picker |
| `Table` | Editable expense line items |
| `Select` (inline) | Expense type per row |
| `Input` (inline) | Description, Receipt Ref, Amount per row |
| `Btn` (secondary) | Add Row |
| `Btn` (primary, lg) | Save Voucher |

#### Modes

| Prop | Behaviour |
|------|-----------|
| `data` absent (create) | Shows Deliverer LoV; POSTs new voucher |
| `data` present (edit) | Shows voucher code read-only + status Select; PUTs update |

`onBack` / `onSaved` props used in edit mode (from `ExpenseListView`).  
`onNavigateBack` used in create mode (from `App.jsx`).

#### Card 1 — Voucher Header (grid 2-col)

| Field | Create | Edit |
|-------|--------|------|
| Deliverer | `LovInput` (required) | — (hidden) |
| Voucher Code | — (hidden) | Input read-only mono |
| Voucher Date | Input type=date | Input type=date |
| Status | — (always `draft`) | Select: draft / submitted |

#### Card 2 — Expense Items (editable table)

| Column | Type |
|--------|------|
| Type | Select per row: fuel / maintenance / toll / other |
| Description | text input |
| Receipt Reference | text input mono |
| Amount | number input right-aligned |
| Delete | icon button |

Footer: `Total Amount = Σ(amount)` — **frontend-calculated** — sent as `total_amount` on save.

#### State

| Variable | Purpose |
|----------|---------|
| `delivererId` | Selected deliverer |
| `items[]` | `{id, type, desc, amount, receipt}` |
| `isLovOpen` | Deliverer modal open |

#### Computed (frontend only)

| Field | Formula |
|-------|---------|
| `total_amount` | `Σ item.amount` |

#### Validation

- Deliverer selected
- At least 1 item
- All amounts > 0
- All descriptions not blank

#### API
- `POST /api/v1/expense-vouchers` — sends `total_amount`
- `PUT /api/v1/expense-vouchers/{voucher_code}` — sends updated `total_amount`

---

### 6.3 Deliverer Payment List

**Route:** `payment_list`  
**File:** `views/finance/DelivererPaymentListView.jsx`

#### Components

| Component | Role |
|-----------|------|
| `PageHeader` | "Deliverer Payments" + "Create Payment" |
| `FilterBar` + `FilterField` | Search input + Status dropdown |
| `Card` | Table wrapper |
| `Table` / `Tr` / `Td` / `Badge` | Payment rows |
| `Btn` (secondary/danger, sm) | Edit / Delete per `pending` row |

#### Table Columns

| Column | Style |
|--------|-------|
| Payment Code | mono red-600 bold |
| Period | xs slate-500 mono |
| Date | xs slate-500 |
| Deliverer | bold |
| Status | `Badge` (amber=pending, green=paid, red=cancelled) |
| Total | right bold mono `฿` |
| Actions | Edit + Delete (pending only); `—` otherwise |

#### State

| Variable | Purpose |
|----------|---------|
| `editing` | `null` = list; row object = edit form (renders `DelivererPaymentView`) |
| `rows` | Live joined payments |
| `tick` | Re-fetch trigger |
| `search` | Payment code / deliverer filter |
| `statusFilter` | Status filter |

#### CRUD
- **Create:** "Create Payment" navigates to `payment_form` via `onNavigate`
- **Edit:** Opens `DelivererPaymentView` inline (pending only) — `setEditing(row)`
- **Delete:** `DELETE /api/v1/payments/{payment_code}` (pending only) → `refresh()`

#### API
- `GET /api/v1/payments` · `GET /api/v1/deliveries` · `GET /api/v1/deliverers` · `GET /api/v1/profiles`

---

### 6.4 Deliverer Payment Form

**Route:** `payment_form`  
**File:** `views/finance/DelivererPaymentView.jsx`

#### Components

| Component | Role |
|-----------|------|
| `PageHeader` | "Deliverer Payment" |
| `Card` (×2) | Payment Header · Unpaid Deliveries |
| `CardHeader` | "Unpaid Deliveries" + "Load Orders" |
| `FormField` + `Input` | Payment Code (read-only), Payment Date, Period Start/End |
| `FormField` + `LovInput` | Deliverer selector |
| `FormField` + `Select` | Status |
| `LovModal` | Deliverer picker |
| `Table` / `Tr` / `Td` / `Badge` | Selectable order rows with checkboxes |
| `Btn` (secondary) | Load Orders |
| `Btn` (primary, lg) | Confirm Payment |

#### Modes

| Prop | Behaviour |
|------|-----------|
| `data` absent (create) | Shows Deliverer LoV + delivery selection card; POSTs new payment |
| `data` present (edit) | Shows payment code + status Select; delivery selection hidden; PUTs update |

`onBack` / `onSaved` props used in edit mode (from `DelivererPaymentListView`).  
`onNavigateBack` used in create mode (from `App.jsx`).

#### Card 1 — Payment Header (grid 3-col)

| Field | Create | Edit |
|-------|--------|------|
| Deliverer | `LovInput` (required) | — (shown in subtitle) |
| Payment Code | — | Input read-only mono |
| Status | — (always `pending`) | Select: pending / paid / cancelled |
| Payment Date | Input type=date (required) | Input type=date |
| Period Start | Input type=date | Input type=date |
| Period End | Input type=date | Input type=date |

#### Card 2 — Deliveries (selectable, create mode only)

| Column | Style |
|--------|-------|
| ☐ checkbox | selects/deselects row |
| Order ID | mono bold |
| Date | default |
| Status | `Badge` amber |
| Fee | right `฿` |
| Bonus | right `฿` |
| Adjustment | right `฿` |
| Extended | right bold — **frontend: `fee + bonus + adjustment`** |

Footer: `{N} order(s) selected` · `Total Payment = Σ(fee + bonus + adjustment)` for selected rows — **frontend-calculated**.

#### State

| Variable | Purpose |
|----------|---------|
| `deliverer` | Selected deliverer string |
| `selected[]` | Array of selected order IDs |
| `paymentDate`, `startDate`, `endDate` | Date inputs |
| `isLovOpen` | Modal toggle |

#### Computed (frontend only)

| Field | Formula |
|-------|---------|
| extended per row | `fee + bonus + adjustment` |
| `total_payment` | `Σ(fee + bonus + adjustment)` for selected rows |

#### Validation

- Deliverer selected
- Payment date provided
- Period end >= period start
- At least 1 order selected

#### API
- `POST /api/v1/payments` — sends `total_payment`
- `PUT /api/v1/payments/{payment_code}` — sends updated `total_payment`

---

### 6.5 Revenue Per Trip

**Route:** `revenue_trip`  
**File:** `views/finance/RevenueTripView.jsx`

#### Components

| Component | Role |
|-----------|------|
| `PageHeader` | "Revenue Per Trip" + "Add Rate" |
| `StatCard` × 2 | Current Rate (green) · Rate Changes count (blue) |
| `Card` | Editable rate history table |
| `Table` / `Tr` | Rate rows |
| `Btn` (primary, sm) | Save per row |

#### Table Columns (all inline-editable)

| Column | Type |
|--------|-------|
| Effective Date | date input inline |
| Rate Per Trip | number input inline |
| Notes | text input inline |
| — | Save button per row |

#### State

| Variable | Purpose |
|----------|---------|
| `rates[]` | `{id, date, revenue, notes}` — rate history |

#### Actions

| Action | Result |
|--------|--------|
| "Add Rate" | prepends new empty row |
| Save per row | `showToast('Rate saved!')` |

---

## 7. Master Data

All master data views follow one of two patterns:

**List Pattern:** PageHeader + (optional FilterBar) + Card(Table + Pagination)  
**Inline Form Pattern:** Back link + Card(grid FormFields) + Save/Cancel buttons

The form renders **inside the same view** — when `editing` state is set, the form replaces the list. Navigating "Back" clears `editing`.

---

### 7.1 Customers

**Route:** `customer_list`  
**File:** `views/master/CustomerListView.jsx`

#### List View Components

| Component | Role |
|-----------|------|
| `PageHeader` | "Customers" + "Add Customer" |
| `FilterBar` + `FilterField` | Search input |
| `Input` with `Search` icon | Filter by code, name, phone |
| `Card` (overflow-hidden) | Table + Pagination wrapper |
| `Table` | Sortable columns |
| `Tr` / `Td` | Customer rows |
| `Btn` (secondary, sm) | Edit per row |
| `Btn` (danger, sm) | Delete per row |
| `Pagination` | Page navigation |

#### Table Columns

| Column | Sortable | Style |
|--------|----------|-------|
| ID | ✓ | mono, xs, slate-500 bold |
| Name | ✓ | bold |
| Phone | ✓ | mono xs |
| Address | — | truncate max-w-[200px] |
| Joined | ✓ | xs slate-500 |
| Actions | — | Edit / Delete buttons |

#### State

| Variable | Type | Purpose |
|----------|------|---------|
| `editing` | `null \| {} \| {…row}` | null = list; {} = new form; row data = edit form |
| `rows` | array | Live data fetched from API |
| `loading` | boolean | Shows "Loading…" placeholder while fetching |
| `tick` | integer | Incremented by `refresh()` to trigger re-fetch |
| `search` | string | Name / code / phone filter |
| `sort` | `{key, direction}` | Column sort config |
| `page` / `pageSize` | integer | Pagination |

#### Data Loading Pipeline

```
useEffect([tick])
  → parallel: GET /customers, GET /profiles, GET /addresses
  → join by profile_id / address_id using Map lookups
  → setRows([{id:customer_code, name, phone, address, membership, ...}])
  → render in Table
```

#### Create Flow (new customer)
1. `POST /profiles` → `profile_id`
2. `POST /addresses` → `address_id`
3. `POST /customers` with `{profile_id, address_id, membership_level}`
4. `onSaved()` → `refresh()` → list re-fetches

#### Edit Flow
1. `PUT /profiles/{profile_id}` — name + phone
2. `PUT /addresses/{address_id}` — address line
3. `PUT /customers/{customer_code}` — membership level
4. `onSaved()` → `refresh()`

#### Delete Flow
`DELETE /customers/{customer_code}` → `refresh()`
Blocked by API when customer has orders, reviews, or favourite stores.

#### Inline Form Fields (grid 2-col)

| Field | Required | Notes |
|-------|----------|-------|
| Customer Code | — | Read-only; shows predicted next code via `nextCode` |
| Full Name | Yes | maps to profile.full_name |
| Phone Number | Yes | maps to profile.phone |
| Email | — | maps to profile.email |
| Membership Level | Yes | Select: Bronze / Silver / Gold / Platinum |
| Address | Yes | maps to address.address_line_1 |
| City | Yes | maps to address.city (required by POST /addresses) |

> `address_name` = full_name, `address_type` = `HOME`, `country_code` = `TH` (hardcoded defaults).

#### API
- `GET /api/v1/customers` · `GET /api/v1/profiles` · `GET /api/v1/addresses`
- `POST /api/v1/customers` (+ profiles + addresses for create)
- `PUT /api/v1/customers/{customer_code}`
- `DELETE /api/v1/customers/{customer_code}`

---

### 7.2 Deliverers

**Route:** `deliverer_list`  
**File:** `views/master/DelivererListView.jsx`

#### Table Columns

| Column | Style |
|--------|-------|
| Code | mono xs |
| Name | bold |
| License Plate | mono xs |
| Vehicle | default |
| Phone | mono xs |
| Status | `Badge` (green = Active, yellow = Busy, gray = Inactive) |
| Rating | `⭐ N.N` amber star icon |
| Actions | Edit / Delete buttons |

#### State

| Variable | Type | Purpose |
|----------|------|---------|
| `editing` | `null \| {} \| {…row}` | null = list; {} = new form; row data = edit form |
| `rows` | array | Live data fetched from API |
| `loading` | boolean | Shows "Loading…" placeholder |
| `tick` | integer | Incremented by `refresh()` to trigger re-fetch |

#### Data Loading Pipeline

```
useEffect([tick])
  → parallel: GET /deliverers, GET /profiles
  → join by profile_id using Map lookup
  → STATUS_MAP: { available→'Active', busy→'Busy', offline→'Inactive' }
  → setRows([{id:deliverer_code, name, phone, license, type, status, rating, …}])
```

#### Create Flow (new deliverer)
1. `POST /profiles` → `profile_id`
2. `POST /deliverers` with `{profile_id, vehicle_type, license_plate, current_status}`
3. `onSaved()` → `refresh()`

#### Edit Flow
1. `PUT /profiles/{profile_id}` — name + phone
2. `PUT /deliverers/{deliverer_code}` — vehicle_type, license_plate, current_status
3. `onSaved()` → `refresh()`

#### Delete Flow
`DELETE /deliverers/{deliverer_code}` → `refresh()`

#### Inline Form Fields (grid 2-col)

| Field | Required | Type |
|-------|----------|------|
| Deliverer Code | — | Read-only; shows predicted next code via `nextCode` |
| Full Name | Yes | Input |
| License Plate | Yes | Input (auto-uppercased) |
| Phone Number | Yes | Input |
| Email | — | Input |
| Vehicle Type | Yes | Select: Motorcycle / Car / Bicycle / Scooter / Van / Truck |
| Status | — | 3-way toggle: Active (available) / Busy (busy) / Inactive (offline) |

#### API
- `GET /api/v1/deliverers` + `GET /api/v1/profiles`
- `POST /api/v1/deliverers` (+ `POST /api/v1/profiles` for create)
- `PUT /api/v1/deliverers/{deliverer_code}`
- `DELETE /api/v1/deliverers/{deliverer_code}`

---

### 7.3 Stores

**Route:** `store_list`  
**File:** `views/master/StoreListView.jsx`

#### Table Columns

| Column | Style |
|--------|-------|
| Code | mono xs |
| Store Name | bold |
| Category | `Badge` (gray) — displayed in Title Case |
| Address | truncate max-w-[200px] slate-500 |
| Status | `Badge (green=active, gray=inactive, red=suspended)) |
| Actions | Edit / Delete |

#### State

| Variable | Type | Purpose |
|----------|------|---------|
| `editing` | `null \| {} \| {…row}` | null = list; {} = new; row = edit |
| `rows` | array | Live data fetched from API |
| `loading` | boolean | Loading placeholder |
| `tick` | integer | Re-fetch trigger |

#### Data Loading Pipeline

```
useEffect([tick])
  → parallel: GET /stores, GET /addresses
  → join by address_id using Map lookup
  → category displayed as Title Case (e.g. thai_food → "Thai food")
  → setRows([{id:store_code, storeId, addressId, name, category, status, address, …}])
```

#### Create Flow (new store)
1. `POST /addresses` with `{address_name, address_type:'store', address_line_1, city, country_code:'TH'}` → `address_id`
2. `POST /stores` with `{name, address_id, category, status}` — category stored as UPPER_SNAKE_CASE
3. `onSaved()` → `refresh()`

#### Edit Flow
1. `PUT /addresses/{address_id}` — address_line_1, city
2. `PUT /stores/{store_code}` — name, category, status
3. `onSaved()` → `refresh()`

#### Delete Flow
`DELETE /stores/{store_code}` → `refresh()`

#### Inline Form Fields (grid 2-col)

| Field | Required | Type |
|-------|----------|------|
| Store Code | — | Read-only; shows predicted next code via `nextCode` |
| Store Name | Yes | Input |
| Category | Yes | Select: THAI_FOOD / JAPANESE / CHINESE / WESTERN / CAFE_DRINKS / FAST_FOOD / BAKERY / GROCERY / OTHER |
| Status | — | Select: active / inactive / suspended |
| City | Yes | Input (maps to address.city) |
| Address | Yes | Input (full-width, col-span-2 — maps to address.address_line_1) |

> `address_type` = `STORE`, `country_code` = `TH` (hardcoded defaults).  
> `phone` and `operating_hours` are not in the Store database table and are not captured in the form.

#### API
- `GET /api/v1/stores` + `GET /api/v1/addresses`
- `POST /api/v1/stores` (+ `POST /api/v1/addresses` for create)
- `PUT /api/v1/stores/{store_code}`
- `DELETE /api/v1/stores/{store_code}`

---

### 7.4 Products

**Route:** `product_list`  
**File:** `views/master/ProductListView.jsx`

#### Table Columns

| Column | Style |
|--------|-------|
| # (product_id) | mono xs slate-400 |
| Store | default slate-600 |
| Product Name | bold |
| Price | right bold mono `฿` |
| Status | `Badge` (green=available, amber=out_of_stock, red=discontinued, gray=unavailable) |
| Actions | Edit / Delete |

#### State

| Variable | Type | Purpose |
|----------|------|---------|
| `editing` | `null \| {} \| {…row}` | null = list; {} = new; row = edit |
| `rows` | array | Live product data |
| `stores` | array | Live store list for LovModal — `[{id:store_code, name, category}]` |
| `loading` | boolean | Loading placeholder |
| `tick` | integer | Re-fetch trigger |

#### Data Loading Pipeline

```
useEffect([tick])
  → parallel: GET /store-products, GET /stores
  → storeMap by store_id for product→store join
  → setStores([{id:store_code, name, category}])   ← used by LovModal in form
  → setRows([{id:product_id, productId, storeId, storeCode, storeName, name, price, active, status}])
```

#### Create Flow (new product)
1. `POST /store-products` with `{store_code, name, unit_price, status}` — store selected via LovModal
2. `onSaved()` → `refresh()`

#### Edit Flow
- Store field is **read-only** (cannot change after creation)
1. `PUT /store-products/{product_id}` with `{name, unit_price, status}`
2. `onSaved()` → `refresh()`

#### Delete Flow
`DELETE /store-products/{product_id}` (integer ID) → `refresh()`

#### Inline Form Fields (grid 2-col)

| Field | Required | Type |
|-------|----------|------|
| Product ID | — | Read-only integer (server-assigned) |
| Store | Yes (new only) | `LovInput` → `LovModal` (live store list from parent); read-only on edit |
| Product Name | Yes | Input |
| Unit Price (฿) | Yes | Input number (≥ 0, step 0.01) |
| Status | — | Select: available / out_of_stock / unavailable / discontinued |

> **Note:** `category` is not a field in Store_Products — it belongs to the store itself.  
> Path param is **integer** `product_id`, not a business code.  
> The store list is fetched once by `ProductListView` and passed as a `stores` prop to `ProductFormView` to avoid duplicate requests.

#### API
- `GET /api/v1/store-products` + `GET /api/v1/stores`
- `POST /api/v1/store-products`
- `PUT /api/v1/store-products/{product_id}`
- `DELETE /api/v1/store-products/{product_id}`

---

### 7.5 Promotions — List

**Route:** `promotion_list`  
**File:** `views/master/PromotionListView.jsx`

#### Table Columns

| Column | Style |
|--------|-------|
| ID | mono xs |
| Campaign Name | bold |
| Store | default (live join from `/stores`) |
| Period | `start → end` xs |
| Discount Type | default |
| Status | `Badge (green=active, blue=upcoming, gray=expired)) — computed client-side from current date vs. start/end |
| Actions | Delete button |

#### Data Loading Pipeline

```
useEffect([tick])
  → parallel: GET /promotions, GET /stores
  → storeMap by store_id for promo→store join
  → isActive = today >= start_date && today <= end_date
  → isUpcoming = today < start_date
  → setRows([{id:promotion_code, name, store, startDate, endDate, discountType, status}])
```

#### Delete Flow
`DELETE /promotions/{promotion_code}` → `refresh()`

#### API
- `GET /api/v1/promotions` + `GET /api/v1/stores`
- `DELETE /api/v1/promotions/{promotion_code}`

---

### 7.6 Promotions — Form

**Route:** `promotion_form`  
**File:** `views/master/PromotionFormView.jsx`

#### Components

| Component | Role |
|-----------|------|
| `Card` (×2) | Campaign Details · Promotion Items |
| `CardHeader` | "Promotion Items" + "Add Product" |
| `FormField` + `Input` | Campaign Code (read-only), Name, Dates |
| `FormField` + `Select` | Discount Type |
| `FormField` + `LovInput` | Store selector |
| `LovModal` (×2) | Store picker · Product picker |
| `Table` | Inline product + discount rows |
| `Btn` (secondary) | Add Product |
| `Btn` (primary, lg) | Save Campaign |

#### Card 1 — Campaign Details (grid 3-col)

| Field | Required | Type |
|-------|----------|------|
| Campaign Code | — | Input read-only mono (PROMO-YYYY-NNN) |
| Store | Yes | LovInput |
| Campaign Name | Yes | Input |
| Discount Type | Yes | Select: percentage / fixed_amount |
| Start Date | Yes | Input type=date |
| End Date | Yes | Input type=date (≥ start) |

#### Card 2 — Promotion Items (editable table)

| Column | Type |
|--------|------|
| Product | LovInput inline per row |
| Discount Value | number input right |
| Delete | icon button |

#### LoV Data Sources (live API)

| LoV | Endpoint | Filter |
|-----|----------|--------|
| Store picker | `GET /api/v1/stores` | All stores |
| Product picker | `GET /api/v1/store-products` | Filtered to selected store's `store_id` on selection |

#### State

| Variable | Purpose |
|----------|---------|
| `store`, `storeIsLov` | Store selection |
| `name`, `startDate`, `endDate` | Campaign header fields |
| `discountType` | PERCENTAGE / FIXED_AMOUNT |
| `items[]` | `{id, productId, productName, discount}` |
| `lovStores[]` | Live store list for store LoV modal |
| `lovProducts[]` | Live product list filtered to selected store |
| `isLovOpen`, `lovIdx` | Product modal + which row |

#### Validation

- Store selected
- Name not blank
- Both dates provided and end ≥ start
- At least 1 item; all items have product + discount > 0

#### API
- `POST /api/v1/promotions`
- `PUT /api/v1/promotions/{promotion_code}`

---

## 8. Reports

> Report **data columns and sample output** are documented in `REPORT.md`.  
> This section documents the frontend components, filter inputs, and interactions for each report view.

All report views share the same skeleton:

```
PageHeader (title + subtitle)
FilterBar (filter inputs + Generate/Search btn)
[optional StatCards for aggregate metrics]
Card → Table (results)
```

---

### 8.1 Simple Reports

#### R-S1 — Delivered Orders

**Route:** `report_delivered_orders`  
**File:** `views/reports/simple/DeliveredOrdersReportView.jsx`

| Filter | Type |
|--------|------|
| Date From | Input type=date |
| Date To | Input type=date |
| Generate | `Btn` with `Search` icon |

**Table:** Order ID · Date · Customer · Store · Deliverer · Duration (right) · Total (right bold)

**API:** `GET /api/v1/orders` with status=delivered + date range

---

#### R-S2 — Order Receipt

**Route:** `report_order_receipt`  
**File:** `views/reports/simple/OrderReceiptView.jsx`

| Filter | Type |
|--------|------|
| Order ID | `LovInput` → `LovModal` (Order list) |
| Load Receipt | `Btn` with `Eye` icon |

**Output:** Receipt card (`max-w-sm mx-auto`) — Vanz logo, order meta, item lines (qty × price), subtotal, delivery fee, total. Print button at bottom.

**Calculation (frontend):**
- `subtotal = Σ(item.total)`
- `total = subtotal + delivery_fee`

**API:** `GET /api/v1/orders` (single order by code)

---

#### R-S3 — Store Products

**Route:** `report_store_products`  
**File:** `views/reports/simple/StoreProductsReportView.jsx`

| Filter | Type |
|--------|------|
| Store | `LovInput` |
| Product Name | Input text |
| Price | Input number |
| Status | Select |
| Search | `Btn` |

**Table:** Store Name · Product Name · Unit Price · Status (Badge)

**API:** `GET /api/v1/store-products`

---

#### R-S4 — Favorite Stores

**Route:** `report_fav_stores`  
**File:** `views/reports/simple/FavStoresReportView.jsx`

| Filter | Type |
|--------|------|
| Customer | `LovInput` |
| Search | `Btn` |

**Table:** Customer Name · Store Name

**API:** `GET /api/v1/favorite-stores`

---

#### R-S5 — Unapproved Vouchers

**Route:** `report_unapproved_vouchers`  
**File:** `views/reports/simple/UnapprovedVouchersReportView.jsx`

| Filter | Type |
|--------|------|
| Date From | Input type=date |
| Date To | Input type=date |
| Total Amount | Input number |
| Status | Select (All / submitted / draft) |
| Search | `Btn` |

**Above table:** `StatCard` (amber) — count of unapproved vouchers

**Table:** Voucher ID · Deliverer · Date · Expense Items (Badge gray) · Total Amount · Status (Badge amber)

**API:** `GET /api/v1/expense-vouchers` (filter out approved/rejected on frontend)

---

#### R-S6 — Deliverer Ranking

**Route:** `report_deliverer_ranking`  
**File:** `views/reports/simple/DelivererRankingReportView.jsx`

| Filter | Type |
|--------|------|
| Deliverer Name | `LovInput` |
| Vehicle Type | Select |
| Min Rating | Input number (step 0.1) |
| Search | `Btn` |

**Table:** Rank (`RankBadge`) · Deliverer Name · Vehicle Type · Total Deliveries · Rating (⭐ + progress bar)

**Sort:** Frontend sorts by `rating` descending.

**API:** `GET /api/v1/deliverers` → `GET /api/v1/reviews` (aggregate ratings client-side)

---

#### R-S7 — Deliverer History

**Route:** `report_deliverer_history`  
**File:** `views/reports/simple/DelivererHistoryReportView.jsx`

| Filter | Type |
|--------|------|
| Deliverer ID | `LovInput` |
| Date From | Input type=date |
| Date To | Input type=date |
| Search | `Btn` with `History` icon |

**Card header** shows selected deliverer name + code.

**Table:** Order ID · Date · Time · Store · Customer · Fee (right bold) · Status (Badge green)

**API:** `GET /api/v1/deliveries` filtered by deliverer_code + date range

---

#### R-S8 — Category Products

**Route:** `report_category_products`  
**File:** `views/reports/simple/CategoryProductsReportView.jsx`

| Filter | Type |
|--------|------|
| Store | `LovInput` |
| Category | Input / Select |
| Search | `Btn` |

**Table:** Product ID · Product Name · Unit Price · Status (Badge) · Store Name · Category

**API:** `GET /api/v1/store-products` filtered by store + category

---

### 8.2 Analytics Reports

#### R-A1 — Top Selling Products

**Route:** `report_top_products`  
**File:** `views/reports/analytics/ReportTopProductsView.jsx`

| Filter | Type |
|--------|------|
| Store | `LovInput` |
| Top N | Input number |
| Date From | Input type=date |
| Date To | Input type=date |
| Generate | `Btn` with `BarChart3` icon |

**Table:** Rank (`RankBadge`) · Store · Product (bold) · Category · Qty Sold (right bold) · Revenue (right bold emerald)

**API:** `GET /api/v1/orders` → aggregate `order_items` quantity + revenue per product on frontend

---

#### R-A2 — Top Deliverers

**Route:** `report_top_deliverers`  
**File:** `views/reports/analytics/TopDeliverersReportView.jsx`

| Filter | Type |
|--------|------|
| Top N | Input number |
| Date From | Input type=date |
| Date To | Input type=date |
| Generate | `Btn` with `Award` icon |

**Table:** Rank (`RankBadge`) · Deliverer (bold) · Vehicle · Deliveries (right bold) · Total Earnings (right bold emerald) · Rating (⭐ amber)

**API:** `GET /api/v1/deliveries` → aggregate count + earnings per deliverer on frontend

---

#### R-A3 — Expense Summary

**Route:** `report_expense_summary`  
**File:** `views/reports/analytics/ExpenseSummaryReportView.jsx`

| Filter | Type |
|--------|------|
| Date From | Input type=date |
| Date To | Input type=date |
| Calculate | `Btn` with `Calculator` icon |

**StatCards row (3-col):**

| Card | Color | Value |
|------|-------|-------|
| Total Vouchers (COUNT) | blue | `vouchers.length` |
| Total Value (SUM) | red | `Σ total_amount` |
| Average Value (AVG) | green | `SUM / COUNT` |

**All three computed on frontend from raw voucher data.**

**Breakdown panels:**

| Panel | Color |
|-------|-------|
| Submitted: ฿X — N vouchers | amber |
| Approved: ฿X — N vouchers | emerald |
| Top Expense type: ฿X (N%) | slate |

**API:** `GET /api/v1/expense-vouchers` → aggregate COUNT / SUM / AVG + breakdown on frontend

---

#### R-A4 — Promotion Performance

**Route:** `report_promo_perf`  
**File:** `views/reports/analytics/PromoPerfReportView.jsx`

| Filter | Type |
|--------|------|
| Store | `LovInput` |
| Date From | Input type=date |
| Date To | Input type=date |
| Generate | `Btn` with `TrendingUp` icon |

**StatCards row (2-col):**

| Card | Color |
|------|-------|
| Total Promo Revenue | green |
| Active Campaigns | red |

**Table:** Campaign (bold) · Store · Period · Discount Type · Orders Applied (right emerald) · Unique Products (right) · Revenue Generated (right emerald)

**API:** `GET /api/v1/promotions` + `GET /api/v1/orders` → join and aggregate on frontend

---

## 9. Cross-Document Consistency Notes

| # | Issue | Impact | Resolution |
|---|-------|--------|------------|
| 1 | `Delivery` has no `code` column in DB | API.md v1.0 used `delivery_code` path param | **Fixed** in API v1.1 → uses `delivery_id` (integer) |
| 2 | `Store_Products` has no `code` column in DB | API.md v1.0 used `product_code` path param | **Fixed** in API v1.1 → uses `product_id` (integer) |
| 3 | `Order.status` typed as `int8` in DB schema | Documentation error | Should be `enum` — DB column is correct, markdown typo |
| 4 | `Order_Items.unit_price` typed as `text` in DB | Documentation error | Should be `numeric` — markdown typo |
| 5 | `StoreListView` / `StoreFormView` had `phone` + `operating_hours` | Neither exists in `Store` table | **Fixed** — fields removed; `City` added (required by address API) |
| 6 | `CustomerOrderFormView` has `payment_method` | Not in `Order` table | Remove from UI or add to DB |
| 7 | `payments.service.js` and `expense-vouchers.service.js` validated `delivery_code` | Server rejected valid POST bodies | **Fixed** — both services now validate `delivery_id` (positive integer); models updated to match |
| 8 | `ExpenseFormView` included `PARKING` expense type | Not in API spec enum (FUEL/MAINTENANCE/TOLL/OTHER) | **Fixed** — PARKING removed from frontend type list |
| 9 | `DelivererDispatchView` filtered `status === 'PREPARED'` | No such value in Order status enum | **Fixed** — filter now matches `confirmed` or `preparing` |
| 10 | All service `VALID_*` arrays and model defaults used UPPERCASE | DB stores enum values in lowercase / Title Case — all validations and inserts failed on real data | **Fixed** — all service arrays, model defaults, and client Badge/filter maps updated to match real DB values |
| 11 | `ExpenseListView` and `DelivererPaymentListView` had no Edit/Delete | `draft` vouchers and `pending` payments could not be mutated after creation | **Fixed** — both list views now render inline form (via `editing` state) for status-gated mutations |
