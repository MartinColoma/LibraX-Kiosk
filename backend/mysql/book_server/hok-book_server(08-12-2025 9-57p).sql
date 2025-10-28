-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 12, 2025 at 07:58 AM
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
-- Database: `hok-book_server`
--
CREATE DATABASE IF NOT EXISTS `hok-book_server` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `hok-book_server`;

-- --------------------------------------------------------

--
-- Table structure for table `authors`
--

CREATE TABLE `authors` (
  `author_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `biography` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `authors`
--

INSERT INTO `authors` (`author_id`, `name`, `biography`) VALUES
(1, 'Frank Herbert', 'American science-fiction author, best known for Dune.'),
(2, 'Walter Isaacson', 'American biographer, known for books on historical figures.'),
(3, 'Stuart Russell', 'Professor of Computer Science at UC Berkeley. Co-author of AI textbook.'),
(4, 'Peter Norvig', 'Director of Research at Google and AI expert.'),
(2147483647, 'Martin Coloma', 'CpE Student');

-- --------------------------------------------------------

--
-- Table structure for table `books`
--

CREATE TABLE `books` (
  `book_id` varchar(11) NOT NULL,
  `isbn` varchar(20) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `subtitle` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `publisher` varchar(255) DEFAULT NULL,
  `publication_year` year(4) DEFAULT NULL,
  `edition` varchar(50) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `language` varchar(50) DEFAULT 'English',
  `date_added` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `books`
--

INSERT INTO `books` (`book_id`, `isbn`, `title`, `subtitle`, `description`, `publisher`, `publication_year`, `edition`, `category_id`, `language`, `date_added`) VALUES
('1200956312', '213411234', 'catt typo', NULL, NULL, NULL, NULL, NULL, NULL, 'English', '2025-08-12 13:38:16'),
('1460652468', '79846531', 'Soda Pop', 'hey hey', 'hey hey', NULL, NULL, NULL, NULL, 'English', '2025-08-12 12:17:36'),
('3504139608', '12312312', 'missing catt', NULL, NULL, NULL, NULL, NULL, 30, 'English', '2025-08-12 13:36:19'),
('4020091340', '1234234', 'Gabriela', NULL, NULL, NULL, NULL, NULL, NULL, 'English', '2025-08-12 12:22:12'),
('4614273899', '23412', 'catt', NULL, NULL, NULL, NULL, NULL, NULL, 'English', '2025-08-12 13:36:49'),
('5469951004', '1231231123', '1231', NULL, NULL, NULL, NULL, NULL, NULL, 'English', '2025-08-12 13:34:46'),
('7725147954', '2341324', 'Category Missing Again', NULL, NULL, NULL, NULL, NULL, 12, 'English', '2025-08-12 13:08:48'),
('8016745074', '75445213', 'Rolling in the Deep', NULL, NULL, NULL, NULL, NULL, NULL, 'English', '2025-08-12 12:11:29'),
('8108356816', '341324', 'Golden', NULL, NULL, NULL, NULL, NULL, NULL, 'English', '2025-08-12 12:10:42');

-- --------------------------------------------------------

--
-- Table structure for table `book_authors`
--

CREATE TABLE `book_authors` (
  `book_id` varchar(11) NOT NULL,
  `author_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `book_authors`
--

INSERT INTO `book_authors` (`book_id`, `author_id`) VALUES
('1200956312', 1),
('1460652468', 1),
('3504139608', 2147483647),
('4020091340', 3),
('4614273899', 3),
('5469951004', 2147483647),
('7725147954', 3),
('8016745074', 1),
('8108356816', 2);

-- --------------------------------------------------------

--
-- Table structure for table `book_copies`
--

CREATE TABLE `book_copies` (
  `copy_id` varchar(20) NOT NULL,
  `book_id` varchar(11) NOT NULL,
  `barcode` int(11) NOT NULL,
  `status` enum('Available','Borrowed','Lost','Damaged','Maintenance') DEFAULT 'Available',
  `book_condition` enum('New','Good','Fair','Damaged','Lost') DEFAULT 'Good',
  `location` varchar(100) DEFAULT 'Main Shelf',
  `date_added` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `book_copies`
--

INSERT INTO `book_copies` (`copy_id`, `book_id`, `barcode`, `status`, `book_condition`, `location`, `date_added`) VALUES
('1200956312001', '1200956312', 76306265, 'Available', 'New', 'Main Shelf', '2025-08-12 13:38:16'),
('1460652468001', '1460652468', 67487978, 'Available', 'New', 'Main Shelf', '2025-08-12 12:17:36'),
('1460652468002', '1460652468', 41553508, 'Available', 'New', 'Main Shelf', '2025-08-12 12:17:36'),
('1460652468003', '1460652468', 86370030, 'Available', 'New', 'Main Shelf', '2025-08-12 12:17:36'),
('1460652468004', '1460652468', 33210637, 'Available', 'New', 'Main Shelf', '2025-08-12 12:17:36'),
('3504139608001', '3504139608', 83893938, 'Available', 'New', 'Main Shelf', '2025-08-12 13:36:19'),
('4020091340001', '4020091340', 74807232, 'Available', 'New', 'Main Shelf', '2025-08-12 12:22:12'),
('4614273899001', '4614273899', 58036723, 'Available', 'New', 'Main Shelf', '2025-08-12 13:36:49'),
('5469951004001', '5469951004', 73883699, 'Available', 'New', 'Main Shelf', '2025-08-12 13:34:46'),
('5469951004002', '5469951004', 71748946, 'Available', 'New', 'Main Shelf', '2025-08-12 13:34:46'),
('5469951004003', '5469951004', 40754918, 'Available', 'New', 'Main Shelf', '2025-08-12 13:34:46'),
('5469951004004', '5469951004', 33680710, 'Available', 'New', 'Main Shelf', '2025-08-12 13:34:46'),
('5469951004005', '5469951004', 68571689, 'Available', 'New', 'Main Shelf', '2025-08-12 13:34:46'),
('7725147954001', '7725147954', 99490131, 'Available', 'New', 'Main Shelf', '2025-08-12 13:08:48'),
('7725147954002', '7725147954', 89821947, 'Available', 'New', 'Main Shelf', '2025-08-12 13:08:48'),
('7725147954003', '7725147954', 26348029, 'Available', 'New', 'Main Shelf', '2025-08-12 13:08:48'),
('7725147954004', '7725147954', 88380766, 'Available', 'New', 'Main Shelf', '2025-08-12 13:08:48'),
('7725147954005', '7725147954', 76526104, 'Available', 'New', 'Main Shelf', '2025-08-12 13:08:48'),
('8016745074001', '8016745074', 61742790, 'Available', 'New', 'Main Shelf', '2025-08-12 12:11:29'),
('8016745074002', '8016745074', 32067975, 'Available', 'New', 'Main Shelf', '2025-08-12 12:11:29'),
('8016745074003', '8016745074', 39235336, 'Available', 'New', 'Main Shelf', '2025-08-12 12:11:29'),
('8016745074004', '8016745074', 24712239, 'Available', 'New', 'Main Shelf', '2025-08-12 12:11:29'),
('8016745074005', '8016745074', 96531276, 'Available', 'New', 'Main Shelf', '2025-08-12 12:11:29'),
('8108356816001', '8108356816', 29374939, 'Available', 'New', 'Main Shelf', '2025-08-12 12:10:42'),
('8108356816002', '8108356816', 27206948, 'Available', 'New', 'Main Shelf', '2025-08-12 12:10:42'),
('8108356816003', '8108356816', 40886784, 'Available', 'New', 'Main Shelf', '2025-08-12 12:10:42'),
('8108356816004', '8108356816', 25312107, 'Available', 'New', 'Main Shelf', '2025-08-12 12:10:42'),
('8108356816005', '8108356816', 42351593, 'Available', 'New', 'Main Shelf', '2025-08-12 12:10:42'),
('8108356816006', '8108356816', 33841732, 'Available', 'New', 'Main Shelf', '2025-08-12 12:10:42'),
('8108356816007', '8108356816', 14481048, 'Available', 'New', 'Main Shelf', '2025-08-12 12:10:42'),
('8108356816008', '8108356816', 25097926, 'Available', 'New', 'Main Shelf', '2025-08-12 12:10:42'),
('8108356816009', '8108356816', 15168092, 'Available', 'New', 'Main Shelf', '2025-08-12 12:10:42'),
('8108356816010', '8108356816', 39103351, 'Available', 'New', 'Main Shelf', '2025-08-12 12:10:42');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `category_id` int(11) NOT NULL,
  `category_name` varchar(255) NOT NULL,
  `category_description` text DEFAULT NULL,
  `category_type` enum('Fiction','Non-Fiction','Special') NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`category_id`, `category_name`, `category_description`, `category_type`, `created_at`, `updated_at`) VALUES
(1, 'Literary Fiction', 'Character-driven, thought-provoking stories.', 'Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(2, 'Classic Literature', 'Timeless works from historical authors.', 'Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(3, 'Historical Fiction', 'Stories set in historical time periods.', 'Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(4, 'Mystery / Detective', 'Whodunits and detective investigations.', 'Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(5, 'Thriller / Suspense', 'Fast-paced, edge-of-your-seat narratives.', 'Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(6, 'Crime Fiction', 'Stories about crimes and criminals.', 'Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(7, 'Horror', 'Frightening stories with supernatural or psychological elements.', 'Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(8, 'Fantasy', 'Magical or mythical worlds and adventures.', 'Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(9, 'Science Fiction', 'Futuristic or scientific-based imaginative stories.', 'Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(10, 'Dystopian / Post-Apocalyptic', 'Futures with societal collapse or strict regimes.', 'Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(11, 'Adventure', 'Exciting journeys and explorations.', 'Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(12, 'Action Fiction', 'High-energy, action-driven plots.', 'Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(13, 'Magical Realism', 'Real-world settings with magical elements.', 'Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(14, 'Mythology / Folklore', 'Stories inspired by myths and legends.', 'Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(15, 'Paranormal / Supernatural', 'Ghosts, spirits, and other supernatural phenomena.', 'Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(16, 'Romance', 'Stories focused on love and relationships.', 'Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(17, 'Contemporary Romance', 'Modern-day love stories.', 'Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(18, 'Historical Romance', 'Love stories set in the past.', 'Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(19, 'Romantic Suspense', 'Love stories mixed with thrill and danger.', 'Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(20, 'Young Adult (YA) Fiction', 'Stories geared towards teenage readers.', 'Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(21, 'Middle Grade Fiction', 'Stories for pre-teens and young readers.', 'Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(22, 'Children’s Fiction', 'Stories for children and early readers.', 'Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(23, 'Fairy Tales & Fables', 'Traditional tales with moral lessons.', 'Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(24, 'Graphic Novels / Comics / Manga', 'Illustrated storytelling.', 'Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(25, 'Humor / Satire', 'Comedic and satirical narratives.', 'Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(26, 'Short Story Collections', 'Anthologies of fictional short stories.', 'Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(27, 'Western Fiction', 'Stories set in the American Old West.', 'Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(28, 'War / Military Fiction', 'Stories centered on war and soldiers.', 'Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(29, 'Urban Fiction', 'Stories set in urban or street environments.', 'Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(30, 'LGBTQ+ Fiction', 'Stories highlighting LGBTQ+ characters and themes.', 'Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(31, 'Biographies & Autobiographies', 'Life stories of real people.', 'Non-Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(32, 'Memoirs', 'Personal reflections and experiences.', 'Non-Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(33, 'Self-Help / Personal Development', 'Guides for improving life and mindset.', 'Non-Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(34, 'Psychology', 'The study of the human mind and behavior.', 'Non-Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(35, 'Philosophy', 'Books about wisdom, logic, and ethics.', 'Non-Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(36, 'Religion / Spirituality', 'Faith-based and spiritual texts.', 'Non-Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(37, 'Science & Technology', 'Books on scientific principles and innovations.', 'Non-Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(38, 'Mathematics', 'Books on math concepts and applications.', 'Non-Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(39, 'Health & Wellness', 'Guides on fitness, health, and medical topics.', 'Non-Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(40, 'Cookbooks / Food & Drink', 'Recipe collections and culinary guides.', 'Non-Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(41, 'Travel / Adventure', 'Travelogues and adventure guides.', 'Non-Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(42, 'Art & Photography', 'Books showcasing art, design, and photography.', 'Non-Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(43, 'Music', 'Books on music, musicians, and theory.', 'Non-Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(44, 'History', 'Historical analysis and events.', 'Non-Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(45, 'Politics & Government', 'Books about governance and political science.', 'Non-Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(46, 'Economics / Business / Finance', 'Business, finance, and economic principles.', 'Non-Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(47, 'Education / Teaching', 'Instructional and pedagogy resources.', 'Non-Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(48, 'Parenting & Family', 'Guides on raising children and family life.', 'Non-Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(49, 'Sports & Recreation', 'Books on sports, games, and leisure.', 'Non-Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(50, 'Nature & Environment', 'Books on ecosystems, wildlife, and conservation.', 'Non-Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(51, 'True Crime', 'Real-life crime stories and investigations.', 'Non-Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(52, 'Cultural Studies / Anthropology', 'Books on human societies and cultures.', 'Non-Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(53, 'Sociology', 'Study of social behavior and societies.', 'Non-Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(54, 'Law', 'Books on legal studies and regulations.', 'Non-Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(55, 'Medical / Nursing / Healthcare', 'Health profession-related books.', 'Non-Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(56, 'Engineering & Technical Manuals', 'Engineering and technical references.', 'Non-Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(57, 'Computer Science / Programming', 'Coding and computer-related books.', 'Non-Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(58, 'Hobbies & Crafts', 'Guides on crafts and hobbies.', 'Non-Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(59, 'Home & Garden', 'Home improvement and gardening guides.', 'Non-Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(60, 'Reference Books', 'Dictionaries, encyclopedias, and atlases.', 'Non-Fiction', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(61, 'Audiobooks', 'Books in audio format.', 'Special', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(62, 'E-books', 'Digital versions of books.', 'Special', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(63, 'Periodicals', 'Magazines and academic journals.', 'Special', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(64, 'Newspapers', 'Daily and weekly news publications.', 'Special', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(65, 'Research Papers / Theses', 'Academic research and graduate papers.', 'Special', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(66, 'Local History / Archives', 'Materials about local community history.', 'Special', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(67, 'Maps & Atlases', 'Geographical references and maps.', 'Special', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(68, 'Government Publications', 'Official government documents.', 'Special', '2025-08-01 21:18:30', '2025-08-01 21:18:30'),
(69, 'Rare Books / Special Collections', 'Rare and valuable books.', 'Special', '2025-08-01 21:18:30', '2025-08-01 21:18:30');

-- --------------------------------------------------------

--
-- Table structure for table `inventory_logs`
--

CREATE TABLE `inventory_logs` (
  `log_id` varchar(20) NOT NULL,
  `copy_id` varchar(20) NOT NULL,
  `action` enum('Added','Borrowed','Returned','Lost','Damaged','Repaired','Removed') NOT NULL,
  `performed_by` varchar(255) DEFAULT 'System',
  `log_date` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory_logs`
--

INSERT INTO `inventory_logs` (`log_id`, `copy_id`, `action`, `performed_by`, `log_date`) VALUES
('1057753519', '7725147954003', 'Added', 'Librarian', '2025-08-12 13:08:48'),
('1058749237', '7725147954002', 'Added', 'Librarian', '2025-08-12 13:08:48'),
('1948405304', '5469951004001', 'Added', 'Librarian', '2025-08-12 13:34:46'),
('2713299495', '1460652468004', 'Added', 'Librarian', '2025-08-12 12:17:36'),
('2797681430', '8108356816008', 'Added', 'Librarian', '2025-08-12 12:10:42'),
('2983446255', '7725147954004', 'Added', 'Librarian', '2025-08-12 13:08:48'),
('3152727795', '5469951004003', 'Added', 'Librarian', '2025-08-12 13:34:46'),
('3159107114', '1460652468002', 'Added', 'Librarian', '2025-08-12 12:17:36'),
('3727900363', '8108356816006', 'Added', 'Librarian', '2025-08-12 12:10:42'),
('3850930420', '4614273899001', 'Added', 'Librarian', '2025-08-12 13:36:49'),
('3877352694', '8016745074004', 'Added', 'Librarian', '2025-08-12 12:11:29'),
('4453401327', '8108356816005', 'Added', 'Librarian', '2025-08-12 12:10:42'),
('4777173473', '8108356816004', 'Added', 'Librarian', '2025-08-12 12:10:42'),
('4926620654', '8016745074003', 'Added', 'Librarian', '2025-08-12 12:11:29'),
('5046443639', '8016745074005', 'Added', 'Librarian', '2025-08-12 12:11:29'),
('5864756235', '8016745074002', 'Added', 'Librarian', '2025-08-12 12:11:29'),
('6062599221', '8108356816002', 'Added', 'Librarian', '2025-08-12 12:10:42'),
('6078558022', '1200956312001', 'Added', 'Librarian', '2025-08-12 13:38:16'),
('6082218333', '8108356816007', 'Added', 'Librarian', '2025-08-12 12:10:42'),
('6358265443', '8108356816003', 'Added', 'Librarian', '2025-08-12 12:10:42'),
('6648156705', '8108356816009', 'Added', 'Librarian', '2025-08-12 12:10:42'),
('6649779191', '7725147954001', 'Added', 'Librarian', '2025-08-12 13:08:48'),
('6947399316', '5469951004005', 'Added', 'Librarian', '2025-08-12 13:34:46'),
('7114771675', '1460652468003', 'Added', 'Librarian', '2025-08-12 12:17:36'),
('7920338854', '3504139608001', 'Added', 'Librarian', '2025-08-12 13:36:19'),
('8010741376', '8016745074001', 'Added', 'Librarian', '2025-08-12 12:11:29'),
('8353803054', '4020091340001', 'Added', 'Librarian', '2025-08-12 12:22:12'),
('8369082157', '5469951004002', 'Added', 'Librarian', '2025-08-12 13:34:46'),
('8453547157', '1460652468001', 'Added', 'Librarian', '2025-08-12 12:17:36'),
('8730850739', '8108356816001', 'Added', 'Librarian', '2025-08-12 12:10:42'),
('9741552040', '8108356816010', 'Added', 'Librarian', '2025-08-12 12:10:42'),
('9876363546', '7725147954005', 'Added', 'Librarian', '2025-08-12 13:08:48'),
('9962557973', '5469951004004', 'Added', 'Librarian', '2025-08-12 13:34:46');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `authors`
--
ALTER TABLE `authors`
  ADD PRIMARY KEY (`author_id`);

--
-- Indexes for table `books`
--
ALTER TABLE `books`
  ADD PRIMARY KEY (`book_id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `book_authors`
--
ALTER TABLE `book_authors`
  ADD PRIMARY KEY (`book_id`,`author_id`);

--
-- Indexes for table `book_copies`
--
ALTER TABLE `book_copies`
  ADD PRIMARY KEY (`copy_id`),
  ADD KEY `book_id` (`book_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`category_id`),
  ADD UNIQUE KEY `category_name` (`category_name`);

--
-- Indexes for table `inventory_logs`
--
ALTER TABLE `inventory_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `copy_id` (`copy_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=70;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `books`
--
ALTER TABLE `books`
  ADD CONSTRAINT `books_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`);

--
-- Constraints for table `book_authors`
--
ALTER TABLE `book_authors`
  ADD CONSTRAINT `book_authors_ibfk_1` FOREIGN KEY (`book_id`) REFERENCES `books` (`book_id`),
  ADD CONSTRAINT `book_authors_ibfk_2` FOREIGN KEY (`author_id`) REFERENCES `authors` (`author_id`);

--
-- Constraints for table `book_copies`
--
ALTER TABLE `book_copies`
  ADD CONSTRAINT `book_copies_ibfk_1` FOREIGN KEY (`book_id`) REFERENCES `books` (`book_id`);

--
-- Constraints for table `inventory_logs`
--
ALTER TABLE `inventory_logs`
  ADD CONSTRAINT `inventory_logs_ibfk_1` FOREIGN KEY (`copy_id`) REFERENCES `book_copies` (`copy_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
