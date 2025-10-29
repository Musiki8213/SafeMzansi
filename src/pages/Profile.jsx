import { useState } from 'react';
import { useAuth } from '../firebase/authContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';
import { User, LogOut, Mail, Shield } from 'lucide-react';

function Profile() {
  const { currentUser, logout, login, signup, loginWithGoogle, userCredibility } = useAuth();
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(!currentUser);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        toast.success('Signed in successfully!');
      } else {
        await signup(email, password, displayName);
        toast.success('Account created successfully!');
      }
      setShowLogin(false);
      navigate('/');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Signed in with Google!');
      setShowLogin(false);
      navigate('/');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Signed out');
      navigate('/');
      setShowLogin(true);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Fetch user's reports
  const fetchMyReports = async () => {
    if (!currentUser) return;
    
    try {
      const q = query(collection(db, 'reports'), where('userId', '==', currentUser.uid));
      const snapshot = await getDocs(q);
      const reports = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMyReports(reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  if (showLogin && !currentUser) {
    return (
      <div className="page container">
        <div className="card" style={{ maxWidth: '28rem', margin: '0 auto' }}>
          <div className="text-center mb-6">
            <div className="icon-wrapper icon-wrapper-green" style={{ margin: '0 auto 1rem', width: '4rem', height: '4rem' }}>
              <Shield className="w-8 h-8" />
            </div>
            <h1>{isLogin ? 'Sign In' : 'Sign Up'}</h1>
            <p className="text-gray-600">Welcome to SafeMzansi</p>
          </div>

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">
                  Full Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="form-input"
                  required={!isLogin}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-full-width"
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <div className="my-6 flex flex-items-center">
            <div style={{ flex: 1, borderTop: '1px solid var(--border-gray)' }} />
            <span className="px-4 text-sm text-gray-500">OR</span>
            <div style={{ flex: 1, borderTop: '1px solid var(--border-gray)' }} />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="btn btn-outline btn-full-width"
          >
            Continue with Google
          </button>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              style={{ color: 'var(--primary-green)' }}
              className="btn btn-outline"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="page container">
      <div className="card mb-6">
        <div className="flex flex-items-center flex-between mb-6">
          <div className="flex flex-items-center flex-gap">
            <div className="icon-wrapper icon-wrapper-green">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h1>{currentUser.displayName || 'User'}</h1>
              <p className="text-gray-600">{currentUser.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn" style={{ backgroundColor: '#DC2626', color: 'white' }}>
            <LogOut className="w-5 h-5" />
            <span style={{ marginLeft: '0.5rem' }}>Sign Out</span>
          </button>
        </div>

        <div className="grid grid-3">
          <div className="stat-card" style={{ backgroundColor: 'var(--primary-green)', color: 'white' }}>
            <Shield className="w-8 h-8 mb-2" />
            <div className="stat-number">{userCredibility}</div>
            <div className="stat-label">Credibility Score</div>
          </div>
          <div className="stat-card" style={{ backgroundColor: 'var(--accent-gold)' }}>
            <div className="stat-number">{myReports.length}</div>
            <div className="stat-label">My Reports</div>
          </div>
          <div className="stat-card" style={{ backgroundColor: 'var(--bg-light)' }}>
            <div className="stat-number">
              {myReports.filter(r => r.verified).length}
            </div>
            <div className="stat-label">Verified Reports</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4">My Reports</h2>
        <div>
          {myReports.length === 0 ? (
            <p className="text-gray-600 text-center" style={{ padding: '2rem' }}>No reports yet</p>
          ) : (
            myReports.map((report) => (
              <div key={report.id} className="card mb-4" style={{ marginBottom: '1rem' }}>
                <div className="flex flex-between">
                  <div>
                    <div className="flex flex-items-center flex-gap-sm mb-2">
                      <span className="font-medium">{report.type}</span>
                      {report.verified && (
                        <span className="badge badge-success flex flex-items-center flex-gap-sm">
                          <Shield className="w-4 h-4" />
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">{report.description}</p>
                    <div className="flex flex-items-center text-sm text-gray-500 flex-gap">
                      <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                      <span>👍 {report.likes || 0} • 👎 {report.dislikes || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
