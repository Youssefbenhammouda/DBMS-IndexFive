-- query 1: Select all patients ordered by last name.
SELECT *, REGEXP_REPLACE(Name, '^\\S*\\s','',1,1,'i') AS lastname FROM Patient
ORDER BY lastname;



-- query 2
SELECT DISTINCT I.Ins_type
FROM Insurance I
ORDER BY I.Ins_type;


    
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


-- query 7: List hospitals with more than twenty emergency admissions.

  SELECT H.HID,H.Name,H.City,H.Region,COUNT(H.HID) as clinical_actvitiy_count FROM Hospital H
  JOIN Department D ON D.HID=H.HID
   JOIN Clinical_Activity C ON C.DEP_ID=D.DEP_ID
    JOIN Emergency E ON E.CAID = C.CAID
    GROUP BY H.HID,H.Name,H.City,H.Region
    HAVING clinical_actvitiy_count >20
    ;


-- query 8
SELECT M.Name
FROM Medication M
    JOIN Stock S ON M.DrugID = S.DrugID
WHERE M.Class = 'Antibiotic'
    AND S.Unit_Price < 200;

-- query 9: For each hospital list the top three most expensive medications.

SELECT H.HID, H.Name, M.DrugID, M.Name,t.Unit_Price FROM ( 

    SELECT 
    S.HID,
    S.DrugID ,
    S.Unit_Price,
    ROW_NUMBER() OVER (partition BY H.HID ORDER By S.Unit_Price desc) as row_num
    FROM Hospital H
    JOIN Stock S on S.HID=H.HID  
) t

JOIN `Hospital` H ON H.HID = t.HID
JOIN `Medication` M ON M.DrugID = t.DrugID

where t.row_num <=3
  ;

-- query 10

SELECT D.Name,SUM(A.Status='Scheduled') as count1,SUM(A.Status='Completed') as count2,SUM(A.Status='Cancelled') as count3
FROM Clinical_Activity C JOIN Appointment A ON C.CAID=A.CAID JOIN Department D ON C.DEP_ID=D.DEP_ID
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

SELECT P.IID,P.Name,Count(E.CAID) as count1,MAX(C.occurred_at) as max1
FROM Patient P JOIN Clinical_Activity C ON P.IID=C.IID JOIN Emergency E ON C.CAID=E.CAID
GROUP BY P.IID,P.Name
HAVING count1>=2 AND max1>=(CURRENT_DATE()-14);

-- Query 19: Within each city return medications whose hospital prices show a spread greater than thirty percent between minimum and maximum.
select t.city,t.DrugId,t.Name FROM 
(Select H.city,M.DrugID,M.Name,
min(S.Unit_Price) as min_price,
max(S.Unit_Price) as max_price
FROM `Stock` S
JOIN `Medication` M ON S.DrugID = M.DrugID
JOIN `Hospital` H ON H.HID = S.HID
GROUP BY M.DrugID,H.City
  ) t
WHERE t.max_price > 1.3*min_price
  ;

-- Query 20
SELECT *
FROM Stock S
WHERE S.Quantity<0 OR S.Unit_Price<=0;



