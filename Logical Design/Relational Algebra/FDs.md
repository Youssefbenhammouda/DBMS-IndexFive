### Functional Dependencies 

This document lists all functional dependencies (FDs) identified in the MNHS relational schema.
These FDs shows us how attributes depend on primary keys and foreign key within each entity.

### Functional Dependencies of MNHS shema:

### Patient:

**Relation:** Patient( IID ,CIN ,Name ,Sex ,Birth ,Blood_group ,Phone )

**FDs:**

 **Direct FDs:**
 
 - IID &rarr; CIN ,Name ,Sex ,Birth ,Blood_group ,Phone
 
   
### Staff:

**Relation:** Staff(STAFF_ID ,Name ,Status )

**FDs:**

 **Direct FDs:**
 
 - STAFF_ID &rarr; Name ,Status
   
### Clinical_Activity:

**Relation:** Clinical_Activity(CAID, occurred_at, IID, ExID, DEP_ID, STAFF_ID )

**FDs:**

 **Direct FDs:**
 
 - CAID &rarr; occurred_at, IID, ExID, DEP_ID, STAFF_ID

 **Derived FDs(via Staff_ID):**
 
 - Staff_ID &rarr; Name,Status
   
 - CAID &rarr; Name,Status
   
 **Derived FDs(via IID):**
 
 - IID &rarr; CIN,,Sex ,Birth ,Blood_group ,Phone 
   
 - CAID &rarr; CIN,,Sex ,Birth ,Blood_group ,Phone

### Appointment:

**Relation:** Appointment(CAID, Status, Reason)

**FDs:**

 **Direct FDs:**
 
 - CAID &rarr; Status, Reason

### Department:

**Relation:** Department(DEP_ID, Name, Specialty, HID)

**FDs:**

 **Direct FDs:**
 
 - DEP_ID &rarr; Name, Specialty, HID
