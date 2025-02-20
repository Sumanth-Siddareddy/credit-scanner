const { promisify } = require("util");
const db = require("../config/database");

const getQuery = promisify(db.get).bind(db);
const runQuery = promisify(db.run).bind(db);

// Deduct 1 Credit for Scanning
exports.deductCredits = async (req, res) => {
    try {
        const user = await getQuery("SELECT * FROM users WHERE id = ?", [req.user.id]);
        
        if (!user || user.credits < 1) {
            return res.status(400).json({ error: "Insufficient credits. Please request more credits." });
        }

        // Deduct 1 credit
        await runQuery("UPDATE users SET credits = credits - 1 WHERE id = ?", [req.user.id]);
        res.json({ message: "1 credit deducted for scanning", remaining_credits: user.credits - 1 });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// Request 5 Extra Credits
exports.requestCredits = async (req, res) => {
    try {
        // Check if a pending request already exists
        const existingRequest = await getQuery("SELECT * FROM credit_requests WHERE user_id = ? AND status = 'pending'", [req.user.id]);
        if (existingRequest) {
            return res.status(400).json({ error: "You already have a pending credit request." });
        }

        // Insert credit request for 5 credits
        await runQuery("INSERT INTO credit_requests (user_id, status, credits_requested) VALUES (?, 'pending', 5)", [req.user.id]);
        res.json({ message: "Credit request for 5 credits submitted. Waiting for admin approval." });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// Approve Credit Request (Admin Grants 5 Credits)
exports.approveCreditRequest = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Check if a pending request exists
        const request = await getQuery("SELECT * FROM credit_requests WHERE user_id = ? AND status = 'pending'", [userId]);
        if (!request) {
            return res.status(400).json({ error: "No pending credit request found for this user." });
        }

        // Approve request and grant 5 credits
        await runQuery("UPDATE users SET credits = credits + 5 WHERE id = ?", [userId]);
        await runQuery("DELETE FROM credit_requests WHERE user_id = ?", [userId]);

        res.json({ message: "5 credits approved successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    deductCredits,
    requestCredits,
    approveCreditRequest
};
