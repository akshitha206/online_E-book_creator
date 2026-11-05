
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  Download,
  ArrowLeft,
  ImagePlus,
  Palette,
  Save,
  BookOpen
} from 'lucide-react';

import { getBooks } from '../services/api';
import './CoverDesigner.css';

const templates = [
  { name: 'Purple', background: 'linear-gradient(145deg, #7046d8, #29145f)', color: '#ffffff' },
  { name: 'Black Gold', background: 'linear-gradient(145deg, #171717, #4b3710)', color: '#f5d47a' },
  { name: 'Blue', background: 'linear-gradient(145deg, #1674d1, #102b67)', color: '#ffffff' },
  { name: 'Minimal', background: 'linear-gradient(145deg, #f5eee2, #d8c7ae)', color: '#30251e' },
  { name: 'Rose', background: 'linear-gradient(145deg, #ed9cae, #813c65)', color: '#ffffff' },
  { name: 'Green', background: 'linear-gradient(145deg, #286b54, #10372d)', color: '#ffffff' }
];

function CoverDesigner() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  const [template, setTemplate] = useState(0);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [customColor, setCustomColor] = useState('#7046d8');
  const [uploadedImage, setUploadedImage] = useState('');
  const [uploadMode, setUploadMode] = useState('background');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadBook = async () => {
      try {
        const response = await getBooks();
        const books = Array.isArray(response)
          ? response
          : response?.data;

        if (!Array.isArray(books)) {
          throw new Error('Invalid books response');
        }

        const selected = books.find(
          item => String(item._id) === String(id)
        );

        if (!selected) return;

        setBook(selected);
        setTitle(selected.title || '');
        setAuthor(selected.author || '');

        const stored = localStorage.getItem(`bookcraft-cover-${id}`);

        if (stored) {
          const data = JSON.parse(stored);

          setTemplate(data.template ?? 0);
          setTitle(data.title ?? selected.title ?? '');
          setAuthor(data.author ?? selected.author ?? '');
          setSubtitle(data.subtitle ?? '');
          setCustomColor(data.customColor ?? '#7046d8');
          setUploadedImage(data.uploadedImage ?? '');
          setUploadMode(data.uploadMode ?? 'background');
        }
      } catch (error) {
        console.error('Cover loading error:', error);
        alert('Unable to load book cover.');
      } finally {
        setLoading(false);
      }
    };

    loadBook();
  }, [id]);

  const currentTemplate = templates[template] || templates[0];

  const saveCover = () => {
    if (!id || !book) {
      alert('Book information is missing. Please reopen Cover Designer.');
      return;
    }

    const data = {
      bookId: String(id),
      template,
      title,
      author,
      subtitle,
      customColor,
      uploadedImage,
      uploadMode,
      updatedAt: new Date().toISOString()
    };

    try {
      const storageKey = `bookcraft-cover-${id}`;

      localStorage.setItem(storageKey, JSON.stringify(data));

      const verification = localStorage.getItem(storageKey);

      if (!verification) {
        throw new Error('Cover was not saved.');
      }

      const verifiedData = JSON.parse(verification);

      if (String(verifiedData.bookId) !== String(id)) {
        throw new Error('Saved cover ID does not match.');
      }

      window.dispatchEvent(
        new CustomEvent('bookcraft-cover-updated', {
          detail: {
            bookId: String(id),
            design: verifiedData
          }
        })
      );

      setSaved(true);
      alert('Cover saved successfully!');

      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      console.error('Save cover error:', error);
      alert('Unable to save cover. Try removing the uploaded image.');
    }
  };

  const uploadImage = event => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Please choose an image smaller than 5 MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setUploadedImage(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const downloadCover = async () => {
    const element = document.getElementById('cover-preview');

    if (!element) return;

    try {
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: null
      });

      const link = document.createElement('a');
      link.download = `${title || 'Book'}-Cover.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error(error);
      alert('Unable to download cover.');
    }
  };

  if (loading) {
    return <div className="cover-loading">Loading Cover Designer...</div>;
  }

  if (!book) {
    return (
      <div className="cover-loading">
        <h2>Book not found</h2>
        <button onClick={() => navigate('/')}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="cover-designer-page">
      <header className="cover-designer-header">
        <button onClick={() => navigate('/')} className="cover-back">
          <ArrowLeft size={19} />
          Back to Dashboard
        </button>

        <h2>
          <Palette size={23} />
          Cover Designer
        </h2>

        <button onClick={saveCover} className="cover-save">
          <Save size={18} />
          {saved ? 'Saved!' : 'Save Cover'}
        </button>
      </header>

      <div className="cover-designer-layout">
        <section className="cover-settings">
          <h2>Customize Your Cover</h2>
          <p>Make your eBook stand out.</p>

          <label>Book Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} />

          <label>Author Name</label>
          <input value={author} onChange={e => setAuthor(e.target.value)} />

          <label>Subtitle</label>
          <input
            value={subtitle}
            onChange={e => setSubtitle(e.target.value)}
            placeholder="Enter a subtitle (optional)"
          />

          <label>Choose Template</label>
          <div className="cover-template-grid">
            {templates.map((item, index) => (
              <button
                key={item.name}
                className={template === index ? 'template-choice selected' : 'template-choice'}
                onClick={() => setTemplate(index)}
              >
                <span style={{ background: item.background }} />
                {item.name}
              </button>
            ))}
          </div>

          <label>Custom Background Color</label>
          <input
            type="color"
            value={customColor}
            onChange={e => setCustomColor(e.target.value)}
            className="cover-color-picker"
          />

          <label>Upload Cover Image</label>

          <div className="cover-upload-modes">
            <button
              type="button"
              className={uploadMode === 'complete' ? 'upload-mode active' : 'upload-mode'}
              onClick={() => setUploadMode('complete')}
            >
              Complete Cover
            </button>

            <button
              type="button"
              className={uploadMode === 'background' ? 'upload-mode active' : 'upload-mode'}
              onClick={() => setUploadMode('background')}
            >
              Background Image
            </button>
          </div>

          <label className="cover-upload">
            <ImagePlus size={20} />
            Choose Image
            <input type="file" accept="image/*" onChange={uploadImage} hidden />
          </label>

          {uploadedImage && (
            <button
              className="cover-remove-image"
              onClick={() => setUploadedImage('')}
            >
              Remove uploaded image
            </button>
          )}

          <button className="cover-download" onClick={downloadCover}>
            <Download size={19} />
            Download Cover PNG
          </button>
        </section>

        <section className="cover-preview-section">
          <h3>Live Preview</h3>

          <div
            id="cover-preview"
            className="cover-preview"
            style={{
              background: uploadedImage
                ? `url("${uploadedImage}") center/cover no-repeat`
                : template === 0
                  ? customColor
                  : currentTemplate.background,
              color: currentTemplate.color
            }}
          >
            {!(uploadedImage && uploadMode === 'complete') && (
              <>
                {!uploadedImage && (
                  <div className="cover-decoration">
                    <BookOpen size={45} />
                  </div>
                )}

                <div className="cover-preview-content">
                  <span className="cover-preview-label">
                    BOOKCRAFT EDITION
                  </span>

                  <h1>{title || 'Your Book Title'}</h1>

                  {subtitle && (
                    <p className="cover-preview-subtitle">{subtitle}</p>
                  )}

                  <div className="cover-preview-line" />

                  <p className="cover-preview-author">
                    {author || 'Author Name'}
                  </p>
                </div>
              </>
            )}
          </div>

          <p className="cover-preview-note">
            {uploadMode === 'complete'
              ? 'Your uploaded image is used as the complete cover.'
              : 'Your image is used as the background with editable text.'}
          </p>
        </section>
      </div>
    </div>
  );
}

export default CoverDesigner;
