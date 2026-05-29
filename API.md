# API.md — Vanz Marketplace Delivery Platform

> Version 1.4 · Updated 29 May 2026  
> Project: Marketplace Delivery Platform Management System  
> Team: Panjapong Poobancheun, Sorawit Chaithong, Kittiphat Noikate, Piti Srisongkram

---

## API Infrastructure

### Base URL
```
/api/v1
```

### Protocol & Format
- **Protocol:** HTTP/HTTPS REST
- **Request/Response format:** JSON
- **Date format:** ISO 8601 (`YYYY-MM-DDTHH:MM:SSZ`) for datetimes, `YYYY-MM-DD` for dates
- **Numeric fields:** `decimal` / `float` for prices, fees, and quantities

### Design Principles
- **Header + Line Items in one call** — Every transactional endpoint (Orders, Payments, Expense Vouchers, Promotions) manages the parent header and its child line items together in a single request. No separate endpoints for line items.
- **Business codes as identifiers when available** — Path parameters and request body references prefer human-readable business codes (e.g. `ORD-2026-000123`). Tables without business codes use their integer IDs.
- **No server-side calculation** — Fields like `total_price`, `extend_price`, `total_payment`, and `total_amount` are calculated by the **frontend** before sending. The API stores and returns the client-provided values as-is.
- **Status-gated mutations** — PUT and DELETE operations are only permitted when the record is in a specific status (e.g. PENDING, DRAFT). Attempts on records in other statuses return a 400 error.
- **Array replacement on PUT** — When `line_items` arrays are included in a PUT request body, they fully replace the existing line items. Omitting the array leaves line items unchanged.
- **Master/detail separation** — Core master tables (Address, Profile, Customer, Deliverer, Store, Store Products) expose independent CRUD APIs. Transactional tables keep their line-item children embedded in the same call.

### Folder Structure

```text
Vanz/
  server/
    src/
      app.js
      controllers/
        addresses.controller.js
        profiles.controller.js
        customers.controller.js
        deliverers.controller.js
        stores.controller.js
        store-products.controller.js
        favorite-stores.controller.js
        reviews.controller.js
        deliveries.controller.js
        dispatch-assignments.controller.js
        delivery-location-logs.controller.js
        orders.controller.js
        payments.controller.js
        expense-vouchers.controller.js
        promotions.controller.js
      routes/
        addresses.routes.js
        profiles.routes.js
        customers.routes.js
        deliverers.routes.js
        stores.routes.js
        store-products.routes.js
        favorite-stores.routes.js
        reviews.routes.js
        deliveries.routes.js
        dispatch-assignments.routes.js
        delivery-location-logs.routes.js
        orders.routes.js
        payments.routes.js
        expense-vouchers.routes.js
        promotions.routes.js
      services/
        addresses.service.js
        profiles.service.js
        customers.service.js
        deliverers.service.js
        stores.service.js
        store-products.service.js
        favorite-stores.service.js
        reviews.service.js
        deliveries.service.js
        dispatch-assignments.service.js
        delivery-location-logs.service.js
        orders.service.js
        payments.service.js
        expense-vouchers.service.js
        promotions.service.js
      models/
        addresses.model.js
        profiles.model.js
        customers.model.js
        deliverers.model.js
        stores.model.js
        store-products.model.js
        favorite-stores.model.js
        reviews.model.js
        deliveries.model.js
        dispatch-assignments.model.js
        delivery-location-logs.model.js
        orders.model.js
        payments.model.js
        expense-vouchers.model.js
        promotions.model.js
      db/
        pool.js
      utils/
        logger.js
        response.js
```

- `app.js`: Express app bootstrap, middleware setup, and route mounting
- `routes/`: maps HTTP endpoints to controller handlers
- `controllers/`: request validation/parsing and HTTP responses
- `services/`: business rules and transaction flow
- `models/`: database access (SQL/query layer)
- `db/pool.js`: PostgreSQL connection pool configuration
- `utils/`: shared helpers (logging and response formatting)

---

## Authentication

All endpoints require a Bearer token in the `Authorization` header.

```
Authorization: Bearer <jwt_token>
```

Requests without a Bearer token return:

| HTTP Status | Error Code | Meaning |
|-------------|------------|---------|
| 401 | `UNAUTHORIZED` | Missing or malformed Bearer header |

Current implementation note: token signature/claims verification is not enforced yet (middleware currently checks header format and non-empty token only).

---

## Error Handling

All endpoints return a consistent error envelope:

```json
{
  "error_code": "VALIDATION_ERROR",
  "message": "Invalid input",
  "field_errors": [
    {
      "field": "requestBody.customer_code",
      "reason": "not found"
    }
  ]
}
```

| HTTP Status | Error Code | Meaning |
|-------------|------------|---------|
| 400 | `VALIDATION_ERROR` | Invalid input, constraint violation, or status-gated mutation blocked |
| 401 | `UNAUTHORIZED` | Missing or invalid Authorization header |
| 403 | `FORBIDDEN` | Valid token but action not permitted |
| 404 | `NOT_FOUND` | The referenced resource does not exist |
| 500 | `SERVER_ERROR` | Unexpected server-side failure |

---

## Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/addresses` | Retrieve addresses using optional filters |
| POST | `/api/v1/addresses` | Create a new address |
| PUT | `/api/v1/addresses/{address_id}` | Update an address |
| DELETE | `/api/v1/addresses/{address_id}` | Delete an address when unused |
| GET | `/api/v1/profiles` | Retrieve profiles using optional filters |
| POST | `/api/v1/profiles` | Create a new profile |
| PUT | `/api/v1/profiles/{profile_id}` | Update a profile |
| DELETE | `/api/v1/profiles/{profile_id}` | Delete a profile when unused |
| GET | `/api/v1/customers` | Retrieve customers using optional filters |
| POST | `/api/v1/customers` | Create a new customer |
| PUT | `/api/v1/customers/{customer_code}` | Update a customer |
| DELETE | `/api/v1/customers/{customer_code}` | Delete a customer when allowed |
| GET | `/api/v1/deliverers` | Retrieve deliverers using optional filters |
| POST | `/api/v1/deliverers` | Create a new deliverer |
| PUT | `/api/v1/deliverers/{deliverer_code}` | Update a deliverer |
| DELETE | `/api/v1/deliverers/{deliverer_code}` | Delete a deliverer when allowed |
| GET | `/api/v1/stores` | Retrieve stores using optional filters |
| POST | `/api/v1/stores` | Create a new store |
| PUT | `/api/v1/stores/{store_code}` | Update a store |
| DELETE | `/api/v1/stores/{store_code}` | Delete a store when allowed |
| GET | `/api/v1/store-products` | Retrieve store products using optional filters |
| POST | `/api/v1/store-products` | Create a new store product |
| PUT | `/api/v1/store-products/{product_id}` | Update a store product |
| DELETE | `/api/v1/store-products/{product_id}` | Delete a store product when allowed |
| GET | `/api/v1/favorite-stores` | Retrieve favourite store links |
| POST | `/api/v1/favorite-stores` | Create a favourite store link |
| PUT | `/api/v1/favorite-stores/{customer_code}/{store_code}` | Replace a favourite store link |
| DELETE | `/api/v1/favorite-stores/{customer_code}/{store_code}` | Delete a favourite store link |
| GET | `/api/v1/reviews` | Retrieve reviews using optional filters |
| POST | `/api/v1/reviews` | Create a new review |
| PUT | `/api/v1/reviews/{review_id}` | Update a review |
| DELETE | `/api/v1/reviews/{review_id}` | Delete a review |
| GET | `/api/v1/deliveries` | Retrieve deliveries using optional filters |
| POST | `/api/v1/deliveries` | Create a new delivery |
| PUT | `/api/v1/deliveries/{delivery_id}` | Update a delivery |
| DELETE | `/api/v1/deliveries/{delivery_id}` | Delete a delivery when allowed |
| GET | `/api/v1/dispatch-assignments` | Retrieve dispatch assignments using optional filters |
| POST | `/api/v1/dispatch-assignments` | Create a new dispatch assignment |
| PUT | `/api/v1/dispatch-assignments/{assignment_id}` | Update a dispatch assignment |
| DELETE | `/api/v1/dispatch-assignments/{assignment_id}` | Delete a dispatch assignment (PENDING only) |
| GET | `/api/v1/delivery-location-logs` | Retrieve delivery location logs |
| POST | `/api/v1/delivery-location-logs` | Create a new delivery location log |
| PUT | `/api/v1/delivery-location-logs/{location_log_id}` | Correct a location log entry |
| DELETE | `/api/v1/delivery-location-logs/{location_log_id}` | Remove an invalid location log entry |
| GET | `/api/v1/orders` | Retrieve orders for a customer |
| POST | `/api/v1/orders` | Create a new order with line items |
| PUT | `/api/v1/orders/{order_code}` | Update an order and replace its line items |
| DELETE | `/api/v1/orders/{order_code}` | Delete an order (PENDING only) |
| GET | `/api/v1/payments` | Retrieve payments for a deliverer |
| POST | `/api/v1/payments` | Create a new payment with line items |
| PUT | `/api/v1/payments/{payment_code}` | Update a payment (PENDING only) |
| DELETE | `/api/v1/payments/{payment_code}` | Delete a payment (PENDING only) |
| GET | `/api/v1/expense-vouchers` | Retrieve expense vouchers for a deliverer |
| POST | `/api/v1/expense-vouchers` | Create a new expense voucher with items |
| PUT | `/api/v1/expense-vouchers/{voucher_code}` | Update a voucher (DRAFT only) |
| DELETE | `/api/v1/expense-vouchers/{voucher_code}` | Delete a voucher (DRAFT only) |
| GET | `/api/v1/promotions` | Retrieve promotions for a store |
| POST | `/api/v1/promotions` | Create a new promotion with items |
| PUT | `/api/v1/promotions/{promotion_code}` | Update a promotion and replace its items |
| DELETE | `/api/v1/promotions/{promotion_code}` | Delete a promotion and all its items |

---

## Order API

**Base endpoint:** `/api/v1/orders`

Manages `Order` headers together with their `Order_Items` line items in a single API.

---

### GET `/api/v1/orders`
Retrieve orders for a given customer.

**Query Parameters**

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| order_code | string | No | Order unique code filter | Must exist in Order.code if provided |
| customer_code | string | No | Customer unique code filter | Must exist in Customer.code if provided |

**Response — Success**

*Order Header (OrderOutput)*

| Field | Type | Description |
|-------|------|-------------|
| order_id | integer | Order internal ID |
| customer_id | integer | Customer identifier |
| store_id | integer | Store identifier |
| order_code | string | Human-readable order code (e.g. ORD-2026-000123) |
| order_date | datetime (ISO 8601) | Order creation timestamp |
| total_price | number (decimal) | Total order amount (client-provided) |
| address_snapshot | string | Delivery address snapshot |
| status | string (enum) | pending / confirmed / preparing / picked_up / delivering / delivered / cancelled |
| order_items | array of OrderItemOutput | Line items |

*Order Line Items (OrderItemOutput)*

| Field | Type | Description |
|-------|------|-------------|
| order_item_id | integer | Line item internal ID |
| order_id | integer | Parent order ID |
| product_id | integer | Product identifier |
| quantity | number (decimal) | Quantity ordered |
| unit_price | number (decimal) | Price per unit at order time |
| extend_price | number (decimal) | quantity × unit_price (client-provided) |

---

### POST `/api/v1/orders`
Create a new order together with its line items.

**Request Body**

