from .db import *
from typing import Optional, Literal, List, Tuple, Dict, Any
from datetime import date, time, datetime
from .models import *


async def insert_patient(
    conn: aiomysql.Connection,
    patient: Patient,
):
    """Insert a new patient into the patients table.
        Args:
            conn (aiomysql.Connection): The database connection.


        DB:
        #### 2.1.3 `Patient`
    - **Purpose:** Represents a person receiving care.
    - **Primary key:** _IID_
    - **Attributes:**
      - `IID` (INT, PK)
      - `CIN` (VARCHAR(10), UNIQUE, NOT NULL) – national ID
      - `FullName` (VARCHAR(100), NOT NULL)
      - `Birth` (DATE, NULL)
      - `Sex` (ENUM('M','F'), NOT NULL)
      - `BloodGroup` (ENUM('A+','A-','B+','B-','O+','O-','AB+','AB-'), NULL)
      - `Phone` (VARCHAR(15), NULL)
      - Optional extension (Lab 5 example): `Email` (VARCHAR(160), NULL)
    - **Key FDs:** `IID → all non‑key attributes`; `CIN → IID, ...` (candidate key).
    - **Relationships:**
      - One‑to‑many with `ClinicalActivity` (each activity belongs to one patient).
      - Many‑to‑many with `ContactLocation` via `have` / `PatientContact`.
      - Many‑to‑many with `Insurance` via `PatientInsurance`.

    """

    async with conn.cursor() as cur:
        await cur.execute(
            """
            INSERT INTO Patient (IID,CIN, FullName, Birth, Sex, BloodGroup, Phone)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                patient.iid,
                patient.cin,
                patient.full_name,
                patient.birth,
                patient.sex,
                patient.blood_group,
                patient.phone,
            ),
        )


async def list_patients_ordered_by_last_name(
    conn: aiomysql.Connection,
    limit: int = 20,
) -> List[Patient]:
    """Retrieve all patients ordered by last name.

    Args:
        conn (aiomysql.Connection): The database connection.

    Returns:
        List of patients as dictionaries.
    """

    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(
            """
            SELECT P.IID, P.CIN, P.FullName, P.Birth, P.Sex, P.BloodGroup, P.Phone
            FROM Patient P
            ORDER BY SUBSTRING_INDEX(P.FullName, ' ', -1), P.FullName
            LIMIT %s
            """,
            (limit,),
        )
        result = await cur.fetchall()
        return [
            Patient(
                iid=row["IID"],
                cin=row["CIN"],
                full_name=row["FullName"],
                birth=row["Birth"],
                sex=row["Sex"],
                blood_group=row["BloodGroup"],
                phone=row["Phone"],
            )
            for row in result
        ]


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
