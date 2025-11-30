# MNHS (Moroccan National Health Services) – Data Model Overview

This document summarizes **all tables and relationships** of the MNHS relational schema as defined in the lab DDL.

---
## 1. Core Administrative Entities

### 1.1 Hospital

**Relation**  
`Hospital(HID, Name, City, Region)`  
**Primary key:** `HID`

**Attributes**
- `HID` – integer, surrogate identifier of a hospital (PK).
- `Name` – hospital name, non-null.
- `City` – city where the hospital is located, non-null.
- `Region` – region name (text attribute).

**Main relationships**
- **Hospital–Department**: one **Hospital** has many **Departments**; each **Department** belongs to exactly one **Hospital** (via `Department.HID`).
- **Hospital–Stock**: one **Hospital** has many **Stock** rows for different medications and timestamps.

---
### 1.2 Department

**Relation**  
`Department(DEP_ID, HID, Name, Specialty)`  
**Primary key:** `DEP_ID`  
**Foreign keys:**
- `HID → Hospital(HID)`

**Attributes**
- `DEP_ID` – integer, department identifier (PK).
- `HID` – integer, owning hospital (FK).
- `Name` – department name, non-null.
- `Specialty` – medical specialty of the department.

**Main relationships**
- **Department–Hospital**: many-to-one (each department in exactly one hospital).
- **Department–ClinicalActivity**: one **Department** is linked to many **ClinicalActivity** records via `ClinicalActivity.DEP_ID`.
- **Department–Staff (Work_in)**: many-to-many via associative table **Work_in**:
  - A **Staff** member can work in several **Departments**.
  - A **Department** can have many **Staff** members.

---
### 1.3 Staff

**Relation**  
`Staff(STAFF_ID, FullName, Status)`  
**Primary key:** `STAFF_ID`

**Attributes**
- `STAFF_ID` – integer, staff identifier (PK).
- `FullName` – full name, non-null.
- `Status` – `{'Active','Retired'}`, defaults to `'Active'`.

**Main relationships**
- **Staff–ClinicalActivity**: one **Staff** member can be responsible for many **ClinicalActivity** rows (`ClinicalActivity.STAFF_ID`).
- **Staff–Department (Work_in)**: many-to-many via **Work_in** (joint appointments across departments).

---
### 1.4 Patient

**Relation**  
`Patient(IID, CIN, FullName, Birth, Sex, BloodGroup, Phone)`  
**Primary key:** `IID`  
**Candidate / additional keys:**
- `CIN` – unique patient identifier (e.g., national ID).

**Attributes**
- `IID` – integer, internal patient identifier (PK).
- `CIN` – string, national ID, unique and non-null.
- `FullName` – full name, non-null.
- `Birth` – date of birth.
- `Sex` – `{'M','F'}`, non-null.
- `BloodGroup` – one of the standard blood groups.
- `Phone` – patient phone number.

**Main relationships**
- **Patient–ClinicalActivity**: one **Patient** can have many **ClinicalActivity** entries (visits, emergencies, etc.).
- **Patient–ContactLocation (have)**: many-to-many via **have**, to support multiple contact addresses per patient and address sharing across patients.

---
### 1.5 Insurance

**Relation**  
`Insurance(InsID, Type)`  
**Primary key:** `InsID`

**Attributes**
- `InsID` – integer, insurance record identifier (PK).
- `Type` – enumeration of insurance coverage types (e.g., `CNOPS`, `CNSS`, `RAMED`, `Private`, `None`).

**Main relationships**
- **Insurance–Expense**: one insurance type/contract can be referenced in many **Expense** records (`Expense.InsID`), possibly nullable to represent self‑pay or no coverage.

---
### 1.6 Medication

**Relation**  
`Medication(MID, Name, Form, Strength, ActiveIngredient, TherapeuticClass, Manufacturer)`  
**Primary key:** `MID`

**Attributes**
- `MID` – integer, medication identifier (PK).
- `Name` – medication name, non-null.
- `Form` – pharmaceutical form (e.g., tablet, injection).
- `Strength` – strength / dosage unit description.
- `ActiveIngredient` – main active ingredient.
- `TherapeuticClass` – therapeutic class.
- `Manufacturer` – producer.

**Main relationships**
- **Medication–Includes**: many-to-many with **Prescription** via **Includes**.
- **Medication–Stock**: one **Medication** appears in many **Stock** rows, across hospitals and timestamps.

---
## 2. Clinical Activity Core & Specializations

### 2.1 ClinicalActivity

**Relation**  
`ClinicalActivity(CAID, IID, STAFF_ID, DEP_ID, Date, Time)`  
**Primary key:** `CAID`  
**Foreign keys:**
- `IID → Patient(IID)`
- `STAFF_ID → Staff(STAFF_ID)`
- `DEP_ID → Department(DEP_ID)`

**Attributes**
- `CAID` – integer, identifier of the clinical event (PK).
- `IID` – patient involved (FK).
- `STAFF_ID` – responsible staff (FK).
- `DEP_ID` – department where the activity occurs (FK).
- `Date` – date of the activity, non-null.
- `Time` – time of the activity.

