const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes");
const protectedRoutes = require("./routes/protected");
const creditRoutes = require("./routes/creditRoutes");
const scanRoutes = require("./routes/scanRoutes");
// const cron = require("node-cron");
const adminRoutes = require("./routes/adminRoutes");
const documentRoutes = require("./routes/documentRoutes");
const { resetDailyCredits } = require("./utils/creditScheduler");
const userRoutes = require("./routes/userRoutes");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.setHeader('Connection', 'close');
  next();
});


// Schedule the credit reset job (Runs every day at 12:00 AM IST)
// Start credit reset function at server startup
resetDailyCredits();

// Routes
app.use("/auth", authRoutes);
app.use("/protected", protectedRoutes);
app.use("/credits", creditRoutes);
app.use("/api", scanRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes); // GET /api/user/export-scans is actual endpoint
app.use("/api/scan", scanRoutes);
app.use("/api/documents", documentRoutes); 
// for /documents/match need to first login and given respective token than only it wil work

app.get("/", (req, res) => {
  // This text will display on web screen to show that server is running
  res.send("Credit-Based Document Scanning System API is running...");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app; // export app for testing
