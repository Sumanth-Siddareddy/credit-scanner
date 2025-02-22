const express = require("express");
const { authenticateUser } = require("../middleware/authMiddleware");
const { deductCredits, requestCredits } = require("../controllers/creditController");

const creditRouter = express.Router();

// View Credits
creditRouter.get("/balance", authenticateUser, (req, res) => {
    res.json({ credits: req.user.credits });
});

// Deduct Credits for Scanning
creditRouter.post("/deduct", authenticateUser, deductCredits);

// Request More Credits
creditRouter.post("/request", authenticateUser, requestCredits);

module.exports = creditRouter;
