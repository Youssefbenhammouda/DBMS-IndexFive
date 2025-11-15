-- query 2
SELECT DISTINCT I.Type
FROM Insurance I
ORDER BY I.Type;


    
-- query 3
SELECT S.Name
FROM Staff S
    JOIN work_in W ON S.STAFF_ID = W.STAFF_ID
    JOIN Department D ON D.DEP_ID = W.DEP_ID
    JOIN Hospital H ON D.HID = H.HID
WHERE H.City = 'Rabat';



-- query 4
SELECT *
FROM Appointment A
    JOIN Clinical_Activity CA ON A.CAID = CA.CAID
WHERE A.Status = 'Scheduled'
    AND CA.occurred_at BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY);



-- Query 5

select C.DEP_ID, count(*) from Clinical_Activity C, Appointment A 
where C.caid = A.caid
GROUP BY C.DEP_ID;



-- Query 6

select S.HID, AVG(S.Unit_Price) from Stock S 
GROUP BY S.HID;



-- query 8
SELECT M.Name
FROM Medication M
    JOIN Stock S ON M.DrugID = S.DrugID
WHERE M.Class = 'Antibiotic'
    AND S.Unit_Price < 200;



-- query 10

SELECT D.Name,SUM(A.Status='Scheduled') as count1,SUM(A.Status='Completed') as count2,SUM(A.Status='Cancelled') as count3
FROM ClinicalActivity C JOIN Appointment A ON C.CAID=A.CAID JOIN Department D ON C.DEP_ID=D.DEP_ID
GROUP BY D.Name;

-- Query 12 

SELECT C.STAFF_ID,D.HID,COUNT(*),COUNT(*)*100/SUM(COUNT(*)) OVER(partition by D.HID) AS percentage
FROM Clinical_Activity C JOIN Appointment A ON C.CAID = A.CAID JOIN Department D  ON C.DEP_ID = D.DEP_ID
GROUP BY C.STAFF_ID, D.HID;



-- query 13




-- Query 16

select P.IID, MIN(C.occurred_at) from Patient P,Clinical_Activity C,Appointment A 
WHERE P.IID = C.IID and A.caid = C.caid and C.occurred_at > CURRENT_DATE
GROUP BY P.IID;



-- Query 17

SELECT P.IID,P.Name,Count(E.CAID) as count1,MAX(C.DATE) as max1
FROM Patients P JOIN ClinicalActivity C ON P.IID=C.IID JOIN Emergency E ON C.CAID=E.CAID
GROUP BY P.IID,P.Name
HAVING count1>=2 AND max1>=(CURRENT_DATE()-14);



-- Query 20
SELECT *
FROM Stock S
WHERE S.Qty<0 OR S.UnitPrice<=0;



