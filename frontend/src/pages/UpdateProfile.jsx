import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

function UpdateProfile() {
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem("user"));

    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        password: ""
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

            const response = await API.put(
                "/auth/profile",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            localStorage.setItem(
                "user",
                JSON.stringify(response.data.user)
            );

            setMessage(response.data.message);

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Failed to update profile"
            );
        }
    };

    return (
        <div>
            <h1>Update Profile</h1>

            <form onSubmit={handleSubmit}>

                <input
                    type="text"
                    name="name"
                    placeholder="Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />

                <br /><br />

                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />

                <br /><br />

                <input
                    type="password"
                    name="password"
                    placeholder="New Password"
                    value={formData.password}
                    onChange={handleChange}
                />

                <br /><br />

                <button type="submit">
                    Update Profile
                </button>
            </form>

            <p>{message}</p>

            <button onClick={() => navigate("/dashboard")}>
                Back to Dashboard
            </button>
        </div>
    );
}

export default UpdateProfile;