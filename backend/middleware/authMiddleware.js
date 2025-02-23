const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const db = require("../config/database");

const getQuery = promisify(db.get).bind(db);

const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.header("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Access denied. No token provided or malformed." });
        }

        const token = authHeader.split(" ")[1];
        // console.log("Received Token:", token);

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // console.log("Decoded JWT:", decoded);

        if (!decoded.id) {
            return res.status(401).json({ error: "Invalid token. Missing user ID." });
        }

        const user = await getQuery("SELECT * FROM users WHERE id = ?", [decoded.id]);
        if (!user) {
            return res.status(401).json({ error: "Invalid token. User not found." });
        }

        req.user = user; // Attach user to request
        // console.log("Authenticated User:", req.user.id);

        next();
    } catch (error) {
        console.error(" backend/middleware/authMiddleware.js ->line 34 -> Authentication Error:", error.message);
        return res.status(401).json({ error: "Unauthorized. Invalid token." });
    }
};

// Middleware to check if the user has an "admin" role
const authorizeAdmin = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Access denied. Admins only" });
    }
    next();
};

module.exports = { authenticateUser, authorizeAdmin };
