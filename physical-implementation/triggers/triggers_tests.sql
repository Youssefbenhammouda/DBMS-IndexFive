INSERT INTO ClinicalActivity (CAID, IID, STAFF_ID, DEP_ID, Date, Time)
VALUES (50000, 1, 501, 10, '2025-12-01', '10:00:00');

INSERT INTO Appointment (CAID, Reason, Status)
VALUES (50000, 'ok', 'Scheduled');

INSERT INTO ClinicalActivity (CAID, IID, STAFF_ID, DEP_ID, Date, Time)
VALUES (50001, 1, 501, 10, '2025-12-01', '10:00:00');

INSERT INTO Appointment (CAID, Reason, Status)
VALUES (50001, 'conflict', 'Scheduled');

INSERT INTO Medication (MID, Name, Form, Strength, ActiveIngredient, TherapeuticClass, Manufacturer)
VALUES (9000, 'TempMed', 'Tab', '10mg', 'X', 'Test', 'Lab');

INSERT INTO Stock (HID, MID, StockTimestamp, UnitPrice, Qty, ReorderLevel)
VALUES (1, 9000, '2025-11-20 08:00:00', 20.00, 10, 5);

INSERT INTO Prescription (PID, CAID, DateIssued)
VALUES (9000, 50000, '2025-12-01');

INSERT INTO Includes (PID, MID, Dosage, Duration)
VALUES (9000, 9000, '1', '2 days');

UPDATE Includes
SET Dosage = '2'
WHERE PID = 9000 AND MID = 9000;

INSERT INTO Stock (HID, MID, StockTimestamp, UnitPrice, Qty, ReorderLevel)
VALUES (1, 9000, '2025-11-21 08:00:00', 0.00, 10, 5);

UPDATE Stock
SET UnitPrice = 0.00
WHERE HID = 1 AND MID = 9000
ORDER BY StockTimestamp DESC
LIMIT 1;
