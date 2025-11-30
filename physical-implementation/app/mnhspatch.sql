-- Target schema holding the MNHS tables
SET @target_schema = 'MNHS';
SET @old_fk_checks = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

DROP TEMPORARY TABLE IF EXISTS auto_increment_targets;
CREATE TEMPORARY TABLE auto_increment_targets (
    table_name  VARCHAR(64) PRIMARY KEY,
    column_name VARCHAR(64) NOT NULL
);

INSERT INTO auto_increment_targets (table_name, column_name) VALUES
    ('Hospital',         'HID'),
    ('Department',       'DEP_ID'),
    ('Staff',            'STAFF_ID'),
    ('Patient',          'IID'),
    ('Insurance',        'InsID'),
    ('Medication',       'MID'),
    ('ClinicalActivity', 'CAID'),
    ('Expense',          'ExpID'),
    ('Prescription',     'PID'),
    ('ContactLocation',  'CLID');

DELIMITER $$
DROP PROCEDURE IF EXISTS ensure_auto_increment$$
CREATE PROCEDURE ensure_auto_increment()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_table VARCHAR(64);
    DECLARE v_column VARCHAR(64);
    DECLARE v_column_type VARCHAR(255);

    DECLARE cur CURSOR FOR
        SELECT t.table_name, t.column_name, c.COLUMN_TYPE
        FROM auto_increment_targets t
        JOIN information_schema.COLUMNS c
          ON c.TABLE_SCHEMA = @target_schema
         AND c.TABLE_NAME   = t.table_name
         AND c.COLUMN_NAME  = t.column_name
        WHERE c.EXTRA NOT LIKE '%auto_increment%'
          AND c.DATA_TYPE IN ('tinyint','smallint','mediumint','int','bigint');

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO v_table, v_column, v_column_type;
        IF done THEN
            LEAVE read_loop;
        END IF;

        SET @ddl = CONCAT(
            'ALTER TABLE `', @target_schema, '`.`', v_table, '` ',
            'MODIFY COLUMN `', v_column, '` ', v_column_type,
            ' NOT NULL AUTO_INCREMENT'
        );

        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END LOOP;
    CLOSE cur;
END$$

DELIMITER ;

CALL ensure_auto_increment();
DROP PROCEDURE ensure_auto_increment;
DROP TEMPORARY TABLE auto_increment_targets;
SET FOREIGN_KEY_CHECKS = @old_fk_checks;