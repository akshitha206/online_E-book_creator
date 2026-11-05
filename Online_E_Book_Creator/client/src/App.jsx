
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Dashboard from './pages/Dashboard.jsx';
import CreateBook from './pages/CreateBook.jsx';
import BookPreview from './pages/BookPreview.jsx';
import CoverDesigner from './pages/CoverDesigner.jsx';
import MyLibrary from './pages/MyLibrary.jsx';
import Analytics from './pages/Analytics.jsx';
import ReadingGoals from './pages/ReadingGoals.jsx';
import ReadingJournal from './pages/ReadingJournal.jsx';
import BookmarkManager from './pages/BookmarkManager.jsx';
import AIAssistant from './pages/AIAssistant.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import GithubCallback from './pages/GithubCallback.jsx';

import './App.css';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');

  return token ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const token = localStorage.getItem('token');

  return token ? <Navigate to="/" replace /> : children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Authentication */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />

        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />

        <Route path="/auth/callback" element={<GithubCallback />} />

        {/* Dashboard */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Settings */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Create Book */}
        <Route
          path="/create-book"
          element={
            <ProtectedRoute>
              <CreateBook />
            </ProtectedRoute>
          }
        />

        {/* My Library */}
        <Route
          path="/library"
          element={
            <ProtectedRoute>
              <MyLibrary />
            </ProtectedRoute>
          }
        />

        {/* Analytics */}
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />

        {/* Reading Goals */}
        <Route
          path="/reading-goals"
          element={
            <ProtectedRoute>
              <ReadingGoals />
            </ProtectedRoute>
          }
        />

        {/* Reading Journal */}
        <Route
          path="/reading-journal"
          element={
            <ProtectedRoute>
              <ReadingJournal />
            </ProtectedRoute>
          }
        />

        {/* Bookmarks */}
        <Route
          path="/bookmarks"
          element={
            <ProtectedRoute>
              <BookmarkManager />
            </ProtectedRoute>
          }
        />

        {/* AI Assistant */}
        <Route
          path="/ai-assistant"
          element={
            <ProtectedRoute>
              <AIAssistant />
            </ProtectedRoute>
          }
        />

        {/* Read Book */}
        <Route
          path="/read/:id"
          element={
            <ProtectedRoute>
              <BookPreview />
            </ProtectedRoute>
          }
        />

        {/* Cover Designer */}
        <Route
          path="/cover/:id"
          element={
            <ProtectedRoute>
              <CoverDesigner />
            </ProtectedRoute>
          }
        />

        {/* Unknown Routes */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
