


/* Update a patient’s phone number and a hospital’s regi */

UPDATE Patient
SET Phone = '+212-699-123456'
WHERE CIN = 'KA789012';

UPDATE Hospital
SET Region = 'Marrakech-Safi'
WHERE HID=1;

UPDATE Clinical_Activity
SET occurred_at =Now()- INTERVAL 3 DAY
WHERE CAID=4;


DELETE FROM Appointment
WHERE Status = 'Cancelled'
LIMIT 1;


