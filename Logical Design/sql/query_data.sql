SELECT * FROM Patient WHERE IID IN (
    SELECT IID FROM Clinical_Activity WHERE CAID IN (
        SELECT CAID FROM Appointment WHERE Status = 'Scheduled'
    )
    AND DEP_ID IN (
        SELECT DEP_ID FROM Department WHERE HID IN (
            SELECT HID FROM Hospital WHERE City = 'BenGuerir'
        )
    )
);