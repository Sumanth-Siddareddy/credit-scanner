const express = require("express");
const app = express();
const path = require("path");

app.use(express.static(path.join(__dirname, "frontend/public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "/public", "login.html"));
});

app.listen(3000, () => {
    console.log("Frontend running at http://localhost:3000/");
});
