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
        if (user.role === "admin") {
            console.log("Admin scanning - skipping credit deduction.");
        } else if (!user || user.credits < 1) {
            return res.status(400).json({ error: "Insufficient credits. Please request more credits." });
        }        

        const filePath = req.file.path;
        const fileExtension = req.file.originalname.split(".").pop().toLowerCase();
        let extractedText = "";

        // to verify the extracted text
        // console.log("Extracting text from:", filePath);

        // Choose extraction method based on file type
        if (fileExtension === "pdf") {
            extractedText = await extractTextFromPDF(filePath);
        } else if (fileExtension === "jpg" || fileExtension === "png") {
            extractedText = await extractTextFromImage(filePath);
        } else if (fileExtension === "docx") {
            extractedText = await extractTextFromDOCX(filePath);
        } else {
            return res.status(400).json({ error:{fileExtension} +' is unsupported file type for this application. Try pdf, jpg, png, docx filetypes.' });
        }
        
        // print extracted text
        //console.log("Extracted Text:", extractedText);
        // console.log("requested user id :".req.user.id)
        // console.log("Input file name :",req.file.originalname)
        // console.log("Extracted text : ",extractedText)
        
        // Insert the extracted text into the database
        // await insertQuery("INSERT INTO scans (user_id, filename, extracted_text) VALUES (?, ?, ?)", 
        //     [req.user.id, req.file.originalname, extractedText]);
        // inserting extracted text will be done in documentController.js
    

        // Deduct 1 credit & console.log(req.user); to check user details are feteched or not
        const creditResult = await deductCredits(req.user.id);
        // console.log(creditResult); to check does we get credit results after deducting
        const remainingCredits = creditResult.remaining_credits;
        if (creditResult.error) {
            return res.status(400).json({ error: creditResult.error });
        }

        const { matches, isDuplicate, similarityScore } = await findMatches(extractedText);
        const response = {
            message: "Document scanned successfully",
            extracted_text: extractedText,  // Display extracted text
            matches: matches,               // Highlight matched words
            match_status: isDuplicate ? "Document already exists" : "New document",
            similarity_score: similarityScore, // Display similarity score if duplicate
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
