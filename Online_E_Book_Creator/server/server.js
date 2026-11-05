
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "3mb" }));

// Import routes
const bookRoutes = require("./routes/books");
const authRoutes = require("./routes/auth");
const aiRoutes = require("./routes/ai");

// Register routes
app.use("/api/books", bookRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);

console.log("AI ROUTES MOUNTED");

// Home route
app.get("/", (req, res) => {
  res.send("Online E-Book Creator Backend is Running!");
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});