**Conceptual role**
- **Central hub** for most clinical events (appointments, emergencies, expenses, prescriptions). All specialized events point back to one **ClinicalActivity** row.

### 2.2 Appointment

**Relation**  
`Appointment(CAID, Reason, Status)`  
**Primary key:** `CAID`  
**Foreign keys:**
- `CAID → ClinicalActivity(CAID)` (ON DELETE CASCADE)

**Attributes**
- `CAID` – also PK, identifies both the appointment and the underlying clinical activity.
- `Reason` – reason for visit / appointment.
- `Status` – `{'Scheduled','Completed','Cancelled'}`, default `'Scheduled'`.

**Relationship semantics**
- **ClinicalActivity–Appointment** is (conceptually) **1‑to‑0/1**:
  - A clinical activity is either an appointment or not; if it is, there is at most one **Appointment** for a given `CAID`.

### 2.3 Emergency

**Relation**  
`Emergency(CAID, TriageLevel, Outcome)`  
**Primary key:** `CAID`  
**Foreign keys:**
- `CAID → ClinicalActivity(CAID)` (ON DELETE CASCADE)

**Attributes**
- `CAID` – PK, identifies the emergency clinical activity.
- `TriageLevel` – integer, with a CHECK constraint that restricts values (e.g., 1–5).
- `Outcome` – enumeration of final outcome (`Discharged`, `Admitted`, `Transferred`, `Deceased`).

**Relationship semantics**
- **ClinicalActivity–Emergency**: also **1‑to‑0/1**; an activity may be flagged as an emergency with triage information.
- In the conceptual design, **Appointment** and **Emergency** are disjoint specializations of **ClinicalActivity** (an activity is typically either an appointment or an emergency), even though this is not fully enforced by the SQL alone.

### 2.4 Expense

**Relation**  
`Expense(ExpID, InsID, CAID, Total)`  
**Primary key:** `ExpID`  
**Foreign keys:**
- `InsID → Insurance(InsID)`
- `CAID → ClinicalActivity(CAID)` (UNIQUE + NOT NULL)

**Attributes**
- `ExpID` – integer, expense identifier (PK).
- `InsID` – optional reference to insurance coverage.
- `CAID` – clinical activity the expense is attached to; UNIQUE and NOT NULL.
- `Total` – non‑negative total amount of the expense.

**Relationship semantics**
- **ClinicalActivity–Expense**: **1‑to‑0/1** by the UNIQUE `CAID` constraint:
  - Each clinical activity has **at most one** associated **Expense** row.
- **Insurance–Expense**: **1‑to‑N**:
  - Each insurance record can be referenced by many expenses.

### 2.5 Prescription

**Relation**  
`Prescription(PID, CAID, DateIssued)`  
**Primary key:** `PID`  
**Foreign keys:**
- `CAID → ClinicalActivity(CAID)` (UNIQUE + NOT NULL)

**Attributes**
- `PID` – integer, prescription identifier (PK).
- `CAID` – clinical activity that generated the prescription; UNIQUE.
- `DateIssued` – date the prescription is issued, non-null.

**Relationship semantics**
- **ClinicalActivity–Prescription**: **1‑to‑0/1** via UNIQUE `CAID`.

---
## 3. Many‑to‑Many Clinical Relationships

### 3.1 Includes (Prescription–Medication)

**Relation**  
`Includes(PID, MID, Dosage, Duration)`  
**Primary key:** `(PID, MID)`  
**Foreign keys:**
- `PID → Prescription(PID)` (ON DELETE CASCADE)
- `MID → Medication(MID)`

**Attributes**
- `PID` – prescription ID (FK to **Prescription**).
- `MID` – medication ID (FK to **Medication**).
- `Dosage` – dosage instructions.
- `Duration` – duration instructions.

**Relationship semantics**
- **Prescription–Medication**: many‑to‑many via **Includes**:
  - One **Prescription** may include multiple **Medications**.
  - The same **Medication** can appear in many **Prescriptions**.

---
## 4. Inventory / Stock Management

### 4.1 Stock

**Relation**  
`Stock(HID, MID, StockTimestamp, UnitPrice, Qty, ReorderLevel)`  
**Primary key:** `(HID, MID, StockTimestamp)`  
**Foreign keys:**
- `HID → Hospital(HID)`
- `MID → Medication(MID)`

**Attributes**
- `HID` – hospital identifier (FK).
- `MID` – medication identifier (FK).
- `StockTimestamp` – when the stock snapshot was recorded; defaults to current timestamp.
- `UnitPrice` – non‑negative unit price.
- `Qty` – non‑negative quantity in stock, defaults to 0.
- `ReorderLevel` – non‑negative threshold for reordering, default 10.

**Relationship semantics**
- **Hospital–Medication–Stock**: **Stock** is an associative entity capturing **time‑stamped inventory**:
  - For each (`Hospital`, `Medication`) pair there may be multiple snapshots over time.
  - Supports queries such as current stock, history, low‑stock alerts, etc.

