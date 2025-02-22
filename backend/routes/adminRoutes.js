const express = require("express");
const { authenticateUser, authorizeAdmin } = require("../middleware/authMiddleware");
const {getDashboardStats, getPendingCreditRequests, approveCreditRequest, rejectCreditRequest, setCredits } = require("../controllers/adminController");

const adminRouter = express.Router();

// Admin Dashboard Stats
adminRouter.get("/dashboard", authenticateUser, authorizeAdmin, getDashboardStats);
adminRouter.get("/credit-requests", authenticateUser, authorizeAdmin, getPendingCreditRequests);
adminRouter.post("/approve/:userId", authenticateUser, authorizeAdmin, approveCreditRequest);
adminRouter.post("/reject/:userId", authenticateUser, authorizeAdmin, rejectCreditRequest);
adminRouter.post("/set-credits/:userId", authenticateUser, authorizeAdmin, setCredits);

module.exports = adminRouter;

