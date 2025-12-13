-- View 1 : UpcomingByHospital

-- index 1 :

-- Speeds up join with ClinicalActivity and filters appointments by status

CREATE INDEX idx_appointment_CAID_Status
ON Appointment(CAID,Status);

-- index 2:

-- Optimizes join with Department and filtering by appointment date range

CREATE INDEX idx_ClinicalActivity_DEP_ID_Date
ON ClinicalActivity(DEP_ID,Date);





-- View 2 : StaffWorkloadThirty

-- index 1 :

-- Improves join with Appointment and status-based aggregation
-- Uses idx_appointment_CAID_Status

-- index 2:

-- Optimizes join with Staff and filtering by activity date range

CREATE INDEX idx_ClinicalActivity_STAFF_ID_Date
ON ClinicalActivity(STAFF_ID,Date);







-- View 3 : PatientNextVisit

-- index 1 :

-- Improves join with ClinicalActivity and filters scheduled appointments

-- Uses idx_appointment_CAID_Status

-- index 2:

-- Optimizes partitionning by patient and ordering by appointment date and time

CREATE INDEX idx_ClinicalActivity_IID_Date_Time
ON ClinicalActivity(IID,Date,Time);





