# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Patients API Contract

The patient module currently expects a single read endpoint plus a write endpoint exposed by the backend (`${VITE_API_BASE_URL}/patients`).

### `GET /patients`

- **Description:** Returns the complete list of patients needed by the Patients page.
- **Query params:** none (future filters can be appended without breaking the contract).
- **200 Response body:**

```json
{
	"patients": [
		{
			"iid": 1001,
			"cin": "AB123456",
			"name": "Patient Name",
			"sex": "M",
			"birthDate": "1982-05-16",
			"bloodGroup": "A+",
			"phone": "+212600000000",
			"email": "patient@example.com",
			"city": "Rabat",
			"insurance": "CNSS",
			"status": "Outpatient"
		}
	],
	"lastSyncedAt": "2025-11-28T09:30:00Z"
}
```

- **Error response:** `{ "message": "human readable explanation" }` with appropriate HTTP status. The UI surfaces this through a banner inside the Patients page.

### `POST /patients`

- **Description:** Adds a new patient record.
- **Request body (JSON):**

```json
{
	"iid": 1234,                  // INT, required, primary key
	"cin": "AB123456",           // VARCHAR(10), required, unique
	"name": "Full Name",         // VARCHAR(100), required
	"birth": "1990-01-01",       // DATE, optional
	"sex": "M",                  // ENUM('M','F'), required
	"bloodGroup": "O+",          // ENUM list, optional
	"phone": "+212600000000",    // VARCHAR(15), optional
	"email": "user@example.com"  // VARCHAR(160), optional
}
```

- **201 Response body:**

```json
{
	"patient": {
		"iid": 1234,
		"cin": "AB123456",
		"name": "Full Name",
		"sex": "M",
		"birthDate": "1990-01-01",
		"bloodGroup": "O+",
		"phone": "+212600000000",
		"email": "user@example.com",
		"city": "N/A",
		"insurance": "None",
		"status": "Outpatient"
	},
	"message": "Patient created"
}
```

- **Validation errors:** Return `400` with `{ "message": "reason" }` (duplicate IID/CIN, missing fields, invalid enum, etc.). The UI displays the backend-provided message above the table and inside the modal.

> Note: Until the real backend is available, the app registers a temporary in-memory mock server that implements the contract above so the Patients module can be tested end-to-end. Remove `registerPatientMockServer` in `src/App.jsx` once the backend endpoints are live.
