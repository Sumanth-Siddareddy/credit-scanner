const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// Middleware to verify token and extract user details
const authenticateUser = (req, res, next) => {
    const token = req.header("Authorization");

    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token.replace("Bearer ", ""), JWT_SECRET);
        req.user = decoded;  // Attach decoded user data to req
        next();  // Proceed to next middleware
    } catch (err) {
        res.status(403).json({ error: "Invalid or expired token" });
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
