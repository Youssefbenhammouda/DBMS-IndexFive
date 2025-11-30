INSERT INTO Hospital(HID, Name, City, Region) VALUES
(100, 'Test Hospital', 'TestCity', 'TestRegion')
ON DUPLICATE KEY UPDATE Name = VALUES(Name);

INSERT INTO Department(DEP_ID, HID, Name, Specialty) VALUES
(1000, 100, 'Test Department', 'General')
ON DUPLICATE KEY UPDATE Name = VALUES(Name);

INSERT INTO Staff(STAFF_ID, FullName, Status) VALUES
(1000, 'Dr. Test Staff', 'Active')
ON DUPLICATE KEY UPDATE FullName = VALUES(FullName);

INSERT INTO Patient(IID, CIN, FullName, Birth, Sex, BloodGroup, Phone) VALUES
(1000, 'TST1000', 'Test Patient', '1990-01-01', 'F', 'A+', '0600000000')
ON DUPLICATE KEY UPDATE FullName = VALUES(FullName);

INSERT INTO Medication(MID, Name, Form, Strength, ActiveIngredient,
                       TherapeuticClass, Manufacturer)
VALUES
(100, 'TestMed A', 'Tablet', '500mg', 'X', 'Analgesic', 'ACME'),
(101, 'TestMed B', 'Capsule', '250mg', 'Y', 'Antibiotic', 'ACME')
ON DUPLICATE KEY UPDATE Name = VALUES(Name);

------------------------------------------------------------
-- 1. UpcomingByHospital
-- View: HospitalName, ApptDate, ScheduledCount
------------------------------------------------------------

-- Two scheduled appointments within next 14 days (same hospital, different dates)
INSERT INTO ClinicalActivity(CAID, IID, STAFF_ID, DEP_ID, Date, Time)
VALUES
(2001, 1000, 1000, 1000, CURDATE() + INTERVAL 3 DAY,  '10:00:00'),
(2002, 1000, 1000, 1000, CURDATE() + INTERVAL 10 DAY, '09:30:00');

INSERT INTO Appointment(CAID, Reason, Status) VALUES
(2001, 'Checkup upcoming', 'Scheduled'),
(2002, 'Control upcoming', 'Scheduled');

-- One appointment outside 14-day window (should NOT appear)
INSERT INTO ClinicalActivity(CAID, IID, STAFF_ID, DEP_ID, Date, Time)
VALUES (2003, 1000, 1000, 1000, CURDATE() + INTERVAL 20 DAY, '11:00:00');

INSERT INTO Appointment(CAID, Reason, Status) VALUES
(2003, 'Too far to count', 'Scheduled');

-- One completed appointment within 14 days (Status != 'Scheduled', should NOT be counted)
INSERT INTO ClinicalActivity(CAID, IID, STAFF_ID, DEP_ID, Date, Time)
VALUES (2004, 1000, 1000, 1000, CURDATE() + INTERVAL 5 DAY, '15:00:00');

INSERT INTO Appointment(CAID, Reason, Status) VALUES
(2004, 'Already done', 'Completed');

-- TEST QUERY for UpcomingByHospital
SELECT *
FROM UpcomingByHospital
WHERE HospitalName = 'Test Hospital'
ORDER BY ApptDate;
-- Expected: 2 rows (dates = today+3 and today+10, counts per day)

------------------------------------------------------------
-- 2. DrugPricingSummary
-- View: HID, HospitalName, MID, MedicationName,
--       AvgUnitPrice, MinUnitPrice, MaxUnitPrice, LastStockTimestamp
------------------------------------------------------------

-- Stock history for hospital 100 and meds 100 / 101
INSERT INTO Stock(HID, MID, StockTimestamp, UnitPrice, Qty, ReorderLevel)
VALUES
(100, 100, NOW() - INTERVAL 2 DAY, 10.00, 50, 10),
(100, 100, NOW() - INTERVAL 1 DAY, 12.00, 40, 10),
(100, 101, NOW() - INTERVAL 1 DAY, 20.00, 30, 5)
;

-- TEST QUERY for DrugPricingSummary
SELECT *
FROM DrugPricingSummary
WHERE HID = 100
ORDER BY MID;
-- Check: for MID=100 -> Min=10, Max=12, Avg between 10 and 12, LastStockTimestamp = most recent row
-- For MID=101 -> Min=Max=Avg=20

------------------------------------------------------------
-- 3. StaffWorkloadThirty
-- View: STAFF_ID, FullName, TotalAppointments,
--       ScheduledCount, CompletedCount, CancelledCount
------------------------------------------------------------

-- Clinical activities in last 30 days for staff 1000
INSERT INTO ClinicalActivity(CAID, IID, STAFF_ID, DEP_ID, Date, Time)
VALUES
(2101, 1000, 1000, 1000, CURDATE() - INTERVAL 5 DAY, '09:00:00'),
(2102, 1000, 1000, 1000, CURDATE() - INTERVAL 3 DAY, '11:00:00'),
(2103, 1000, 1000, 1000, CURDATE() - INTERVAL 1 DAY, '16:00:00');

INSERT INTO Appointment(CAID, Reason, Status) VALUES
(2101, 'Past scheduled', 'Scheduled'),
(2102, 'Past completed', 'Completed'),
(2103, 'Past cancelled', 'Cancelled');

-- TEST QUERY for StaffWorkloadThirty
SELECT *
FROM StaffWorkloadThirty
WHERE STAFF_ID = 1000;

-- 4. PatientNextVisit
-- View: IID, FullName, NextApptDate, DepartmentName, HospitalName, City

------------------------------------------------------------

-- Future scheduled visits for patient 1000
INSERT INTO ClinicalActivity(CAID, IID, STAFF_ID, DEP_ID, Date, Time)
VALUES
(2201, 1000, 1000, 1000, CURDATE() + INTERVAL 1 DAY,  '14:00:00'),
(2202, 1000, 1000, 1000, CURDATE() + INTERVAL 7 DAY,  '10:00:00'),
(2203, 1000, 1000, 1000, CURDATE() + INTERVAL 2 DAY,  '08:00:00');

INSERT INTO Appointment(CAID, Reason, Status) VALUES
(2201, 'Soonest scheduled', 'Scheduled'),
(2202, 'Later scheduled',  'Scheduled'),
(2203, 'Cancelled visit',  'Cancelled');

-- TEST QUERY for PatientNextVisit
SELECT *
FROM PatientNextVisit
WHERE IID = 1000;
