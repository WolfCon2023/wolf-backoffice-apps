const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Serve React build files correctly
app.use(express.static(path.join(__dirname, "build")));

// Serve `index.html` for all routes to enable React routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Set the correct port
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Frontend Server running on port ${port}`));
