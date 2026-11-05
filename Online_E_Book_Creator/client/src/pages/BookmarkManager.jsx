
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  BookOpen,
  LayoutDashboard,
  Library,
  FileText,
  History,
  User,
  NotebookPen,
  Bookmark,
  BookmarkCheck,
  Search,
  Trash2,
  ArrowLeft
} from 'lucide-react';

import { getBooks } from '../services/api';
import './BookmarkManager.css';

const HISTORY_KEY = 'bookcraft-reading-history';

function readArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function BookmarkManager() {
  const navigate = useNavigate();

  const [books, setBooks] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // LOAD BOOKS AND BOOKMARKS
  const loadBookmarks = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await getBooks();

      const data = Array.isArray(response)
        ? response
        : response?.data;

      const bookList = Array.isArray(data)
        ? data
        : Array.isArray(data?.books)
          ? data.books
          : [];

      setBooks(bookList);

      const collected = [];

      bookList.forEach(book => {
        const saved = readArray(
          `bookcraft-bookmarks-${book._id}`
        );

        saved.forEach(value => {
          const chapterIndex = Number(value);
          const chapters = Array.isArray(book.chapters)
            ? book.chapters
            : [];

          const chapter = chapters[chapterIndex];

          if (
            !Number.isInteger(chapterIndex) ||
            chapterIndex < 0 ||
            !chapter
          ) {
            return;
          }

          collected.push({
            id: `${book._id}-${chapterIndex}`,
            bookId: book._id,
            bookTitle: book.title || 'Untitled Book',
            author: book.author || 'Unknown Author',
            chapterIndex,
            chapterTitle:
              chapter.title || `Chapter ${chapterIndex + 1}`,
            totalChapters: chapters.length
          });
        });
      });

      collected.sort(
        (a, b) =>
          a.bookTitle.localeCompare(b.bookTitle) ||
          a.chapterIndex - b.chapterIndex
      );

      setBookmarks(collected);
    } catch (err) {
      console.error('Bookmark loading error:', err);
      setError(
        'Unable to load bookmarks. Please check your backend connection.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // INITIAL LOAD AND AUTOMATIC REFRESH
  useEffect(() => {
    loadBookmarks();

    const handleStorage = event => {
      if (
        !event.key ||
        event.key.startsWith('bookcraft-bookmarks-')
      ) {
        loadBookmarks();
      }
    };

    window.addEventListener('focus', loadBookmarks);
    window.addEventListener('pageshow', loadBookmarks);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('focus', loadBookmarks);
      window.removeEventListener('pageshow', loadBookmarks);
      window.removeEventListener('storage', handleStorage);
    };
  }, [loadBookmarks]);

  // SEARCH BOOKMARKS
  const filteredBookmarks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bookmarks.filter(item =>
      item.bookTitle.toLowerCase().includes(query) ||
      item.author.toLowerCase().includes(query) ||
      item.chapterTitle.toLowerCase().includes(query)
    );
  }, [bookmarks, search]);

  // OPEN BOOKMARKED CHAPTER
  const openBookmark = item => {
    try {
      const history = readArray(HISTORY_KEY);

      const existing = history.find(
        entry =>
          String(entry.bookId) === String(item.bookId)
      );

      const updatedEntry = {
        ...(existing || {}),
        bookId: item.bookId,
        title: item.bookTitle,
        author: item.author,
        lastChapter: item.chapterIndex,
        lastChapterTitle: item.chapterTitle,
        lastReadAt: new Date().toISOString()
      };

      const updatedHistory = [
        updatedEntry,
        ...history.filter(
          entry =>
            String(entry.bookId) !== String(item.bookId)
        )
      ].slice(0, 10);

      localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(updatedHistory)
      );

      window.dispatchEvent(
        new Event('bookcraft-history-updated')
      );

      navigate(`/read/${item.bookId}`);
    } catch (err) {
      console.error('Bookmark opening error:', err);
      alert('Unable to open this bookmark.');
    }
  };

  // REMOVE INDIVIDUAL BOOKMARK
  const removeBookmark = item => {
    const confirmed = window.confirm(
      `Remove "${item.chapterTitle}" from your bookmarks?`
    );

    if (!confirmed) return;

    try {
      const key = `bookcraft-bookmarks-${item.bookId}`;

      const updated = readArray(key).filter(
        value => Number(value) !== item.chapterIndex
      );

      localStorage.setItem(key, JSON.stringify(updated));

      setBookmarks(previous =>
        previous.filter(entry => entry.id !== item.id)
      );
    } catch (err) {
      console.error('Bookmark removal error:', err);
      alert('Unable to remove this bookmark.');
    }
  };

  // CLEAR ALL BOOKMARKS
  const clearAllBookmarks = () => {
    if (!bookmarks.length) return;

    const confirmed = window.confirm(
      'Remove all bookmarks from all your books? This cannot be undone.'
    );

    if (!confirmed) return;

    try {
      books.forEach(book => {
        localStorage.setItem(
          `bookcraft-bookmarks-${book._id}`,
          '[]'
        );
      });

      setBookmarks([]);
    } catch (err) {
      console.error('Clear bookmarks error:', err);
      alert('Unable to clear all bookmarks.');
    }
  };

  // BOOKS WITH BOOKMARKS
  const bookmarkedBooksCount = useMemo(
    () => new Set(
      bookmarks.map(item => String(item.bookId))
    ).size,
    [bookmarks]
  );

  return (
    <div className="bookmark-layout">

      {/* SIDEBAR */}
      <aside className="bookmark-sidebar">

        <div className="bookmark-brand">
          <BookOpen size={29} />
          <h2>BookCraft</h2>
        </div>

        <p className="bookmark-sidebar-label">
          WORKSPACE
        </p>

        <nav className="bookmark-nav">

          <button onClick={() => navigate('/')}>
            <LayoutDashboard />
            Dashboard
          </button>

          <button onClick={() => navigate('/library')}>
            <Library />
            My Library
          </button>

          <button onClick={() => navigate('/analytics')}>
            <FileText />
            Analytics
          </button>

          <button onClick={() => navigate('/reading-goals')}>
            <History />
            Reading Goals
          </button>

          <button onClick={() => navigate('/reading-journal')}>
            <NotebookPen />
            Reading Journal
          </button>

          <button className="bookmark-nav-active">
            <Bookmark />
            Bookmarks
          </button>

          <button onClick={() => navigate('/profile')}>
            <User />
            My Profile
          </button>

        </nav>

        <button
          className="bookmark-back"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

      </aside>

      {/* MAIN CONTENT */}
      <main className="bookmark-main">

        <header className="bookmark-header">
          <span className="bookmark-eyebrow">
            YOUR SAVED CHAPTERS
          </span>

          <h1>Bookmark Manager</h1>

          <p>
            Keep your favourite chapters close and return to them anytime.
          </p>
        </header>

        {/* STATISTICS */}
        <section className="bookmark-stats">

          <div className="bookmark-stat-card">

            <div className="bookmark-stat-icon">
              <BookmarkCheck />
            </div>

            <div>
              <span>Saved Bookmarks</span>
              <strong>{bookmarks.length}</strong>
            </div>

          </div>

          <div className="bookmark-stat-card">

            <div className="bookmark-stat-icon">
              <BookOpen />
            </div>

            <div>
              <span>Books with Bookmarks</span>
              <strong>{bookmarkedBooksCount}</strong>
            </div>

          </div>

        </section>

        {/* BOOKMARK CONTENT */}
        <section className="bookmark-content">

          <div className="bookmark-toolbar">

            <div>
              <h2>Your Bookmarks</h2>

              <p>
                Open a saved chapter or remove bookmarks you no longer need.
              </p>
            </div>

            <div className="bookmark-toolbar-actions">

              <div className="bookmark-search">
                <Search size={19} />

                <input
                  value={search}
                  onChange={event =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search books or chapters..."
                />
              </div>

              <button
                className="bookmark-clear-button"
                onClick={clearAllBookmarks}
                disabled={!bookmarks.length}
              >
                <Trash2 size={16} />
                Clear All
              </button>

            </div>

          </div>

          {/* LOADING */}
          {loading ? (

            <div className="bookmark-empty">
              Loading your bookmarks...
            </div>

          ) : error ? (

            <div className="bookmark-empty">
              <p>{error}</p>

              <button onClick={loadBookmarks}>
                Try Again
              </button>
            </div>

          ) : filteredBookmarks.length === 0 ? (

            <div className="bookmark-empty">

              <Bookmark size={46} />

              <h3>
                {bookmarks.length
                  ? 'No matching bookmarks'
                  : 'No bookmarks yet'}
              </h3>

              <p>
                Open a book and use the Bookmark button beside a
                chapter title. Your saved chapters will appear here.
              </p>

              <button onClick={() => navigate('/library')}>
                Go to My Library
              </button>

            </div>

          ) : (

            <div className="bookmark-grid">

              {filteredBookmarks.map(item => (

                <article
                  className="bookmark-card"
                  key={item.id}
                >

                  <div className="bookmark-card-top">

                    <span className="bookmark-type">
                      <BookmarkCheck size={15} />
                      SAVED CHAPTER
                    </span>

                    <span className="bookmark-number">
                      {item.chapterIndex + 1} / {item.totalChapters}
                    </span>

                  </div>

                  <div className="bookmark-card-book">

                    <div className="bookmark-card-icon">
                      <BookOpen size={25} />
                    </div>

                    <div>
                      <h3>{item.bookTitle}</h3>
                      <p>By {item.author}</p>
                    </div>

                  </div>

                  <div className="bookmark-chapter">

                    <span>
                      CHAPTER {item.chapterIndex + 1}
                    </span>

                    <strong>{item.chapterTitle}</strong>

                  </div>

                  <div className="bookmark-card-actions">

                    <button
                      className="bookmark-open-button"
                      onClick={() => openBookmark(item)}
                    >
                      <BookOpen size={17} />
                      Open Chapter
                    </button>

                    <button
                      className="bookmark-remove-button"
                      onClick={() => removeBookmark(item)}
                      title="Remove bookmark"
                      aria-label={`Remove bookmark for ${item.chapterTitle}`}
                    >
                      <Trash2 size={17} />
                    </button>

                  </div>

                </article>

              ))}

            </div>

          )}

        </section>

      </main>
    </div>
  );
}

export default BookmarkManager;
