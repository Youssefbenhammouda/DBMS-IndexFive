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
