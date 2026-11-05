
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

// Main pages
import Dashboard from './pages/Dashboard.jsx';
import CreateBook from './pages/CreateBook.jsx';
import BookPreview from './pages/BookPreview.jsx';
import CoverDesigner from './pages/CoverDesigner.jsx';
import MyLibrary from './pages/MyLibrary.jsx';
import Analytics from './pages/Analytics.jsx';
import ReadingGoals from './pages/ReadingGoals.jsx';
import ReadingJournal from './pages/ReadingJournal.jsx';
import Profile from './pages/Profile.jsx';

// Authentication pages
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

// Global CSS
import './App.css';

// PROTECTED ROUTE
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');

  return token
    ? children
    : <Navigate to="/login" replace />;
}

// GUEST ROUTE
function GuestRoute({ children }) {
  const token = localStorage.getItem('token');

  return token
    ? <Navigate to="/" replace />
    : children;
}

// MAIN APP
function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =========================
            PUBLIC AUTHENTICATION
        ========================= */}

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

        {/* =========================
            PROTECTED DASHBOARD
        ========================= */}

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* PROFILE */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* CREATE BOOK */}
        <Route
          path="/create-book"
          element={
            <ProtectedRoute>
              <CreateBook />
            </ProtectedRoute>
          }
        />

        {/* MY LIBRARY */}
        <Route
          path="/library"
          element={
            <ProtectedRoute>
              <MyLibrary />
            </ProtectedRoute>
          }
        />

        {/* ANALYTICS */}
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />

        {/* READING GOALS */}
        <Route
          path="/reading-goals"
          element={
            <ProtectedRoute>
              <ReadingGoals />
            </ProtectedRoute>
          }
        />

        {/* READING JOURNAL */}
        <Route
          path="/reading-journal"
          element={
            <ProtectedRoute>
              <ReadingJournal />
            </ProtectedRoute>
          }
        />

        {/* BOOK READER */}
        <Route
          path="/read/:id"
          element={
            <ProtectedRoute>
              <BookPreview />
            </ProtectedRoute>
          }
        />

        {/* COVER DESIGNER */}
        <Route
          path="/cover/:id"
          element={
            <ProtectedRoute>
              <CoverDesigner />
            </ProtectedRoute>
          }
        />

        {/* INVALID ROUTES */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
