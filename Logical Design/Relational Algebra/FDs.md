### Functional Dependencies 

This document lists all functional dependencies (FDs) identified in the MNHS relational schema.
These FDs shows us how attributes depend on primary keys and foreign key within each entity.

### Functional Dependencies of MNHS shema:
### Patient:
**Relation:** Patient( IID ,CIN ,Name ,Sex ,Birth ,Blood_group ,Phone )

**FDs:**

 - IID &rarr; CIN ,Name ,Sex ,Birth ,Blood_group ,Phone

