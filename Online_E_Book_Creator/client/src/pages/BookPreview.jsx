
import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  BookOpen,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  List,
  Download,
  Minus,
  Plus,
  Maximize,
  Minimize,
  Bookmark,
  BookmarkCheck,
  Highlighter,
  StickyNote,
  Palette,
  Type,
  Trash2,
  X
} from 'lucide-react';

import { jsPDF } from 'jspdf';
import { getBooks, updateBook } from '../services/api';
import './BookPreview.css';

const HISTORY_KEY = 'bookcraft-reading-history';
const SESSIONS_KEY = 'bookcraft-reading-sessions';
const SETTINGS_KEY = 'bookcraft-settings';
const IDLE_LIMIT = 60;

const DEFAULT_SETTINGS = {
  theme: 'light',
  fontSize: 18,
  fontFamily: 'Georgia',
  lineSpacing: 1.7
};

// READ SAVED READER SETTINGS
function getReaderSettings() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(SETTINGS_KEY) || '{}'
    );

    let theme = saved.theme || DEFAULT_SETTINGS.theme;

    if (theme === 'system') {
      theme = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches ? 'dark' : 'light';
    }

    return {
      fontSize: Number(saved.fontSize) || DEFAULT_SETTINGS.fontSize,
      fontFamily: saved.fontFamily || DEFAULT_SETTINGS.fontFamily,
      lineSpacing: Number(saved.lineSpacing) || DEFAULT_SETTINGS.lineSpacing,
      theme: ['light', 'dark', 'sepia'].includes(theme)
        ? theme
        : 'light'
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

// SAFE LOCAL STORAGE READER
function safeRead(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function BookPreview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const bookmarkKey = `bookcraft-bookmarks-${id}`;
  const highlightKey = `bookcraft-highlights-${id}`;

  const [book, setBook] = useState(null);
  const [activeChapter, setActiveChapter] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  // SETTINGS INTEGRATION
  const [readerSettings, setReaderSettings] = useState(
    getReaderSettings
  );

  const { fontSize, theme, fontFamily, lineSpacing } = readerSettings;

  const setFontSize = value => {
    setReaderSettings(previous => ({
      ...previous,
      fontSize: typeof value === 'function'
        ? value(previous.fontSize)
        : value
    }));
  };

  const setTheme = value => {
    setReaderSettings(previous => ({
      ...previous,
      theme: value
    }));
  };

  const setFontFamily = value => {
    setReaderSettings(previous => ({
      ...previous,
      fontFamily: value
    }));
  };

  const setLineSpacing = value => {
    setReaderSettings(previous => ({
      ...previous,
      lineSpacing: value
    }));
  };

  // REFRESH SETTINGS WHEN SAVED FROM SETTINGS PAGE
  useEffect(() => {
    const refreshSettings = () => {
      setReaderSettings(getReaderSettings());
    };

    window.addEventListener(
      'bookcraft-settings-updated',
      refreshSettings
    );

    window.addEventListener('focus', refreshSettings);

    return () => {
      window.removeEventListener(
        'bookcraft-settings-updated',
        refreshSettings
      );

      window.removeEventListener('focus', refreshSettings);
    };
  }, []);

  const [isFullscreen, setIsFullscreen] = useState(false);

  // BOOKMARKS
  const [bookmarks, setBookmarks] = useState(() =>
    safeRead(bookmarkKey)
  );

  // HIGHLIGHTS
  const [highlights, setHighlights] = useState(() =>
    safeRead(highlightKey)
  );

  // NOTES
  const [notes, setNotes] = useState([]);
  const [noteInput, setNoteInput] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [selectedColor, setSelectedColor] = useState('yellow');

  const chapterTextRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // RESTORE DATA WHEN BOOK ID CHANGES
  useEffect(() => {
    setBookmarks(safeRead(bookmarkKey));
    setHighlights(safeRead(highlightKey));
  }, [bookmarkKey, highlightKey]);

  // SAVE BOOKMARKS
  useEffect(() => {
    try {
      localStorage.setItem(
        bookmarkKey,
        JSON.stringify(bookmarks)
      );
    } catch (err) {
      console.error('Bookmark saving error:', err);
    }
  }, [bookmarks, bookmarkKey]);

  // SAVE HIGHLIGHTS
  useEffect(() => {
    try {
      localStorage.setItem(
        highlightKey,
        JSON.stringify(highlights)
      );
    } catch (err) {
      console.error('Highlight saving error:', err);
    }
  }, [highlights, highlightKey]);

  // LOAD BOOK AND NOTES
  useEffect(() => {
    let cancelled = false;

    const loadBook = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await getBooks();

        const data = Array.isArray(response)
          ? response
          : response?.data;

        const books = Array.isArray(data)
          ? data
          : Array.isArray(data?.books)
            ? data.books
            : [];

        const selectedBook = books.find(
          item => String(item._id) === String(id)
        );

        if (cancelled) return;

        if (!selectedBook) {
          setError('Book not found.');
          return;
        }

        setBook(selectedBook);

        setNotes(
          Array.isArray(selectedBook.notes)
            ? selectedBook.notes
            : []
        );

        const history = safeRead(HISTORY_KEY);

        const previousEntry = history.find(
          item => String(item.bookId) === String(id)
        );

        const savedChapter = Number(previousEntry?.lastChapter);

        if (
          Number.isInteger(savedChapter) &&
          savedChapter >= 0 &&
          savedChapter < (selectedBook.chapters || []).length
        ) {
          setActiveChapter(savedChapter);
        } else {
          setActiveChapter(0);
        }
      } catch (err) {
        console.error('Book loading error:', err);

        if (!cancelled) {
          setError(
            err.response?.data?.message ||
            'Unable to load book. Please try again.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    setBook(null);
    setNotes([]);
    loadBook();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // SAVE BOOK AND NOTES TO MONGODB
  const saveBookNotes = async updatedNotes => {
    if (!book) {
      throw new Error('Book is not loaded.');
    }

    const response = await updateBook(id, {
      title: book.title,
      author: book.author,
      chapters: book.chapters,
      notes: updatedNotes
    });

    const updatedBook = response.data;

    setBook(updatedBook);

    setNotes(
      Array.isArray(updatedBook.notes)
        ? updatedBook.notes
        : []
    );

    return updatedBook;
  };

  // SAVE READING HISTORY
  useEffect(() => {
    if (!book) return;

    try {
      const history = safeRead(HISTORY_KEY);

      const updatedEntry = {
        bookId: book._id,
        title: book.title,
        author: book.author || 'Unknown Author',
        lastChapter: activeChapter,
        lastChapterTitle:
          book.chapters?.[activeChapter]?.title || '',
        lastReadAt: new Date().toISOString()
      };

      const updatedHistory = [
        updatedEntry,
        ...history.filter(
          item => String(item.bookId) !== String(book._id)
        )
      ].slice(0, 10);

      localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(updatedHistory)
      );

      window.dispatchEvent(
        new Event('bookcraft-history-updated')
      );
    } catch (err) {
      console.error('Reading history error:', err);
    }
  }, [book, activeChapter]);

  // READING TIME TRACKER
  useEffect(() => {
    if (!book) return;

    const sessionId =
      `${book._id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    lastActivityRef.current = Date.now();

    const startedAt = new Date().toISOString();

    let totalActiveMs = 0;
    let lastTick = Date.now();

    const saveSession = (ended = false) => {
      try {
        const sessions = safeRead(SESSIONS_KEY);

        const session = {
          sessionId,
          bookId: book._id,
          bookTitle: book.title,
          startedAt,
          endedAt: ended ? new Date().toISOString() : null,
          durationSeconds: Math.floor(totalActiveMs / 1000)
        };

        const existingIndex = sessions.findIndex(
          item => item.sessionId === sessionId
        );

        if (existingIndex >= 0) {
          sessions[existingIndex] = session;
        } else {
          sessions.unshift(session);
        }

        localStorage.setItem(
          SESSIONS_KEY,
          JSON.stringify(sessions.slice(0, 1000))
        );

        window.dispatchEvent(
          new Event('bookcraft-sessions-updated')
        );
      } catch (err) {
        console.error('Session error:', err);
      }
    };

    const recordActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const activityEvents = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click'
    ];

    activityEvents.forEach(eventName => {
      window.addEventListener(eventName, recordActivity, {
        passive: true
      });
    });

    const handleVisibilityChange = () => {
      lastTick = Date.now();

      if (!document.hidden) {
        lastActivityRef.current = Date.now();
      }
    };

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    );

    const timer = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - lastTick;

      lastTick = now;

      const isActive =
        !document.hidden &&
        now - lastActivityRef.current <= IDLE_LIMIT * 1000;

      if (isActive && elapsedMs > 0 && elapsedMs <= 5000) {
        totalActiveMs += elapsedMs;
        saveSession(false);
      }
    }, 1000);

    const handlePageHide = () => saveSession(true);

    window.addEventListener('pagehide', handlePageHide);

    return () => {
      clearInterval(timer);

      activityEvents.forEach(eventName => {
        window.removeEventListener(eventName, recordActivity);
      });

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      );

      window.removeEventListener('pagehide', handlePageHide);

      saveSession(true);
    };
  }, [book]);

  // FULLSCREEN TRACKING
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener(
      'fullscreenchange',
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        'fullscreenchange',
        handleFullscreenChange
      );
    };
  }, []);

  const chapters = book?.chapters || [];
  const chapter = chapters[activeChapter];

  const chapterContent =
    chapter?.content || 'No content added to this chapter yet.';

  const progress = chapters.length
    ? Math.round(((activeChapter + 1) / chapters.length) * 100)
    : 0;

  const isBookmarked = bookmarks.includes(activeChapter);

  // PREPARE SAVED HIGHLIGHTS
  const chapterHighlights = useMemo(() => {
    const content = chapterContent;

    return highlights
      .filter(item => item.chapter === activeChapter)
      .map(item => {
        let start = Number.isInteger(item.start)
          ? item.start
          : null;

        let end = Number.isInteger(item.end)
          ? item.end
          : null;

        // RESTORE OLDER TEXT-ONLY HIGHLIGHTS
        if ((start === null || end === null) && item.text) {
          const legacyStart = content.indexOf(item.text);

          if (legacyStart >= 0) {
            start = legacyStart;
            end = legacyStart + item.text.length;
          }
        }

        if (
          start === null ||
          end === null ||
          start < 0 ||
          end <= start ||
          start >= content.length
        ) {
          return null;
        }

        return {
          ...item,
          start,
          end: Math.min(end, content.length)
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.start - b.start);
  }, [highlights, activeChapter, chapterContent]);

  // RENDER HIGHLIGHTED TEXT
  const renderedChapterContent = useMemo(() => {
    if (!chapterHighlights.length) {
      return chapterContent;
    }

    const points = new Set([0, chapterContent.length]);

    chapterHighlights.forEach(item => {
      points.add(item.start);
      points.add(item.end);
    });

    const boundaries = [...points].sort((a, b) => a - b);
    const segments = [];

    for (let i = 0; i < boundaries.length - 1; i++) {
      const start = boundaries[i];
      const end = boundaries[i + 1];

      if (end <= start) continue;

      const active = chapterHighlights.find(
        item => item.start <= start && item.end >= end
      );

      segments.push({
        key: `${start}-${end}`,
        text: chapterContent.slice(start, end),
        color: active?.color || null
      });
    }

    return segments.map(segment =>
      segment.color ? (
        <mark
          key={segment.key}
          className={`reader-inline-highlight ${segment.color}`}
        >
          {segment.text}
        </mark>
      ) : (
        <span key={segment.key}>{segment.text}</span>
      )
    );
  }, [chapterContent, chapterHighlights]);

  // BOOKMARK
  const toggleBookmark = () => {
    setBookmarks(previous =>
      previous.includes(activeChapter)
        ? previous.filter(index => index !== activeChapter)
        : [...previous, activeChapter].sort((a, b) => a - b)
    );
  };

  const openBookmark = index => {
    if (index >= 0 && index < chapters.length) {
      setActiveChapter(index);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // HIGHLIGHT SELECTED TEXT
  const highlightSelection = () => {
    const container = chapterTextRef.current;
    const selection = window.getSelection();

    if (
      !container ||
      !selection ||
      selection.isCollapsed ||
      !selection.rangeCount
    ) {
      alert('First select some text in the chapter.');
      return;
    }

    const range = selection.getRangeAt(0);

    if (!container.contains(range.commonAncestorContainer)) {
      alert('Please select text only inside the chapter content.');
      return;
    }

    const beforeRange = range.cloneRange();
    beforeRange.selectNodeContents(container);

    beforeRange.setEnd(
      range.startContainer,
      range.startOffset
    );

    const start = beforeRange.toString().length;
    const selected = range.toString();
    const end = start + selected.length;

    if (!selected.trim()) {
      alert('First select some text in the chapter.');
      return;
    }

    const duplicate = highlights.some(item =>
      item.chapter === activeChapter &&
      item.start === start &&
      item.end === end
    );

    if (duplicate) {
      alert('This text is already highlighted.');
      return;
    }

    setHighlights(previous => [
      ...previous,
      {
        id: `${Date.now()}-${Math.random()}`,
        chapter: activeChapter,
        chapterTitle: chapter?.title || `Chapter ${activeChapter + 1}`,
        text: selected,
        start,
        end,
        color: selectedColor
      }
    ]);

    selection.removeAllRanges();
  };

  // DELETE HIGHLIGHT
  const removeHighlight = highlightId => {
    setHighlights(previous =>
      previous.filter(item => item.id !== highlightId)
    );
  };

  // ADD NOTE TO MONGODB
  const addNote = async () => {
    const text = noteInput.trim();

    if (!text) {
      alert('Please write a note first.');
      return;
    }

    if (savingNote || !book) return;

    try {
      setSavingNote(true);

      const newNote = {
        chapter: activeChapter,
        chapterTitle: chapter?.title || `Chapter ${activeChapter + 1}`,
        text,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedNotes = [...notes, newNote];

      await saveBookNotes(updatedNotes);

      setNoteInput('');
      alert('Note saved successfully!');
    } catch (err) {
      console.error('Note saving error:', err);
      console.error('Server response:', err.response?.data);

      alert(
        err.response?.data?.message ||
        'Unable to save note. Please try again.'
      );
    } finally {
      setSavingNote(false);
    }
  };

  // DELETE NOTE FROM MONGODB
  const deleteNote = async noteId => {
    if (savingNote || !book) return;

    try {
      setSavingNote(true);

      const updatedNotes = notes.filter(
        note => String(note._id) !== String(noteId)
      );

      await saveBookNotes(updatedNotes);
    } catch (err) {
      console.error('Note deletion error:', err);

      alert(
        err.response?.data?.message ||
        'Unable to delete note. Please try again.'
      );
    } finally {
      setSavingNote(false);
    }
  };

  // PDF DOWNLOAD
  const downloadPDF = () => {
    if (!book) return;

    try {
      setDownloading(true);

      const pdf = new jsPDF();

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 20;
      const usableWidth = pageWidth - margin * 2;

      let y = 25;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(24);

      const titleLines = pdf.splitTextToSize(
        book.title || 'Untitled Book',
        usableWidth
      );

      titleLines.forEach(line => {
        if (y > pageHeight - 25) {
          pdf.addPage();
          y = 25;
        }

        pdf.text(line, margin, y);
        y += 11;
      });

      y += 3;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(12);

      const authorLines = pdf.splitTextToSize(
        `Author: ${book.author || 'Unknown Author'}`,
        usableWidth
      );

      authorLines.forEach(line => {
        if (y > pageHeight - 20) {
          pdf.addPage();
          y = 25;
        }

        pdf.text(line, margin, y);
        y += 7;
      });

      y += 11;

      chapters.forEach((item, index) => {
        if (y > pageHeight - 35) {
          pdf.addPage();
          y = 25;
        }

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(17);

        const headingLines = pdf.splitTextToSize(
          `${index + 1}. ${item.title || 'Untitled Chapter'}`,
          usableWidth
        );

        headingLines.forEach(line => {
          if (y > pageHeight - 25) {
            pdf.addPage();
            y = 25;
          }

          pdf.text(line, margin, y);
          y += 9;
        });

        y += 4;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);

        const contentLines = pdf.splitTextToSize(
          item.content || 'No content available.',
          usableWidth
        );

        contentLines.forEach(line => {
          if (y > pageHeight - 20) {
            pdf.addPage();
            y = 25;
          }

          pdf.text(line, margin, y);
          y += 7;
        });

        y += 15;
      });

      const safeName = (book.title || 'ebook')
        .replace(/[\\/:*?"<>|]/g, '_');

      pdf.save(`${safeName}.pdf`);
    } catch (err) {
      console.error('PDF error:', err);
      alert('Unable to generate PDF.');
    } finally {
      setDownloading(false);
    }
  };

  // FULLSCREEN
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error(err);
      alert('Fullscreen is not available.');
    }
  };

  const increaseFont = () => {
    setFontSize(size => Math.min(size + 2, 32));
  };

  const decreaseFont = () => {
    setFontSize(size => Math.max(size - 2, 12));
  };

  // LOADING
  if (loading) {
    return (
      <div className="reader-loading">
        Loading your book...
      </div>
    );
  }

  // ERROR
  if (error || !book) {
    return (
      <div className="reader-loading">
        <h2>{error || 'Book not found'}</h2>

        <button
          className="back-library"
          onClick={() => navigate('/library')}
        >
          Back to Library
        </button>
      </div>
    );
  }

  return (
    <div className={`reader-page theme-${theme}`}>

      {/* HEADER */}
      <header className="reader-header">

        <button
          className="back-library"
          onClick={() => navigate('/library')}
        >
          <ArrowLeft size={19} />
          Back to Library
        </button>

        <div className="reader-header-right">

          <button
            className="reader-download"
            onClick={downloadPDF}
            disabled={downloading}
          >
            <Download size={18} />
            {downloading ? 'Preparing PDF...' : 'Download PDF'}
          </button>

          <div className="reader-brand">
            <BookOpen size={26} />
            BookCraft
          </div>

        </div>
      </header>

      {/* BOOK HEADING */}
      <section className="reader-book-heading">
        <span>NOW READING</span>
        <h1>{book.title}</h1>
        <p>By {book.author || 'Unknown Author'}</p>
      </section>

      {/* READING PROGRESS */}
      <section className="reading-progress">

        <div className="progress-label">
          <span>Reading progress</span>
          <strong>{progress}%</strong>
        </div>

        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

      </section>

      <div className="reader-layout">

        {/* CHAPTER SIDEBAR */}
        <aside className="chapter-sidebar">

          <h3>
            <List size={20} />
            Table of Contents
          </h3>

          {chapters.length === 0 ? (
            <p>No chapters available.</p>
          ) : (
            chapters.map((item, index) => (
              <button
                key={item._id || index}
                className={
                  activeChapter === index
                    ? 'chapter-link active'
                    : 'chapter-link'
                }
                onClick={() => setActiveChapter(index)}
              >
                <span>{index + 1}.</span>
                {item.title}
              </button>
            ))
          )}

          {/* SAVED BOOKMARKS */}
          <div className="saved-bookmarks">

            <h3>
              <Bookmark size={19} />
              Saved Chapters ({bookmarks.length})
            </h3>

            {bookmarks.length === 0 ? (
              <p className="no-bookmarks">
                No bookmarks yet. Save a chapter while reading.
              </p>
            ) : (
              bookmarks.map(index => (
                <button
                  key={index}
                  className="bookmark-link"
                  onClick={() => openBookmark(index)}
                >
                  <BookmarkCheck size={16} />

                  <span>
                    {chapters[index]?.title || `Chapter ${index + 1}`}
                  </span>
                </button>
              ))
            )}

          </div>

          {/* SAVED HIGHLIGHTS */}
          <div className="reader-sidebar-section">

            <h3>
              <Highlighter size={19} />
              Highlights ({highlights.length})
            </h3>

            {highlights.length === 0 ? (
              <p className="no-bookmarks">No highlights yet.</p>
            ) : (
              highlights.map(item => (
                <div className="saved-highlight" key={item.id}>

                  <span
                    className={`highlight-swatch ${item.color}`}
                  />

                  <p>{item.text}</p>

                  <button
                    onClick={() => removeHighlight(item.id)}
                    title="Remove highlight"
                    aria-label="Delete highlight"
                  >
                    <X size={15} />
                  </button>

                </div>
              ))
            )}

          </div>

        </aside>

        {/* MAIN READER */}
        <main className="reader-content">

          {/* READER TOOLBAR */}
          <div className="reader-toolbar">

            <div className="font-controls">

              <span>Font size</span>

              <button
                onClick={decreaseFont}
                disabled={fontSize <= 12}
              >
                <Minus size={17} />
              </button>

              <strong>{fontSize}px</strong>

              <button
                onClick={increaseFont}
                disabled={fontSize >= 32}
              >
                <Plus size={17} />
              </button>

            </div>

            <div className="advanced-reader-controls">

              <label>
                <Type size={17} />

                <select
                  value={fontFamily}
                  onChange={event =>
                    setFontFamily(event.target.value)
                  }
                  aria-label="Font family"
                >
                  <option value="Georgia">Georgia</option>
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Inter">Inter</option>
                </select>

              </label>

              <label>
                Line spacing

                <select
                  value={lineSpacing}
                  onChange={event =>
                    setLineSpacing(Number(event.target.value))
                  }
                  aria-label="Line spacing"
                >
                  <option value={1}>Compact</option>
                  <option value={1.5}>Normal</option>
                  <option value={1.7}>Settings Default</option>
                  <option value={1.8}>Relaxed</option>
                  <option value={2.1}>Wide</option>
                  <option value={2.5}>Extra Wide</option>
                </select>

              </label>

            </div>

            <div className="reading-tools">

              <label className="theme-control">
                <Palette size={18} />

                <select
                  value={theme}
                  onChange={event => setTheme(event.target.value)}
                  aria-label="Reading theme"
                >
                  <option value="light">Light</option>
                  <option value="sepia">Sepia</option>
                  <option value="dark">Dark</option>
                </select>

              </label>

              <button onClick={toggleFullscreen}>
                {isFullscreen
                  ? <Minimize size={19} />
                  : <Maximize size={19} />}

                {isFullscreen ? 'Exit' : 'Fullscreen'}
              </button>

            </div>

          </div>

          {/* CHAPTER CONTENT */}
          {chapter ? (
            <>

              <div className="chapter-heading-row">

                <div>
                  <span className="chapter-label">
                    CHAPTER {activeChapter + 1}
                  </span>

                  <h2 className="chapter-title">
                    {chapter.title}
                  </h2>
                </div>

                <button
                  className={
                    isBookmarked
                      ? 'bookmark-button bookmarked'
                      : 'bookmark-button'
                  }
                  onClick={toggleBookmark}
                >
                  {isBookmarked
                    ? <BookmarkCheck size={19} />
                    : <Bookmark size={19} />}

                  {isBookmarked ? 'Saved' : 'Bookmark'}
                </button>

              </div>

              {/* HIGHLIGHT TOOLBAR */}
              <div className="highlight-toolbar">

                <div className="highlight-colors">
                  <span>Highlight colour:</span>

                  {['yellow', 'green', 'pink'].map(color => (
                    <button
                      key={color}
                      className={`highlight-color-button ${color} ${
                        selectedColor === color ? 'selected' : ''
                      }`}
                      onClick={() => setSelectedColor(color)}
                      title={color}
                      aria-label={`${color} highlight`}
                    />
                  ))}
                </div>

                <button
                  className="highlight-action"
                  onClick={highlightSelection}
                >
                  <Highlighter size={17} />
                  Highlight selected text
                </button>

                <button
                  className="highlight-action"
                  onClick={() =>
                    setShowNotes(previous => !previous)
                  }
                >
                  <StickyNote size={17} />
                  {showNotes ? 'Close notes' : 'Add a note'}
                </button>

              </div>

              {/* NOTE EDITOR */}
              {showNotes && (
                <div className="note-editor">

                  <textarea
                    value={noteInput}
                    onChange={event =>
                      setNoteInput(event.target.value)
                    }
                    placeholder="Write your thoughts about this chapter..."
                    rows={3}
                  />

                  <button
                    onClick={addNote}
                    disabled={savingNote}
                  >
                    {savingNote ? 'Saving...' : 'Save Note'}
                  </button>

                </div>
              )}

              {/* CHAPTER TEXT */}
              <div
                className="chapter-text"
                ref={chapterTextRef}
                style={{
                  fontSize: `${fontSize}px`,
                  fontFamily,
                  lineHeight: lineSpacing
                }}
              >
                {renderedChapterContent}
              </div>

              {/* CHAPTER NOTES */}
              <div className="chapter-notes">

                <h3>
                  <StickyNote size={19} />
                  My Notes (
                    {notes.filter(
                      note => note.chapter === activeChapter
                    ).length}
                  )
                </h3>

                {notes
                  .filter(note => note.chapter === activeChapter)
                  .map(note => (
                    <div
                      className="saved-note"
                      key={note._id || note.createdAt}
                    >
                      <p>{note.text}</p>

                      <button
                        onClick={() => deleteNote(note._id)}
                        disabled={savingNote || !note._id}
                        title="Delete note"
                        aria-label="Delete note"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}

              </div>

              {/* CHAPTER NAVIGATION */}
              <div className="reader-navigation">

                <button
                  disabled={activeChapter === 0}
                  onClick={() => {
                    setActiveChapter(previous => previous - 1);
                    window.scrollTo({
                      top: 0,
                      behavior: 'smooth'
                    });
                  }}
                >
                  <ChevronLeft size={18} />
                  Previous
                </button>

                <span>
                  {activeChapter + 1} / {chapters.length}
                </span>

                <button
                  disabled={activeChapter === chapters.length - 1}
                  onClick={() => {
                    setActiveChapter(previous => previous + 1);
                    window.scrollTo({
                      top: 0,
                      behavior: 'smooth'
                    });
                  }}
                >
                  Next
                  <ChevronRight size={18} />
                </button>

              </div>

            </>
          ) : (
            <div className="no-chapters">
              <BookOpen size={45} />
              <h2>No chapters yet</h2>
              <p>
                Edit your book and add a chapter to start reading.
              </p>
            </div>
          )}

        </main>

      </div>

    </div>
  );
}

export default BookPreview;



