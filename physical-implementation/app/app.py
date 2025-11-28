from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, Depends
from src.db import create_pool, aiomysql
from src.mnhs import (
    get_all_patients,
    create_patient,
    get_all_staff,
    create_staff,
    get_core_dashboard_stats_mnhs,
    list_low_stock_medications,
    staff_appointment_share,
    core_dashboard_appointments,
    Patient,
    Staff
)
from src.models import *
from typing import AsyncIterator
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

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

async def get_conn() -> AsyncIterator[aiomysql.Connection]:
    pool = app.state.db_pool
    async with pool.acquire() as conn:
        yield conn


# GET /api/patients - Simple version
@app.get("/api/patients")
async def get_patients(conn: aiomysql.Connection = Depends(get_conn)):
    patients = await get_all_patients(conn)
    return {
        "patients": patients,
        "lastSyncedAt": datetime.now().isoformat()
    }


@app.post("/api/patients", status_code=201)
async def post_patient(patient: Patient, conn: aiomysql.Connection = Depends(get_conn)):
    try:
        created = await create_patient(conn, patient.dict())
        return {
            "patient": created,
            "message": "Patient created"
        }
    except Exception as e:
        await conn.rollback()
        return JSONResponse(status_code=500, content={"message": str(e)})


# GET /api/staff - Simple version
@app.get("/api/staff")
async def get_staff(conn: aiomysql.Connection = Depends(get_conn)):
    staff = await get_all_staff(conn)
    return {
        "staff": staff,
        "lastSyncedAt": datetime.now().isoformat()
    }


@app.post("/api/staff", status_code=201)
async def post_staff(staff: Staff, conn: aiomysql.Connection = Depends(get_conn)):
    try:
        created = await create_staff(conn, staff.dict())
        return {
            "staff": created,
            "message": "Staff created"
        }
    except Exception as e:
        await conn.rollback()
        return JSONResponse(status_code=500, content={"message": str(e)})



# Keep existing core dashboard endpoint
@app.get("/api/core-dashboard", response_model=CoreDashboardResponse)
async def get_core_dashboard_stats(
    query: QueryCoreDashboardStats = Depends(),
    conn: aiomysql.Connection = Depends(get_conn),
):
    return await get_core_dashboard_stats_mnhs(conn, query)


app.mount("/", StaticFiles(directory="dist", html=True), name="static")