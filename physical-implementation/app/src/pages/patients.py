import aiomysql
from typing import AsyncIterator, List, Dict, Any, Optional, Literal
from pydantic import BaseModel
from datetime import date, time
from datetime import datetime

# model


class Patient(BaseModel):
    iid: int
    cin: str
    name: str
    birth: Optional[date] = None
    sex: Literal["M", "F"]
    blood_group: Optional[Literal["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]] = (
        None
    )
    phone: Optional[str] = None
    email: Optional[str] = None
    city : Optional[str] = None


class Staff(BaseModel):
    id: int  # STAFF_ID
    name: str  # FullName
    status: Optional[str] = "Active"


from datetime import datetime, date, time
import aiomysql

async def get_all_patients(conn):
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("""
WITH NextAppointments AS (
    SELECT CA.IID, CA.CAID, CA.Date, CA.Time, CA.DEP_ID, A.Reason,
           ROW_NUMBER() OVER(PARTITION BY CA.IID ORDER BY CA.Date, CA.Time) AS rn
    FROM ClinicalActivity CA
    LEFT JOIN Appointment A ON A.CAID = CA.CAID
    WHERE CA.Date >= CURRENT_DATE
)
SELECT
    P.IID AS iid,
    UPPER(P.CIN) AS cin,
    P.FullName AS name,
    P.Sex AS sex,
    P.Birth AS birthDate,
    P.BloodGroup AS bloodGroup,
    P.Phone AS phone,
    CL.City AS city,
    COALESCE(I.Type, 'None') AS insurance,
    CASE WHEN I.Type IS NOT NULL THEN 'Active' ELSE 'Self-Pay' END AS insuranceStatus,
    CASE WHEN I.InsID IS NOT NULL THEN CONCAT('Policy ', LPAD(I.InsID,4,'0'), '-', LPAD(P.IID,4,'0')) ELSE NULL END AS policyNumber,
    CASE WHEN EM.Outcome = 'Admitted' THEN 'Admitted' ELSE 'Outpatient' END AS status,
    
    NA.Date AS nextVisitDate,
    NA.Time AS nextVisitTime,
    H.Name AS nextVisitHospital,
    D.Name AS nextVisitDepartment,
    NA.Reason AS nextVisitReason

FROM Patient P

-- Primary city
LEFT JOIN (
    SELECT H.IID, CL.City
    FROM have H
    JOIN ContactLocation CL ON H.CLID = CL.CLID
    WHERE H.CLID IN (
        SELECT MIN(CLID) FROM have H2 WHERE H2.IID = H.IID
    )
) CL ON P.IID = CL.IID

-- Latest insurance
LEFT JOIN (
    SELECT CA.IID, E.InsID, I.Type
    FROM ClinicalActivity CA
    LEFT JOIN Expense E ON E.CAID = CA.CAID
    LEFT JOIN Insurance I ON I.InsID = E.InsID
    WHERE CA.CAID IN (
        SELECT MAX(CAID) FROM ClinicalActivity CA2 WHERE CA2.IID = CA.IID
    )
) I ON P.IID = I.IID

-- Latest status
LEFT JOIN (
    SELECT CA.IID, EM.Outcome
    FROM ClinicalActivity CA
    LEFT JOIN Emergency EM ON EM.CAID = CA.CAID
    WHERE CA.CAID IN (
        SELECT MAX(CAID) FROM ClinicalActivity CA2 WHERE CA2.IID = CA.IID
    )
) EM ON P.IID = EM.IID

-- Only the next upcoming appointment per patient
LEFT JOIN NextAppointments NA ON P.IID = NA.IID AND NA.rn = 1
LEFT JOIN Department D ON D.DEP_ID = NA.DEP_ID
LEFT JOIN Hospital H ON H.HID = D.HID

ORDER BY P.FullName ASC;
        """)

        patients = await cur.fetchall()

    # Convert dates/times and build nextVisit object
    for p in patients:
        p["birthDate"] = p["birthDate"].isoformat() if isinstance(p["birthDate"], (date, datetime)) else None

        if p.get("nextVisitDate"):
            p["nextVisit"] = {
                "date": p["nextVisitDate"].isoformat() if isinstance(p["nextVisitDate"], (date, datetime)) else None,
                "time": p["nextVisitTime"].isoformat() if isinstance(p["nextVisitTime"], (time, datetime)) else None,
                "hospital": p["nextVisitHospital"],
                "department": p["nextVisitDepartment"],
                "reason": p["nextVisitReason"]
            }
        else:
            p["nextVisit"] = None

        # Remove separate columns
        for k in ["nextVisitDate", "nextVisitTime", "nextVisitHospital", "nextVisitDepartment", "nextVisitReason"]:
            p.pop(k, None)

        p["lastSyncedAt"] = datetime.utcnow().isoformat() + "Z"

    return patients






async def create_patient(conn: aiomysql.Connection, patient_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a new patient in the database.
    Enforces uniqueness of IID/CIN, optionally creates city contact location.
    Returns the normalized patient object following GET schema.
    """
    async with conn.cursor(aiomysql.DictCursor) as cur:
        # Normalize CIN
        cin = patient_data["cin"].upper()
        iid = patient_data["iid"]

        # Check uniqueness of IID and CIN
        await cur.execute("SELECT 1 FROM Patient WHERE IID=%s OR CIN=%s", (iid, cin))
        if await cur.fetchone():
            return {"message": f"Patient with IID {iid} or CIN {cin} already exists"}

        # Insert patient
        await cur.execute(
            """
            INSERT INTO Patient (IID, CIN, FullName, Birth, Sex, BloodGroup, Phone, Email)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                iid,
                cin,
                patient_data["name"],
                patient_data.get("birth"),
                patient_data["sex"],
                patient_data.get("bloodGroup"),
                patient_data.get("phone"),
                patient_data.get("email"),
            )
        )

        # Optional city handling
        city = patient_data.get("city")
        if city:
            # Insert a new ContactLocation (AUTO_INCREMENT on CLID required)
            await cur.execute(
                "INSERT INTO ContactLocation (City) VALUES (%s)", (city,)
            )
            clid = cur.lastrowid  # ID of the new city
            # Link via 'have'
            await cur.execute(
                "INSERT INTO have (IID, CLID) VALUES (%s, %s)", (iid, clid)
            )

        await conn.commit()

        # Build normalized patient object
        patient = {
            "iid": iid,
            "cin": cin,
            "name": patient_data["name"],
            "sex": patient_data["sex"],
            "birthDate": patient_data.get("birth"),
            "bloodGroup": patient_data.get("bloodGroup"),
            "phone": patient_data.get("phone"),
            "email": patient_data.get("email"),
            "city": city if city else "N/A",
            "status": "Outpatient",          # default derived
            "insurance": "None",             # default derived
            "insuranceStatus": "Self-Pay",   # default derived
            "policyNumber": None,            # default derived
            "nextVisit": None,               # no upcoming appointment yet
            "lastSyncedAt": datetime.utcnow().isoformat() + "Z"
        }

        return {"patient": patient, "message": "Patient created"}

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
