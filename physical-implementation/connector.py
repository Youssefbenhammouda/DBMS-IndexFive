import os
from dotenv import load_dotenv
import mysql.connector
from mysql.connector import errorcode

load_dotenv()


cfg = dict(
    host=os.getenv("MYSQL_HOST"),
    port=int(os.getenv("MYSQL_PORT", 3306)),
    database=os.getenv("MYSQL_DB"),
    user=os.getenv("MYSQL_USER"),
    password=os.getenv("MYSQL_PASSWORD"),
)

def get_connection():
    return mysql.connector.connect(**cfg)

def list_patients_ordered_by_last_name(limit=20):
    sql = """
    SELECT IID, FullName
    FROM Patient
    ORDER BY SUBSTRING_INDEX(FullName, ' ', -1), FullName
    LIMIT %s
    """
    with get_connection() as cnx:
        with cnx.cursor(dictionary=True) as cur:
            cur.execute(sql, (limit,))
            return cur.fetchall()
        

def insert_patient(iid, cin, full_name, birth, sex, blood, phone):
    sql = """
    INSERT INTO Patient(IID, CIN, FullName, Birth, Sex, BloodGroup, Phone)
    VALUES (%s , %s , %s , %s , %s , %s , %s )
    """
    with get_connection() as cnx:
        try:
            with cnx.cursor() as cur:
                cur.execute(sql, (iid, cin, full_name, birth, sex, blood, phone))
            cnx.commit()
        except Exception:
            cnx.rollback()
            raise


if __name__ == "__main__":
    for row in list_patients_ordered_by_last_name():
        print(f"{ row['IID']} { row['FullName']} ")


insert_patient(1, 'AB123456', 'Ahmed Benali',     '1985-03-15', 'M', 'A+',  '0612345678')
insert_patient(2, 'CD789012', 'Fatima Zahra',     '1990-07-22', 'F', 'O+',  '0623456789')
insert_patient(3, 'EF345678', 'Mohammed Alami',   '1978-11-30', 'M', 'B+',  '0634567890')
insert_patient(4, 'GH901234', 'Amina Toumi',      '1995-05-14', 'F', 'AB+', '0645678901')
insert_patient(5, 'IJ567890', 'Youssef Kassi',    '1982-09-08', 'M', 'A-',  '0656789012')
insert_patient(6, 'KL123456', 'Leila Mansouri',   '1988-12-25', 'F', 'O-',  '0667890123')


print(list_patients_ordered_by_last_name())



