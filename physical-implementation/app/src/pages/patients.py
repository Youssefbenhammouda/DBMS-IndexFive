"""Patients endpoint helpers aligned with the MNHS contract."""

from __future__ import annotations

from datetime import date, datetime, time
from typing import Annotated, Any, Dict, List, Optional, Sequence, Literal

import aiomysql
from pydantic import BaseModel, ConfigDict, Field, field_validator


BloodGroup = Literal["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
PatientSex = Literal["M", "F"]
PatientStatus = Literal["Admitted", "Outpatient"]


class PatientsAPIError(Exception):
    """Exception carrying HTTP metadata for the patients endpoints."""

    def __init__(self, status_code: int, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.message = message


class PatientNextVisit(BaseModel):
    model_config = ConfigDict(extra="forbid")

    date: str
    time: Optional[str] = None
    hospital: Optional[str] = None
    department: Optional[str] = None
    reason: Optional[str] = None


class PatientRecord(BaseModel):
    model_config = ConfigDict(extra="forbid")

    iid: int
    cin: str
    name: str
    sex: PatientSex
    birthDate: Optional[str] = None
    bloodGroup: Optional[BloodGroup] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    city: str
    insurance: str
    insuranceStatus: Literal["Active", "Self-Pay"]
    policyNumber: Optional[str] = None
    status: PatientStatus
    nextVisit: Optional[PatientNextVisit] = None


class PatientsResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    patients: List[PatientRecord]
    lastSyncedAt: str


class PatientsQueryParams(BaseModel):
    model_config = ConfigDict(extra="forbid")

    search: Optional[str] = Field(default=None, max_length=100)
    sex: Optional[PatientSex] = None
    status: Optional[PatientStatus] = None
    bloodGroup: Optional[BloodGroup] = None

    @field_validator("search")
    @classmethod
    def _normalize_search(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        value = value.strip()
        return value or None


class PatientCreatePayload(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    iid: int
    cin: Annotated[str, Field(min_length=1, max_length=10)]
    name: Annotated[str, Field(min_length=1, max_length=100)]
    sex: PatientSex
    birth: Optional[date] = None
    bloodGroup: Optional[BloodGroup] = None
    phone: Optional[str] = Field(default=None, max_length=15)
    email: Optional[str] = Field(default=None, max_length=160)
    city: Optional[str] = None

    @field_validator("cin")
    @classmethod
    def _normalize_cin(cls, value: str) -> str:
        value = value.strip().upper()
        if not value:
            raise ValueError("cin must not be empty")
        return value

    @field_validator("name")
    @classmethod
    def _normalize_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("name must not be empty")
        return value

    @field_validator("phone", "email", "city")
    @classmethod
    def _strip_optional(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        value = value.strip()
        return value or None


class PatientCreateResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    patient: PatientRecord
    message: str = Field(default="Patient created")


async def get_all_patients(
    conn: aiomysql.Connection, params: Optional[PatientsQueryParams] = None
) -> List[PatientRecord]:
    """Fetch normalized patient rows with optional filters."""

    rows = await _fetch_patients(conn, params=params)
    return rows


async def create_patient(
    conn: aiomysql.Connection, payload: PatientCreatePayload
) -> PatientRecord:
    """Insert a patient and return the normalized record."""

    cin = payload.cin.upper()
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(
            "SELECT 1 FROM Patient WHERE IID = %s OR UPPER(CIN) = %s",
            (payload.iid, cin),
        )
        if await cur.fetchone():
            raise PatientsAPIError(
                409, f"Patient with IID {payload.iid} or CIN {cin} already exists"
            )

        await cur.execute(
            """
            INSERT INTO Patient (IID, CIN, FullName, Birth, Sex, BloodGroup, Phone)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                payload.iid,
                cin,
                payload.name,
                payload.birth,
                payload.sex,
                payload.bloodGroup,
                payload.phone,
            ),
        )

        city_value = payload.city or None
        if city_value:
            await cur.execute(
                "INSERT INTO ContactLocation (City) VALUES (%s)",
                (city_value,),
            )
            clid = cur.lastrowid
            await cur.execute(
                "INSERT INTO have (IID, CLID) VALUES (%s, %s)",
                (payload.iid, clid),
            )

    await conn.commit()

    patients = await _fetch_patients(
        conn,
        params=None,
        extra_conditions=["iid = %s"],
        extra_args=[payload.iid],
        limit=1,
    )
    if not patients:
        raise PatientsAPIError(500, "Unable to load the created patient")

    patient = patients[0]
    return patient.model_copy(update={"email": payload.email})


async def get_all_staff(conn: aiomysql.Connection) -> List[Dict[str, Any]]:
    """Get all staff with departments and hospitals."""
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(
            """
            SELECT 
                s.STAFF_ID as id,
                s.FullName as name,
                s.Status as status,
                GROUP_CONCAT(DISTINCT d.Name) as department_names,
                GROUP_CONCAT(DISTINCT h.Name) as hospital_names
            FROM Staff s
            LEFT JOIN Work_in w ON w.STAFF_ID = s.STAFF_ID
            LEFT JOIN Department d ON d.DEP_ID = w.DEP_ID
            LEFT JOIN Hospital h ON h.HID = d.HID
            GROUP BY s.STAFF_ID, s.FullName, s.Status
        """
        )
        staff_list = await cur.fetchall()

        for staff in staff_list:
            if staff["name"].startswith("Dr."):
                staff["role"] = "Doctor"
            elif staff["name"].startswith("Nurse"):
                staff["role"] = "Nurse"
            elif staff["name"].startswith("Technician"):
                staff["role"] = "Technician"
            else:
                staff["role"] = "Admin"

            staff["departments"] = (
                staff["department_names"].split(",")
                if staff["department_names"]
                else []
            )
            staff["hospitals"] = (
                staff["hospital_names"].split(",") if staff["hospital_names"] else []
            )

            del staff["department_names"]
            del staff["hospital_names"]

        return staff_list


async def create_staff(
    conn: aiomysql.Connection, staff_data: Dict[str, Any]
) -> Dict[str, Any]:
    async with conn.cursor() as cur:
        await cur.execute(
            """
            INSERT INTO Staff (STAFF_ID, FullName, Status)
            VALUES (%s, %s, %s)
        """,
            (
                staff_data["id"],
                staff_data["name"],
                staff_data.get("status", "Active"),
            ),
        )

    await conn.commit()

    return {
        "id": staff_data["id"],
        "name": staff_data["name"],
        "role": staff_data.get("role", "Staff"),
        "departments": staff_data.get("departments", []),
        "hospitals": staff_data.get("hospitals", []),
        "status": staff_data.get("status", "Active"),
    }


PATIENTS_BASE_CTE = """
WITH NextAppointments AS (
    SELECT
        CA.IID,
        CA.DEP_ID,
        CA.Date AS ActivityDate,
        CA.Time AS ActivityTime,
        A.Reason,
        ROW_NUMBER() OVER (
            PARTITION BY CA.IID
            ORDER BY CA.Date, COALESCE(CA.Time, '00:00:00'), CA.CAID
        ) AS rn
    FROM ClinicalActivity CA
    JOIN Appointment A ON A.CAID = CA.CAID
    WHERE CA.Date >= CURRENT_DATE
),
PrimaryLocations AS (
    SELECT IID, City
    FROM (
        SELECT
            h.IID,
            cl.City,
            ROW_NUMBER() OVER (PARTITION BY h.IID ORDER BY h.CLID ASC) AS rn
        FROM have h
        JOIN ContactLocation cl ON cl.CLID = h.CLID
    ) ranked
    WHERE rn = 1
),
LatestInsurance AS (
    SELECT IID, InsID, Type
    FROM (
        SELECT
            CA.IID,
            E.InsID,
            I.Type,
            ROW_NUMBER() OVER (
                PARTITION BY CA.IID
                ORDER BY CA.Date DESC, COALESCE(CA.Time, '00:00:00') DESC, CA.CAID DESC
            ) AS rn
        FROM ClinicalActivity CA
        JOIN Expense E ON E.CAID = CA.CAID
        LEFT JOIN Insurance I ON I.InsID = E.InsID
    ) ranked
    WHERE rn = 1
),
LatestStatus AS (
    SELECT IID, Outcome
    FROM (
        SELECT
            CA.IID,
            EM.Outcome,
            ROW_NUMBER() OVER (
                PARTITION BY CA.IID
                ORDER BY CA.Date DESC, COALESCE(CA.Time, '00:00:00') DESC, CA.CAID DESC
            ) AS rn
        FROM ClinicalActivity CA
        LEFT JOIN Emergency EM ON EM.CAID = CA.CAID
    ) ranked
    WHERE rn = 1
),
PatientRows AS (
    SELECT
        P.IID AS iid,
        UPPER(P.CIN) AS cin,
        P.FullName AS name,
        P.Sex AS sex,
        P.Birth AS birthDate,
        NULLIF(P.BloodGroup, '') AS bloodGroup,
        NULLIF(P.Phone, '') AS phone,
        NULL AS email,
        COALESCE(Loc.City, 'N/A') AS city,
        COALESCE(Ins.Type, 'None') AS insurance,
        CASE WHEN Stat.Outcome = 'Admitted' THEN 'Admitted' ELSE 'Outpatient' END AS status,
        CASE WHEN Ins.InsID IS NOT NULL THEN CONCAT('Policy ', LPAD(Ins.InsID, 4, '0'), '-', LPAD(P.IID, 4, '0')) ELSE NULL END AS policyNumber,
        NA.ActivityDate AS nextVisitDate,
        NA.ActivityTime AS nextVisitTime,
        H.Name AS nextVisitHospital,
        D.Name AS nextVisitDepartment,
        NA.Reason AS nextVisitReason
    FROM Patient P
    LEFT JOIN PrimaryLocations Loc ON Loc.IID = P.IID
    LEFT JOIN LatestInsurance Ins ON Ins.IID = P.IID
    LEFT JOIN LatestStatus Stat ON Stat.IID = P.IID
    LEFT JOIN NextAppointments NA ON NA.IID = P.IID AND NA.rn = 1
    LEFT JOIN Department D ON D.DEP_ID = NA.DEP_ID
    LEFT JOIN Hospital H ON H.HID = D.HID
)
"""


def _build_patients_query(
    params: Optional[PatientsQueryParams],
    *,
    extra_conditions: Optional[List[str]] = None,
    extra_args: Optional[List[Any]] = None,
    limit: Optional[int] = None,
) -> tuple[str, List[Any]]:
    filters: List[str] = []
    args: List[Any] = []

    if params:
        if params.search:
            pattern = f"%{params.search.lower()}%"
            filters.append("(LOWER(cin) LIKE %s OR LOWER(name) LIKE %s)")
            args.extend([pattern, pattern])
        if params.sex:
            filters.append("sex = %s")
            args.append(params.sex)
        if params.bloodGroup:
            filters.append("bloodGroup = %s")
            args.append(params.bloodGroup)
        if params.status:
            filters.append("status = %s")
            args.append(params.status)

    if extra_conditions:
        filters.extend(extra_conditions)
        if extra_args:
            args.extend(extra_args)

    sql = PATIENTS_BASE_CTE + "\nSELECT * FROM PatientRows"
    if filters:
        sql += "\nWHERE " + " AND ".join(filters)
    sql += "\nORDER BY name ASC"
    if limit is not None:
        sql += "\nLIMIT %s"
        args.append(limit)

    return sql, args


async def _fetch_patients(
    conn: aiomysql.Connection,
    *,
    params: Optional[PatientsQueryParams] = None,
    extra_conditions: Optional[List[str]] = None,
    extra_args: Optional[List[Any]] = None,
    limit: Optional[int] = None,
) -> List[PatientRecord]:
    sql, args = _build_patients_query(
        params,
        extra_conditions=extra_conditions,
        extra_args=extra_args,
        limit=limit,
    )
    rows = await _fetchall(conn, sql, tuple(args))
    return [_normalize_patient_row(row) for row in rows]


async def _fetchall(
    conn: aiomysql.Connection,
    sql: str,
    params: Sequence[Any],
) -> List[Dict[str, Any]]:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(sql, params)
        return await cur.fetchall()


def _normalize_patient_row(row: Dict[str, Any]) -> PatientRecord:
    insurance = row.get("insurance") or "None"
    insurance_status = "Active" if insurance != "None" else "Self-Pay"
    policy_number = row.get("policyNumber") if insurance_status == "Active" else None
    patient_payload: Dict[str, Any] = {
        "iid": int(row.get("iid", 0)),
        "cin": (row.get("cin") or "").upper(),
        "name": row.get("name"),
        "sex": row.get("sex"),
        "birthDate": _iso_date(row.get("birthDate")),
        "bloodGroup": row.get("bloodGroup") or None,
        "phone": row.get("phone") or None,
        "email": row.get("email"),
        "city": row.get("city") or "N/A",
        "insurance": insurance,
        "insuranceStatus": insurance_status,
        "policyNumber": policy_number,
        "status": row.get("status") or "Outpatient",
        "nextVisit": _build_next_visit(row),
    }
    return PatientRecord.model_validate(patient_payload)


def _build_next_visit(row: Dict[str, Any]) -> Optional[PatientNextVisit]:
    date_value = _iso_date(row.get("nextVisitDate"))
    if not date_value:
        return None
    time_value = _iso_time(row.get("nextVisitTime"))
    visit_payload = {
        "date": date_value,
        "time": time_value,
        "hospital": row.get("nextVisitHospital"),
        "department": row.get("nextVisitDepartment"),
        "reason": row.get("nextVisitReason"),
    }
    return PatientNextVisit.model_validate(visit_payload)


def _iso_date(value: Optional[Any]) -> Optional[str]:
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    return value if isinstance(value, str) else None


def _iso_time(value: Optional[Any]) -> Optional[str]:
    if isinstance(value, datetime):
        value = value.time()
    if isinstance(value, time):
        return value.replace(microsecond=0).strftime("%H:%M")
    if isinstance(value, str):
        return value
    return None


__all__ = [
    "PatientCreatePayload",
    "PatientCreateResponse",
    "PatientRecord",
    "PatientsAPIError",
    "PatientsQueryParams",
    "PatientsResponse",
    "create_patient",
    "create_staff",
    "get_all_patients",
    "get_all_staff",
]
