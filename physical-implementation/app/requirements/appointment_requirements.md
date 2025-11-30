**Backend Requirements for `/api/appointments`**

- **Endpoint**: `/api/appointments`
  - **Purpose**: Supplies the Appointments page with the full agenda/list dataset plus lightweight metadata like `lastSyncedAt`.
  - **Query Params**: optional filters such as `pageKey=Appointments`, `range=<YYYY-MM-DD..YYYY-MM-DD>`, `status=<Scheduled|Completed|Cancelled|No Show>`, `hospital=<string>`. None are required today but the backend should tolerate them.
  - **Method**: `GET`.
  - **Expected Response (200)**:
    - `appointments` (array, required): each entry must include
      - `id` (string) – unique identifier (e.g., `"APT-5001"`).
      - `date` (string) – ISO date-only `YYYY-MM-DD`.
      - `time` (string) – zero-padded 24h time `HH:mm`.
      - `hospital` (string) – facility label.
      - `department` (string) – service/department name.
      - `patient` (string) – patient display name.
      - `staff` (string) – assigned clinician.
      - `reason` (string) – free-text purpose of the visit.
      - `status` (string) – one of `Scheduled`, `Completed`, `Cancelled`, `No Show` (extendable later but document values).
    - `lastSyncedAt` (string | null): ISO timestamp describing when the list was assembled.
  - **Failure (4xx/5xx)**: JSON `{ "message": string }`; the UI shows the message verbatim inside a banner.

**Backend Requirements for `POST /api/appointments`**

- **Endpoint**: `/api/appointments`
  - **Purpose**: Creates a new appointment entry (the UI will call this once the Schedule modal is wired).
  - **Method**: `POST`.
  - **Request Body (JSON)**:
    - `id` (string, optional) – allow the client to suggest an identifier; backend can override.
    - `date` (string, required) – ISO `YYYY-MM-DD`.
    - `time` (string, required) – zero-padded `HH:mm`.
    - `hospital` (string, required).
    - `department` (string, required).
    - `patient` (string, required).
    - `staff` (string, required).
    - `reason` (string, required).
    - `status` (string, required) – must be one of the allowed statuses listed above.
  - **Successful Response (201)**:
    - `appointment` (object): canonical representation matching the schema returned by the GET endpoint (including normalized `id`, `date`, `time`, etc.).
    - `message` (string): confirmation such as "Appointment created".
  - **Failure (4xx/5xx)**:
    - `{ "message": string }` describing the validation or server-side error (duplicate ID, invalid status, missing fields, etc.). The UI will display this banner without rewriting it.

**General Notes**

- Responses must include `Content-Type: application/json` and avoid omitting required keys (use empty arrays).
- All times should be 24h strings, and all dates should be timezone-free ISO strings; timestamps like `lastSyncedAt` should be full ISO 8601 with timezone (`2025-11-28T09:30:00Z`).
- These contracts match the temporary in-memory mock server (`registerAppointmentMockServer`). Once the real backend is live, removing the mock registration should be the only change required in the UI.
