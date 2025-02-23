const { promisify } = require("util");
const db = require("../config/database");

const getQuery = promisify(db.get).bind(db);
const updateQuery = promisify(db.run).bind(db);
const runQuery = promisify(db.run).bind(db);

// Deduct 1 Credit for Scanning
const deductCredits = async (req, res) => {
    try {
        const userId = req.user.id; // Extract user ID from request
        console.log("credit controller.js -> 12-> User ID extracted:", userId);

        // Get current user credits
        const user = await getQuery("SELECT role, credits FROM users WHERE id = ?", [userId]);

        if (!user) {
            console.error(` No user found with ID ${userId}`);
            return res.status(404).json({ error: "User not found" });
        }

        if (user.credits < 1) {
            return res.status(400).json({ error: "Insufficient credits. Please request more credits." });
        }
        // console.log("user requested to deduct : ",user.role);
        // Deduct one credit
        if(user.role === 'admin'){ // if user is admin it will not deduct credits
            return res.json({ success: true, remaining_credits: user.credits });
        }

        await updateQuery("UPDATE users SET credits = credits - 1 WHERE id = ?", [userId]);

        // Get updated credits
        const updatedUser = await getQuery("SELECT credits FROM users WHERE id = ?", [userId]);

        return res.json({ success: true, remaining_credits: updatedUser.credits });
    } catch (error) {
        console.error("Credit Deduction Error:", error);
        return res.status(500).json({ error: "Error while deducting credits" });
    }
};

// Request 5 Extra Credits
const requestCredits = async (req, res) => {
    try {
        // Check if a pending request already exists
        const existingRequest = await getQuery("SELECT * FROM credit_requests WHERE user_id = ? AND status = 'pending'", [req.user.id]);
        if (existingRequest) {
            return res.status(400).json({ error: "You already have a pending credit request." });
        }

        // Insert credit request for 5 credits
        await runQuery("INSERT INTO credit_requests (user_id, status, credits_requested) VALUES (?, 'pending', 1)", [req.user.id]);
        console.log("QUery executed.");
        res.json({ message: "Credit request for 1 credit submitted. Waiting for admin approval." });
    } catch (error) {
         // Debug - to check that user details are feteched or not
         // print user id & error
         // because I create table with column requested_credits and used 
         // credits_requested in the above query error occured
        console.log(req.user.id);
        console.error("Error in requestCredits:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


module.exports = {
    deductCredits,
    requestCredits
};
