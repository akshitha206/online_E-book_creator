import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

function Dashboard() {
    const navigate = useNavigate();

    const [books, setBooks] = useState([]);
    const [message, setMessage] = useState("");

    const user = JSON.parse(localStorage.getItem("user"));

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await API.get("/books", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                setBooks(response.data.books);
            } catch (error) {
                setMessage(
                    error.response?.data?.message || "Failed to load books"
                );
            }
        };

        fetchBooks();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    return (
        <div>
            <h1>Online E-Book Creator</h1>

            <h2>Welcome, {user?.name}</h2>

            <button onClick={handleLogout}>
                Logout
            </button>

            <button onClick={() => navigate("/update-profile")}>
    Update Profile
</button>

            <hr />

            <h2>My Books</h2>

            {message && <p>{message}</p>}

            {books.length === 0 ? (
                <p>No books created yet.</p>
            ) : (
                books.map((book) => (
                    <div key={book._id}>
                        <h3
    onClick={() => navigate(`/books/${book._id}`)}
    style={{ cursor: "pointer" }}
>
    {book.title}
</h3>
                        <p>Author: {book.author}</p>
                        <p>{book.description}</p>
                        <p>Category: {book.category}</p>
                        <hr />
                    </div>
                ))
            )}

            <button onClick={() => navigate("/create-book")}>
                + Create New Book
            </button>
        </div>
    );
}

export default Dashboard;