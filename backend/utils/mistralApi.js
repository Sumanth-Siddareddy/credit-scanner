const axios = require("axios");

const MISTRAL_API_KEY = "your-mistral-api-key";  // Replace with actual key

// Function to call Mistral 7B API
const getMistralSimilarity = async (query, documents) => {
    try {
        const response = await axios.post(
            "https://api.mistral.ai/v1/embedding",
            { inputs: [query, ...documents] },
            { headers: { Authorization: `Bearer ${MISTRAL_API_KEY}` } }
        );

        const embeddings = response.data.data; // Extract embeddings
        const queryVector = embeddings[0];
        const documentVectors = embeddings.slice(1);

        // Compute cosine similarity
        const cosineSimilarity = (vecA, vecB) => {
            const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
            const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
            const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
            return dotProduct / (normA * normB);
        };

        const scores = documentVectors.map((vec, i) => ({
            text: documents[i],
            similarity: cosineSimilarity(queryVector, vec) * 100
        }));

        scores.sort((a, b) => b.similarity - a.similarity);
        return scores[0]; // Return best match
    } catch (error) {
        console.error("Mistral API Error:", error.message);
        return null; // API failure
    }
};

module.exports = { getMistralSimilarity };
