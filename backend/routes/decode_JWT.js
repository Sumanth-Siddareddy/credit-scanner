const jwt = require("jsonwebtoken");

// "your_jwt_token_here"
const token =  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc0MDEyOTYwOSwiZXhwIjoxNzQwMjE2MDA5fQ.Yz-OooQH2tWGh-aZUNk-awH4zJrLdqFFcm73vQm3vXM"
const decoded = jwt.decode(token);

const issuedAt = new Date(decoded.iat * 1000);
const expiresAt = new Date(decoded.exp * 1000);

console.log("Decoded JWT:", decoded);
console.log("User id:", decoded.id);
console.log("User role :", decoded.role);
console.log("Issued At:", issuedAt.toUTCString());  
console.log("Expires At:", expiresAt.toUTCString());  

