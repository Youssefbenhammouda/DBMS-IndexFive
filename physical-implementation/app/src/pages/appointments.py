import aiomysql
from typing import AsyncIterator, List, Dict, Any, Optional, Literal
from pydantic import BaseModel
from datetime import date, time
from datetime import datetime, date, time


async def get_all_appointments(
    conn: aiomysql.Connection,
    date_range: Optional[str] = None,
    status: Optional[str] = None,
    hospital: Optional[str] = None,
) -> Dict:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        # Base query joining ClinicalActivity, Appointment, Patient, Staff, Department, Hospital
        query = """
                SELECT 
                    ap.CAID AS id,
                    ca.Date AS date,
                    ca.Time AS time,
                    h.Name AS hospital,
                    d.Name AS department,
                    p.FullName AS patient,
                    s.Name AS staff,
                    ap.Reason AS reason,
                    ap.Status AS status
                FROM Appointment ap
                JOIN ClinicalActivity ca ON ap.CAID = ca.CAID
                JOIN Patient p ON ca.IID = p.IID
                JOIN Staff s ON ca.STAFF_ID = s.STAFF_ID
                JOIN Department d ON ca.DEP_ID = d.DEP_ID
                JOIN Hospital h ON d.HID = h.HID
                WHERE 1=1
                """

        params = []

        # Apply filters if provided
        if date_range:
            start, end = date_range.split("..")
            query += " AND ca.Date BETWEEN %s AND %s"
            params.extend([start, end])

        if status:
            query += " AND ap.Status = %s"
            params.append(status)

        if hospital:
            query += " AND h.Name = %s"
            params.append(hospital)

        await cur.execute(query, params)
        results = await cur.fetchall()

        # Format date and time as strings
        appointments = []
        for row in results:
            appointments.append(
                {
                    "id": f"APT-{row['id']}",
                    "date": row["date"].strftime("%Y-%m-%d"),
                    "time": row["time"].strftime("%H:%M") if row["time"] else None,
                    "hospital": row["hospital"],
                    "department": row["department"],
                    "patient": row["patient"],
                    "staff": row["staff"],
                    "reason": row["reason"],
                    "status": row["status"],
                }
            )
    return {
        "appointments": appointments,
        "lastSyncedAt": datetime.utcnow().isoformat() + "Z",
    }


async def schedule_appointment(
    conn: aiomysql.Connection,
    date_: date,
    time_: time,
    hospital_name: str,
    department_name: str,
    patient_name: str,
    staff_name: str,
    reason: str,
    status: Literal["Scheduled", "Completed", "Cancelled"] = "Scheduled",
    appointment_id: Optional[str] = None,
) -> Dict:
    async with conn.cursor() as cur:
        # Resolve Patient ID
        await cur.execute("SELECT IID FROM Patient WHERE FullName=%s", (patient_name,))
        patient_row = await cur.fetchone()
        if not patient_row:
            raise ValueError(f"Patient '{patient_name}' not found")
        idd = patient_row[0]

        # Resolve Staff ID
        await cur.execute("SELECT STAFF_ID FROM Staff WHERE Name=%s", (staff_name,))
        staff_row = await cur.fetchone()
        if not staff_row:
            raise ValueError(f"Staff '{staff_name}' not found")
        staff_id = staff_row[0]

        # Resolve Department ID and Hospital ID
        await cur.execute(
            """
            SELECT d.DEP_ID FROM Department d
            JOIN Hospital h ON d.HID = h.HID
            WHERE d.Name=%s AND h.Name=%s
            """,
            (department_name, hospital_name),
        )
        dep_row = await cur.fetchone()
        if not dep_row:
            raise ValueError(
                f"Department '{department_name}' in Hospital '{hospital_name}' not found"
            )
        dep_id = dep_row[0]

        # Insert into ClinicalActivity
        await cur.execute(
            """
            INSERT INTO ClinicalActivity (IID, STAFF_ID, DEP_ID, Date, Time)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (idd, staff_id, dep_id, date_, time_),
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

        # Commit changes
        await conn.commit()

    return {
        "appointment": {
            "id": f"APT-{caid}",
            "date": date_.strftime("%Y-%m-%d"),
            "time": time_.strftime("%H:%M"),
            "hospital": hospital_name,
            "department": department_name,
            "patient": patient_name,
            "staff": staff_name,
            "reason": reason,
            "status": status,
        },
        "message": "Appointment created",
    }
