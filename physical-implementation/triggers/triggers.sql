DELIMITER $$
-- 1. Reject double booking for a staff member


CREATE TRIGGER trg_no_double_booking_before_insert
BEFORE INSERT ON Appointment
FOR EACH ROW

BEGIN
    IF EXISTS (    SELECT 1 FROM `ClinicalActivity` C
    JOIN `Appointment` A ON A.`CAID` = C.`CAID`
    JOIN `ClinicalActivity` C2
    ON C2.`CAID`=NEW.CAID 
    AND C2.`STAFF_ID`=C.`STAFF_ID` 
    AND C.`Time` = C2.`Time` 
    AND C.`Date`=C2.`Date`
    AND C.`CAID` <> C2.`CAID`)
    THEN
    SET @errorMsg = CONCAT('Double booking for CAID: ', NEW.CAID);
    SIGNAL SQLSTATE '45000'
		
        SET MESSAGE_TEXT = @errorMsg;
    END IF;
END $$

CREATE TRIGGER trg_no_double_booking_before_update
BEFORE UPDATE ON Appointment
FOR EACH ROW

BEGIN
    IF EXISTS (    SELECT 1 FROM `ClinicalActivity` C
    JOIN `Appointment` A ON A.`CAID` = C.`CAID`
    JOIN `ClinicalActivity` C2
    ON C2.`CAID`=NEW.CAID 
    AND C2.`STAFF_ID`=C.`STAFF_ID` 
    AND C.`Time` = C2.`Time` 
    AND C.`Date`=C2.`Date`
    AND C.`CAID` <> C2.`CAID`)
    THEN
    SET @errorMsg = CONCAT('Double booking for CAID: ', NEW.CAID);
    SIGNAL SQLSTATE '45000'
		
        SET MESSAGE_TEXT = @errorMsg;
    END IF;
END $$


-- 2. Recompute Expense.Total when prescription lines change.

DROP FUNCTION IF EXISTS calculate_expense $$
CREATE FUNCTION calculate_expense(CAID INT) RETURNS DECIMAL(10,2) READS SQL DATA
BEGIN
	DECLARE null_cnt int default 0;
    DECLARE sum_prices DECIMAL(10,2) default 0;
    SELECT count(*) INTO null_cnt
FROM (
        SELECT S.*, ROW_NUMBER() OVER (
                PARTITION BY
                    S.`MID`
                ORDER BY S.`StockTimestamp` DESC
            ) as rn_m
        from
            `ClinicalActivity` C
            JOIN `Prescription` P ON P.`CAID` = C.`CAID`
            JOIN `Includes` I ON I.`PID` = P.`PID`
            JOIN `Department` D ON D.`DEP_ID` = C.`DEP_ID`
            JOIN `Hospital` H ON H.`HID` = D.`HID`
            LEFT JOIN `Stock` S ON (
                S.`MID` = I.`MID`
                AND S.`HID` = H.`HID`
            )
        WHERE
            C.`CAID` = CAID
    ) X
WHERE X.rn_m=1 and UnitPrice IS null;

	IF null_cnt > 0
    THEN
    SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Missing unit price.';
    END IF;
    
    SELECT SUM(`UnitPrice`) INTO sum_prices
FROM (
        SELECT S.*, ROW_NUMBER() OVER (
                PARTITION BY
                    S.`MID`
                ORDER BY S.`StockTimestamp` DESC
            ) as rn_m
        from
            `ClinicalActivity` C
            JOIN `Prescription` P ON P.`CAID` = C.`CAID`
            JOIN `Includes` I ON I.`PID` = P.`PID`
            JOIN `Department` D ON D.`DEP_ID` = C.`DEP_ID`
            JOIN `Hospital` H ON H.`HID` = D.`HID`
            LEFT JOIN `Stock` S ON (
                S.`MID` = I.`MID`
                AND S.`HID` = H.`HID`
            )
        WHERE
            C.`CAID` = CAID
    ) X
WHERE X.rn_m=1 ;

return sum_prices;
        


END $$


DROP TRIGGER IF EXISTS trg_iclude_after_update $$
CREATE  TRIGGER trg_iclude_after_update
AFTER UPDATE ON Includes
FOR EACH ROW
BEGIN 
	declare new_total decimal(10,2);
    declare caid int;
    declare expid int;
    SELECT P.`CAID` INTO caid   FROM `Prescription` P WHERE P.`PID`=NEW.PID;
    SELECT E.`ExpID` into expid from `Expense` E WHERE E.`CAID`=caid;
    SET new_total = calculate_expense( caid);
    UPDATE `Expense` SET `Total`=new_total WHERE `ExpID`=expid;
END $$

	
-- 3.Prevent negative or inconsistent stock.

	

CREATE TRIGGER trg_stock_before_insert
AFTER INSERT ON Stock
FOR EACH ROW
	
BEGIN 
	
   IF NEW.Qty<0 THEN
	  SIGNAL SQLSTATE '45000'
	  SET MESSAGE_TEXT='Qty cannot be negative';
   END IF;

   IF NEW.UnitPrice<=0 THEN
	  SIGNAL SQLSTATE '45000'
	  SET MESSAGE_TEXT='UnitPrice must be > 0 ';
   END IF;

   IF NEW.ReorderLevel<0 THEN
	  SIGNAL SQLSTATE '45000'
	  SET MESSAGE_TEXT='ReorderLevel cannot be negative';
   END IF;

END $$



	
CREATE TRIGGER trg_stock_before_update
AFTER UPDATE ON Stock
FOR EACH ROW
	
BEGIN 
	
	IF NEW.Qty<0 THEN
	  SIGNAL SQLSTATE '45000'
	  SET MESSAGE_TEXT='Qty cannot be negative';
   END IF;

   IF NEW.UnitPrice<=0 THEN
	  SIGNAL SQLSTATE '45000'
	  SET MESSAGE_TEXT='UnitPrice must be > 0 ';
   END IF;

   IF NEW.ReorderLevel<0 THEN
	  SIGNAL SQLSTATE '45000'
	  SET MESSAGE_TEXT='ReorderLevel cannot be negative';
   END IF;

END $$

DELIMITER ;
