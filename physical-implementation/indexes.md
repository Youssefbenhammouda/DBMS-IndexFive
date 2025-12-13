## View 1:UpcomingByHospital
### Index 1: Appointment(CAID,Status)

** This index accelerates the join between 'Appointment' and 'ClinicalActivity' on 'CAID' and the selection predicate 'A.Status='Scheduled'.

** Yes,'CAID' is used in equality join,which is highly selective and efficient as a leading column,'Status' further filters the results.

** This index introduces additional overhead on insert and update operations on the 'Appointment' table due to index maintenance.
This overhead is acceptable given the performance improvement for frequent read queries.

---

### Index 2: ClinicalActivity(CAID,Status)

** This index accelerates the join between 'Appointment' and 'ClinicalActivity' on 'CAID' and the selection predicate 'A.Status='Scheduled'.

** Yes,'CAID' is used in equality join,making it an effective leading column,while 'Status' supports efficient aggregation.

** This index introduces additional overhead on insert and update operations on the 'Appointment' table due to index maintenance.

---


** Yes,'CAID' is used in equality join,making it an effective leading column,while 'Status' supports efficient aggregation.

** This index introduces additional overhead on insert and update operations on the 'Appointment' table due to index maintenance.
