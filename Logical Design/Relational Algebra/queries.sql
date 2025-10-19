--- 1.
SELECT P.Name
FROM Patient P
JOIN ClinicalActivity CA
    ON P.IID = CA.IID
JOIN Staff S
    ON CA.STAFF_ID = S.STAFF_ID
WHERE S.Status = 'active';


--- 2.
SELECT S.STAFF_ID
FROM Staff S
WHERE Status = 'active'

UNION

SELECT CA.STAFF_ID
FROM ClinicalActivity CA
JOIN Prescription PR
    ON CA.CAID = PR.CAID;

--- 3.
SELECT H.HID
FROM Hospital H
WHERE H.City = 'Benguerir'

UNION

SELECT D.HID
FROM Department D
WHERE D.Specialty = 'Cardiology';


--- I use here the definition of intersection as the set difference of the set difference because intersection is not a basic operation


SELECT HID
FROM Department
WHERE Specialty = 'Cardiology'
EXCEPT
(
    SELECT HID
    FROM Department
    WHERE Specialty = 'Cardiology'
    EXCEPT
    SELECT HID
    FROM Department
    WHERE Specialty = 'Pediatrics'
);


--- I use the definition of division seen in the slides

WITH
A AS (
    SELECT Staff_ID, Dep_ID
    FROM work_in
),
B AS (
    SELECT Dep_ID
    FROM Department
    WHERE HID = 1
)
SELECT DISTINCT a.Staff_ID
FROM A a
WHERE a.Staff_ID NOT IN (
    SELECT DISTINCT a1.Staff_ID
    FROM (SELECT DISTINCT Staff_ID FROM A) a1
    CROSS JOIN B
    WHERE (a1.Staff_ID, B.Dep_ID) NOT IN (
        SELECT Staff_ID, Dep_ID
        FROM A
    )
);


--- I use the definition of division seen in the slides


WITH
A AS (
    SELECT Staff_ID, CAID
    FROM Clinical_Activity
),
B AS (
    SELECT DISTINCT CAID
    FROM Clinical_Activity
    WHERE Dep_ID = 2
)
SELECT DISTINCT a.Staff_ID
FROM A a
WHERE a.Staff_ID NOT IN (
    SELECT DISTINCT a1.Staff_ID
    FROM (SELECT DISTINCT Staff_ID FROM A) a1
    CROSS JOIN B
    WHERE (a1.Staff_ID, B.CAID) NOT IN (
        SELECT Staff_ID, CAID
        FROM A
    )
);

--- 8.Find Patient IDs of patients who had clinical activities with at least two different staff members

WITH CA1 AS (
    SELECT StaffID AS StaffID1, IID
    FROM ClinicalActivity
),
CA2 AS (
    SELECT StaffID AS StaffID2, IID
    FROM ClinicalActivity
)
SELECT DISTINCT CA1.IID
FROM CA1
JOIN CA2
  ON CA1.IID = CA2.IID
  AND CA1.StaffID1 <> CA2.StaffID2;

--- 9.Find CAIDs of clinical activities performed in September 2025 at hospitals located in “Benguerir”.

WITH CA1 AS (
    SELECT CAID, Date, DEP_ID
    FROM ClinicalActivities
    WHERE Date >= '2025-09-01' AND Date < '2025-10-01'
),
D1 AS (
    SELECT DEP_ID, HID
    FROM Department
),
H1 AS (
    SELECT HID, City
    FROM Hospital
),
CAD1 AS (
    SELECT CA1.CAID, CA1.Date, CA1.DEP_ID, D1.HID
    FROM CA1
    JOIN D1 ON CA1.DEP_ID = D1.DEP_ID
),
CAIDs AS (
    SELECT DISTINCT CAD1.CAID
    FROM CAD1
    JOIN H1 ON CAD1.HID = H1.HID
    WHERE H1.City = 'Benguerir'
)
SELECT * FROM CAIDs;


--- 10.Find Staff IDs of staff who have issued more than one prescription.


SELECT S.Staff_ID AS SID
From Staff AS S
Join ClinicalActivity AS  C ON S.SID=C.SID
Join Prescription AS P ON C.CAID=P.CAID
GROUP BY SID
HAVING COUNT(P.PID)>1;






--- 11. List IIDs of patients who have scheduled appointments in more than one department.


SELECT C.IID AS IID
From ClinicalActivity AS  C
Join Appointment AS A ON C.CAID=A.CAID
WHERE A.Staus="Scheduled"
GROUP BY IID
HAVING COUNT(C.DEP_ID)>1;






--- 12. Find Staff IDs who have no scheduled appointments on the day of the Green March holiday (November 6).

SELECT S.Staff_ID as SID
FROM Staff as S
WHERE SID NOT IN (
    SELECT S1.SID
    FROM Staff as S1
    JOIN ClinicalActivity AS C ON S1.SID=C.SID
    JOIN Appointment AS A ON C.CAID=A.CAID
    WHERE A.Status='Scheduled'
         AND C.occured_at>='2025-11-06 00:00:00'
         AND C.occured_at<'2025-11-07 00:00:00'
);




--- 13. Find departments whose average number of clinical activities is below the global departmental average.


WITH H AS (
    SELECT D.DEP_ID as DEP_ID ,C.CAID AS CAID
    FROM ClinicalActivity AS C
    RIGHT JOIN Department AS D ON D.DEP_ID = C.DEP_ID
),M AS (
    SELECT DEP_ID, count(CAID) as cnt
    FROM H
    GROUP BY DEP_ID
), G AS (
    SELECT AVG(cnt) as gavg
    FROM M
),  DEPS AS (
    SELECT M.DEP_ID
    FROM M
    CROSS JOIN G
    WHERE M.cnt < G.gavg
)


SELECT DD.DEP_ID, DD.Name, DD.Specialty
FROM Department AS DD
JOIN DEPS ON DEPS.DEP_ID = DD.DEP_ID;


--- 14. For each staff member, return the patient who has the greatest number of completed appointments with that staff member.

WITH A AS (
    SELECT STAFF_ID,IID
    FROM ClinicalActivity AS C
    JOIN Appointment AS AP ON C.CAID = AP.CAID
    WHERE AP.Status='Completed'
)   ,
    B AS (
        SELECT STAFF_ID,IID, COUNT(*) AS cnt
        FROM A
        GROUP BY STAFF_ID,IID
    )
    ,
    C AS (
        SELECT STAFF_ID, MAX(cnt) as mx
        FROM B
        GROUP BY STAFF_ID
    ),
    D AS (
        SELECT C.STAFF_ID,C.mx,B.STAFF_ID,B.IID FROM C 
        JOIN B ON (C.mx = B.cnt AND C.STAFF_ID = B.STAFF_ID)
    ),
    E AS (
        SELECT D.STAFF_ID, P.FullName AS PatientName FROM Patient P
        JOIN D ON P.IID = D.IID
    )

SELECT S.STAFF_ID, S.FullName, E.IID, E.PatientName 
FROM E 
JOIN Staff AS S ON E.STAFF_ID=S.STAFF_ID;

--- 15. List patients who had at least 3 emergency admissions during the year 2024


WITH A AS (
    SELECT CA.IID, CA.CAID
    FROM ClinicalActivity AS CA
    JOIN Emergency AS E ON E.CAID = CA.CAID
    WHERE YEAR(CA.Date)=2024
),
B AS (
    SELECT IID, COUNT(*) as cnt
    FROM A
    GROUP by IID
    HAVING  COUNT(*)>=3
)

SELECT B.IID,P.CIN,P.FullName,P.Birth
FROM B
JOIN Patient AS P ON  P.IID = B.IID;
