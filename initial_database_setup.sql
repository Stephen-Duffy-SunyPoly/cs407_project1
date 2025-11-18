--execute these commands on the database after initial setup and the root account has been secured
--this is intended to be run on a mysql database

-- crate the database for the project
CREATE DATABASE message_board;

--crate out database user
CREATE USER 'message_board'@'localhost' IDENTIFIED BY ++DATABSE_USER_PASSWORD_HERE++ ;
--give the user privileges to the database
GRANT ALL ON message_board.* TO 'message_board'@'localhost';

--remember to configure the use password in the involvement file