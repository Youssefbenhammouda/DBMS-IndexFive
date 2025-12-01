--  View 1
SELECT HID, HospitalName, ApptDate, TotalAppointments
FROM UpcomingByHospital
ORDER BY HID, ApptDate;

-- View 2
SELECT MID, MedicationName
FROM Medication;

SELECT *
FROM DrugPricingSummary
ORDER BY MID, HID;

--  View 3
SELECT STAFF_ID, FullName
FROM Staff;

SELECT *
FROM StaffWorkloadThirty
ORDER BY STAFF_ID;

--  View 4
SELECT IID, FullName
FROM Patient;

SELECT *
FROM PatientNextVisit
ORDER BY IID;
