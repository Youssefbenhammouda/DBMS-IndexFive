## Setup Guide
- **Prerequisites**
	- Python 3.11 or newer installed and available on `PATH`.
	- Running MySQL instance with credentials for the MNHS dataset.


- **Create virtual environment**
    - Navigate to project root in terminal.
    - `cd physical-implementation\app`
	- `python -m venv .venv`
	- `.\.venv\Scripts\activate`

- **Install dependencies**
	- `pip install --upgrade pip`
	- `pip install -r requirements.txt`

- **Environment variables**
	- Duplicate `.env.example` as `.env` or create `.env` with:
		```env
		MYSQL_HOST=localhost
		MYSQL_PORT=3306
		MYSQL_DB=your_database
		MYSQL_USER=your_username
		MYSQL_PASSWORD=your_password
		```
	- Adjust values to match the MySQL instance.

- **Run the API**
	- `fastapi dev app.py`
	- App serves API and static frontend from `dist/`.

- **Explore endpoints**
	- Open `http://127.0.0.1:8000/docs` for interactive Swagger UI to test endpoints.
	- `http://127.0.0.1:8000/` for the frontend application.

- **Shut down**
	- `Ctrl+C` in the terminal, then `deactivate` to leave the virtual environment.
