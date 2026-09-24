import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/Dashboard";
import CreateBook from "./pages/CreateBook";
import BookEditor from "./pages/BookEditor";
import UpdateProfile from "./pages/UpdateProfile";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/create-book" element={<CreateBook />} />
                <Route path="/books/:id" element={<BookEditor />} />
                <Route path="/update-profile" element={<UpdateProfile />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;