### Normalization:


**1)Patient(IID,CIN,Name,Sex,Birth,BloodGroup,Phone):**


**Functional Dependencies(FDs):**


IID → Name, Sex, Birth, BloodGroup, Phone, CIN

CIN → IID, Name, Sex, Birth, BloodGroup, Phone 



**Candidate keys:** `{IID}`,`{CIN}`


**BCNF validation:**

IID is a superkey.

CIN is a superkey.

So,the Patient relation is in BCNF(No decomposition required).


**Lossless Join:**

Lossless join is naturally ensured.


**Dependency preserving:**

Dependency preservation is naturally ensured.






**2)ContactLocation(CLID,City,Province,Street,Number,PostalCode,Phone):**


**Functional Dependencies(FDs):**


CLID → Street, City, Province, Number, PostalCode, Phone,


**Candidate keys:** `{CLID}`


**BCNF validation:**

CLID is a superkey.

So,the ContactLocation relation is in BCNF(No decomposition required).


**Lossless Join:**

Lossless join is naturally ensured.


**Dependency preserving:**

Dependency preservation is naturally ensured.






**3)Staff(STAFF_ID,Name,Status):**


**Functional Dependencies(FDs):**

STAFF_ID → Name, Status

ISA subtypes:

STAFF_ID → LicenseNumber, Specialty (Practitioner)

STAFF_ID → Grade, Ward (Caregiving)

STAFF_ID → Modality, Certifications (Technical)


**Candidate keys:** `{STAFF_ID}`


**BCNF validation:**

STAFF_ID is a superkey.

So,the Staff relation is in BCNF(No decomposition required).


**Lossless Join:**

Lossless join is naturally ensured.


**Dependency preserving:**

Dependency preservation is naturally ensured.




**4)Insurance(InsID,Type):**


**Functional Dependencies(FDs):**

InsID → Type


**Candidate keys:** `{InsID}`


**BCNF validation:**

InsID is a superkey → satisfies BCNF.


**Lossless Join:**

Lossless join is naturally ensured.


**Dependency preserving:**

Dependency preservation is naturally ensured.


**5)Hospital(HID,Name,City,Region):**


**Functional Dependencies(FDs):**

HID → Name, City, Region


**Candidate keys:** `{HID}`


**BCNF validation:**

HID is a superkey → satisfies BCNF.


**Lossless Join:**

Lossless join is naturally ensured.


**Dependency preserving:**

Dependency preservation is naturally ensured.




**6)Department(DEP_ID,HID,Name,Specialty):**


**Functional Dependencies(FDs):**

DEPT_ID → Name, Specialty, HID

HID → Name, City, Region

⇒ DEPT_ID → Name, Specialty, HID,(Hospital.Name, City, Region)


**Candidate keys:** `{DEP_ID}`


**BCNF validation:**

DEP_ID is a superkey → satisfies BCNF.


**Lossless Join:**

Lossless join is naturally ensured.


**Dependency preserving:**

Dependency preservation is naturally ensured.




**7)ClinicalActivity(CAID,STAFF_ID,IID,ExID,DEP_ID,Date,Time,Title):**


**Functional Dependencies(FDs):**

CAID → Title, Time, Date, IID, STAFF_ID, DEPT_ID, ExID

ISA subtypes:

CAID → Status, Reason (Appointment)

CAID → Triage_Level, Outcome (Emergency)


**Candidate keys:** `{CAID}`


**BCNF validation:**

CAID is a superkey → satisfies BCNF.


**Lossless Join:**

Lossless join is naturally ensured.


**Dependency preserving:**

Dependency preservation is naturally ensured.




**8)Expense(ExID,InsID,Total):**


**Functional Dependencies(FDs):**

ExpID → Total, InsID, CAID

CAID ↔ ExpID

InsID → Type *(Note that this FDs is not relevant here,since Type is stored in Insurance relation)*.


**Candidate keys:** `{ExpID}`


**BCNF validation:**

ExpID → Total, InsID, CAID

