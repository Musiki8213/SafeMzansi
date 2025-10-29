import { useState } from 'react';
import { useAuth } from '../firebase/authContext';
import { Bell, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react';

// Mock alerts data
const mockAlerts = [
  {
    id: 1,
    type: 'Theft',
    location: 'Johannesburg CBD',
    description: 'Vehicle break-in reported near Main Street. Community verified.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    verified: true
  },
  {
    id: 2,
    type: 'Suspicious Activity',
    location: 'Cape Town Central',
    description: 'Unusual activity reported in the area. Multiple witnesses.',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    verified: true
  },
  {
    id: 3,
    type: 'Robbery',
    location: 'Durban North',
    description: 'Incident reported and verified by community. Police notified.',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    verified: true
  },
  {
    id: 4,
    type: 'Vandalism',
    location: 'Pretoria East',
    description: 'Property damage reported. Under review.',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    verified: false
  },
  {
    id: 5,
    type: 'Drug Activity',
    location: 'Port Elizabeth',
    description: 'Suspected drug activity in the area. Report verified.',
    timestamp: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
    verified: true
  }
];

function Alerts() {
  const { currentUser } = useAuth();
  const [alerts] = useState(mockAlerts);

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
      {alerts.length === 0 ? (
        <div className="card glassy-card text-center" style={{ padding: '3rem' }}>
          <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#10B981' }} />
          <h3 className="mb-2">All Clear!</h3>
          <p className="text-gray-600">
            No recent alerts in your area. Stay safe!
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
              <h3 className="mb-2">{alert.type} Reported</h3>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Alerts;
