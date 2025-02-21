const { promisify } = require("util");
const db = require("../config/database");

const getAllScans = promisify(db.all).bind(db);
const getAllUsers = promisify(db.all).bind(db);

const getDashboardStats = async (req, res) => {
    try {
        // Most Common Scanned Topics
        const topics = await db.all(`
            SELECT topic, COUNT(*) AS count
            FROM scans
            WHERE topic IS NOT NULL
            GROUP BY topic
            ORDER BY count DESC
            LIMIT 5
        `);

        // Top Users by Scan Count
        const topUsers = await db.all(`
            SELECT users.id, users.name, COUNT(scans.id) AS scan_count
            FROM users
            JOIN scans ON users.id = scans.user_id
            GROUP BY users.id
            ORDER BY scan_count DESC
            LIMIT 5
        `);

        // Top Users by Credit Usage
        const topCreditUsers = await db.all(`
            SELECT users.id, users.name, SUM(credits_used) AS total_credits
            FROM credit_transactions
            JOIN users ON credit_transactions.user_id = users.id
            GROUP BY users.id
            ORDER BY total_credits DESC
            LIMIT 5
        `);

        // Overall Credit Usage Stats
        const creditStats = await db.get(`
            SELECT SUM(credits_used) AS total_credits_used FROM credit_transactions
        `);

        res.json({
            topTopics: topics,
            topUsers: topUsers,
            topCreditUsers: topCreditUsers,
            totalCreditsUsed: creditStats.total_credits_used
        });

    } catch (error) {
        console.error("Admin Dashboard Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = { getDashboardStats };
