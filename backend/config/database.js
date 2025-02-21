const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database(path.join(__dirname, "../database.sqlite"), (err) => {
  if (err) {
    console.error("Error connecting to SQLite:", err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});



db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
    if (err) {
      throw err;
    }
    console.log("Tables in database:", rows.map(row => row.name));
});
  
// db.close(); - this will terminate the connection while connecting with server and request to send / get data

module.exports = db;
