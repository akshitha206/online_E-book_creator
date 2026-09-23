
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const bookroutes = require("./routes/bookroutes");
const authroutes = require("./routes/authroutes");


const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use("/api/auth", authroutes);
app.use("/api/books", bookroutes);

// Test route
app.get("/", (req, res) => {
    res.send("E-Book Creator Backend is Running!");
});

// Connect MongoDB
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected");

        app.listen(process.env.PORT, () => {
            console.log(`Server running on port ${process.env.PORT}`);
        });
    })
    .catch((error) => {
        console.log("MongoDB connection error:", error);
    });