
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Eye,
  EyeOff,
  Code2,
  Lock,
  Mail,
  User
} from 'lucide-react';

import API from '../services/api';
import './Auth.css';

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const githubLoginUrl = `${API.defaults.baseURL}/auth/github`;

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await API.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      navigate('/', { replace: true });

    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to create your account.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Brand */}
        <Link to="/register" className="auth-brand">
          <span className="auth-brand-icon">
            <BookOpen size={27} />
          </span>
          <span>BookCraft</span>
        </Link>

        {/* Heading */}
        <div className="auth-heading">
          <h1>Create your account</h1>
          <p>Start building your own digital library.</p>
        </div>

        {/* Error */}
        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        {/* GitHub Login */}
        <a className="auth-github" href={githubLoginUrl}>
          <Code2 size={19} />
          Continue with GitHub
        </a>

        <div className="auth-divider">
          <span>or</span>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="auth-form">

          {/* Full Name */}
          <label htmlFor="name">Full name</label>

          <div className="auth-input-wrap">
            <User size={19} />

            <input
              id="name"
              type="text"
              name="name"
              placeholder="Enter your name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Email */}
          <label htmlFor="email">Email address</label>

          <div className="auth-input-wrap">
            <Mail size={19} />

            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Password */}
          <label htmlFor="password">Password</label>

          <div className="auth-input-wrap">
            <Lock size={19} />

            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={handleChange}
              minLength={6}
              required
            />

            <button
              type="button"
              className="auth-eye"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={
                showPassword ? 'Hide password' : 'Show password'
              }
            >
              {showPassword
                ? <EyeOff size={19} />
                : <Eye size={19} />
              }
            </button>
          </div>

          {/* Confirm Password */}
          <label htmlFor="confirmPassword">
            Confirm password
          </label>

          <div className="auth-input-wrap">
            <Lock size={19} />

            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>

        </form>

        {/* Login Link */}
        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login">Login</Link>
        </p>

      </div>
    </div>
  );
}

export default Register;
