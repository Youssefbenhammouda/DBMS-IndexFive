CREATE VIEW UpcomingByHospital AS
SELECT H.`Name` as HospitalName, C.`Date` as ApptDate, count(C.`CAID`) FROM `Appointment` A
JOIN  `ClinicalActivity` C ON C.`CAID` = A.`CAID`
JOIN `Department` D ON D.`DEP_ID` = C.`DEP_ID`
JOIN `Hospital` H ON H.`HID` = D.`HID`

WHERE A.`Status` = 'Scheduled' AND (C.`Date` BETWEEN CURRENT_DATE() AND DATE_ADD(CURRENT_DATE(),INTERVAL 14 DAY))
GROUP BY H.`HID`,C.`Date`
;