import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

function CreateBook() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: "",
        author: "",
        description: "",
        coverImage: "",
        category: ""
    });

    const [message, setMessage] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem("token");

            const response = await API.post(
                "/books",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMessage(response.data.message);

            setTimeout(() => {
                navigate("/dashboard");
            }, 800);

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Failed to create book"
            );
        }
    };

    return (
        <div>
            <h1>Create New E-Book</h1>

            <form onSubmit={handleSubmit}>

                <input
                    type="text"
                    name="title"
                    placeholder="Book Title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                />

                <br /><br />

                <input
                    type="text"
                    name="author"
                    placeholder="Author Name"
                    value={formData.author}
                    onChange={handleChange}
                    required
                />

                <br /><br />

                <textarea
                    name="description"
                    placeholder="Book Description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="5"
                />

                <br /><br />

                <input
                    type="text"
                    name="coverImage"
                    placeholder="Cover Image URL"
                    value={formData.coverImage}
                    onChange={handleChange}
                />

                <br /><br />

                <input
                    type="text"
                    name="category"
                    placeholder="Category"
                    value={formData.category}
                    onChange={handleChange}
                />

                <br /><br />

                <button type="submit">
                    Create Book
                </button>
            </form>

            <p>{message}</p>

            <button onClick={() => navigate("/dashboard")}>
                Back to Dashboard
            </button>
        </div>
    );
}

export default CreateBook;