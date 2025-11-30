# Patients API - Database-Aligned Contract

## 1. Objectives
- Feed the Patients view (table, drawer, and "Add Patient" modal) with a single `/api/patients` round-trip.
- Make every field traceable to the MNHS schema (`Patient`, `ContactLocation`, `have`, `ClinicalActivity`, `Emergency`, `Expense`, `Insurance`).
- Call out derived values so backend, data, and QA teams know how to reproduce them from SQL.

## 2. Data Sources & Field Mapping

| UI field | Description | Source tables & rule |
| --- | --- | --- |
| `iid` | Internal identifier shown in the drawer header. | `Patient.IID` (PK). |
| `cin` | National ID used for search. | `Patient.CIN`, normalized to uppercase. |
| `name` | Full name displayed in the list and drawer. | `Patient.FullName`. |
| `sex` | Gender badge. | `Patient.Sex` (`'M'` or `'F'`). |
| `birthDate` | Birth date string | `Patient.Birth` rendered as ISO `YYYY-MM-DD`; keep `null` when empty. |
| `bloodGroup` | Optional blood group chip. | `Patient.BloodGroup`. |
| `phone` | Primary phone number. | `Patient.Phone`. |
| `email` | Drawer contact detail. | Not stored in the current schema; return `null` so the UI falls back to `"N/A"` until the column is added. |
| `city` | City column + drawer item. | Join `have` -> `ContactLocation` and choose the row with the smallest `CLID` (acts as "primary address"). Emit `ContactLocation.City` or `"N/A"` when no address exists. |
| `insurance` | Badge in the table/drawer. | For each patient, find the most recent `Expense` (via `ClinicalActivity.IID = Patient.IID`) and use `COALESCE(Insurance.Type, "None")`. If no expenses exist, emit `"None"`. |
| `insuranceStatus` | Status pill next to the insurance badge. | Emit `"Active"` when the rule above resolves to a named insurer; otherwise return `"Self-Pay"`. |
| `policyNumber` | Policy text in the drawer card. | Deterministically compose `Policy ${LPAD(Insurance.InsID,4)}-${LPAD(Patient.IID,4)}`; when no insurer exists, return `null`. |
| `status` | Table indicator dot. | Look at the latest `ClinicalActivity` for the patient. If it is linked to an `Emergency` row whose `Outcome = 'Admitted'`, expose `"Admitted"`; otherwise expose `"Outpatient"`. |
| `nextVisit` | Object powering the Next Visit card. | Use `Appointment` joined through `ClinicalActivity`: select the earliest appointment whose `Date >= CURRENT_DATE`, and emit `{ date, time, hospital, department, reason }`. Return `null` when no upcoming appointment exists. |
| `lastSyncedAt` | Data freshness banner. | Server timestamp (`NOW()` in UTC). |

## 3. `GET /api/patients`

- **Purpose:** hydrate the Patients page with everything it renders.
- **Query Params (optional):**
  - `search`: matches `Patient.CIN` or `Patient.FullName` (case-insensitive, substring).
  - `sex`: `'M'` or `'F'`; applied directly to `Patient.Sex`.
  - `status`: `'Admitted'` or `'Outpatient'`; filter after deriving status per the rule above.
  - `bloodGroup`: restricts to the enumerated `Patient.BloodGroup` values.
- **Response (200):**
  - `patients`: ordered array (default sort: `Patient.FullName ASC`).
  - `lastSyncedAt`: ISO 8601 timestamp with timezone.

```json
{
  "patients": [
    {
      "iid": 1205,
      "cin": "AB123456",
      "name": "Amina Idrissi",
      "sex": "F",
      "birthDate": "1984-02-11",
      "bloodGroup": "A+",
      "phone": "+212612345678",
      "email": null,
      "city": "Rabat",
      "insurance": "CNOPS",
      "insuranceStatus": "Active",
      "policyNumber": "MAR-0001-1205",
      "status": "Admitted",
      "nextVisit": {
        "date": "2025-12-04",
        "time": "09:00",
        "hospital": "Rabat Central",
        "department": "Cardiology",
        "reason": "Cardiology follow-up"
      }
    }
  ],
  "lastSyncedAt": "2025-11-28T09:30:00Z"
}
```

### 3.1 Derivation & edge cases
- When multiple contact locations exist, return the one with the smallest `CLID`. Future work can add a `Primary` flag.
- Patients without expenses must still show up; default their `insurance` to `"None"` and `status` to `"Outpatient"`.
- When no insurer is available, set `insuranceStatus` to `"Self-Pay"`, `policyNumber` to `null`, and `nextVisit` to `null`.
- The UI already guards against an empty `email`, so responding with `null` is acceptable until a column exists.

## 4. `POST /api/patients`

- **Purpose:** create a patient from the modal used in Patients and Staff screens.
- **Request Body:**
  - `iid` (integer, required): must be unique per `Patient.IID`.
  - `cin` (string <=10, required): uppercase national ID.
  - `name` (string <=100, required): full name maps to `Patient.FullName`.
  - `sex` (`"M" | "F"`, required): stored in `Patient.Sex`.
  - `birth` (ISO date string or `null`): persisted as `Patient.Birth`.
  - `bloodGroup` (enum or `null`).
  - `phone` (string <=15 or `null`).
  - `email` (string <=160 or `null`): accepted and echoed back but not persisted until the schema gains the column.
  - `city` (string, optional): when provided, create a lightweight `ContactLocation` row (`City=city`, other fields nullable) and link it via `have`.
- **Read-only fields:** `insuranceStatus`, `policyNumber`, and `nextVisit` are derived as described above and should be ignored if the client attempts to send them.
- **Validation:** enforce unique `iid`/`cin`, numeric IID, allowed enums, and format checks identical to the UI.
- **Persistence rules:**
  1. Insert into `Patient` with the supplied demographic columns.
  2. Optionally insert `ContactLocation + have` for `city`.
  3. Do **not** write insurance/status directly; those stay derived (see GET rules). New patients therefore start as `insurance="None"`, `status="Outpatient"`.
- **Response (201):**
  - `patient`: normalized object following the GET schema (including derived `city`, `insurance`, `status`, etc.).
  - `message`: short confirmation (e.g., `"Patient created"`).
- **Failure (4xx/5xx):** `{ "message": "..." }` surfaced verbatim by the UI.

## 5. General Notes
- All responses use `Content-Type: application/json`.
- Dates are timezone-free ISO strings; timestamps (`lastSyncedAt`) include timezone.
- Keep the contract backward compatible with the current mock server so swapping to the real backend only requires changing `VITE_API_BASE_URL`.
