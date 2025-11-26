from flask import Flask, render_template, request
from connector import get_connection
import os

app = Flask(__name__)



@app.get("/patients")
def list_patients():
    sql = """
    SELECT IID, FullName
    FROM Patient
    ORDER BY SUBSTRING_INDEX(FullName, ' ', -1)
    LIMIT 20
    """
    with get_connection() as cnx:
        with cnx.cursor(dictionary=True) as cur:
            cur.execute(sql)
            patients = cur.fetchall()

    return render_template("patients.html", patients=patients)



@app.get("/schedule")
def schedule_page():
    return render_template("schedule_app.html")

@app.post("/schedule")
def schedule_submit():
    caid = request.form["caid"]
    iid = request.form["iid"]
    staff = request.form["staff"]
    dep = request.form["dep"]
    date = request.form["date"]
    time = request.form["time"]
    reason = request.form["reason"]

    ins_ca = """
        INSERT INTO ClinicalActivity(CAID, IID, STAFF_ID, DEP_ID, Date, Time)
        VALUES (%s, %s, %s, %s, %s, %s)
    """

    ins_appt = """
        INSERT INTO Appointment(CAID, Reason, Status)
        VALUES (%s, %s, 'Scheduled')
    """

    with get_connection() as cnx:
        try:
            with cnx.cursor() as cur:
                cur.execute(ins_ca, (caid, iid, staff, dep, date, time))
                cur.execute(ins_appt, (caid, reason))
            cnx.commit()
            return "Appointment scheduled successfully!"
        except Exception as e:
            cnx.rollback()
            return f"Error scheduling appointment: {e}", 400


# ---------------------------
# 3. Staff Share (Your Query)
# ---------------------------
@app.get("/staff-share")
def staff_share():
    sql = """
    SELECT X.staff_id, Y.HID, X.Total_Appointments,
           (X.Total_Appointments * 1.0 / Y.Total_App_Hospital) * 100 AS PercentageShare
    FROM (
        SELECT C.STAFF_ID, D.HID, COUNT(*) as Total_Appointments
        FROM ClinicalActivity C 
        JOIN Appointment A ON C.CAID = A.CAID 
        JOIN Department D ON D.DEP_ID = C.DEP_ID 
        GROUP BY C.STAFF_ID, D.HID
    ) X
    JOIN (
        SELECT D.HID, COUNT(*) Total_App_Hospital
        FROM ClinicalActivity C 
        JOIN Appointment A ON C.CAID = A.CAID 
        JOIN Department D ON D.DEP_ID = C.DEP_ID 
        GROUP BY D.HID
    ) Y ON X.HID = Y.HID
    ORDER BY PercentageShare DESC;
    """

    with get_connection() as cnx:
        with cnx.cursor(dictionary=True) as cur:
            cur.execute(sql)
            rows = cur.fetchall()

    return render_template("staff_share.html", rows=rows)


@app.get("/")
def home():
    return """
    <h2>MNHS Web App</h2>
    <ul>
        <li><a href='/patients'>List Patients</a></li>
        <li><a href='/schedule'>Schedule Appointment</a></li>
        <li><a href='/staff-share'>Staff Share</a></li>
    </ul>
    """


if __name__ == "__main__":
    app.run(debug=True)
