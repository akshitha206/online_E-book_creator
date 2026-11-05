
const express = require("express");
const router = express.Router();

const Book = require("../models/Book");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

// GET ALL BOOKS
router.get("/", async (req, res) => {
  try {
    await Book.updateMany(
      {
        $or: [
          { user: { $exists: false } },
          { user: null }
        ]
      },
      {
        $set: { user: req.user._id }
      }
    );

    const books = await Book.find({
      user: req.user._id
    }).sort({ createdAt: -1 });

    res.json(books);
  } catch (error) {
    console.error("GET BOOKS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});

// CREATE BOOK
router.post("/", async (req, res) => {
  try {
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      chapters: req.body.chapters,
      notes: [],
      user: req.user._id
    });

    const savedBook = await book.save();

    res.status(201).json(savedBook);
  } catch (error) {
    console.error("CREATE BOOK ERROR:", error);
    res.status(400).json({ message: error.message });
  }
});

// UPDATE BOOK AND NOTES
router.put("/:id", async (req, res) => {
  try {
    const book = await Book.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!book) {
      return res.status(404).json({
        message: "Book not found."
      });
    }

    if (req.body.title !== undefined) {
      book.title = req.body.title;
    }

    if (req.body.author !== undefined) {
      book.author = req.body.author;
    }

    if (req.body.chapters !== undefined) {
      book.chapters = req.body.chapters;
    }

    if (Array.isArray(req.body.notes)) {
      book.notes = req.body.notes;
    }

    await book.save();

    res.json(book);
  } catch (error) {
    console.error("UPDATE BOOK ERROR:", error);
    res.status(400).json({ message: error.message });
  }
});

// DELETE BOOK
router.delete("/:id", async (req, res) => {
  try {
    const deletedBook = await Book.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!deletedBook) {
      return res.status(404).json({
        message: "Book not found."
      });
    }

    res.json({
      message: "Book deleted successfully."
    });
  } catch (error) {
    console.error("DELETE BOOK ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;



