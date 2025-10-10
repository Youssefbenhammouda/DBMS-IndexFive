INSERT INTO Patient (CIN, Name, Sex, Birth, Blood_group, Phone) 
VALUES 
('BE123456', 'Yahya BELEFQUIH', 'M', '2006-08-15', 'O+', '+212 624-261540'),
('KA789012', 'Youssef Benani', 'M', '1992-11-22', 'A-', '+212-700-987654'),
('LE345678', 'Leila El Amrani', 'F', '1985-05-30', 'B+', '+212-600-123456')
;


INSERT INTO Contact_Location (City, Province, Street, Number, Postal_code, Phone)
VALUES
('Marrakech', 'Marrakech-Safi', 'Avenue Mohammed VI', '123', '40000', '+212-524-123456'),
('Casablanca', 'Casablanca-Settat', 'Haj Fateh', '45', '20000', '+212-522-654321');



INSERT INTO Have (CLID, IID)
VALUES
(1, 1),
(2, 2);

INSERT INTO Insurance (Ins_type )
VALUES
('CNOPS'),
('CNSS')
;

INSERT INTO Covers (InsID, IID)
VALUES
(1, 1),
(2, 2),
(1, 2);

INSERT INTO Staff (Name, Status)
VALUES
('Dr. Amina El Fassi', 'Active'),
('Nurse Samir Haddad', 'Active'),
('Technician Leila Benjelloun', 'Inactive');


INSERT INTO Hospital (Name, City, Region)
VALUES
('UM6P Hospital', 'BenGuerir', 'Marrakech-Safi'),
('Sheikh Khalifa Hospital', 'Casablanca', 'Casablanca-Settat');


INSERT INTO Department (Name, Specialty, HID)
VALUES
('Cardiology', 'Heart Diseases', 1),
('Neurology', 'Brain and Nervous System', 1),
('Orthopedics', 'Bone and Muscle Disorders', 2);


INSERT INTO work_in  (DEP_ID, STAFF_ID)
VALUES
(1, 1),
(2, 2),
(3, 3);


INSERT INTO Expense(Total, InsID)
VALUES
(1000, 1),
(2000, 2),
(1500, 2);


INSERT INTO Clinical_Activity(occurred_at, IID, ExID, DEP_ID, STAFF_ID)
VALUES
('2025-10-10 10:00:00', 1, 1, 1, 1),
('2025-10-09 14:30:00', 2, 2, 2, 2),
('2025-10-11 09:15:00', 3, 3, 3, 3);


INSERT INTO Appointment (CAID, Status, Reason)
VALUES
(1, 'Scheduled', 'Routine Checkup'),
(2, 'Cancelled', 'Patient Request'),
(3, 'Completed', 'Follow-up Visit');

