-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 12, 2025 at 07:59 AM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hok-library`
--
CREATE DATABASE IF NOT EXISTS `hok-library` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `hok-library`;
-- --------------------------------------------------------
-- Table structure for table `attendance`
-- --------------------------------------------------------

CREATE TABLE `attendance` (
  `attendance_id` INT AUTO_INCREMENT PRIMARY KEY,
  `member_id` VARCHAR(10) NOT NULL,
  `tap_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`member_id`) REFERENCES `members`(`member_id`)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

-- --------------------------------------------------------
--
-- Table structure for table `members`
--
CREATE TABLE `members` (
  `member_id` varchar(10) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `student_id` varchar(20) NOT NULL, -- e.g. university-issued student number
  `nfc_uid` varchar(20) DEFAULT NULL, -- ✅ NFC card UID for login
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `password_hash` varchar(255) NOT NULL,
  `date_registered` date DEFAULT curdate(),
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
-- --------------------------------------------------------
-- Trigger for table `members`
-- --------------------------------------------------------

DELIMITER $$
CREATE TRIGGER `before_insert_members`
BEFORE INSERT ON `members`
FOR EACH ROW
BEGIN
    DECLARE random_digits CHAR(6);
    SET random_digits = LPAD(FLOOR(RAND() * 1000000), 6, '0');
    SET NEW.member_id = CONCAT('M', YEAR(CURDATE()), random_digits);
END
$$
DELIMITER ;
-- --------------------------------------------------------
-- Indexes for table `members`
-- --------------------------------------------------------

ALTER TABLE `members`
  ADD PRIMARY KEY (`member_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `student_id` (`student_id`),
  ADD UNIQUE KEY `nfc_uid` (`nfc_uid`); -- ✅ Each card tied to one student
--
-- Table structure for table `login_history`
--

DROP TABLE IF EXISTS `login_history`;

CREATE TABLE `login_history` (
  `history_id` VARCHAR(36) NOT NULL,
  `user_type` ENUM('staff', 'member') NOT NULL,
  `staff_id` VARCHAR(36) DEFAULT NULL,
  `member_id` VARCHAR(36) DEFAULT NULL,
  `login_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`history_id`),
  CONSTRAINT `fk_login_staff`
    FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_login_member`
    FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- --------------------------------------------------------

--
-- Table structure for table `staff`
--

CREATE TABLE `staff` (
  `staff_id` varchar(10) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `role` enum('Librarian','Assistant','Manager','Admin') NOT NULL DEFAULT 'Librarian',
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `nfc_uid` varchar(20) DEFAULT NULL, -- ✅ NFC card UID column
  `date_hired` date DEFAULT curdate(),
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `staff`
--

INSERT INTO `staff` (`staff_id`, `first_name`, `last_name`, `email`, `phone_number`, `role`, `username`, `password_hash`, `status`, `date_hired`, `last_login`, `created_at`, `updated_at`) VALUES
('2025000144', 'Martin', 'Coloma', 'martin@gmail.com', NULL, 'Librarian', 'morphy', '$2b$10$gSmOL.qaqp3zRbQGI3Kv8edxjniIE.f/JLus2GLdSC6PV6rh5lewu', 'Active', '2025-08-05', '2025-08-12 02:26:54', '2025-08-05 12:55:55', '2025-08-12 02:26:54'),
('2025145279', 'John', 'Doe', 'johndoe@hok.com', NULL, 'Librarian', 'johndoe', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Active', '2025-08-05', NULL, '2025-08-05 12:29:59', '2025-08-05 12:30:18'),
('2025185866', 'Karl', 'Iligan', 'karl@hok.com', '09123123123', 'Admin', 'karl', '$2b$10$KOgdaw6KrkVnlAbmKFyEROwZkO4JO5ZJ0EYQafRhCCqlmnnzkWvl.', 'Active', '2025-08-05', '2025-08-08 11:00:38', '2025-08-05 13:34:17', '2025-08-08 11:00:38'),
('2025459329', 'Earl', 'Liporada', 'earl@hok.com', NULL, 'Librarian', 'earl', '$2b$10$orxsTjMu.G.jfeCdo5L1SeA0tOpTr/9VXAM3vl0IvTbxYi7IV9zym', 'Active', '2025-08-05', '2025-08-08 09:56:21', '2025-08-05 13:28:41', '2025-08-08 09:56:21');

--
-- Triggers `staff`
--
DELIMITER $$
CREATE TRIGGER `before_insert_staff` 
BEFORE INSERT ON `staff` 
FOR EACH ROW 
BEGIN
    DECLARE random_digits CHAR(6);
    SET random_digits = LPAD(FLOOR(RAND() * 1000000), 6, '0');
    SET NEW.staff_id = CONCAT(YEAR(CURDATE()), random_digits);
END
$$
DELIMITER ;

--
-- Indexes for dumped tables
--


--
-- Indexes for table `login_history`
--
ALTER TABLE `login_history`
  ADD PRIMARY KEY (`history_id`),
  ADD KEY `staff_id` (`staff_id`);

--
-- Indexes for table `staff`
--
ALTER TABLE `staff`
  ADD PRIMARY KEY (`staff_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `nfc_uid` (`nfc_uid`); -- ✅ Ensures each card is unique

--
-- Constraints for dumped tables
--

--
-- Constraints for table `login_history`
--
ALTER TABLE `login_history`
  ADD CONSTRAINT `login_history_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
