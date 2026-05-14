# VANz - Delivery Administration Dashboard 🚚

VANz is a comprehensive, React-built administrative dashboard designed to manage a multi-store food delivery platform. It centralizes operations, finance, master data, and analytics into a single, intuitive interface.

## 🌟 Key Features & Modules

The platform is structured into four main operational pillars, designed following industry-standard ERP/POS workflows:

### 1. Operations (Daily Transactions)
*   **Customer Orders:** Line-item entry form (Master-Detail) for processing customer food orders, capturing delivery addresses, payment methods, and calculating totals.
*   **Dispatching:** A queue-based assignment interface to allocate prepared orders to active deliverers, tracking estimated delivery margins.

### 2. Finance
*   **Deliverer Payments:** A processing interface to aggregate unpaid completed deliveries and issue bulk batch payments to riders.
*   **Expense Vouchers:** Line-item claim forms for deliverers to reimburse operational expenses (Tolls, Fuel, Parking) with managerial approval workflows.
*   **Revenue Per Trip:** A historical rate-tracking table managing the platform's delivery fee structure over time.

### 3. Master Data (System Registry)
*   **Stores & Products:** Management interfaces for partner restaurants and their active menus.
*   **Customers:** Profiles and directory of users using the delivery service.
*   **Deliverers:** Fleet management including vehicle types, contact details, operational status, and dynamic ratings.
*   **Promotions:** A Line-item campaign builder for configuring multi-product discounts and tracking active marketing events.

### 4. Categorized Reports & Analytics
A 12-report suite split into Simple and Analytical deliverables, segmented by the development team:
*   **Kittiphat:** Delivered Orders (Duration Tracking), Order Receipt Generation, Top Selling Products (Revenue/Qty).
*   **Sorawit:** Store Products Directory, Favorite Stores Index, Top Deliverers Rankings (Earnings focus).
*   **Piti:** Unapproved Vouchers Tracking, Full Deliverer Ratings, Expense Financial Summary.
*   **Panjapong:** Category Products Overview, Deliverer History Logs, Promotion Campaign Performance (Conversion/Revenue focus).

## 🛠️ Tech Stack & UI Principles
*   **Frontend Framework:** React (Vite environment)
*   **Styling & Theming:** Tailwind CSS. The app uses a deep `slate` and signature `red` branding (`bg-red-800`).
*   **UX Enhancements:** 
    * Smooth CSS Grid transitions for collapsible report navigations.
    * Transparent, native-feeling scrollbars.
    * Master-Detail flows with proper List View entry points to avoid UI clamping.
    * `overscroll-behavior: none` implementations to ensure native application feel on trackpads.
*   **Icons:** Lucide-React for vectorized, consistent iconography.

## 🛡️ Robust Validation & API Compliance
*   **Strict API Formats:** All system-generated identifiers strictly conform to API specifications (e.g., `ORD-YYYY-XXXXXX`, `EXP-YYYY-XXXXXX`, `PAY-YYYY-XXXXXX`, `PROMO-YYYY-XXX`).
*   **Comprehensive Data Validation:** Every interactive form includes robust error-handling:
    * Rejects negative prices and quantities.
    * Enforces chronological date sequencing (End Date >= Start Date).
    * Requires Master Data selection (Deliverer, Customer, Store) before progressing.
    * Validates array logic natively (e.g., preventing empty dispatches or 0-item vouchers).
*   **Standardized Enums:** Incorporates backend-matching specific Enums for status flows (`SUBMITTED`, `DRAFT`, `APPROVED`, `REJECTED`, `PERCENTAGE`, `FIXED_AMOUNT`).

## 📁 File / Dependencies Schema

The application is organized into 4 architectural layers:

### Architecture Diagram

