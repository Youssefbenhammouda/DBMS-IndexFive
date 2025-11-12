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

**Candidate keys:**`{CLID}`

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





**5)Department(DEP_ID,HID,Name,Specialty):**

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



**6)ClinicalActivity(CAID,STAFF_ID,IID,ExID,DEP_ID,Date,Time,Title):**

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




**7)Expense(ExID,InsID,Total):**

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












