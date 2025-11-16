-- query 1: Select all patients ordered by last name.
SELECT *,
  SUBSTRING_INDEX(FullName, ' ', -1) AS lastname
FROM Patient
ORDER BY lastname;

-- query 2
SELECT DISTINCT I.Type
FROM Insurance I
ORDER BY I.Type;

-- query 3
SELECT S.Name
FROM Staff S
  JOIN work_in W ON S.STAFF_ID = W.STAFF_ID
  JOIN Department D ON D.DEP_ID = W.DEP_ID
  JOIN Hospital H ON D.HID = H.HID
WHERE H.City = 'Rabat';

-- query 4
SELECT *
FROM Appointment A
  JOIN ClinicalActivity CA ON A.CAID = CA.CAID
WHERE A.Status = 'Scheduled'
  AND CA.Date BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY);

-- Query 5
SELECT C.DEP_ID,
  COUNT(*)
FROM ClinicalActivity C,
  Appointment A
WHERE C.CAID = A.CAID
GROUP BY C.DEP_ID;

-- Query 6
SELECT S.HID,
  AVG(S.UnitPrice)
FROM Stock S
GROUP BY S.HID;

-- query 7: List hospitals with more than twenty emergency admissions.
SELECT H.HID,
  H.Name,
  H.City,
  H.Region,
  COUNT(H.HID) as clinical_activity_count
FROM Hospital H
  JOIN Department D ON D.HID = H.HID
  JOIN ClinicalActivity C ON C.DEP_ID = D.DEP_ID
  JOIN Emergency E ON E.CAID = C.CAID
GROUP BY H.HID,
  H.Name,
  H.City,
  H.Region
HAVING clinical_activity_count > 20;

-- query 8
SELECT M.Name
FROM Medication M
  JOIN Stock S ON M.Drug_ID = S.Drug_ID
WHERE M.Class = 'Antibiotic'
  AND S.UnitPrice < 200;

-- query 9: For each hospital list the top three most expensive medications.
SELECT H.HID,
  H.Name,
  M.Drug_ID,
  M.Name,
  t.UnitPrice
FROM (
    SELECT S.HID,
      S.Drug_ID,
      S.UnitPrice,
      ROW_NUMBER() OVER (
        PARTITION BY S.HID
        ORDER BY S.UnitPrice DESC
      ) as row_num
    FROM Hospital H
      JOIN Stock S on S.HID = H.HID
  ) t
  JOIN Hospital H ON H.HID = t.HID
  JOIN Medication M ON M.Drug_ID = t.Drug_ID
WHERE t.row_num <= 3;

-- query 10
SELECT D.Name,
  SUM(A.Status = 'Scheduled') as count1,
  SUM(A.Status = 'Completed') as count2,
  SUM(A.Status = 'Cancelled') as count3
FROM ClinicalActivity C
  JOIN Appointment A ON C.CAID = A.CAID
  JOIN Department D ON C.DEP_ID = D.DEP_ID
GROUP BY D.Name;

-- Query 11
SELECT p.IID
FROM Patient p
WHERE p.IID NOT IN (
    SELECT DISTINCT ca.IID
    FROM ClinicalActivity ca
    WHERE ca.Date >= CURRENT_DATE()
      AND ca.Date <= DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY)
  );

-- Query 12 
SELECT X.staff_id, Y.HID, X.Total_Appointments,(X.Total_Appointments*1.0/Y.Total_App_Hospital)*100
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
) Y ON X.HID = Y.HID;

-- query 13
SELECT M.Drug_ID,
  M.Name,
  H.HID,
  H.Name,
  S.Qty,
  S.ReorderLevel
FROM Stock S
  JOIN Medication M ON S.Drug_ID = M.Drug_ID
  JOIN Hospital H ON S.HID = H.HID
WHERE S.Qty < S.ReorderLevel;

-- Query 14
SELECT h.HID,
  h.Name
FROM Hospital h
WHERE NOT EXISTS (
    SELECT m.Drug_ID
    FROM Medication m
    WHERE m.Class = 'Antibiotic'
      AND NOT EXISTS (
        SELECT s.Drug_ID
        FROM Stock s
        WHERE s.HID = h.HID
          AND s.Drug_ID = m.Drug_ID
      )
  );

-- Query 15
WITH HospitalAvg AS (
    SELECT 
        s.HID AS hospital_id, 
        m.Class AS drug_class,
        AVG(s.UnitPrice) AS avg_price
    FROM Stock s
    JOIN Medication m ON s.Drug_ID = m.Drug_ID
    GROUP BY s.HID, m.Class
), 
CityAvg AS (
    SELECT 
        h.City AS city_name,
        m.Class AS drug_class,
        AVG(s.UnitPrice) AS city_avg
    FROM Stock s
    JOIN Medication m ON s.Drug_ID = m.Drug_ID
    JOIN Hospital h ON s.HID = h.HID
    GROUP BY h.City, m.Class
)
SELECT 
    ha.hospital_id,
    ha.drug_class,
    ha.avg_price,
    CASE 
        WHEN ha.avg_price > ca.city_avg THEN 'Above'
        ELSE 'Not Above'
    END AS price_flag
FROM HospitalAvg ha
JOIN Hospital h ON ha.hospital_id = h.HID
JOIN CityAvg ca 
    ON h.City = ca.city_name 
   AND ha.drug_class = ca.drug_class;

-- Query 16
SELECT C.IID,
  MIN(C.Date)
FROM 
  ClinicalActivity C 
  JOIN Appointment A ON A.CAID = C.CAID
WHERE 
  A.Status = "Scheduled"
  AND C.Date > CURRENT_DATE
GROUP BY C.IID;

-- Query 17
SELECT P.IID,
  P.FullName,
  COUNT(E.CAID) as count1,
  MAX(C.Date) as max1
FROM Patient P
  JOIN ClinicalActivity C ON P.IID = C.IID
  JOIN Emergency E ON C.CAID = E.CAID
GROUP BY P.IID,
  P.FullName
HAVING count1 >= 2
  AND max1 >= CURRENT_DATE() - INTERVAL 14 DAY;

-- Query 18
SELECT H.HID, H.Name, H.City, COUNT(*) AS Completed
FROM Hospital H
JOIN Department D ON D.HID = H.HID
JOIN ClinicalActivity CA ON CA.DEP_ID = D.DEP_ID
JOIN Appointment A ON A.CAID = CA.CAID
WHERE A.Status = 'Completed'
  AND CA.Date >= CURRENT_DATE() - INTERVAL 90 DAY
GROUP BY H.HID, H.Name, H.City
ORDER BY H.City, Completed DESC;

-- Query 19: Within each city return medications whose hospital prices show a spread greater than thirty percent between minimum and maximum.
SELECT t.City,
  t.Drug_ID,
  t.Name
FROM (
    SELECT H.City,
      M.Drug_ID,
      M.Name,
      MIN(S.UnitPrice) as min_price,
      MAX(S.UnitPrice) as max_price
    FROM Stock S
      JOIN Medication M ON S.Drug_ID = M.Drug_ID
      JOIN Hospital H ON H.HID = S.HID
    GROUP BY M.Drug_ID,
      H.City
  ) t
WHERE t.max_price > 1.3 * min_price;

-- Query 20
SELECT *
FROM Stock S
WHERE S.Qty < 0
  OR S.UnitPrice <= 0;