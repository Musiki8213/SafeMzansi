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
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="card text-center">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
          <p className="text-gray-600">
            Please sign in to view personalized safety alerts
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <div className="bg-safe-gold p-3 rounded-lg mr-4">
          <Bell className="w-8 h-8 text-black" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Safety Alerts</h1>
          <p className="text-gray-600">Nearby verified incidents</p>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="card text-center py-12">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">All Clear!</h3>
          <p className="text-gray-600">
            No recent alerts in your area. Stay safe!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="inline-block px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                      {alert.type}
                    </span>
                    {alert.verified && (
                      <span className="inline-flex items-center text-sm text-green-600">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Verified
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{alert.type} Reported</h3>
                  <p className="text-gray-600 mb-3">{alert.description}</p>
                  <div className="flex items-center text-sm text-gray-500 space-x-4">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      Nearby
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {new Date(alert.createdAt).toLocaleString()}
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

