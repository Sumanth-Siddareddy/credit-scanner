const express = require("express");
const { authenticateUser } = require("../middleware/authMiddleware");
const { matchDocuments, checkDuplicate } = require("../controllers/documentController");

const documentRoute = express.Router();

// Route for document matching
documentRoute.post("/match", authenticateUser, matchDocuments);

// Route for duplicate document checking
documentRoute.post("/check-duplicate", authenticateUser, checkDuplicate);

module.exports = documentRoute;
