const express = require("express");
const { authenticateUser, authorizeAdmin } = require("../middleware/authMiddleware");
const { getDashboardStats } = require("../controllers/adminController");

const router = express.Router();

// Admin Dashboard Route
router.get("/dashboard", authenticateUser, authorizeAdmin, getDashboardStats);

module.exports = router;
