
import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';

import {
  BookOpen, Plus, Trash2, Download, ArrowLeft, Save,
  Bold, Italic, Underline, Strikethrough, AlignLeft,
  AlignCenter, AlignRight, AlignJustify, List, ListOrdered,
  Undo, Redo, Link, Image, Highlighter, Palette,
  Indent, Outdent, Eraser, Type
} from 'lucide-react';

import { createBook, updateBook } from '../services/api';
import '../App.css';

function CreateBook() {
  const location = useLocation();
  const navigate = useNavigate();
  const editorRef = useRef(null);

  const existingBook = location.state?.book;

  const initialChapters = existingBook?.chapters?.length
    ? existingBook.chapters.map((chapter, index) => ({
        id: chapter._id || chapter.id || index + 1,
        title: chapter.title || `Chapter ${index + 1}`,
        content: chapter.content || ''
      }))
    : [{ id: 1, title: 'Chapter 1', content: '' }];

  const [bookTitle, setBookTitle] = useState(existingBook?.title || '');
  const [author, setAuthor] = useState(existingBook?.author || '');
  const [chapters, setChapters] = useState(initialChapters);
  const [activeChapter, setActiveChapter] = useState(initialChapters[0].id);
  const [saving, setSaving] = useState(false);
  const [fontSize, setFontSize] = useState('3');
  const [fontFamily, setFontFamily] = useState('Georgia');
  const [textColor, setTextColor] = useState('#222222');
  const [highlightColor, setHighlightColor] = useState('#ffff00');
  const [showPreview, setShowPreview] = useState(false);

  const currentChapter = chapters.find(
    chapter => chapter.id === activeChapter
  );

  const getPlainText = html => {
    const element = document.createElement('div');
    element.innerHTML = html || '';
    return element.innerText || element.textContent || '';
  };

  const getEditorHtml = content => {
    if (!content) return '';

    // Preserve existing rich-text content.
    if (/<[a-z][\s\S]*>/i.test(content)) return content;

    // Convert existing plain-text chapters to editable HTML.
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
  };

  useEffect(() => {
    if (editorRef.current && currentChapter) {
      editorRef.current.innerHTML = getEditorHtml(currentChapter.content);
    }
  }, [activeChapter]);

  const updateChapter = (field, value) => {
    setChapters(previous =>
      previous.map(chapter =>
        chapter.id === activeChapter
          ? { ...chapter, [field]: value }
          : chapter
      )
    );
  };

  const addChapter = () => {
    const newChapter = {
      id: Date.now(),
      title: `Chapter ${chapters.length + 1}`,
      content: ''
    };

    setChapters(previous => [...previous, newChapter]);
    setActiveChapter(newChapter.id);
  };

  const deleteChapter = id => {
    if (chapters.length === 1) {
      alert('Your book must have at least one chapter.');
      return;
    }

    if (!window.confirm('Delete this chapter?')) return;

    const updated = chapters.filter(chapter => chapter.id !== id);
    setChapters(updated);

    if (activeChapter === id) {
      setActiveChapter(updated[0].id);
    }
  };

  const runCommand = (command, value = null) => {
    if (!editorRef.current) return;

    editorRef.current.focus();
    document.execCommand(command, false, value);

    updateChapter('content', editorRef.current.innerHTML);
  };

  const changeFontSize = value => {
    setFontSize(value);
    runCommand('fontSize', value);
  };

  const changeFontFamily = value => {
    setFontFamily(value);
    runCommand('fontName', value);
  };

  const changeTextColor = value => {
    setTextColor(value);
    runCommand('foreColor', value);
  };

  const changeHighlight = value => {
    setHighlightColor(value);
    runCommand('hiliteColor', value);
  };

  const insertLink = () => {
    const url = window.prompt('Enter the website URL:');
    if (url) runCommand('createLink', url);
  };

  const insertImage = () => {
    const url = window.prompt('Enter the image URL:');
    if (url) runCommand('insertImage', url);
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      updateChapter('content', editorRef.current.innerHTML);
    }
  };

  const wordCount = currentChapter
    ? getPlainText(currentChapter.content).trim().split(/\s+/).filter(Boolean).length
    : 0;

  const characterCount = currentChapter
    ? getPlainText(currentChapter.content).length
    : 0;

  const saveBook = async () => {
    if (!bookTitle.trim()) {
      alert('Please enter your book title.');
      return;
    }

    if (saving) return;

    const bookData = {
      title: bookTitle.trim(),
      author: author.trim() || 'Unknown',
      chapters: chapters.map((chapter, index) => ({
        title: chapter.title.trim() || `Chapter ${index + 1}`,
        content: chapter.content || ''
      }))
    };

    try {
      setSaving(true);

      if (existingBook?._id) {
        await updateBook(existingBook._id, bookData);
        alert('Book updated successfully!');
      } else {
        await createBook(bookData);
        alert('Book saved successfully!');
      }

      navigate('/library');
    } catch (error) {
      console.error('SAVE ERROR:', error);
      console.error('SERVER ERROR:', error.response?.data);

      alert(
        error.response?.data?.message ||
        error.message ||
        'Unable to save book. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const downloadPDF = () => {
    if (!bookTitle.trim()) {
      alert('Please enter your book title.');
      return;
    }

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 25;

    const checkPage = (height = 8) => {
      if (y + height > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
    };

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);

    pdf.splitTextToSize(bookTitle.trim(), contentWidth).forEach(line => {
      checkPage(12);
      pdf.text(line, margin, y);
      y += 11;
    });

    y += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);

    pdf.splitTextToSize(
      `Author: ${author.trim() || 'Unknown'}`,
      contentWidth
    ).forEach(line => {
      checkPage(8);
      pdf.text(line, margin, y);
      y += 8;
    });

    y += 12;

    chapters.forEach((chapter, index) => {
      checkPage(25);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);

      const title = chapter.title.trim() || `Chapter ${index + 1}`;

      pdf.splitTextToSize(title, contentWidth).forEach(line => {
        checkPage(10);
        pdf.text(line, margin, y);
        y += 9;
      });

      y += 3;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);

      const text = getPlainText(chapter.content || 'No content added.');

      text.split('\n').forEach(paragraph => {
        const lines = pdf.splitTextToSize(paragraph || ' ', contentWidth);

        lines.forEach(line => {
          checkPage(7);
          pdf.text(line, margin, y);
          y += 7;
        });

        y += 3;
      });

      y += 10;
    });

    const fileName = bookTitle.trim().replace(/[\\/:*?"<>|]/g, '_');
    pdf.save(`${fileName}.pdf`);
  };

  const toolbarButton = (label, icon, action) => (
    <button
      type="button"
      className="word-toolbar-button"
      title={label}
      aria-label={label}
      onMouseDown={event => event.preventDefault()}
      onClick={action}
    >
      {icon}
    </button>
  );

  return (
    <div className="editor-page">

      <header className="editor-header">
        <button onClick={() => navigate('/library')}>
          <ArrowLeft size={18} /> Back
        </button>

        <h2><BookOpen /> E-Book Editor</h2>

        <div className="editor-actions">
          <button onClick={saveBook} disabled={saving}>
            <Save size={18} />
            {saving ? 'Saving...' : existingBook ? 'Update Book' : 'Save Book'}
          </button>

          <button className="download-btn" onClick={downloadPDF}>
            <Download size={18} /> Download PDF
          </button>
        </div>
      </header>

      <div className="editor-details">
        <input
          value={bookTitle}
          onChange={e => setBookTitle(e.target.value)}
          placeholder="Enter your book title"
        />

        <input
          value={author}
          onChange={e => setAuthor(e.target.value)}
          placeholder="Enter author name"
        />
      </div>

      <div className="editor-layout">

        <aside className="chapter-sidebar">
          <h3>Chapters ({chapters.length})</h3>

          {chapters.map((chapter, index) => (
            <div
              key={String(chapter.id)}
              className={`chapter-item ${
                activeChapter === chapter.id ? 'selected' : ''
              }`}
            >
              <button
                className="chapter-select"
                onClick={() => setActiveChapter(chapter.id)}
              >
                {chapter.title || `Chapter ${index + 1}`}
              </button>

              <button
                className="chapter-delete"
                onClick={() => deleteChapter(chapter.id)}
                title="Delete chapter"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}

          <button className="add-chapter-btn" onClick={addChapter}>
            <Plus size={17} /> Add Chapter
          </button>
        </aside>

        <main className="writing-area">

          {currentChapter && (
            <>
              <input
                className="chapter-title-input"
                value={currentChapter.title}
                onChange={e => updateChapter('title', e.target.value)}
                placeholder="Chapter title"
              />

              <div className="word-toolbar">

                {toolbarButton('Bold', <Bold size={18} />, () => runCommand('bold'))}
                {toolbarButton('Italic', <Italic size={18} />, () => runCommand('italic'))}
                {toolbarButton('Underline', <Underline size={18} />, () => runCommand('underline'))}
                {toolbarButton('Strikethrough', <Strikethrough size={18} />, () => runCommand('strikeThrough'))}

                <span className="toolbar-divider" />

                <select
                  value={fontFamily}
                  onChange={e => changeFontFamily(e.target.value)}
                  title="Font family"
                >
                  <option value="Georgia">Georgia</option>
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Courier New">Courier New</option>
                </select>

                <select
                  value={fontSize}
                  onChange={e => changeFontSize(e.target.value)}
                  title="Font size"
                >
                  <option value="1">10px</option>
                  <option value="2">13px</option>
                  <option value="3">16px</option>
                  <option value="4">18px</option>
                  <option value="5">24px</option>
                  <option value="6">32px</option>
                  <option value="7">48px</option>
                </select>

                <span className="toolbar-divider" />

                {toolbarButton('Align left', <AlignLeft size={18} />, () => runCommand('justifyLeft'))}
                {toolbarButton('Align center', <AlignCenter size={18} />, () => runCommand('justifyCenter'))}
                {toolbarButton('Align right', <AlignRight size={18} />, () => runCommand('justifyRight'))}
                {toolbarButton('Justify', <AlignJustify size={18} />, () => runCommand('justifyFull'))}

                <span className="toolbar-divider" />

                {toolbarButton('Bulleted list', <List size={18} />, () => runCommand('insertUnorderedList'))}
                {toolbarButton('Numbered list', <ListOrdered size={18} />, () => runCommand('insertOrderedList'))}
                {toolbarButton('Indent', <Indent size={18} />, () => runCommand('indent'))}
                {toolbarButton('Outdent', <Outdent size={18} />, () => runCommand('outdent'))}

                <span className="toolbar-divider" />

                <label className="word-color-control" title="Text colour">
                  <Palette size={18} />
                  <input
                    type="color"
                    value={textColor}
                    onChange={e => changeTextColor(e.target.value)}
                  />
                </label>

                <label className="word-color-control" title="Highlight colour">
                  <Highlighter size={18} />
                  <input
                    type="color"
                    value={highlightColor}
                    onChange={e => changeHighlight(e.target.value)}
                  />
                </label>

                {toolbarButton('Insert link', <Link size={18} />, insertLink)}
                {toolbarButton('Insert image', <Image size={18} />, insertImage)}

                <span className="toolbar-divider" />

                {toolbarButton('Undo', <Undo size={18} />, () => runCommand('undo'))}
                {toolbarButton('Redo', <Redo size={18} />, () => runCommand('redo'))}
                {toolbarButton('Clear formatting', <Eraser size={18} />, () => runCommand('removeFormat'))}

                <select
                  title="Paragraph style"
                  defaultValue="p"
                  onChange={e => runCommand('formatBlock', e.target.value)}
                >
                  <option value="p">Paragraph</option>
                  <option value="h1">Heading 1</option>
                  <option value="h2">Heading 2</option>
                  <option value="h3">Heading 3</option>
                  <option value="blockquote">Quote</option>
                </select>
              </div>

              <div
                ref={editorRef}
                className="chapter-content word-document"
                contentEditable
                suppressContentEditableWarning
                spellCheck
                onInput={handleEditorInput}
                data-placeholder="Start writing your chapter here..."
              />

              <div className="word-count">
                <span>Words: {wordCount}</span>
                <span>Characters: {characterCount}</span>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? 'Hide preview' : 'Preview chapter'}
                </button>
              </div>

              {showPreview && (
                <div className="chapter-preview">
                  <h3>{currentChapter.title}</h3>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: currentChapter.content || ''
                    }}
                  />
                </div>
              )}
            </>
          )}

        </main>
      </div>
    </div>
  );
}

export default CreateBook;



