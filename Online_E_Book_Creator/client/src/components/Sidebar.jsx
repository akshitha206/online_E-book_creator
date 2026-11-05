import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen, LayoutDashboard, Library, BarChart3,
  Target, NotebookPen, Bookmark, Sparkles, User,
  Settings, ArrowUpRight, LogOut
} from "lucide-react";
import "./Sidebar.css";

const menuItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "My Library", path: "/library", icon: Library },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
  { label: "Reading Goals", path: "/reading-goals", icon: Target },
  { label: "Reading Journal", path: "/reading-journal", icon: NotebookPen },
  { label: "Bookmarks", path: "/bookmarks", icon: Bookmark },
  { label: "AI Assistant", path: "/ai-assistant", icon: Sparkles },
  { label: "My Profile", path: "/profile", icon: User },
  { label: "Settings", path: "/settings", icon: Settings },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }

  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to logout?")) return;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <aside className="bc-sidebar">
      <div className="bc-brand">
        <BookOpen size={32} />
        <h2>BookCraft</h2>
      </div>

      <p className="bc-sidebar-heading">WORKSPACE</p>

      <nav className="bc-sidebar-nav">
        {menuItems.map(({ label, path, icon: Icon }) => (
          <button
            key={path}
            className={`bc-nav-item ${
              location.pathname === path ? "active" : ""
            }`}
            onClick={() => navigate(path)}
          >
            <Icon size={22} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="bc-sidebar-bottom">
        <div className="bc-promo">
          <Sparkles size={24} />
          <h3>Your ideas deserve a book.</h3>
          <p>Turn your creativity into beautiful digital books.</p>
          <button onClick={() => navigate("/create-book")}>
            Create a book <ArrowUpRight size={17} />
          </button>
        </div>

        <div className="bc-profile">
          <div className="bc-avatar">
            {user?.profilePhoto
              ? <img src={user.profilePhoto} alt="Profile" />
              : (user?.name || "U").charAt(0).toUpperCase()}
          </div>
          <div className="bc-profile-info">
            <strong>{user?.name || "BookCraft User"}</strong>
            <span>{user?.email || "Personal workspace"}</span>
          </div>
          <button className="bc-logout" onClick={handleLogout} title="Logout">
            <LogOut size={19} />
          </button>
        </div>
      </div>
    </aside>
  );
}