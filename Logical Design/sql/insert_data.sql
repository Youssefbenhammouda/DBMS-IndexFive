INSERT INTO Patient (CIN, Name, Sex, Birth, Blood_group, Phone) 
VALUES 
('E727709', 'Yahia BELEFQUIH', 'M', '2007-04-08', 'O+', '+212 624-261540'),
('KA789012', 'Youssef Benani', 'M', '1992-11-22', 'A-', '+212-700-987654'),
('LE345678', 'Leila El Amrani', 'F', '1985-05-30', 'B+', '+212-600-123456'),
('ZA901234', 'Zineb Ait Ahmed', 'F', '1990-08-15', 'AB-', '+212-650-654321'),
('MO567890', 'Mohamed Chafik', 'M', '1978-12-05', 'O-', '+212-680-789012')
;


INSERT INTO Contact_Location (City, Province, Street, Number, Postal_code, Phone)
VALUES
('Marrakech', 'Marrakech-Safi', 'Avenue Mohammed VI', '123', '40000', '+212-524-123456'),
('Casablanca', 'Casablanca-Settat', 'Haj Fateh', '45', '20000', '+212-522-654321'),
('Rabat', 'Rabat-Salé-Kénitra', 'Rue des Fleurs', '78', '10000', '+212-537-789012'),
('Fes', 'Fès-Meknès', 'Boulevard Hassan II', '9', '30000', '+212-535-890123'),
('Tangier', 'Tanger-Tetouan-Al Hoceima', 'Avenue de la Liberté', '56', '90000', '+212-539-901234')
;



INSERT INTO Have (CLID, IID)
VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 4),
(5, 5)

;

INSERT INTO Insurance (Ins_type )
VALUES
('CNOPS'),
('CNSS'),
('RAMED'),
('Amo'),
('private')
;

INSERT INTO Covers (InsID, IID)
VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 4),
(5, 5);

INSERT INTO Staff (Name, Status)
VALUES
('Dr. Amina El Fassi', 'Active'),
('Nurse Samir Haddad', 'Active'),
('Technician Leila Benjelloun', 'Inactive'),
('Dr. Youssef Rachid', 'Active'),
('Nurse Fatima Zahra', 'Active');


INSERT INTO Practioner (STAFF_ID, License_Number, Specialty)
VALUES
(1, 123456, 'Cardiology'),
(4, 789012, 'Neurology');

INSERT INTO Caregiving (STAFF_ID, Grade, Ward)
VALUES
(2, 'Senior Nurse', 'Emergency'),
(5, 'Junior Nurse', 'Pediatrics');

INSERT INTO Technical(STAFF_ID, Modality, Certifications)
VALUES 
(3, 'MRI', 'Certified MRI Technician');







INSERT INTO Hospital (Name, City, Region)
VALUES
('UM6P Hospital', 'BenGuerir', 'Marrakech-Safi'),
('Sheikh Khalifa Hospital', 'Casablanca', 'Casablanca-Settat'),
('Ibn Sina Hospital', 'Rabat', 'Rabat-Salé-Kénitra'),
('Al Farabi Hospital', 'Fes', 'Fès-Meknès'),
('Tangier Medical Center', 'Tangier', 'Tanger-Tetouan-Al Hoceima');
;


INSERT INTO Department (Name, Specialty, HID)
VALUES
('Cardiology', 'Heart Diseases', 1),
('Neurology', 'Brain and Nervous System', 1),
('Orthopedics', 'Bone and Muscle Disorders', 2),
('Pediatrics', 'Child Health', 3),
('Radiology', 'Medical Imaging', 4),
('Emergency', 'Emergency Care', 5),
('Oncology', 'Cancer Treatment', 4),
('Gynecology', 'Women\'s Health', 3),
('Dermatology', 'Skin Conditions', 2),
('Psychiatry', 'Mental Health', 5);


INSERT INTO work_in  (DEP_ID, STAFF_ID)
VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 4),
(5, 5)
;


INSERT INTO Expense(Total, InsID)
VALUES
(1000, 1),
(2000, 2),
(1500, 3),
(2500, 4),
(3000, 5);


