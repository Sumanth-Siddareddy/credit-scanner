const db = require("../config/database");
const cron = require("node-cron");
const { promisify } = require("util");

const getAllUsers = promisify(db.all).bind(db);
const updateUser = promisify(db.run).bind(db);

// Function to reset daily credits at midnight (IST)
const resetDailyCredits = async () => {
    try {
        const currentDate = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }).split(",")[0];

        const users = await getAllUsers("SELECT id, credits, last_credit_update FROM users");

        for (const user of users) {
            if (user.last_credit_update !== currentDate) {
                await updateUser("UPDATE users SET credits = 20, last_credit_update = ? WHERE id = ?", 
                                [currentDate, user.id]);
            }
        }

        console.log("Daily credits reset successfully at midnight (IST)");
    } catch (error) {
        console.error("Error resetting credits:", error);
    }
};

// Schedule the function to run at 00:00 IST every day
cron.schedule("0 0 * * *", async () => {
    console.log("Running daily credit reset...");
    await resetDailyCredits();
}, {
    scheduled: true,
    timezone: "Asia/Kolkata"
});

module.exports = { resetDailyCredits };
