const fs = require("fs");
const { promisify } = require("util");
const pdfParse = require("pdf-parse"); // PDF text extraction
const Tesseract = require("tesseract.js"); // OCR - Optical Character Recognition
const db = require("../config/database");
const { deductCredits } = require("./creditController"); // Import credit deduction

const getQuery = promisify(db.get).bind(db);
const insertQuery = promisify(db.run).bind(db);

// Function to extract text from PDFs
const extractTextFromPDF = async (filePath) => {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);
        return pdfData.text;
    } catch (error) {
        console.error("PDF Parsing Error:", error);
        return "";
    }
};

// Function to extract text from images using OCR
const extractTextFromImage = async (filePath) => {
    try {
        const { data: { text } } = await Tesseract.recognize(filePath, "eng");
        return text;
    } catch (error) {
        console.error("OCR Error:", error);
        return "";
    }
};

// Document Scanning Logic
const scanDocument = async (req, res) => {
    try {
        // to ckeck file is received or not
        // console.log("Request received for document scan");
        // console.log("Uploaded File:", req.file);

        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        // Get user details and check credits
        const user = await getQuery("SELECT * FROM users WHERE id = ?", [req.user.id]);
        if (!user || user.credits < 1) {
            return res.status(400).json({ error: "Insufficient credits. Please request more credits." });
        }

        const filePath = req.file.path;
        const fileExtension = req.file.originalname.split(".").pop().toLowerCase();
        let extractedText = "";

        // to verify the extracted text
        // console.log("Extracting text from:", filePath);

        // Choose extraction method based on file type
        if (fileExtension === "pdf") {
            // console.log("Processing PDF file...");
            extractedText = await extractTextFromPDF(filePath);
        } else {
            // console.log("Processing image file...");
            extractedText = await extractTextFromImage(filePath);
        }
        
        // Insert the extracted text into the database
        await insertQuery("INSERT INTO scans (user_id, filename, extracted_text) VALUES (?, ?, ?)", 
            [req.user.id, req.file.originalname, extractedText]);
        // console.log("requested user id :".req.user.id)
        // console.log("Input file name :",req.file.originalname)
        // console.log("Extracted text : ",extractedText)
        
        
        // print extracted text
        //console.log("Extracted Text:", extractedText);

        // Deduct 1 credit
        // console.log(req.user); to check user details are feteched or not
        const creditResult = await deductCredits(req.user.id);
        // console.log(creditResult); to check does we get credit results after deducting
        const remainingCredits = creditResult.remaining_credits;
        if (creditResult.error) {
            return res.status(400).json({ error: creditResult.error });
        }

        // Check for matching keywords (Invoice, Receipt, Bill, Contract)
        const matches = extractedText.match(/\b(invoice|receipt|bill|contract)\b/gi);
        const response = {
            message: "Document scanned successfully",
            extracted_text: extractedText,
            matches: matches || [],
            remaining_credits: creditResult.remaining_credits
        };

        // Send response
        res.json(response);

    } catch (error) {
        console.error("Scan Error:", error);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        // Always delete the uploaded file to prevent storage issues
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
            console.log("Deleted uploaded file:", req.file.path);
        }
    }
};

module.exports = { scanDocument };
