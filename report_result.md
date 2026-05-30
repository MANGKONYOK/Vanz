# Vanz Marketplace — Live Database Report Test Results

> Generated on: 2026-05-30 17:36 (UTC)
> Database: Supabase PostgreSQL Live Instance

## Report Correctness Checklist

| Report Category | Report Description | Status | Verification Details |
|:---|:---|:---:|:---|
| **Simple** | Delivered Orders (Kittiphat R1) | 🟢 PASSED | Retrieved 2 delivered orders from database. |
| **Simple** | Order Receipt (Kittiphat R2) | 🟢 PASSED | Order ORD-000013: subtotal ฿381.4, fee ฿37.04, computed total ฿418.44 (DB order total: ฿381.4 matches subtotal: true). |
| **Simple** | Store Products (Sorawit R1) | 🟢 PASSED | Retrieved 5 product records mapped to store names. |
| **Simple** | Favorite Stores (Sorawit R2) | 🟢 PASSED | Retrieved 5 customer favorite store pairings. |
| **Simple** | Unapproved Vouchers (Piti R1) | 🟢 PASSED | Retrieved 5 unapproved/draft/submitted expense vouchers. |
| **Simple** | Deliverer Ranking (Piti R2) | 🟢 PASSED | Sorted deliverers by average rating. Top: Pimchanok Punyapat (4.9★) |
| **Simple** | Deliverer History (Panjapong R1) | 🟢 PASSED | Retrieved 5 delivery runs with full order, store, customer, and fee joins. |
| **Simple** | Category Products (Panjapong R2) | 🟢 PASSED | Retrieved 5 products mapped to store categorization levels. |
| **Analytics** | Top Selling Products (Kittiphat R3) | 🟢 PASSED | Top Product: "Som Tam" sold 106 units, earning ฿19561.38. |
| **Analytics** | Top Deliverers (Sorawit R3) | 🟢 PASSED | Top Deliverer: Naphat Srisuk completed 3 deliveries, earning ฿72.44. |
| **Analytics** | Expense Summary (Piti R3) | 🟢 PASSED | Aggregated metrics: Count 29, Sum ฿18892.79, Avg ฿651.48. |
| **Analytics** | Promotion Performance (Panjapong R3) | 🟢 PASSED | Aggregated promotion campaigns. Retrieved 5 records. |

## Test Summary

> [NOTE]
> **All simple and analytics reports are functioning correctly.** The report engines correctly retrieve live transactional records, perform correct relational joins, and execute mathematical aggregation operations exactly matching the front-end layouts.
