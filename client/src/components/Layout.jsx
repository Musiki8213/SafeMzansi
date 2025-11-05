import { Link, useLocation } from 'react-router-dom';
import { Shield, Map, AlertTriangle, User, Home as HomeIcon, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../firebase/authContext';

function Layout({ children }) {
  const location = useLocation();
  const { currentUser } = useAuth();

  const navItems = [
    { path: '/home', icon: HomeIcon, label: 'Home' },
    { path: '/map', icon: Map, label: 'Map' },
    { path: '/report', icon: AlertTriangle, label: 'Report' },
    { path: '/alerts', icon: Shield, label: 'Alerts' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

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
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon className="nav-link-icon" />
                  <span>{item.label}</span>
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
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon className="bottom-nav-icon" />
                <span className="bottom-nav-label">{item.label}</span>
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

