# Relational Schema
### **Entity: `Patient`**

**Attributes:**

* **Primary Key:** `IID`
* **Other Attributes:**

  * `IID (INT, NOT NULL, AUTO_INCREMENT,PRIMARY KEY)`
  * `CIN (VARCHAR(100), NOT NULL, UNIQUE)`
  * `Name (VARCHAR(100), NOT NULL)`
  * `Sex (VARCHAR(1), NOT NULL, CHECK (Sex in ('M', 'F')))`
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
  * `Number (VARCHAR(10), NOT NULL)`
  * `postal_code (VARCHAR(10), NOT NULL)`
  * `Phone (VARCHAR(20))`

**Description:**
This table represents the `Contact_Location` entity, which stores information about the contact locations of patients, including city, province, street, number, postal code, and phone number, uniquely identified by the `CLID` primary key.

---

### **Relationship: `Have`**
**Attributes:**  
- **Primary Key:** `CLID,IID`  
- **Foreign Keys:**  
  - `CLID → Contact_Location(CLID) ON DELETE CASCADE`
  - `IID → Patient(IID) ON DELETE CASCADE`


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
This table represents the `Insurance` entity, which stores information about patient insurance coverage, including the insurance type (such as CNOPS, CNSS, RAMED, or private or none), uniquely identified by the `ExID` primary key.

---

### **Entity: `Expense`**
**Attributes:**
* **Primary Key:** `ExID`
* **Foreign Keys:**
  * `InsID → Insurance(InsID) ON DELETE CASCADE`
* **Other Attributes:**
  * `ExID (INT, NOT NULL, AUTO_INCREMENT,PRIMARY KEY)`
  * `total (DECIMAL(10,2), NOT NULL)`
  * `InsID (INT, NOT NULL)`

**Description:**
This table represents the `Expense` entity, which captures the financial aspects related to patient care, including the total expenses incurred during medical treatments, uniquely identified by the `ExID` primary key.

---

### **Relationship: `Covers`**

**Attributes:**

* **Primary Key:** `InsID,IID`
* **Foreign Keys:**

  * `InsID → Insurance(InsID) ON DELETE CASCADE`
  * `IID → Patient(IID) ON DELETE CASCADE`
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

---

### **`Practioner,Caregiving and Technical entities are a sub-type of Staff(i.e inherits attributes from Staff)`**


### **Entity: `Practioner`**

**Attributes:**

* **Primary Key:** `STAFF_ID`
* **Foreign Keys:**
  * `STAFF_ID → Staff(STAFF_ID) ON DELETE CASCADE`
* **Other Attributes:**

  * `STAFF_ID (INT, NOT NULL, PRIMARY KEY)`
  * `License_Number (INT, NOT NULL)`
  * `Specialty (VARCHAR(100), NOT NULL)`

**Description:**
This table represents the `Practioner` entity, which represents licensed medical staff, including:
Name,Status,License_Number and Specialty,uniquely identified by the `STAFF_ID` primary key.

---

### **Entity: `Caregiving`**

**Attributes:**

* **Primary Key:** `STAFF_ID`
* **Foreign Keys:**
  * `STAFF_ID → Staff(STAFF_ID) ON DELETE CASCADE`
* **Other Attributes:**
  * `STAFF_ID (INT, NOT NULL,PRIMARY KEY)`
  * `Grade (VARCHAR(50), NOT NULL)`
  * `Ward (VARCHAR(100), NOT NULL)`

**Description:**
This table represents the `Caregiving` entity, which represents specialty and license details, including: Name,Status,Grade and Ward,uniquely identified by the `STAFF_ID` primary key,because it is a sub-type of Staff(i.e inherits attributes from Staff).

---

### **Entity: `Technical`**

**Attributes:**

* **Primary Key:** `STAFF_ID`
* **Foreign Keys:**
  * `STAFF_ID → Staff(STAFF_ID) ON DELETE CASCADE`
* **Other Attributes:**
  * `STAFF_ID (INT, NOT NULL,PRIMARY KEY)`
  * `Modality (VARCHAR(100), NOT NULL)`
  * `Certifications (VARCHAR(100), NOT NULL)`

**Description:**
This table represents the `Technical` entity, which represents non-caregiving roles, including: Name,Status,Modality and Certifications,uniquely identified by the `STAFF_ID` primary key.

---

### **Entity: `Department`**

**Attributes:**

* **Primary Key:** `DEP_ID`
* **Foreign Keys:**
  * `HID → Hospital(HID) ON DELETE CASCADE`
* **Other Attributes:**

  * `DEP_ID (INT, NOT NULL, AUTO_INCREMENT,PRIMARY KEY)`
  * `Name (VARCHAR(100), NOT NULL)`
  * `Specialty (VARCHAR(100), NOT NULL)`
  * `HID (INT, NOT NULL)`

**Description:**
This table represents the `Department` entity, which captures informations about the different departments within the hospital, including: Name and Specialty,uniquely identified by the `DEP_ID` primary key.

---



### **Entity: `Hospital`**

**Attributes:**
* **Primary Key:** `HID`
* **Other Attributes:**

  * `HID (INT, NOT NULL, AUTO_INCREMENT,PRIMARY KEY)`
  * `Name (VARCHAR(100), NOT NULL)`
  * `City (VARCHAR(100), NOT NULL)`
  * `Region (VARCHAR(100), NOT NULL)`

