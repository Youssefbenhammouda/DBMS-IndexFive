SELECT 
    p.Name,
    p.CIN,
    p.Birth,
    p.Blood_group,
    p.Sex,
    p.Phone,
    a.Reason,
    a.Status,
    h.Name AS Hospital_Name,
    h.City,
    d.Name AS Department_Name,
    d.Specialty
FROM 
    Patient p,
    Clinical_Activity c,
    Appointment a,
    Department d,
    Hospital h
WHERE 
    p.IID = c.IID
    AND c.CAID = a.CAID
    AND c.DEP_ID = d.DEP_ID
    AND d.HID = h.HID
    AND h.City = 'benguerir'
    AND a.Status = 'Scheduled';
