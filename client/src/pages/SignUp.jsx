import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Shield, Mail, Lock, User, UserPlus } from 'lucide-react';
import { authAPI, getCurrentApiUrl, isCapacitor } from '../utils/api';
import { setAuthToken, setUsername } from '../utils/api';
import ApiConfigModal from '../components/ApiConfigModal';

function SignUp() {
  const navigate = useNavigate();
  const [username, setUsernameState] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showApiConfig, setShowApiConfig] = useState(false);

  // Check if API URL needs to be configured on mobile
  useEffect(() => {
    if (isCapacitor()) {
      const currentUrl = getCurrentApiUrl();
      // Show config modal if URL is localhost or not configured
      if (currentUrl.includes('localhost') || !currentUrl || currentUrl.trim() === '') {
        setShowApiConfig(true);
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!username.trim()) {
      toast.error('Username is required');
      return;
    }

    if (username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }

    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }

    if (!password.trim()) {
      toast.error('Password is required');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register(username, email, password);
      
      // Store token and username if provided (backend may return token on signup)
      if (response.token && response.user && response.user.username) {
        setAuthToken(response.token);
        setUsername(response.user.username);
        toast.success('Account created successfully! You are now logged in.');
        navigate('/');
      } else if (response.message) {
        // If no token but success message, just redirect to login
        toast.success('Account created successfully! Please log in.');
        navigate('/login');
      } else {
        toast.success('Account created successfully! Please log in.');
        navigate('/login');
      }
    } catch (error) {
      // Show specific error messages
      const errorMessage = error.message || 'Failed to create account. Please try again.';
      toast.error(errorMessage);
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {showApiConfig && (
        <ApiConfigModal
          onClose={() => {
            // Don't allow closing if on mobile and not configured
            if (isCapacitor()) {
              const currentUrl = getCurrentApiUrl();
              if (currentUrl.includes('localhost')) {
                toast.error('Please configure the API URL to continue');
                return;
              }
            }
            setShowApiConfig(false);
          }}
          onConfigured={() => {
            setShowApiConfig(false);
            toast.success('API configured! You can now create an account.');
          }}
        />
      )}
      
      <div className="glass-card">
        <div className="auth-header">
          <div className="icon-wrapper icon-wrapper-primary">
            <Shield className="w-8 h-8" />
          </div>
          <h1>Create Account</h1>
          <p className="auth-subtitle">Join SafeMzansi today</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">
              <User className="w-4 h-4" />
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsernameState(e.target.value)}
              className="form-input"
              placeholder="Choose a username (min. 3 characters)"
              required
              minLength={3}
              disabled={loading}
            />
          </div>

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
              placeholder="Create a password (min. 6 characters)"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock className="w-4 h-4" />
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input"
              placeholder="Confirm your password"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-full-width"
          >
            <UserPlus className="w-5 h-5" />
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
