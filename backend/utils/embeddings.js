const axios = require("axios");
require("dotenv").config();

const MAX_RETRIES = 5; // Increase retry attempts
const INITIAL_DELAY = 1000; // 1 second
const MAX_DELAY = 16000; // Max wait time

// Function for exponential backoff with jitter
const waitWithJitter = (delay) => new Promise((res) => setTimeout(res, delay + Math.random() * 500));

// Function to fetch OpenAI embeddings with improved retry logic
const fetchOpenAIEmbeddings = async (text, retries = 0, delay = INITIAL_DELAY) => {
    try {
        const response = await axios.post("https://api.openai.com/v1/embeddings", {
            input: text,
            model: "text-embedding-3-small",
            // text-embedding-3-small text-embedding-ada-002  text-embedding-3-large
            // if one model not works try another
        }, {
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY_PERSONAL}`,
                "Content-Type": "application/json"
            }
        });

        return response.data.data[0].embedding;
    } catch (error) {
        if (error.response && error.response.status === 429 && retries < MAX_RETRIES) {
            const nextDelay = Math.min(delay * 2, MAX_DELAY);
            console.warn(`Rate limited. Retrying in ${nextDelay / 1000} seconds...`);
            await waitWithJitter(nextDelay);
            return fetchOpenAIEmbeddings(text, retries + 1, nextDelay);
        }

        console.error("OpenAI Embedding Error:", error.message);
        return null;
    }
};

module.exports = { fetchOpenAIEmbeddings };