*Order Header*

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| customer_code | string | Yes | Customer unique code | Must exist in Customer.code |
| store_code | string | Yes | Store unique code | Must exist in Store.code |
| address_snapshot | string | Yes | Delivery address snapshot | Must not be blank |
| total_price | number (decimal) | Yes | Total order amount — **calculated by frontend** | Must be >= 0 |

*Order Items (array — must have >= 1 item)*

> **Note:** `updated_at` on each order item is set automatically by the server on insert and update — do not include it in the request body.

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| product_id | integer | Yes | Product ID | Must exist in Store_Products.id |
| quantity | number (float) | Yes | Quantity to order | Must be > 0 |
| unit_price | number (decimal) | Yes | Unit price at order time | Must be >= 0 |
| extend_price | number (decimal) | Yes | quantity × unit_price — **calculated by frontend** | Must be >= 0 |

**Response — Success:** `OrderOutput` (same structure as GET)

---

### PUT `/api/v1/orders/{order_code}`
Update an existing order and replace its line items.

**Path Parameters**

| Parameter | Type | Required | Validation |
|-----------|------|----------|------------|
| order_code | string | Yes | Must exist in Order.code |

**Request Body**

*Order Header (updatable fields)*

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| status | string (enum) | No | New order status | One of: pending / confirmed / cancelled |
| address_snapshot | string | No | Updated delivery address | Allowed only if status is PENDING |
| total_price | number (decimal) | No | Updated total — **recalculated by frontend** | Must be >= 0 if provided |

*Order Items (array — replaces existing items if provided)*

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| product_id | integer | Yes (if array provided) | Product ID | Must exist in Store_Products.id |
| quantity | number (float) | Yes (if array provided) | Quantity | Must be > 0 |
| unit_price | number (decimal) | Yes (if array provided) | Unit price | Must be >= 0 |
| extend_price | number (decimal) | Yes (if array provided) | quantity × unit_price — **calculated by frontend** | Must be >= 0 |

**Response — Success:** `OrderOutput`

---

### DELETE `/api/v1/orders/{order_code}`
Cancel and delete an order. **Only allowed when status is PENDING.**

**Path Parameters**

| Parameter | Type | Required | Validation |
|-----------|------|----------|------------|
| order_code | string | Yes | Must exist in Order.code; status must be PENDING |

**Response — Success (200 OK)**

| Field | Type | Example |
|-------|------|---------|
| message | string | Order ORD-2026-000123 deleted successfully |

---

## Payment API

**Base endpoint:** `/api/v1/payments`

Manages `Payment` headers together with their `Payment_Items` line items in a single API.

---

### GET `/api/v1/payments`
Retrieve payments for a given deliverer within an optional period.

**Query Parameters**

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| deliverer_code | string | No | Deliverer unique code filter | Must exist in Deliverer.code if provided |
| payment_period_start | date (YYYY-MM-DD) | No | Filter period start | Must be a valid date if provided |
| payment_period_end | date (YYYY-MM-DD) | No | Filter period end | Must be >= payment_period_start if provided |

**Response — Success**

*Payment Header (PaymentOutput)*

| Field | Type | Description |
|-------|------|-------------|
| payment_id | integer | Payment internal ID |
| delivery_id | integer | Associated delivery |
| payment_code | string | Human-readable payment code (e.g. PAY-2026-000456) |
| payment_period_start | date (YYYY-MM-DD) | Payment period start |
| payment_period_end | date (YYYY-MM-DD) | Payment period end |
| total_payment | number (decimal) | Total payment amount (client-provided) |
| status | string (enum) | pending / paid / cancelled / failed / processing / completed |
| payment_datetime | datetime (ISO 8601) | Actual payment timestamp |
| payment_items | array of PaymentItemOutput | Breakdown items |

*Payment Line Items (PaymentItemOutput)*

| Field | Type | Description |
|-------|------|-------------|
| payment_item_id | integer | Line item internal ID |
| payment_id | integer | Parent payment ID |
| order_id | integer | Associated order |
| delivery_fee | number (decimal) | Delivery fee for this order |
| bonus | number (decimal) | Bonus amount |
| adjustment_amount | number (decimal) | Manual adjustment (positive = addition, negative = deduction) |

---

### POST `/api/v1/payments`
Create a new payment record together with its line items.

**Request Body**

*Payment Header*

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| delivery_id | integer | Yes | Associated delivery | Must exist in Delivery.id |
| payment_period_start | date (YYYY-MM-DD) | Yes | Payment period start | Must be a valid date |
| payment_period_end | date (YYYY-MM-DD) | Yes | Payment period end | Must be > payment_period_start |
| total_payment | number (decimal) | Yes | Sum of all item amounts — **calculated by frontend** | Must be >= 0 |
| payment_datetime | datetime (ISO 8601) | Yes | Actual payment timestamp | Must be a valid datetime |

*Payment Items (array — must have ≥ 1 item)*

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| order_code | string | Yes | Order unique code | Must exist in Order.code |
| delivery_fee | number (decimal) | Yes | Delivery fee | Must be >= 0 |
| bonus | number (decimal) | Yes | Bonus amount | Must be >= 0 |
| adjustment_amount | number (decimal) | No | Manual adjustment | Positive or negative; defaults to 0 |

**Response — Success:** `PaymentOutput`

---

### PUT `/api/v1/payments/{payment_code}`
Update an existing payment and replace its line items. **Only allowed when status is PENDING.**

**Path Parameters**

| Parameter | Type | Required | Validation |
|-----------|------|----------|------------|
| payment_code | string | Yes | Must exist in Payment.code; status must be PENDING |

**Request Body**

*Payment Header (updatable fields)*

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| payment_period_start | date (YYYY-MM-DD) | No | Payment period start | Must be a valid date |
| payment_period_end | date (YYYY-MM-DD) | No | Payment period end | Must be > payment_period_start |
| status | string (enum) | No | New payment status | One of: pending / paid / cancelled |
| total_payment | number (decimal) | No | Updated total — **recalculated by frontend** | Must be >= 0 if provided |

