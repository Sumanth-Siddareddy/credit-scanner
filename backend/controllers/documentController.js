const { promisify } = require("util");
const db = require("../config/database");

const { getLangchainSimilarity } = require("../utils/langChainApi");
const { getLangchainTopics } = require("../utils/langChainApi");

const { findBestTfIdfMatch } = require("../utils/tfidfMatcher");

const getQuery = promisify(db.get).bind(db);
const allQuery = promisify(db.all).bind(db);
const runQuery = promisify(db.run).bind(db);

// Function to calculate similarity
const calculateSimilarity = (text1, text2) => {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = [...words1].filter(word => words2.has(word)).length;
    const union = words1.size + words2.size - intersection;

    return union === 0 ? 0 : Math.round((intersection / union) * 100);
};

// Save Scanned Document API
const saveDocument = async (req, res) => {
    try {
        const { extracted_text, filename, user_id } = req.body;

        if (!extracted_text || !filename || !user_id) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        let topic = null;
        let aiUsed = true;

        // Step 1: Try extracting topics using LangChain
        try {
            topic = await getLangchainTopics(extracted_text);
        } catch (error) {
            console.log("LangChain API failed, falling back to TF-IDF.");
            aiUsed = false;
        }


        // Step 2: Fallback to TF-IDF if Mistral fails
        if (!topic) {
            topic = extractTfIdfKeywords(extracted_text);
        }

        // Step 3: Store the document along with the extracted topic
        await runQuery(
            `INSERT INTO scans (user_id, filename, extracted_text, topic) VALUES (?, ?, ?, ?)`,
            [user_id, filename, extracted_text, topic]
        );

        return res.status(201).json({
            message: "Document saved successfully",
            topic,
            ai_used: aiUsed ? "Mistral 7B" : "TF-IDF (Fallback)"
        });

    } catch (error) {
        console.error("Error saving document:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Match Documents API
const matchDocuments = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: "No text provided for matching" });
        }

        // Fetch stored texts
        const existingDocs = await allQuery("SELECT extracted_text FROM scans");
        const documentTexts = existingDocs.map(doc => doc.extracted_text);

        let bestMatch;
        let aiUsed = true;

        // Try using LangChain API first
        bestMatch = await getLangchainSimilarity(text, documentTexts);
        if (!bestMatch) {
            console.log("LangChain API failed, falling back to TF-IDF.");
            bestMatch = findBestTfIdfMatch(text, documentTexts);
            aiUsed = false;
        }


        return res.json({
            best_match_text: bestMatch.text,
            similarity_score: bestMatch.similarity.toFixed(2),
            ai_used: aiUsed ? "Mistral 7B" : "TF-IDF (Fallback)",
            message: aiUsed ? "AI-based matching used" : "AI is down, fallback to TF-IDF"
        });

    } catch (error) {
        console.error("Matching Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Check Duplicate API
const checkDuplicate = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: "No text provided for duplicate check" });
        }

        const existingDocs = await allQuery("SELECT extracted_text FROM scans");
        const documentTexts = existingDocs.map(doc => doc.extracted_text);

        let bestMatch = await getLangchainSimilarity(text, documentTexts);
        let aiUsed = true;

        if (!bestMatch) {
            console.log("LangChain API failed, falling back to TF-IDF.");
            bestMatch = findBestTfIdfMatch(text, documentTexts);
            aiUsed = false;
        }

        const isDuplicate = bestMatch.similarity >= 90;

        return res.json({
            isDuplicate,
            similarityScore: bestMatch.similarity.toFixed(2),
            ai_used: aiUsed ? "Mistral 7B" : "TF-IDF (Fallback)",
            message: aiUsed ? "AI-based check used" : "AI is down, fallback to TF-IDF"
        });

    } catch (error) {
        console.error("Duplicate Check Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = { matchDocuments, checkDuplicate, saveDocument };
