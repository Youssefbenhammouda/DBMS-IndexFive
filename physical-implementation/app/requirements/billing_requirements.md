# Billing & Insurance API Contract

The Billing & Insurance page consumes a dedicated `billing` resource that aggregates all dashboard widgets (KPIs, insurance split, reimbursement timeline, outstanding claims, and recent expenses) in a single round-trip. Additional write endpoints allow MNHS staff to record new expenses and log insurer payments directly from the UI.

## Endpoint Summary

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/billing` | Returns the complete data payload required by the Billing & Insurance dashboard. |
| `POST` | `/api/billing/expense` | Creates a new expense tied 1:1 to a `ClinicalActivity` and queues it for reimbursement. |
| `POST` | `/api/billing/insurance-payment` | Records a payment or adjustment received from an insurer and updates outstanding claim totals. |

## `GET /api/billing`

- **Purpose:** deliver all dashboard widgets in one request so the UI can render KPIs, charts, and tables without multiple round trips.
- **Query Params:** optional `hospital_id`, `insurance`, `status`, `days_back` filters (default returns network-wide snapshot for last 30 days).
- **Response Body:**
  ```json
  {
    "kpis": [
      {
        "title": "Monthly Billings",
        "value": "1.28M MAD",
        "subtext": "417 clinical activities",
        "trend": "up",
        "trendValue": "+8.4% vs last month",
        "iconKey": "CreditCard"
      }
    ],
    "insuranceSplit": [
      { "type": "CNOPS", "amount": 520000, "claims": 138 }
    ],
    "reimbursementTimeline": [
      { "month": "Nov", "reimbursed": 910000, "pending": 120000 }
    ],
    "outstandingClaims": [
      {
        "id": "CLAIM-901",
        "insurer": "RAMED",
        "hospital": "Casablanca Central",
        "amount": 94000,
        "daysOutstanding": 18,
        "priority": "High"
      }
    ],
    "recentExpenses": [
      {
        "id": "EXP-1048",
        "date": "2025-11-12",
        "hospital": "Rabat University Hospital",
        "patient": "Amina Haddad",
        "insurance": "CNSS",
        "total": 2450,
        "status": "Awaiting Reimbursement",
        "staff": "Dr. Selma Idrissi",
        "department": "Cardiology",
        "medications": [
          { "name": "Atorvastatin 40mg", "qty": 30, "unitPrice": 45 }
        ],
        "notes": "Awaiting CNSS batch cut-off on Nov 30"
      }
    ],
    "lastSyncedAt": "2025-11-27T12:34:56Z"
  }
  ```
- **Contract Notes:**
  - `kpis[].iconKey` must be one of `CreditCard`, `ShieldCheck`, `Clock3`, `AlertTriangle`; the UI maps these to Lucide icons.
  - Amount fields are numeric (MAD) and the frontend formats them via `Intl.NumberFormat`.
  - `recentExpenses[].medications` mirrors the `Includes` table (name/qty/unitPrice) for transparency when triggers recompute totals.
  - `lastSyncedAt` should be ISO-8601 for display and cache invalidation.

## `POST /api/billing/expense`

- **Purpose:** capture a new expense row linked to a `ClinicalActivity` (`CAID`) and optionally submit it to insurance.
- **Request Body:**
  ```json
  {
    "caid": 8123,
    "patient": "Amina Haddad",
    "hospital": "Rabat University Hospital",
    "department": "Cardiology",
    "staff": "Dr. Selma Idrissi",
    "insurance": "CNSS",
    "total": 2450,
    "status": "Awaiting Reimbursement",
    "medications": [
      { "name": "Atorvastatin 40mg", "qty": 30, "unitPrice": 45 }
    ],
    "notes": "Attach echo results"
  }
  ```
- **Validation Rules:**
  - `caid`, `patient`, `hospital`, `department`, `staff`, `insurance`, and `total` are required.
  - `status` accepts `Awaiting Reimbursement`, `Reimbursed`, `Flagged`, `Self-Paid`.
  - `total` must be ≥ 0 and checked against trigger T2 (expense recompute) before commit.
- **Response:**
  ```json
  {
    "expense": { "id": "EXP-2056", "status": "Awaiting Reimbursement", "total": 2450 },
    "message": "Expense captured"
  }
  ```
  The backend should also re-query `/api/billing` data internally or publish an event so the frontend can refresh.

## `POST /api/billing/insurance-payment`

- **Purpose:** log a reimbursement or adjustment received from an insurer.
- **Request Body:**
  ```json
  {
    "insurer": "CNSS",
    "amount": 64000,
    "reference": "CNSS-BATCH-2025-11-27",
    "notes": "Batch 457 covering 23 claims"
  }
  ```
- **Validation Rules:**
  - `insurer`, `amount`, `reference` are required.
  - `amount` must be > 0; backend updates matching `outstandingClaims` rows (typically FIFO by `daysOutstanding`).
- **Response:**
  ```json
  {
    "payment": {
      "insurer": "CNSS",
      "amount": 64000,
      "reference": "CNSS-BATCH-2025-11-27",
      "recordedAt": "2025-11-28T08:15:00Z"
    },
    "message": "Payment recorded"
  }
  ```

## Error Handling

- All endpoints return JSON errors: `{ "message": "human readable", "code": "BILLING_xxx" }` with appropriate HTTP status codes (400 validation, 404 missing CAID, 409 trigger violation, 500 unexpected).
- Database trigger failures (double booking, stock underflow, etc.) bubble up via `SIGNAL` and should propagate their messages.
- The Billing view surfaces load errors in a red inline banner and continues to allow mock-data preview when real data is unavailable.

## Frontend Integration Notes

- `BillingConnector` wraps the endpoints above and automatically clears the ModelConnector cache so `/api/billing` is re-fetched after any POST.
- Until the backend goes live, the view loads inline mock data; once `/api/billing` responds successfully, the UI swaps to live data and displays the "Connected via BillingConnector" indicator.
