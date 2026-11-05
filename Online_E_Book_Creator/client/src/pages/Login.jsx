
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Eye,
  EyeOff,
  Code2,
  Lock,
  Mail
} from 'lucide-react';

import API from '../services/api';
import './Auth.css';

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: ''
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
    setLoading(true);

    try {
      const response = await API.post('/auth/login', form);

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      navigate('/', { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to login. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <Link to="/login" className="auth-brand">
          <span className="auth-brand-icon">
            <BookOpen size={27} />
          </span>
          <span>BookCraft</span>
        </Link>

        <div className="auth-heading">
          <h1>Welcome back!</h1>
          <p>Login to continue creating your stories.</p>
        </div>

        {error && (
          <div className="auth-error">{error}</div>
        )}

        <a className="auth-github" href={githubLoginUrl}>
          <Code2 size={19} />
          Continue with GitHub
        </a>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">

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

          <label htmlFor="password">Password</label>

          <div className="auth-input-wrap">
            <Lock size={19} />

            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
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

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

        </form>

        <p className="auth-switch">
          Don't have an account?{' '}
          <Link to="/register">Create account</Link>
        </p>

      </div>
    </div>
  );
}

export default Login;
