SELECT P.Name
FROM Patient P
JOIN ClinicalActivity CA
    ON P.IID = CA.IID
JOIN Staff S
    ON CA.STAFF_ID = S.STAFF_ID
WHERE S.Status = 'active';



SELECT S.STAFF_ID
FROM Staff S
WHERE Status = 'active'

UNION

SELECT CA.STAFF_ID
FROM ClinicalActivity CA
JOIN Prescription PR
    ON CA.CAID = PR.CAID;



SELECT H.HID
FROM Hospital H
WHERE H.City = 'Benguerir'

UNION

SELECT D.HID
FROM Department D
WHERE D.Specialty = 'Cardiology';


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