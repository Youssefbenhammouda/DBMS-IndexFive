INSERT INTO Hospital(HID, Name, City, Region) VALUES (910, 'TrigHos', 'CityB', 'RegionB');
INSERT INTO Department(DEP_ID, Name, Specialty, HID) VALUES (9100, 'TrigDept', 'General', 910);
INSERT INTO Staff(STAFF_ID, Name, Status) VALUES (9100, 'Dr Trigger', 'Active');
INSERT INTO Patient(IID, CIN, FullName, Birth, Sex, BloodGroup, Phone)
VALUES (9100, 'CIN9100', 'Trig Patient', '1995-05-05', 'M', 'O+', '0700000000');

INSERT INTO ClinicalActivity(CAID, Time, Date, IID, DEP_ID, STAFF_ID)
VALUES (9101, '09:00:00', CURDATE() + INTERVAL 1 DAY, 9100, 9100, 9100);

INSERT INTO Appointment(CAID, Status, Reason)
VALUES (9101, 'Scheduled', 'Visit OK');

INSERT INTO ClinicalActivity(CAID, Time, Date, IID, DEP_ID, STAFF_ID)
VALUES (9102, '09:00:00', CURDATE() + INTERVAL 1 DAY, 9100, 9100, 9100);

INSERT INTO Appointment(CAID, Status, Reason)
VALUES (9102, 'Scheduled', 'Conflict');

INSERT INTO Insurance(InsID, Type) VALUES (910, 'private');
INSERT INTO ClinicalActivity(CAID, Time, Date, IID, DEP_ID, STAFF_ID)
VALUES (9200, '10:00:00', CURDATE(), 9100, 9100, 9100);

INSERT INTO Expense(ExpID, InsID, CAID, Total) VALUES (9300, 910, 9200, 0.00);
INSERT INTO Prescription(PID, Time, Date, CAID) VALUES (9400, '10:00:00', CURDATE(), 9200);

INSERT INTO Medication(Drug_ID, Class, Name, Form, Strength, ActiveIngredient, Manufacturer)
VALUES (920, 'C', 'MedX', 'Tab', '10mg', 'A', 'ACME'),
       (921, 'C', 'MedY', 'Cap', '20mg', 'B', 'ACME');

INSERT INTO Stock(HID, Drug_ID, UnitPrice, StockTimestamp, Qty, ReorderLevel)
VALUES (910, 920, 30.00, NOW(), 100, 5),
       (910, 921, 50.00, NOW(), 100, 5);

INSERT INTO include(PID, Drug_ID, dosage, duration)
VALUES (9400, 920, '1x', 5),
       (9400, 921, '1x', 3);

INSERT INTO Stock(HID, Drug_ID, UnitPrice, StockTimestamp, Qty, ReorderLevel)
VALUES (910, 921, -5.00, NOW() + INTERVAL 2 SECOND, 10, 5);

UPDATE Stock SET Qty = -1
WHERE HID = 910 AND Drug_ID = 920;

INSERT INTO Patient(IID, CIN, FullName, Birth, Sex, BloodGroup, Phone)
VALUES (9500, 'CIN9500', 'Has Activity', '1990-01-01', 'F', 'B+', '0711111111');

INSERT INTO ClinicalActivity(CAID, Time, Date, IID, DEP_ID, STAFF_ID)
VALUES (9600, '12:00:00', CURDATE(), 9500, 9100, 9100);

DELETE FROM Patient WHERE IID = 9500;

INSERT INTO Patient(IID, CIN, FullName, Birth, Sex, BloodGroup, Phone)
VALUES (9501, 'CIN9501', 'No Activity', '1992-03-03', 'M', 'AB+', '0722222222');

DELETE FROM Patient WHERE IID = 9501;
