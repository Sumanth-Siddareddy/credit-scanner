const { promisify } = require("util");
const db = require("../config/database");

const getQuery = promisify(db.get).bind(db);
const allQuery = promisify(db.all).bind(db);
const runQuery = promisify(db.run).bind(db);

// Get all pending credit requests
const getPendingCreditRequests = async (req, res) => {
    try {
        // const query = getQuery("SELECT * FROM credit_requests ORDER BY request_date DESC;");
        const creditRequests = await getQuery("SELECT * FROM credit_requests ORDER BY request_date DESC;");
        console.log("Credit requests : line 13 -> adminController : ",creditRequests);
        res.json({ success: true, data: creditRequests });
    } catch (error) {
        console.error("Error fetching credit requests:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Approve Credit Request (Admin Grants Credits)
const approveCreditRequest = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Fetch the user's current credit balance
        const user = await getQuery("SELECT credits FROM users WHERE id = ?", [userId]);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Fetch the requested credits
        const request = await getQuery("SELECT * FROM credit_requests WHERE user_id = ? AND status = 'pending'", [userId]);
        if (!request) {
            return res.status(400).json({ error: "No pending credit request found for this user." });
        }

        const newCreditBalance = user.credits + request.credits_requested;
        
        // Ensure credits do not exceed 20
        if (newCreditBalance > 20) {
            return res.status(400).json({ error: "Cannot approve request. Maximum allowed credits is 20." });
        }

        // Approve request and grant credits
        await runQuery("UPDATE users SET credits = ? WHERE id = ?", [newCreditBalance, userId]);
        await runQuery("UPDATE credit_requests SET status = 'approved' WHERE user_id = ?", [userId]);

        res.json({ success: true, message: "Credits approved successfully", remaining_credits: newCreditBalance });

    } catch (error) {
        console.error("Error in approveCreditRequest:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Reject Credit Request (Admin Rejects)
const rejectCreditRequest = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Check if a pending request exists
        const request = await getQuery("SELECT * FROM credit_requests WHERE user_id = ? AND status = 'pending'", [userId]);
        if (!request) {
            return res.status(400).json({ error: "No pending credit request found for this user." });
        }

        // Reject the request
        await runQuery("UPDATE credit_requests SET status = 'rejected' WHERE user_id = ?", [userId]);

        res.json({ success: true, message: "Credit request rejected" });

    } catch (error) {
        console.error("Error in rejectCreditRequest:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Admin manually sets user credits
const setCredits = async (req, res) => {
    const { userId } = req.params;
    const { credits } = req.body;

    if (!Number.isInteger(credits) || credits < 0 || credits > 20) {
        return res.status(400).json({ error: "Invalid credit amount. Must be between 0 and 20." });
    }

    try {
        await runQuery("UPDATE users SET credits = ? WHERE id = ?", [credits, userId]);
        res.json({ message: `Credits set to ${credits} for user ${userId}.` });
    } catch (error) {
        res.status(500).json({ error: "Database error. Could not update credits." });
    }
};

const getDashboardStats = async (req, res) => { 
    try {
        // Fetch most common scanned topics
        const topics = await allQuery(`
            SELECT topic, count(topic) AS count
            FROM scans
            WHERE topic IS NOT NULL
            GROUP BY topic
            ORDER BY count DESC
            LIMIT 5
        `);

        // Fetch top users by scan count
        const topUsers = await allQuery(`
            SELECT users.id, users.role, users.username AS name, COUNT(scans.id) AS scan_count
            FROM users
            LEFT JOIN scans ON users.id = scans.user_id
            GROUP BY users.id
            ORDER BY scan_count DESC
            LIMIT 5
        `);

        // Fetch top credit users
        const topCreditUsers = await allQuery(`
            SELECT users.id, users.username AS name, users.credits AS total_credits
            FROM users
            LEFT JOIN scans ON scans.user_id = users.id
            GROUP BY users.id
            ORDER BY total_credits DESC
            LIMIT 5
        `);

        // Fetch total credits used
        const creditStats = await getQuery(`
            SELECT SUM(total_credits_used) AS total_credits_used 
            FROM (SELECT user_id, count(user_id) AS total_credits_used FROM scans GROUP BY user_id)
        `);
        res.json({
            topTopics: topics || [],
            topUsers: topUsers || [],
            topCreditUsers: topCreditUsers || [],
            totalCreditsUsed: creditStats?.total_credits_used || 0
        });

    } catch (error) {
        console.error("Admin Dashboard Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};



module.exports = {
    getDashboardStats,
    getPendingCreditRequests,
    approveCreditRequest,
    rejectCreditRequest,
    setCredits
};
