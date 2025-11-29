from contextlib import asynccontextmanager
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, Depends, Query, Request
from fastapi.exceptions import RequestValidationError
from src.db import create_pool, aiomysql
from src.pages.medications import (
    MedicationIn,
    MedicationsAPIError,
    MedicationsQueryParams,
    MedicationsResponse,
    StockEntryIn,
    create_medication,
    get_low_stock,
    insert_stock_entry,
)
from src.pages.patients import (
    PatientCreatePayload,
    PatientCreateResponse,
    PatientsAPIError,
    PatientsQueryParams,
    PatientsResponse,
    create_patient,
    create_staff,
    get_all_patients,
    get_all_staff,
)
from src.pages.core_dashboard import *
from src.mnhs import Staff
from src.models import *
from typing import AsyncIterator, Optional, Literal
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, date, time, timezone
from src.pages.appointments import schedule_appointment, get_all_appointments

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.db_pool = await create_pool()

    yield


app = FastAPI(
    title="IndexFive MNHS Management System API",
    description="API for managing medical and health services using IndexFive DBMS.",
    version="0.0.1",
    lifespan=lifespan,
)
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    message = "Invalid request payload"
    if exc.errors():
        first = exc.errors()[0]
        message = first.get("msg", message)
    return JSONResponse(status_code=400, content={"message": message})


async def get_conn() -> AsyncIterator[aiomysql.Connection]:
    pool = app.state.db_pool
    async with pool.acquire() as conn:
        try:
            yield conn
            if not conn.get_autocommit():
                await conn.commit()
        except Exception:
            if not conn.get_autocommit():
                await conn.rollback()
            raise


def _utcnow_iso() -> str:
    """Return an ISO 8601 UTC timestamp suffixed with Z."""

    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


class AppointmentCreate(BaseModel):
    id: Optional[str] = None
    date: date
    time: time
    hospital: str
    department: str
    patient: str
    staff: str
    reason: str
    status: Literal["Scheduled", "Completed", "Cancelled", "No Show"]


# GET /api/patients
@app.get("/api/patients", response_model=PatientsResponse)
async def get_patients(
    query: PatientsQueryParams = Depends(),
    conn: aiomysql.Connection = Depends(get_conn),
):
    try:
        patients = await get_all_patients(conn, query)
        return PatientsResponse(patients=patients, lastSyncedAt=_utcnow_iso())
    except PatientsAPIError as exc:
        return JSONResponse(
            status_code=exc.status_code, content={"message": exc.message}
        )
    except Exception as exc:
        return JSONResponse(status_code=500, content={"message": str(exc)})


@app.post("/api/patients", response_model=PatientCreateResponse, status_code=201)
async def post_patient(
    patient: PatientCreatePayload,
    conn: aiomysql.Connection = Depends(get_conn),
):
    try:
        created = await create_patient(conn, patient)
        return PatientCreateResponse(patient=created)
    except PatientsAPIError as exc:
        await conn.rollback()
        return JSONResponse(
            status_code=exc.status_code, content={"message": exc.message}
        )
    except Exception as exc:
        await conn.rollback()
        return JSONResponse(status_code=500, content={"message": str(exc)})


# GET /api/staff - Simple version
@app.get("/api/staff")
async def get_staff(conn: aiomysql.Connection = Depends(get_conn)):
    staff = await get_all_staff(conn)
    return {"staff": staff, "lastSyncedAt": datetime.now().isoformat()}


@app.post("/api/staff", status_code=201)
async def post_staff(staff: Staff, conn: aiomysql.Connection = Depends(get_conn)):
    try:
        created = await create_staff(conn, staff.model_dump())
        return {"staff": created, "message": "Staff created"}
    except Exception as e:
        await conn.rollback()
        return JSONResponse(status_code=500, content={"message": str(e)})


# Keep existing core dashboard endpoint
@app.get("/api/core-dashboard", response_model=CoreDashboardResponse)
async def get_core_dashboard_stats(
    query: QueryCoreDashboardStats = Depends(),
    conn: aiomysql.Connection = Depends(get_conn),
):
    try:
        return await get_core_dashboard_stats_mnhs(conn, query)
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": str(e)})


