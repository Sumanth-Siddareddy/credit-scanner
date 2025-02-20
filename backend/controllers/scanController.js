const fs = require("fs");
const { promisify } = require("util");
const Tesseract = require("tesseract.js"); // OCR - Optical Character Recognition Library
const db = require("../config/database");
const { deductCredits } = require("./creditsController"); // Import deductCredits function

const getQuery = promisify(db.get).bind(db);

// Document Scanning Logic
exports.scanDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        // Check if user has enough credits
        const user = await getQuery("SELECT * FROM users WHERE id = ?", [req.user.id]);
        if (!user || user.credits < 1) {
            return res.status(400).json({ error: "Insufficient credits. Please request more credits." });
        }

        // Extract text from document
        const { data: { text } } = await Tesseract.recognize(req.file.path, "eng");

        // Check for matching keywords (Example: Invoice, Receipt, etc.)
        const matches = text.match(/\b(invoice|receipt|bill|contract)\b/gi);
        const response = matches
            ? { message: "Document scanned successfully", extracted_text: text, matches }
            : { message: "No relevant keywords found", extracted_text: text };

        // Deduct 1 credit by calling the existing function
        await deductCredits(req, res);

        // Delete uploaded file after scanning
        fs.unlinkSync(req.file.path);

        // Send response after successful scan and credit deduction
        res.json(response);

    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};
