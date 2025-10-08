# Relational Schema
### **Entity: `Patient`**

**Attributes:**

* **Primary Key:** `IID`
* **Other Attributes:**

  * `IID (INT, NOT NULL, AUTO_INCREMENT,PRIMARY KEY)`
  * `CIN (VARCHAR(100), NOT NULL)`
  * `Name (VARCHAR(100), NOT NULL)`
  * `Sex (VARCHAR(500), NOT NULL)`
  * `Birth (DATE, NOT NULL)`
  * `Blood_group (VARCHAR(10), NOT NULL)`
  * `Phone (VARCHAR(20))`

**Description:**
This table represents the `Patient` entity, which stores essential informations about individuals receiving medical care within MNHS system, including :CIN, Name, Sex, Birth, Blood group and phone number, uniquely identified by the `IID` primary key.

---

### **Entity: `Contact_Location`**

**Attributes:**

* **Primary Key:** `CLID`
* **Other Attributes:**

  * `CLID (INT, NOT NULL, AUTO_INCREMENT,PRIMARY KEY)`
  * `city (VARCHAR(100), NOT NULL)`
  * `province (VARCHAR(100), NOT NULL)`
  * `Street (VARCHAR(500), NOT NULL)`
  * `number (VARCHAR(10), NOT NULL)`
  * `postal_code (VARCHAR(10), NOT NULL)`
  * `Phone (VARCHAR(20))`

**Description:**
This table represents the `Insurance` entity, which stores information about patient insurance coverage, including the insurance type (such as CNOPS, CNSS, RAMED, or private), uniquely identified by the `ExID` primary key.

---


### **Relationship: `Have`**
**Attributes:**  
- **Primary Key:** `CLID,IID`  
- **Foreign Keys:**  
  - `CLID → Contact_Location(CLID)`
  - `IID → Patient(IID)`


**Description:**  
This table represents the `Have` relationship, which establishes a many-to-many association between patients and their contact locations.

---

### **Entity: `Insurance`**

**Attributes:**

* **Primary Key:** `InsID`
* **Other Attributes:**

  * `InsID (INT, NOT NULL, AUTO_INCREMENT,PRIMARY KEY)`
  * `ins_type (VARCHAR(10), CHECK (ins_type in ('CNOPS', 'CNSS', 'RAMED', 'private') OR ins_type IS NULL)`

**Description:**
This table represents the `Insurance` entity, which stores information about patient insurance coverage, including the insurance type (such as CNOPS, CNSS, RAMED, or private), uniquely identified by the `ExID` primary key.

---

### Entity: `Expense`
**Attributes:**
* **Primary Key:** `ExID`
* **Foreign Keys:**
  * `InsID → Insurance(InsID)`
* **Other Attributes:**
  * `ExID (INT, NOT NULL, AUTO_INCREMENT,PRIMARY KEY)`
  * `total (Double, NOT NULL)`
  * `InsID (INT, NOT NULL)`

**Description:**
This table represents the `Expense` entity, which captures the financial aspects related to patient care, including the total expenses incurred during medical treatments, uniquely identified by the `ExID` primary key.

---

### **Relationship: `Covers`**

**Attributes:**

* **Primary Key:** `InsID,IID`
* **Foreign Keys:**

  * `InsID → Insurance(InsID)`
  * `IID → Patient(IID)`
* **Other Attributes:**
  * `InsID (INT, NOT NULL)`
  * `IID (INT, NOT NULL)`

**Description:**
This table represents the `Covers` relationship, which establishes a many-to-many association between patients and their insurance coverage.

---

### **Entity: `Staff`**

**Attributes:**

* **Primary Key:** `STAFF_ID`
* **Other Attributes:**

  * `STAFF_ID (INT, NOT NULL, AUTO_INCREMENT,PRIMARY KEY)`
  * `Name (VARCHAR(100), NOT NULL)`
  * `Status (VARCHAR(20), NOT NULL)`

**Description:**
This table represents the `Staff` entity, which captures the common informations shared by every Staff member, including: Name and Status,uniquely identified by the `STAFF_ID` primary key.



### **`Practioner,Caregiving and Technical entities are a sub-type of Staff(i.e inherits attributes from Staff)`**

---

### **Entity: `Practioner`**

**Attributes:**

* **Primary Key:** `STAFF_ID`
* **Other Attributes:**

  * `STAFF_ID (INT, NOT NULL, AUTO_INCREMENT,PRIMARY KEY)`
  * `Name (VARCHAR(100), NOT NULL)`
  * `Status (VARCHAR(20), NOT NULL)`
  * `License_Number (INT, NOT NULL)`
  * `Specialty (VARCHAR(100), NOT NULL)`

**Description:**
This table represents the `Practioner` entity, which represents licensed medical staff, including:
Name,Status,License_Number and Specialty,uniquely identified by the `STAFF_ID` primary key.

---

### **Entity: `Caregiving`**

**Attributes:**

* **Primary Key:** `STAFF_ID`
* **Other Attributes:**

  * `STAFF_ID (INT, NOT NULL, AUTO_INCREMENT,PRIMARY KEY)`
  * `Name (VARCHAR(100), NOT NULL)`
  * `Status (VARCHAR(20), NOT NULL)`
  * `Grade (VARCHAR(50), NOT NULL)`
  * `Ward (VARCHAR(100), NOT NULL)`

**Description:**
This table represents the `Caregiving` entity, which represents specialty and license details, including: Name,Status,Grade and Ward,uniquely identified by the `STAFF_ID` primary key,because it is a sub-type of Staff(i.e inherits attributes from Staff).

---

### **Entity: `Technical`**

**Attributes:**

* **Primary Key:** `STAFF_ID`
* **Other Attributes:**

  * `STAFF_ID (INT, NOT NULL, AUTO_INCREMENT,PRIMARY KEY)`
  * `Name (VARCHAR(100), NOT NULL)`
  * `Status (VARCHAR(20), NOT NULL)`
  * `Modality (VARCHAR(100), NOT NULL)`
  * `Certifications (VARCHAR(100), NOT NULL)`

**Description:**
This table represents the `Technical` entity, which represents non-caregiving roles, including: Name,Status,Modality and Certifications,uniquely identified by the `STAFF_ID` primary key.

---

### **Entity: `Department`**

**Attributes:**

* **Primary Key:** `DEP_ID`
* **Other Attributes:**

  * `DEP_ID (INT, NOT NULL, AUTO_INCREMENT,PRIMARY KEY)`
  * `Name (VARCHAR(100), NOT NULL)`
  * `Specialty (VARCHAR(100), NOT NULL)`

**Description:**
This table represents the `Department` entity, which captures informations about the different departments within the hospital, including: Name and Specialty,uniquely identified by the `DEP_ID` primary key.
