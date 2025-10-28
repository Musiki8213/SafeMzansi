import { Link, useLocation } from 'react-router-dom';
import { Shield, Map, AlertTriangle, User, Home as HomeIcon } from 'lucide-react';
import { useAuth } from '../firebase/authContext';

function Layout({ children }) {
  const location = useLocation();
  const { currentUser } = useAuth();

  const navItems = [
    { path: '/', icon: HomeIcon, label: 'Home' },
    { path: '/map', icon: Map, label: 'Map' },
    { path: '/report', icon: AlertTriangle, label: 'Report' },
    { path: '/alerts', icon: Shield, label: 'Alerts' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation */}
      <nav className="bg-safe-green text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8" />
              <div>
                <h1 className="text-xl font-bold">SafeMzansi</h1>
                <p className="text-xs text-green-200">Stay Informed. Stay Safe.</p>
              </div>
            </div>
            {currentUser && (
              <div className="flex items-center space-x-4">
                <span className="text-sm">{currentUser.email}</span>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="bg-white border-t border-gray-200 shadow-lg md:hidden fixed bottom-0 left-0 right-0">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 ${
                  isActive
                    ? 'text-safe-green'
                    : 'text-gray-500 hover:text-safe-green'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 shadow-lg">
        <div className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-safe-green text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Adjust content for sidebar */}
      <div className="md:ml-64 pb-16 md:pb-0">{children}</div>

      {/* Footer */}
      <footer className="bg-safe-black text-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">SafeMzansi</h3>
              <p className="text-gray-400">
                Your trusted community safety platform. Together, we make Mzansi safer.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">How It Works</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Stay Connected</h4>
              <p className="text-gray-400">Download our mobile app for real-time alerts</p>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SafeMzansi. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;

