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


### **Entity: `Contact Location`**

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
This table represents the `Contact Location` entity, which stores detailed address and contact information, including: city, province, street, number, postal code and phone number, uniquely identified by the `CLID` primary key.


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


### **Entity: `Department`**

**Attributes:**

* **Primary Key:** `DEP_ID`
* **Other Attributes:**

  * `DEP_ID (INT, NOT NULL, AUTO_INCREMENT,PRIMARY KEY)`
  * `Name (VARCHAR(100), NOT NULL)`
  * `Specialty (VARCHAR(100), NOT NULL)`

**Description:**
This table represents the `Department` entity, which captures informations about the different departments within the hospital, including: Name and Specialty,uniquely identified by the `DEP_ID` primary key.
