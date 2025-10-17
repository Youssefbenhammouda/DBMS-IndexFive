SELECT P.Name
FROM Patient P
JOIN Clinical_Activity CA
    ON P.IID = CA.IID
JOIN Staff S
    ON CA.STAFF_ID = S.STAFF_ID
WHERE S.Status = 'active';



SELECT S.STAFF_ID
FROM Staff S
WHERE Status = 'active'

UNION

SELECT CA.STAFF_ID
FROM Clinical_Activity CA
JOIN Prescription PR
    ON CA.CAID = PR.CAID;



SELECT H.HID
FROM Hospital H
WHERE H.City = 'Benguerir'

UNION

SELECT D.HID
FROM Department D
WHERE D.Specialty = 'Cardiology';
