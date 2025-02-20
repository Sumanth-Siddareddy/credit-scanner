const { promisify } = require("util");
const db = require("../config/database");

const getQuery = promisify(db.get).bind(db);
const updateQuery = promisify(db.run).bind(db);
const runQuery = promisify(db.run).bind(db);

// Deduct 1 Credit for Scanning
const deductCredits = async (userId) => {
    try {
        // Get current user credits
        const user = await getQuery("SELECT credits FROM users WHERE id = ?", [userId]);
        if (!user || user.credits < 1) {
            return { error: "Insufficient credits. Please request more credits." };
        }

        // Deduct one credit
        await updateQuery("UPDATE users SET credits = credits - 1 WHERE id = ?", [userId]);

        // Get updated credits
        const updatedUser = await getQuery("SELECT credits FROM users WHERE id = ?", [userId]);

        return { success: true, remaining_credits: updatedUser.credits };
    } catch (error) {
        console.error("Credit Deduction Error:", error);
        return { error: "Error while deducting credits" };
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
        await runQuery("INSERT INTO credit_requests (user_id, status, credits_requested) VALUES (?, 'pending', 5)", [req.user.id]);
        console.log("QUery executed.");
        res.json({ message: "Credit request for 5 credits submitted. Waiting for admin approval." });
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

// Approve Credit Request (Admin Grants 5 Credits)
const approveCreditRequest = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Fetch the user's current credit balance
        const user = await getQuery("SELECT credits FROM users WHERE id = ?", [userId]);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if a pending request exists
        const request = await getQuery("SELECT * FROM credit_requests WHERE user_id = ? AND status = 'pending'", [userId]);
        if (!request) {
            return res.status(400).json({ error: "No pending credit request found for this user." });
        }

        // Calculate new credit balance
        const newCreditBalance = user.credits + 5;

        // Ensure credits do not exceed 20
        if (newCreditBalance > 20) {
            return res.status(400).json({ error: "Cannot approve request. Maximum allowed credits is 20. Please check your balance credits and make request accordingly" });
        }

        // Approve request and grant 5 credits
        await runQuery("UPDATE users SET credits = ? WHERE id = ?", [newCreditBalance, userId]);
        await runQuery("UPDATE credit_requests SET status ='approved' WHERE user_id = ?", [userId]);

        return { success: true, remaining_credits: updatedUser.credits };
        res.json({ message: "5 credits approved successfully!", new_credits: newCreditBalance });

    } catch (error) {
        console.error("Error in approveCreditRequest:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};


module.exports = {
    deductCredits,
    requestCredits,
    approveCreditRequest
};
