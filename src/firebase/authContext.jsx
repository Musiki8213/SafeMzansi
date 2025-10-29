import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();
const STORAGE_KEY = 'safemzansi_users';
const CURRENT_USER_KEY = 'safemzansi_current_user';

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userCredibility, setUserCredibility] = useState(0);

  // Get users from localStorage
  function getUsers() {
    const usersData = localStorage.getItem(STORAGE_KEY);
    return usersData ? JSON.parse(usersData) : {};
  }

  // Save users to localStorage
  function saveUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }

  // Get current user from localStorage
  function getCurrentUserFromStorage() {
    const userData = localStorage.getItem(CURRENT_USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  // Save current user to localStorage
  function saveCurrentUserToStorage(user) {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }

  async function signup(username, email, password) {
    return new Promise((resolve, reject) => {
      try {
        const users = getUsers();
        
        // Check if email already exists
        if (users[email]) {
          reject(new Error('Email already registered. Please login instead.'));
          return;
        }

        // Check if username already exists
        const existingUser = Object.values(users).find(u => u.userData?.username === username);
        if (existingUser) {
          reject(new Error('Username already taken. Please choose another.'));
          return;
        }

        // Create new user
        const newUser = {
          uid: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          username,
          email,
          displayName: username, // For backward compatibility
          credibility: 0,
          verifiedReports: 0,
          createdAt: new Date().toISOString()
        };

        // Save user
        users[email] = {
          email,
          password, // In production, this should be hashed
          username,
          userData: newUser
        };
        saveUsers(users);

        // Auto-login after signup
        setCurrentUser(newUser);
        saveCurrentUserToStorage(newUser);
        setUserCredibility(0);

        resolve({ user: newUser });
      } catch (error) {
        reject(error);
      }
    });
  }

  function login(email, password) {
    return new Promise((resolve, reject) => {
      try {
        const users = getUsers();
        const userRecord = users[email];

        if (!userRecord) {
          reject(new Error('Email not found. Please sign up first.'));
          return;
        }

        if (userRecord.password !== password) {
          reject(new Error('Invalid password. Please try again.'));
          return;
        }

        // Set current user
        const user = userRecord.userData;
        setCurrentUser(user);
        saveCurrentUserToStorage(user);
        
        // Get credibility
        setUserCredibility(user.credibility || 0);

        resolve({ user });
      } catch (error) {
        reject(error);
      }
    });
  }

  function loginWithGoogle() {
    return new Promise((resolve, reject) => {
      // Mock Google login - create a demo user
      const demoUser = {
        uid: `google_${Date.now()}`,
        username: 'Demo User',
        email: 'demo@gmail.com',
        displayName: 'Demo User',
        credibility: 0,
        verifiedReports: 0,
        createdAt: new Date().toISOString()
      };

      setCurrentUser(demoUser);
      saveCurrentUserToStorage(demoUser);
      setUserCredibility(0);
      resolve({ user: demoUser });
    });
  }

  function logout() {
    return new Promise((resolve) => {
      setCurrentUser(null);
      saveCurrentUserToStorage(null);
      setUserCredibility(0);
      resolve();
    });
  }

  useEffect(() => {
    // Check for existing session on mount
    const savedUser = getCurrentUserFromStorage();
    if (savedUser) {
      setCurrentUser(savedUser);
      setUserCredibility(savedUser.credibility || 0);
    }
    setLoading(false);
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    loginWithGoogle,
    logout,
    userCredibility
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
