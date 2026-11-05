
const express = require("express");
const router = express.Router();
const { GoogleGenAI } = require("@google/genai");

const Book = require("../models/Book");
const authMiddleware = require("../middleware/authMiddleware");

console.log("BOOKCRAFT AI FILE LOADED SUCCESSFULLY");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// Test route
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "BookCraft AI route is working!"
  });
});

// Authentication
router.use(authMiddleware);

// Chat with a book
router.post("/chat/:bookId", async (req, res) => {
  console.log("AI CHAT REQUEST RECEIVED:", req.params.bookId);

  try {
    const { question, history = [] } = req.body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        message: "Please enter a question."
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        message: "Gemini API key is missing."
      });
    }

    // Find the selected user's book
    const book = await Book.findOne({
      _id: req.params.bookId,
      user: req.user._id
    });

    if (!book) {
      return res.status(404).json({
        message: "Book not found."
      });
    }

    // Collect book chapters
    const bookContent = (book.chapters || [])
      .map((chapter, index) =>
        `Chapter ${index + 1}: ${chapter.title}\n${chapter.content}`
      )
      .join("\n\n");

    if (!bookContent.trim()) {
      return res.status(400).json({
        message: "This book has no chapter content."
      });
    }

    // Keep only the latest 10 previous messages
    const conversationHistory = Array.isArray(history)
      ? history
          .filter(
            (message) =>
              ["user", "assistant"].includes(message.role) &&
              typeof message.text === "string"
          )
          .slice(-10)
          .map((message) => {
            const speaker =
              message.role === "user" ? "User" : "BookCraft AI";

            return `${speaker}: ${message.text.slice(0, 3000)}`;
          })
          .join("\n\n")
      : "";

    console.log("================================");
    console.log("BOOKCRAFT AI MODEL: gemini-3.5-flash-lite");
    console.log("BOOK:", book.title);
    console.log("PREVIOUS MESSAGES:", history.length || 0);
    console.log("================================");

    const prompt = `
You are BookCraft AI, a helpful personal reading assistant.

BOOK DETAILS:
Title: ${book.title}
Author: ${book.author}

BOOK CONTENT:
${bookContent}

PREVIOUS CONVERSATION:
${conversationHistory || "This is the beginning of the conversation."}

LATEST USER QUESTION:
${question}

INSTRUCTIONS:
1. Answer using the selected book's content whenever possible.
2. Remember the previous conversation when answering follow-up questions.
3. Understand references such as "it", "that concept", and "explain more" using conversation history.
4. Explain difficult concepts in simple language.
5. Give practical examples when useful.
6. If information is not available in the book, clearly mention that.
7. Do not repeat previous answers unnecessarily.

Respond helpfully and clearly.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt
    });

    console.log("AI RESPONSE GENERATED SUCCESSFULLY");

    return res.json({
      success: true,
      answer: response.text || "No answer received."
    });

  } catch (error) {
    console.error("BOOKCRAFT AI ERROR:", error);

    return res.status(500).json({
      message: "AI assistant failed to generate a response.",
      error: error.message
    });
  }
});

module.exports = router;
