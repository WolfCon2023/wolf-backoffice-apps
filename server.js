const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Ensure proper resolution of `__dirname`
const dirName = path.resolve();

// Serve React build files correctly
app.use(express.static(path.join(dirName, "build")));

// Serve `index.html` for all routes to enable React routing
app.get("*", (req, res) => {
  res.sendFile(path.join(dirName, "build", "index.html"), (err) => {
    if (err) {
      console.error("Error serving index.html:", err);
      res.status(500).send("Error loading frontend.");
    }
  });
});

// Set the correct port
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Frontend Server running on port ${port}`));
