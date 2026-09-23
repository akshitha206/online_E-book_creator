const express = require("express");

const {
    createBook,
    getBooks,
    getBook,
    updateBook,
    deleteBook
} = require("../controllers/bookcontroller");

const protect = require("../middleware/authmiddleware");

const router = express.Router();

// Create a book
router.post("/", protect, createBook);

// Get all books
router.get("/", protect, getBooks);

// Get one book
router.get("/:id", protect, getBook);

// Update a book
router.put("/:id", protect, updateBook);

// Delete a book
router.delete("/:id", protect, deleteBook);

module.exports = router;