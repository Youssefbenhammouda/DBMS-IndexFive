CREATE OR REPLACE VIEW UpcomingByHospital AS
SELECT H.`Name` as HospitalName, C.`Date` as ApptDate, count(C.`CAID`) FROM `Appointment` A
JOIN  `ClinicalActivity` C ON C.`CAID` = A.`CAID`
JOIN `Department` D ON D.`DEP_ID` = C.`DEP_ID`
JOIN `Hospital` H ON H.`HID` = D.`HID`

WHERE A.`Status` = 'Scheduled' AND (C.`Date` BETWEEN CURRENT_DATE() AND DATE_ADD(CURRENT_DATE(),INTERVAL 14 DAY))
GROUP BY H.`HID`,C.`Date`
;


CREATE OR REPLACE VIEW DrugPricingSummary AS
SELECT S.HID as HID ,H.Name as HospitalName,S.MID as MID,M.Name as MedicationName,AVG(S.UnitPrice) as AvgUnitPrice,MIN(S.UnitPrice) as MinUnitPrice,MAX(S.UnitPrice) as MaxUnitPrice,
MAX(S.StockTimestamp) as LastStockTimestamp
FROM Stock S
JOIN Hospital H ON H.HID=S.HID
JOIN Medication M ON S.MID=M.MID
GROUP BY S.HID,H.Name,S.MID,M.Name;
