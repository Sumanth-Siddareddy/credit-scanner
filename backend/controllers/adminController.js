const { promisify } = require("util");
const db = require("../config/database");

const getAllScans = promisify(db.all).bind(db);
const getAllUsers = promisify(db.all).bind(db);

const getDashboardStats = async (req, res) => {
    try {
        const scans = await getAllScans("SELECT * FROM scans");
        const users = await getAllUsers("SELECT * FROM users");

        res.json({
            total_users: users.length,
            total_scans: scans.length,
            latest_scans: scans.slice(-5) 
        });
    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = { getDashboardStats };
