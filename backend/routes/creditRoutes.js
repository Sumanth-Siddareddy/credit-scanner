const express = require("express");
const { authenticateUser, authorizeAdmin } = require("../middleware/authMiddleware");
const { deductCredits, requestCredits, approveCreditRequest } = require("../controllers/creditController");

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
creditRouter.post("/deduct", authenticateUser, deductCredits);

// Request More Credits
creditRouter.post("/request", authenticateUser, requestCredits);

// Admin Approves Credit Requests
creditRouter.post("/approve/:userId", authenticateUser, authorizeAdmin, approveCreditRequest);

module.exports = creditRouter;
