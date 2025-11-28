from .db import *
from typing import Optional, Literal, List, Tuple, Dict, Any
from datetime import date, time, datetime, timedelta
from .models import *



async def get_all_patients(conn: aiomysql.Connection) -> List[Dict[str, Any]]:
    """Get all patients with required fields."""
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("""
            SELECT 
                IID as iid,
                CIN as cin,
                FullName as name,
                Sex as sex,
                Birth as birthDate,
                BloodGroup as bloodGroup,
                Phone as phone,
                Email as email
            FROM Patient
            ORDER BY IID
        """)
        patients = await cur.fetchall()
        
        # Add required fields with defaults
        for patient in patients:
            patient['city'] = 'N/A'
            patient['insurance'] = 'None'
            patient['status'] = 'Outpatient'
            if patient['birthDate']:
                patient['birthDate'] = patient['birthDate'].isoformat()
        
        return patients

async def create_patient(conn: aiomysql.Connection, patient_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new patient in the actual database."""
    async with conn.cursor() as cur:
        await cur.execute("""
            INSERT INTO Patient (IID, CIN, FullName, Birth, Sex, BloodGroup, Phone, Email)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            patient_data["iid"],
            patient_data["cin"],
            patient_data["full_name"],      # <-- correct mapping
            patient_data.get("birth"),      # can be None
            patient_data["sex"],
            patient_data.get("blood_group"),
            patient_data.get("phone"),
            patient_data.get("email"),
        ))

    await conn.commit() 

    return {
        "iid": patient_data["iid"],
        "cin": patient_data["cin"],
        "name": patient_data["full_name"],
        "sex": patient_data["sex"],
        "birthDate": patient_data.get("birth"),
        "bloodGroup": patient_data.get("blood_group"),
        "phone": patient_data.get("phone"),
        "email": patient_data.get("email"),
        "city": "N/A",
        "status": "Outpatient"
    }


async def get_all_staff(conn: aiomysql.Connection) -> List[Dict[str, Any]]:
    """Get all staff with departments and hospitals."""
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("""
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
        """)
        staff_list = await cur.fetchall()
        
        # Add role and format arrays
        for staff in staff_list:
            # Simple role detection from name
            if staff['name'].startswith('Dr.'):
                staff['role'] = 'Doctor'
            elif staff['name'].startswith('Nurse'):
                staff['role'] = 'Nurse'
            elif staff['name'].startswith('Technician'):
                staff['role'] = 'Technician'
            else:
                staff['role'] = 'Admin'
            
            staff['departments'] = staff['department_names'].split(',') if staff['department_names'] else []
            staff['hospitals'] = staff['hospital_names'].split(',') if staff['hospital_names'] else []
            
            # Remove the temporary fields
            del staff['department_names']
            del staff['hospital_names']
        
        return staff_list

async def create_staff(conn: aiomysql.Connection, staff_data: Dict[str, Any]) -> Dict[str, Any]:
    async with conn.cursor() as cur:
        await cur.execute("""
            INSERT INTO Staff (STAFF_ID, FullName, Status)
            VALUES (%s, %s, %s)
        """, (
            staff_data["id"],
            staff_data["name"],
            staff_data.get("status", "Active"),
        ))

    await conn.commit()  

    return {
        "id": staff_data["id"],
        "name": staff_data["name"],
        "role": staff_data.get("role", "Staff"),
        "departments": staff_data.get("departments", []),
        "hospitals": staff_data.get("hospitals", []),
        "status": staff_data.get("status", "Active")
    }


async def schedule_appointment(
    conn: aiomysql.Connection,
    iid: int,
    staff_id: int,
    dep_id: int,
    date_: date,
    time_: Optional[time],
    reason: Optional[str],
    status: Literal["Scheduled", "Completed", "Cancelled"] = "Scheduled",
):
    """Schedule a new appointment.

        Args:
            conn (aiomysql.Connection): The database connection.

        DB:
        #### 2.1.8 `ClinicalActivity`
    - **Purpose:** Abstract superclass for any clinical interaction (appointment or emergency).
    - **Primary key:** _CAID_
    - **Attributes:**
      - `CAID` (INT, PK)
      - `IID` (INT, FK → Patient.IID, NOT NULL)
      - `STAFF_ID` (INT, FK → Staff.STAFF_ID, NOT NULL)
      - `DEP_ID` (INT, FK → Department.DEP_ID, NOT NULL)
      - `Date` (DATE, NOT NULL)
      - `Time` (TIME, NULL)
    - **FD:** `CAID → IID, STAFF_ID, DEP_ID, Date, Time`.
    - **Relationships:**
      - Many‑to‑one to `Patient`, `Staff`, and `Department`.
      - One‑to‑one with `Expense` (via `CAID`/`ExpID`).
      - One‑to‑zero/one with `Appointment` (ISA)
      - One‑to‑zero/one with `Emergency` (ISA)
      - One‑to‑zero/one with `Prescription` (in this schema each activity can have at most one prescription).

    #### 2.1.9 `Appointment` (ISA of ClinicalActivity)
    - **Purpose:** Planned consultations.
    - **Primary key & FK:** _CAID_ (FK → ClinicalActivity.CAID, ON DELETE CASCADE)
    - **Attributes:**
      - `CAID` (INT, PK, FK)
      - `Reason` (VARCHAR(100), NULL)
      - `Status` (ENUM('Scheduled','Completed','Cancelled') DEFAULT 'Scheduled')
    - **FD:** `CAID → Reason, Status`.
    - **Relationships:**
      - Each appointment is one clinical activity.
      - Used by views such as UpcomingByHospital and PatientNextVisit.
    """
    async with conn.cursor() as cur:
        # Insert into ClinicalActivity
        await cur.execute(
            """
            INSERT INTO ClinicalActivity (IID, STAFF_ID, DEP_ID, Date, Time)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (iid, staff_id, dep_id, date_, time_),
        )
        caid = cur.lastrowid

        # Insert into Appointment
        await cur.execute(
            """
            INSERT INTO Appointment (CAID, Reason, Status)
            VALUES (%s, %s, %s)
            """,
            (caid, reason, status),
        )


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
