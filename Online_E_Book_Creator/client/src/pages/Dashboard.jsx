import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  BookOpen,
  Library,
  Plus,
  Search,
  Pencil,
  Trash2,
  FileText,
  Clock3,
  PlayCircle,
  History,
  Heart,
  Palette
} from 'lucide-react';

import {
  getBooks,
  deleteBook as deleteBookAPI
} from '../services/api';

import './Dashboard.css';
import Sidebar from '../components/Sidebar';

const templates = [
  { background: 'linear-gradient(145deg, #7046d8, #29145f)', color: '#ffffff' },
  { background: 'linear-gradient(145deg, #171717, #4b3710)', color: '#f5d47a' },
  { background: 'linear-gradient(145deg, #1674d1, #102b67)', color: '#ffffff' },
  { background: 'linear-gradient(145deg, #f5eee2, #d8c7ae)', color: '#30251e' },
  { background: 'linear-gradient(145deg, #ed9cae, #813c65)', color: '#ffffff' },
  { background: 'linear-gradient(145deg, #286b54, #10372d)', color: '#ffffff' }
];

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  });

  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [readingHistory, setReadingHistory] = useState([]);
  const [coverDesigns, setCoverDesigns] = useState({});

  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('bookcraft-favorites') || '[]'
      );
    } catch {
      return [];
    }
  });

  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const loadCoverDesigns = useCallback((bookList) => {
    const designs = {};

    bookList.forEach(book => {
      try {
        const saved = localStorage.getItem(
          `bookcraft-cover-${book._id}`
        );

        if (saved) {
          designs[book._id] = JSON.parse(saved);
        }
      } catch (error) {
        console.error('Cover loading error:', error);
      }
    });

    setCoverDesigns(designs);
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

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await getBooks();
      const data = Array.isArray(response) ? response : response.data;
      const bookList = Array.isArray(data) ? data : [];

      setBooks(bookList);
      loadCoverDesigns(bookList);
      loadReadingHistory();

    } catch (err) {
      console.error(err);
      setError('Unable to load books. Please check your backend.');
    } finally {
      setLoading(false);
    }
  }, [loadCoverDesigns, loadReadingHistory]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  useEffect(() => {
    localStorage.setItem(
      'bookcraft-favorites',
      JSON.stringify(favorites)
    );
  }, [favorites]);

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

  useEffect(() => {
    const refresh = () => {
      loadCoverDesigns(books);
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
  }, [books, loadCoverDesigns, loadReadingHistory]);

  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      const title = book.title || '';
      const author = book.author || '';

      const matchesSearch =
        title.toLowerCase().includes(search.toLowerCase()) ||
        author.toLowerCase().includes(search.toLowerCase());

      const matchesFavorite =
        !showFavoritesOnly || favorites.includes(book._id);

      return matchesSearch && matchesFavorite;
    });
  }, [books, search, showFavoritesOnly, favorites]);

  const recentBooks = useMemo(() => {
    return readingHistory
      .filter(entry => books.some(book => book._id === entry.bookId))
      .sort((a, b) =>
        new Date(b.lastReadAt).getTime() -
        new Date(a.lastReadAt).getTime()
      );
  }, [readingHistory, books]);

  const formatDate = date => {
    if (!date) return 'Recently read';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Recently read';
    }

    return parsedDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getCoverStyle = design => {
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
      background: design.template === 0
        ? design.customColor || selected.background
        : selected.background,
      color: selected.color
    };
  };

  const handleCreate = () => navigate('/create-book');

  const handleRead = book => navigate(`/read/${book._id}`);

  const handleEdit = book => navigate('/create-book', {
    state: { book }
  });

  const handleDesignCover = book => navigate(`/cover/${book._id}`);

  const handleContinue = entry => navigate(`/read/${entry.bookId}`);

  const toggleFavorite = bookId => {
    setFavorites(previous =>
      previous.includes(bookId)
        ? previous.filter(id => id !== bookId)
        : [...previous, bookId]
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

      const updatedHistory = readingHistory.filter(
        entry => entry.bookId !== id
      );

      setReadingHistory(updatedHistory);

      localStorage.setItem(
        'bookcraft-reading-history',
        JSON.stringify(updatedHistory)
      );

      setFavorites(previous =>
        previous.filter(favoriteId => favoriteId !== id)
      );

      localStorage.removeItem(`bookcraft-cover-${id}`);

      setCoverDesigns(previous => {
        const updated = { ...previous };
        delete updated[id];
        return updated;
      });

    } catch (err) {
      console.error(err);
      alert('Unable to delete book.');
    }
  };

  const renderCoverContent = (design, bookTitle, bookAuthor) => {
    if (design?.uploadedImage && design.uploadMode === 'complete') {
      return null;
    }

    return (
      <div className="dashboard-cover-content">
        {!design?.uploadedImage && <BookOpen size={42} />}

        <strong>
          {design?.title || bookTitle || 'Your Book'}
        </strong>

        <span>
          {design?.author || bookAuthor || 'BookCraft'}
        </span>
      </div>
    );
  };

  return (
    <div className="dashboard-layout">

      <Sidebar />

      <main className="dashboard-main">

        <div className="dashboard-content">

          <section className="books-section">

            <div className="books-toolbar">
              <div>
                <h1>My Recent Books</h1>
                <p>
                  Welcome, {user?.name || 'Book Creator'}!
                  Pick up where your creativity left off.
                </p>
              </div>
            </div>

            <section className="continue-section">

              <div className="continue-heading">
                <h2>
                  <History size={22} />
                  Continue Reading
                </h2>
                <p>Your recently opened books appear here.</p>
              </div>

              {recentBooks.length === 0 ? (
                <div className="continue-empty">
                  <BookOpen size={30} />
                  <div>
                    <strong>No reading history yet</strong>
                    <p>
                      Open a book and read a chapter.
                      Your reading activity will appear here.
                    </p>
                  </div>
                </div>
              ) : (

                <div className="continue-grid">

                  {recentBooks.map(entry => {
                    const originalBook = books.find(
                      book => book._id === entry.bookId
                    );

                    const totalChapters =
                      originalBook?.chapters?.length || 0;

                    const progress = totalChapters > 0
                      ? Math.min(
                          100,
                          Math.max(
                            0,
                            Math.round(
                              ((Number(entry.lastChapter) + 1) /
                                totalChapters) * 100
                            )
                          )
                        )
                      : 0;

                    const design = coverDesigns[entry.bookId];

                    return (
                      <div className="continue-card" key={entry.bookId}>

                        <div
                          className="continue-cover"
                          style={getCoverStyle(design)}
                        >
                          {renderCoverContent(
                            design,
                            entry.title,
                            entry.author
                          )}
                        </div>

                        <div className="continue-details">

                          <span className="continue-label">
                            RECENTLY OPENED
                          </span>

                          <h3>{entry.title}</h3>
                          <p>By {entry.author}</p>

                          <p className="continue-chapter">
                            Last chapter: {entry.lastChapterTitle ||
                              `Chapter ${(Number(entry.lastChapter) || 0) + 1}`}
                          </p>

                          <div className="continue-progress">
                            <div className="continue-progress-track">
                              <div
                                className="continue-progress-fill"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span>{progress}%</span>
                          </div>

                          <div className="continue-bottom">
                            <span>
                              <Clock3 size={15} />
                              {formatDate(entry.lastReadAt)}
                            </span>

                            <button onClick={() => handleContinue(entry)}>
                              <PlayCircle size={17} />
                              Continue
                            </button>
                          </div>

                        </div>
                      </div>
                    );
                  })}

                </div>
              )}

            </section>

            <div className="books-toolbar">

              <div className="search-box">
                <Search size={21} />

                <input
                  type="text"
                  placeholder="Search by book title or author..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <button
                className="new-book-button"
                onClick={handleCreate}
              >
                <Plus size={21} />
                New Book
              </button>

            </div>

            <div className="favorite-filter">

              <button
                className={!showFavoritesOnly ? 'filter-active' : ''}
                onClick={() => setShowFavoritesOnly(false)}
              >
                <Library size={17} />
                All Books ({books.length})
              </button>

              <button
                className={showFavoritesOnly ? 'filter-active' : ''}
                onClick={() => setShowFavoritesOnly(true)}
              >
                <Heart size={17} />
                Favorites ({favorites.filter(id =>
                  books.some(book => book._id === id)
                ).length})
              </button>

            </div>

            {loading ? (
              <div className="loading-state">
                Loading your books...
              </div>
            ) : error ? (
              <div className="empty-state">
                {error}
                <button onClick={fetchBooks}>Try Again</button>
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="empty-state">
                <BookOpen size={45} />

                <h2>
                  {showFavoritesOnly
                    ? 'No favorite books yet'
                    : 'No books found'}
                </h2>

                <p>
                  {showFavoritesOnly
                    ? 'Click the heart on a book to add it to Favorites.'
                    : 'Create your first digital book.'}
                </p>

                {showFavoritesOnly ? (
                  <button onClick={() => setShowFavoritesOnly(false)}>
                    Show All Books
                  </button>
                ) : (
                  <button onClick={handleCreate}>
                    <Plus size={18} />
                    Create Book
                  </button>
                )}
              </div>
            ) : (

              <div className="books-grid">

                {filteredBooks.map(book => {
                  const isFavorite = favorites.includes(book._id);
                  const design = coverDesigns[book._id];

                  return (
                    <div className="book-card" key={book._id}>

                      <div
                        className="book-cover"
                        style={getCoverStyle(design)}
                      >

                        {renderCoverContent(
                          design,
                          book.title,
                          book.author
                        )}

                        <button
                          className={
                            isFavorite
                              ? 'favorite-button favorited'
                              : 'favorite-button'
                          }
                          onClick={() => toggleFavorite(book._id)}
                          title={
                            isFavorite
                              ? 'Remove from favorites'
                              : 'Add to favorites'
                          }
                          aria-label={
                            isFavorite
                              ? `Remove ${book.title} from favorites`
                              : `Add ${book.title} to favorites`
                          }
                        >
                          <Heart
                            size={21}
                            fill={isFavorite ? 'currentColor' : 'none'}
                          />
                        </button>

                      </div>

                      <div className="book-details">

                        <span className="book-category">
                          DIGITAL BOOK
                        </span>

                        <h3>{book.title}</h3>

                        <p className="book-author">
                          By {book.author || 'Unknown Author'}
                        </p>

                        <div className="book-info">

                          <div>
                            <FileText size={18} />
                            <span>
                              {book.chapters?.length || 0} Chapters
                            </span>
                          </div>

                          <div>
                            <Clock3 size={18} />
                            <span>{formatDate(book.updatedAt)}</span>
                          </div>

                        </div>

                        <div className="book-actions">

                          <button
                            className="read-button"
                            onClick={() => handleRead(book)}
                          >
                            <BookOpen size={17} />
                            Read
                          </button>

                          <button
                            className="edit-button"
                            onClick={() => handleEdit(book)}
                          >
                            <Pencil size={17} />
                            Edit Book
                          </button>

                          <button
                            className="design-cover-button"
                            onClick={() => handleDesignCover(book)}
                          >
                            <Palette size={17} />
                            Design Cover
                          </button>

                          <button
                            className="delete-button"
                            onClick={() => handleDelete(book._id)}
                            aria-label={`Delete ${book.title}`}
                          >
                            <Trash2 size={18} />
                          </button>

                        </div>

                      </div>
                    </div>
                  );
                })}

              </div>
            )}

          </section>

        </div>

        <footer className="dashboard-footer">
          Made with creativity and BookCraft
        </footer>

      </main>

    </div>
  );
}

export default Dashboard;