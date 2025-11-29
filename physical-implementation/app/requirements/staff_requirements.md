# Backend Requirements for `/api/staff`

## GET /api/staff

- **Endpoint**: `/api/staff`  
  - **Purpose**: Supplies the Staff page with all personnel records used for the directory, role allocation chart, and future filtering.  
  - **Method**: `GET`.  
  - **Query Params** (all optional):
    - `pageKey=Staff`
    - `hospital=<string>`
    - `department=<string>`
    - `status=<Active|Retired>`
    - No query parameters are required.

  - **Expected Response (200)**:
    - `staff` (array, required): each entry must include  
      - `id` (string | int) – unique staff identifier.  
      - `name` (string, max 100) – full name.  
      - `role` (string) – e.g., `"Doctor"`, `"Nurse"`, `"Admin"`, `"Technician"`.  
      - `departments` (string[]) – list of department labels; may be empty.  
      - `hospitals` (string[]) – list of hospitals where the staff member operates; may be empty.  
      - `status` (string) – `"Active"`, `"Retired"`, or other documented values.  
    - `lastSyncedAt` (string | null) – ISO timestamp for the data snapshot.

  - **Failure (4xx/5xx)**:
    - Respond with `{ "message": string }`.  
      The UI renders this message as an inline banner without modification.

---

## POST /api/staff

- **Endpoint**: `/api/staff`  
  - **Purpose**: Creates a new staff record from the Add Staff modal.  
  - **Method**: `POST`.

  - **Request Body (JSON)**:
    - `id` (integer, required) – must be unique; UI enforces numeric input but backend must validate.  
    - `name` (string, required, max 100) – staff member’s full name.  
    - `status` (string | null) – optional; defaults to `"Active"` if omitted.  
    - Extra fields may be accepted and echoed back if provided, but unused fields are ignored by the backend. Only `id`, `name`, and `status` are persisted in the current DB schema.

  - **Successful Response (201)**:
    - `staff` (object): canonical representation of the created staff record, following the same schema as the Staff list endpoint (including `id`, `name`, `role`, `departments`, `hospitals`, `status`).  
    - `message` (string): short confirmation (e.g., `"Staff created"`).

  - **Failure (4xx/5xx)**:
    - Body `{ "message": string }` describing the validation or server error (duplicate ID, missing required fields, invalid value, database constraint errors, etc.).  
      The UI displays this message above the table and keeps the modal open, so wording must be concise and user-friendly.

---

## General Notes

- All responses must be JSON with `Content-Type: application/json`.  
- Dates must use ISO date strings; timestamps such as `lastSyncedAt` must include timezone (e.g., `2025-11-28T10:15:00Z`).  
- These contracts mirror the in-app mock server registered via `registerStaffMockServer`; removing that mock and hitting the live backend should be a drop-in change.
