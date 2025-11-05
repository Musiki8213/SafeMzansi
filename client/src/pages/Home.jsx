import { Link } from 'react-router-dom';
import { Shield, AlertTriangle, Map as MapIcon, TrendingUp, Users, Bell, Clock, MapPin } from 'lucide-react';
import { useAuth } from '../firebase/authContext';

// Mock data for latest alerts
const mockLatestAlerts = [
  {
    id: 1,
    type: 'Theft',
    location: 'Johannesburg CBD',
    time: '2 hours ago',
    description: 'Vehicle break-in reported near Main Street'
  },
  {
    id: 2,
    type: 'Suspicious Activity',
    location: 'Cape Town Central',
    time: '5 hours ago',
    description: 'Unusual activity reported in the area'
  },
  {
    id: 3,
    type: 'Robbery',
    location: 'Durban North',
    time: '8 hours ago',
    description: 'Incident reported and verified by community'
  }
];

function Home() {
  const { currentUser } = useAuth();
  const username = currentUser?.username || currentUser?.displayName || 'User';

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

      {/* Stats Cards */}
      <div className="grid grid-3 mb-8">
        <div className="card glassy-card">
          <div className="flex flex-items-center flex-between">
            <div>
              <p className="text-gray-600 mb-1">Reports Today</p>
              <div className="text-3xl font-bold" style={{ color: 'var(--primary-blue)' }}>1,234</div>
            </div>
            <div className="icon-wrapper icon-wrapper-primary">
              <TrendingUp className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="card glassy-card">
          <div className="flex flex-items-center flex-between">
            <div>
              <p className="text-gray-600 mb-1">Active Users</p>
              <div className="text-3xl font-bold" style={{ color: 'var(--primary-blue)' }}>5,678</div>
            </div>
            <div className="icon-wrapper icon-wrapper-cyan">
              <Users className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="card glassy-card">
          <div className="flex flex-items-center flex-between">
            <div>
              <p className="text-gray-600 mb-1">Verified Reports</p>
              <div className="text-3xl font-bold" style={{ color: 'var(--primary-blue)' }}>89%</div>
            </div>
            <div className="icon-wrapper icon-wrapper-primary">
              <Shield className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Latest Alerts */}
      <div className="mb-8">
        <div className="flex flex-items-center mb-4">
          <Bell className="w-6 h-6 mr-2" style={{ color: 'var(--primary-blue)' }} />
          <h2>Latest Alerts</h2>
        </div>
        <div className="grid grid-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockLatestAlerts.map((alert) => (
            <div key={alert.id} className="card glassy-card">
              <div className="flex flex-items-center flex-between mb-3">
                <span className="badge badge-danger">{alert.type}</span>
                <span className="text-xs text-gray-500">{alert.time}</span>
              </div>
              <h3 className="mb-2">{alert.type}</h3>
              <p className="text-sm text-gray-600 mb-3">{alert.description}</p>
              <div className="flex flex-items-center text-xs text-gray-500">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{alert.location}</span>
              </div>
            </div>
          ))}
        </div>
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
