const fs = require("fs");
const { promisify } = require("util");
const db = require("../config/database");

const getUserScans = promisify(db.all).bind(db);

// Export user scan history
const exportUserScans = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Fetch user's scan history
        const scans = await getUserScans(
            "SELECT filename, extracted_text, created_at FROM scans WHERE user_id = ?", 
            [userId]
        );

        if (scans.length === 0) {
            return res.status(404).json({ error: "No scan history found" });
        }

        // Format as CSV
        let csvData = "Filename,Extracted Text,Date\n";
        scans.forEach(scan => {
            csvData += `"${scan.filename}","${scan.extracted_text.replace(/"/g, '""')}","${scan.created_at}"\n`;
        });

        // Write to a temporary file
        const filePath = `./exports/user_${userId}_scans.csv`;
        fs.writeFileSync(filePath, csvData);

        // Send file for download
        res.download(filePath, `scan_history_${userId}.csv`, () => {
            fs.unlinkSync(filePath); // Delete file after sending
        });

    } catch (error) {
        console.error("Export Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = { exportUserScans };
