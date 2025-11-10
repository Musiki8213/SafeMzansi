import { useState, useEffect } from 'react';
import { useAuth } from '../firebase/authContext';
import { reportsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { Bell, MapPin, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';

function Alerts() {
  const { currentUser } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch reports from API
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const response = await reportsAPI.getReports();
        
        // Handle different response formats
        const reportsData = response.reports || response.data || response || [];
        
        // Sort by createdAt (newest first) - backend already does this, but ensure it
        const sortedReports = reportsData
          .map(report => ({
            id: report.id || report._id,
            type: report.type || 'Crime',
            location: report.location || 'Unknown Location',
            description: report.description || report.title || 'No description',
            timestamp: report.createdAt || report.timestamp || new Date().toISOString(),
            verified: report.verified || false,
            title: report.title,
            username: report.username || 'Anonymous'
          }))
          .sort((a, b) => {
            // Sort by timestamp, newest first
            const dateA = new Date(a.timestamp).getTime();
            const dateB = new Date(b.timestamp).getTime();
            return dateB - dateA;
          });
        
        setAlerts(sortedReports);
      } catch (error) {
        console.error('Error fetching alerts:', error);
        // Handle gracefully - show empty state if backend is not available
        if (error.message.includes('Network error') || 
            error.message.includes('Failed to fetch') ||
            error.message.includes('404') ||
            error.message.includes('Route not found')) {
          setAlerts([]);
          toast.info('Unable to load alerts. Backend may not be running.', {
            duration: 3000
          });
        } else {
          toast.error('Failed to load alerts');
          setAlerts([]);
        }
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchAlerts();
      
      // Refresh alerts every 30 seconds
      const interval = setInterval(fetchAlerts, 30000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="page container">
        <div className="card glassy-card text-center">
          <Bell className="w-16 h-16 mx-auto mb-4" style={{ color: '#999' }} />
          <h2 className="mb-4">Sign In Required</h2>
          <p className="text-gray-600">
            Please sign in to view personalized safety alerts
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page container">
      {/* Header */}
      <div className="flex flex-items-center mb-8">
        <div className="icon-wrapper icon-wrapper-cyan mr-4">
          <Bell className="w-8 h-8" />
        </div>
        <div>
          <h1>Safety Alerts</h1>
          <p className="text-gray-600">Nearby verified incidents</p>
        </div>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="card glassy-card text-center" style={{ padding: '3rem' }}>
          <Loader className="w-16 h-16 mx-auto mb-4 animate-spin" style={{ color: '#007A4D' }} />
          <h3 className="mb-2">Loading Alerts...</h3>
          <p className="text-gray-600">Fetching latest reports</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="card glassy-card text-center" style={{ padding: '3rem' }}>
          <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#10B981' }} />
          <h3 className="mb-2">All Clear!</h3>
          <p className="text-gray-600">
            No recent alerts. Stay safe!
          </p>
        </div>
      ) : (
        <div className="grid grid-1 md:grid-cols-2 gap-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="card glassy-card">
              <div className="flex flex-items-center flex-between mb-3">
                <div className="flex flex-items-center flex-gap-sm">
                  <span className="badge badge-danger">{alert.type}</span>
                  {alert.verified && (
                    <span className="badge badge-success flex flex-items-center flex-gap-sm">
                      <CheckCircle className="w-4 h-4" />
                      Verified
                    </span>
                  )}
                </div>
              </div>
              <h3 className="mb-2">{alert.title || `${alert.type} Reported`}</h3>
              <p className="text-gray-600 mb-4">{alert.description}</p>
              <div className="flex flex-items-center text-sm text-gray-500 flex-gap">
                <div className="flex flex-items-center">
                  <MapPin className="w-4 h-4" />
                  <span style={{ marginLeft: '0.25rem' }}>{alert.location}</span>
                </div>
                <div className="flex flex-items-center">
                  <Clock className="w-4 h-4" />
                  <span style={{ marginLeft: '0.25rem' }}>
                    {new Date(alert.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
              {alert.username && (
                <div className="mt-2 text-xs text-gray-400">
                  Reported by: {alert.username}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Alerts;
