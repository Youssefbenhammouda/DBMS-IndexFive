CREATE DATABASE  IF NOT EXISTS `MNHS` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `MNHS`;
-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: MNHS
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Appointment`
--

DROP TABLE IF EXISTS `Appointment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Appointment` (
  `CAID` int NOT NULL,
  `Reason` varchar(100) DEFAULT NULL,
  `Status` enum('Scheduled','Completed','Cancelled') DEFAULT 'Scheduled',
  PRIMARY KEY (`CAID`),
  CONSTRAINT `fk_appt_caid` FOREIGN KEY (`CAID`) REFERENCES `ClinicalActivity` (`CAID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Appointment`
--

LOCK TABLES `Appointment` WRITE;
/*!40000 ALTER TABLE `Appointment` DISABLE KEYS */;
INSERT INTO `Appointment` VALUES (1001,'Routine check-up','Scheduled'),(1002,'Follow-up imaging','Completed'),(1003,'Pediatric visit','Cancelled'),(1004,'X-ray review','Scheduled'),(1005,'Triage follow-up','Completed'),(1011,'Recent visit','Cancelled'),(1012,'Recent visit','Scheduled'),(1013,'Recent visit','Completed'),(1014,'Recent visit','Cancelled'),(1015,'Recent visit','Scheduled'),(1016,'Upcoming visit #1016','Scheduled'),(1017,'Upcoming visit #1017','Scheduled'),(1018,'Upcoming visit #1018','Scheduled'),(1019,'Upcoming visit #1019','Scheduled'),(1020,'Upcoming visit #1020','Scheduled'),(1021,'Recent visit','Scheduled'),(1022,'Recent visit','Cancelled'),(1023,'Recent visit','Completed'),(1024,'Recent visit','Scheduled'),(1025,'Recent visit','Cancelled'),(1026,'Same-day (control)','Scheduled'),(1027,'Same-day (control)','Scheduled'),(1028,'Same-day (control)','Scheduled'),(1029,'Consultation for AYMAN BENHAMMOUDA','Completed');
/*!40000 ALTER TABLE `Appointment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ClinicalActivity`
--

DROP TABLE IF EXISTS `ClinicalActivity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ClinicalActivity` (
  `CAID` int NOT NULL AUTO_INCREMENT,
  `IID` int NOT NULL,
  `STAFF_ID` int NOT NULL,
  `DEP_ID` int NOT NULL,
  `Date` date NOT NULL,
  `Time` time DEFAULT NULL,
  PRIMARY KEY (`CAID`),
  KEY `fk_ca_patient` (`IID`),
  KEY `fk_ca_staff` (`STAFF_ID`),
  KEY `fk_ca_department` (`DEP_ID`),
  CONSTRAINT `fk_ca_department` FOREIGN KEY (`DEP_ID`) REFERENCES `Department` (`DEP_ID`),
  CONSTRAINT `fk_ca_patient` FOREIGN KEY (`IID`) REFERENCES `Patient` (`IID`),
  CONSTRAINT `fk_ca_staff` FOREIGN KEY (`STAFF_ID`) REFERENCES `Staff` (`STAFF_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=1030 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ClinicalActivity`
--

LOCK TABLES `ClinicalActivity` WRITE;
/*!40000 ALTER TABLE `ClinicalActivity` DISABLE KEYS */;
INSERT INTO `ClinicalActivity` VALUES (1001,1,501,10,'2025-10-10','10:00:00'),(1002,2,502,10,'2025-10-12','11:00:00'),(1003,3,503,11,'2025-10-15','09:30:00'),(1004,4,504,20,'2025-10-20','14:00:00'),(1005,5,505,40,'2025-10-22','16:15:00'),(1011,1,505,40,'2025-10-25','01:10:00'),(1012,2,501,40,'2025-10-26','02:25:00'),(1013,3,502,40,'2025-10-27','03:05:00'),(1014,4,503,40,'2025-10-28','05:40:00'),(1015,5,504,40,'2025-10-29','06:55:00'),(1016,1,502,11,'2025-11-21','09:00:00'),(1017,2,501,10,'2025-11-22','10:00:00'),(1018,3,502,11,'2025-11-23','11:00:00'),(1019,4,501,10,'2025-11-24','12:00:00'),(1020,5,502,11,'2025-11-25','13:00:00'),(1021,1,502,11,'2025-11-17','11:30:00'),(1022,2,501,10,'2025-11-16','12:30:00'),(1023,3,502,11,'2025-11-15','13:30:00'),(1024,4,501,10,'2025-11-14','14:30:00'),(1025,5,502,11,'2025-11-13','15:30:00'),(1026,1,501,10,'2025-11-19','13:00:00'),(1027,2,501,10,'2025-11-19','13:00:00'),(1028,3,501,10,'2025-11-19','13:00:00'),(1029,4554,505,40,'2025-11-29','09:00:00');
/*!40000 ALTER TABLE `ClinicalActivity` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ContactLocation`
--

