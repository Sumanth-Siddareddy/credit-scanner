const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/database");

const router = express.Router();

// To conform that routes are working
router.get("/", (req, res) => {
    res.json({ message: "Auth API is working!" });
  });
  
// User Registration
router.post("/register", (req, res) => {
  const { username, password, role } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
    [username, hashedPassword, role || "user"],
    function (err) {
      if (err) {
        return res.status(400).json({ error: "Username already exists" });
      }
      res.json({ message: "User registered successfully" });
    }
  );
});

// User Login
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
    if (err || !user) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token, user: { username: user.username, role: user.role, credits: user.credits } });
  });
});

module.exports = router;
