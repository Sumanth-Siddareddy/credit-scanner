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
const getUser = promisify(db.get).bind(db);
const updateUser = promisify(db.run).bind(db);

// Function to check and reset credits if needed
const checkAndResetCredits = async (userId) => {
  const currentDate = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }).split(",")[0];

  const user = await getUser("SELECT id, last_credit_update FROM users WHERE id = ?", [userId]);

  if (user.last_credit_update !== currentDate) {
      await updateUser("UPDATE users SET credits = 20, last_credit_update = ? WHERE id = ?", [currentDate, userId]);
      console.log(`Credits reset for user ${userId} on login.`);
  }
};

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

      // to check role is user || admin only.. If something else return inavlid user
      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Allowed roles: 'user', 'admin'." });
      }

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

      // Ensure daily credit reset on login
      await checkAndResetCredits(user.id);

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
