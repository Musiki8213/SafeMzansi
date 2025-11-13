import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../firebase/authContext';
import { useNavigate } from 'react-router-dom';
import { notificationsAPI } from '../utils/api';
import { showNotification, isNotificationSupported, isNotificationPermitted } from '../utils/notifications';
import toast from 'react-hot-toast';
import { Bell, MapPin, Clock, CheckCircle, Loader, Map, X } from 'lucide-react';

// Helper function to format time since
const getTimeSince = (timestamp) => {
  const now = new Date();
  const then = new Date(timestamp);
  const diffInSeconds = Math.floor((now - then) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} min ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
};

function Notifications() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const lastNotificationIdsRef = useRef(new Set()); // Track IDs of notifications we've already seen

  useEffect(() => {
    const fetchNotifications = async (isInitial = false) => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        if (isInitial) setLoading(true);
        const response = await notificationsAPI.getNotifications();
        
        const notificationsData = response.notifications || response.data || response || [];
        
        // Check for new notifications (not in our last seen set)
        if (!isInitial && lastNotificationIdsRef.current.size > 0) {
          const newNotifications = notificationsData.filter(notif => 
            !lastNotificationIdsRef.current.has(notif.id)
          );
          
          if (newNotifications.length > 0) {
            // Show popup notifications for each new notification
            newNotifications.forEach(notification => {
              // Toast notification (in-app popup)
              toast.success(
                notification.message || `🚨 New ${notification.type} report`,
                {
                  duration: 6000,
                  icon: '🚨',
                  style: {
                    background: '#DC2626',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '1rem',
                    padding: '1rem',
                    borderRadius: '8px'
                  }
                }
              );
              
              // Browser notification (system notification popup)
              if (isNotificationSupported() && isNotificationPermitted()) {
                showNotification(
                  `🚨 New ${notification.type} Report`,
                  {
                    body: notification.message || `A ${notification.type.toLowerCase()} was reported near ${notification.location}`,
                    icon: '/icon-192.png',
                    badge: '/icon-192.png',
                    tag: `notification-${notification.id}`,
                    requireInteraction: false,
                    data: {
                      notificationId: notification.id,
                      reportId: notification.reportId,
                      lat: notification.lat,
                      lng: notification.lng
                    }
                  }
                );
              }
            });
          }
        }
        
        // Update last seen IDs
        lastNotificationIdsRef.current = new Set(notificationsData.map(notif => notif.id));
        
        setNotifications(notificationsData);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        if (error.message.includes('Network error') || 
            error.message.includes('Failed to fetch') ||
            error.message.includes('404') ||
            error.message.includes('Route not found') ||
            error.message.includes('Authentication required')) {
          setNotifications([]);
          if (error.message.includes('Authentication required')) {
            toast.error('Please sign in to view notifications');
          }
        } else {
          if (isInitial) {
            toast.error('Failed to load notifications');
          }
          setNotifications([]);
        }
      } finally {
        if (isInitial) setLoading(false);
      }
    };

    if (currentUser) {
      fetchNotifications(true); // Initial load
      
      // Refresh notifications every 5 seconds for real-time popups
      const interval = setInterval(() => fetchNotifications(false), 5000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const handleViewOnMap = (lat, lng) => {
    // Navigate to map with coordinates
    navigate(`/map?lat=${lat}&lng=${lng}`);
  };

  if (!currentUser) {
    return (
      <div className="page container">
        <div className="card glassy-card text-center">
          <Bell className="w-16 h-16 mx-auto mb-4" style={{ color: '#999' }} />
          <h2 className="mb-4">Sign In Required</h2>
          <p className="text-gray-600">
            Please sign in to view your notifications
          </p>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="page container">
      {/* Header */}
      <div className="flex flex-items-center flex-between mb-8">
        <div className="flex flex-items-center">
          <div className="icon-wrapper icon-wrapper-cyan mr-4">
            <Bell className="w-8 h-8" />
            {unreadCount > 0 && (
              <span className="badge badge-danger" style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                minWidth: '20px',
                height: '20px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                padding: '0'
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1>Notifications</h1>
            <p className="text-gray-600">
              {unreadCount > 0 
                ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'All caught up!'
              }
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="btn btn-outline"
            style={{ fontSize: '0.875rem' }}
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="card glassy-card text-center" style={{ padding: '3rem' }}>
          <Loader className="w-16 h-16 mx-auto mb-4 animate-spin" style={{ color: '#007A4D' }} />
          <h3 className="mb-2">Loading Notifications...</h3>
          <p className="text-gray-600">Fetching your alerts</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="card glassy-card text-center" style={{ padding: '3rem' }}>
          <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#10B981' }} />
          <h3 className="mb-2">No Notifications</h3>
          <p className="text-gray-600">
            You'll receive alerts when other users report incidents near you.
          </p>
        </div>
      ) : (
        <div className="grid grid-1 gap-4">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`card glassy-card ${!notification.read ? 'notification-unread' : ''}`}
              style={{
                borderLeft: !notification.read ? '4px solid #DC2626' : '4px solid transparent',
                backgroundColor: !notification.read ? 'rgba(220, 38, 38, 0.05)' : 'transparent'
              }}
            >
              <div className="flex flex-items-center flex-between mb-3">
                <div className="flex flex-items-center flex-gap-sm">
                  <span className="badge badge-danger">{notification.type}</span>
                  {!notification.read && (
                    <span className="badge badge-danger" style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      padding: '0'
                    }}></span>
                  )}
                </div>
                {!notification.read && (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="btn btn-sm btn-outline"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                    title="Mark as read"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              
              <p className="mb-3" style={{ 
                fontWeight: !notification.read ? '600' : '400',
                fontSize: '1rem'
              }}>
                {notification.message}
              </p>
              
              <div className="flex flex-items-center text-sm text-gray-500 flex-gap mb-3">
                <div className="flex flex-items-center">
                  <MapPin className="w-4 h-4" />
                  <span style={{ marginLeft: '0.25rem' }}>{notification.location}</span>
                </div>
                <div className="flex flex-items-center">
                  <Clock className="w-4 h-4" />
                  <span style={{ marginLeft: '0.25rem' }}>
                    {getTimeSince(notification.createdAt)}
                  </span>
                </div>
                {notification.distance && (
                  <div className="flex flex-items-center">
                    <span style={{ marginLeft: '0.25rem' }}>
                      {notification.distance < 1000 
                        ? `${Math.round(notification.distance)}m away`
                        : `${(notification.distance / 1000).toFixed(1)}km away`
                      }
                    </span>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => handleViewOnMap(notification.lat, notification.lng)}
                className="btn btn-primary btn-sm"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '0.5rem'
                }}
              >
                <Map className="w-4 h-4" />
                View on Map
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Notifications;

