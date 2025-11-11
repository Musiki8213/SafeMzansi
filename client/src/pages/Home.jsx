import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, AlertTriangle, Map as MapIcon, Users, Bell, MapPin, Loader } from 'lucide-react';
import { useAuth } from '../firebase/authContext';
import { reportsAPI } from '../utils/api';
import { requestNotificationPermission, isNotificationSupported } from '../utils/notifications';
import toast from 'react-hot-toast';

function Home() {
  const { currentUser } = useAuth();
  const username = currentUser?.username || currentUser?.displayName || 'User';
  const [latestAlerts, setLatestAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState(false);

  // Request notification permission on mount
  useEffect(() => {
    if (isNotificationSupported()) {
      requestNotificationPermission().then(permitted => {
        setNotificationPermission(permitted);
        if (permitted) {
          console.log('Notification permission granted');
        }
      });
    }
  }, []);

  // Fetch latest alerts from API
  useEffect(() => {
    const fetchLatestAlerts = async () => {
      try {
        setLoading(true);
        const response = await reportsAPI.getReports();
        
        // Handle different response formats
        const reportsData = response.reports || response.data || response || [];
        
        // Sort by createdAt (newest first) and take the latest 6
        const sortedReports = reportsData
          .map(report => ({
            id: report.id || report._id,
            type: report.type || 'Crime',
            location: report.location || 'Unknown Location',
            description: report.description || 'No description',
            timestamp: report.createdAt || report.timestamp || new Date().toISOString(),
            verified: report.verified || false,
            username: report.username || 'Anonymous'
          }))
          .sort((a, b) => {
            // Sort by timestamp, newest first
            const dateA = new Date(a.timestamp).getTime();
            const dateB = new Date(b.timestamp).getTime();
            return dateB - dateA;
          })
          .slice(0, 6); // Get latest 6 alerts
        
        setLatestAlerts(sortedReports);
      } catch (error) {
        console.error('Error fetching latest alerts:', error);
        // Handle gracefully - show empty state if backend is not available
        if (error.message.includes('Network error') || 
            error.message.includes('Failed to fetch') ||
            error.message.includes('404') ||
            error.message.includes('Route not found')) {
          setLatestAlerts([]);
        } else {
          toast.error('Failed to load latest alerts');
          setLatestAlerts([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLatestAlerts();
    
    // Refresh alerts every 30 seconds
    const interval = setInterval(fetchLatestAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page">
      {/* Welcome Card */}
      <div className="card glassy-card mb-8">
        <div className="flex flex-items-center mb-4">
          <div className="icon-wrapper icon-wrapper-primary mr-4">
            <Shield className="w-10 h-10" />
          </div>
          <div>
            <h1>Welcome back, {username}!</h1>
            <p className="text-gray-600">Stay informed about your community's safety</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row flex-gap">
          <Link to="/map" className="btn btn-primary">
            <MapIcon className="w-5 h-5" />
            View Crime Map
          </Link>
          <Link to="/report" className="btn btn-secondary">
            <AlertTriangle className="w-5 h-5" />
            Report Crime
          </Link>
          <Link to="/alerts" className="btn btn-outline">
            <Bell className="w-5 h-5" />
            View Alerts
          </Link>
        </div>
      </div>

      {/* Latest Alerts */}
      <div className="mb-8">
        <div className="flex flex-items-center mb-4">
          <Bell className="w-6 h-6 mr-2" style={{ color: 'var(--primary-blue)' }} />
          <h2>Latest Alerts</h2>
        </div>
        {loading ? (
          <div className="flex flex-items-center justify-center py-8">
            <Loader className="w-8 h-8 animate-spin" style={{ color: 'var(--primary-blue)' }} />
          </div>
        ) : latestAlerts.length === 0 ? (
          <div className="card glassy-card text-center py-8">
            <Bell className="w-12 h-12 mx-auto mb-4" style={{ color: '#999' }} />
            <p className="text-gray-600">No alerts available at the moment</p>
          </div>
        ) : (
          <div className="grid grid-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestAlerts.map((alert) => {
              // Calculate time ago
              const timeAgo = (() => {
                const now = new Date();
                const alertTime = new Date(alert.timestamp);
                const diffMs = now - alertTime;
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMs / 3600000);
                const diffDays = Math.floor(diffMs / 86400000);
                
                if (diffMins < 1) return 'Just now';
                if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
                if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
                return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
              })();

              return (
                <div key={alert.id} className="card glassy-card">
                  <div className="flex flex-items-center flex-between mb-3">
                    <span className={`badge ${alert.verified ? 'badge-success' : 'badge-danger'}`}>
                      {alert.type}
                    </span>
                    <span className="text-xs text-gray-500">{timeAgo}</span>
                  </div>
                  <h3 className="mb-2">{alert.type}</h3>
                  <p className="text-sm text-gray-600 mb-3">{alert.description}</p>
                  <div className="flex flex-items-center flex-between">
                    <div className="flex flex-items-center text-xs text-gray-500">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{alert.location}</span>
                    </div>
                    <span className="text-xs text-gray-400">by {alert.username}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Features Grid */}
      <div className="grid grid-3">
        <div className="card glassy-card">
          <div className="icon-wrapper icon-wrapper-primary mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h3 className="mb-2">Real-Time Alerts</h3>
          <p className="text-gray-600">
            Get instant notifications when crimes are reported near your location.
          </p>
        </div>

        <div className="card glassy-card">
          <div className="icon-wrapper icon-wrapper-cyan mb-4">
            <MapIcon className="w-8 h-8" />
          </div>
          <h3 className="mb-2">Interactive Map</h3>
          <p className="text-gray-600">
            Visualize crime hotspots and stay informed about your area.
          </p>
        </div>

        <div className="card glassy-card">
          <div className="icon-wrapper icon-wrapper-primary mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="mb-2">Community Verified</h3>
          <p className="text-gray-600">
            Trust in community-validated reports to stay accurate and informed.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;
