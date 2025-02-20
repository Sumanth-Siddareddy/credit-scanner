const { promisify } = require("util");
const db = require("../config/database");

const getQuery = promisify(db.get).bind(db);
const allQuery = promisify(db.all).bind(db);

// Function to calculate similarity
const calculateSimilarity = (text1, text2) => {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = [...words1].filter(word => words2.has(word)).length;
    const union = words1.size + words2.size - intersection;

    return union === 0 ? 0 : Math.round((intersection / union) * 100);
};

// **Match Documents API**
const matchDocuments = async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: "No text provided for matching" });
        }

        // Fetch all stored texts from the database
        const existingDocs = await allQuery("SELECT extracted_text FROM scans");
        let bestMatch = { text: "", similarity: 0 };

        // Compute similarity for each document
        existingDocs.forEach((doc) => {
            const similarity = calculateSimilarity(text, doc.extracted_text);
            if (similarity > bestMatch.similarity) {
                bestMatch = { text: doc.extracted_text, similarity };
            }
        });

        return res.json({ best_match_text: bestMatch.text, similarity_score: bestMatch.similarity });

    } catch (error) {
        console.error("Matching Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// **Check Duplicate API**
const checkDuplicate = async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: "No text provided for duplicate check" });
        }

        // Fetch all stored texts from the database
        const existingDocs = await allQuery("SELECT extracted_text FROM scans");
        let isDuplicate = false;
        let similarityScore = 0;

        for (const doc of existingDocs) {
            const similarity = calculateSimilarity(text, doc.extracted_text);
            if (similarity >= 90) { // Threshold for duplicate
                isDuplicate = true;
                similarityScore = similarity;
                break;
            }
        }

        return res.json({ isDuplicate, similarityScore });

    } catch (error) {
        console.error("Duplicate Check Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = { matchDocuments, checkDuplicate };
