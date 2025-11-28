**Backend Requirements for `/api/patients`**

- **Endpoint**: `/api/patients`
  - **Purpose**: Supplies the Patients page with the full list of patient demographics used by the table and detail drawer.
  - **Query Params**:  optional future filters such as `search=<string>`, `sex=<M|F>`, `status=<Admitted|Outpatient>`, `bloodGroup=<A+|...>` may be appended but are not required today.
  - **Method**: `GET`.
  - **Expected Response (200)**:
    - `patients` (array, required): each object must include
      - `iid` (integer) – primary identifier, unique per patient.
      - `cin` (string, max 10) – national ID, uppercase, unique.
      - `name` (string, max 100) – full name.
      - `sex` ("M" | "F") – gender indicator.
      - `birthDate` (string | null) – ISO date-only `YYYY-MM-DD`, nullable.
      - `bloodGroup` (string | null) – one of `A+`, `A-`, `B+`, `B-`, `O+`, `O-`, `AB+`, `AB-`.
      - `phone` (string | null) – up to 15 chars, may include leading `+` and separators.
      - `email` (string | null) – valid email format, <=160 chars.
      - `city` (string) – residence/city label; supply "N/A" when unknown.
      - `insurance` (string) – one of the supported insurance plans or "None".
      - `status` (string) – at minimum `Admitted` or `Outpatient`; additional values allowed but documented.
    - `lastSyncedAt` (string | null): ISO timestamp indicating when the payload was generated.
  - **Failure (4xx/5xx)**: JSON `{ "message": string }`; the UI shows the message in an inline banner without alteration.

**Backend Requirements for `POST /api/patients`**

- **Endpoint**: `/api/patients`
  - **Purpose**: Creates a new patient record from the Add Patient modal.
  - **Method**: `POST`.
  - **Request Body (JSON)**:
    - `iid` (integer, required) – must be unique; the UI enforces numeric input but the backend must validate.
    - `cin` (string, required, max 10) – uppercase national ID, unique.
    - `name` (string, required, max 100) – patient's full name.
    - `sex` (required) – `"M"` or `"F"`.
    - `birth` (string | null) – ISO `YYYY-MM-DD` or null.
    - `bloodGroup` (string | null) – same enum as above.
    - `phone` (string | null) – up to 15 characters.
    - `email` (string | null) – up to 160 characters, standard email syntax.
    - Optional backend-managed fields such as `city`, `insurance`, `status` may be accepted and echoed back if provided; otherwise they default server-side (`"N/A"`, `"None"`, `"Outpatient"`).
  - **Successful Response (201)**:
    - `patient` (object): canonical representation of the created record, following the exact schema of the `patients` array in the GET response (including `birthDate`, `city`, `insurance`, `status`, etc.).
    - `message` (string): short confirmation (e.g., "Patient created").
  - **Failure (4xx/5xx)**:
    - Body `{ "message": string }` describing the validation or server error (duplicate IID/CIN, missing fields, invalid enum, etc.). The UI displays this message above the table and keeps the modal open, so prefer concise user-friendly wording.

**General Notes**

- Both endpoints must set `Content-Type: application/json` and respond with JSON payloads only.
- All numeric values should be integers; the UI formats them downstream.
- Dates must be timezone-free ISO date strings; timestamps should be ISO 8601 with timezone (e.g., `2025-11-28T09:30:00Z`).
- Reserve additional fields for future use, but never omit the required keys even when arrays are empty.
- These contracts mirror the in-app mock server; swapping to the real backend should require no UI changes besides pointing `VITE_API_BASE_URL` to the deployed API.
