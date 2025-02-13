const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Set correct path for serving frontend
const buildPath = path.join(__dirname, "build");
console.log("Serving frontend from:", buildPath);

// Ensure `build/` exists before running
app.use(express.static(buildPath));

// Serve `index.html` for all routes (Enable React Routing)
app.get("*", (req, res) => {
  const indexPath = path.join(buildPath, "index.html");

  console.log(`✅ Attempting to serve: ${indexPath}`);

  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error("Error serving index.html:", err);
      res.status(500).send("Error loading frontend.");
    }
  });
});

// Use Railway's assigned PORT
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Frontend Server running on port ${port}`));
