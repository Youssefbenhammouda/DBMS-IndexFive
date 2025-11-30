# MNHS Physical Implementation

## 1. Assumptions & Conventions
- Schema objects mirror the Lab05 reference solution from Canvas; we did not introduce any additional tables beyond that baseline design.
- Application testing target: Python 3.13.9.
- Database testing target: MySQL 9.4.0-1.el9.

## 2. Schema Prep (Auto-Increment Patch)
- The professor starter omitted `AUTO_INCREMENT` on several PK columns. If your database matches that baseline, run `mnhspatch.sql` (replace `MNHS` with your schema name) using a user with `ALTER` permissions. The script disables FK checks, alters each table, and restores the original state.

## 3. Environment Setup
- **Prerequisites**
   - Running MySQL instance plus valid MNHS credentials.

- **Create virtual environment**
   - From the repo root: `cd physical-implementation\app`.
   - `python -m venv .venv`
   - `.venv\Scripts\activate`

- **Install dependencies**
   - `pip install --upgrade pip`
   - `pip install -r requirements.txt`

- **Environment variables**
   - Copy `.env.example` to `.env` (or create one) and set:
      ```env
      MYSQL_HOST=localhost
      MYSQL_PORT=3306
      MYSQL_DB=your_database
      MYSQL_USER=your_username
      MYSQL_PASSWORD=your_password
      ```
   - Adjust values to match your instance; the FastAPI app reads them via `python-dotenv`.

- **Run the API & UI**
   - `fastapi dev app.py`
   - This single command launches the API, serves the compiled UI from `dist/`, exposes the app at `http://127.0.0.1:8000/`, and provides Swagger docs at `/docs`. To inspect UI source, see `physical-implementation\UI-sourceonly`.

- **Explore endpoints**
   - Use `http://127.0.0.1:8000/docs` for interactive Swagger testing.
   - `http://127.0.0.1:8000/` loads the bundled frontend.

- **Shut down**
   - Press `Ctrl+C`, then `deactivate` to leave the virtual environment.

- You will find as a fallback option, dump.sql in the repo root, which contains the full MNHS schema and sample data that we used for testing.


## 3. Roadmap & Team Workflow
- Two-track delivery: Youssef Benhammouda owned the frontend, rapidly prototyping with AI-generated scaffolds and then polishing interactions by hand, while the backend team (Biar Adam — team lead, Yahia Belfquih, Zakarya Aze-Dine, Adam Ajerouassi) implemented the MNHS data layer and APIs.
- Frontend-to-backend contract: the UI owner produced the `requirements/` specs (endpoint signatures, payloads, models) consumed by the backend engineers to keep both tracks aligned.
- Integration & QA: once endpoints matched the contract, the whole team exercised every page through the FastAPI dev server plus Swagger docs to verify data flows, error handling, and the compiled UI bundled under `dist/`.

The team leveraged AI assistance during multiple UI iterations and for shaping some backend scaffolding, but all database modeling, migrations, and tuning were authored entirely by the team.


## 4. Views and Triggers

All SQL views and triggers are available in the parent directory `\physical-implementation`