SELECT HID, Name, City, Region
FROM Hospital;

SELECT * 
FROM UpcomingByHospital
ORDER BY HospitalID, VisitDate, VisitTime;

SELECT Drug_ID, Name, Manufacturer
FROM Medication;

SELECT *
FROM DrugPricingSummary
ORDER BY MID, HID;

SELECT STAFF_ID, FullName
FROM Staff;

SELECT *
FROM StaffWorkloadThirty
ORDER BY STAFF_ID;

SELECT IID, FullName
FROM Patient;

SELECT *
FROM PatientNextVisit
ORDER BY IID;
