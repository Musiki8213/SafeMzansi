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
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="card">
          <div className="text-center mb-6">
            <div className="bg-safe-green p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold">{isLogin ? 'Sign In' : 'Sign Up'}</h1>
            <p className="text-gray-600">Welcome to SafeMzansi</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safe-green"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safe-green"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safe-green"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary"
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-300" />
            <span className="px-4 text-sm text-gray-500">OR</span>
            <div className="flex-1 border-t border-gray-300" />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Continue with Google
          </button>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-safe-green hover:underline"
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="bg-safe-green p-4 rounded-full">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{currentUser.displayName || 'User'}</h1>
              <p className="text-gray-600">{currentUser.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn bg-red-600 text-white hover:bg-red-700">
            <LogOut className="w-5 h-5 mr-2" />
            Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-safe-green text-white p-6 rounded-lg">
            <Shield className="w-8 h-8 mb-2" />
            <div className="text-3xl font-bold">{userCredibility}</div>
            <div className="text-green-200">Credibility Score</div>
          </div>
          <div className="bg-safe-gold p-6 rounded-lg text-black">
            <span className="text-2xl font-bold">{myReports.length}</span>
            <div>My Reports</div>
          </div>
          <div className="bg-gray-100 p-6 rounded-lg">
            <span className="text-2xl font-bold">
              {myReports.filter(r => r.verified).length}
            </span>
            <div>Verified Reports</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold mb-4">My Reports</h2>
        <div className="space-y-4">
          {myReports.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No reports yet</p>
          ) : (
            myReports.map((report) => (
              <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium">{report.type}</span>
                      {report.verified && (
                        <span className="text-green-600 text-sm flex items-center">
                          <Shield className="w-4 h-4 mr-1" />
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">{report.description}</p>
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
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

