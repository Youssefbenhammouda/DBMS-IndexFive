## View 1:UpcomingByHospital

### Index 1: Appointment(CAID,Status)

**This index accelerates the join between 'Appointment' and 'ClinicalActivity' on 'CAID' and the selection predicate 'A.Status='Scheduled'.**

**Yes,'CAID' is used in an equality join,which is highly selective and efficient as a leading column,'Status' further filters the results.**

**This index introduces additional overhead on insert and update operations on the 'Appointment' table due to index maintenance.This overhead is acceptable given the performance improvement for frequent read queries.**

---

### Index 2: ClinicalActivity(DEP_ID,Date)

**This index accelerates the join between 'ClinicalActivity' and 'Department' on 'DEP_ID' and the range predicate on 'Date'.**

**Yes,'DEP_ID' is used in an equality join and is therefore appropriate as the leading column,followed by 'Date' for range filtering.**

**This index increases the cost of inserts and updates on the 'ClinicalActivity' table,but the performance gain for date-based queries justifies this cost.**

---



## View 2:StaffWorkloadThirty

### Index 1: Appointment(CAID,Status)

**This index accelerates the join between 'Appointment' and 'ClinicalActivity' on 'CAID' and supports aggregation by appointment status.**

**Yes,'CAID' is used in equality join,making it an effective leading column,while 'Status' supports efficient aggregation.**

**This index introduces additional overhead on insert and update operations on the 'Appointment' table due to index maintenance.**

### Index 2: ClinicalActivity(STAFF_ID,Date)

**This index accelerates the join between 'ClinicalActivity' and 'Staff' on 'STAFF_ID' and the date range predicate in the WHERE clause.**

**Yes,'STAFF_ID' is used in an equality join and is therefore appropriate as the leading column,followed by 'Date' for range filtering.**

**This index increases the cost of inserts and updates on the 'ClinicalActivity' table,but this overhead is acceptable given the improvement in query performance.**

---




## View 3:PatientNextVisit

### Index 1: Appointment(CAID,Status)

**This index accelerates the join between 'Appointment' and 'ClinicalActivity' on 'CAID' and filters appointments with 'Status='Scheduled''.**

**Yes,'CAID' is highly selective and is used in an equality joibn,making it a suitable leading column.**

**This index adds overhead on insert and update operations on the 'Appointment' table due to index maintenance.**

### Index 2: ClinicalActivity(IID,Date,Time)

**This index supports partitioning by patient('IID') and ordering by appointment date and time, which is required to compute the next visit using the 'Row_NUMBER()' function.**

**Yes,IID is appropriate as the leading column beacuse the query groups appointments by patient before ordering them by date and time.**

**This index increases the cost of inserts and updates on the 'ClinicalActivity' table,but this overhead is justified by the performance gain for next-visit queries.**

---







## Q2)Frequent query Pattern Optimization:

### Index 1: Appointment(CAID,Status)

**This index allows the optimizer to efficiently filter appointments with 'Staus='Scheduled'' and quickly join them with 'ClinicalActivity' using the 'CAID' column. By reducing the number of appointment records early,the join cost is significantly reduced.**

### Index 2:ClinicalActivity(DEP_ID,Date)
**This index allows the optimizer to efficiently perform the equality join with 'Department' on 'DEP_ID' and apply the range predicate on 'Date'.This reduces the number of clinical activity records processed before grouping by hospital and date**
