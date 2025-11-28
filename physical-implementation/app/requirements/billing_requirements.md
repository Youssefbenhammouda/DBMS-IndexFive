# Billing & Insurance Dashboard – Database-Aligned Design

The redesigned Billing view only surfaces insights that can be computed from the MNHS lab schema (`Hospital`, `Department`, `Staff`, `Patient`, `ClinicalActivity`, `Expense`, `Insurance`, `Prescription`, `Includes`). Widgets that previously depended on mock-only fields (claim status, reimbursement timeline, free-form notes) have been removed. This document describes the layout, data contracts, and backend rules that map directly to the available tables.

## 1. Objectives
- Use persisted data only: every number on the page must be derivable from the relations listed above.
- Keep the round-trip contract (`GET /api/billing`) so the UI still hydrates all widgets with one request.
- Document how write actions (`POST /api/billing/expense`) interact with real tables and which features remain backlog until supporting tables exist.

## 2. Data Sources & Mapping

| Dataset / Widget | Tables & Columns | Notes |
| --- | --- | --- |
| Activity KPIs | `Expense.Total`, `ClinicalActivity.Date`, `Hospital.Region`, `Insurance.InsID` | Aggregations over the last *N* days (default 30). |
| Insurance Coverage Mix | `Expense`, `Insurance` | Treat `InsID IS NULL` as **Self-Pay** bucket. |
| Hospital Billing Overview | `Hospital`, `ClinicalActivity`, `Expense`, `Insurance` | Group by `Hospital.HID`; show totals, volume, insured share. |
| Department Leaderboard | `Department`, `ClinicalActivity`, `Expense` | Top departments by billed MAD and visit count. |
| Recent Billable Activities | `Expense`, `ClinicalActivity`, `Hospital`, `Department`, `Patient`, `Staff`, `Insurance` | Sorted by `ClinicalActivity.Date` + `Time`. |
| Medication Utilization Snapshot | `Prescription`, `Includes`, `Medication` | Count prescriptions and list medications linked to billed CAIDs. |

## 3. Dashboard Layout (what the UI renders)

### 3.1 Activity KPIs
Four KPI tiles:
1. **Total Billings (30d)** – `SUM(Expense.Total)` filtered by `ClinicalActivity.Date >= CURRENT_DATE - days_back`.
2. **Insured Coverage** – `SUM(Expense.Total WHERE InsID IS NOT NULL) / SUM(Expense.Total)`.
3. **Average Expense per Activity** – `SUM(Expense.Total) / COUNT(DISTINCT Expense.ExpID)`.
4. **Active Hospitals** – `COUNT(DISTINCT Hospital.HID)` present in the filtered result set.
Each KPI includes an `iconKey` (`CreditCard`, `ShieldCheck`, `Clock3`, `AlertTriangle`) and an optional trend percentage calculated by comparing the current window to the previous window.

### 3.2 Insurance Coverage Mix (pie + legend)
- Data rows: `type`, `insId`, `amount`, `activities` (count of expenses), `share` (percentage of total MAD).
- `type` pulls from `Insurance.Type`; use `"Self-Pay"` when `InsID IS NULL`.

### 3.3 Hospital Billing Overview (table)
For each hospital in the filtered result set show:
- `hid`, `name`, `region` (from `Hospital`).
- `total` MAD billed, `activities` (expense count), `insuredShare` ratio, and `avgExpense` per activity.
Sort descending by `total`. This replaces the old "outstanding claims" card.

### 3.4 Department Leaderboard (horizontal list)
Top departments by billed MAD:
- `depId`, `department`, `hospital`, `specialty`, `total`, `activities`.
- Highlight departments whose `total` exceeds the network average to focus operational reviews.

### 3.5 Recent Billable Activities (table + drawer)
- Rows limited to the latest 25 `Expense` records (most recent `ClinicalActivity.Date`, then `Time`).
- Columns: `expId`, `caid`, formatted `activityDate`, `hospital`, `department`, `patient`, `insurance.type` (or `Self-Pay`), `total`.
- Drawer details fetch related staff (`Staff.FullName`) and prescriptions.
- Medication list is derived from `Includes` (`Dosage`, `Duration`) joined to `Medication.Name` and `TherapeuticClass`. No status/notes column is displayed because those fields do not exist in the schema.

### 3.6 Medication Utilization Snapshot (bar list)
Shows the top prescribed medications tied to billed clinical activities:
- `mid`, `name`, `therapeuticClass`, `prescriptions` (count of `Includes` rows), and `% of billed prescriptions`.
- Use this in place of the previous reimbursement timeline since we can reliably compute utilization but not payment timing.

## 4. API Contract (v2)

