
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  BookOpen,
  LayoutDashboard,
  Library,
  BarChart3,
  Target,
  User,
  Mail,
  CalendarDays,
  Pencil,
  Lock,
  LogOut,
  Save,
  X,
  ArrowLeft,
  ShieldCheck,
  Camera,
  Trash2,
  Upload
} from 'lucide-react';

import API from '../services/api';
import './Profile.css';

function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const readerRef = useRef(null);
  const redirectTimerRef = useRef(null);

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [name, setName] = useState(user?.name || '');
  const [photoPreview, setPhotoPreview] = useState(
    user?.profilePhoto || ''
  );

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // CLEANUP
  useEffect(() => {
    return () => {
      readerRef.current?.abort();

      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  // FETCH PROFILE
  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      try {
        const response = await API.get('/auth/me');
        const profile = response.data?.user;

        if (!profile) {
          throw new Error('Invalid profile response');
        }

        if (!mounted) return;

        setUser(profile);
        setName(profile.name || '');
        setPhotoPreview(profile.profilePhoto || '');

        localStorage.setItem('user', JSON.stringify(profile));
      } catch (err) {
        if (!mounted) return;

        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login', { replace: true });
          return;
        }

        setError('Unable to load your profile.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  // LOGOUT
  const handleLogout = () => {
    if (!window.confirm('Are you sure you want to logout?')) return;

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    navigate('/login', { replace: true });
  };

  // SELECT PROFILE PHOTO
  const handlePhotoSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError('');
    setMessage('');

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Please select a JPG, PNG or WebP image.');
      event.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be smaller than 2 MB.');
      event.target.value = '';
      return;
    }

    readerRef.current?.abort();

    const reader = new FileReader();
    readerRef.current = reader;

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoPreview(reader.result);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      setError('Unable to read the selected image.');

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    reader.readAsDataURL(file);
  };

  // SAVE PROFILE PHOTO
  const handlePhotoUpload = async () => {
    if (!photoPreview) {
      setError('Please select a photo first.');
      return;
    }

    try {
      setPhotoSaving(true);
      setError('');
      setMessage('');

      const response = await API.put('/auth/profile/photo', {
        profilePhoto: photoPreview
      });

      const updatedUser = response.data?.user;

      if (!updatedUser) {
        throw new Error('Invalid profile response');
      }

      setUser(updatedUser);
      setPhotoPreview(updatedUser.profilePhoto || '');

      localStorage.setItem('user', JSON.stringify(updatedUser));

      setMessage('Profile photo updated successfully!');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to upload profile photo.'
      );
    } finally {
      setPhotoSaving(false);
    }
  };

  // REMOVE PROFILE PHOTO
  const handleRemovePhoto = async () => {
    if (!user?.profilePhoto) {
      setPhotoPreview('');

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      return;
    }

    if (!window.confirm('Are you sure you want to remove your profile photo?')) {
      return;
    }

    try {
      setPhotoSaving(true);
      setError('');
      setMessage('');

      const response = await API.put('/auth/profile/photo', {
        profilePhoto: ''
      });

      const updatedUser = response.data?.user;

      if (!updatedUser) {
        throw new Error('Invalid profile response');
      }

      setUser(updatedUser);
      setPhotoPreview(updatedUser.profilePhoto || '');

      localStorage.setItem('user', JSON.stringify(updatedUser));

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setMessage('Profile photo removed successfully!');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to remove profile photo.'
      );
    } finally {
      setPhotoSaving(false);
    }
  };

  // UPDATE PROFILE NAME
  const handleUpdateProfile = async (event) => {
    event.preventDefault();

    setError('');
    setMessage('');

    if (!name.trim()) {
      setError('Name cannot be empty.');
      return;
    }

    try {
      setSaving(true);

      const response = await API.put('/auth/profile', {
        name: name.trim()
      });

      const updatedUser = response.data?.user;

      if (!updatedUser) {
        throw new Error('Invalid profile response');
      }

      setUser(updatedUser);
      setName(updatedUser.name || '');

      localStorage.setItem('user', JSON.stringify(updatedUser));

      setEditing(false);
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to update profile.'
      );
    } finally {
      setSaving(false);
    }
  };

  // CHANGE PASSWORD
  const handlePasswordChange = async (event) => {
    event.preventDefault();

    setError('');
    setMessage('');

    if (passwords.newPassword.length < 6) {
      setError('New password must contain at least 6 characters.');
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    try {
      setSaving(true);

      const response = await API.put('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });

      setMessage(
        response.data?.message || 'Password changed successfully!'
      );

      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      setChangingPassword(false);

      localStorage.removeItem('token');
      localStorage.removeItem('user');

      redirectTimerRef.current = setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1800);

    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to change password.'
      );
    } finally {
      setSaving(false);
    }
  };

  // CANCEL PASSWORD CHANGE
  const handleCancelPasswordChange = () => {
    setChangingPassword(false);

    setPasswords({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });

    setError('');
    setMessage('');
  };

  // FORMAT DATE
  const formatDate = (date) => {
    if (!date) return 'Not available';

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return 'Not available';
    }

    return parsed.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <BookOpen size={32} />
        <p>Loading your profile...</p>
      </div>
    );
  }

  const displayName = user?.name || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="profile-layout">

      {/* SIDEBAR */}
      <aside className="profile-sidebar">

        <div className="profile-brand">
          <div className="profile-brand-icon">
            <BookOpen size={28} />
          </div>
          <h2>BookCraft</h2>
        </div>

        <span className="profile-sidebar-heading">WORKSPACE</span>

        <nav className="profile-nav">

          <button onClick={() => navigate('/')}>
            <LayoutDashboard size={20} />
            Dashboard
          </button>

          <button onClick={() => navigate('/library')}>
            <Library size={20} />
            My Library
          </button>

          <button onClick={() => navigate('/analytics')}>
            <BarChart3 size={20} />
            Analytics
          </button>

          <button onClick={() => navigate('/reading-goals')}>
            <Target size={20} />
            Reading Goals
          </button>

          <button className="active">
            <User size={20} />
            My Profile
          </button>

        </nav>

        <div className="profile-sidebar-bottom">

          <div className="profile-mini-avatar">
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt="Profile" />
            ) : (
              initial
            )}
          </div>

          <div className="profile-mini-details">
            <strong>{displayName}</strong>
            <span>{user?.email || ''}</span>
          </div>

          <button
            className="profile-logout"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut size={19} />
          </button>

        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="profile-main">

        <header className="profile-topbar">
          <button
            className="profile-back"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <span>Workspace / My Profile</span>
        </header>

        <div className="profile-content">

          <div className="profile-heading">
            <span>ACCOUNT SETTINGS</span>
            <h1>My Profile</h1>
            <p>Manage your personal information and account security.</p>
          </div>

          {message && (
            <div className="profile-alert success">
              {message}
            </div>
          )}

          {error && (
            <div className="profile-alert error">
              {error}
            </div>
          )}

          {/* PROFILE HERO */}
          <section className="profile-hero-card">

            <div className="profile-photo-section">

              <div className="profile-large-avatar">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile preview" />
                ) : (
                  initial
                )}
              </div>

              <button
                className="profile-camera-button"
                onClick={() => fileInputRef.current?.click()}
                title="Choose profile photo"
                disabled={photoSaving}
              >
                <Camera size={17} />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoSelect}
                hidden
              />

            </div>

            <div className="profile-hero-details">

              <span className="profile-member-label">
                <ShieldCheck size={15} />
                BOOKCRAFT MEMBER
              </span>

              <h2>{displayName}</h2>
              <p>{user?.email || ''}</p>

              <div className="profile-photo-actions">

                <button
                  className="profile-upload-button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoSaving}
                >
                  <Upload size={16} />
                  Choose Photo
                </button>

                {photoPreview !== (user?.profilePhoto || '') && (
                  <button
                    className="profile-save-photo-button"
                    onClick={handlePhotoUpload}
                    disabled={photoSaving}
                  >
                    <Save size={16} />
                    {photoSaving ? 'Saving...' : 'Save Photo'}
                  </button>
                )}

                {user?.profilePhoto && (
                  <button
                    className="profile-remove-photo-button"
                    onClick={handleRemovePhoto}
                    disabled={photoSaving}
                  >
                    <Trash2 size={16} />
                    Remove
                  </button>
                )}

              </div>

              <small className="profile-photo-hint">
                JPG, PNG or WebP · Maximum size 2 MB
              </small>

            </div>

            <button
              className="profile-edit-button"
              onClick={() => {
                setEditing(!editing);
                setChangingPassword(false);
                setName(user?.name || '');
                setError('');
                setMessage('');
              }}
            >
              {editing ? <X size={17} /> : <Pencil size={17} />}
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>

          </section>

          {/* EDIT PROFILE */}
          {editing && (
            <section className="profile-card">

              <div className="profile-card-heading">
                <h2>Edit Personal Information</h2>
                <p>Update the name displayed on your account.</p>
              </div>

              <form onSubmit={handleUpdateProfile}>

                <label htmlFor="profile-name">Full Name</label>

                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter your name"
                  required
                />

                <div className="profile-form-actions">

                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setName(user?.name || '');
                      setError('');
                    }}
                  >
                    Cancel
                  </button>

                  <button type="submit" disabled={saving}>
                    <Save size={17} />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>

                </div>
              </form>

            </section>
          )}

          {/* PERSONAL INFORMATION */}
          <section className="profile-card">

            <div className="profile-card-heading">
              <h2>Personal Information</h2>
              <p>Your registered account details.</p>
            </div>

            <div className="profile-info-grid">

              <div className="profile-info-item">
                <div className="profile-info-icon">
                  <User size={20} />
                </div>

                <div>
                  <span>Full Name</span>
                  <strong>{user?.name || 'Not available'}</strong>
                </div>
              </div>

              <div className="profile-info-item">
                <div className="profile-info-icon">
                  <Mail size={20} />
                </div>

                <div>
                  <span>Email Address</span>
                  <strong>{user?.email || 'Not available'}</strong>
                </div>
              </div>

              <div className="profile-info-item">
                <div className="profile-info-icon">
                  <CalendarDays size={20} />
                </div>

                <div>
                  <span>Member Since</span>
                  <strong>{formatDate(user?.createdAt)}</strong>
                </div>
              </div>

              <div className="profile-info-item">
                <div className="profile-info-icon">
                  <ShieldCheck size={20} />
                </div>

                <div>
                  <span>Account Status</span>
                  <strong className="profile-active-status">
                    Active
                  </strong>
                </div>
              </div>

            </div>
          </section>

          {/* ACCOUNT SECURITY */}
          <section className="profile-card">

            <div className="profile-card-heading">
              <h2>Account Security</h2>
              <p>Keep your BookCraft account secure.</p>
            </div>

            {!changingPassword ? (

              <div className="profile-security-row">

                <div className="profile-security-icon">
                  <Lock size={22} />
                </div>

                <div>
                  <strong>Password</strong>
                  <p>Change your password to protect your account.</p>
                </div>

                <button
                  onClick={() => {
                    setChangingPassword(true);
                    setEditing(false);
                    setError('');
                    setMessage('');
                  }}
                >
                  Change Password
                </button>

              </div>

            ) : (

              <form
                className="profile-password-form"
                onSubmit={handlePasswordChange}
              >

                <label htmlFor="current-password">
                  Current Password
                </label>

                <input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={passwords.currentPassword}
                  onChange={(event) =>
                    setPasswords((previous) => ({
                      ...previous,
                      currentPassword: event.target.value
                    }))
                  }
                  required
                />

                <label htmlFor="new-password">
                  New Password
                </label>

                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={passwords.newPassword}
                  onChange={(event) =>
                    setPasswords((previous) => ({
                      ...previous,
                      newPassword: event.target.value
                    }))
                  }
                  minLength={6}
                  required
                />

                <label htmlFor="confirm-password">
                  Confirm New Password
                </label>

                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={passwords.confirmPassword}
                  onChange={(event) =>
                    setPasswords((previous) => ({
                      ...previous,
                      confirmPassword: event.target.value
                    }))
                  }
                  required
                />

                <div className="profile-form-actions">

                  <button
                    type="button"
                    onClick={handleCancelPasswordChange}
                  >
                    Cancel
                  </button>

                  <button type="submit" disabled={saving}>
                    <Lock size={17} />
                    {saving ? 'Updating...' : 'Update Password'}
                  </button>

                </div>

              </form>

            )}

          </section>

          {/* LOGOUT */}
          <section className="profile-danger-card">

            <div>
              <h3>Sign out of BookCraft</h3>
              <p>You'll need to log in again to access your workspace.</p>
            </div>

            <button onClick={handleLogout}>
              <LogOut size={17} />
              Logout
            </button>

          </section>

          <footer className="profile-footer">
            Made with creativity and BookCraft
          </footer>

        </div>
      </main>
    </div>
  );
}

export default Profile;

