INSERT INTO Hospital(HID, Name, City, Region) VALUES (900, 'HTest', 'CityA', 'RegionA');
INSERT INTO Department(DEP_ID, Name, Specialty, HID) VALUES (9000, 'DTest', 'General', 900);
INSERT INTO Staff(STAFF_ID, Name, Status) VALUES (9000, 'Dr Test', 'Active');
INSERT INTO Patient(IID, CIN, FullName, Birth, Sex, BloodGroup, Phone)
VALUES (9000, 'CIN9000', 'Patient Test', '1990-01-01', 'F', 'A+', '0600000000');

INSERT INTO ClinicalActivity(CAID, Time, Date, IID, DEP_ID, STAFF_ID)
VALUES (9001, '10:00:00', CURDATE() + INTERVAL 3 DAY, 9000, 9000, 9000),
       (9002, '11:00:00', CURDATE() + INTERVAL 10 DAY, 9000, 9000, 9000);

INSERT INTO Appointment(CAID, Status, Reason)
VALUES (9001, 'Scheduled', 'Checkup'),
       (9002, 'Scheduled', 'Control');

INSERT INTO Medication(Drug_ID, Class, Name, Form, Strength, ActiveIngredient, Manufacturer)
VALUES (900, 'ClassA', 'MedA', 'Tablet', '10mg', 'X', 'ACME'),
       (901, 'ClassA', 'MedB', 'Capsule', '20mg', 'Y', 'ACME');

INSERT INTO Stock(HID, Drug_ID, UnitPrice, StockTimestamp, Qty, ReorderLevel)
VALUES (900, 900, 10.00, NOW(), 50, 10),
       (900, 900, 15.00, NOW() + INTERVAL 1 SECOND, 40, 10),
       (900, 901, 20.00, NOW(), 30, 10);

SELECT * FROM UpcomingByHospital ORDER BY ApptDate;
SELECT * FROM DrugPricingSummary WHERE HID = 900 ORDER BY Drug_ID;
SELECT * FROM StaffWorkloadThirty WHERE STAFF_ID = 9000;
SELECT * FROM PatientNextVisit WHERE IID = 9000;
