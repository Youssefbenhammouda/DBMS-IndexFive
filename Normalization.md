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
