import { Link } from 'react-router-dom';
import { Shield, AlertTriangle, Map as MapIcon, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '../firebase/authContext';

function Home() {
  const { currentUser } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="bg-safe-green p-4 rounded-full">
            <Shield className="w-16 h-16 text-white" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Welcome to SafeMzansi
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Stay Informed. Stay Safe. Stay Mzansi.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/map"
            className="btn btn-primary inline-flex items-center justify-center"
          >
            <MapIcon className="w-5 h-5 mr-2" />
            View Crime Map
          </Link>
          <Link
            to="/report"
            className="btn btn-secondary inline-flex items-center justify-center"
          >
            <AlertTriangle className="w-5 h-5 mr-2" />
            Report Crime
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="card">
          <div className="bg-safe-green p-3 rounded-lg w-fit mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2">Real-Time Alerts</h3>
          <p className="text-gray-600">
            Get instant notifications when crimes are reported near your location.
          </p>
        </div>

        <div className="card">
          <div className="bg-safe-gold p-3 rounded-lg w-fit mb-4">
            <MapIcon className="w-8 h-8 text-black" />
          </div>
          <h3 className="text-xl font-bold mb-2">Interactive Map</h3>
          <p className="text-gray-600">
            Visualize crime hotspots and stay informed about your area.
          </p>
        </div>

        <div className="card">
          <div className="bg-safe-green p-3 rounded-lg w-fit mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2">Community Verified</h3>
          <p className="text-gray-600">
            Trust in community-validated reports to stay accurate and informed.
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-safe-green text-white rounded-lg p-8 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 mx-auto mb-2" />
            <div className="text-4xl font-bold">1,234</div>
            <div className="text-green-200">Reports Today</div>
          </div>
          <div className="text-center">
            <Users className="w-12 h-12 mx-auto mb-2" />
            <div className="text-4xl font-bold">5,678</div>
            <div className="text-green-200">Active Users</div>
          </div>
          <div className="text-center">
            <Shield className="w-12 h-12 mx-auto mb-2" />
            <div className="text-4xl font-bold">89%</div>
            <div className="text-green-200">Verified Reports</div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="bg-safe-green text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              1
            </div>
            <h4 className="font-bold mb-2">Sign Up</h4>
            <p className="text-gray-600">Create your account for free</p>
          </div>
          <div className="text-center">
            <div className="bg-safe-green text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              2
            </div>
            <h4 className="font-bold mb-2">Report or View</h4>
            <p className="text-gray-600">Share incidents or check the map</p>
          </div>
          <div className="text-center">
            <div className="bg-safe-green text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              3
            </div>
            <h4 className="font-bold mb-2">Get Alerts</h4>
            <p className="text-gray-600">Receive real-time safety alerts</p>
          </div>
          <div className="text-center">
            <div className="bg-safe-green text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              4
            </div>
            <h4 className="font-bold mb-2">Stay Safe</h4>
            <p className="text-gray-600">Make informed decisions</p>
          </div>
        </div>
      </div>

      {!currentUser && (
        <div className="card text-center">
          <h2 className="text-2xl font-bold mb-4">Get Started Today</h2>
          <p className="text-gray-600 mb-6">
            Join thousands of South Africans keeping each other safe.
          </p>
          <Link to="/profile" className="btn btn-primary inline-block">
            Sign Up Now
          </Link>
        </div>
      )}
    </div>
  );
}

export default Home;

