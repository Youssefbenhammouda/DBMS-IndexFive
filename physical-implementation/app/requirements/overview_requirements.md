**Backend Requirements for `/api/...`**

- **Endpoint**: `/api/core-dashboard`
  - **Purpose**: Supplies Overview page with appointment, staff, medication, and summary data.
  - **Query Params**: optional `range=<ISO date range>` for future filtering.
  - **Method**: `GET`.
  - **Expected Response (200)**:
    - `appointments` (array): `{ id, patientName, status ("Scheduled" | "Completed" | "Cancelled"), hospital, date (YYYY-MM-DD), time (HH:mm), department }`.
    - `staff` (array): `{ id, name, role, hospitals (string[]), workload (0-100), status }`.
    - `staffLeaderboard` (array, optional): same shape as `staff`, ordered by workload desc.
    - `lowStockMedications` (array): `{ id, name, category, stockLevel (number), reorderPoint (number), unit }`.
    - `summary` (object):
      - `totalAppointments` (number)
      - `upcomingAppointments` (number)
      - `activeStaff` (number)
      - `admittedPatients` (number)
  - **Failure (4xx/5xx)**: JSON `{ message: string }`; UI surfaces message verbatim.

**General Notes**

- All fields must be present even if empty (`appointments: []`, etc.) so the UI can render fallbacks without defaults.
- Times should be zero-padded 24h format (`"08:30"`). Dates must be ISO date-only strings.
- Numerical metrics should be integers; the UI handles formatting and derived KPIs.
- Additional endpoints can be added later, but Overview must at least be backed by `/api/core-dashboard`.