---
## 5. Staff Assignment Across Departments

### 5.1 Work_in (Staff–Department)

**Relation**  
`Work_in(STAFF_ID, DEP_ID)`  
**Primary key:** `(STAFF_ID, DEP_ID)`  
**Foreign keys:**
- `STAFF_ID → Staff(STAFF_ID)` (ON DELETE CASCADE)
- `DEP_ID → Department(DEP_ID)` (ON DELETE CASCADE)

**Attributes**
- `STAFF_ID` – staff identifier (FK).
- `DEP_ID` – department identifier (FK).

**Relationship semantics**
- **Staff–Department**: many‑to‑many via **Work_in**:
  - A single staff member can work in multiple departments.
  - A department can have many staff members assigned.

---
## 6. Contact & Address Management

### 6.1 ContactLocation

**Relation**  
`ContactLocation(CLID, City, Province, Street, Number, PostalCode, Phone_Location)`  
**Primary key:** `CLID`

**Attributes**
- `CLID` – integer, contact location identifier (PK).
- `City` – city name.
- `Province` – province/region.
- `Street` – street name.
- `Number` – building number.
- `PostalCode` – postal/ZIP code.
- `Phone_Location` – phone associated with this location.

### 6.2 have (Patient–ContactLocation)

**Relation**  
`have(IID, CLID)`  
**Primary key:** `(IID, CLID)`  
**Foreign keys:**
- `IID → Patient(IID)` (ON DELETE CASCADE)
- `CLID → ContactLocation(CLID)` (ON DELETE CASCADE)

**Attributes**
- `IID` – patient ID (FK).
- `CLID` – contact location ID (FK).

**Relationship semantics**
- **Patient–ContactLocation**: many‑to‑many via **have**:
  - A patient can have multiple contact locations (home, work, relatives, etc.).
  - A single **ContactLocation** (e.g., a family home) can be shared by multiple patients.

---
## 7. Global Relationship Summary

For quick reference, here is a list of the main foreign‑key relationships and their conceptual cardinalities:

1. **Department(HID) → Hospital(HID)**  
   - **Hospital–Department**: 1‑to‑N.

2. **ClinicalActivity(IID) → Patient(IID)**  
   - **Patient–ClinicalActivity**: 1‑to‑N.

3. **ClinicalActivity(STAFF_ID) → Staff(STAFF_ID)**  
   - **Staff–ClinicalActivity**: 1‑to‑N.

4. **ClinicalActivity(DEP_ID) → Department(DEP_ID)**  
   - **Department–ClinicalActivity**: 1‑to‑N.

5. **Appointment(CAID) → ClinicalActivity(CAID)** (PK & FK, cascade)  
   - **ClinicalActivity–Appointment**: 1‑to‑0/1.

6. **Emergency(CAID) → ClinicalActivity(CAID)** (PK & FK, cascade)  
   - **ClinicalActivity–Emergency**: 1‑to‑0/1.

7. **Expense(CAID) → ClinicalActivity(CAID)** (UNIQUE, NOT NULL)  
   - **ClinicalActivity–Expense**: 1‑to‑0/1.

8. **Expense(InsID) → Insurance(InsID)**  
   - **Insurance–Expense**: 1‑to‑N.

9. **Prescription(CAID) → ClinicalActivity(CAID)** (UNIQUE, NOT NULL)  
   - **ClinicalActivity–Prescription**: 1‑to‑0/1.

10. **Includes(PID) → Prescription(PID)**, **Includes(MID) → Medication(MID)**  
    - **Prescription–Medication**: N‑to‑M via **Includes**.

11. **Stock(HID) → Hospital(HID)**, **Stock(MID) → Medication(MID)**  
    - **Hospital–Medication**: N‑to‑M over time via **Stock** snapshots.

12. **Work_in(STAFF_ID) → Staff(STAFF_ID)**, **Work_in(DEP_ID) → Department(DEP_ID)**  
    - **Staff–Department**: N‑to‑M via **Work_in**.

13. **have(IID) → Patient(IID)**, **have(CLID) → ContactLocation(CLID)**  
    - **Patient–ContactLocation**: N‑to‑M via **have**.

---
## 8. Conceptual Picture

At a high level, the MNHS schema can be seen as:

- **Administrative backbone**: `Hospital`, `Department`, `Staff`, `Patient`, `Insurance`, `Medication`.  
- **Clinical core**: `ClinicalActivity` as the hub for all patient encounters within departments and with staff.
- **Specialized clinical events**: `Appointment`, `Emergency`, `Expense`, `Prescription` extending `ClinicalActivity` in (mostly) 1‑to‑1 fashion.
- **Associative & inventory tables**: `Includes`, `Stock`, `Work_in`, `have` modeling many‑to‑many relationships and temporal stock.
- **Addressing**: `ContactLocation` and `have` capturing rich, reusable address structures.

This document should give you a single, coherent reference for all MNHS data structures and how th