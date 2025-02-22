const express = require("express");
const dotenv = require("dotenv");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.AI_API_PORT || 8000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY_PERSONAL;

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// OpenAI Embedding Function
const getOpenAIEmbedding = async (text) => {
    try {
        const response = await axios.post(
            "https://api.openai.com/v1/embeddings",
            {
                input: text,
                model: "text-embedding-ada-002",
            },
            {
                headers: {
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );
        return response.data.data[0].embedding;
    } catch (error) {
        console.error("OpenAI Embedding Error:", error.message);
        return null;
    }
};

// API Endpoint to Get Embeddings
app.post("/embed", async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    const embedding = await getOpenAIEmbedding(text);
    if (!embedding) return res.status(500).json({ error: "Failed to generate embedding" });

    res.json({ embedding });
});

// API Endpoint for Topic Extraction
app.post("/topics", async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    try {
        const response = await axios.post(
            "https://api.openai.com/v1/completions",
            {
                model: "gpt-4",
                prompt: `Extract key topics from the following text:\n"${text}"\n\nTopics:`,
                max_tokens: 50,
            },
            {
                headers: {
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        res.json({ topics: response.data.choices[0].text.trim() });
    } catch (error) {
        console.error("OpenAI Topic Extraction Error:", error.message);
        res.status(500).json({ error: "Failed to extract topics" });
    }
});

// Start the LangChain API Server
app.listen(PORT, () => {
    console.log(`LangChain API running at http://localhost:${PORT}`);
});



const fetchOpenAIEmbeddings = async (text, retries = 3, delay = 1000) => {
    try {
        const response = await axios.post("https://api.openai.com/v1/embeddings", {
            input: text,
            model: "text-embedding-ada-002",
        }, {
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        return response.data.data[0].embedding;
    } catch (error) {
        if (error.response && error.response.status === 429 && retries > 0) {
            console.warn(`Rate limited. Retrying in ${delay / 1000} seconds...`);
            await new Promise(res => setTimeout(res, delay));
            return fetchOpenAIEmbeddings(text, retries - 1, delay * 2); // Exponential backoff
        } else {
            console.error("OpenAI Embedding Error:", error.message);
            return null;
        }
    }
};

module.exports = { fetchOpenAIEmbeddings };

