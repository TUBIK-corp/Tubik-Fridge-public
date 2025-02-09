import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/api';

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        try {
          await authApi.handleCallback(code);
          navigate('/');
        } catch (error) {
          console.error('Auth callback error:', error);
          navigate('/auth/login');
        }
      } else {
        navigate('/auth/login');
      }
    };

    handleCallback();
  }, [navigate]);

  return <div>Processing authentication...</div>;
}

export default AuthCallback;