```
src/
├── data/
│   └── mockData.js                              ← All 17 mock data constants
│
├── components/
│   ├── ui/                                      ← 15 Reusable UI primitives + barrel
│   │   ├── index.js                               (barrel re-export)
│   │   ├── Btn.jsx
│   │   ├── Badge.jsx
│   │   ├── Card.jsx
│   │   ├── CardHeader.jsx
│   │   ├── FormField.jsx
│   │   ├── Input.jsx
│   │   ├── Select.jsx
│   │   ├── LovInput.jsx
│   │   ├── LovModal.jsx                           (uses createPortal)
│   │   ├── Table.jsx                              (includes Tr + Td)
│   │   ├── StatCard.jsx                           (imports Card)
│   │   ├── RankBadge.jsx
│   │   ├── FilterBar.jsx                          (imports Card)
│   │   ├── FilterField.jsx
│   │   └── PageHeader.jsx
│   │
│   └── layout/
│       ├── Sidebar.jsx                          ← NavGroup, NavItem, Section
│       └── AppHeader.jsx                        ← Top header bar
│
├── views/
│   ├── index.js                                 ← Master barrel (re-exports all)
│   ├── DashboardView.jsx
│   │
│   ├── operations/
│   │   ├── index.js
│   │   ├── CustomerOrderListView.jsx
│   │   ├── CustomerOrderFormView.jsx
│   │   └── DelivererDispatchView.jsx
│   │
│   ├── finance/
│   │   ├── index.js
│   │   ├── ExpenseListView.jsx
│   │   ├── ExpenseFormView.jsx
│   │   ├── DelivererPaymentListView.jsx
│   │   ├── DelivererPaymentView.jsx
│   │   └── RevenueTripView.jsx
│   │
│   ├── master/
│   │   ├── index.js
│   │   ├── CustomerListView.jsx                   (co-locates CustomerFormInline)
│   │   ├── DelivererListView.jsx                  (co-locates DelivererFormInline)
│   │   ├── StoreListView.jsx                      (co-locates StoreFormInline)
│   │   ├── ProductListView.jsx                    (co-locates ProductFormInline)
│   │   ├── PromotionListView.jsx
│   │   └── PromotionFormView.jsx
│   │
│   └── reports/
│       ├── index.js
│       ├── simple/
│       │   ├── index.js
│       │   ├── DeliveredOrdersReportView.jsx
│       │   ├── OrderReceiptView.jsx
│       │   ├── StoreProductsReportView.jsx
│       │   ├── FavStoresReportView.jsx
│       │   ├── UnapprovedVouchersReportView.jsx
│       │   ├── DelivererRankingReportView.jsx
│       │   ├── DelivererHistoryReportView.jsx
│       │   └── CategoryProductsReportView.jsx
│       │
│       └── analytics/
│           ├── index.js
│           ├── ReportTopProductsView.jsx
│           ├── TopDeliverersReportView.jsx
│           ├── ExpenseSummaryReportView.jsx
│           └── PromoPerfReportView.jsx
│
├── App.jsx                                      ← Slim orchestrator (~90 lines)
├── App.css                                      ← All styles (fonts, animations, scrollbars)
├── index.css
└── main.jsx                                     ← Entry point
```

### Dependency Flow

```
main.jsx → App.jsx → Sidebar + AppHeader (layout)
                   → views/* (all views via barrel import)
                        ↓
                   components/ui/* (via barrel index.js)
                   data/mockData.js
                   lucide-react
```

Every **view** file imports:
1. UI primitives from `../../components/ui` (barrel)
2. Mock data from `../../data/mockData` (named exports)
3. Icons directly from `lucide-react`

### File Count Summary

| Layer | Files | Description |
|-------|-------|-------------|
| Data | 1 | Mock data constants |
| UI Components | 16 | 15 components + barrel |
| Layout | 2 | Sidebar + AppHeader |
| Views | 29 | 22 view files + 7 barrels |
| Core | 2 | App.jsx + App.css |
| **Total** | **50** | |

## 🚀 How to Run locally

```bash
# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