ExpID is a superkey → satisfies BCNF.


**Lossless Join:**

Lossless join is naturally ensured.


**Dependency preserving:**

Dependency preservation is naturally ensured.






**9)Prescription(PID,DateIssued):**


**Functional Dependencies(FDs):**

PID → DateIssued, CAID


**Candidate keys:** `{PID}`


**BCNF validation:**

PID is a superkey → satisfies BCNF.


**Lossless Join:**

Lossless join is naturally ensured.


**Dependency preserving:**

Dependency preservation is naturally ensured.




**10)Medication(Drug_ID,Name,Form,Strength,Manufacturer,Class,ActiveIngredient):**

**Functional Dependencies(FDs):**

Drug_ID → Name, Form, Strength, Class, ActiveIngredient, Manufacturer


**Candidate keys:** `{Drug_ID}`


**BCNF validation:**

Drug_ID is a superkey → satisfies BCNF.


**Lossless Join:**

Lossless join is naturally ensured.


**Dependency preserving:**

Dependency preservation is naturally ensured.





**11)Stock(HID,Drug_ID,UnitPrice, StockTimestamp, Qty, ReorderLevel):**

**Functional Dependencies(FDs):**

Each stock record is timestamped:

{HID, Drug_ID, StockTimestamp} → UnitPrice, StockRemaining, Qty, ReorderLevel

By transitivity:

{HID, Drug_ID, StockTimestamp} → (Hospital attributes),(Medication attributes)



**Candidate keys:** `{HID,Drug_ID,StockTimestamp}`


**BCNF validation:**

{HID, Drug_ID, StockTimestamp} is a superkey → satisfies BCNF.


**Lossless Join:**

Lossless join is naturally ensured.


**Dependency preserving:**

Dependency preservation is naturally ensured.







**12)Prescription–Medication Relationship(PID,Drug_ID,Dosage,Duration):**

**Functional Dependencies(FDs):**

{PID, Drug_ID} → Dosage, Duration

By transitivity:

{PID, Drug_ID} → (Prescription attributes),(Medication attributes)




**Candidate keys:** `{PID, Drug_ID}`


**BCNF validation:**

{PID, Drug_ID} is a superkey → satisfies BCNF.


**Lossless Join:**

Lossless join is naturally ensured.


**Dependency preserving:**

Dependency preservation is naturally ensured.






**13)Patient–ContactLocation (Have)(IID,CLID):**

**Functional Dependencies(FDs):**

{IID, CLID} → (relationship attributes)

By transitivity:

{IID, CLID} → (Patient attributes),(ContactLocation attributes)

**Candidate keys:** `{IID, CLID}`


**BCNF validation:**

{IID, CLID} is a superkey → satisfies BCNF.


**Lossless Join:**

Lossless join is naturally ensured.


**Dependency preserving:**

Dependency preservation is naturally ensured.







**14)Patient–Insurance (Covers)(InsID,IID):**

**Functional Dependencies(FDs):**

{IID, InsID} → (relationship attributes)

By transitivity:

{IID, InsID} → (Patient attributes),(Insurance.Type)

If a patient has only one insurance:

IID → InsID → Type

**Candidate keys:** `{IID, InsID}`


**BCNF validation:**

{IID, InsID} is a superkey → satisfies BCNF.


**Lossless Join:**

Lossless join is naturally ensured.


**Dependency preserving:**

Dependency preservation is naturally ensured.









**15)Staff–Department (WorkIn)(STAFF_ID,DEP_ID):**

**Functional Dependencies(FDs):**

{STAFF_ID, DEPT_ID} → (relationship attributes)

By transitivity:

{STAFF_ID, DEPT_ID} → (Staff attributes),(Department + Hospital attributes)

**Candidate keys:** `{STAFF_ID, DEPT_ID}`


**BCNF validation:**

{STAFF_ID, DEPT_ID} is a superkey → satisfies BCNF.


**Lossless Join:**

Lossless join is naturally ensured.


**Dependency preserving:**

Dependency preservation is naturally ensured.





