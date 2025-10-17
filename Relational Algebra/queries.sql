SELECT DISTINCT P.Name
FROM Patient P
JOIN Clinical_Activity CA
    ON P.IID = CA.IID
JOIN Staff S
    ON CA.STAFF_ID = S.STAFF_ID
WHERE S.Status = 'active';

