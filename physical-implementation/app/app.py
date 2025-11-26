from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles
import mysql.connector
from mysql.connector import errorcode
from fastapi import FastAPI, Depends
from src.db import create_pool, aiomysql
from src.mnhs import list_patients_ordered_by_last_name, Patient
from typing import AsyncIterator

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the ML model
    app.state.db_pool = await create_pool()
    yield
    # Clean up the ML models and release the resources


app = FastAPI(
    title="IndexFive MNHS Management System API",
    description="API for managing medical and health services using IndexFive DBMS.",
    version="0.0.1",
    lifespan=lifespan,
)


async def get_conn() -> AsyncIterator[aiomysql.Connection]:
    """
    FastAPI dependency that yields a pooled asyncmy connection.
    """
    pool: aiomysql.pool.Pool = app.state.db_pool
    async with pool.acquire() as conn:
        try:
            yield conn
        finally:
            # no explicit close(), pool.acquire context handles it
            ...


# list_patients_ordered_by_last_name
@app.get("/api/patients", response_model=list[Patient])
async def get_patients(conn: aiomysql.Connection = Depends(get_conn)):
    patients = await list_patients_ordered_by_last_name(conn, limit=50)
    return patients


app.mount("/", StaticFiles(directory="dist", html=True), name="static")
