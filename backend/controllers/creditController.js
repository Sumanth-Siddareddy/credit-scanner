const { promisify } = require("util");
const db = require("../config/database");

const getQuery = promisify(db.get).bind(db);
const updateQuery = promisify(db.run).bind(db);
const runQuery = promisify(db.run).bind(db);

// const deductCredits = async (userId) => {
//     try {
//         // Get current user credits
//         const user = await getQuery("SELECT credits FROM users WHERE id = ?", [userId]);
//         if (!user) {
//             console.error(`No user found with ID ${userId}`);
//             return { error: "User not found" };
//         }

//         if (!user || user.credits < 1) {
//             return { error: "Insufficient credits. Please request more credits." };
//         }

//         if (!user || typeof user.credits === "undefined") {
//             return { error: "User not found or no credits available." };
//         }
        

//         // Deduct one credit
//         await updateQuery("UPDATE users SET credits = credits - 1 WHERE id = ?", [userId]);
//         // console.log("credits deducted sumanth!!!!!!!");

//         // Get updated credits
//         const updatedUser = await getQuery("SELECT credits FROM users WHERE id = ?", [userId]);

//         res.status(200).json({ success: true, remaining_credits: updatedUser.credits });
//     } catch (error) {
//         console.error("Credit Deduction Error:", error);
//         return { error: "Error while deducting credits" };
//     }
// };

// Deduct 1 Credit for Scanning
const deductCredits = async (req, res) => {
    try {
        const userId = req.user.id; // Extract user ID from request
        console.log("🔹 User ID extracted:", userId);

        // Get current user credits
        const user = await getQuery("SELECT credits FROM users WHERE id = ?", [userId]);

        if (!user) {
            console.error(` No user found with ID ${userId}`);
            return res.status(404).json({ error: "User not found" });
        }

        if (user.credits < 1) {
            return res.status(400).json({ error: "Insufficient credits. Please request more credits." });
        }

        // Deduct one credit
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

// Admin manually sets user credits
const setCredits = async (req, res) => {
    const { userId } = req.params;
    const { credits } = req.body;

    if (!Number.isInteger(credits) || credits < 0 || credits > 20) {
        return res.status(400).json({ error: "Invalid credit amount. Must be between 0 and 20." });
    }

    try {
        await updateUser("UPDATE users SET credits = ? WHERE id = ?", [credits, userId]);
        res.json({ message: `Credits set to ${credits} for user ${userId}.` });
    } catch (error) {
        res.status(500).json({ error: "Database error. Could not update credits." });
    }
};

module.exports = {
    deductCredits,
    requestCredits,
    approveCreditRequest, 
    setCredits
};
