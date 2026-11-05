
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  BookOpen,
  Search,
  Grid3X3,
  List,
  Clock3,
  CalendarDays,
  Pencil,
  Trash2,
  Heart,
  Palette,
  SortAsc,
  Plus,
  History,
  PlayCircle,
  FileText
} from 'lucide-react';

import {
  getBooks,
  deleteBook as deleteBookAPI
} from '../services/api';

import './MyLibrary.css';
import Sidebar from '../components/Sidebar';

const templates = [
  { background: 'linear-gradient(145deg, #7046d8, #29145f)', color: '#ffffff' },
  { background: 'linear-gradient(145deg, #171717, #4b3710)', color: '#f5d47a' },
  { background: 'linear-gradient(145deg, #1674d1, #102b67)', color: '#ffffff' },
  { background: 'linear-gradient(145deg, #f5eee2, #d8c7ae)', color: '#30251e' },
  { background: 'linear-gradient(145deg, #ed9cae, #813c65)', color: '#ffffff' },
  { background: 'linear-gradient(145deg, #286b54, #10372d)', color: '#ffffff' }
];

function MyLibrary() {
  const navigate = useNavigate();

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [view, setView] = useState('grid');
  const [showFavorites, setShowFavorites] = useState(false);
  const [readingHistory, setReadingHistory] = useState([]);

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  });

  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('bookcraft-favorites') || '[]'
      );
    } catch {
      return [];
    }
  });

  const [coverDesigns, setCoverDesigns] = useState({});

  const userName = user?.name || user?.username || 'Book Creator';

  useEffect(() => {
    const refreshUser = () => {
      try {
        const savedUser = JSON.parse(
          localStorage.getItem('user') || 'null'
        );
        setUser(savedUser);
      } catch {
        setUser(null);
      }
    };

    window.addEventListener('focus', refreshUser);
    window.addEventListener('pageshow', refreshUser);

    return () => {
      window.removeEventListener('focus', refreshUser);
      window.removeEventListener('pageshow', refreshUser);
    };
  }, []);

  const loadReadingHistory = useCallback(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem('bookcraft-reading-history') || '[]'
      );

      setReadingHistory(Array.isArray(saved) ? saved : []);
    } catch {
      setReadingHistory([]);
    }
  }, []);

  const loadCovers = useCallback((bookList) => {
    const designs = {};

    bookList.forEach(book => {
      try {
        const saved = localStorage.getItem(
          `bookcraft-cover-${book._id}`
        );

        if (saved) {
          designs[book._id] = JSON.parse(saved);
        }
      } catch (err) {
        console.error('Cover loading error:', err);
      }
    });

    setCoverDesigns(designs);
  }, []);

  const loadBooks = useCallback(async () => {
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
      loadCovers(bookList);
      loadReadingHistory();

    } catch (err) {
      console.error('Library loading error:', err);
      setError(
        'Unable to load your library. Check your backend connection.'
      );
    } finally {
      setLoading(false);
    }
  }, [loadCovers, loadReadingHistory]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  useEffect(() => {
    localStorage.setItem(
      'bookcraft-favorites',
      JSON.stringify(favorites)
    );
  }, [favorites]);

  useEffect(() => {
    const refresh = () => {
      loadCovers(books);
      loadReadingHistory();
    };

    window.addEventListener('focus', refresh);
    window.addEventListener('pageshow', refresh);
    window.addEventListener('bookcraft-cover-updated', refresh);

    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('pageshow', refresh);
      window.removeEventListener('bookcraft-cover-updated', refresh);
    };
  }, [books, loadCovers, loadReadingHistory]);

  const filteredBooks = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = books.filter(book => {
      const matchesSearch =
        (book.title || '').toLowerCase().includes(query) ||
        (book.author || '').toLowerCase().includes(query);

      const matchesFavorite =
        !showFavorites || favorites.includes(book._id);

      return matchesSearch && matchesFavorite;
    });

    return [...result].sort((a, b) => {
      if (sort === 'oldest') {
        return new Date(a.createdAt || 0) -
          new Date(b.createdAt || 0);
      }

      if (sort === 'alphabetical') {
        return (a.title || '').localeCompare(b.title || '');
      }

      if (sort === 'updated') {
        return new Date(b.updatedAt || 0) -
          new Date(a.updatedAt || 0);
      }

      return new Date(b.createdAt || 0) -
        new Date(a.createdAt || 0);
    });
  }, [books, search, sort, showFavorites, favorites]);

  const recentBooks = useMemo(() => {
    return readingHistory
      .filter(entry =>
        books.some(book => book._id === entry.bookId)
      )
      .sort((a, b) =>
        new Date(b.lastReadAt || 0).getTime() -
        new Date(a.lastReadAt || 0).getTime()
      );
  }, [readingHistory, books]);

  const getCoverStyle = book => {
    const design = coverDesigns[book._id];

    if (!design) {
      return {
        background: 'linear-gradient(145deg, #eee5ff, #d8c7ff)',
        color: '#6845d8'
      };
    }

    if (design.uploadedImage) {
      return {
        backgroundImage: `url("${design.uploadedImage}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        color: '#ffffff'
      };
    }

    const selected = templates[design.template] || templates[0];

    return {
      background:
        design.template === 0
          ? design.customColor || selected.background
          : selected.background,
      color: selected.color
    };
  };

  const formatDate = date => {
    if (!date) return 'Date unavailable';

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return 'Date unavailable';
    }

    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const toggleFavorite = id => {
    setFavorites(previous =>
      previous.includes(id)
        ? previous.filter(item => item !== id)
        : [...previous, id]
    );
  };

  const handleDelete = async id => {
    if (!window.confirm('Are you sure you want to delete this book?')) {
      return;
    }

    try {
      await deleteBookAPI(id);

      setBooks(previous =>
        previous.filter(book => book._id !== id)
      );

      setFavorites(previous =>
        previous.filter(item => item !== id)
      );

      const updatedHistory = readingHistory.filter(
        entry => entry.bookId !== id
      );

      setReadingHistory(updatedHistory);

      localStorage.setItem(
        'bookcraft-reading-history',
        JSON.stringify(updatedHistory)
      );

      localStorage.removeItem(`bookcraft-cover-${id}`);

      setCoverDesigns(previous => {
        const updated = { ...previous };
        delete updated[id];
        return updated;
      });

    } catch (err) {
      console.error('Delete error:', err);
      alert('Unable to delete book.');
    }
  };

  const renderCoverContent = (design, book) => {
    if (design?.uploadedImage && design.uploadMode === 'complete') {
      return null;
    }

    return (
      <div className="library-cover-content">
        {!design?.uploadedImage && <BookOpen size={37} />}

        <strong>
          {design?.title || book.title || 'Your Book'}
        </strong>

        <span>
          {design?.author || book.author || 'Unknown Author'}
        </span>
      </div>
    );
  };

  const getReadingProgress = entry => {
    const book = books.find(item => item._id === entry.bookId);
    const totalChapters = book?.chapters?.length || 0;

    if (totalChapters === 0) return 0;

    const lastChapter = Math.max(
      0,
      Number(entry.lastChapter) || 0
    );

    return Math.min(
      100,
      Math.round(((lastChapter + 1) / totalChapters) * 100)
    );
  };

  return (
    <div className="library-layout">

      <Sidebar />

      <main className="library-dashboard-main">

        <header className="library-topbar">
          <div className="library-breadcrumb">
            Workspace <span>/</span>
            <strong>My Library</strong>
          </div>

          <button
            className="library-top-create"
            onClick={() => navigate('/create-book')}
          >
            <Plus size={18} />
            Create New Book
          </button>
        </header>

        <div className="library-content">

          <section className="library-welcome">
            <div>
              <span className="library-eyebrow">
                YOUR PERSONAL COLLECTION
              </span>

              <h1>My Library</h1>

              <p>
                Welcome back, {userName}! Manage your books,
                continue reading, and bring your ideas to life.
              </p>
            </div>

            <div className="library-welcome-icon">
              <BookOpen size={48} />
            </div>
          </section>

          <section className="library-stats">

            <div className="library-stat-card">
              <div className="library-stat-icon">
                <BookOpen size={22} />
              </div>
              <div>
                <span>Total Books</span>
                <strong>{books.length}</strong>
              </div>
            </div>

            <div className="library-stat-card">
              <div className="library-stat-icon">
                <Heart size={22} />
              </div>
              <div>
                <span>Favorites</span>
                <strong>
                  {favorites.filter(id =>
                    books.some(book => book._id === id)
                  ).length}
                </strong>
              </div>
            </div>

            <div className="library-stat-card">
              <div className="library-stat-icon">
                <History size={22} />
              </div>
              <div>
                <span>Recently Read</span>
                <strong>{recentBooks.length}</strong>
              </div>
            </div>

            <div className="library-stat-card">
              <div className="library-stat-icon">
                <FileText size={22} />
              </div>
              <div>
                <span>Total Chapters</span>
                <strong>
                  {books.reduce(
                    (total, book) =>
                      total + (book.chapters?.length || 0),
                    0
                  )}
                </strong>
              </div>
            </div>

          </section>

          <section className="library-continue-section">

            <div className="library-section-heading">
              <div>
                <h2>
                  <History size={23} />
                  Continue Reading
                </h2>
                <p>Pick up where you left off.</p>
              </div>
            </div>

            {recentBooks.length === 0 ? (
              <div className="library-continue-empty">
                <BookOpen size={30} />
                <div>
                  <strong>No reading history yet</strong>
                  <p>
                    Open a book and read a chapter.
                    Your recent reading activity will appear here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="library-continue-list">
                {recentBooks.map(entry => {
                  const book = books.find(
                    item => item._id === entry.bookId
                  );

                  if (!book) return null;

                  const progress = getReadingProgress(entry);
                  const design = coverDesigns[book._id];

                  return (
                    <article
                      className="library-continue-card"
                      key={entry.bookId}
                    >
                      <div
                        className="library-continue-cover"
                        style={getCoverStyle(book)}
                      >
                        {renderCoverContent(design, book)}
                      </div>

                      <div className="library-continue-details">

                        <span className="library-continue-label">
                          RECENTLY OPENED
                        </span>

                        <h3>{book.title}</h3>

                        <p className="library-continue-author">
                          By {book.author || 'Unknown Author'}
                        </p>

                        <p className="library-continue-chapter">
                          Last chapter:{' '}
                          {entry.lastChapterTitle ||
                            `Chapter ${(Number(entry.lastChapter) || 0) + 1}`}
                        </p>

                        <div className="library-continue-progress">
                          <div className="library-continue-track">
                            <div
                              className="library-continue-fill"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span>{progress}%</span>
                        </div>

                        <div className="library-continue-bottom">
                          <span>
                            <Clock3 size={15} />
                            {formatDate(entry.lastReadAt)}
                          </span>

                          <button
                            onClick={() =>
                              navigate(`/read/${book._id}`)
                            }
                          >
                            <PlayCircle size={17} />
                            Continue
                          </button>
                        </div>

                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="library-toolbar">

            <div className="library-search">
              <Search size={20} />

              <input
                type="text"
                placeholder="Search books or authors..."
                value={search}
                onChange={event => setSearch(event.target.value)}
              />
            </div>

            <div className="library-controls">

              <button
                className={
                  showFavorites
                    ? 'library-view active'
                    : 'library-view'
                }
                onClick={() =>
                  setShowFavorites(previous => !previous)
                }
                title="Show favorites"
                aria-label="Show favorites"
              >
                <Heart size={19} />
              </button>

              <div className="library-sort">
                <SortAsc size={18} />

                <select
                  value={sort}
                  onChange={event => setSort(event.target.value)}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="updated">Recently updated</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
              </div>

              <button
                className={
                  view === 'grid'
                    ? 'library-view active'
                    : 'library-view'
                }
                onClick={() => setView('grid')}
                title="Grid view"
                aria-label="Grid view"
              >
                <Grid3X3 size={19} />
              </button>

              <button
                className={
                  view === 'list'
                    ? 'library-view active'
                    : 'library-view'
                }
                onClick={() => setView('list')}
                title="List view"
                aria-label="List view"
              >
                <List size={20} />
              </button>

            </div>
          </section>

          {loading ? (
            <div className="library-message">
              Loading your books...
            </div>
          ) : error ? (
            <div className="library-message">
              {error}
              <button onClick={loadBooks}>Try Again</button>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="library-empty">

              <BookOpen size={52} />

              <h2>
                {showFavorites
                  ? 'No favorite books yet'
                  : search
                    ? 'No matching books'
                    : 'Your library is empty'}
              </h2>

              <p>
                {showFavorites
                  ? 'Mark a book with the heart button to add it here.'
                  : search
                    ? 'Try another title or author.'
                    : 'Create your first book to get started.'}
              </p>

              {!search && !showFavorites && (
                <button onClick={() => navigate('/create-book')}>
                  Create Your First Book
                </button>
              )}

            </div>
          ) : (

            <div
              className={
                view === 'grid'
                  ? 'library-grid'
                  : 'library-list'
              }
            >

              {filteredBooks.map(book => {
                const design = coverDesigns[book._id];
                const favorite = favorites.includes(book._id);

                return (
                  <article
                    className="library-card"
                    key={book._id}
                  >

                    <div
                      className="library-cover"
                      style={getCoverStyle(book)}
                    >

                      {renderCoverContent(design, book)}

                      <button
                        className={
                          favorite
                            ? 'library-favorite active'
                            : 'library-favorite'
                        }
                        onClick={() => toggleFavorite(book._id)}
                        title={
                          favorite
                            ? 'Remove from favorites'
                            : 'Add to favorites'
                        }
                        aria-label="Toggle favorite"
                      >
                        <Heart
                          size={19}
                          fill={favorite ? 'currentColor' : 'none'}
                        />
                      </button>

                    </div>

                    <div className="library-card-info">

                      <span className="library-category">
                        DIGITAL BOOK
                      </span>

                      <h3>{book.title}</h3>

                      <p>
                        By {book.author || 'Unknown Author'}
                      </p>

                      <div className="library-meta">

                        <span>
                          <BookOpen size={15} />
                          {book.chapters?.length || 0} Chapters
                        </span>

                        <span>
                          <CalendarDays size={15} />
                          {formatDate(book.createdAt)}
                        </span>

                        <span>
                          <Clock3 size={15} />
                          Updated {formatDate(book.updatedAt)}
                        </span>

                      </div>

                      <div className="library-actions">

                        <button
                          className="library-read-button"
                          onClick={() =>
                            navigate(`/read/${book._id}`)
                          }
                        >
                          <BookOpen size={16} />
                          Read
                        </button>

                        <button
                          onClick={() =>
                            navigate('/create-book', {
                              state: { book }
                            })
                          }
                        >
                          <Pencil size={16} />
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            navigate(`/cover/${book._id}`)
                          }
                        >
                          <Palette size={16} />
                          Design Cover
                        </button>

                        <button
                          className="library-delete"
                          onClick={() => handleDelete(book._id)}
                          aria-label={`Delete ${book.title}`}
                        >
                          <Trash2 size={17} />
                        </button>

                      </div>
                    </div>
                  </article>
                );
              })}

            </div>
          )}

        </div>

        <footer className="library-footer">
          Made with creativity and BookCraft
        </footer>

      </main>
    </div>
  );
}

export default MyLibrary;
