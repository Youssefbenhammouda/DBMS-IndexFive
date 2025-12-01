-- view 1
CREATE OR REPLACE VIEW UpcomingByHospital AS
SELECT 
    H.Name AS HospitalName,
    CA.Date AS ApptDate,
    count(CA.CAID)
FROM Appointment A
    JOIN ClinicalActivity CA ON CA.CAID = A.CAID
    JOIN Department D ON D.DEP_ID = CA.DEP_ID
    JOIN Hospital H ON H.HID = D.HID
WHERE A.Status = 'Scheduled'
    AND (
        CA.Date BETWEEN CURRENT_DATE() AND DATE_ADD(CURRENT_DATE(), INTERVAL 14 DAY)
    )
GROUP BY H.HID,CA.Date;


-- view 2
CREATE OR REPLACE VIEW DrugPricingSummary AS
SELECT 
    S.HID AS HID,
    H.Name AS HospitalName,
    S.MID AS MID,
    M.Name AS MedicationName,
    AVG(S.UnitPrice) AS AvgUnitPrice,
    MIN(S.UnitPrice) AS MinUnitPrice,
    MAX(S.UnitPrice) AS MaxUnitPrice,
    MAX(S.StockTimestamp) AS LastStockTimestamp
FROM Stock S
    JOIN Hospital H ON H.HID = S.HID
    JOIN Medication M ON M.MID = S.MID
GROUP BY S.HID, H.Name, S.MID, M.Name;


-- view 3
CREATE OR REPLACE VIEW StaffWorkloadThirty AS
SELECT 
    S.STAFF_ID,
    S.FullName,
    COUNT(CA.CAID) AS TotalAppointments,
    COUNT(CASE WHEN A.Status = 'Scheduled' THEN 1 END) AS ScheduledCount,
    COUNT(CASE WHEN A.Status = 'Completed' THEN 1 END) AS CompletedCount,
    COUNT(CASE WHEN A.Status = 'Cancelled' THEN 1 END) AS CancelledCount
FROM Staff S
JOIN ClinicalActivity CA ON CA.STAFF_ID = S.STAFF_ID
JOIN Appointment A ON A.CAID = CA.CAID
WHERE CA.Date BETWEEN CURRENT_DATE() AND DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY S.STAFF_ID, S.FullName;

-- view 4
CREATE OR REPLACE VIEW PatientNextVisit AS
WITH NextVisit AS (
    SELECT
        P.IID,
        P.FullName,
        CA.Date AS NextApptDate,
        CA.Time AS NextApptTime,
        D.Name AS DepartmentName,
        H.Name AS HospitalName,
        H.City AS City,
        ROW_NUMBER() OVER (
            PARTITION BY P.IID
            ORDER BY CA.Date, CA.Time
        ) AS rownum
    FROM Patient P
    JOIN ClinicalActivity CA ON CA.IID = P.IID
    JOIN Appointment A ON A.CAID = CA.CAID
    JOIN Department D ON D.DEP_ID = CA.DEP_ID
    JOIN Hospital H ON H.HID = D.HID
    WHERE
        A.Status = 'Scheduled'
        AND CA.Date > CURDATE()
)
SELECT
    IID,
    FullName,
    NextApptDate,
    NextApptTime,
    DepartmentName,
    HospitalName,
    City
FROM NextVisit
WHERE rownum = 1;
