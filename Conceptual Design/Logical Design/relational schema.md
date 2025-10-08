# Relational Schema
### **Entity: `Patient`**

**Attributes:**

* **Primary Key:** `IID`
* **Other Attributes:**

  * `IID (INT, NOT NULL, AUTO_INCREMENT)`
  * `CIN (VARCHAR(100), NOT NULL)`
  * `Name (VARCHAR(100), NOT NULL)`
  * `Sex (VARCHAR(500), NOT NULL)`
  * `Birth (DATE, NOT NULL)`
  * `Blood group (VARCHAR(10), NOT NULL)`
  * `Phone (VARCHAR(20))`

**Description:**
This table represents the `Patient` entity, which stores essential informations about individuals receiving medical care within MNHS system, including CIN, Name, Sex, Birth, Blood group and phone number, uniquely identified by the `IID` primary key.
### **Entity: `Contact Location`**

**Attributes:**

* **Primary Key:** `CLID`
* **Other Attributes:**

  * `CLID (INT, NOT NULL, AUTO_INCREMENT)`
  * `city (VARCHAR(100), NOT NULL)`
  * `province (VARCHAR(100), NOT NULL)`
  * `Street (VARCHAR(500), NOT NULL)`
  * `number (VARCHAR(10), NOT NULL)`
  * `postal_code (VARCHAR(10), NOT NULL)`
  * `Phone (VARCHAR(20))`

**Description:**
This table represents the `Contact Location` entity, which stores detailed address and contact information, including city, province, street, number, postal code, and phone number, uniquely identified by the `CLID` primary key.
