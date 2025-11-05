import { Navigate } from 'react-router-dom';
import { getAuthToken } from '../utils/api';

function ProtectedRoute({ children }) {
  const token = getAuthToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
