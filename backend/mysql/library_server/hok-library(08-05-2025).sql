-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 05, 2025 at 04:02 PM
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
  `history_id` varchar(10) NOT NULL,
  `staff_id` varchar(36) NOT NULL,
  `login_time` datetime DEFAULT current_timestamp(),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `login_history`
--

INSERT INTO `login_history` (`history_id`, `staff_id`, `login_time`, `ip_address`, `user_agent`) VALUES
('1065982261', '2025000144', '2025-08-05 21:27:55', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'),
('1393028785', '2025000144', '2025-08-05 21:39:43', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'),
('1791308914', '2025459329', '2025-08-05 21:48:58', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'),
('2414992644', '2025000144', '2025-08-05 21:55:29', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'),
('7864359348', '2025185866', '2025-08-05 21:58:57', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'),
('7890554097', '2025000144', '2025-08-05 21:58:01', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'),
('8245325949', '2025459329', '2025-08-05 21:28:59', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'),
('9467820924', '2025000144', '2025-08-05 21:27:02', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'),
('9857770480', '2025185866', '2025-08-05 21:34:42', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36');

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
  `date_hired` date DEFAULT curdate(),
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `staff`
--

INSERT INTO `staff` (`staff_id`, `first_name`, `last_name`, `email`, `phone_number`, `role`, `username`, `password_hash`, `status`, `date_hired`, `last_login`, `created_at`, `updated_at`) VALUES
('2025000144', 'Martin', 'Coloma', 'martin@gmail.com', NULL, 'Librarian', 'morphy', '$2b$10$gSmOL.qaqp3zRbQGI3Kv8edxjniIE.f/JLus2GLdSC6PV6rh5lewu', 'Active', '2025-08-05', '2025-08-05 13:58:01', '2025-08-05 12:55:55', '2025-08-05 13:58:01'),
('2025145279', 'John', 'Doe', 'johndoe@hok.com', NULL, 'Librarian', 'johndoe', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Active', '2025-08-05', NULL, '2025-08-05 12:29:59', '2025-08-05 12:30:18'),
('2025185866', 'Karl', 'Iligan', 'karl@hok.com', '09123123123', 'Admin', 'karl', '$2b$10$KOgdaw6KrkVnlAbmKFyEROwZkO4JO5ZJ0EYQafRhCCqlmnnzkWvl.', 'Active', '2025-08-05', '2025-08-05 13:58:57', '2025-08-05 13:34:17', '2025-08-05 13:58:57'),
('2025459329', 'Earl', 'Liporada', 'earl@hok.com', NULL, 'Librarian', 'earl', '$2b$10$orxsTjMu.G.jfeCdo5L1SeA0tOpTr/9VXAM3vl0IvTbxYi7IV9zym', 'Active', '2025-08-05', '2025-08-05 13:48:58', '2025-08-05 13:28:41', '2025-08-05 13:48:58');

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
  ADD UNIQUE KEY `username` (`username`);

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
