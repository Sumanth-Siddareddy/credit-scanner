const db = require("../config/database");
const bcrypt = require("bcryptjs");

// Create Users Table
db.run(
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    credits INTEGER DEFAULT 20
  )`,
  (err) => {
    if (err) console.error("Error creating users table:", err.message);
  }
);

// Function to create a new user
const createUser = (username, password, role, callback) => {
  const hashedPassword = bcrypt.hashSync(password, 10);
  db.run(
    `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
    [username, hashedPassword, role],
    function (err) {
      callback(err, this.lastID);
    }
  );
};

module.exports = { createUser };
