# Deliverables

## 1. MNHS relational schema

[relational schema.md](Logical Design/relational schema.md)


## 2. Explanation of how normalization improves data quality and consistency in healthcare systems.

Normalization is a way of designing databases so that the tables are organized clearly and don’t contain unnecessary copies of the same data. In healthcare systems, where accuracy is super important, normalization helps keep the data clean and reliable. Here’s how:

1. **Less Repeated Data**: Normalization cuts down on storing the same information in multiple places. This lowers the chance of having conflicting or outdated copies of data.

2. **Better Data Integrity**: By splitting data into related tables and connecting them with foreign keys, the database can keep things consistent. If something is updated in one place, the related tables stay accurate, and you don’t end up with broken or missing references.

3. **More Consistency**: When everything is normalized, the rules of the database make sure that any change to a patient’s information shows up everywhere it needs to. This prevents things like one table having the right info while another still has the old version.

4. **Easier to Maintain**: A normalized database is easier to update and manage because you usually only need to change data in one place. This lowers the chance of making mistakes or introducing inconsistencies when the system grows or changes.



## 3. SQL scripts for DDL (table creation) and DML (insert/update/delete).

[create_tables.sql](Logical Design/sql/create_tables.sql)
[insert_data.sql](Logical Design/sql/insert_data.sql)
