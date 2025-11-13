import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Map, AlertTriangle, User, Home as HomeIcon, LogIn, UserPlus, Bell } from 'lucide-react';
import { useAuth } from '../firebase/authContext';
import { useState, useEffect, useRef } from 'react';
import { notificationsAPI } from '../utils/api';
import { showNotification, isNotificationSupported, isNotificationPermitted } from '../utils/notifications';
import toast from 'react-hot-toast';

function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const navItems = [
    { path: '/home', icon: HomeIcon, label: 'Home' },
    { path: '/map', icon: Map, label: 'Map' },
    { path: '/report', icon: AlertTriangle, label: 'Report' },
    { path: '/alerts', icon: Shield, label: 'Alerts' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  const lastNotificationIdsRef = useRef(new Set()); // Track IDs of notifications we've already shown toasts for


  // Fetch unread notification count and show popups for new notifications
  useEffect(() => {
    const fetchUnreadCountAndCheckNew = async () => {
      if (!currentUser) {
        setUnreadCount(0);
        notificationQueueRef.current = [];
        isShowingPopupRef.current = false;
        return;
      }

      try {
        // Fetch latest notifications to check for new ones
        const notificationsResponse = await notificationsAPI.getNotifications();
        console.log('Notifications API response:', notificationsResponse);
        
        const notificationsData = notificationsResponse.notifications || notificationsResponse.data || [];
        
        if (!Array.isArray(notificationsData)) {
          console.warn('Notifications data is not an array:', notificationsData);
          return;
        }
        
        console.log(`Fetched ${notificationsData.length} total notifications`);
        
        // Get only unread notifications
        const unreadNotifications = notificationsData.filter(n => !n.read);
        console.log(`Found ${unreadNotifications.length} unread notifications`);
        
        // Update unread count
        setUnreadCount(unreadNotifications.length);
        
        // Check for notifications that haven't been shown as toasts yet
        // Show ALL unread notifications that we haven't displayed yet
        const newNotifications = unreadNotifications.filter(notif => {
          const notifId = notif.id || notif._id;
          if (!notifId) return false;
          
          // Show if we haven't shown this notification as a toast yet
          const hasBeenShown = lastNotificationIdsRef.current.has(notifId);
          if (!hasBeenShown) {
            console.log(`Found unshown notification:`, notif);
            return true;
          }
          
          return false;
        });
        
        console.log(`Found ${newNotifications.length} new notifications to show as toasts`);
        
        // Show toast for each new notification
        if (newNotifications.length > 0) {
          newNotifications.forEach(notification => {
            const notifId = notification.id || notification._id;
            if (notifId) {
              // Show toast notification
              const toastId = toast.custom((t) => (
                <div
                  onClick={() => {
                    toast.dismiss(t.id);
                    // Mark as read
                    notificationsAPI.markAsRead(notifId).catch(err => console.error('Error marking as read:', err));
                    // Navigate to map
                    navigate(`/map?lat=${notification.lat}&lng=${notification.lng}`);
                  }}
                  style={{
                    backgroundColor: '#DC2626',
                    color: 'white',
                    padding: '1rem 1.25rem',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                    minWidth: '320px',
                    maxWidth: '400px',
                    cursor: 'pointer',
                    border: '2px solid #B91C1C',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>🚨</span>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>
                        New {notification.type} Report
                      </h3>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.dismiss(t.id);
                        notificationsAPI.markAsRead(notifId).catch(err => console.error('Error marking as read:', err));
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        fontSize: '1.25rem',
                        lineHeight: 1
                      }}
                    >
                      ×
                    </button>
                  </div>
                  
                  <div style={{ fontSize: '0.9375rem', lineHeight: 1.5 }}>
                    {notification.message || `A ${notification.type.toLowerCase()} was reported near ${notification.location}`}
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    opacity: 0.9
                  }}>
                    <span>📍 {notification.location}</span>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    gap: '0.5rem',
                    marginTop: '0.25rem'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.dismiss(t.id);
                        notificationsAPI.markAsRead(notifId).catch(err => console.error('Error marking as read:', err));
                        navigate(`/map?lat=${notification.lat}&lng=${notification.lng}`);
                      }}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                    >
                      View on Map
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.dismiss(t.id);
                        notificationsAPI.markAsRead(notifId).catch(err => console.error('Error marking as read:', err));
                        navigate('/alerts');
                      }}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                    >
                      View Alerts
                    </button>
                  </div>
                </div>
              ), {
                duration: Infinity, // Stay until clicked
                position: 'top-right',
                style: {
                  padding: 0,
                  background: 'transparent',
                  boxShadow: 'none'
                }
              });
              
              // Also show browser notification (system notification popup)
              if (isNotificationSupported() && isNotificationPermitted()) {
                showNotification(
                  `🚨 New ${notification.type} Report`,
                  {
                    body: notification.message || `A ${notification.type.toLowerCase()} was reported near ${notification.location}`,
                    icon: '/icon-192.png',
                    badge: '/icon-192.png',
                    tag: `notification-${notifId}`,
                    requireInteraction: false,
                    data: {
                      notificationId: notifId,
                      reportId: notification.reportId,
                      lat: notification.lat,
                      lng: notification.lng
                    }
                  }
                );
              }
              
              // Mark as shown
              lastNotificationIdsRef.current.add(notifId);
            }
          });
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        console.error('Error details:', error.message, error.stack);
        // Don't show error to user, just log it
        setUnreadCount(0);
      }
    };

    if (currentUser) {
      // Clear tracking when user changes (e.g., switching accounts)
      lastNotificationIdsRef.current.clear();
      
      fetchUnreadCountAndCheckNew(); // Initial load
      
      // Check for new notifications every 3 seconds for faster real-time toasts
      const interval = setInterval(fetchUnreadCountAndCheckNew, 3000);
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
      lastNotificationIdsRef.current.clear();
    }
  }, [currentUser]);

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-brand">
            <Shield className="navbar-brand-icon" />
            <div className="navbar-brand-info">
              <h1>SafeMzansi</h1>
              <p>Stay Informed. Stay Safe.</p>
            </div>
          </div>
          <div className="navbar-auth">
            {currentUser ? (
              <div className="navbar-username">
                <span className="username-text" style={{ 
                  color: 'white', 
                  fontWeight: '600',
                  fontSize: '1rem',
                  padding: '0.5rem 1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  backdropFilter: 'blur(10px)'
                }}>
                  {currentUser.username || currentUser.displayName || 'User'}
                </span>
              </div>
            ) : (
              <div className="navbar-auth-buttons">
                <Link to="/login" className="btn btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
                <Link to="/signup" className="btn" style={{ background: 'white', color: 'var(--primary-blue)', marginLeft: '0.5rem' }}>
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Desktop Sidebar - Only show when authenticated */}
      {currentUser && (
        <aside className="sidebar">
          <div className="sidebar-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              const showBadge = false; // No badge needed since notifications page is removed
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  style={{ position: 'relative' }}
                >
                  <Icon className="nav-link-icon" />
                  <span>{item.label}</span>
                  {showBadge && (
                    <span className="badge badge-danger" style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      minWidth: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      padding: '0',
                      fontWeight: '600'
                    }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className={`main-content ${!currentUser ? 'main-content-no-sidebar' : ''}`}>
        {children}
      </main>

      {/* Bottom Navigation (Mobile) - Only show when authenticated */}
      {currentUser && (
        <nav className="bottom-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const showBadge = false; // No badge needed since notifications page is removed
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`bottom-nav-item ${isActive ? 'active' : ''}`}
                style={{ position: 'relative' }}
              >
                <Icon className="bottom-nav-icon" />
                <span className="bottom-nav-label">{item.label}</span>
                {showBadge && (
                  <span className="badge badge-danger" style={{
                    position: 'absolute',
                    top: '4px',
                    right: '20px',
                    minWidth: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    padding: '0',
                    fontWeight: '600'
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-grid">
            <div className="footer-section">
              <h3>SafeMzansi</h3>
              <p>
                Your trusted community safety platform. Together, we make Mzansi safer.
              </p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul className="footer-list">
                <li><a href="#">About Us</a></li>
                <li><a href="#">How It Works</a></li>
                <li><a href="#">Privacy</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Stay Connected</h4>
              <p>Download our mobile app for real-time alerts</p>
            </div>
          </div>
          <div className="footer-copyright">
            <p>&copy; 2025 SafeMzansi. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;

