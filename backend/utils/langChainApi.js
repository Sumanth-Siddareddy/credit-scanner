const axios = require("axios");
const { cosineSimilarity } = require("./cosineSimilarity");
const { fetchOpenAIEmbeddings } = require("./embeddings");
const config = require("../config");

const LANGCHAIN_API_URL = config.LANGCHAIN_API_URL;
const MAX_RETRIES = 5; // Increased retries for better resilience
const INITIAL_DELAY = 1000; // 1 second
const MAX_DELAY = 16000; // 16 seconds max wait

// Function for exponential backoff with jitter
const waitWithJitter = (delay) => new Promise((res) => setTimeout(res, delay + Math.random() * 500));

// Function to get embeddings with retries and fallback
const getEmbedding = async (text, retries = 0, delay = INITIAL_DELAY) => {
    try {
        const response = await axios.post(`${LANGCHAIN_API_URL}/embed`, { text });
        return response.data.embedding;
    } catch (error) {
        console.error(`LangChain API Error (Attempt ${retries + 1}):`, error.message);

        if (error.response && (error.response.status === 429 || error.response.status === 500) && retries < MAX_RETRIES) {
            const nextDelay = Math.min(delay * 2, MAX_DELAY); // Exponential backoff with cap
            console.warn(`Retrying in ${nextDelay / 1000} seconds...`);
            await waitWithJitter(nextDelay);
            return getEmbedding(text, retries + 1, nextDelay);
        }

        console.error("LangChain API failed after retries. Falling back to OpenAI embeddings.");
        return await fetchOpenAIEmbeddings(text);
    }
};

// Function to calculate similarity between query and documents
const getLangchainSimilarity = async (query, documents) => {
    try {
        const queryEmbedding = await getEmbedding(query);
        if (!queryEmbedding) throw new Error("Failed to obtain query embedding");

        const documentEmbeddings = await Promise.all(documents.map(async (doc) => {
            const embedding = await getEmbedding(doc);
            if (!embedding) console.warn(`Failed to get embedding for document: ${doc}`);
            return embedding;
        }));

        // Compute cosine similarity
        const scores = documentEmbeddings.map((vec, i) => vec ? {
            text: documents[i],
            similarity: cosineSimilarity(queryEmbedding, vec) * 100,
        } : null).filter(Boolean);

        // Sort by similarity and return the best match
        scores.sort((a, b) => b.similarity - a.similarity);
        return scores.length > 0 ? scores[0] : null;
    } catch (error) {
        console.error("LangChain Similarity Error:", error.message);
        return null;
    }
};

// Function to call LangChain API for topic extraction
const getLangchainTopics = async (text) => {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await axios.post(`${LANGCHAIN_API_URL}/topics`, { text });
            return response.data;
        } catch (error) {
            console.error(`LangChain API Topics Error (Attempt ${attempt}):`, error.message);
            if (attempt < MAX_RETRIES) {
                const nextDelay = Math.min(INITIAL_DELAY * Math.pow(2, attempt), MAX_DELAY);
                console.warn(`Retrying in ${nextDelay / 1000} seconds...`);
                await waitWithJitter(nextDelay);
            } else {
                console.error("LangChain API Topics failed after retries.");
                return null;
            }
        }
    }
};

module.exports = { getLangchainSimilarity, getLangchainTopics };
