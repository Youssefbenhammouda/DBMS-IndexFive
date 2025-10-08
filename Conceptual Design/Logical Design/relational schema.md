# Relational Schema

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
  * `phone (VARCHAR(20))`

**Description:**
This table represents the `Contact Location` entity, which stores detailed address and contact information, including city, province, street, number, postal code, and phone number, uniquely identified by the `CLID` primary key.
