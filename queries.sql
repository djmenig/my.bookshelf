-- Create 2 tables that are joined by id and user_id
CREATE TABLE users (
id SERIAL PRIMARY KEY,
username VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE books (
user_id INT REFERENCES users(id) UNIQUE,
title VARCHAR(255) NOT NULL,
notes TEXT,
rating INT,
date_read DATE
);