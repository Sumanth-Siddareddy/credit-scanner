const express = require("express");
const { authenticateUser, authorizeAdmin } = require("../middleware/authMiddleware");
const { deductCredits, requestCredits, approveCreditRequest, setCredits } = require("../controllers/creditController");

const creditRouter = express.Router();

// View Credits
creditRouter.get("/balance", authenticateUser, async (req, res) => {
    try {
        res.json({ credits: req.user.credits });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Deduct Credits for Scanning
// console.log(" call credits deducted sumanth!!!!!!!");
creditRouter.post("/deduct", authenticateUser, deductCredits);

// Request More Credits
creditRouter.post("/request", authenticateUser, requestCredits);

// Admin Approves Credit Requests
creditRouter.post("/approve/:userId", authenticateUser, authorizeAdmin, approveCreditRequest);

// Admin Manually Sets User Credits
creditRouter.post("/set/:userId", authenticateUser, authorizeAdmin, setCredits);

module.exports = creditRouter;