*Payment Items (array — replaces existing items if provided)*

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| order_code | string | Yes (if array provided) | Order unique code | Must exist in Order.code |
| delivery_fee | number (decimal) | Yes (if array provided) | Delivery fee | Must be >= 0 |
| bonus | number (decimal) | Yes (if array provided) | Bonus amount | Must be >= 0 |
| adjustment_amount | number (decimal) | No | Manual adjustment | Positive or negative |

**Response — Success:** `PaymentOutput`

---

### DELETE `/api/v1/payments/{payment_code}`
Delete a payment record. **Only allowed when status is PENDING.**

**Path Parameters**

| Parameter | Type | Required | Validation |
|-----------|------|----------|------------|
| payment_code | string | Yes | Must exist in Payment.code; status must be PENDING |

**Response — Success (200 OK)**

| Field | Type | Example |
|-------|------|---------|
| message | string | Payment PAY-2026-000456 deleted successfully |

---

## Expense Voucher API

**Base endpoint:** `/api/v1/expense-vouchers`

Manages `Expense_Voucher` headers together with their `Expense_Voucher_Items` line items in a single API.

---

### GET `/api/v1/expense-vouchers`
Retrieve expense vouchers for a given deliverer.

**Query Parameters**

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| deliverer_code | string | No | Deliverer unique code | Must exist in Deliverer.code if provided |
| voucher_date | date (YYYY-MM-DD) | No | Filter by voucher date | Must be a valid date if provided |

**Response — Success**

*Expense Voucher Header (ExpenseVoucherOutput)*

| Field | Type | Description |
|-------|------|-------------|
| expense_voucher_id | integer | Voucher internal ID |
| delivery_id | integer | Associated delivery |
| voucher_code | string | Human-readable voucher code (e.g. EXP-2026-000789) |
| voucher_date | date (YYYY-MM-DD) | Date of voucher |
| status | string (enum) | draft / submitted / approved / rejected / paid |
| total_amount | number (decimal) | Sum of all item amounts (client-provided) |
| updated_at | datetime (ISO 8601) | Last update timestamp |
| expense_items | array of ExpenseVoucherItemOutput | Expense line items |

*Expense Voucher Line Items (ExpenseVoucherItemOutput)*

| Field | Type | Description |
|-------|------|-------------|
| expense_item_id | integer | Line item internal ID |
| expense_voucher_id | integer | Parent voucher ID |
| expense_type | string (enum) | fuel / maintenance / toll / other |
| description | string | Expense description |
| amount | number (decimal) | Expense amount |
| receipt_reference_code | string / null | Receipt reference code |

---

### POST `/api/v1/expense-vouchers`
Create a new expense voucher. Status defaults to **draft** on creation. The `status` column has a database-level DEFAULT of `'draft'`.

**Request Body**

*Expense Voucher Header*

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| delivery_id | integer | Yes | Associated delivery | Must exist in Delivery.id |
| voucher_date | date (YYYY-MM-DD) | Yes | Date of voucher | Must be valid; cannot be a future date |
| total_amount | number (decimal) | Yes | Sum of all items — **calculated by frontend** | Must be >= 0 |

*Expense Items (array — must have ≥ 1 item)*

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| expense_type | string (enum) | Yes | Category | One of: fuel / maintenance / toll / other |
| description | string | Yes | Expense description | Must not be blank |
| amount | number (decimal) | Yes | Expense amount | Must be > 0 |
| receipt_reference_code | string | No | Receipt reference code | Must be unique if provided |

**Response — Success:** `ExpenseVoucherOutput`

---

### PUT `/api/v1/expense-vouchers/{voucher_code}`
Update an existing expense voucher. **Only allowed when status is DRAFT.**

**Path Parameters**

| Parameter | Type | Required | Validation |
|-----------|------|----------|------------|
| voucher_code | string | Yes | Must exist in Expense_Voucher.code; status must be DRAFT |

**Request Body**

*Expense Voucher Header (updatable fields)*

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| voucher_date | date (YYYY-MM-DD) | No | Date of voucher | Cannot be a future date |
| status | string (enum) | No | New voucher status | One of: draft / submitted |
| total_amount | number (decimal) | No | Updated total — **recalculated by frontend** | Must be >= 0 if provided |

*Expense Items (array — replaces existing items if provided)*

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| expense_type | string (enum) | Yes (if array provided) | Category | One of: fuel / maintenance / toll / other |
| description | string | Yes (if array provided) | Expense description | Must not be blank |
| amount | number (decimal) | Yes (if array provided) | Expense amount | Must be > 0 |
| receipt_reference_code | string | No | Receipt reference code | Must be unique if provided |

**Response — Success:** `ExpenseVoucherOutput`

---

### DELETE `/api/v1/expense-vouchers/{voucher_code}`
Delete an expense voucher and all its line items. **Only allowed when status is DRAFT.**

**Path Parameters**

| Parameter | Type | Required | Validation |
|-----------|------|----------|------------|
| voucher_code | string | Yes | Must exist in Expense_Voucher.code; status must be DRAFT |

**Response — Success (200 OK)**

| Field | Type | Example |
|-------|------|---------|
| message | string | Expense Voucher EXP-2026-000789 deleted successfully |

---

## Promotion API

**Base endpoint:** `/api/v1/promotions`

Manages `Promotion` headers together with their `Promotion_Items` line items in a single API.

---

### GET `/api/v1/promotions`
Retrieve promotions for a given store.

**Query Parameters**

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| store_code | string | Yes | Store unique code | Must exist in Store.code |

**Response — Success**

*Promotion Header (PromotionOutput)*

