const jwt = require("jsonwebtoken");

// "your_jwt_token_here"
const token =  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Mywicm9sZSI6InVzZXIiLCJpYXQiOjE3NDAxMjM3MjMsImV4cCI6MTc0MDIxMDEyM30.FVPr65marybo96zqdBGsQgr8WLRy24UwrBxSGfOo6ZI";
const decoded = jwt.decode(token);

const issuedAt = new Date(decoded.iat * 1000);
const expiresAt = new Date(decoded.exp * 1000);

console.log("Decoded JWT:", decoded);
console.log("User id:", decoded.id);
console.log("User role :", decoded.role);
console.log("Issued At:", issuedAt.toUTCString());  
console.log("Expires At:", expiresAt.toUTCString());  

