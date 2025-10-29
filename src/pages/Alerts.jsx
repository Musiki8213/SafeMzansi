import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../firebase/authContext';
import { Bell, MapPin, Clock, CheckCircle } from 'lucide-react';

function Alerts() {
  const { currentUser } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }

    // Listen to reports within 2km
    const q = query(collection(db, 'reports'), where('verified', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reports = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (userLocation) {
        // Calculate distance and filter within 2km
        const nearbyReports = reports.filter(report => {
          const distance = getDistance(
            userLocation.lat,
            userLocation.lng,
            report.lat,
            report.lng
          );
          return distance <= 2; // 2km
        });
        setAlerts(nearbyReports);
      }
    });

    return unsubscribe;
  }, [currentUser, userLocation]);

  // Haversine formula to calculate distance
  function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  if (!currentUser) {
    return (
      <div className="page container">
        <div className="card text-center">
          <Bell className="w-16 h-16" style={{ color: '#999', margin: '0 auto 1rem' }} />
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
      <div className="flex flex-items-center mb-8">
        <div className="icon-wrapper icon-wrapper-gold mr-4">
          <Bell className="w-8 h-8" />
        </div>
        <div>
          <h1>Safety Alerts</h1>
          <p className="text-gray-600">Nearby verified incidents</p>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <CheckCircle className="w-16 h-16" style={{ color: '#10B981', margin: '0 auto 1rem' }} />
          <h3 className="mb-2">All Clear!</h3>
          <p className="text-gray-600">
            No recent alerts in your area. Stay safe!
          </p>
        </div>
      ) : (
        <div>
          {alerts.map((alert) => (
            <div key={alert.id} className="card">
              <div className="flex flex-between mb-3">
                <div>
                  <div className="flex flex-items-center flex-gap-sm mb-2">
                    <span className="badge badge-danger">
                      {alert.type}
                    </span>
                    {alert.verified && (
                      <span className="badge badge-success flex flex-items-center flex-gap-sm">
                        <CheckCircle className="w-4 h-4" />
                        Verified
                      </span>
                    )}
                  </div>
                  <h3 className="mb-2">{alert.type} Reported</h3>
                  <p className="text-gray-600 mb-3">{alert.description}</p>
                  <div className="flex flex-items-center text-sm text-gray-500 flex-gap">
                    <div className="flex flex-items-center">
                      <MapPin className="w-4 h-4" />
                      <span style={{ marginLeft: '0.25rem' }}>Nearby</span>
                    </div>
                    <div className="flex flex-items-center">
                      <Clock className="w-4 h-4" />
                      <span style={{ marginLeft: '0.25rem' }}>
                        {new Date(alert.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
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
