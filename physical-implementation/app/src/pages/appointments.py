import aiomysql
import aiomysql.cursors
from typing import Optional, Dict, Literal
from datetime import datetime, date, time

ALLOWED_STATUSES = {"Scheduled", "Completed", "Cancelled", "No Show"}


async def get_all_appointments(
    conn: aiomysql.Connection,
    date_range: Optional[str] = None,
    status: Optional[str] = None,
    hospital: Optional[str] = None,
) -> Dict:
    """
    Return {"appointments": [...], "lastSyncedAt": "...Z"}
    """
    # validate status filter if provided
    if status and status not in ALLOWED_STATUSES:
        raise ValueError(f"Invalid status filter: {status}")

    async with conn.cursor(aiomysql.cursors.DictCursor) as cur:
        query = """
            SELECT 
                ap.CAID AS id,
                ca.Date AS date,
                ca.Time AS time,
                h.Name AS hospital,
                d.Name AS department,
                p.FullName AS patient,
                s.FullName AS staff,
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

        # date_range format: "YYYY-MM-DD..YYYY-MM-DD"
        if date_range:
            try:
                start_str, end_str = date_range.split("..")
                # validate date formats
                _ = datetime.strptime(start_str, "%Y-%m-%d").date()
                _ = datetime.strptime(end_str, "%Y-%m-%d").date()
            except Exception:
                raise ValueError("date_range must be 'YYYY-MM-DD..YYYY-MM-DD'")
            query += " AND ca.Date BETWEEN %s AND %s"
            params.extend([start_str, end_str])

        if status:
            query += " AND ap.Status = %s"
            params.append(status)

        if hospital:
            query += " AND h.Name = %s"
            params.append(hospital)

        await cur.execute(query, params)
        rows = await cur.fetchall()

        appointments = []
        for row in rows:
            # row['date'] and row['time'] may be datetime/date/time objects or strings depending on driver
            d = row.get("date")
            t = row.get("time")
            date_str = (
                d.strftime("%Y-%m-%d")
                if hasattr(d, "strftime")
                else (d if d is not None else None)
            )
            time_str = (
                t.strftime("%H:%M")
                if hasattr(t, "strftime")
                else (t if t is not None else None)
            )

            appointments.append(
                {
                    "id": f"APT-{row['id']}",
                    "date": date_str,
                    "time": time_str,
                    "hospital": row.get("hospital"),
                    "department": row.get("department"),
                    "patient": row.get("patient"),
                    "staff": row.get("staff"),
                    "reason": row.get("reason"),
                    "status": row.get("status"),
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
    status: Literal["Scheduled", "Completed", "Cancelled", "No Show"] = "Scheduled",
    appointment_id: Optional[str] = None,
) -> Dict:
    """
    Insert ClinicalActivity + Appointment and return canonical appointment dict.
    Rolls back on error.
    """
    if status not in ALLOWED_STATUSES:
        raise ValueError("Invalid status value")

    try:
        async with conn.cursor() as cur:
            # Resolve patient IID
            if str(patient_name).isdigit():
                await cur.execute(
                    "SELECT IID FROM Patient WHERE IID=%s", (patient_name,)
                )
            else:
                await cur.execute(
                    "SELECT IID FROM Patient WHERE FullName=%s", (patient_name,)
                )

            patient_row = await cur.fetchone()
            if not patient_row:
                raise ValueError(f"Patient '{patient_name}' not found")
            iid = patient_row[0]

            # Resolve staff id
            if str(staff_name).isdigit():
                await cur.execute(
                    "SELECT STAFF_ID FROM Staff WHERE STAFF_ID=%s", (staff_name,)
                )
            else:
                await cur.execute(
                    "SELECT STAFF_ID FROM Staff WHERE FullName=%s", (staff_name,)
                )

            staff_row = await cur.fetchone()
            if not staff_row:
                raise ValueError(f"Staff '{staff_name}' not found")
            staff_id = staff_row[0]

            # Resolve department
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

            # Insert ClinicalActivity (match your table column order: Time, Date, IID, DEP_ID, STAFF_ID)
            await cur.execute(
                """
                INSERT INTO ClinicalActivity (Time, Date, IID, DEP_ID, STAFF_ID)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (time_, date_, iid, dep_id, staff_id),
            )
            caid = cur.lastrowid

            # Insert Appointment
            await cur.execute(
                """
                INSERT INTO Appointment (CAID, Status, Reason)
                VALUES (%s, %s, %s)
                """,
                (caid, status, reason),
            )

            await conn.commit()

    except Exception:
        # ensure DB is not left in partial state
        try:
            await conn.rollback()
        except Exception:
            pass
        raise  # re-raise so caller (endpoint) can turn into HTTP response

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
