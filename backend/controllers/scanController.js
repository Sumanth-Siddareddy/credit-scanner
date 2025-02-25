const fs = require("fs");
const { promisify } = require("util");
const mammoth = require("mammoth"); // Docs text extraction
const pdfParse = require("pdf-parse"); // PDF text extraction
const Tesseract = require("tesseract.js"); // OCR - Optical Character Recognition
const db = require("../config/database");
const { deductCredits } = require("./creditController"); // credit deduction
const jwt = require("jsonwebtoken");

const getQuery = promisify(db.get).bind(db);
const insertQuery = promisify(db.run).bind(db);
const getAllQuery = promisify(db.all).bind(db); // Use db.all() for multiple rows

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

// Function to extract text from TXT files
const extractTextFromTXT = async (filePath) => {
    try {
        return fs.readFileSync(filePath, "utf8");
    } catch (error) {
        console.error("TXT File Reading Error:", error);
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
const sanitizeText = (text) => {
    return text.replace(/[^\w\s]/gi, ""); // Remove special characters
};

const findMatches = async (text, userId) => {
    try {
        const sanitizedText = sanitizeText(text.toLowerCase());
        
        const keywords = ["invoice", "receipt", "bill", "contract", "diet", "nutrition",
                         "exercise", "sports", "workout", "finance", "money", "tax", 
                         "entertainment", "thecnical", "AI", "ML", "deep learning",
                        "rating", "travel", "plans", "routine", "fitness", "reading",
                         "writing", "learning"]; // Expand keywords
        const matches = sanitizedText.match(new RegExp(`\\b(${keywords.join("|")})\\b`, "gi")) || [];
        
        console.log("Sanitized Text:", sanitizedText);
        console.log("Matches Found:", matches);
        console.log("scanning user ID : ",userId);
        const existingDocs = await getAllQuery("SELECT id, extracted_text FROM scans WHERE user_id = ?", [userId]);
        let bestMatch = { text: "", similarity: 0 };
        // console.log("number of Exsisting scans  in scans table : ",existingDocs.length);
        existingDocs.forEach((doc) => {
            const similarity = calculateSimilarity(sanitizedText, sanitizeText(doc.extracted_text));
            if (similarity > bestMatch.similarity) {
                bestMatch = { text: doc.extracted_text, similarity };
            }
        });

        const isDuplicate = bestMatch.similarity >= 70;

        return { matches, isDuplicate, similarityScore: bestMatch.similarity };
    } catch (error) {
        console.error("Matching Error:", error);
        return { matches: [], isDuplicate: false, similarityScore: 0 };
    }
};


const getScansByUserId = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader.split(" ")[1]; 
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token
        const user_id = decoded.id; 
        if (!user_id) {
            return res.status(400).json({ error: "User ID is required" });
        }

        // Fetch scans for the specified user
        const scans = await getAllQuery("SELECT * FROM scans WHERE user_id = ?", [user_id]);
        // console.log("scan controller : ", scans);
        res.json(scans);
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

        const user = await getQuery("SELECT * FROM users WHERE id = ?", [req.user.id]);
        console.log("USer with user id = ",req.user.id, "send scan request.");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.role !== "admin" && user.credits < 1) {
            return res.status(400).json({ error: "Insufficient credits. Please request more credits." });
        }

        const filePath = req.file.path;
        const fileExtension = req.file.originalname.split(".").pop().toLowerCase();
        let extractedText = "";

        if (fileExtension === "pdf") {
            extractedText = await extractTextFromPDF(filePath);
        } else if (["jpg", "png"].includes(fileExtension)) {
            extractedText = await extractTextFromImage(filePath);
        } else if (fileExtension === "docx") {
            extractedText = await extractTextFromDOCX(filePath);
        } else if (fileExtension === "txt"){
            extractedText = await extractTextFromTXT(filePath);
        } else {
            return res.status(400).json({ error: `${fileExtension} is an unsupported file type.` });
        }

        const { matches, isDuplicate, similarityScore } = await findMatches(extractedText, req.user.id);
        const keywords = matches.join(", ");
        const matchStatus = isDuplicate ? "duplicate" : "unique";
        let topic = matches.length > 0 ? matches[0] : "General";

        await insertQuery(
            `INSERT INTO scans (user_id, filename, extracted_text, keywords, match_status, topic) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [req.user.id, req.file.originalname, extractedText, keywords, matchStatus, topic]
        );

        if (user.role !== "admin") {
            const creditResult = await deductCredits(req, res);
            if (creditResult.error) {
                return res.status(400).json({ error: creditResult.error });
            }
        }
        
        const response = {
            message: "Document scanned successfully",
            extracted_text: extractedText,
            keywords: matches,
            topic: topic,
            match_status: matchStatus,
            similarity_score: similarityScore,
            remaining_credits: user.role === "admin" ? "Admin (unlimited)" : user.credits - 1
        };
        // console.log("TO check header sent of admin : ",res.headersSent);
        // console.log(response);
        if (!res.headersSent) {
            res.json(response);
        }

    } catch (error) {
        console.error("Scan Error:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal server error" });
        }
    } finally {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
    }
};


module.exports = { scanDocument, getScansByUserId };
