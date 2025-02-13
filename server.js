const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Ensure React static files are served correctly
app.use(express.static(path.join(__dirname, "build")));

// ✅ Serve React index.html for all unknown routes
//app.get('*', function (req, res) {
  //const index = path.join(__dirname, 'build', 'index.html');
  //res.sendFile(index);
//});

app.get('*', function (req, res) {
  res.sendFile('index.html');
});

// ✅ Set port for Railway
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`🚀 Frontend Server running on port ${port}`));
