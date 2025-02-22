const express = require("express");
const { authenticateUser, authorizeAdmin } = require("../middleware/authMiddleware");
const { promisify } = require("util");
const db = require("../config/database")

const protect = express.Router();

// Convert db.get to return a Promise
const getQuery = promisify(db.get).bind(db);

// View User Profile & Credits
protect.get("/user/profile", authenticateUser, async (req, res) => {
    try {
        // Get user details from the database
        const user = await getQuery("SELECT id, username, role, credits FROM users WHERE id = ?", [req.user.id]);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ profile: user });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// General user dashboard (all authenticated users)
protect.get("/dashboard", authenticateUser, (req, res) => {
    res.json({ message: "Welcome to the user dashboard", user: req.user });
});

// Admin dashboard (only admin users)
protect.get("/admin", authenticateUser, authorizeAdmin, async (req, res) => {
    const user = await getQuery("SELECT id, username, role, credits FROM users WHERE id = ?", [req.user.id]);
    res.json({ message: "Welcome to the Admin Dashboard", "user":user });
});

module.exports = protect;
