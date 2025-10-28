import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Map from './pages/Map';
import ReportCrime from './pages/ReportCrime';
import Alerts from './pages/Alerts';
import Profile from './pages/Profile';
import { useAuth } from './firebase/authContext';

function AppRoutes() {
  const { currentUser } = useAuth();

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<Map />} />
        <Route path="/report" element={<ReportCrime />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route 
          path="/profile" 
          element={currentUser ? <Profile /> : <Navigate to="/" />} 
        />
      </Routes>
    </Layout>
  );
}

export default AppRoutes;