| Field | Type | Description |
|-------|------|-------------|
| promotion_id | integer | Promotion internal ID |
| store_id | integer | Store identifier |
| promotion_code | string | Human-readable promo code (e.g. PROMO-0001) |
| name | string | Promotion name |
| start_date | date (YYYY-MM-DD) | Promotion start date |
| end_date | date (YYYY-MM-DD) | Promotion end date |
| discount_type | string (enum) | percentage / fixed_amount |
| promotion_items | array of PromotionItemOutput | Products in this promotion |

*Promotion Line Items (PromotionItemOutput)*

| Field | Type | Description |
|-------|------|-------------|
| promotion_item_id | integer | Line item internal ID |
| promotion_id | integer | Parent promotion ID |
| product_id | integer | Product identifier |
| discount_value | number (decimal) | Discount amount or percentage |

---

### POST `/api/v1/promotions`
Create a new promotion together with its line items.

**Request Body**

*Promotion Header*

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| store_code | string | Yes | Store unique code | Must exist in Store.code |
| name | string | Yes | Promotion name | Must not be blank |
| start_date | date (YYYY-MM-DD) | Yes | Promotion start date | Must be a valid date |
| end_date | date (YYYY-MM-DD) | Yes | Promotion end date | Must be >= start_date |
| discount_type | string (enum) | Yes | Discount type | One of: percentage / fixed_amount |

*Promotion Items (array — must have ≥ 1 item)*

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| product_id | integer | Yes | Product identifier | Must exist in Store_Products for the given store |
| discount_value | number (decimal) | Yes | Discount amount or rate | Must be > 0; if discount_type is percentage, must be <= 100 |

**Response — Success:** `PromotionOutput`

---

### PUT `/api/v1/promotions/{promotion_code}`
Update an existing promotion and replace its line items.

**Path Parameters**

| Parameter | Type | Required | Validation |
|-----------|------|----------|------------|
| promotion_code | string | Yes | Must exist in Promotion.code |

**Request Body**

*Promotion Header (updatable fields)*

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| name | string | No | Promotion name | Must not be blank if provided |
| start_date | date (YYYY-MM-DD) | No | Promotion start date | Must be a valid date |
| end_date | date (YYYY-MM-DD) | No | Promotion end date | Must be >= start_date |
| discount_type | string (enum) | No | Discount type | One of: percentage / fixed_amount |

*Promotion Items (array — replaces existing items if provided)*

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| product_id | integer | Yes (if array provided) | Product identifier | Must exist in Store_Products |
| discount_value | number (decimal) | Yes (if array provided) | Discount amount or rate | Must be > 0; percentage must be <= 100 |

**Response — Success:** `PromotionOutput`

---

### DELETE `/api/v1/promotions/{promotion_code}`
Delete a promotion and all its line items.

**Path Parameters**

| Parameter | Type | Required | Validation |
|-----------|------|----------|------------|
| promotion_code | string | Yes | Must exist in Promotion.code |

**Response — Success (200 OK)**

| Field | Type | Example |
|-------|------|---------|
| message | string | Promotion PROMO-0001 deleted successfully |

---

## Address API

**Base endpoint:** `/api/v1/addresses`

---

### GET `/api/v1/addresses`

**Query Parameters**

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| address_id | integer | No | Specific address identifier | Must exist if provided |
| address_type | string | No | Address type filter | Free text match |
| city | string | No | City filter | Free text match |
| country_code | string | No | ISO country code filter | Must be 2 characters if provided |

**Response — Success (AddressOutput)**

| Field | Type | Description |
|-------|------|-------------|
| address_id | integer | Address internal ID |
| address_name | string | Address label |
| address_type | string | Address type classification |
| address_line_1 | string | First line |
| address_line_2 | string | Second address line (blank if unused) |
| city | string | City name |
| province | string | Province or state |
| country_code | string | ISO 3166-1 alpha-2 (e.g. TH) |
| latitude | number | Latitude coordinate (0 if unknown) |
| longitude | number | Longitude coordinate (0 if unknown) |

---

### POST `/api/v1/addresses`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| address_name | string | Yes | Must not be blank |
| address_type | string | Yes | Must not be blank |
| address_line_1 | string | Yes | Must not be blank |
| address_line_2 | string | No | Optional |
| city | string | Yes | Must not be blank |
| province | string | No | Optional |
| country_code | string | Yes | Must be 2 characters |
| latitude | number | No | -90 to 90 if provided |
| longitude | number | No | -180 to 180 if provided |

**Response:** `AddressOutput`

---

### PUT `/api/v1/addresses/{address_id}`

All fields optional; same validations apply as POST when provided.

**Response:** `AddressOutput`

---

### DELETE `/api/v1/addresses/{address_id}`

Blocked when address is referenced by a Customer or Store.

**Response:** `{ "message": "Address 12 deleted successfully" }`

---

## Profile API

**Base endpoint:** `/api/v1/profiles`

---

### GET `/api/v1/profiles`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| profile_id | integer | No | Must exist if provided |
| email | string | No | Valid email format if provided |
| phone | string | No | Free text match |

**Response — Success (ProfileOutput)**

| Field | Type | Description |
|-------|------|-------------|
| profile_id | integer | Profile internal ID |
| full_name | string | Full name |
| phone | string | Contact phone |
| email | string | Contact email |
| created_at | datetime | Creation timestamp |

---

### POST `/api/v1/profiles`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| full_name | string | Yes | Must not be blank |
| phone | string | Yes | Must not be blank |
| email | string | Yes | Must be a valid email |

**Response:** `ProfileOutput`

---

### PUT `/api/v1/profiles/{profile_id}`

All fields optional; same validations when provided.

**Response:** `ProfileOutput`

---

### DELETE `/api/v1/profiles/{profile_id}`

Blocked when profile is referenced by a Customer or Deliverer.

**Response:** `{ "message": "Profile 18 deleted successfully" }`

---

