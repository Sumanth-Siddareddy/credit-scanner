const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes");
const protectedRoutes = require("./routes/protected");
const creditRoutes = require("./routes/creditRoutes");
const scanRoutes = require("./routes/scanRoutes");
const cron = require("node-cron");
const { resetDailyCredits } = require("./utils/creditScheduler");


// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Schedule the credit reset job (Runs every day at 12:00 AM)
cron.schedule("0 0 * * *", () => {
  console.log("Running daily credit reset job...");
  resetDailyCredits();
});

// Routes
app.use("/auth", authRoutes);
app.use("/protected", protectedRoutes);
app.use("/credits", creditRoutes);
app.use("/api", scanRoutes);

app.get("/", (req, res) => {
  // This text will display on web screen to show that server is running
  res.send("Credit-Based Document Scanning System API is running...");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
