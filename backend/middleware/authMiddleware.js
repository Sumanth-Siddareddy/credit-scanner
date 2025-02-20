const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const db = require("../config/database");

const getQuery = promisify(db.get).bind(db);

const authenticateUser = async (req, res, next) => {
    try {
        const token = req.header("Authorization")?.split(" ")[1]; // Extract token from Bearer token
        if (!token) {
            return res.status(401).json({ error: "Access denied. No token provided." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify JWT token
        const user = await getQuery("SELECT * FROM users WHERE id = ?", [decoded.id]);

        if (!user) {
            return res.status(401).json({ error: "Invalid token. User not found." });
        }

        req.user = user; // Attach user data to request
        next();
    } catch (error) {
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