## Customer API

**Base endpoint:** `/api/v1/customers`

---

### GET `/api/v1/customers`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| customer_code | string | No | Must exist if provided |
| membership_level | string (enum) | No | Bronze / Silver / Gold / Platinum |
| profile_id | integer | No | Must exist if provided |

**Response — Success (CustomerOutput)**

| Field | Type | Description |
|-------|------|-------------|
| customer_id | integer | Customer internal ID |
| profile_id | integer | Related profile |
| customer_code | string | Business code (e.g. CUST-0001) |
| address_id | integer | Default address |
| membership_level | string (enum) | Bronze / Silver / Gold / Platinum |
| total_spent | number | Cumulative spend |
| created_at | datetime | Creation timestamp |

---

### POST `/api/v1/customers`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| profile_id | integer | Yes | Must exist; unused by another customer |
| address_id | integer | No* | Must exist in Address (*required if inline address fields not provided) |
| address_name | string | No* | Address label (*required if address_id not provided) |
| address_type | string | No* | Address type classification (*required if address_id not provided) |
| address_line_1 | string | No* | Street address (*required if address_id not provided) |
| address_line_2 | string | No | Second address line |
| city | string | No* | City name (*required if address_id not provided) |
| province | string | No | Province or state |
| country_code | string | No* | ISO 3166-1 alpha-2 (*required if address_id not provided) | Must be 2 characters |
| latitude | number | No | -90 to 90 if provided |
| longitude | number | No | -180 to 180 if provided |
| membership_level | string (enum) | No | Bronze / Silver / Gold / Platinum; defaults to Bronze if omitted |

**Response:** `CustomerOutput`

---

### PUT `/api/v1/customers/{customer_code}`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| address_id | integer | No | Must exist in Address if provided |
| address_name | string | No | Address label (used only when updating the linked address inline) |
| address_type | string | No | Address type classification |
| address_line_1 | string | No | Street address |
| address_line_2 | string | No | Second address line |
| city | string | No | City name |
| province | string | No | Province or state |
| country_code | string | No | Must be 2 characters if provided |
| latitude | number | No | -90 to 90 if provided |
| longitude | number | No | -180 to 180 if provided |
| membership_level | string (enum) | No | Bronze / Silver / Gold / Platinum |

**Response:** `CustomerOutput`

---

### DELETE `/api/v1/customers/{customer_code}`

Blocked when customer has orders, reviews, or favourite stores.

**Response:** `{ "message": "Customer CUST-0001 deleted successfully" }`

---

## Deliverer API

**Base endpoint:** `/api/v1/deliverers`

---

### GET `/api/v1/deliverers`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| deliverer_code | string | No | Must exist if provided |
| current_status | string (enum) | No | available / busy / offline |
| vehicle_type | string | No | Free text match |

**Response — Success (DelivererOutput)**

| Field | Type | Description |
|-------|------|-------------|
| deliverer_id | integer | Deliverer internal ID |
| profile_id | integer | Related profile |
| deliverer_code | string | Business code (e.g. DLV-0001) |
| vehicle_type | string | Vehicle type |
| license_plate | string | Vehicle registration |
| current_status | string (enum) | available / busy / offline |
| rating | number | Average rating (0 if none yet) |
| created_at | datetime | Creation timestamp |

---

### POST `/api/v1/deliverers`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| profile_id | integer | Yes | Must exist; unused by another deliverer |
| vehicle_type | string | Yes | Must not be blank |
| license_plate | string | Yes | Must be unique |
| current_status | string (enum) | No | Defaults to offline if omitted |

**Response:** `DelivererOutput`

---

### PUT `/api/v1/deliverers/{deliverer_code}`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| vehicle_type | string | No | Must not be blank if provided |
| license_plate | string | No | Must be unique if provided |
| current_status | string (enum) | No | available / busy / offline |

**Response:** `DelivererOutput`

---

### DELETE `/api/v1/deliverers/{deliverer_code}`

Blocked when deliverer has deliveries, assignments, payments, or expense vouchers.

**Response:** `{ "message": "Deliverer DLV-0001 deleted successfully" }`

---

## Store API

**Base endpoint:** `/api/v1/stores`

---

### GET `/api/v1/stores`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| store_code | string | No | Must exist if provided |
| category | string | No | Free text match |
| status | string (enum) | No | active / inactive / suspended |

**Response — Success (StoreOutput)**

| Field | Type | Description |
|-------|------|-------------|
| store_id | integer | Store internal ID |
| name | string | Store display name |
| address_id | integer | Store address |
| store_code | string | Business code (e.g. STR-0001) |
| category | string | Store category |
| rating | number | Average rating (0 if none yet) |
| status | string (enum) | active / inactive / suspended |
| updated_at | datetime | Last update timestamp |

---

### POST `/api/v1/stores`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | string | Yes | Unique; must not be blank |
| address_id | integer | No* | Must exist in Address (*required if inline address fields not provided) |
| address_name | string | No* | Address label (*required if address_id not provided) |
| address_type | string | No* | Address type classification (*required if address_id not provided) |
| address_line_1 | string | No* | Street address (*required if address_id not provided) |
| address_line_2 | string | No | Second address line |
| city | string | No* | City name (*required if address_id not provided) |
| province | string | No | Province or state |
| country_code | string | No* | ISO 3166-1 alpha-2 (*required if address_id not provided) | Must be 2 characters |
| latitude | number | No | -90 to 90 if provided |
| longitude | number | No | -180 to 180 if provided |
| category | string | Yes | Must not be blank |
| status | string (enum) | No | Defaults to inactive if omitted |

**Response:** `StoreOutput`

---

