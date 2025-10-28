import { useState } from 'react';
import { collection, addDoc, GeoPoint } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../firebase/authContext';
import toast from 'react-hot-toast';
import { AlertTriangle, MapPin, Camera } from 'lucide-react';

const crimeTypes = [
  'Theft',
  'Robbery',
  'Assault',
  'Vandalism',
  'Drug Activity',
  'Suspicious Activity',
  'Domestic Violence',
  'Other'
];

function ReportCrime() {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    lat: null,
    lng: null,
    photoURL: ''
  });
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const getCurrentLocation = () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setGettingLocation(false);
          toast.success('Location captured!');
        },
        (error) => {
          toast.error('Could not get location. Please enter manually.');
          setGettingLocation(false);
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser.');
      setGettingLocation(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error('Please sign in to report crimes');
      return;
    }

    if (!formData.type || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.lat || !formData.lng) {
      toast.error('Please capture your location');
      return;
    }

    setLoading(true);
    
    try {
      await addDoc(collection(db, 'reports'), {
        type: formData.type,
        description: formData.description,
        location: new GeoPoint(formData.lat, formData.lng),
        lat: formData.lat,
        lng: formData.lng,
        photoURL: formData.photoURL,
        userId: currentUser.uid,
        verified: false,
        likes: 0,
        dislikes: 0,
        createdAt: new Date().toISOString()
      });

      toast.success('Crime report submitted successfully!');
      setFormData({
        type: '',
        description: '',
        lat: null,
        lng: null,
        photoURL: ''
      });
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="card">
        <div className="flex items-center mb-6">
          <div className="bg-red-100 p-3 rounded-lg mr-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Report Crime</h1>
            <p className="text-gray-600">Help keep your community safe</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Crime Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safe-green focus:border-transparent"
              required
            >
              <option value="">Select a crime type</option>
              {crimeTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safe-green focus:border-transparent"
              placeholder="Describe what you witnessed..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="btn btn-secondary inline-flex items-center"
              >
                <MapPin className="w-5 h-5 mr-2" />
                {gettingLocation ? 'Getting Location...' : 'Use My Location'}
              </button>
              {formData.lat && formData.lng && (
                <span className="text-sm text-green-600">
                  ✓ Location captured
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo (Optional)
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="url"
                value={formData.photoURL}
                onChange={(e) => setFormData({ ...formData, photoURL: e.target.value })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safe-green focus:border-transparent"
                placeholder="Photo URL (or upload)"
              />
              <button
                type="button"
                className="btn bg-gray-100 text-gray-700 inline-flex items-center"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary"
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ReportCrime;

