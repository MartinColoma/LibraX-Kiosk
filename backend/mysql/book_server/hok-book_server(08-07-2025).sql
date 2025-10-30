-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 06, 2025 at 06:19 PM
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
(4, 'Peter Norvig', 'Director of Research at Google and AI expert.');

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
('10001', '9780441172719', 'Dune', 'The Epic Sci-Fi Saga', 'A desert planet, spice, and political intrigue.', 'Chilton Books', '1965', '1st', 9, 'English', '2025-08-01 14:08:07'),
('10002', '9781501127625', 'Leonardo da Vinci', NULL, 'Biography of the Renaissance genius.', 'Simon & Schuster', '2017', '1st', 31, 'English', '2025-08-01 14:08:07'),
('1212636692', 'sdf', 'zcvzsdf', 'sd', 'saf', 'tvg', '0000', 'sd', NULL, 'English', '2025-08-06 23:46:48'),
('2251811523', '98465123', 'Again', '2', 'kj', 'MC', '2021', '2nd', NULL, 'English', '2025-08-07 00:11:59'),
('3', '9780134610993', 'Artificial Intelligence', 'A Modern Approach', 'Leading textbook on AI covering search, ML, and agents.', 'Pearson', '2020', '4th Edition', 57, 'English', '2025-08-01 22:25:03'),
('5479815624', '23431423', 'Meet You Again', 'When We Were Friends', NULL, 'me', '2025', '1st', NULL, 'English', '2025-08-07 00:17:37'),
('5811577942', 'af', 'asf', 'sa', 'a', '12', '2111', 'sdf', 4, 'English', '2025-08-06 23:45:53'),
('7765238091', '12345', 'Me N U', NULL, NULL, NULL, NULL, NULL, NULL, 'English', '2025-08-06 23:55:02'),
('8333534338', 'sdf', 'zcvzsdf', 'sd', 'saf', 'tvg', '0000', 'sd', NULL, 'English', '2025-08-06 23:50:22'),
('8852722531', '321423', 'Is it success?', 'hoping', 'asdfasdfsfasd', 'MC', '2024', '3rd', NULL, 'English', '2025-08-07 00:13:05'),
('8961152781', '12312312', 'Is this real?', 'this time', 'asdf', 'MC', '2025', '1st', NULL, 'English', '2025-08-06 23:58:24'),
('9256822720', '98465123', 'Again', '2', 'kj', 'MC', '2021', '2nd', NULL, 'English', '2025-08-07 00:03:07'),
('9342565543', '12345', 'Me N U', NULL, NULL, NULL, NULL, NULL, NULL, 'English', '2025-08-06 23:56:38');

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
('10001', 1),
('10002', 2),
('1212636692', 3),
('2251811523', 1),
('3', 3),
('3', 4),
('5479815624', 3),
('5811577942', 2),
('7765238091', 2),
('8333534338', 3),
('8852722531', 2),
('8961152781', 3),
('9256822720', 1),
('9342565543', 2);

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
('', '5811577942', 16667976, 'Available', 'New', 'Main Shelf', '2025-08-06 23:45:53'),
('1099045604', '8961152781', 42321345, 'Available', 'New', 'Main Shelf', '2025-08-06 23:58:24'),
('1242142428', '9342565543', 62599870, 'Available', 'New', 'Main Shelf', '2025-08-06 23:56:38'),
('1539779078', '2251811523', 28256016, 'Available', 'New', 'Main Shelf', '2025-08-07 00:11:59'),
('1843082144', '7765238091', 17963256, 'Available', 'New', 'Main Shelf', '2025-08-06 23:55:02'),
('1919477336', '5479815624', 91585945, 'Available', 'New', 'Main Shelf', '2025-08-07 00:17:37'),
('20001', '10001', 1, 'Available', 'Good', 'Sci-Fi Shelf A', '2025-08-01 22:09:44'),
('20002', '10001', 2, 'Borrowed', 'Good', 'Sci-Fi Shelf A', '2025-08-01 22:09:44'),
('20003', '10002', 1, 'Available', 'Good', 'Biography Shelf B', '2025-08-01 22:09:44'),
('2695601604', '2251811523', 79717909, 'Available', 'New', 'Main Shelf', '2025-08-07 00:11:59'),
('2699031582', '9256822720', 72345832, 'Available', 'New', 'Main Shelf', '2025-08-07 00:03:07'),
('3003664198', '8852722531', 70427142, 'Available', 'New', 'Main Shelf', '2025-08-07 00:13:05'),
('3573792584', '2251811523', 54663225, 'Available', 'New', 'Main Shelf', '2025-08-07 00:11:59'),
('3600171174', '2251811523', 21473641, 'Available', 'New', 'Main Shelf', '2025-08-07 00:11:59'),
('3855620834', '5479815624', 65159102, 'Available', 'New', 'Main Shelf', '2025-08-07 00:17:37'),
('3956706909', '7765238091', 41050658, 'Available', 'New', 'Main Shelf', '2025-08-06 23:55:02'),
('4', '3', 0, 'Available', 'New', 'Shelf C1', '2025-08-01 00:00:00'),
('4027779465', '2251811523', 73609330, 'Available', 'New', 'Main Shelf', '2025-08-07 00:11:59'),
('4176848031', '8961152781', 57879747, 'Available', 'New', 'Main Shelf', '2025-08-06 23:58:24'),
('4321561479', '9256822720', 91108567, 'Available', 'New', 'Main Shelf', '2025-08-07 00:03:07'),
('4472839152', '8961152781', 66450130, 'Available', 'New', 'Main Shelf', '2025-08-06 23:58:24'),
('4486732191', '9256822720', 27968753, 'Available', 'New', 'Main Shelf', '2025-08-07 00:03:07'),
('4545175856', '5479815624', 92577570, 'Available', 'New', 'Main Shelf', '2025-08-07 00:17:37'),
('4629953814', '2251811523', 28945189, 'Available', 'New', 'Main Shelf', '2025-08-07 00:11:59'),
('4630717994', '9256822720', 94237418, 'Available', 'New', 'Main Shelf', '2025-08-07 00:03:07'),
('4708095901', '2251811523', 86549490, 'Available', 'New', 'Main Shelf', '2025-08-07 00:11:59'),
('5', '3', 0, 'Available', 'New', 'Shelf C1', '2025-08-01 00:00:00'),
('5832460985', '9256822720', 46662740, 'Available', 'New', 'Main Shelf', '2025-08-07 00:03:07'),
('6', '3', 0, 'Available', 'New', 'Shelf C1', '2025-08-01 00:00:00'),
('6633776545', '9256822720', 73503275, 'Available', 'New', 'Main Shelf', '2025-08-07 00:03:07'),
('7054554214', '5479815624', 66452557, 'Available', 'New', 'Main Shelf', '2025-08-07 00:17:37'),
('7214281954', '8852722531', 90233613, 'Available', 'New', 'Main Shelf', '2025-08-07 00:13:05'),
('7330043722', '5479815624', 34031450, 'Available', 'New', 'Main Shelf', '2025-08-07 00:17:37'),
('7617586692', '2251811523', 20329427, 'Available', 'New', 'Main Shelf', '2025-08-07 00:11:59'),
('7771906708', '5479815624', 64983696, 'Available', 'New', 'Main Shelf', '2025-08-07 00:17:37'),
('7873678275', '9256822720', 37574198, 'Available', 'New', 'Main Shelf', '2025-08-07 00:03:07'),
('7925939954', '9256822720', 33483708, 'Available', 'New', 'Main Shelf', '2025-08-07 00:03:07'),
('7931298214', '2251811523', 83509290, 'Available', 'New', 'Main Shelf', '2025-08-07 00:11:59'),
('7982497425', '8852722531', 19368906, 'Available', 'New', 'Main Shelf', '2025-08-07 00:13:05'),
('8155391257', '8852722531', 65427274, 'Available', 'New', 'Main Shelf', '2025-08-07 00:13:05'),
('8399596331', '5479815624', 90516515, 'Available', 'New', 'Main Shelf', '2025-08-07 00:17:37'),
('8423488103', '8961152781', 53192893, 'Available', 'New', 'Main Shelf', '2025-08-06 23:58:24'),
('8534298680', '2251811523', 19920814, 'Available', 'New', 'Main Shelf', '2025-08-07 00:11:59'),
('8886573566', '8961152781', 65651979, 'Available', 'New', 'Main Shelf', '2025-08-06 23:58:24'),
('8962869307', '9256822720', 95603789, 'Available', 'New', 'Main Shelf', '2025-08-07 00:03:07'),
('9042487542', '5479815624', 21226463, 'Available', 'New', 'Main Shelf', '2025-08-07 00:17:37'),
('9300280302', '8852722531', 70550857, 'Available', 'New', 'Main Shelf', '2025-08-07 00:13:05'),
('9523834933', '9342565543', 69679787, 'Available', 'New', 'Main Shelf', '2025-08-06 23:56:38'),
('9686922330', '9256822720', 65496324, 'Available', 'New', 'Main Shelf', '2025-08-07 00:03:07'),
('9911556228', '5479815624', 43321476, 'Available', 'New', 'Main Shelf', '2025-08-07 00:17:37'),
('9968610509', '5479815624', 48648099, 'Available', 'New', 'Main Shelf', '2025-08-07 00:17:37');

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
('', '3956706909', 'Added', 'Librarian', '2025-08-06 23:55:02'),
('1545422653', '3855620834', 'Added', 'Librarian', '2025-08-07 00:17:37'),
('1634245737', '7617586692', 'Added', 'Librarian', '2025-08-07 00:11:59'),
('1760637492', '9968610509', 'Added', 'Librarian', '2025-08-07 00:17:37'),
('1897291893', '2695601604', 'Added', 'Librarian', '2025-08-07 00:11:59'),
('2022875077', '3573792584', 'Added', 'Librarian', '2025-08-07 00:11:59'),
('2316704867', '7931298214', 'Added', 'Librarian', '2025-08-07 00:11:59'),
('2356960766', '9523834933', 'Added', 'Librarian', '2025-08-06 23:56:38'),
('2361328779', '1539779078', 'Added', 'Librarian', '2025-08-07 00:11:59'),
('2900040336', '7214281954', 'Added', 'Librarian', '2025-08-07 00:13:05'),
('30001', '20001', 'Added', 'Admin', '2025-08-01 22:09:44'),
('30002', '20002', 'Added', 'Admin', '2025-08-01 22:09:44'),
('30003', '20002', 'Borrowed', 'Librarian', '2025-08-01 22:09:44'),
('30004', '20003', 'Added', 'Admin', '2025-08-01 22:09:44'),
('3410341145', '8962869307', 'Added', 'Librarian', '2025-08-07 00:03:07'),
('3983004045', '9686922330', 'Added', 'Librarian', '2025-08-07 00:03:07'),
('4147759095', '4486732191', 'Added', 'Librarian', '2025-08-07 00:03:07'),
('4381240891', '7873678275', 'Added', 'Librarian', '2025-08-07 00:03:07'),
('4394027266', '8886573566', 'Added', 'Librarian', '2025-08-06 23:58:24'),
('4487950167', '4708095901', 'Added', 'Librarian', '2025-08-07 00:11:59'),
('4549756196', '7330043722', 'Added', 'Librarian', '2025-08-07 00:17:37'),
('4662555199', '9300280302', 'Added', 'Librarian', '2025-08-07 00:13:05'),
('4952124004', '5832460985', 'Added', 'Librarian', '2025-08-07 00:03:07'),
('5', '4', 'Added', 'Librarian', '2025-08-01 22:29:33'),
('5033281188', '4176848031', 'Added', 'Librarian', '2025-08-06 23:58:24'),
('6', '5', 'Added', 'Librarian', '2025-08-01 22:29:33'),
('6343353437', '8534298680', 'Added', 'Librarian', '2025-08-07 00:11:59'),
('6651222694', '1919477336', 'Added', 'Librarian', '2025-08-07 00:17:37'),
('6721903907', '3003664198', 'Added', 'Librarian', '2025-08-07 00:13:05'),
('6736483473', '2699031582', 'Added', 'Librarian', '2025-08-07 00:03:07'),
('6930364823', '4472839152', 'Added', 'Librarian', '2025-08-06 23:58:24'),
('7', '6', 'Added', 'Admin', '2025-08-01 22:29:33'),
('7041439484', '4630717994', 'Added', 'Librarian', '2025-08-07 00:03:07'),
('7101989151', '8155391257', 'Added', 'Librarian', '2025-08-07 00:13:05'),
('7209775224', '1242142428', 'Added', 'Librarian', '2025-08-06 23:56:38'),
('7542747000', '4545175856', 'Added', 'Librarian', '2025-08-07 00:17:37'),
('7561836705', '9911556228', 'Added', 'Librarian', '2025-08-07 00:17:37'),
('7599280134', '7771906708', 'Added', 'Librarian', '2025-08-07 00:17:37'),
('7869547232', '4321561479', 'Added', 'Librarian', '2025-08-07 00:03:07'),
('8073960633', '9042487542', 'Added', 'Librarian', '2025-08-07 00:17:37'),
('8090726767', '7982497425', 'Added', 'Librarian', '2025-08-07 00:13:05'),
('8387120016', '3600171174', 'Added', 'Librarian', '2025-08-07 00:11:59'),
('8438711264', '1099045604', 'Added', 'Librarian', '2025-08-06 23:58:24'),
('8446717537', '4629953814', 'Added', 'Librarian', '2025-08-07 00:11:59'),
('8468250639', '4027779465', 'Added', 'Librarian', '2025-08-07 00:11:59'),
('8549563129', '7054554214', 'Added', 'Librarian', '2025-08-07 00:17:37'),
('8687995961', '6633776545', 'Added', 'Librarian', '2025-08-07 00:03:07'),
('8867693452', '8423488103', 'Added', 'Librarian', '2025-08-06 23:58:24'),
('9011178321', '7925939954', 'Added', 'Librarian', '2025-08-07 00:03:07'),
('9045590453', '8399596331', 'Added', 'Librarian', '2025-08-07 00:17:37');

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
  ADD PRIMARY KEY (`book_id`,`author_id`),
  ADD KEY `author_id` (`author_id`);

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
