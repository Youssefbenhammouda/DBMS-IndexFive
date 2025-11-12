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
