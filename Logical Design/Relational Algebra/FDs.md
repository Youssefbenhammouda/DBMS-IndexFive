### Functional Dependencies 

This document lists all functional dependencies (FDs) identified in the MNHS relational schema.
These FDs shows us how attributes depend on primary keys and foreign key within each entity.

### Functional Dependencies of MNHS shema:

### Patient:

**Relation:** Patient( IID ,CIN ,Name ,Sex ,Birth ,Blood_group ,Phone )

**FDs:**

 - IID &rarr; CIN ,Name ,Sex ,Birth ,Blood_group ,Phone
   
### Staff:

**Relation:** Staff(STAFF_ID ,Name ,Status )

**FDs:**

 - STAFF_ID &rarr; Name ,Status
 - 
### Clinical_Activity:

**Relation:** Clinical_Activity(CAID, occurred_at, IID, ExID, DEP_ID, STAFF_ID )

**FDs:**

 - CAID &rarr; occurred_at, IID, ExID, DEP_ID, STAFF_ID

### Appointment:

**Relation:** Appointment(CAID, Status, Reason)

**FDs:**

 - CAID &rarr; Status, Reason