### 4.1 Endpoint Summary

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/billing` | Fetch all dashboard data aligned with the schema. |
| `POST` | `/api/billing/expense` | Insert a new `Expense` row tied to an existing `ClinicalActivity`. |

> `POST /api/billing/insurance-payment` is **deferred**. The current database does not contain a payments table, so the endpoint remains on the backlog until a `Payment` relation is introduced.

### 4.2 `GET /api/billing`

- **Query Params:**
  - `hospital_id` (optional) – limits results to one hospital.
  - `department_id` (optional) – narrows aggregations to a single department.
  - `insurance_id` (optional) – filter by insurer or `null` for Self-Pay.
  - `days_back` (default `30`) – rolling window applied to `ClinicalActivity.Date`.
- **Response Body:**

```json
{
  "kpis": [
    {
      "key": "totalMonthlyBillings",
      "title": "Total Billings (30d)",
      "value": 1280000,
      "unit": "MAD",
      "trend": { "direction": "up", "value": 0.084 },
      "iconKey": "CreditCard"
    },
    {
      "key": "insuredCoverage",
      "title": "Insured Coverage",
      "value": 0.78,
      "unit": "ratio",
      "trend": { "direction": "up", "value": 0.032 },
      "iconKey": "ShieldCheck"
    }
  ],
  "insuranceSplit": [
    { "insId": 1, "type": "CNOPS", "amount": 520000, "activities": 138, "share": 41 },
    { "insId": null, "type": "Self-Pay", "amount": 50000, "activities": 32, "share": 4 }
  ],
  "hospitalRollup": [
    { "hid": 3, "name": "Casablanca Central", "region": "Casablanca-Settat", "total": 260000, "activities": 84, "insuredShare": 0.81, "avgExpense": 3095 }
  ],
  "departmentSummary": [
    { "depId": 14, "hospital": "Casablanca Central", "department": "Cardiology", "specialty": "Cardiology", "total": 76000, "activities": 22, "avgExpense": 3450 }
  ],
  "recentExpenses": [
    {
      "expId": 1048,
      "caid": 8123,
      "activityDate": "2025-11-12",
      "hospital": { "hid": 4, "name": "Rabat University Hospital" },
      "department": { "depId": 21, "name": "Cardiology" },
      "patient": { "iid": 5401, "fullName": "Amina Haddad" },
      "staff": { "staffId": 221, "fullName": "Dr. Selma Idrissi" },
      "insurance": { "insId": 2, "type": "CNSS" },
      "total": 2450,
      "prescription": {
        "pid": 9901,
        "medications": [
          { "mid": 120, "name": "Atorvastatin 40mg", "dosage": "1 tablet", "duration": "30 days" },
          { "mid": 218, "name": "Metoprolol 50mg", "dosage": "1 tablet", "duration": "30 days" }
        ]
      }
    }
  ],
  "medicationUtilization": [
    { "mid": 120, "name": "Atorvastatin 40mg", "therapeuticClass": "Statin", "prescriptions": 48, "share": 0.16 }
  ],
  "metadata": {
    "filters": { "hospitalId": null, "departmentId": null, "insuranceId": null, "daysBack": 30 },
    "lastSyncedAt": "2025-11-27T12:34:56Z"
  }
}
```

- **Contract Notes:**
  - Amount fields are numeric (MAD). The UI still formats them via `Intl.NumberFormat`.
  - `insuranceSplit.share` and `medicationUtilization.share` are expressed as percentages (0–100) or ratios (0–1); the client decides how to display them but the backend must be consistent.
  - `recentExpenses` must include the relational identifiers so the drawer can deep-link to other admin pages.
  - `prescription` is optional; omit it when no `Prescription` exists for the `CAID`.
  - `metadata.filters` echoes the resolved filters for audit/debug purposes.

### 4.3 `POST /api/billing/expense`

- **Purpose:** insert an `Expense` row for an existing clinical activity and, optionally, associate it with an insurer.
- **Request Body:**

```json
{
  "caid": 8123,
  "insId": 2,
  "total": 2450.0
}
```

- **Validation Rules:**
  1. `caid` is required and must reference a `ClinicalActivity` that does **not** already have an `Expense` (`UNIQUE` constraint on `Expense.CAID`).
  2. `total` must be `>= 0` and comply with trigger T2 (recompute against linked `Includes` rows when present).
  3. `insId` is optional; when provided it must match an existing `Insurance.InsID`. Use `null` for Self-Pay.
- **Response:**

```json
{
  "expense": { "expId": 2056, "caid": 8123, "insId": 2, "total": 2450.0 },
  "message": "Expense captured"
}
```

### 4.4 Deferred: `POST /api/billing/insurance-payment`
The former reimbursement endpoint required an `OutstandingClaims` table that does not exist. Until a normalized payments table is added to the schema, this endpoint stays unimplemented. The UI surfaces a roadmap note instead of a form.

## 5. Error Handling & Frontend Integration
- All endpoints return JSON errors: `{ "message": "human readable", "code": "BILLING_xxx" }` with HTTP status codes (400 validation, 404 missing CAID, 409 trigger violation, 500 unexpected).
- Database trigger failures bubble up via `SIGNAL` and should propagate unchanged.
- `BillingConnector` keeps the same contract: after a successful `POST /api/billing/expense` it clears the cached `Billing` payload so the next `GET` reflects the insert.
- When `/api/billing` fails, the Billing view falls back to the inline mock snapshot and displays the error banner; once a real payload arrives it shows the "Connected via BillingConnector" indicator and uses `metadata.lastSyncedAt` for recency messaging.
