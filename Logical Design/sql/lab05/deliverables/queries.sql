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
    JOIN Clinical_Activity CA ON A.CAID = CA.CAID
WHERE A.Status = 'Scheduled'
    AND CA.occurred_at BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY);

-- query 8
SELECT M.Name
FROM Medication M
    JOIN Stock S ON M.DrugID = S.DrugID
WHERE M.Class = 'Antibiotic'
    AND S.Unit_Price < 200;

-- query 13
