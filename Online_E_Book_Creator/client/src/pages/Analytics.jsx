
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  ArrowLeft,
  BookOpen,
  BookCheck,
  Layers,
  TrendingUp,
  Clock3,
  Activity,
  Library,
  RefreshCw,
  Timer,
  BarChart3,
  Flame
} from 'lucide-react';

import { getBooks } from '../services/api';
import './Analytics.css';

const HISTORY_KEY = 'bookcraft-reading-history';
const SESSIONS_KEY = 'bookcraft-reading-sessions';

function readLocalData(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function readHistory() {
  return readLocalData(HISTORY_KEY);
}

function readSessions() {
  return readLocalData(SESSIONS_KEY);
}

function getProgress(book, historyEntry) {
  const total = book.chapters?.length || 0;

  if (!total || !historyEntry) return 0;

  const lastChapter = Number(historyEntry.lastChapter);

  if (!Number.isFinite(lastChapter)) return 0;

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(((Math.max(0, lastChapter) + 1) / total) * 100)
    )
  );
}

function formatDuration(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;

  return `${remainingSeconds}s`;
}

function formatChartDuration(seconds) {
  if (seconds <= 0) return '0m';

  const minutes = Math.round(seconds / 60);

  if (minutes < 1) return '<1m';

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return remainingMinutes
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  }

  return `${minutes}m`;
}

