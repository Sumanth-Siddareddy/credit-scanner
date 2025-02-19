const jwt = require("jsonwebtoken");

// "your_jwt_token_here"
const token =  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InVzZXIiLCJpYXQiOjE3Mzk5ODk1NTQsImV4cCI6MTc0MDA3NTk1NH0.hOGcjEBVSTNq3aMUC0GXB4ESNpZoOHkNV5XlwN-y9_M";
const decoded = jwt.decode(token);

const issuedAt = new Date(decoded.iat * 1000);
const expiresAt = new Date(decoded.exp * 1000);

console.log("Decoded JWT:", decoded);
console.log("User id:", decoded.id);
console.log("User role :", decoded.role);
console.log("Issued At:", issuedAt.toUTCString());  
console.log("Expires At:", expiresAt.toUTCString());  

