const fs = require("fs");
const { promisify } = require("util");
const Tesseract = require("tesseract.js"); // OCR - Optical Character Recognition Library
const db = require("../config/database");
const { deductCredits } = require("./creditController"); // Import deductCredits function

const getQuery = promisify(db.get).bind(db);

// Document Scanning Logic
const scanDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        // check does file is recieved or not
        res.json({ message: "File received", filename: req.file.filename });

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

        // Send response after successful scan and credit deduction
        res.json(response);

        // Deduct 1 credit by calling the existing function
        await deductCredits(req, res);

    } catch (error) {
        console.error("Scan Error: ",error);
        res.status(500).json({ error: "Internal server error" });
    }finally {
        // Always delete the uploaded file to avoid storage issues
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
    }
};

module.exports = { scanDocument };