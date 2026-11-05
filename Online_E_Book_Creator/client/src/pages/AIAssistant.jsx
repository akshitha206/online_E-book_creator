
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Bot,
  Send,
  BookOpen,
  ArrowLeft,
  Sparkles,
  User,
  LoaderCircle,
  Trash2,
  Copy,
  Check
} from "lucide-react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import API, { getBooks } from "../services/api";
import "./AIAssistant.css";

function AIAssistant() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Load saved books
  useEffect(() => {
    loadBooks();
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages, loading]);

  const loadBooks = async () => {
    try {
      const response = await getBooks();

      setBooks(response.data || []);

      if (response.data?.length > 0) {
        setSelectedBook(response.data[0]._id);
      }
    } catch (error) {
      console.error("Failed to load books:", error);
    }
  };

  // Copy AI response
  const handleCopy = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);

      setCopiedIndex(index);

      setTimeout(() => {
        setCopiedIndex((current) =>
          current === index ? null : current
        );
      }, 2000);

    } catch (error) {
      console.error("Failed to copy response:", error);
    }
  };

  // Send message with conversation history
  const sendMessage = async (e) => {
    e?.preventDefault();

    if (!question.trim() || !selectedBook || loading) {
      return;
    }

    const userQuestion = question.trim();

    // Preserve previous messages
    const previousHistory = messages.map((message) => ({
      role: message.role,
      text: message.text
    }));

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: userQuestion
      }
    ]);

    setQuestion("");
    setLoading(true);
    setCopiedIndex(null);

    try {
      const response = await API.post(
        `/ai/chat/${selectedBook}`,
        {
          question: userQuestion,
          history: previousHistory
        }
      );

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: response.data.answer || "No answer received."
        }
      ]);

    } catch (error) {
      console.error(
        "AI chat error:",
        error.response?.data || error
      );

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            error.response?.data?.message ||
            "Sorry, something went wrong. Please try again.",
          isError: true
        }
      ]);

    } finally {
      setLoading(false);
    }
  };

  // Change selected book
  const changeBook = (value) => {
    if (loading) return;

    setSelectedBook(value);
    setMessages([]);
    setQuestion("");
    setCopiedIndex(null);
  };

  // Clear chat
  const clearChat = () => {
    if (loading) return;

    setMessages([]);
    setQuestion("");
    setCopiedIndex(null);
  };

  const suggestions = [
    "Summarize this book",
    "Explain the main concepts",
    "What are the important points?",
    "Give me real-world examples"
  ];

  return (
    <div className="ai-page">

      {/* Header */}
      <header className="ai-header">

        <button
          className="ai-back"
          onClick={() => navigate("/")}
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="ai-brand">

          <div className="ai-brand-icon">
            <Bot size={25} />
          </div>

          <div>
            <h2>BookCraft AI</h2>
            <p>Your personal reading assistant</p>
          </div>

        </div>

        <div className="ai-status">
          <span></span>
          AI Assistant
        </div>

      </header>

      {/* Main */}
      <main className="ai-main">

        <section className="ai-chat-container">

          {/* Toolbar */}
          <div className="ai-chat-toolbar">

            <div className="ai-book-selector">

              <BookOpen size={20} />

              <select
                value={selectedBook}
                onChange={(e) => changeBook(e.target.value)}
                disabled={loading}
              >

                {books.length === 0 && (
                  <option value="">
                    No books available
                  </option>
                )}

                {books.map((book) => (
                  <option
                    key={book._id}
                    value={book._id}
                  >
                    {book.title}
                  </option>
                ))}

              </select>

            </div>

            <button
              className="ai-clear-button"
              onClick={clearChat}
              disabled={messages.length === 0 || loading}
              title="Clear conversation"
            >
              <Trash2 size={17} />
              Clear chat
            </button>

          </div>

          {/* Welcome Screen */}
          {messages.length === 0 ? (

            <div className="ai-welcome">

              <div className="ai-welcome-icon">
                <Sparkles size={35} />
              </div>

              <h1>Ask your book anything.</h1>

              <p>
                Understand chapters, explore concepts,
                and learn more with your personal AI assistant.
              </p>

              <div className="ai-suggestions">

                {suggestions.map((item) => (

                  <button
                    key={item}
                    onClick={() => setQuestion(item)}
                    disabled={!selectedBook || loading}
                  >
                    {item}
                  </button>

                ))}

              </div>

            </div>

          ) : (

            /* Chat Messages */
            <div className="ai-messages">

              {messages.map((message, index) => (

                <div
                  key={index}
                  className={`ai-message ${
                    message.role === "user"
                      ? "user-message"
                      : "assistant-message"
                  }`}
                >

                  <div className="ai-message-icon">

                    {message.role === "user" ? (
                      <User size={18} />
                    ) : (
                      <Bot size={18} />
                    )}

                  </div>

                  <div
                    className={`ai-message-text ${
                      message.isError
                        ? "ai-error-message"
                        : ""
                    }`}
                  >

                    {message.role === "assistant" &&
                    !message.isError ? (

                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                      >
                        {message.text}
                      </ReactMarkdown>

                    ) : (
                      message.text
                    )}

                  </div>

                  {/* Copy button */}
                  {message.role === "assistant" &&
                    !message.isError && (

                    <button
                      className="ai-copy-button"
                      onClick={() =>
                        handleCopy(message.text, index)
                      }
                      title="Copy response"
                    >

                      {copiedIndex === index ? (
                        <>
                          <Check size={15} />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy size={15} />
                          Copy
                        </>
                      )}

                    </button>

                  )}

                </div>

              ))}

              {/* Loading Indicator */}
              {loading && (

                <div className="ai-message assistant-message">

                  <div className="ai-message-icon">
                    <Bot size={18} />
                  </div>

                  <div className="ai-message-text ai-thinking">
                    <LoaderCircle size={17} />
                    Thinking...
                  </div>

                </div>

              )}

              <div ref={messagesEndRef} />

            </div>

          )}

          {/* Input Area */}
          <form
            className="ai-input-area"
            onSubmit={sendMessage}
          >

            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything about your selected book..."
              rows={2}
              disabled={!selectedBook || loading}
              onKeyDown={(e) => {

                if (
                  e.key === "Enter" &&
                  !e.shiftKey
                ) {
                  e.preventDefault();
                  sendMessage(e);
                }

              }}
            />

            <button
              type="submit"
              disabled={
                !question.trim() ||
                !selectedBook ||
                loading
              }
              aria-label="Send message"
            >

              {loading ? (
                <LoaderCircle size={20} />
              ) : (
                <Send size={20} />
              )}

            </button>

          </form>

          <p className="ai-disclaimer">
            BookCraft AI answers using your selected book's content.
          </p>

        </section>

      </main>

    </div>
  );
}

export default AIAssistant;