function Analytics() {
  const navigate = useNavigate();

  const [books, setBooks] = useState([]);
  const [history, setHistory] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const syncLocalAnalytics = useCallback(() => {
    setHistory(readHistory());
    setSessions(readSessions());
  }, []);

  const loadAnalytics = useCallback(async () => {
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
      syncLocalAnalytics();
    } catch (err) {
      console.error('Analytics loading error:', err);
      setError('Unable to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [syncLocalAnalytics]);

  useEffect(() => {
    loadAnalytics();

    const handleHistoryUpdate = () => {
      setHistory(readHistory());
    };

    const handleSessionsUpdate = () => {
      setSessions(readSessions());
    };

    const handleStorageUpdate = event => {
      if (
        !event.key ||
        event.key === HISTORY_KEY ||
        event.key === SESSIONS_KEY
      ) {
        syncLocalAnalytics();
      }
    };

    window.addEventListener(
      'bookcraft-history-updated',
      handleHistoryUpdate
    );

    window.addEventListener(
      'bookcraft-sessions-updated',
      handleSessionsUpdate
    );

    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      window.removeEventListener(
        'bookcraft-history-updated',
        handleHistoryUpdate
      );

      window.removeEventListener(
        'bookcraft-sessions-updated',
        handleSessionsUpdate
      );

      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [loadAnalytics, syncLocalAnalytics]);

  const analytics = useMemo(() => {
    const historyMap = new Map(
      history.map(entry => [String(entry.bookId), entry])
    );

    const bookStats = books.map(book => {
      const entry = historyMap.get(String(book._id));
      const progress = getProgress(book, entry);
      const totalChapters = book.chapters?.length || 0;

      return {
        ...book,
        progress,
        totalChapters,
        historyEntry: entry,
        status: !entry
          ? 'Not started'
          : progress >= 100
            ? 'Reached final chapter'
            : 'Currently reading'
      };
    });

    const totalBooks = books.length;

    const totalChapters = books.reduce(
      (sum, book) => sum + (book.chapters?.length || 0),
      0
    );

    const startedBooks = bookStats.filter(
      book => book.historyEntry
    );

    const completedBooks = bookStats.filter(
      book => book.historyEntry && book.progress >= 100
    );

    const currentlyReading = bookStats.filter(
      book => book.historyEntry && book.progress < 100
    );

    const averageProgress = startedBooks.length
      ? Math.round(
          startedBooks.reduce(
            (sum, book) => sum + book.progress,
            0
          ) / startedBooks.length
        )
      : 0;

    const recentBooks = [...startedBooks].sort(
      (a, b) =>
        new Date(b.historyEntry.lastReadAt || 0) -
        new Date(a.historyEntry.lastReadAt || 0)
    );

    // VALID READING SESSIONS
    const validSessions = sessions.filter(session => {
      const duration = Number(session.durationSeconds);

      return (
        Number.isFinite(duration) &&
        duration > 0 &&
        session.startedAt &&
        !Number.isNaN(new Date(session.startedAt).getTime())
      );
    });

    // TOTAL READING TIME
    const totalReadingSeconds = validSessions.reduce(
      (sum, session) =>
        sum + Math.max(0, Number(session.durationSeconds) || 0),
      0
    );

    const totalSessions = validSessions.length;

    const averageSessionSeconds = totalSessions
      ? Math.round(totalReadingSeconds / totalSessions)
      : 0;

    // LAST 7 DAYS OF READING TIME
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weeklyActivity = Array.from(
      { length: 7 },
      (_, index) => {
        const date = new Date(today);

        date.setDate(today.getDate() - (6 - index));

        const dailySessions = validSessions.filter(session => {
          const sessionDate = new Date(session.startedAt);

          return (
            sessionDate.getFullYear() === date.getFullYear() &&
            sessionDate.getMonth() === date.getMonth() &&
            sessionDate.getDate() === date.getDate()
          );
        });

        const seconds = dailySessions.reduce(
          (sum, session) =>
            sum + Number(session.durationSeconds || 0),
          0
        );

        return {
          label: date.toLocaleDateString('en-US', {
            weekday: 'short'
          }),
          date: date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short'
          }),
          seconds,
          sessions: dailySessions.length
        };
      }
    );

    const maxDailySeconds = Math.max(
      1,
      ...weeklyActivity.map(day => day.seconds)
    );

    const weeklyReadingSeconds = weeklyActivity.reduce(
      (sum, day) => sum + day.seconds,
      0
    );

    // MOST READ BOOKS
    const bookTimeMap = new Map();

    validSessions.forEach(session => {
      const bookId = String(session.bookId);

      if (!session.bookId) return;

      if (!bookTimeMap.has(bookId)) {
        bookTimeMap.set(bookId, {
          bookId,
          title: session.bookTitle || 'Untitled Book',
          seconds: 0,
          sessions: 0
        });
      }

      const bookData = bookTimeMap.get(bookId);

      bookData.seconds += Number(session.durationSeconds || 0);
      bookData.sessions += 1;
    });

    const mostReadBooks = [...bookTimeMap.values()]
      .sort((a, b) => b.seconds - a.seconds)
      .slice(0, 5);

    const maxBookSeconds = Math.max(
      1,
      ...mostReadBooks.map(book => book.seconds)
    );

    const recentActivityCount = weeklyActivity.reduce(
      (sum, day) => sum + day.sessions,
      0
    );

    return {
      totalBooks,
      totalChapters,
      startedBooks: startedBooks.length,
      completedBooks: completedBooks.length,
      currentlyReading: currentlyReading.length,
      averageProgress,
      recentBooks: recentBooks.slice(0, 5),
      totalReadingSeconds,
      totalSessions,
      averageSessionSeconds,
      weeklyActivity,
      maxDailySeconds,
      weeklyReadingSeconds,
      mostReadBooks,
      maxBookSeconds,
      recentActivityCount
    };
  }, [books, history, sessions]);

  if (loading) {
    return (
      <div className="analytics-loading">
        <RefreshCw className="analytics-spinner" size={28} />
        <p>Preparing your reading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-loading">
        <p>{error}</p>
        <button onClick={loadAnalytics}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      {/* HEADER */}
      <header className="analytics-header">
        <button
          className="analytics-back"
          onClick={() => navigate('/library')}
        >
          <ArrowLeft size={18} />
          Back to Library
        </button>

        <div className="analytics-brand">
          <BookOpen size={25} />
          <span>BookCraft</span>
        </div>
      </header>

      <main className="analytics-main">
        {/* INTRO */}
        <section className="analytics-intro">
          <div>
            <span className="analytics-eyebrow">
              YOUR READING OVERVIEW
            </span>

            <h1>Reading Analytics</h1>

            <p>
              Track your library, reading time, progress and activity.
            </p>
          </div>

          <button
            className="analytics-refresh"
            onClick={loadAnalytics}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </section>

        {/* LIBRARY STATISTICS */}
        <section className="analytics-section-title">
          <h2>Library Overview</h2>
        </section>

        <section className="analytics-stats">
          <div className="analytics-stat-card">
            <div className="analytics-stat-icon purple">
              <Library size={22} />
            </div>
            <span>Total Books</span>
            <strong>{analytics.totalBooks}</strong>
            <small>Books in your library</small>
          </div>

          <div className="analytics-stat-card">
            <div className="analytics-stat-icon blue">
              <Layers size={22} />
            </div>
            <span>Total Chapters</span>
            <strong>{analytics.totalChapters}</strong>
            <small>Across all your books</small>
          </div>

          <div className="analytics-stat-card">
            <div className="analytics-stat-icon green">
              <BookCheck size={22} />
            </div>
            <span>Reached Final Chapter</span>
            <strong>{analytics.completedBooks}</strong>
            <small>Books where you reached the last chapter</small>
          </div>

          <div className="analytics-stat-card">
            <div className="analytics-stat-icon orange">
              <Activity size={22} />
            </div>
            <span>Currently Reading</span>
            <strong>{analytics.currentlyReading}</strong>
            <small>Books with reading activity</small>
          </div>
        </section>

        {/* READING TIME STATISTICS */}
        <section className="analytics-section-title">
          <h2>Reading Time</h2>
          <p>Your tracked reading sessions</p>
        </section>

        <section className="analytics-stats reading-time-stats">
          <div className="analytics-stat-card">
            <div className="analytics-stat-icon purple">
              <Clock3 size={22} />
            </div>
            <span>Total Reading Time</span>
            <strong className="time-stat-value">
              {formatDuration(analytics.totalReadingSeconds)}
            </strong>
            <small>Combined active reading time</small>
          </div>

          <div className="analytics-stat-card">
            <div className="analytics-stat-icon blue">
              <BookOpen size={22} />
            </div>
            <span>Reading Sessions</span>
            <strong>{analytics.totalSessions}</strong>
            <small>Sessions with recorded reading time</small>
          </div>

          <div className="analytics-stat-card">
            <div className="analytics-stat-icon green">
              <Timer size={22} />
            </div>
            <span>Average Session</span>
            <strong className="time-stat-value">
              {formatDuration(analytics.averageSessionSeconds)}
            </strong>
            <small>Average time per session</small>
          </div>

          <div className="analytics-stat-card">
            <div className="analytics-stat-icon orange">
              <Flame size={22} />
            </div>
            <span>Last 7 Days</span>
            <strong className="time-stat-value">
              {formatDuration(analytics.weeklyReadingSeconds)}
            </strong>
            <small>Reading time this week</small>
          </div>
        </section>

        {/* PROGRESS AND READING ACTIVITY */}
        <section className="analytics-content-grid">
          <div className="analytics-panel progress-panel">
            <div className="analytics-panel-heading">
              <div>
                <h2>Reading Progress</h2>
                <p>
                  Your average progress across books you've opened
                </p>
              </div>

              <TrendingUp size={22} />
            </div>

            <div className="overall-progress">
              <strong>{analytics.averageProgress}%</strong>
              <span>Average progress</span>
            </div>

            <div className="analytics-progress-track">
              <div
                className="analytics-progress-fill"
                style={{
                  width: `${analytics.averageProgress}%`
                }}
              />
            </div>

            <div className="progress-breakdown">
              <div>
                <span className="progress-dot green-dot" />
                <span>Reached final chapter</span>
                <strong>{analytics.completedBooks}</strong>
              </div>

              <div>
                <span className="progress-dot blue-dot" />
                <span>Currently reading</span>
                <strong>{analytics.currentlyReading}</strong>
              </div>

              <div>
                <span className="progress-dot gray-dot" />
                <span>Not started</span>
                <strong>
                  {analytics.totalBooks - analytics.startedBooks}
                </strong>
              </div>
            </div>
          </div>

          {/* DAILY READING TIME */}
          <div className="analytics-panel activity-panel">
            <div className="analytics-panel-heading">
              <div>
                <h2>Daily Reading Activity</h2>
                <p>Time spent reading over the last 7 days</p>
              </div>

              <BarChart3 size={22} />
            </div>

            <div className="weekly-total">
              <strong>
                {formatDuration(analytics.weeklyReadingSeconds)}
              </strong>
              <span>Total this week</span>
            </div>

            <div className="activity-chart">
              {analytics.weeklyActivity.map(day => (
                <div
                  className="activity-day"
                  key={day.date}
                  title={`${day.date}: ${formatDuration(day.seconds)}`}
                >
                  <strong>
                    {formatChartDuration(day.seconds)}
                  </strong>

                  <div className="activity-bar-area">
                    <div
                      className="activity-bar"
                      style={{
                        height: `${
                          day.seconds > 0
                            ? Math.max(
                                8,
                                (day.seconds / analytics.maxDailySeconds) * 100
                              )
                            : 3
                        }%`
                      }}
                    />
                  </div>

                  <span>{day.label}</span>
                </div>
              ))}
            </div>

            <p className="activity-note">
              Daily totals are calculated from saved reading sessions.
            </p>
          </div>
        </section>

        {/* MOST READ BOOKS */}
        <section className="analytics-panel most-read-panel">
          <div className="analytics-panel-heading">
            <div>
              <h2>Most Read Books</h2>
              <p>Ranked by your recorded reading time</p>
            </div>

            <TrendingUp size={22} />
          </div>

          {analytics.mostReadBooks.length === 0 ? (
            <div className="analytics-empty">
              <Clock3 size={34} />
              <h3>No reading time recorded yet</h3>
              <p>
                Open a book and spend some time reading to see your
                most-read books here.
              </p>
            </div>
          ) : (
            <div className="most-read-list">
              {analytics.mostReadBooks.map((book, index) => (
                <div className="most-read-row" key={book.bookId}>
                  <div className="most-read-rank">
                    {index + 1}
                  </div>

                  <div className="most-read-info">
                    <strong>{book.title}</strong>

                    <div className="most-read-track">
                      <div
                        style={{
                          width: `${
                            (book.seconds / analytics.maxBookSeconds) * 100
                          }%`
                        }}
                      />
                    </div>

                    <span>
                      {book.sessions} reading sessions
                    </span>
                  </div>

                  <strong className="most-read-time">
                    {formatDuration(book.seconds)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* RECENTLY OPENED BOOKS */}
        <section className="analytics-panel recent-panel">
          <div className="analytics-panel-heading">
            <div>
              <h2>Recently Opened Books</h2>
              <p>Your latest reading activity</p>
            </div>

            <BookOpen size={22} />
          </div>

          {analytics.recentBooks.length === 0 ? (
            <div className="analytics-empty">
              <BookOpen size={34} />
              <h3>No reading activity yet</h3>
              <p>
                Open a book from your library to see your progress here.
              </p>

              <button onClick={() => navigate('/library')}>
                Explore My Library
              </button>
            </div>
          ) : (
            <div className="recent-books-list">
              {analytics.recentBooks.map(book => (
                <div className="recent-book-row" key={book._id}>
                  <div className="recent-book-icon">
                    <BookOpen size={21} />
                  </div>

                  <div className="recent-book-info">
                    <strong>{book.title}</strong>

                    <span>
                      {book.historyEntry.lastChapterTitle ||
                        `Chapter ${(Number(book.historyEntry.lastChapter) || 0) + 1}`}
                      {' · '}
                      {book.totalChapters} chapters
                    </span>

                    <div className="recent-book-progress">
                      <div
                        style={{ width: `${book.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="recent-book-meta">
                    <strong>{book.progress}%</strong>

                    <span>
                      {book.historyEntry.lastReadAt
                        ? new Date(
                            book.historyEntry.lastReadAt
                          ).toLocaleDateString()
                        : 'Date unavailable'}
                    </span>
                  </div>

                  <button
                    className="recent-book-open"
                    onClick={() => navigate(`/read/${book._id}`)}
                  >
                    Continue
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="analytics-disclaimer">
          Reading time is calculated from active reader sessions on this
          device. Time is paused when the browser tab is hidden or when
          there is no activity for 60 seconds. Zero-second sessions are
          excluded from reading-time statistics.
        </p>
      </main>
    </div>
  );
}

export default Analytics;

