require("dotenv").config();

const config = {
    PORT: process.env.PORT || 5000,
    AI_API_PORT: process.env.AI_API_PORT || 8000,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY_PERSONAL,
    LANGCHAIN_API_URL: "http://localhost:8000"
};

module.exports = config;