@app.get("/api/billing", response_model=BillingResponse)
async def get_billing(
    query: BillingQueryParams = Depends(),
    conn: aiomysql.Connection = Depends(get_conn),
):
    try:
        return await get_billing_dashboard(conn, query)
    except BillingAPIError as exc:
        return JSONResponse(status_code=exc.status_code, content=exc.to_payload())
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={"message": str(exc), "code": "BILLING_500"},
        )


@app.post(
    "/api/billing/expense",
    response_model=CreateExpenseResponse,
    status_code=201,
)
async def post_billing_expense(
    payload: CreateExpenseRequest,
    conn: aiomysql.Connection = Depends(get_conn),
):
    try:
        expense = await create_billing_expense(conn, payload)
        await conn.commit()
        return CreateExpenseResponse(expense=expense, message="Expense captured")
    except BillingAPIError as exc:
        await conn.rollback()
        return JSONResponse(status_code=exc.status_code, content=exc.to_payload())
    except Exception as exc:
        await conn.rollback()
        return JSONResponse(
            status_code=500,
            content={"message": str(exc), "code": "BILLING_500"},
        )


@app.get("/api/medications", response_model=MedicationsResponse)
async def get_medications(
    query: MedicationsQueryParams = Depends(),
    conn: aiomysql.Connection = Depends(get_conn),
):
    try:
        return await get_low_stock(conn, query)
    except MedicationsAPIError as exc:
        return JSONResponse(
            status_code=exc.status_code, content={"message": exc.message}
        )
    except Exception as exc:
        return JSONResponse(status_code=500, content={"message": str(exc)})


@app.post("/api/medications", status_code=201)
async def post_medication(
    body: MedicationIn,
    conn: aiomysql.Connection = Depends(get_conn),
):
    try:
        med = await create_medication(conn, body)
        return {
            "medication": med,
            "message": "Medication created",
        }
    except MedicationsAPIError as exc:
        await conn.rollback()
        return JSONResponse(
            status_code=exc.status_code, content={"message": exc.message}
        )
    except Exception as exc:
        await conn.rollback()
        return JSONResponse(status_code=500, content={"message": str(exc)})


@app.post("/api/medications/stock", status_code=201)
async def post_medication_stock(
    body: StockEntryIn,
    conn: aiomysql.Connection = Depends(get_conn),
):
    if body.qtyReceived <= 0:
        return JSONResponse(
            status_code=400,
            content={"message": "qtyReceived must be > 0"},
        )
    if body.unitPrice < 0:
        return JSONResponse(
            status_code=400,
            content={"message": "unitPrice must be >= 0"},
        )

    try:
        stock = await insert_stock_entry(conn, body)
        return {
            "stockEntry": stock,
            "message": "Stock entry recorded",
        }
    except MedicationsAPIError as exc:
        await conn.rollback()
        return JSONResponse(
            status_code=exc.status_code, content={"message": exc.message}
        )
    except Exception as exc:
        await conn.rollback()
        return JSONResponse(status_code=500, content={"message": str(exc)})


# GET /api/appointments
@app.get("/api/appointments")
async def get_appointments(
    date_range: Optional[str] = Query(default=None, alias="range"),
    status: Optional[str] = Query(default=None),
    hospital: Optional[str] = Query(default=None),
    conn: aiomysql.Connection = Depends(get_conn),
):
    try:
        data = await get_all_appointments(
            conn, date_range=date_range, status=status, hospital=hospital
        )
        return data
    except ValueError as exc:
        return JSONResponse(status_code=400, content={"message": str(exc)})
    except Exception as exc:
        return JSONResponse(status_code=500, content={"message": str(exc)})


@app.post("/api/appointments", status_code=201)
async def post_appointments(
    body: AppointmentCreate, conn: aiomysql.Connection = Depends(get_conn)
):
    try:
        result = await schedule_appointment(
            conn=conn,
            date_=body.date,
            time_=body.time,
            hospital_name=body.hospital,
            department_name=body.department,
            patient_name=body.patient,
            staff_name=body.staff,
            reason=body.reason,
            status=body.status,
            appointment_id=body.id,
        )
        return result
    except ValueError as exc:
        await conn.rollback()
        return JSONResponse(status_code=400, content={"message": str(exc)})
    except Exception as exc:
        await conn.rollback()
        return JSONResponse(status_code=500, content={"message": str(exc)})


#
app.mount("/", StaticFiles(directory="dist", html=True), name="static")
