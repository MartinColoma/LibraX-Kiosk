-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 30, 2025 at 08:27 PM
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

--
-- Table structure for table `login_history`
--

CREATE TABLE `login_history` (
  `history_id` varchar(36) NOT NULL,
  `user_id` varchar(12) NOT NULL,
  `user_type` enum('staff','member') NOT NULL,
  `login_time` datetime DEFAULT current_timestamp(),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `student_id` varchar(20) NOT NULL,
  `nfc_uid` varchar(20) DEFAULT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `password_hash` varchar(255) NOT NULL,
  `date_registered` date DEFAULT curdate(),
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `members`
--

INSERT INTO `members` (`member_id`, `first_name`, `last_name`, `email`, `phone_number`, `student_id`, `nfc_uid`, `status`, `password_hash`, `date_registered`, `last_login`, `created_at`, `updated_at`) VALUES
('M202593826', 'Kent ', 'Arado', 'kent@gmail.com', '09123123123', '2022-200922', NULL, 'Active', '$2b$10$rPk8EmQUCBSdbwC63So8vODvwkbdz/riQCTNy1m0/u8ypqGxZj1Fa', '2025-10-01', NULL, '2025-09-30 18:07:37', '2025-09-30 18:07:37');

--
-- Triggers `members`
--
DELIMITER $$
CREATE TRIGGER `before_insert_members` BEFORE INSERT ON `members` FOR EACH ROW BEGIN
    DECLARE random_digits CHAR(6);
    SET random_digits = LPAD(FLOOR(RAND() * 1000000), 6, '0');
    SET NEW.member_id = CONCAT('M', YEAR(CURDATE()), random_digits);
END
$$
DELIMITER ;

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
  `nfc_uid` varchar(20) DEFAULT NULL,
  `date_hired` date DEFAULT curdate(),
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `staff`
--

INSERT INTO `staff` (`staff_id`, `first_name`, `last_name`, `email`, `phone_number`, `role`, `username`, `password_hash`, `status`, `nfc_uid`, `date_hired`, `last_login`, `created_at`, `updated_at`) VALUES
('2025000144', 'Martin', 'Coloma', 'martin@gmail.com', NULL, 'Librarian', 'morphy', '$2b$10$gSmOL.qaqp3zRbQGI3Kv8edxjniIE.f/JLus2GLdSC6PV6rh5lewu', 'Active', NULL, '2025-08-05', '2025-09-30 17:15:22', '2025-08-05 12:55:55', '2025-09-30 17:15:22'),
('2025145279', 'John', 'Doe', 'johndoe@hok.com', NULL, 'Librarian', 'johndoe', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Active', NULL, '2025-08-05', NULL, '2025-08-05 12:29:59', '2025-08-05 12:30:18'),
('2025185866', 'Karl', 'Iligan', 'karl@hok.com', '09123123123', 'Admin', 'karl', '$2b$10$KOgdaw6KrkVnlAbmKFyEROwZkO4JO5ZJ0EYQafRhCCqlmnnzkWvl.', 'Active', NULL, '2025-08-05', '2025-08-08 11:00:38', '2025-08-05 13:34:17', '2025-08-08 11:00:38'),
('2025459329', 'Earl', 'Liporada', 'earl@hok.com', NULL, 'Librarian', 'earl', '$2b$10$orxsTjMu.G.jfeCdo5L1SeA0tOpTr/9VXAM3vl0IvTbxYi7IV9zym', 'Active', NULL, '2025-08-05', '2025-08-08 09:56:21', '2025-08-05 13:28:41', '2025-08-08 09:56:21');

--
-- Triggers `staff`
--
DELIMITER $$
CREATE TRIGGER `before_insert_staff` BEFORE INSERT ON `staff` FOR EACH ROW BEGIN
    DECLARE random_digits CHAR(6);
    SET random_digits = LPAD(FLOOR(RAND() * 1000000), 6, '0');
    SET NEW.staff_id = CONCAT(YEAR(CURDATE()), random_digits);
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` varchar(12) NOT NULL,
  `user_type` enum('staff','member') NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `username` varchar(50) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `nfc_uid` varchar(20) DEFAULT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `student_id` varchar(20) DEFAULT NULL,
  `role` enum('Librarian','Administrative','Faculty', 'Student') DEFAULT NULL,
  `date_hired` date DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `date_registered` date DEFAULT curdate(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `user_type`, `first_name`, `last_name`, `email`, `phone_number`, `username`, `password_hash`, `nfc_uid`, `status`, `student_id`, `role`, `date_hired`, `last_login`, `date_registered`, `created_at`, `updated_at`) VALUES
('U2025001', 'staff', 'Martin', 'Coloma', 'martin@hok.com', '09171234567', 'morphy', '$2b$10$gSmOL.qaqp3zRbQGI3Kv8edxjniIE.f/JLus2GLdSC6PV6rh5lewu', '04A1B23C45', 'Active', NULL, 'Librarian', '2025-08-05', '2025-09-30 18:24:23', '2025-10-01', '2025-09-30 18:24:23', '2025-09-30 18:24:23'),
('U2025002', 'staff', 'Karl', 'Iligan', 'karl@hok.com', '09123456789', 'karl', '$2b$10$KOgdaw6KrkVnlAbmKFyEROwZkO4JO5ZJ0EYQafRhCCqlmnnzkWvl.', '05B2C34D56', 'Active', NULL, 'Admin', '2025-08-01', NULL, '2025-10-01', '2025-09-30 18:24:23', '2025-09-30 18:24:23'),
('U2025101', 'member', 'Earl', 'Liporada', 'earl@student.hok.edu', '09987654321', NULL, '$2b$10$J9hgT2MWKfFzP/E8yU6fwO6mZ.yKhklx4Yz1fK2z9squMIt1UeoA.', '07C3D45E67', 'Active', '2025-001122', NULL, NULL, NULL, '2025-10-01', '2025-09-30 18:24:23', '2025-09-30 18:24:23'),
('U2025102', 'member', 'Jane', 'Doe', 'jane@student.hok.edu', '09121231234', NULL, '$2b$10$OelP2vNRpUw4dGxgxKrf4eaEwzrfNf39S3c5B0HqJ0i6jHuSKWZlG', '08D4E56F78', 'Active', '2025-009988', NULL, NULL, NULL, '2025-10-01', '2025-09-30 18:24:23', '2025-09-30 18:24:23');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `login_history`
--
ALTER TABLE `login_history`
  ADD PRIMARY KEY (`history_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `members`
--
ALTER TABLE `members`
  ADD PRIMARY KEY (`member_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `student_id` (`student_id`),
  ADD UNIQUE KEY `nfc_uid` (`nfc_uid`);

--
-- Indexes for table `staff`
--
ALTER TABLE `staff`
  ADD PRIMARY KEY (`staff_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `nfc_uid` (`nfc_uid`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `nfc_uid` (`nfc_uid`),
  ADD UNIQUE KEY `student_id` (`student_id`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `login_history`
--
ALTER TABLE `login_history`
  ADD CONSTRAINT `login_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
