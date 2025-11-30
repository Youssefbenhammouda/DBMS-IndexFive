**Backend Requirements for `/api/medications`**

- **Endpoint**: `/api/medications`
  - **Purpose**: Supplies the Medications & Stock page with low-stock alerts, pricing dispersion, and replenishment trends in a single payload.
  - **Query Params** (optional): `pageKey=Medications`, `hospital=<string>`, `class=<TherapeuticClass>`, `onlyLowStock=true|false`. None are mandatory today but the backend should tolerate them.
  - **Method**: `GET`.
  - **Expected Response (200)**:
    - `lowStock` (array): each row must include `{ id (string), name (string), hospital (string), qty (number), reorderLevel (number), unit (string), class (string) }`.
    - `pricingSummary` (array): `{ hospital, medication, avg (number), min (number), max (number), updatedAt (ISO timestamp) }`.
    - `priceSeries` (array): `{ hospital, avgUnitPrice (number) }` used by the bar chart.
    - `replenishmentTrend` (array): `{ month (string label), qty (number), cost (number) }` capturing the most recent months of purchases.
    - `aggregates` (object):
      - `criticalAlerts` (number) – total medications whose `qty <= reorderLevel / 2`.
      - `avgStockGapPct` (number) – % average deficit vs reorder threshold.
      - `projectedMonthlySpend` (number) – MAD value of expected replenishment spend.
    - `lastSyncedAt` (string | null) – ISO timestamp of the snapshot.
  - **Failure (4xx/5xx)**: JSON `{ "message": string }`; message is rendered verbatim in the UI banner.

**Backend Requirements for `POST /api/medications`**

- **Purpose**: Registers a new medication record (and optionally flags it for stock monitoring).
- **Request Body**:
  - `id` (string, required) – unique medication identifier.
  - `name` (string, required, ≤100 chars).
  - `hospital` (string, required) – facility tracking this stock record.
  - `qty` (number, required) – current quantity.
  - `reorderLevel` (number, required) – minimum threshold.
  - `unit` (string, required) – e.g., boxes, vials.
  - `class` (string, optional) – therapeutic class.
- **Response (201)**: `{ "medication": { ...record... }, "message": "Medication created" }`.
- **Failure**: `{ "message": string }` for missing/invalid fields or duplicate IDs.

**Backend Requirements for `POST /api/medications/stock`**

- **Purpose**: Adds an inbound stock transaction for an existing medication/hospital pair.
- **Request Body**:
  - `medicationId` (string, required).
  - `medicationName` (string, optional but recommended for display syncing).
  - `hospital` (string, required).
  - `qtyReceived` (number, required, >0).
  - `unitPrice` (number, required, ≥0).
- **Response (201)**: `{ "stockEntry": { medicationId, medicationName, hospital, qtyReceived, unitPrice }, "message": "Stock entry recorded" }` and the aggregate data should reflect the updated quantities/prices.
- **Failure**: `{ "message": string }` for validation errors (unknown medication, negative qty, etc.).

**General Notes**

- All responses must set `Content-Type: application/json`.
- Monetary values are assumed to be MAD; the frontend handles formatting.
- Dates and timestamps must be ISO 8601 strings.
- These endpoints mirror the in-app mock server (`registerMedicationsMockServer`). Once the real backend is wired, removing the mock registration in `src/App.jsx` should be the only UI change required.
