from .pages.core_dashboard import (
    get_core_dashboard_stats_mnhs,
    CoreDashboardResponse,
    QueryCoreDashboardStats,
)


from .pages.patients import (
    create_patient,
    get_all_patients,
    Patient,
    get_all_staff,
    create_staff,
    Staff,
)

from .db import *
from typing import Optional, Literal, List, Tuple, Dict, Any
from datetime import date, time, datetime, timedelta
from .models import *


class MedicationStock(BaseModel):
    hid: int
    hospital_name: str
    mid: int
    medication_name: str
    qty: int
    reorder_level: int


class StaffAppointmentShare(BaseModel):
    staff_id: int
    full_name: str
    status: str
    hid: int
    hospital_name: str
    city: str
    region: str
    percentage: float


async def list_low_stock_medications(
    conn: aiomysql.Connection,
) -> List[MedicationStock]:
    """List medications that are below their reorder level for each hospital.
        Args:
            conn (aiomysql.Connection): The database connection.

    Returns:
        List of low stock medications as dictionaries.
    """

    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(
            """
            SELECT
    h.HID,
    h.Name  AS HospitalName,
    m.MID,
    m.Name  AS MedicationName,
    s.Qty,
    s.ReorderLevel
FROM Hospital   h
CROSS JOIN Medication m
LEFT JOIN Stock s
    ON s.HID = h.HID
   AND s.MID = m.MID
WHERE
    s.MID IS NULL          -- medication not stocked at all in this hospital
    OR s.Qty < s.ReorderLevel
ORDER BY
    h.HID,
    m.MID
            """
        )
        result = await cur.fetchall()
        return [
            MedicationStock(
                hid=row["HID"],
                hospital_name=row["HospitalName"],
                mid=row["MID"],
                medication_name=row["MedicationName"],
                qty=row["Qty"] if row["Qty"] is not None else 0,
                reorder_level=(
                    row["ReorderLevel"] if row["ReorderLevel"] is not None else 0
                ),
            )
            for row in result
        ]


# Command staff share: for each staff member compute total number of appointments and percentage share within their hospital. Return a sorted table.


async def staff_appointment_share(
    conn: aiomysql.Connection,
) -> List[StaffAppointmentShare]:
    """Compute total number of appointments and percentage share within their hospital for each staff member.
        Args:
            conn (aiomysql.Connection): The database connection.
    Returns:
        List of staff appointment shares as dictionaries.
    """
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(
            """
            SELECT S.*,H.*,
    X.appts_per_hospital * 1.0 
      / SUM(X.appts_per_hospital) OVER (PARTITION BY X.HID) AS percentage   FROM 
(SELECT S.`STAFF_ID`,H.`HID`, count(*) as appts_per_hospital FROM `Staff`S
JOIN `ClinicalActivity` C ON C.`STAFF_ID`=S.`STAFF_ID`
JOIN `Department` D ON D.`DEP_ID`=C.`DEP_ID`
JOIN `Hospital` H ON H.`HID` = D.`HID`
JOIN `Appointment` A ON A.`CAID` = C.`CAID`
GROUP BY S.`STAFF_ID`,H.`HID`) X
JOIN `Staff` S ON S.`STAFF_ID`=X.STAFF_ID
JOIN `Hospital` H ON H.HID=X.HID
ORDER BY percentage
            """
        )
        result = await cur.fetchall()
        return [
            StaffAppointmentShare(
                staff_id=row["STAFF_ID"],
                full_name=row["FullName"],
                status=row["Status"],
                hid=row["HID"],
                hospital_name=row["Name"],
                city=row["City"],
                region=row["Region"],
                percentage=row["percentage"],
            )
            for row in result
        ]
