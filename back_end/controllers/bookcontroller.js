const Book = require("../models/book");

// =========================
// CREATE BOOK
// =========================

const createBook = async (req, res) => {
    try {
        const { title, author, description, coverImage, category } = req.body;

        if (!title || !author) {
            return res.status(400).json({
                message: "Title and author are required"
            });
        }

        const book = await Book.create({
            title,
            author,
            description,
            coverImage,
            category,
            chapters: [],
            createdBy: req.user
        });

        res.status(201).json({
            message: "Book created successfully",
            book
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// =========================
// GET ALL BOOKS
// =========================

const getBooks = async (req, res) => {
    try {
        const books = await Book.find({
            createdBy: req.user
        }).sort({ createdAt: -1 });

        res.status(200).json({
            books
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// =========================
// GET SINGLE BOOK
// =========================

const getBook = async (req, res) => {
    try {
        const book = await Book.findOne({
            _id: req.params.id,
            createdBy: req.user
        });

        if (!book) {
            return res.status(404).json({
                message: "Book not found"
            });
        }

        res.status(200).json({
            book
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// =========================
// UPDATE BOOK
// =========================

const updateBook = async (req, res) => {
    try {
        const book = await Book.findOne({
            _id: req.params.id,
            createdBy: req.user
        });

        if (!book) {
            return res.status(404).json({
                message: "Book not found"
            });
        }

        const {
            title,
            author,
            description,
            coverImage,
            category,
            chapters
        } = req.body;

        book.title = title ?? book.title;
        book.author = author ?? book.author;
        book.description = description ?? book.description;
        book.coverImage = coverImage ?? book.coverImage;
        book.category = category ?? book.category;
        book.chapters = chapters ?? book.chapters;

        await book.save();

        res.status(200).json({
            message: "Book updated successfully",
            book
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// =========================
// DELETE BOOK
// =========================

const deleteBook = async (req, res) => {
    try {
        const book = await Book.findOneAndDelete({
            _id: req.params.id,
            createdBy: req.user
        });

        if (!book) {
            return res.status(404).json({
                message: "Book not found"
            });
        }

        res.status(200).json({
            message: "Book deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


module.exports = {
    createBook,
    getBooks,
    getBook,
    updateBook,
    deleteBook
};