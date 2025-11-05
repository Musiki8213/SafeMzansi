import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './firebase/authContext';
import AppRoutes from './AppRoutes';

function App() {
  return (
    <Router>
      <AuthProvider>
        <>
          <AppRoutes />
          <Toaster position="top-right" />
        </>
      </AuthProvider>
    </Router>
  );
}

export default App;
