const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Ensure proper resolution of base directory
const dirName = path.resolve();

// Serve React build files from `/app/build` instead of `/app/public`
const buildPath = path.join(dirName, "build");
app.use(express.static(buildPath));

// Serve `index.html` for all routes (Enable React Routing)
app.get("*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"), (err) => {
    if (err) {
      console.error("❌ Error serving index.html:", err);
      res.status(500).send("Error loading frontend.");
    }
  });
});

// Set the correct port for Railway
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`🚀 Frontend Server running on port ${port}`));
