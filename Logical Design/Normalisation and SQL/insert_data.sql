-- Insert sample data for Patient
INSERT INTO Patient (CIN, Name, Sex, Birth, Blood_group, Phone) VALUES
('AB123456', 'Ahmed Benali', 'M', '1985-03-15', 'A+', '0612345678'),
('CD789012', 'Fatima Zahra', 'F', '1990-07-22', 'O+', '0623456789'),
('EF345678', 'Mohammed Alami', 'M', '1978-11-30', 'B+', '0634567890'),
('GH901234', 'Amina Toumi', 'F', '1995-05-14', 'AB+', '0645678901'),
('IJ567890', 'Youssef Kassi', 'M', '1982-09-08', 'A-', '0656789012'),
('KL123456', 'Leila Mansouri', 'F', '1988-12-25', 'O-', '0667890123');

-- Insert sample data for Contact_Location
INSERT INTO Contact_Location (City, Province, Street, Number, Postal_code, Phone) VALUES
('Rabat', 'Rabat-Salé-Kénitra', 'Avenue Hassan II', '45', '10000', '0537123456'),
('Casablanca', 'Casablanca-Settat', 'Boulevard Mohammed V', '123', '20000', '0522987654'),
('Rabat', 'Rabat-Salé-Kénitra', 'Rue Oued Zem', '67', '10100', '0537654321'),
('Marrakech', 'Marrakech-Safi', 'Avenue Guemassa', '89', '40000', '0524433221'),
('Casablanca', 'Casablanca-Settat', 'Rue Ibn Rochd', '234', '20200', '0522112233'),
('Rabat', 'Rabat-Salé-Kénitra', 'Boulevard Al Massira', '156', '10050', '0537788990');

-- Insert sample data for Have (linking patients to locations)
INSERT INTO Have (CLID, IID) VALUES
(1, 1), (2, 2), (3, 3), (4, 4), (5, 5), (6, 6);

-- Insert sample data for Insurance
INSERT INTO Insurance (Ins_type) VALUES
('CNOPS'), ('CNSS'), ('RAMED'), ('Amo'), ('private'), ('CNOPS');

-- Insert sample data for Covers (linking patients to insurance)
INSERT INTO Covers (InsID, IID) VALUES
(1, 1), (2, 2), (3, 3), (4, 4), (5, 5), (6, 6);

-- Insert sample data for Staff
INSERT INTO Staff (Name, Status) VALUES
('Dr. Kamal Saidi', 'Active'),
('Dr. Nadia Berrada', 'Active'),
('Nurse Hassan Amrani', 'Active'),
('Dr. Samira El Fassi', 'Active'),
('Nurse Karim Belhaj', 'Active'),
('Tech Ahmed Touil', 'Active'),
('Dr. Leila Marrakchi', 'Active'),
('Nurse Fatima Bennis', 'Active');

-- Insert sample data for Practioner
INSERT INTO Practioner (STAFF_ID, License_Number, Specialty) VALUES
(1, 1001, 'Cardiology'),
(2, 1002, 'Pediatrics'),
(4, 1004, 'Dermatology'),
(7, 1007, 'Emergency Medicine');

-- Insert sample data for Caregiving
INSERT INTO Caregiving (STAFF_ID, Grade, Ward) VALUES
(3, 'Senior Nurse', 'Emergency'),
(5, 'Junior Nurse', 'Pediatrics'),
(8, 'Head Nurse', 'ICU');

-- Insert sample data for Technical
INSERT INTO Technical (STAFF_ID, Modality, Certifications) VALUES
(6, 'Radiology', 'CT Scan, MRI');

-- Insert sample data for Hospital
INSERT INTO Hospital (Name, City, Region) VALUES
('Hopital Ibn Sina', 'Rabat', 'Rabat-Salé-Kénitra'),
('Hopital Avicenne', 'Rabat', 'Rabat-Salé-Kénitra'),
('Hopital Cheikh Zaid', 'Casablanca', 'Casablanca-Settat'),
('Hopital Mohammed VI', 'Marrakech', 'Marrakech-Safi');

-- Insert sample data for Department
INSERT INTO Department (Name, Specialty, HID) VALUES
('Cardiology Department', 'Cardiology', 1),
('Emergency Department', 'Emergency Medicine', 1),
('Pediatrics Department', 'Pediatrics', 2),
('Dermatology Department', 'Dermatology', 2),
('Emergency Department', 'Emergency Medicine', 3),
('ICU Department', 'Intensive Care', 4);

-- Insert sample data for work_in (linking staff to departments)
INSERT INTO work_in (STAFF_ID, DEP_ID) VALUES
(1, 1), (2, 3), (3, 2), (4, 4), (5, 3), (6, 1), (7, 2), (8, 6), (7, 5);

