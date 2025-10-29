import { Link } from 'react-router-dom';
import { Shield, AlertTriangle, Map as MapIcon, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '../firebase/authContext';

function Home() {
  const { currentUser } = useAuth();

  return (
    <div className="page">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex-center mb-4">
          <div className="icon-wrapper icon-wrapper-green">
            <Shield className="w-16 h-16" />
          </div>
        </div>
        <h1>Welcome to SafeMzansi</h1>
        <p className="text-xl text-gray-600 mb-8">
          Stay Informed. Stay Safe. Stay Mzansi.
        </p>
        <div className="flex flex-col sm:flex-row flex-gap justify-center">
          <Link
            to="/map"
            className="btn btn-primary"
          >
            <MapIcon className="w-5 h-5" />
            View Crime Map
          </Link>
          <Link
            to="/report"
            className="btn btn-secondary"
          >
            <AlertTriangle className="w-5 h-5" />
            Report Crime
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-3 mb-12">
        <div className="card">
          <div className="icon-wrapper icon-wrapper-green mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h3 className="mb-2">Real-Time Alerts</h3>
          <p className="text-gray-600">
            Get instant notifications when crimes are reported near your location.
          </p>
        </div>

        <div className="card">
          <div className="icon-wrapper icon-wrapper-gold mb-4">
            <MapIcon className="w-8 h-8" />
          </div>
          <h3 className="mb-2">Interactive Map</h3>
          <p className="text-gray-600">
            Visualize crime hotspots and stay informed about your area.
          </p>
        </div>

        <div className="card">
          <div className="icon-wrapper icon-wrapper-green mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="mb-2">Community Verified</h3>
          <p className="text-gray-600">
            Trust in community-validated reports to stay accurate and informed.
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="card bg-primary text-white mb-12" style={{ backgroundColor: 'var(--primary-green)', color: 'white' }}>
        <div className="grid grid-3">
          <div className="stat-card">
            <TrendingUp className="w-12 h-12 mx-auto mb-2" />
            <div className="stat-number">1,234</div>
            <div className="stat-label">Reports Today</div>
          </div>
          <div className="stat-card">
            <Users className="w-12 h-12 mx-auto mb-2" />
            <div className="stat-number">5,678</div>
            <div className="stat-label">Active Users</div>
          </div>
          <div className="stat-card">
            <Shield className="w-12 h-12 mx-auto mb-2" />
            <div className="stat-number">89%</div>
            <div className="stat-label">Verified Reports</div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="mb-12">
        <h2 className="text-center mb-8">How It Works</h2>
        <div className="grid grid-4">
          <div className="text-center">
            <div className="icon-wrapper icon-wrapper-green mx-auto mb-4">
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>1</span>
            </div>
            <h4 className="mb-2">Sign Up</h4>
            <p className="text-gray-600">Create your account for free</p>
          </div>
          <div className="text-center">
            <div className="icon-wrapper icon-wrapper-green mx-auto mb-4">
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>2</span>
            </div>
            <h4 className="mb-2">Report or View</h4>
            <p className="text-gray-600">Share incidents or check the map</p>
          </div>
          <div className="text-center">
            <div className="icon-wrapper icon-wrapper-green mx-auto mb-4">
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>3</span>
            </div>
            <h4 className="mb-2">Get Alerts</h4>
            <p className="text-gray-600">Receive real-time safety alerts</p>
          </div>
          <div className="text-center">
            <div className="icon-wrapper icon-wrapper-green mx-auto mb-4">
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>4</span>
            </div>
            <h4 className="mb-2">Stay Safe</h4>
            <p className="text-gray-600">Make informed decisions</p>
          </div>
        </div>
      </div>

      {!currentUser && (
        <div className="card text-center">
          <h2 className="mb-4">Get Started Today</h2>
          <p className="text-gray-600 mb-6">
            Join thousands of South Africans keeping each other safe.
          </p>
          <Link to="/profile" className="btn btn-primary btn-full-width">
            Sign Up Now
          </Link>
        </div>
      )}
    </div>
  );
}

export default Home;
