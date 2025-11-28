from datetime import date, time, timedelta
import aiomysql
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import List, Literal, Optional

## Models


AppointmentStatus = Literal["Scheduled", "Completed", "Cancelled"]


class QueryCoreDashboardStats(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    date_range: Optional[str] = Field(default=None, alias="range")

    @field_validator("date_range")
    @classmethod
    def validate_iso_date_range(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value

        try:
            start_raw, end_raw = value.split("/", 1)
        except ValueError as exc:
            raise ValueError(
                "range must contain two ISO dates separated by '/' "
            ) from exc

        start_str = start_raw.strip()
        end_str = end_raw.strip()

        try:
            start_date = date.fromisoformat(start_str)
            end_date = date.fromisoformat(end_str)
        except ValueError as exc:
            raise ValueError("range dates must follow ISO format YYYY-MM-DD") from exc

        if start_date > end_date:
            raise ValueError("range start date must be on or before the end date")

        return f"{start_date.isoformat()}/{end_date.isoformat()}"


class CoreDashboardAppointment(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: int
    patient_name: str = Field(alias="patientName")
    status: AppointmentStatus
    hospital: str
    date: date
    time: time
    department: str


class CoreDashboardStaff(BaseModel):
    id: int
    name: str
    role: str
    hospitals: List[str]
    workload: int
    status: str


class CoreDashboardMedication(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: int
    name: str
    category: str
    stock_level: int = Field(alias="stockLevel")
    reorder_point: int = Field(alias="reorderPoint")
    unit: str


class CoreDashboardSummaryStats(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    total_appointments: int = Field(alias="totalAppointments")
    upcoming_appointments: int = Field(alias="upcomingAppointments")
    active_staff: int = Field(alias="activeStaff")
    admitted_patients: int = Field(alias="admittedPatients")


class CoreDashboardResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    appointments: List[CoreDashboardAppointment] = Field(default_factory=list)
    staff: List[CoreDashboardStaff] = Field(default_factory=list)
    staff_leaderboard: List[CoreDashboardStaff] = Field(
        default_factory=list, alias="staffLeaderboard"
    )
    low_stock_medications: List[CoreDashboardMedication] = Field(
        default_factory=list, alias="lowStockMedications"
    )
    summary: CoreDashboardSummaryStats


# /api/core-dashboard
def timedelta_to_time(td: timedelta) -> time:
    # MySQL TIME is a duration from 00:00:00, so:
    total_seconds = int(td.total_seconds())
    hours = (total_seconds // 3600) % 24
    minutes = (total_seconds % 3600) // 60
    seconds = total_seconds % 60
    return time(hour=hours, minute=minutes, second=seconds)


async def core_dashboard_appointments(
    conn: aiomysql.Connection,
) -> List[CoreDashboardAppointment]:
    """Retrieve core dashboard appointments.

    Args:
        conn (aiomysql.Connection): The database connection.
    Returns:
        List of CoreDashboardAppointment.
    """
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(
            """
            SELECT C.`CAID` as id, P.`FullName` as patientName, A.`Status` as status,H.`Name` as hospital,C.`Date` as date,C.`Time` as time,D.`Name` as department FROM `Appointment` A
JOIn `ClinicalActivity` C ON C.`CAID` = A.`CAID`
JOIN `Patient` P ON P.`IID` = C.`IID`
JOIn `Department` D ON D.`DEP_ID` = C.`DEP_ID`
JOIN `Hospital` H ON H.`HID` = D.`HID`
            ORDER BY C.`Date` DESC, C.`Time` DESC"""
        )
        result = await cur.fetchall()
        return [
            CoreDashboardAppointment(
                id=row["id"],
                patientName=row["patientName"],
                status=row["status"],
                hospital=row["hospital"],
                date=row["date"],
                time=timedelta_to_time(row["time"]),
                department=row["department"],
            )
            for row in result
        ]


async def core_dashboard_staff(conn: aiomysql.Connection) -> List[CoreDashboardStaff]:
    """Retrieve core dashboard staff appointment shares.

    Args:
        conn (aiomysql.Connection): The database connection.
    Returns:
        List of StaffAppointmentShare.
    """
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(
            """
WITH staff_hospitals AS (
    SELECT
        s.STAFF_ID,
        GROUP_CONCAT(DISTINCT h.Name ORDER BY h.Name SEPARATOR ', ') AS hospitals
    FROM Staff s
    LEFT JOIN Work_in w   ON w.STAFF_ID = s.STAFF_ID
    LEFT JOIN Department d ON d.DEP_ID = w.DEP_ID
    LEFT JOIN Hospital h   ON h.HID = d.HID
    GROUP BY s.STAFF_ID
),
staff_workload AS (
    SELECT
        s.STAFF_ID,
        COUNT(a.CAID) AS workload   -- total appointments per staff
    FROM Staff s
    LEFT JOIN ClinicalActivity c ON c.STAFF_ID = s.STAFF_ID
    LEFT JOIN Appointment a      ON a.CAID = c.CAID
    GROUP BY s.STAFF_ID
)
SELECT
    s.STAFF_ID                          AS id,
    s.FullName                          AS name,
    SUBSTRING_INDEX(s.FullName, ' ', 1) AS role,       -- e.g. 'Dr.', 'Nurse', 'Technician'
    sh.hospitals                        AS hospitals,  -- comma-separated; split into List[str] in Python
    COALESCE(sw.workload, 0)           AS workload,
    s.Status                            AS status      -- 'Active' / 'Retired'
FROM Staff s
LEFT JOIN staff_hospitals sh ON sh.STAFF_ID = s.STAFF_ID
LEFT JOIN staff_workload  sw ON sw.STAFF_ID = s.STAFF_ID;

"""
        )
        result = await cur.fetchall()
        return [
            CoreDashboardStaff(
                id=row["id"],
                name=row["name"],
                role=row["role"],
                hospitals=row["hospitals"].split(", ") if row["hospitals"] else [],
                workload=row["workload"],
                status=row["status"],
            )
            for row in result
        ]


async def core_dashboard_medications(
    conn: aiomysql.Connection,
) -> List[CoreDashboardMedication]:
    """Retrieve core dashboard low stock medications.

    Args:
        conn (aiomysql.Connection): The database connection.
    Returns:
        List of CoreDashboardMedication.
    """
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(
            """
            WITH latest_stock AS (
    SELECT
        s.HID,
        s.MID,
        s.Qty,
        s.ReorderLevel,
        ROW_NUMBER() OVER (
            PARTITION BY s.HID, s.MID
            ORDER BY s.StockTimestamp DESC
        ) AS rn
    FROM Stock AS s
),
agg_stock AS (
    
    SELECT
        ls.MID,
        SUM(ls.Qty)          AS total_qty,
        SUM(ls.ReorderLevel) AS total_reorder
    FROM latest_stock AS ls
    WHERE ls.rn = 1
    GROUP BY ls.MID
)
SELECT
    m.MID                AS id,
    m.Name               AS name,
    m.TherapeuticClass   AS category,
    COALESCE(a.total_qty, 0)     AS stockLevel,    
    COALESCE(a.total_reorder, 0) AS reorderPoint,  
    m.Form               AS unit                   
FROM Medication AS m
LEFT JOIN agg_stock AS a
       ON a.MID = m.MID
WHERE a.total_qty < a.total_reorder
   OR a.total_qty IS NULL;   
"""
        )
        result = await cur.fetchall()
        return [
            CoreDashboardMedication(
                id=row["id"],
                name=row["name"],
                category=row["category"],
                stockLevel=row["stockLevel"],
                reorderPoint=row["reorderPoint"],
                unit=row["unit"],
            )
            for row in result
        ]


async def core_dashboard_summary_stats(
    conn: aiomysql.Connection,
) -> CoreDashboardSummaryStats:
    """Retrieve core dashboard summary statistics.

    Args:
        conn (aiomysql.Connection): The database connection.
    Returns:
        CoreDashboardSummaryStats.
    """
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(
            """
            SELECT
    /* total_appointments */
    (SELECT COUNT(*)
     FROM Appointment
    ) AS totalAppointments,

    /* upcoming_appointments: scheduled and in the future (by Date) */
    (SELECT COUNT(*)
     FROM Appointment a
     JOIN ClinicalActivity c ON c.CAID = a.CAID
     WHERE a.Status = ' Scheduled '
       AND c.Date >= CURRENT_DATE()
    ) AS upcomingAppointments,

    /* active_staff */
    (SELECT COUNT(*)
     FROM Staff
     WHERE Status = 'Active '
    ) AS activeStaff,

    /* admitted_patients: distinct patients with an ER Outcome = 'Admitted ' */
    (SELECT COUNT(DISTINCT c.IID)
     FROM Emergency e
     JOIN ClinicalActivity c ON c.CAID = e.CAID
     WHERE e.Outcome = 'Admitted '
    ) AS admittedPatients;
            """
        )
        row = await cur.fetchone()
        return CoreDashboardSummaryStats(
            totalAppointments=row["totalAppointments"],
            upcomingAppointments=row["upcomingAppointments"],
            activeStaff=row["activeStaff"],
            admittedPatients=row["admittedPatients"],
        )


async def get_core_dashboard_stats_mnhs(
    conn: aiomysql.Connection,
    query: QueryCoreDashboardStats,
) -> CoreDashboardResponse:
    """Retrieve core dashboard statistics including low stock medications and staff appointment shares.

    Args:
        conn (aiomysql.Connection): The database connection.
    Returns:
        CoreDashboardResponse containing low stock medications and staff appointment shares.
    """

    appointments = await core_dashboard_appointments(conn)
    staff = await core_dashboard_staff(conn)
    staff_leaderboard = list(sorted(staff, key=lambda s: s.workload, reverse=True))
    low_stock_medications = await core_dashboard_medications(conn)
    summary = await core_dashboard_summary_stats(conn)
    return CoreDashboardResponse(
        appointments=appointments,
        staff=staff,
        staffLeaderboard=staff_leaderboard,
        lowStockMedications=low_stock_medications,
        summary=summary,
    )
 