### PUT `/api/v1/stores/{store_code}`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | string | No | Unique if provided |
| address_id | integer | No | Must exist in Address if provided |
| address_name | string | No | Address label (used only when updating the linked address inline) |
| address_type | string | No | Address type classification |
| address_line_1 | string | No | Street address |
| address_line_2 | string | No | Second address line |
| city | string | No | City name |
| province | string | No | Province or state |
| country_code | string | No | Must be 2 characters if provided |
| latitude | number | No | -90 to 90 if provided |
| longitude | number | No | -180 to 180 if provided |
| category | string | No | Must not be blank if provided |
| status | string (enum) | No | active / inactive / suspended |

**Response:** `StoreOutput`

---

### DELETE `/api/v1/stores/{store_code}`

Blocked when store has products, promotions, favourite links, or orders.

**Response:** `{ "message": "Store STR-0001 deleted successfully" }`

---

## Store Product API

**Base endpoint:** `/api/v1/store-products`

> **Note:** `Store_Products` has no business code column in the database. Path parameters use the integer `product_id`.

---

### GET `/api/v1/store-products`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| product_id | integer | No | Must exist if provided |
| store_code | string | No | Must exist in Store.code if provided |
| status | string (enum) | No | available / out_of_stock / discontinued / unavailable |

**Response — Success (StoreProductOutput)**

| Field | Type | Description |
|-------|------|-------------|
| product_id | integer | Product internal ID |
| store_id | integer | Owning store |
| name | string | Product name |
| unit_price | number | Selling price per unit |
| status | string (enum) | available / out_of_stock / discontinued / unavailable |
| updated_at | datetime | Last update |

---

### POST `/api/v1/store-products`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| store_code | string | Yes | Must exist in Store.code |
| name | string | Yes | Must not be blank |
| unit_price | number | Yes | Must be >= 0 |
| status | string (enum) | No | Defaults to available |

**Response:** `StoreProductOutput`

---

### PUT `/api/v1/store-products/{product_id}`

**Path Parameters:** `product_id` (integer) — Must exist in Store_Products.id

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | string | No | Must not be blank if provided |
| unit_price | number | No | Must be >= 0 if provided |
| status | string (enum) | No | available / out_of_stock / discontinued / unavailable |

**Response:** `StoreProductOutput`

---

### DELETE `/api/v1/store-products/{product_id}`

**Path Parameters:** `product_id` (integer) — Blocked when product is referenced by an order item or promotion item.

**Response:** `{ "message": "Product 42 deleted successfully" }`

---

## Favorite Store API

**Base endpoint:** `/api/v1/favorite-stores`

---

### GET `/api/v1/favorite-stores`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| customer_code | string | No | Must exist if provided |
| store_code | string | No | Must exist if provided |

**Response — Success (FavoriteStoreOutput)**

| Field | Type | Description |
|-------|------|-------------|
| customer_id | integer | Customer identifier |
| store_id | integer | Store identifier |
| customer_code | string | Customer business code |
| store_code | string | Store business code |

---

### POST `/api/v1/favorite-stores`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| customer_code | string | Yes | Must exist in Customer.code |
| store_code | string | Yes | Must exist in Store.code |

**Response:** `FavoriteStoreOutput`

---

### PUT `/api/v1/favorite-stores/{customer_code}/{store_code}`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| new_customer_code | string | Yes | Must exist in Customer.code |
| new_store_code | string | Yes | Must exist; must not duplicate an existing favourite pair |

**Response:** `FavoriteStoreOutput`

---

### DELETE `/api/v1/favorite-stores/{customer_code}/{store_code}`

**Response:** `{ "message": "Favourite store CUST-0001/STR-0001 deleted successfully" }`

---

## Review API

**Base endpoint:** `/api/v1/reviews`

> **Schema note:** The `review` table is not yet present in the database schema. This table must be created before implementing these endpoints. Minimum required columns: `id`, `order_id` (FK → order), `customer_id` (FK → customer), `rating numeric NOT NULL`, `comment text`, `target character varying NOT NULL`, `created_at timestamp with time zone NOT NULL DEFAULT now()`.

---

### GET `/api/v1/reviews`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| review_id | integer | No | Must exist if provided |
| order_code | string | No | Must exist in Order.code if provided |
| customer_code | string | No | Must exist in Customer.code if provided |
| target | string (enum) | No | STORE / DELIVERER |

**Response — Success (ReviewOutput)**

| Field | Type | Description |
|-------|------|-------------|
| review_id | integer | Review internal ID |
| order_id | integer | Related order |
| customer_id | integer | Reviewing customer |
| rating | number | 1.0–5.0 |
| comment | string / null | Optional comment |
| target | string (enum) | STORE / DELIVERER |
| created_at | datetime | Creation timestamp |

---

### POST `/api/v1/reviews`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| order_code | string | Yes | Must exist and be eligible for review |
| customer_code | string | Yes | Must match the order |
| rating | number | Yes | 1–5 |
| comment | string | No | Optional |
| target | string (enum) | Yes | STORE / DELIVERER |

**Response:** `ReviewOutput`

---

### PUT `/api/v1/reviews/{review_id}`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| rating | number | No | 1–5 |
| comment | string | No | Optional |
| target | string (enum) | No | STORE / DELIVERER |

**Response:** `ReviewOutput`

---

### DELETE `/api/v1/reviews/{review_id}`

**Response:** `{ "message": "Review 44 deleted successfully" }`

---

## Delivery API

**Base endpoint:** `/api/v1/deliveries`

> **Note:** `Delivery` has no business code column in the database. Path parameters use the integer `delivery_id`.

---

### GET `/api/v1/deliveries`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| delivery_id | integer | No | Must exist if provided |
| order_code | string | No | Must exist in Order.code if provided |
| deliverer_code | string | No | Must exist in Deliverer.code if provided |

**Response — Success (DeliveryOutput)**