DROP TABLE IF EXISTS `ContactLocation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ContactLocation` (
  `CLID` int NOT NULL AUTO_INCREMENT,
  `City` varchar(50) DEFAULT NULL,
  `Province` varchar(50) DEFAULT NULL,
  `Street` varchar(100) DEFAULT NULL,
  `Number` varchar(10) DEFAULT NULL,
  `PostalCode` varchar(10) DEFAULT NULL,
  `Phone_Location` varchar(15) DEFAULT NULL,
  PRIMARY KEY (`CLID`)
) ENGINE=InnoDB AUTO_INCREMENT=208 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ContactLocation`
--

LOCK TABLES `ContactLocation` WRITE;
/*!40000 ALTER TABLE `ContactLocation` DISABLE KEYS */;
INSERT INTO `ContactLocation` VALUES (201,'Benguerir','Rehamna','Avenue Mohammed VI','12','43150','0523000001'),(202,'Casablanca','Anfa','Bd Zerktouni','77','20000','0522000002'),(203,'Rabat','Agdal','Rue Oued Ziz','5','10000','0537000003'),(204,'Marrakech','Gueliz','Rue de la Liberté','9','40000','0524000004'),(205,'Agadir','Cité Dakhla','Rue Al Atlas','3','80000','0528000005'),(206,'casablanca',NULL,NULL,NULL,NULL,NULL),(207,'Romainville',NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `ContactLocation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Department`
--

DROP TABLE IF EXISTS `Department`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Department` (
  `DEP_ID` int NOT NULL AUTO_INCREMENT,
  `HID` int NOT NULL,
  `Name` varchar(100) NOT NULL,
  `Specialty` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`DEP_ID`),
  KEY `fk_department_hospital` (`HID`),
  CONSTRAINT `fk_department_hospital` FOREIGN KEY (`HID`) REFERENCES `Hospital` (`HID`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Department`
--

LOCK TABLES `Department` WRITE;
/*!40000 ALTER TABLE `Department` DISABLE KEYS */;
INSERT INTO `Department` VALUES (10,1,'Cardiology','Heart Care'),(11,1,'Pediatrics','Child Care'),(20,2,'Radiology','Imaging'),(30,3,'Oncology','Cancer Care'),(40,4,'Emergency','Acute Care'),(50,5,'Internal Medicine','General');
/*!40000 ALTER TABLE `Department` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `DrugPricingSummary`
--

DROP TABLE IF EXISTS `DrugPricingSummary`;
/*!50001 DROP VIEW IF EXISTS `DrugPricingSummary`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `DrugPricingSummary` AS SELECT 
 1 AS `HID`,
 1 AS `HospitalName`,
 1 AS `MID`,
 1 AS `MedicationName`,
 1 AS `AvgUnitPrice`,
 1 AS `MinUnitPrice`,
 1 AS `MaxUnitPrice`,
 1 AS `LastStockTimestamp`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `Emergency`
--

DROP TABLE IF EXISTS `Emergency`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Emergency` (
  `CAID` int NOT NULL,
  `TriageLevel` int DEFAULT NULL,
  `Outcome` enum('Discharged','Admitted','Transferred','Deceased') DEFAULT NULL,
  PRIMARY KEY (`CAID`),
  CONSTRAINT `fk_er_caid` FOREIGN KEY (`CAID`) REFERENCES `ClinicalActivity` (`CAID`) ON DELETE CASCADE,
  CONSTRAINT `Emergency_chk_1` CHECK ((`TriageLevel` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Emergency`
--

LOCK TABLES `Emergency` WRITE;
/*!40000 ALTER TABLE `Emergency` DISABLE KEYS */;
INSERT INTO `Emergency` VALUES (1011,3,'Admitted'),(1012,2,'Discharged'),(1013,4,'Transferred'),(1014,5,'Admitted'),(1015,1,'Discharged');
/*!40000 ALTER TABLE `Emergency` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Expense`
--

DROP TABLE IF EXISTS `Expense`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Expense` (
  `ExpID` int NOT NULL AUTO_INCREMENT,
  `InsID` int DEFAULT NULL,
  `CAID` int NOT NULL,
  `Total` decimal(10,2) NOT NULL,
  PRIMARY KEY (`ExpID`),
  UNIQUE KEY `CAID` (`CAID`),
  KEY `fk_exp_ins` (`InsID`),
  CONSTRAINT `fk_exp_caid` FOREIGN KEY (`CAID`) REFERENCES `ClinicalActivity` (`CAID`),
  CONSTRAINT `fk_exp_ins` FOREIGN KEY (`InsID`) REFERENCES `Insurance` (`InsID`),
  CONSTRAINT `Expense_chk_1` CHECK ((`Total` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=9011 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Expense`
--

LOCK TABLES `Expense` WRITE;
/*!40000 ALTER TABLE `Expense` DISABLE KEYS */;
INSERT INTO `Expense` VALUES (9001,100,1001,250.00),(9002,101,1002,400.00),(9003,103,1011,1200.00),(9004,104,1012,80.00),(9005,102,1004,150.00),(9006,101,1016,100.00),(9007,103,1028,100.00),(9008,NULL,1003,100.00),(9009,NULL,1026,100.00),(9010,100,1018,1000.00);
/*!40000 ALTER TABLE `Expense` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Hospital`
--

DROP TABLE IF EXISTS `Hospital`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Hospital` (
  `HID` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) NOT NULL,
  `City` varchar(50) NOT NULL,
  `Region` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`HID`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Hospital`
--

LOCK TABLES `Hospital` WRITE;
/*!40000 ALTER TABLE `Hospital` DISABLE KEYS */;
INSERT INTO `Hospital` VALUES (1,'Benguerir Central Hospital','Benguerir','Marrakech-Safi'),(2,'Casablanca University Hospital','Casablanca','Grand Casablanca'),(3,'Rabat Clinical Center','Rabat','Rabat-Salé-Kenitra'),(4,'Marrakech Regional Hospital','Marrakech','Marrakech-Safi'),(5,'Agadir City Hospital','Agadir','Souss-Massa');
/*!40000 ALTER TABLE `Hospital` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Includes`
--

DROP TABLE IF EXISTS `Includes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Includes` (
  `PID` int NOT NULL,
  `MID` int NOT NULL,
  `Dosage` varchar(100) DEFAULT NULL,
  `Duration` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`PID`,`MID`),
  KEY `fk_inc_med` (`MID`),
  CONSTRAINT `fk_inc_med` FOREIGN KEY (`MID`) REFERENCES `Medication` (`MID`),
  CONSTRAINT `fk_inc_rx` FOREIGN KEY (`PID`) REFERENCES `Prescription` (`PID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Includes`
--

LOCK TABLES `Includes` WRITE;
/*!40000 ALTER TABLE `Includes` DISABLE KEYS */;
INSERT INTO `Includes` VALUES (8001,1001,'1 tab BID','5 days'),(8001,1002,'1 tab PRN','3 days'),(8002,1003,'1 tab OD','3 days'),(8003,1004,'10 ml Q6H','2 days'),(8004,1005,'1 g IV','1 day'),(8005,1002,'1 tab TID','4 days');
/*!40000 ALTER TABLE `Includes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Insurance`
--

DROP TABLE IF EXISTS `Insurance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Insurance` (
  `InsID` int NOT NULL AUTO_INCREMENT,
  `Type` enum('CNOPS','CNSS','RAMED','Private','None') NOT NULL,
  PRIMARY KEY (`InsID`)
) ENGINE=InnoDB AUTO_INCREMENT=105 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Insurance`
--

LOCK TABLES `Insurance` WRITE;
/*!40000 ALTER TABLE `Insurance` DISABLE KEYS */;
INSERT INTO `Insurance` VALUES (100,'CNOPS'),(101,'CNSS'),(102,'RAMED'),(103,'Private'),(104,'None');
/*!40000 ALTER TABLE `Insurance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Medication`
--

DROP TABLE IF EXISTS `Medication`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Medication` (
  `MID` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) NOT NULL,
  `Form` varchar(50) DEFAULT NULL,
  `Strength` varchar(50) DEFAULT NULL,
  `ActiveIngredient` varchar(100) DEFAULT NULL,
  `TherapeuticClass` varchar(100) DEFAULT NULL,
  `Manufacturer` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`MID`)
) ENGINE=InnoDB AUTO_INCREMENT=1006 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Medication`
--

LOCK TABLES `Medication` WRITE;
/*!40000 ALTER TABLE `Medication` DISABLE KEYS */;
INSERT INTO `Medication` VALUES (500,'Aximcine','boxes','','','antibiotic',''),(1001,'Amoxicillin','Tablet','500mg','Amoxicillin','Antibiotic','PharmaMA'),(1002,'Ibuprofen','Tablet','400mg','Ibuprofen','Analgesic','MediCare'),(1003,'Azithromycin','Tablet','250mg','Azithromycin','Antibiotic','HealthCo'),(1004,'Paracetamol','Syrup','120mg/5ml','Acetaminophen','Analgesic','MediCare'),(1005,'Ceftriaxone','Injection','1g','Ceftriaxone','Antibiotic','PharmaMA');
/*!40000 ALTER TABLE `Medication` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Patient`
--

DROP TABLE IF EXISTS `Patient`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Patient` (
  `IID` int NOT NULL AUTO_INCREMENT,
  `CIN` varchar(10) NOT NULL,
  `FullName` varchar(100) NOT NULL,
  `Birth` date DEFAULT NULL,
  `Sex` enum('M','F') NOT NULL,
  `BloodGroup` enum('A+','A-','B+','B-','O+','O-','AB+','AB-') DEFAULT NULL,
  `Phone` varchar(15) DEFAULT NULL,
  `Email` varchar(160) DEFAULT NULL,
  PRIMARY KEY (`IID`),
  UNIQUE KEY `CIN` (`CIN`)
) ENGINE=InnoDB AUTO_INCREMENT=98688 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Patient`
--

LOCK TABLES `Patient` WRITE;
/*!40000 ALTER TABLE `Patient` DISABLE KEYS */;
INSERT INTO `Patient` VALUES (1,'CIN001','Sara El Amrani','1999-04-10','F','A+','0611111111',NULL),(2,'CIN002','Youssef Benali','1988-09-22','M','O-','0678912345',NULL),(3,'CIN003','Hajar Berrada','1995-01-18','F','B+','0600112233',NULL),(4,'CIN004','Ayoub El Khattabi','1992-07-06','M','AB-','0600223344',NULL),(5,'CIN005','Imane Othmani','2001-03-30','F','O+','0600334455',NULL),(232,'BK454','Youssef Benhammouda','2005-12-01','M',NULL,'+212676169376','youssef@benhammouda.ma'),(243,'TESTCID','Fatima Korchi','2009-02-03','M',NULL,'+33771850514','youssef@benhammouda.ma'),(2323,'CG4545','hamza ben','2025-09-19','M',NULL,'+212676169376','hamza@benhammouda.ma'),(4554,'CVDFV','AYMAN BENHAMMOUDA','2004-12-01','M',NULL,'+212676169376','hh@gmail.com'),(98687,'MNB876','sksjf','2025-11-17','M','AB+','+33771850514',NULL);
/*!40000 ALTER TABLE `Patient` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Prescription`
--

DROP TABLE IF EXISTS `Prescription`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Prescription` (
  `PID` int NOT NULL AUTO_INCREMENT,
  `CAID` int NOT NULL,
  `DateIssued` date NOT NULL,
  PRIMARY KEY (`PID`),
  UNIQUE KEY `CAID` (`CAID`),
  CONSTRAINT `fk_rx_caid` FOREIGN KEY (`CAID`) REFERENCES `ClinicalActivity` (`CAID`)
) ENGINE=InnoDB AUTO_INCREMENT=8006 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Prescription`
--

LOCK TABLES `Prescription` WRITE;
/*!40000 ALTER TABLE `Prescription` DISABLE KEYS */;
INSERT INTO `Prescription` VALUES (8001,1001,'2025-10-10'),(8002,1002,'2025-10-12'),(8003,1004,'2025-10-20'),(8004,1011,'2025-10-25'),(8005,1013,'2025-10-27');
/*!40000 ALTER TABLE `Prescription` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Staff`
--

DROP TABLE IF EXISTS `Staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Staff` (
  `STAFF_ID` int NOT NULL AUTO_INCREMENT,
  `FullName` varchar(100) NOT NULL,
  `Status` enum('Active','Retired') DEFAULT 'Active',
  PRIMARY KEY (`STAFF_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=506 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Staff`
--

LOCK TABLES `Staff` WRITE;
/*!40000 ALTER TABLE `Staff` DISABLE KEYS */;
INSERT INTO `Staff` VALUES (232,'test staff 1','Retired'),(501,'Dr. Amina Idrissi','Active'),(502,'Dr. Mehdi Touil','Active'),(503,'Nurse Firdawse Guerbouzi','Active'),(504,'Technician Omar Lahlou','Active'),(505,'Dr. Khaoula Messari','Active');
/*!40000 ALTER TABLE `Staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Stock`
--

DROP TABLE IF EXISTS `Stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Stock` (
  `HID` int NOT NULL,
  `MID` int NOT NULL,
  `StockTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UnitPrice` decimal(10,2) DEFAULT NULL,
  `Qty` int DEFAULT '0',
  `ReorderLevel` int DEFAULT '10',
  PRIMARY KEY (`HID`,`MID`,`StockTimestamp`),
  KEY `fk_stock_med` (`MID`),
  CONSTRAINT `fk_stock_hospital` FOREIGN KEY (`HID`) REFERENCES `Hospital` (`HID`),
  CONSTRAINT `fk_stock_med` FOREIGN KEY (`MID`) REFERENCES `Medication` (`MID`),
  CONSTRAINT `Stock_chk_1` CHECK ((`UnitPrice` >= 0)),
  CONSTRAINT `Stock_chk_2` CHECK ((`Qty` >= 0)),
  CONSTRAINT `Stock_chk_3` CHECK ((`ReorderLevel` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Stock`
--

LOCK TABLES `Stock` WRITE;
/*!40000 ALTER TABLE `Stock` DISABLE KEYS */;
INSERT INTO `Stock` VALUES (1,500,'2025-11-29 22:34:54',0.00,1,50),(1,500,'2025-11-29 22:35:11',10.00,51,50),(1,1001,'2025-10-10 08:00:00',22.00,120,20),(1,1001,'2025-10-25 09:00:00',9.50,120,10),(1,1001,'2025-11-01 09:00:00',11.00,90,12),(1,1001,'2025-11-05 09:00:00',10.75,100,10),(1,1001,'2025-11-15 09:00:00',12.00,70,12),(1,1001,'2025-11-18 09:00:00',NULL,80,10),(1,1002,'2025-10-10 08:00:00',6.50,300,50),(1,1002,'2025-10-28 09:00:00',15.00,60,8),(1,1002,'2025-11-03 09:00:00',13.40,110,9),(1,1002,'2025-11-12 09:00:00',14.25,50,8),(1,1002,'2025-11-17 09:00:00',12.90,100,9),(2,1003,'2025-10-12 08:00:00',35.00,80,15),(3,1004,'2025-10-15 08:00:00',4.00,500,60),(4,1005,'2025-10-20 08:00:00',120.00,40,10);
/*!40000 ALTER TABLE `Stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `UpcomingByHospital`
--

DROP TABLE IF EXISTS `UpcomingByHospital`;
/*!50001 DROP VIEW IF EXISTS `UpcomingByHospital`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `UpcomingByHospital` AS SELECT 
 1 AS `HospitalName`,
 1 AS `ApptDate`,
 1 AS `count(C.``CAID``)`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `Work_in`
--

DROP TABLE IF EXISTS `Work_in`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Work_in` (
  `STAFF_ID` int NOT NULL,
  `DEP_ID` int NOT NULL,
  PRIMARY KEY (`STAFF_ID`,`DEP_ID`),
  KEY `fk_workin_department` (`DEP_ID`),
  CONSTRAINT `fk_workin_department` FOREIGN KEY (`DEP_ID`) REFERENCES `Department` (`DEP_ID`) ON DELETE CASCADE,
  CONSTRAINT `fk_workin_staff` FOREIGN KEY (`STAFF_ID`) REFERENCES `Staff` (`STAFF_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Work_in`
--

LOCK TABLES `Work_in` WRITE;
/*!40000 ALTER TABLE `Work_in` DISABLE KEYS */;
INSERT INTO `Work_in` VALUES (501,10),(502,10),(503,11),(504,20),(501,30),(505,40);
/*!40000 ALTER TABLE `Work_in` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `have`
--

DROP TABLE IF EXISTS `have`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `have` (
  `IID` int NOT NULL,
  `CLID` int NOT NULL,
  PRIMARY KEY (`IID`,`CLID`),
  KEY `fk_have_contact` (`CLID`),
  CONSTRAINT `fk_have_contact` FOREIGN KEY (`CLID`) REFERENCES `ContactLocation` (`CLID`) ON DELETE CASCADE,
  CONSTRAINT `fk_have_patient` FOREIGN KEY (`IID`) REFERENCES `Patient` (`IID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `have`
--

LOCK TABLES `have` WRITE;
/*!40000 ALTER TABLE `have` DISABLE KEYS */;
INSERT INTO `have` VALUES (1,201),(1,202),(2,202),(3,203),(4,204),(5,205),(232,206),(98687,207);
/*!40000 ALTER TABLE `have` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'MNHS'
--
/*!50003 DROP FUNCTION IF EXISTS `calculate_expense` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` FUNCTION `calculate_expense`(CAID INT) RETURNS decimal(10,2)
    READS SQL DATA
BEGIN
	DECLARE null_cnt int default 0;
    DECLARE sum_prices int default 0;
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
WHERE X.rn_m=1 and UnitPrice=null;

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
            C.`CAID` = @`CAID`
    ) X
WHERE X.rn_m=1 ;

return sum_prices;
        


END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Final view structure for view `DrugPricingSummary`
--

/*!50001 DROP VIEW IF EXISTS `DrugPricingSummary`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `DrugPricingSummary` AS select `S`.`HID` AS `HID`,`H`.`Name` AS `HospitalName`,`S`.`MID` AS `MID`,`M`.`Name` AS `MedicationName`,avg(`S`.`UnitPrice`) AS `AvgUnitPrice`,min(`S`.`UnitPrice`) AS `MinUnitPrice`,max(`S`.`UnitPrice`) AS `MaxUnitPrice`,max(`S`.`StockTimestamp`) AS `LastStockTimestamp` from ((`Stock` `S` join `Hospital` `H` on((`H`.`HID` = `S`.`HID`))) join `Medication` `M` on((`S`.`MID` = `M`.`MID`))) group by `S`.`HID`,`H`.`Name`,`S`.`MID`,`M`.`Name` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `UpcomingByHospital`
--

/*!50001 DROP VIEW IF EXISTS `UpcomingByHospital`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `UpcomingByHospital` AS select `H`.`Name` AS `HospitalName`,`C`.`Date` AS `ApptDate`,count(`C`.`CAID`) AS `count(C.``CAID``)` from (((`Appointment` `A` join `ClinicalActivity` `C` on((`C`.`CAID` = `A`.`CAID`))) join `Department` `D` on((`D`.`DEP_ID` = `C`.`DEP_ID`))) join `Hospital` `H` on((`H`.`HID` = `D`.`HID`))) where ((`A`.`Status` = 'Scheduled') and (`C`.`Date` between curdate() and (curdate() + interval 14 day))) group by `H`.`HID`,`C`.`Date` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-30 23:48:55
