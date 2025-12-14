## Part 1: Revisiting ACID Transactions

**Objective:** Identify which ACID property is satisfied or violated in the following MNHS scenarios.

### 1. Billing Service Crash & Recovery
* **Scenario:** A billing service records an Expense, crashes before updating the Insurance claim, and upon recovery, retries until both succeed.
* **Property Satisfied:** **Atomicity** and **Durability**.
* **Justification:**
    * **Atomicity:** The system ensures the "all-or-nothing" principle. By detecting the incomplete transaction and retrying, it prevents a partial update (where an expense exists without a claim update), ensuring the entire logical unit completes.
    * **Durability:** The fact that the system could recover its state after a crash implies that the transaction's intent or partial progress was durably stored (logged) before the crash.

### 2. Concurrent Appointment Booking
* **Scenario:** Two receptionists book the last slot concurrently; both get confirmation, but only one physical slot exists.
* **Property Violated:** **Isolation** (and consequently **Consistency**).
* **Justification:**
    * **Isolation Violation:** The transactions interfered with each other. One transaction did not properly "see" the other's activity (a race condition), leading to an incorrect view of available slots.
    * **Consistency Violation:** The database rule "only one physical slot exists" was broken because the system allowed two appointments for a single slot.

### 3. Shared Prescription List
* **Scenario:** Staff B views a patient's list while Staff A is entering medications. Staff B does not see the changes until Staff A commits.
* **Property Satisfied:** **Isolation**.
* **Justification:** This demonstrates proper isolation (specifically *Read Committed*). The system prevents "Dirty Reads," ensuring that Staff B only sees data that has been fully committed and is consistent, effectively isolating them from Staff A's temporary, uncommitted work.

### 4. Power Outage After Save
* **Scenario:** An admin saves a new patient and activity. A power outage occurs before the data is flushed to disk. Upon restart, the data is missing.
* **Property Violated:** **Durability**.
* **Justification:** Durability guarantees that once a transaction is committed (user receives "Save" confirmation), the changes must survive system failures like power outages. Since the committed data was lost, this property was violated.

### 5. Pharmacy Stock Logic
* **Scenario:** Stock quantity is reduced exactly by the dispensed amount regardless of concurrency, and never goes negative.
* **Property Satisfied:** **Consistency**.
* **Justification:** The system enforces business invariants (valid totals, no negative stock) regardless of concurrent execution. It ensures the database transitions from one valid state to another valid state, preserving data integrity.

---

## Part 2: Implementing Atomic Transactions in MySQL

**Objective:** Implement "all-or-nothing" behavior using MySQL transaction controls.

### 1. Atomic Scheduling of an Appointment
**Task:** Group the creation of a `ClinicalActivity` and an `Appointment` into a single transaction.

**(a) SQL Code Fragment**

```sql
START TRANSACTION;

-- 1. Create the ClinicalActivity row
INSERT INTO ClinicalActivity (CAID, IID, STAFF_ID, DEP_ID, Date, Time)
VALUES (101, 5, 20, 2, '2025-12-15', '09:00:00');

-- 2. Create the corresponding Appointment row
INSERT INTO Appointment (CAID, Reason, Status)
VALUES (101, 'General Checkup', 'Scheduled');

-- Control Logic:
-- If both statements succeed:
COMMIT;

-- If an error occurs (e.g., foreign key failure or constraint violation):
-- ROLLBACK;