-- Insert sample data for Clinical_Activity
INSERT INTO Clinical_Activity (occurred_at, IID, DEP_ID, STAFF_ID) VALUES
('2024-01-15 09:00:00', 1, 1, 1),
('2024-01-16 10:30:00', 2, 3, 2),
('2024-01-17 14:15:00', 3, 2, 7),
('2024-01-18 11:00:00', 4, 4, 4),
('2024-01-19 16:45:00', 5, 1, 1),
('2024-01-20 08:30:00', 6, 2, 7),
('2024-02-01 13:00:00', 1, 2, 7),
('2024-02-02 15:30:00', 2, 3, 2),
('2024-02-03 10:00:00', 3, 4, 4),
(NOW() + INTERVAL 1 DAY, 4, 1, 1),
(NOW() + INTERVAL 3 DAY, 5, 3, 2),
(NOW() + INTERVAL 5 DAY, 6, 2, 7),
(NOW() + INTERVAL 10 DAY, 1, 4, 4),
('2024-01-25 12:00:00', 2, 2, 7),
('2024-01-26 17:30:00', 3, 2, 7),
('2024-01-27 09:45:00', 4, 2, 7),
('2024-01-28 14:20:00', 5, 2, 7),
-- Additional data for emergencies (Query 7)
('2024-01-21 08:00:00', 1, 2, 7),
('2024-01-21 09:15:00', 2, 2, 7),
('2024-01-21 10:30:00', 3, 2, 7),
('2024-01-21 11:45:00', 4, 2, 7),
('2024-01-21 13:00:00', 5, 2, 7),
('2024-01-22 08:30:00', 6, 2, 7),
('2024-01-22 10:00:00', 1, 2, 7),
('2024-01-22 11:30:00', 2, 2, 7),
('2024-01-22 14:00:00', 3, 2, 7),
('2024-01-22 16:30:00', 4, 2, 7),
('2024-01-23 09:00:00', 5, 2, 7),
('2024-01-23 10:30:00', 6, 2, 7),
('2024-01-23 12:00:00', 1, 2, 7),
('2024-01-23 15:00:00', 2, 2, 7),
('2024-01-23 17:30:00', 3, 2, 7),
-- Recent emergency visits for Query 17
(NOW() - INTERVAL 5 DAY, 1, 2, 7),
(NOW() - INTERVAL 3 DAY, 1, 2, 7),
(NOW() - INTERVAL 7 DAY, 2, 2, 7),
(NOW() - INTERVAL 2 DAY, 2, 2, 7),
-- Completed appointments for Query 18
(NOW() - INTERVAL 30 DAY, 1, 1, 1),
(NOW() - INTERVAL 45 DAY, 2, 3, 2),
(NOW() - INTERVAL 60 DAY, 3, 4, 4),
(NOW() - INTERVAL 15 DAY, 4, 1, 1),
(NOW() - INTERVAL 75 DAY, 5, 3, 2),
(NOW() - INTERVAL 20 DAY, 6, 2, 7),
(NOW() - INTERVAL 10 DAY, 1, 3, 2),
(NOW() - INTERVAL 25 DAY, 2, 1, 1),
(NOW() - INTERVAL 50 DAY, 3, 2, 7),
(NOW() - INTERVAL 35 DAY, 4, 4, 4);

-- Insert sample data for Appointment
INSERT INTO Appointment (CAID, Status, Reason) VALUES
(1, 'Completed', 'Routine checkup'),
(2, 'Completed', 'Child vaccination'),
(4, 'Completed', 'Skin condition'),
(5, 'Completed', 'Heart condition follow-up'),
(10, 'Scheduled', 'Cardiology consultation'),
(11, 'Scheduled', 'Pediatric checkup'),
(12, 'Scheduled', 'Emergency follow-up'),
(13, 'Scheduled', 'Dermatology consultation'),
-- Completed appointments for Query 18
(37, 'Completed', 'Cardiology follow-up'),
(38, 'Completed', 'Pediatric consultation'),
(39, 'Completed', 'Dermatology check'),
(40, 'Completed', 'Heart examination'),
(41, 'Completed', 'Child health check'),
(42, 'Completed', 'Emergency follow-up'),
(43, 'Completed', 'Pediatric vaccination'),
(44, 'Completed', 'Cardiac tests'),
(45, 'Completed', 'Emergency review'),
(46, 'Completed', 'Skin treatment');

-- Insert sample data for Emergency
INSERT INTO Emergency (CAID, Triage_Level, Outcome) VALUES
(3, 'Urgent', 'Admitted'),
(6, 'Moderate', 'Discharged'),
(7, 'Critical', 'Transferred to ICU'),
(8, 'Moderate', 'Discharged'),
(9, 'Urgent', 'Admitted'),
(14, 'Moderate', 'Discharged'),
(15, 'Urgent', 'Admitted'),
(16, 'Critical', 'Transferred to ICU'),
(17, 'Moderate', 'Discharged'),
-- Additional emergencies for Query 7
(18, 'Moderate', 'Discharged'),
(19, 'Urgent', 'Admitted'),
(20, 'Moderate', 'Discharged'),
(21, 'Critical', 'Transferred to ICU'),
(22, 'Moderate', 'Discharged'),
(23, 'Urgent', 'Admitted'),
(24, 'Moderate', 'Discharged'),
(25, 'Urgent', 'Admitted'),
(26, 'Moderate', 'Discharged'),
(27, 'Critical', 'Transferred to ICU'),
(28, 'Moderate', 'Discharged'),
(29, 'Urgent', 'Admitted'),
(30, 'Moderate', 'Discharged'),
(31, 'Urgent', 'Admitted'),
(32, 'Moderate', 'Discharged'),
-- Recent emergencies for Query 17
(33, 'Urgent', 'Admitted'),
(34, 'Moderate', 'Discharged'),
(35, 'Critical', 'Transferred to ICU'),
(36, 'Urgent', 'Admitted');

