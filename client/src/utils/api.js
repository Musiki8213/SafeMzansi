const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to get auth token from localStorage
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to set auth token in localStorage
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

// Helper function to get username from localStorage
export const getUsername = () => {
  return localStorage.getItem('username');
};

// Helper function to set username in localStorage
export const setUsername = (username) => {
  if (username) {
    localStorage.setItem('username', username);
  } else {
    localStorage.removeItem('username');
  }
};

// Helper function to clear auth data
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
};

// API request helper with improved error handling
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options.headers || {}),
    },
    ...options,
  };

  // Remove headers from options to avoid duplication
  delete config.headers['headers'];

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Try to parse JSON response
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // If response is not JSON, read as text
      const text = await response.text();
      throw new Error(text || `Server error: ${response.status}`);
    }

    if (!response.ok) {
      throw new Error(data.message || `Error: ${response.status} ${response.statusText}`);
    }

    return data;
  } catch (error) {
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to server. Please check if the backend is running.');
    }
    
    // Re-throw if it's already a formatted error
    if (error.message) {
      throw error;
    }
    
    // Fallback error
    throw new Error('An unexpected error occurred');
  }
};

// Auth API functions
export const authAPI = {
  register: async (username, email, password) => {
    const response = await apiRequest('/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    return response;
  },

  login: async (email, password) => {
    const response = await apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return response;
  },

  getProfile: async () => {
    return apiRequest('/profile', {
      method: 'GET',
    });
  },
};

// Reports API functions
export const reportsAPI = {
  getReports: async () => {
    return apiRequest('/reports', {
      method: 'GET',
    });
  },

  getMyReports: async () => {
    return apiRequest('/reports/my-reports', {
      method: 'GET',
    });
  },

  submitReport: async (title, description, type, location, lat, lng) => {
    return apiRequest('/reports', {
      method: 'POST',
      body: JSON.stringify({
        title,
        description,
        type,
        location,
        lat,
        lng
      }),
    });
  },
};
