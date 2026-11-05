
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';

import {
  BookOpen,
  LayoutDashboard,
  Library,
  FileText,
  History,
  User,
  NotebookPen,
  Search,
  Trash2,
  Pencil,
  Highlighter,
  ArrowLeft,
  X,
  Save,
  Download
} from 'lucide-react';

import { getBooks, updateBook } from '../services/api';
import './ReadingJournal.css';

function ReadingJournal() {
  const navigate = useNavigate();

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);

  // LOAD BOOKS
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
    } catch (err) {
      console.error('Journal loading error:', err);
      setError('Unable to load your reading journal.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  // COLLECT NOTES AND HIGHLIGHTS
  const journalItems = useMemo(() => {
    const items = [];

    books.forEach(book => {
      // MONGODB NOTES
      (Array.isArray(book.notes) ? book.notes : []).forEach(note => {
        items.push({
          type: 'note',
          id: String(note._id || note.createdAt || `${book._id}-note-${items.length}`),
          bookId: book._id,
          bookTitle: book.title || 'Untitled Book',
          chapter: note.chapter ?? 0,
          chapterTitle: note.chapterTitle || '',
          text: note.text || '',
          date: note.updatedAt || note.createdAt
        });
      });

      // LOCAL STORAGE HIGHLIGHTS
      try {
        const key = `bookcraft-highlights-${book._id}`;
        const saved = JSON.parse(
          localStorage.getItem(key) || '[]'
        );

        if (Array.isArray(saved)) {
          saved.forEach((highlight, index) => {
            items.push({
              type: 'highlight',
              id: `${book._id}-${index}`,
              storageIndex: index,
              bookId: book._id,
              bookTitle: book.title || 'Untitled Book',
              chapter:
                highlight.chapter ??
                highlight.chapterIndex ??
                0,
              chapterTitle: highlight.chapterTitle || '',
              text:
                highlight.text ||
                highlight.selectedText ||
                highlight.content ||
                highlight.quote ||
                '',
              color: highlight.color || 'yellow',
              date: highlight.createdAt || null
            });
          });
        }
      } catch (err) {
        console.error('Highlight loading error:', err);
      }
    });

    return items.sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();

      return dateB - dateA;
    });
  }, [books]);

  // SEARCH AND FILTER
  const filteredItems = useMemo(() => {
    return journalItems.filter(item => {
      const matchesFilter =
        filter === 'all' || item.type === filter;

      const query = search.trim().toLowerCase();

      const matchesSearch =
        item.text.toLowerCase().includes(query) ||
        item.bookTitle.toLowerCase().includes(query) ||
        item.chapterTitle.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [journalItems, filter, search]);

  const notesCount = journalItems.filter(
    item => item.type === 'note'
  ).length;

  const highlightsCount = journalItems.filter(
    item => item.type === 'highlight'
  ).length;

  const booksCount = new Set(
    journalItems.map(item => item.bookId)
  ).size;

  // DATE FORMAT
  const formatDate = date => {
    if (!date) return 'Date not available';

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return 'Date not available';
    }

    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // EXPORT COMPLETE JOURNAL AS PDF
  const exportJournalPDF = () => {
    try {
      const doc = new jsPDF();

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const margin = 18;
      const contentWidth = pageWidth - margin * 2;

      let y = 20;

      const addPageIfNeeded = height => {
        if (y + height > pageHeight - 20) {
          doc.addPage();
          y = 20;
        }
      };

      // PDF HEADER
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.setTextColor(100, 70, 180);
      doc.text('BookCraft', margin, y);

      y += 10;

      doc.setFontSize(17);
      doc.setTextColor(35, 35, 45);
      doc.text('My Reading Journal', margin, y);

      y += 9;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(110, 110, 110);

      doc.text(
        `Generated on: ${new Date().toLocaleDateString('en-GB')}`,
        margin,
        y
      );

      y += 7;

      doc.text(
        `Notes: ${notesCount} | Highlights: ${highlightsCount}`,
        margin,
        y
      );

      y += 9;

      doc.setDrawColor(190, 180, 220);
      doc.line(margin, y, pageWidth - margin, y);

      y += 12;

      // EMPTY JOURNAL
      if (journalItems.length === 0) {
        doc.setFontSize(12);
        doc.setTextColor(90, 90, 90);

        doc.text(
          'No reading notes or highlights have been saved yet.',
          margin,
          y
        );
      }

      // JOURNAL ENTRIES
      journalItems.forEach((item, index) => {
        const heading = item.type === 'note'
          ? 'READING NOTE'
          : `HIGHLIGHT - ${String(item.color || 'yellow').toUpperCase()}`;

        const chapter = item.chapterTitle ||
          `Chapter ${Number(item.chapter || 0) + 1}`;

        const passage = item.text || 'No text available.';

        const headingLines = doc.splitTextToSize(
          `${index + 1}. ${heading}`,
          contentWidth
        );

        const bookLines = doc.splitTextToSize(
          `Book: ${item.bookTitle}`,
          contentWidth
        );

        const chapterLines = doc.splitTextToSize(
          `Chapter: ${chapter}`,
          contentWidth
        );

        const textLines = doc.splitTextToSize(
          passage,
          contentWidth - 4
        );

        // KEEP ENTRY DETAILS TOGETHER WHERE POSSIBLE
        addPageIfNeeded(
          35 +
          (headingLines.length +
            bookLines.length +
            chapterLines.length) * 5
        );

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(100, 70, 180);

        doc.text(headingLines, margin, y);

        y += headingLines.length * 6 + 2;

        doc.setFontSize(10);
        doc.setTextColor(35, 35, 45);

        doc.text(bookLines, margin, y);

        y += bookLines.length * 5 + 2;

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 110);

        doc.text(chapterLines, margin, y);

        y += chapterLines.length * 5 + 2;

        doc.text(
          `Date: ${formatDate(item.date)}`,
          margin,
          y
        );

        y += 7;

        // PASSAGE TEXT
        doc.setTextColor(45, 45, 55);
        doc.setFontSize(10);

        textLines.forEach(line => {
          addPageIfNeeded(7);
          doc.text(line, margin + 2, y);
          y += 5.5;
        });

        y += 8;

        addPageIfNeeded(5);

        doc.setDrawColor(225, 223, 232);
        doc.line(margin, y, pageWidth - margin, y);

        y += 10;
      });

      // ADD PAGE NUMBERS
      const totalPages = doc.internal.getNumberOfPages();

      for (let page = 1; page <= totalPages; page++) {
        doc.setPage(page);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(140, 140, 150);

        doc.text(
          `BookCraft Reading Journal | Page ${page} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      doc.save('BookCraft-Reading-Journal.pdf');
    } catch (err) {
      console.error('PDF Export Error:', err);
      alert('Unable to export PDF. Check the browser console.');
    }
  };

  // OPEN BOOK
  const openBook = item => {
    navigate(`/read/${item.bookId}`);
  };

  // START EDITING
  const startEdit = item => {
    setEditing(item);
    setEditText(item.text);
  };

  // CANCEL EDITING
  const cancelEdit = () => {
    if (saving) return;

    setEditing(null);
    setEditText('');
  };

  // SAVE NOTE
  const saveNote = async () => {
    if (!editing || !editText.trim() || saving) return;

    const book = books.find(
      item => String(item._id) === String(editing.bookId)
    );

    if (!book) {
      alert('Book not found. Please refresh your journal.');
      return;
    }

    try {
      setSaving(true);

      const updatedNotes = (book.notes || []).map(note => {
        const noteId = String(
          note._id || note.createdAt || ''
        );

        if (noteId === String(editing.id)) {
          return {
            ...note,
            text: editText.trim(),
            updatedAt: new Date().toISOString()
          };
        }

        return note;
      });

      await updateBook(book._id, {
        title: book.title,
        author: book.author,
        chapters: book.chapters,
        notes: updatedNotes
      });

      await loadBooks();

      setEditing(null);
      setEditText('');
    } catch (err) {
      console.error('Note update error:', err);
      alert('Unable to update note.');
    } finally {
      setSaving(false);
    }
  };

  // DELETE NOTE OR HIGHLIGHT
  const deleteItem = async item => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this saved item?'
    );

    if (!confirmed) return;

    const book = books.find(
      entry => String(entry._id) === String(item.bookId)
    );

    if (!book) return;

    try {
      if (item.type === 'note') {
        const updatedNotes = (book.notes || []).filter(note => {
          const noteId = String(
            note._id || note.createdAt || ''
          );

          return noteId !== String(item.id);
        });

        await updateBook(book._id, {
          title: book.title,
          author: book.author,
          chapters: book.chapters,
          notes: updatedNotes
        });

        await loadBooks();
      } else {
        const key = `bookcraft-highlights-${book._id}`;

        const saved = JSON.parse(
          localStorage.getItem(key) || '[]'
        );

        if (!Array.isArray(saved)) return;

        const updated = saved.filter(
          (_, index) => index !== item.storageIndex
        );

        localStorage.setItem(key, JSON.stringify(updated));

        await loadBooks();
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Unable to delete this item.');
    }
  };

  return (
    <div className="journal-layout">

      {/* SIDEBAR */}
      <aside className="journal-sidebar">
        <div className="journal-brand">
          <BookOpen size={29} />
          <h2>BookCraft</h2>
        </div>

        <p className="journal-sidebar-label">
          WORKSPACE
        </p>

        <nav className="journal-nav">
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

          <button className="journal-nav-active">
            <NotebookPen />
            Reading Journal
          </button>

          <button onClick={() => navigate('/profile')}>
            <User />
            My Profile
          </button>
        </nav>

        <button
          className="journal-back"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="journal-main">
        <header className="journal-header">
          <div>
            <span className="journal-eyebrow">
              YOUR PERSONAL SPACE
            </span>

            <h1>Reading Journal</h1>

            <p>
              All your thoughts, notes and saved passages in one place.
            </p>
          </div>
        </header>

        {/* STATISTICS */}
        <section className="journal-stats">
          <div className="journal-stat-card">
            <div className="journal-stat-icon">
              <NotebookPen />
            </div>

            <div>
              <span>Total Notes</span>
              <strong>{notesCount}</strong>
            </div>
          </div>

          <div className="journal-stat-card">
            <div className="journal-stat-icon highlight-icon">
              <Highlighter />
            </div>

            <div>
              <span>Total Highlights</span>
              <strong>{highlightsCount}</strong>
            </div>
          </div>

          <div className="journal-stat-card">
            <div className="journal-stat-icon">
              <BookOpen />
            </div>

            <div>
              <span>Books with Saved Items</span>
              <strong>{booksCount}</strong>
            </div>
          </div>
        </section>

        {/* JOURNAL CONTENT */}
        <section className="journal-content">
          <div className="journal-toolbar">
            <div>
              <h2>Your Saved Items</h2>

              <p>
                Manage your notes and memorable passages.
              </p>
            </div>

            <div className="journal-toolbar-actions">
              <button
                type="button"
                className="journal-export-button"
                onClick={exportJournalPDF}
              >
                <Download size={17} />
                Export PDF
              </button>

              <div className="journal-search">
                <Search size={19} />

                <input
                  type="text"
                  placeholder="Search notes or books..."
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                />
              </div>
            </div>
          </div>

          {/* FILTERS */}
          <div className="journal-filters">
            <button
              className={filter === 'all' ? 'selected' : ''}
              onClick={() => setFilter('all')}
            >
              All Items
            </button>

            <button
              className={filter === 'note' ? 'selected' : ''}
              onClick={() => setFilter('note')}
            >
              Notes
            </button>

            <button
              className={filter === 'highlight' ? 'selected' : ''}
              onClick={() => setFilter('highlight')}
            >
              Highlights
            </button>
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="journal-empty">
              Loading your journal...
            </div>
          ) : error ? (
            <div className="journal-empty">
              <p>{error}</p>

              <button onClick={loadBooks}>
                Try Again
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="journal-empty">
              <NotebookPen size={45} />

              <h3>No saved items found</h3>

              <p>
                Your reading notes and highlights will appear here.
                Open a book and start saving your favourite passages.
              </p>
            </div>
          ) : (
            <div className="journal-items">
              {filteredItems.map(item => (
                <article
                  className={`journal-item ${
                    item.type === 'highlight'
                      ? `highlight-${String(item.color).toLowerCase()}`
                      : ''
                  }`}
                  key={`${item.type}-${item.id}`}
                >
                  <div className="journal-item-top">
                    <span className={`journal-type ${item.type}`}>
                      {item.type === 'note' ? (
                        <>
                          <NotebookPen size={15} />
                          NOTE
                        </>
                      ) : (
                        <>
                          <Highlighter size={15} />
                          HIGHLIGHT
                        </>
                      )}
                    </span>

                    <span className="journal-date">
                      {formatDate(item.date)}
                    </span>
                  </div>

                  <h3>{item.bookTitle}</h3>

                  <p className="journal-chapter">
                    {item.chapterTitle ||
                      `Chapter ${Number(item.chapter) + 1}`}
                  </p>

                  <p className="journal-item-text">
                    {item.text || 'Saved passage'}
                  </p>

                  <div className="journal-item-actions">
                    <button onClick={() => openBook(item)}>
                      <BookOpen size={16} />
                      Open Book
                    </button>

                    {item.type === 'note' && (
                      <button onClick={() => startEdit(item)}>
                        <Pencil size={16} />
                        Edit
                      </button>
                    )}

                    <button
                      className="journal-delete"
                      onClick={() => deleteItem(item)}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* EDIT NOTE MODAL */}
      {editing && (
        <div className="journal-modal-backdrop">
          <div className="journal-modal">
            <div className="journal-modal-heading">
              <h2>Edit Note</h2>

              <button
                onClick={cancelEdit}
                disabled={saving}
              >
                <X />
              </button>
            </div>

            <textarea
              value={editText}
              onChange={event => setEditText(event.target.value)}
              rows={6}
              placeholder="Write your note..."
            />

            <div className="journal-modal-actions">
              <button
                onClick={cancelEdit}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                className="journal-save"
                onClick={saveNote}
                disabled={saving || !editText.trim()}
              >
                <Save size={17} />
                {saving ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReadingJournal;

