import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api";

function BookEditor() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [book, setBook] = useState(null);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const fetchBook = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await API.get(`/books/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                setBook(response.data.book);
            } catch (error) {
                setMessage(
                    error.response?.data?.message ||
                    "Failed to load book"
                );
            }
        };

        fetchBook();
    }, [id]);

    if (!book) {
        return <p>{message || "Loading book..."}</p>;
    }

    return (
        <div>
            <h1>{book.title}</h1>

            <p>Author: {book.author}</p>
            <p>{book.description}</p>
            <p>Category: {book.category}</p>

            <hr />

            <h2>Chapters</h2>

            {book.chapters.length === 0 ? (
                <p>No chapters added yet.</p>
            ) : (
                book.chapters.map((chapter, index) => (
                    <div key={chapter._id}>
                        <h3>
                            Chapter {index + 1}: {chapter.title}
                        </h3>

                        <p>{chapter.content}</p>

                        <hr />
                    </div>
                ))
            )}

            <button onClick={() => navigate("/dashboard")}>
                Back to Dashboard
            </button>
        </div>
    );
}

export default BookEditor;