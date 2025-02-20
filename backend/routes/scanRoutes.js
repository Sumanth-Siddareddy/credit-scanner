const express = require("express");
const multer = require("multer");
const { authenticateUser } = require("../middleware/authMiddleware");
const { scanDocument } = require("../controllers/scanController");

const scanRoute = express.Router();
const upload = multer({ dest: "uploads/" });

// Document Scanning Route
scanRoute.post("/scan", authenticateUser, upload.single("file"), scanDocument);

module.exports = scanRoute;
