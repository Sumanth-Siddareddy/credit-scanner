const natural = require("natural");

// Function to compute TF-IDF vectors
const computeTfIdf = (documents) => {
    const tfidf = new natural.TfIdf();
    documents.forEach((doc) => tfidf.addDocument(doc));
    return tfidf;
};

// Function to compute cosine similarity
const computeSimilarity = (query, documents) => {
    const tfidf = computeTfIdf(documents);
    const scores = [];

    tfidf.tfidfs(query, (i, measure) => {
        scores.push({ index: i, score: measure });
    });

    // Sort results by highest similarity score
    scores.sort((a, b) => b.score - a.score);
    return scores;
};

// Function to find the best match using TF-IDF
const findBestTfIdfMatch = (query, documents) => {
    const similarityScores = computeSimilarity(query, documents);
    if (similarityScores.length === 0 || similarityScores[0].score === 0) {
        return { text: "", similarity: 0 };
    }
    return { text: documents[similarityScores[0].index], similarity: similarityScores[0].score };
};

module.exports = { findBestTfIdfMatch };
