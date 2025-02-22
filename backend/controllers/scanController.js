const fs = require("fs");
const { promisify } = require("util");
const mammoth = require("mammoth"); // Docs text extraction
const pdfParse = require("pdf-parse"); // PDF text extraction
const Tesseract = require("tesseract.js"); // OCR - Optical Character Recognition
const db = require("../config/database");
const { deductCredits } = require("./creditController"); // credit deduction

const getQuery = promisify(db.get).bind(db);
const insertQuery = promisify(db.run).bind(db);

// Function to extract text from Docs
const extractTextFromDOCX = async (filePath) => {
    const { value } = await mammoth.extractRawText({ path: filePath });
    return value;
};

// Function to extract text from PDFs
const extractTextFromPDF = async (filePath) => {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);

        if (!pdfData.text.trim()) {
            console.log("PDF is scanned (image-based), using OCR...");
            return await extractTextFromImage(filePath); // OCR fallback
        }

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

// calculate similarity of input document and exsisting one
const calculateSimilarity = (text1, text2) => {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = [...words1].filter(word => words2.has(word)).length;
    const union = words1.size + words2.size - intersection;

    return union === 0 ? 0 : Math.round((intersection / union) * 100);
};


// Matching Function
const findMatches = async (text) => {
    try {
        const keywords = ["invoice", "receipt", "bill", "contract","story", "programming", "fees", "fine", "dues", "order"]; // Predefined keywords
        const matches = text.match(new RegExp(`\\b(${keywords.join("|")})\\b`, "gi")) || [];

        // Fetch all stored texts from the database
        const existingDocs = await getQuery("SELECT extracted_text FROM scans");
        let bestMatch = { text: "", similarity: 0 };

        // Compute similarity for each document
        existingDocs.forEach((doc) => {
            const similarity = calculateSimilarity(text, doc.extracted_text);
            if (similarity > bestMatch.similarity) {
                bestMatch = { text: doc.extracted_text, similarity };
            }
        });

        const isDuplicate = bestMatch.similarity >= 90; // Consider duplicate if similarity >= 90%

        return { matches, isDuplicate, similarityScore: bestMatch.similarity };
    } catch (error) {
        console.error("Matching Error:", error);
        return { matches: [], isDuplicate: false, similarityScore: 0 };
    }
};

const getScansByUserId = async (req, res) => {
    try {
        const { user_id } = req.query; // Get user_id from query parameters

        if (!user_id) {
            return res.status(400).json({ error: "User ID is required" });
        }

        // Fetch scans for the specified user
        const scans = await getQuery("SELECT * FROM scans WHERE user_id = ?", [user_id]);

        res.json({ scans });
    } catch (error) {
        console.error("Error fetching scans:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


// Document Scanning Logic
const scanDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        // Get user details and check credits
        const user = await getQuery("SELECT * FROM users WHERE id = ?", [req.user.id]);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.role !== "admin" && user.credits < 1) {
            return res.status(400).json({ error: "Insufficient credits. Please request more credits." });
        }

        const filePath = req.file.path;
        const fileExtension = req.file.originalname.split(".").pop().toLowerCase();
        let extractedText = "";

        // Choose extraction method based on file type
        if (fileExtension === "pdf") {
            extractedText = await extractTextFromPDF(filePath);
        } else if (["jpg", "png"].includes(fileExtension)) {
            extractedText = await extractTextFromImage(filePath);
        } else if (fileExtension === "docx") {
            extractedText = await extractTextFromDOCX(filePath);
        } else {
            return res.status(400).json({ error: `${fileExtension} is an unsupported file type. Try pdf, jpg, png, docx.` });
        }

        console.log("Extracted Text:", extractedText);

        // **Extract keywords & match document**
        const { matches, isDuplicate, similarityScore } = await findMatches(extractedText);
        const keywords = matches.join(", "); // Store keywords as comma-separated string
        const matchStatus = isDuplicate ? "duplicate" : "unique"; // Store match status

        // **Determine topic** (can be based on keywords or extracted text logic)
        let topic = "General"; // Default topic
        if (matches.length > 0) {
            topic = matches[0]; // Assign first matched keyword as topic (can be improved)
        }

        // **Insert extracted text, metadata into DB**
        await insertQuery(
            `INSERT INTO scans (user_id, filename, extracted_text, keywords, match_status, topic) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [req.user.id, req.file.originalname, extractedText, keywords, matchStatus, topic]
        );

        // Deduct 1 credit if user is not an admin
        if (user.role !== "admin") {
            const creditResult = await deductCredits(req, res);
            if (creditResult.error) {
                return res.status(400).json({ error: creditResult.error });
            }
        }

        // **Prepare response**
        const response = {
            message: "Document scanned successfully",
            extracted_text: extractedText,
            keywords: matches,
            topic: topic,
            match_status: matchStatus,
            similarity_score: similarityScore,
            remaining_credits: user.role === "admin" ? "Admin (unlimited)" : user.credits - 1
        };

        res.json(response);

    } catch (error) {
        console.error("Scan Error:", error);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        // Cleanup: Delete uploaded file after processing
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
            console.log("Deleted uploaded file:", req.file.path);
        }
    }
};

module.exports = { scanDocument, getScansByUserId };
