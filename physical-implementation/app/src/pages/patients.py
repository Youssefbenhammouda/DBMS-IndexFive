import aiomysql
from typing import AsyncIterator, List, Dict, Any, Optional, Literal
from pydantic import BaseModel
from datetime import date, time

# model


class Patient(BaseModel):
    iid: int
    cin: str
    full_name: str
    birth: Optional[date] = None
    sex: Literal["M", "F"]
    blood_group: Optional[Literal["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]] = (
        None
    )
    phone: Optional[str] = None
    email: Optional[str] = None


class Staff(BaseModel):
    id: int  # STAFF_ID
    name: str  # FullName
    status: Optional[str] = "Active"



# api


async def get_all_patients(conn: aiomysql.Connection) -> List[Dict[str, Any]]:
    """Get all patients with required fields."""
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(
            """
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
        """
        )
        patients = await cur.fetchall()

        # Add required fields with defaults
        for patient in patients:
            patient["city"] = "N/A"
            patient["insurance"] = "None"
            patient["status"] = "Outpatient"
            if patient["birthDate"]:
                patient["birthDate"] = patient["birthDate"].isoformat()

        return patients


async def create_patient(
    conn: aiomysql.Connection, patient_data: Dict[str, Any]
) -> Dict[str, Any]:
    """Create a new patient in the actual database."""
    async with conn.cursor() as cur:
        await cur.execute(
            """
            INSERT INTO Patient (IID, CIN, FullName, Birth, Sex, BloodGroup, Phone, Email)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
            (
                patient_data["iid"],
                patient_data["cin"],
                patient_data["full_name"],  # <-- correct mapping
                patient_data.get("birth"),  # can be None
                patient_data["sex"],
                patient_data.get("blood_group"),
                patient_data.get("phone"),
                patient_data.get("email"),
            ),
        )

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
        "status": "Outpatient",
    }


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

        # Add role and format arrays
        for staff in staff_list:
            # Simple role detection from name
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

            # Remove the temporary fields
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