INSERT INTO Clinical_Activity(occurred_at, IID, ExID, DEP_ID, STAFF_ID)
VALUES
('2025-10-10 10:00:00', 1, 1, 1, 1),
('2025-10-09 14:30:00', 2, 2, 2, 2),
('2025-10-11 09:15:00', 3, 3, 3, 3),
('2025-10-12 11:45:00', 4, 4, 4, 4),
('2025-10-13 16:20:00', 5, 5, 5, 5)
;



INSERT INTO Appointment (CAID, Status, Reason)
VALUES
(1, 'Scheduled', 'Routine Checkup'),
(2, 'Cancelled', 'Patient Request'),
(3, 'Completed', 'Follow-up Visit')

;


INSERT INTO Emergency (CAID, Triage_Level, Outcome)
VALUES
(4, 'High', 'Admitted to ICU'),
(5, 'Medium', 'Discharged with Medication')
;


INSERT INTO Medication (Class, Name, Form, Strength, Active_Ingredient, Manufacturer)
VALUES
('Antibiotic', 'Amoxicillin', 'Capsule', '500mg', 'Amoxicillin Trihydrate', 'PharmaCorp'),
('Analgesic', 'Ibuprofen', 'Tablet', '200mg', 'Ibuprofen', 'MediHealth'),
('Antidepressant', 'Sertraline', 'Tablet', '50mg', 'Sertraline Hydrochloride', 'Wellness Labs'),
('Antihypertensive', 'Lisinopril', 'Tablet', '10mg', 'Lisinopril Dihydrate', 'CardioMed'),
('Antidiabetic', 'Metformin', 'Tablet', '500mg', 'Metformin Hydrochloride', 'GlucoPharm'),
('Antiviral', 'Acyclovir', 'Cream', '5%', 'Acyclovir', 'ViroTech'),
('Antifungal', 'Fluconazole', 'Tablet', '150mg', 'Fluconazole', 'FungiCure'),
('Sedative', 'Diazepam', 'Tablet', '5mg', 'Diazepam', 'CalmWell'),
('Vaccine', 'Influenza Vaccine', 'Injection', '0.5ml', 'Inactivated Influenza Virus', 'ImmunoPlus'),
('Supplement', 'Vitamin D3', 'Capsule', '1000 IU', 'Cholecalciferol', 'NutriHealth');


INSERT INTO Stock (HID, DrugID, Unit_Price, Stock_Timestamp, Quantity, Reorder_Level)
VALUES
(1, 1, 0.50, '2025-01-15 09:00:00', 100, 20),
(1, 2, 0.30, '2025-01-15 09:00:00', 200, 30),
(2, 3, 1.20, '2025-01-16 10:30:00', 150, 25),
(2, 4, 0.80, '2025-01-16 10:30:00', 120, 15),
(3, 5, 0.60, '2025-01-17 11:45:00', 180, 40),
(3, 6, 2.00, '2025-01-17 11:45:00', 90, 10),
(4, 7, 1.50, '2025-01-18 14:20:00', 130, 20),
(4, 8, 0.70, '2025-01-18 14:20:00', 160, 30),
(5, 9, 15.00, '2025-01-19 15:55:00', 80, 5),
(5, 10, 0.40, '2025-01-19 15:55:00', 220, 50);




INSERT INTO Prescription (Date_Issued, CAID)
VALUES
('2025-10-10', 1),
('2025-10-09', 2),
('2025-10-11', 3)

;





INSERT INTO include (PID, DrugID, dosage, duration)
VALUES
(1, 1, '500mg', 7),
(1, 2, '200mg', 5),
(2, 3, '50mg', 30),
(3, 4, '10mg', 14),
(2, 5, '500mg', 60),
(3, 6, '5%', 10);



/* Update a patient’s phone number and a hospital’s regi */

UPDATE Patient
SET Phone = '+212-699-123456'
WHERE CIN = 'KA789012';

UPDATE Hospital
SET Region = 'Marrakech-Safi'
WHERE Name = 'UM6P Hospital';




DELETE FROM Appointment
WHERE Status = 'Cancelled'
LIMIT 1;