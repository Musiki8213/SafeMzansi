import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Shield, Mail, Lock, LogIn } from 'lucide-react';
import { authAPI } from '../utils/api';
import { setAuthToken, setUsername } from '../utils/api';
import { useAuth } from '../firebase/authContext';

function Login() {
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }

    if (!password.trim()) {
      toast.error('Password is required');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.login(email, password);
      
      // Ensure we have token and user data
      if (response.token && response.user && response.user.username) {
        // Store token and username in localStorage
        setAuthToken(response.token);
        setUsername(response.user.username);
        
        // Update auth context
        updateUser(response.user.username, response.token);
        
        toast.success('Signed in successfully!');
        navigate('/');
      } else {
        throw new Error('Invalid response from server: Missing token or user data');
      }
    } catch (error) {
      // Show specific error messages
      const errorMessage = error.message || 'Failed to sign in. Please check your credentials.';
      toast.error(errorMessage);
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="glass-card">
        <div className="auth-header">
          <div className="icon-wrapper icon-wrapper-primary">
            <Shield className="w-8 h-8" />
          </div>
          <h1>Welcome Back</h1>
          <p className="auth-subtitle">Sign in to SafeMzansi</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock className="w-4 h-4" />
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-full-width"
          >
            <LogIn className="w-5 h-5" />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/signup" className="auth-link">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
