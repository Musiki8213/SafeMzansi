import { createContext, useContext, useState, useEffect } from 'react';
import { getAuthToken, setAuthToken, getUsername, setUsername, clearAuthData } from '../utils/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const token = getAuthToken();
    const username = getUsername();
    
    if (token && username) {
      // User is logged in with JWT token
      setCurrentUser({
        username,
        token,
      });
    }
    setLoading(false);
  }, []);

  // Function to update current user (called after login)
  const updateUser = (username, token) => {
    setAuthToken(token);
    setUsername(username);
    setCurrentUser({
      username,
      token,
    });
  };

  const value = {
    currentUser,
    updateUser, // Expose updateUser for Login/SignUp components
    login: () => {}, // Placeholder
    signup: () => {}, // Placeholder
    loginWithGoogle: () => {}, // Optional: can be implemented later
    logout: async () => {
      clearAuthData();
      setCurrentUser(null);
    },
    userCredibility: 0, // Can be fetched from backend later
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
