 ### Functional Dependencies 

This document lists all functional dependencies (FDs) identified in the MNHS relational schema.
These FDs shows us how attributes depend on primary keys and foreign key within each entity.

### Functional Dependencies of MNHS shema:


### Patient:

**Relation:** Patient( IID ,CIN ,Name ,Sex ,Birth ,Blood_group ,Phone )

**FDs:**

 **Direct FDs:**
 
 - IID &rarr; CIN ,Name ,Sex ,Birth ,Blood_group ,Phone
 - CIN &rarr; IID ,Name ,Sex ,Birth ,Blood_group ,Phone

 **Derived FDs:**
 - IID &rarr; CIN
 - IID &rarr; Name
 - IID &rarr; Sex

   etc
   
 - CIN &rarr; IID
 - CIN &rarr; Name

   etc



   
### Contact_Location:

**Relation:** Contact_Location(CLID, City, Province, Street, Number, Postal_code, Phone)

**FDs:**

**Direct FDs:**
- CLID → City, Province, Street, Number, Postal_code, Phone

**Derived FDs:**
- CLID → City
- CLID → Province
- CLID → Street
- CLID → Number
- CLID → Postal_code
- CLID → Phone





### Have:

**Relation:** Have(CLID, IID)

**FDs:**

**Direct FDs:**
- CLID, IID → (CLID, IID)

**Derived FDs:**
- CLID, IID → CLID
- CLID, IID → IID





### Insurance:

**Relation:** Insurance(InsID, Ins_type)

**FDs:**

**Direct FDs:**
- InsID → Ins_type

**Derived FDs:**
- InsID → Ins_type




### Expense:

**Relation:** Expense(ExID, Total, InsID)

**FDs:**

**Direct FDs:**
- ExID → Total, InsID

**Derived FDs:**
- ExID → Total
- ExID → InsID



### Covers:

**Relation:** Covers(InsID, IID)

**FDs:**

**Direct FDs:**
- InsID, IID → InsID, IID

**Derived FDs:**
- InsID, IID → InsID
- InsID, IID → IID




### Staff:

**Relation:** Staff(STAFF_ID, Name, Status)

**FDs:**

**Direct FDs:**
- STAFF_ID → Name, Status

**Derived FDs:**
- STAFF_ID → Name
- STAFF_ID → Status


### Practioner:

**Relation:** Practioner(STAFF_ID, License_Number, Specialty)

**FDs:**

**Direct FDs:**
- STAFF_ID → Name, Status, License_Number, Specialty

**Derived FDs:**
- STAFF_ID → Name
- STAFF_ID → Status
- STAFF_ID → License_Number
- STAFF_ID → Specialty




### Caregiving:

**Relation:** Caregiving(STAFF_ID, Grade, Ward)

**FDs:**

**Direct FDs:**
- STAFF_ID → Name, Status, Grade, Ward

**Derived FDs:**
- STAFF_ID → Name
- STAFF_ID → Status
- STAFF_ID → Grade
- STAFF_ID → Ward




### Technical:

**Relation:** Technical(STAFF_ID, Modality, Certifications)

**FDs:**

**Direct FDs:**
- STAFF_ID → Name, Status, Modality, Certifications

**Derived FDs:**
- STAFF_ID → Name
- STAFF_ID → Status
- STAFF_ID → Modality
- STAFF_ID → Certifications



### Hospital:

**Relation:** Hospital(HID, Name, City, Region)

**FDs:**

**Direct FDs:**
- HID → Name, City, Region

**Derived FDs:**
- HID → Name
- HID → City
- HID → Region





### Department:

**Relation:** Department(DEP_ID, Name, Specialty, HID)

**FDs:**

**Direct FDs:**
- DEP_ID → Name, Specialty, HID

**Derived FDs:**
- DEP_ID → Name
- DEP_ID → Specialty
- DEP_ID → HID





### Clinical_Activity:

**Relation:** Clinical_Activity(CAID, occurred_at, IID, ExID, DEP_ID, STAFF_ID)

**FDs:**

**Direct FDs:**
- CAID → occurred_at, IID, ExID, DEP_ID, STAFF_ID

**Derived FDs:**
- CAID → occurred_at
- CAID → IID
- CAID → ExID
- CAID → DEP_ID
- CAID → STAFF_ID




### Appointment:

**Relation:** Appointment(CAID, Status, Reason)

**FDs:**

**Direct FDs:**
- CAID → occurred_at, IID, ExID, DEP_ID, STAFF_ID, Status, Reason

**Derived FDs:**
- CAID → occurred_at
- CAID → IID
- CAID → ExID
- CAID → DEP_ID
- CAID → STAFF_ID
- CAID → Status
- CAID → Reason



### Emergency:

**Relation:** Emergency(CAID, Triage_Level, Outcome)

**FDs:**

**Direct FDs:**
- CAID → occurred_at, IID, ExID, DEP_ID, STAFF_ID, Triage_Level, Outcome

**Derived FDs:**
- CAID → occurred_at
- CAID → IID
- CAID → ExID
- CAID → DEP_ID
- CAID → STAFF_ID
- CAID → Triage_Level
- CAID → Outcome





### Prescription:

**Relation:** Prescription(PID, Date_Issued, CAID)

**FDs:**

**Direct FDs:**
- PID → Date_Issued, CAID

**Derived FDs:**
- PID → Date_Issued
- PID → CAID


   

### Medication:

**Relation:** Medication(DrugID, Class, Name, Form, Strength, Active_Ingredient, Manufacturer)

**FDs:**

**Direct FDs:**
- DrugID → Class, Name, Form, Strength, Active_Ingredient, Manufacturer

**Derived FDs:**
- DrugID → Class
- DrugID → Name
- DrugID → Form
- DrugID → Strength
- DrugID → Active_Ingredient
- DrugID → Manufacturer





### Stock:

**Relation:** Stock(HID, DrugID, Unit_Price, Stock_Timestamp, Quantity, Reorder_Level)

**FDs:**

**Direct FDs:**
- HID, DrugID → Unit_Price, Stock_Timestamp, Quantity, Reorder_Level

**Derived FDs:**
- HID, DrugID → Unit_Price
- HID, DrugID → Stock_Timestamp
- HID, DrugID → Quantity
- HID, DrugID → Reorder_Level



### Include:

**Relation:** Include(PID, DrugID, dosage, duration)

**FDs:**

**Direct FDs:**
- PID, DrugID → dosage, duration

**Derived FDs:**
- PID, DrugID → dosage
- PID, DrugID → duration




### Work_in:

**Relation:** Work_in(STAFF_ID, DEP_ID)

**FDs:**

**Direct FDs:**
- STAFF_ID, DEP_ID → STAFF_ID, DEP_ID  *(composite primary key)*

**Derived FDs:**
- STAFF_ID, DEP_ID → STAFF_ID
- STAFF_ID, DEP_ID → DEP_ID

