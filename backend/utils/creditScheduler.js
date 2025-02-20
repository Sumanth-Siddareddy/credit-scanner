const db = require("../config/database");
const { promisify } = require("util");

const getAllUsers = promisify(db.all).bind(db);
const updateUser = promisify(db.run).bind(db);

// Function to reset daily credits
const resetDailyCredits = async () => {
    try {
        const currentDate = new Date().toISOString().split("T")[0]; // Get today's date
        const users = await getAllUsers("SELECT id, credits, last_credit_update FROM users");

        for (const user of users) {
            if (user.last_credit_update !== currentDate) {
                await updateUser("UPDATE users SET credits = 20 , last_credit_update = ? WHERE id = ?", 
                                [currentDate, user.id]);
            }
        }

        console.log("Daily credits reset successfully at midnight!");
    } catch (error) {
        console.error("Error resetting credits:", error);
    }
};

module.exports = { resetDailyCredits };