**Description:**
This table represents the `Hospital` entity, which captures each hospital's name, city and region, uniquely identified by the the `HID` primary key.

---



### **Entity: `Clinical_Activity`**

**Attributes:**

* **Primary Key:** `CAID`
* **Foreign Keys:**
  * `STAFF_ID → Staff(STAFF_ID) ON DELETE RECTRICT`
  * `IID → Patient(IID) ON DELETE RECTRICT`
  * `ExID → Expense(ExID)`
  * `DEP_ID → Department(DEP_ID)`
* **Other Attributes:**

  * `CAID (INT, NOT NULL, AUTO_INCREMENT,PRIMARY KEY)`
  * `occurred_at DATETIME NOT NULL`
  * `IID (INT, NOT NULL)`
  * `ExID (INT, UNIQUE, NOT NULL)`
  * `DEP_ID (INT, NOT NULL)`
  * `STAFF_ID (INT, NOT NULL)`
  

**Description:**
This table represents the `Clinical_Activity` entity, which captures the common informations shared by every Clinical Activity, including: occurred_at, uniquely identified by the `CAID` primary key.


### **`Appoitment and Emergency entities are a sub-type of Clinical Activity(i.e inherits attributes from Clinical Activity)`**

---

### **Entity: `Appointment`**

**Attributes:**

* **Primary Key:** `CAID`
* **Foreign Keys:**
  * `CAID → Clinical_Activity(CAID) ON DELETE CASCADE`
* **Other Attributes:**

  * `CAID (INT, NOT NULL, AUTO_INCREMENT,PRIMARY KEY)`
  * `Status VARCHAR(10) CHECK(type in ('Scheduled', 'Completed', 'Cancelled') or type is NULL)`
  * `Reason VARCHAR(255) NOT NULL`

**Description:**
This table represents the `Appointment` entity,including:
Status,and Reason,uniquely identified by the `CAID` primary key.

---

### **Entity: `Emergency`**

**Attributes:**

* **Primary Key:** `CAID`
* **Foreign Keys:**
  * `CAID → Clinical_Activity(CAID) ON DELETE CASCADE`
* **Other Attributes:**
  * `CAID (INT, NOT NULL, AUTO_INCREMENT,PRIMARY KEY)`
  * `Triage_Level VARCHAR(100) NOT NULL`
  * `Outcome VARCHAR(100) NOT NULL`

**Description:**
This table represents the `Emergency` entity, including: Triahe_Level and Outcome,uniquely identified by the `CAID` primary key,because it is a sub-type of Clinical Activity(i.e inherits attributes from  Clinical Activity).

---


### Entity: `Prescription`
**Attributes:**
* **Primary Key:** `PID`
* **Foreign Keys:**
  * `CAID → Clinical_Activity(CAID) ON DELETE RESTRICT`
* **Other Attributes:**
  * `PID (INT, NOT NULL, AUTO_INCREMENT,PRIMARY KEY)`
  * `Date_Issued DATE`
  * `CAID (INT, NOT NULL, UNIQUE)`

**Description:**
This table represents the `Prescription` entity, including Date when the prescription was issed, uniquely identified by the `PID` primary key.



### Entity: `Medication`
**Attributes:**
* **Primary Key:** `DrugID`
* **Other Attributes:**
  * `DrugID (INT, NOT NULL, AUTO_INCREMENT,PRIMARY KEY)`
  * `Class (VARCHAR(100), NOT NULL)`
  * `Name (VARCHAR(100), NOT NULL)`
  * `Form (VARCHAR(100), NOT NULL)`
  * `Strength (VARCHAR(100), NOT NULL)`
  * `Active_Ingredient (VARCHAR(100), NOT NULL)`
  * `Manufacturer (VARCHAR(100), NOT NULL)`
**Description:**
This table represents the `Medication` entity. Each record corresponds to a specific drug, uniquely identified by DrugID, and includes details such as its class, form, strength, active ingredient, and manufacturer.

---

### **Relationship: `Stock`**

**Attributes:**

* **Primary Key:** `HID,DrugID`
* **Foreign Keys:**

  * `HID → Hospital(HID) ON DELETE CASCADE`
  * `DrugID → Medication(DrugID) ON DELETE CASCADE`
* **Other Attributes:**
  * `DrugID (INT, NOT NULL)`
  * `HID (INT, NOT NULL)`
  * `Unit_Price (DECIMAL(10,2), NOT NULL)`
  * `Stock_Timestamp (DATETIME, NOT NULL)`
  * `Quantity (INT, NOT NULL)`
  * `Reorder_Level (INT, NOT NULL)`

**Description:**
This table represents the `Stock` relationship, which establishes a many-to-many association between Hospital and their hospital.

---

### **Relationship: `include`**

**Attributes:**

* **Primary Key:** `PID,DrugID`
* **Foreign Keys:**

  * `PID → Prescription(PID) ON DELETE CASCADE`
  * `DrugID → Medication(DrugID) ON DELETE CASCADE`

**Description:**
This table represents the `include` relationship, which establishes a many-to-many association between Medication and their Prescription.

---


