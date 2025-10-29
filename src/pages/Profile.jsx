import { useState, useEffect } from 'react';
import { useAuth } from '../firebase/authContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, LogOut, Shield, Mail, Calendar } from 'lucide-react';

const REPORTS_STORAGE_KEY = 'safemzansi_reports';

function Profile() {
  const { currentUser, logout, userCredibility } = useAuth();
  const navigate = useNavigate();
  const [myReports, setMyReports] = useState([]);

  useEffect(() => {
    // Load user's reports from localStorage
    if (currentUser) {
      const allReports = JSON.parse(localStorage.getItem(REPORTS_STORAGE_KEY) || '[]');
      const userReports = allReports.filter(report => report.userId === currentUser.uid);
      setMyReports(userReports);
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Signed out');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="page container">
      {/* User Info Card */}
      <div className="card glassy-card mb-6">
        <div className="flex flex-items-center flex-between mb-6">
          <div className="flex flex-items-center flex-gap">
            <div className="icon-wrapper icon-wrapper-primary">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h1>{currentUser.username || currentUser.displayName || 'User'}</h1>
              <p className="text-gray-600 flex flex-items-center flex-gap-sm">
                <Mail className="w-4 h-4" />
                {currentUser.email}
              </p>
              {currentUser.createdAt && (
                <p className="text-sm text-gray-500 flex flex-items-center flex-gap-sm mt-1">
                  <Calendar className="w-4 h-4" />
                  Member since {new Date(currentUser.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="btn btn-danger"
          >
            <LogOut className="w-5 h-5" />
            <span style={{ marginLeft: '0.5rem' }}>Sign Out</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-3">
          <div className="stat-card glassy-stat" style={{ backgroundColor: 'var(--primary-blue)', color: 'white' }}>
            <Shield className="w-8 h-8 mb-2" />
            <div className="stat-number">{userCredibility}</div>
            <div className="stat-label">Credibility Score</div>
          </div>
          <div className="stat-card glassy-stat" style={{ backgroundColor: 'var(--accent-cyan)' }}>
            <div className="stat-number" style={{ color: 'var(--primary-blue)' }}>{myReports.length}</div>
            <div className="stat-label" style={{ color: 'var(--primary-blue)' }}>My Reports</div>
          </div>
          <div className="stat-card glassy-stat" style={{ backgroundColor: 'var(--bg-light)' }}>
            <div className="stat-number" style={{ color: 'var(--primary-blue)' }}>
              {myReports.filter(r => r.verified).length}
            </div>
            <div className="stat-label" style={{ color: 'var(--primary-blue)' }}>Verified Reports</div>
          </div>
        </div>
      </div>

      {/* My Reports Card */}
      <div className="card glassy-card">
        <h2 className="mb-4">My Reports</h2>
        <div>
          {myReports.length === 0 ? (
            <p className="text-gray-600 text-center" style={{ padding: '2rem' }}>No reports yet</p>
          ) : (
            <div className="grid grid-1 gap-4">
              {myReports.map((report) => (
                <div key={report.id} className="card report-card">
                  <div className="flex flex-items-center flex-between mb-2">
                    <div className="flex flex-items-center flex-gap-sm">
                      <span className="badge badge-danger">{report.type}</span>
                      {report.verified && (
                        <span className="badge badge-success flex flex-items-center flex-gap-sm">
                          <Shield className="w-4 h-4" />
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3">{report.description}</p>
                  <div className="flex flex-items-center text-sm text-gray-500 flex-gap">
                    <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                    <span>👍 {report.likes || 0} • 👎 {report.dislikes || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
