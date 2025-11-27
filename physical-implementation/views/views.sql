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
WHERE A.Status = Scheduled
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
    S.STAFF_ID AS STAFF_ID,
    S.Name AS FullName,
    COUNT(CA.CAID) AS TotalAppointments,
    COUNT(CASE WHEN A.Status = 'Scheduled' THEN 1 END) AS ScheduledCount,
    COUNT(CASE WHEN A.Status = 'Completed' THEN 1 END) AS CompletedCount,
    COUNT(CASE WHEN A.Status = 'Cancelled' THEN 1 END) AS CancelledCount
FROM staff S
    JOIN ClinicalActivity CA ON CA.STAFF_ID = S.STAFF_ID
    JOIN Appointment A ON A.CAID = CA.CAID
WHERE CA.DATE BETWEEN CURRENT_DATE() AND DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY S.STAFF_ID, S.Name;

-- view 4
CREATE VIEW PatientNextVisit AS
WITH NextVisit AS (
    SELECT
        p.IID,
        p.Name AS FullName,
        ca.occurred_at AS NextApptDate,
        d.Name AS DepartmentName,
        h.Name AS HospitalName,
        h.City AS City,
        ROW_NUMBER() OVER (
            PARTITION BY p.IID
            ORDER BY ca.occurred_at
        ) AS rownum
    FROM Patient p
    JOIN Clinical_Activity ca
        ON ca.IID = p.IID
    JOIN Appointment a
        ON a.CAID = ca.CAID
    JOIN Department d
        ON d.DEP_ID = ca.DEP_ID
    JOIN Hospital h
        ON h.HID = d.HID
    WHERE
        a.Status = 'Scheduled'
        AND ca.occurred_at > CURDATE()
)
SELECT
    IID,
    FullName,
    NextApptDate,
    DepartmentName,
    HospitalName,
    City
FROM NextVisit
WHERE rownum = 1;
