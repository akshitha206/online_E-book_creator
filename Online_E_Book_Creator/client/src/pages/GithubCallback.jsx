import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function GithubCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const userJson = searchParams.get('user');

    if (!token || !userJson) {
      navigate('/login?error=Unable%20to%20complete%20GitHub%20login.', {
        replace: true
      });
      return;
    }

    try {
      localStorage.setItem('token', token);
      localStorage.setItem('user', userJson);
      navigate('/', { replace: true });
    } catch {
      navigate('/login?error=Unable%20to%20save%20your%20GitHub%20login.', {
        replace: true
      });
    }
  }, [navigate, searchParams]);

  return (
    <div className="auth-page">
      <div className="auth-card">Completing GitHub login...</div>
    </div>
  );
}

export default GithubCallback;
