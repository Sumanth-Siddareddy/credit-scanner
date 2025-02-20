const express = require("express");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const db = require("../config/database");
const { body, validationResult } = require("express-validator");

dotenv.config();
const router = express.Router();

// Convert db methods to return Promises
const runQuery = promisify(db.run).bind(db);
const getQuery = promisify(db.get).bind(db);

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// **User Registration Route**
router.post(
  "/register",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password, role } = req.body;

      // Check if the username already exists
      const existingUser = await getQuery("SELECT * FROM users WHERE username = $1", [username]);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user
      await runQuery("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [
        username,
        hashedPassword,
        role || "user",
      ]);

      res.status(201).json({ message: "User registered successfully!" });
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// **User Login Route**
router.post(
  "/login",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password } = req.body;

      // Fetch user from database
      const user = await getQuery("SELECT * FROM users WHERE username = ?", [username]);

      if (!user) {
        return res.status(400).json({ error: "Invalid username or password" });
      }

      // Compare hashed passwords
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Invalid username or password" });
      }

      // Generate JWT token
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1d" });

      res.json({ message: "Login successful", token });
    } catch (error) {
      console.error("Error logging in user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

module.exports = router;
