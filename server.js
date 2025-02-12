require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Serve React Frontend from `build/`
//app.use(express.static(path.join(__dirname, "build")));

// Serve the React development server's static files (without the build process)
app.use(express.static(path.join(__dirname, 'public')));  // Serve static assets directly

// Serve the app directly from the public directory without building
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Set the port for Railway (Use Railway-assigned port)
const port = process.env.PORT || 8080;

// Serve React Frontend (Assumes React was built into `build/` directory)
//app.use(express.static(path.join(__dirname, "build")));

// Catch-All Route to Serve React Frontend
//app.get("*", (req, res) => {
    //res.sendFile(path.join(__dirname, "build", "index.html"));
//});

// Start Express Server
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Frontend Server running on port ${port}`));
