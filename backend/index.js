const express = require("express");
const cors = require("cors");
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Test API route
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is working!" });
});

// Start server
app.listen(3001, () => {
  console.log("Backend running on http://localhost:3001");
});