| Field | Type | Description |
|-------|------|-------------|
| delivery_id | integer | Delivery internal ID |
| order_id | integer | Related order |
| deliverer_id | integer | Assigned deliverer |
| delivery_type | string (enum) | Standard / Hurry / Express / Scheduled |
| pickup_time | datetime / null | Pickup timestamp |
| delivery_time | datetime / null | Delivery completion timestamp |
| delivery_fee | number | Delivery fee amount |

---

### POST `/api/v1/deliveries`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| order_code | string | Yes | Must exist; not already have a delivery |
| deliverer_code | string | Yes | Must exist in Deliverer.code |
| delivery_type | string (enum) | Yes | Standard / Hurry / Express / Scheduled |
| pickup_time | datetime | No | Valid datetime if provided |
| delivery_time | datetime | No | Must be >= pickup_time if both provided |
| delivery_fee | number | Yes | Must be >= 0 |

**Response:** `DeliveryOutput`

---

### PUT `/api/v1/deliveries/{delivery_id}`

**Path Parameters:** `delivery_id` (integer)

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| deliverer_code | string | No | Must exist if provided |
| delivery_type | string (enum) | No | Standard / Hurry / Express / Scheduled |
| pickup_time | datetime | No | Valid datetime if provided |
| delivery_time | datetime | No | Must be >= pickup_time if both known |
| delivery_fee | number | No | Must be >= 0 if provided |

**Response:** `DeliveryOutput`

---

### DELETE `/api/v1/deliveries/{delivery_id}`

**Path Parameters:** `delivery_id` (integer) — Blocked when related payments or expense vouchers exist.

**Response:** `{ "message": "Delivery 21 deleted successfully" }`

---

## Dispatch Assignment API

**Base endpoint:** `/api/v1/dispatch-assignments`

---

### GET `/api/v1/dispatch-assignments`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| assignment_id | integer | No | Must exist if provided |
| order_code | string | No | Must exist in Order.code if provided |
| deliverer_code | string | No | Must exist in Deliverer.code if provided |
| status | string (enum) | No | pending / accepted / rejected / expired |

**Response — Success (DispatchAssignmentOutput)**

| Field | Type | Description |
|-------|------|-------------|
| assignment_id | integer | Assignment internal ID |
| order_id | integer | Target order |
| deliverer_id | integer | Offered deliverer |
| order_code | string | Target order business code |
| deliverer_code | string | Offered deliverer business code |
| status | string (enum) | pending / accepted / rejected / expired |
| assigned_at | datetime | Assignment creation timestamp |
| responded_at | datetime / null | Deliverer response timestamp |

---

### POST `/api/v1/dispatch-assignments`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| order_code | string | Yes | Must exist; must be dispatchable |
| deliverer_code | string | Yes | Must exist; must be AVAILABLE |

**Response:** `DispatchAssignmentOutput`

---

### PUT `/api/v1/dispatch-assignments/{assignment_id}`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| status | string (enum) | Yes | pending / accepted / rejected / expired |
| responded_at | datetime | No | Valid datetime if provided |

**Response:** `DispatchAssignmentOutput`

---

### DELETE `/api/v1/dispatch-assignments/{assignment_id}`

**Only allowed when status is PENDING.**

**Response:** `{ "message": "Dispatch Assignment 61 deleted successfully" }`

---

## Delivery Location Log API

**Base endpoint:** `/api/v1/delivery-location-logs`

---

### GET `/api/v1/delivery-location-logs`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| location_log_id | integer | No | Must exist if provided |
| deliverer_code | string | No | Must exist if provided |
| captured_from | datetime | No | Valid datetime if provided |
| captured_to | datetime | No | Must be >= captured_from if provided |

**Response — Success (DeliveryLocationLogOutput)**

| Field | Type | Description |
|-------|------|-------------|
| location_log_id | integer | Log internal ID |
| deliverer_id | integer | Tracked deliverer |
| deliverer_code | string | Tracked deliverer business code |
| latitude | number | Captured latitude |
| longitude | number | Captured longitude |
| capture_at | datetime | Capture timestamp |

---

### POST `/api/v1/delivery-location-logs`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| deliverer_code | string | Yes | Must exist in Deliverer.code |
| latitude | number | Yes | -90 to 90 |
| longitude | number | Yes | -180 to 180 |
| capture_at | datetime | No | Defaults to server time |

**Response:** `DeliveryLocationLogOutput`

---

### PUT `/api/v1/delivery-location-logs/{location_log_id}`

Administrative data repair only.

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| latitude | number | No | -90 to 90 |
| longitude | number | No | -180 to 180 |
| capture_at | datetime | No | Valid datetime |

**Response:** `DeliveryLocationLogOutput`

---

### DELETE `/api/v1/delivery-location-logs/{location_log_id}`

Administrative cleanup only.

**Response:** `{ "message": "Delivery Location Log 105 deleted successfully" }`

---

## Status Lifecycle Reference

### Order Status
```
pending → confirmed → preparing → picked_up → delivering → delivered
        └──────────────────────────────────────────────→ cancelled
```
- PUT allows: pending / confirmed / cancelled
- DELETE allowed from: pending only

### Payment Status
```
pending → processing → paid / completed
        └───────────→ failed
        └───────────→ cancelled
```
- PUT allowed from: pending only
- DELETE allowed from: pending only

### Expense Voucher Status
```
draft → submitted → approved
                 └→ rejected
```
- PUT allowed from: draft only (can transition to submitted)
- DELETE allowed from: draft only

### Dispatch Assignment Status
```
pending → accepted
        → rejected
        → expired
```

---

## Shared Error Response

```json
{
  "error_code": "VALIDATION_ERROR | NOT_FOUND | UNAUTHORIZED | FORBIDDEN | SERVER_ERROR",
  "message": "Human-readable summary",
  "field_errors": [
    {
      "field": "requestBody.field_name",
      "reason": "description of what is wrong"
    }
  ]
}
```

`field_errors` supports dot notation for nested fields (e.g. `requestBody.order_items[0].extend_price`).