-- Insert sample data for Prescription
INSERT INTO Prescription (Date_Issued, CAID) VALUES
('2024-01-15', 1),
('2024-01-16', 2),
('2024-01-17', 3),
('2024-01-18', 4),
('2024-01-19', 5);

-- Insert sample data for Expense
INSERT INTO Expense (InsID, CAID, Total) VALUES
(1, 1, 450.00),
(2, 2, 280.50),
(3, 3, 1200.00),
(4, 4, 350.75),
(5, 5, 890.25),
(1, 6, 1500.00),
(2, 7, 2200.00);

-- Insert sample data for Medication
INSERT INTO Medication (Class, Name, Form, Strength, Active_Ingredient, Manufacturer) VALUES
('Antibiotic', 'Amoxicillin', 'Tablet', '500mg', 'Amoxicillin', 'PharmaMaroc'),
('Antibiotic', 'Ciprofloxacin', 'Tablet', '250mg', 'Ciprofloxacin', 'Laboratoires SNA'),
('Analgesic', 'Paracetamol', 'Tablet', '1000mg', 'Paracetamol', 'PharmaCare'),
('Antihypertensive', 'Amlodipine', 'Tablet', '5mg', 'Amlodipine', 'MediTech'),
('Antidiabetic', 'Metformin', 'Tablet', '850mg', 'Metformin', 'BioPharma'),
('Antibiotic', 'Azithromycin', 'Capsule', '250mg', 'Azithromycin', 'PharmaMaroc'),
('Anticoagulant', 'Warfarin', 'Tablet', '5mg', 'Warfarin', 'Laboratoires SNA');

-- Insert sample data for Stock
INSERT INTO Stock (HID, DrugID, Unit_Price, Stock_Timestamp, Quantity, Reorder_Level) VALUES
(1, 1, 200.00, NOW(), 150, 50),  -- High price for spread
(1, 2, 85.25, NOW(), 75, 30),
(1, 3, 180.00, NOW(), 300, 100), -- High price for spread
(1, 4, 28.90, NOW(), 200, 80),
(1, 5, 35.60, NOW(), 120, 60),
(2, 1, 35.00, NOW(), 80, 40),    -- Low price for spread
(2, 2, 90.00, NOW(), 45, 25),
(2, 3, 15.00, NOW(), 250, 100),
(2, 6, 150.00, NOW(), 60, 20),   -- High price for spread
(3, 1, 42.75, NOW(), 180, 70),
(3, 2, 80.00, NOW(), 90, 35),
(3, 3, 8.00, NOW(), 150, 60),    -- Very low price for spread
(3, 4, 25.50, NOW(), 150, 60),
(3, 7, 65.25, NOW(), 40, 15),
(4, 1, 55.00, NOW(), 70, 30),
(4, 3, 18.00, NOW(), 180, 80),
(4, 5, 40.00, NOW(), 100, 50),
(4, 6, 80.00, NOW(), 30, 10),    -- Low price for spread
(1, 6, 115.00, NOW(), 25, 15),   -- Low stock
(2, 4, 30.00, NOW(), 15, 20),    -- Below reorder level
-- Data quality issues for Query 20
(1, 7, -5.00, NOW(), 50, 20),    -- Negative unit price
(2, 7, 0.00, NOW(), 30, 15),     -- Zero unit price
(3, 5, 25.50, NOW(), -10, 20),   -- Negative quantity
(4, 4, -1.50, NOW(), -5, 10);    -- Both negative price and quantity

-- Insert sample data for include (prescription details)
INSERT INTO include (PID, DrugID, dosage, duration) VALUES
(1, 1, '1 tablet 3 times daily', 7),
(1, 3, '1 tablet as needed', 5),
(2, 2, '1 tablet twice daily', 10),
(3, 1, '2 tablets 3 times daily', 7),
(3, 3, '1 tablet every 6 hours', 3),
(4, 4, '1 tablet daily', 30),
(5, 5, '1 tablet twice daily', 90);



UPDATE Patient
SET Phone = '+212-699-123456'
WHERE CIN = 'AB123456';

UPDATE Hospital
SET Region = 'Marrakech-Safi'
WHERE HID=1;

UPDATE Clinical_Activity
SET occurred_at =Now()- INTERVAL 3 DAY
WHERE CAID=4;


DELETE FROM Appointment
WHERE Status = 'Cancelled'
LIMIT 1;