const express = require("express");
const { authenticateUser, authorizeAdmin } = require("../middleware/authMiddleware");

const protect = express.Router();

// General user dashboard (all authenticated users)
protect.get("/dashboard", authenticateUser, (req, res) => {
    res.json({ message: "Welcome to the user dashboard", user: req.user });
});

// Admin dashboard (only admin users)
protect.get("/admin", authenticateUser, authorizeAdmin, (req, res) => {
    res.json({ message: "Welcome to the Admin Dashboard" });
});

module.exports = protect;
