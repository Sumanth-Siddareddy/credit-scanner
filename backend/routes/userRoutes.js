const express = require("express");
const { authenticateUser } = require("../middleware/authMiddleware");
const { exportUserScans } = require("../controllers/userController");

const exportRouter = express.Router();

// Export user scan history
exportRouter.get("/export-scans", authenticateUser, exportUserScans);

module.exports = exportRouter;
