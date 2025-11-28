**Backend Requirements for `/api/staff`**

- **Endpoint**: `/api/staff`
  - **Purpose**: Supplies the Staff page with all personnel records needed for the directory, role allocation chart, and future filters.
  - **Query Params**: optional `pageKey=Staff`, `hospital=<string>`, `department=<string>`, `status=<Active|Retired>` for future filtering. No required params.
  - **Method**: `GET`.
  - **Expected Response (200)**:
    - `staff` (array, required): each entry must include
      - `id` (string | int) – unique staff identifier.
      - `name` (string, max 100) – full name.
      - `role` (string) – e.g., Doctor, Nurse, Admin, Technician.
      - `departments` (string[]) – at least one department label; empty array allowed.
      - `hospitals` (string[]) – hospitals where the staff member operates; empty array allowed.
      - `status` (string) – `Active`, `Retired`, or other documented values.
    - `lastSyncedAt` (string | null) – ISO timestamp for the data snapshot.
  - **Failure (4xx/5xx)**: respond with `{ "message": string }`. The UI renders this message as an inline banner without modification.

**Backend Requirements for `POST /api/patients`**

- **Endpoint**: `/api/patients`
  - **Purpose**: Reused by the Staff page (and Patients page) whenever an admin needs to create a new patient record from contextual actions.
  - **Method**: `POST`.
  - **Request Body**: See `patient_requirements.md`; summarized fields: `iid` (int, required), `cin` (string ≤10, required), `name` (string ≤100, required), `sex` ("M"|"F"), plus optional `birth`, `bloodGroup`, `phone`, `email`, `city`, `insurance`, `status`.
  - **Successful Response (201)**:
    - `patient` object following the same schema as the Patients list endpoint.
    - `message` string (e.g., "Patient created").
  - **Failure (4xx/5xx)**: `{ "message": string }` describing validation errors (duplicate CIN/IID, invalid formats, etc.). The UI surfaces this in a banner and keeps forms open for correction.

**General Notes**

- All responses must be JSON with `Content-Type: application/json`.
- Dates use ISO date strings; timestamps such as `lastSyncedAt` should include timezone (e.g., `2025-11-28T10:15:00Z`).
- These contracts mirror the in-app mock server registered via `registerStaffMockServer`; removing that mock and hitting the live backend should be a drop-in change.
