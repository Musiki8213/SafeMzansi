import { useState, useEffect } from 'react';
import { useAuth } from '../firebase/authContext';
import { useNavigate } from 'react-router-dom';
import { reportsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { User, LogOut, Shield, Mail, Calendar, Loader, MapPin, Clock, CheckCircle, Trash2 } from 'lucide-react';

function Profile() {
  const { currentUser, logout, userCredibility } = useAuth();
  const navigate = useNavigate();
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user's reports from API
    const fetchMyReports = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await reportsAPI.getMyReports();
        
        // Handle different response formats
        const reportsData = response.reports || response.data || response || [];
        
        // Sort by createdAt (newest first)
        const sortedReports = reportsData
          .map(report => ({
            id: report.id || report._id,
            title: report.title || 'Crime Report',
            description: report.description || '',
            type: report.type || 'Crime',
            location: report.location || 'Unknown Location',
            verified: report.verified || false,
            createdAt: report.createdAt || new Date().toISOString(),
            lat: report.lat,
            lng: report.lng
          }))
          .sort((a, b) => {
            // Sort by timestamp, newest first
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
          });
        
        setMyReports(sortedReports);
      } catch (error) {
        console.error('Error fetching my reports:', error);
        // Handle gracefully
        if (error.message.includes('Network error') || 
            error.message.includes('Failed to fetch') ||
            error.message.includes('404') ||
            error.message.includes('Route not found') ||
            error.message.includes('Authentication required')) {
          setMyReports([]);
          if (error.message.includes('Authentication required')) {
            toast.error('Please sign in to view your reports');
          }
        } else {
          toast.error('Failed to load your reports');
          setMyReports([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMyReports();
    
    // Refresh reports every 30 seconds
    const interval = setInterval(fetchMyReports, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Signed out');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(error.message || 'Failed to sign out');
    }
  };

  const handleDeleteReport = async (reportId) => {
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      await reportsAPI.deleteReport(reportId);
      toast.success('Report deleted successfully');
      
      // Remove from local state
      setMyReports(prevReports => prevReports.filter(report => report.id !== reportId));
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error(error.message || 'Failed to delete report');
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
              {currentUser.email && (
                <p className="text-gray-600 flex flex-items-center flex-gap-sm">
                  <Mail className="w-4 h-4" />
                  {currentUser.email}
                </p>
              )}
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
          {loading ? (
            <div className="text-center" style={{ padding: '2rem' }}>
              <Loader className="w-8 h-8 mx-auto mb-2 animate-spin" style={{ color: '#007A4D' }} />
              <p className="text-gray-600">Loading your reports...</p>
            </div>
          ) : myReports.length === 0 ? (
            <p className="text-gray-600 text-center" style={{ padding: '2rem' }}>
              No reports yet. Start reporting crimes to help keep your community safe!
            </p>
          ) : (
            <div className="grid grid-1 gap-4">
              {myReports.map((report) => (
                <div key={report.id} className="card report-card">
                  <div className="flex flex-items-center flex-between mb-2">
                    <div className="flex flex-items-center flex-gap-sm">
                      <span className="badge badge-danger">{report.type}</span>
                      {report.verified && (
                        <span className="badge badge-success flex flex-items-center flex-gap-sm">
                          <CheckCircle className="w-4 h-4" />
                          Verified
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      className="btn btn-danger btn-sm"
                      style={{ 
                        padding: '0.5rem', 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                      title="Delete this report"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                  <h3 className="mb-2">{report.title}</h3>
                  <p className="text-gray-600 mb-3">{report.description}</p>
                  <div className="flex flex-items-center text-sm text-gray-500 flex-gap mb-2">
                    <div className="flex flex-items-center">
                      <MapPin className="w-4 h-4" />
                      <span style={{ marginLeft: '0.25rem' }}>{report.location}</span>
                    </div>
                    <div className="flex flex-items-center">
                      <Clock className="w-4 h-4" />
                      <span style={{ marginLeft: '0.25rem' }}>
                        {new Date(report.createdAt).toLocaleString()}
                      </span>
                    </div>
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
