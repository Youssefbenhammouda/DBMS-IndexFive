select p.Name,p.CIN,p.Birth,p.Blood_group,p.Sex,p.Phone, a.Reason , a.Status,h.Name, h.City,d.Name,d.Specialty from Patient p
join `Clinical_Activity` c ON p.IID = c.IID
join Appointment a ON c.CAID = a.CAID
join `Department` d ON c.DEP_ID =  d.DEP_ID
join `Hospital` h ON d.HID = h.HID
where h.City = 'benguerir' AND a.Status = 'Scheduled';