// Detect if running on Capacitor (mobile) - internal function
const isCapacitorInternal = () => {
  try {
    return window.Capacitor !== undefined || 
           window.capacitor !== undefined ||
           (window.location.protocol === 'capacitor:' || 
            window.location.protocol === 'capacitor-https:' ||
            window.location.protocol === 'capacitor-http:');
  } catch {
    return false;
  }
};

// Get API URL based on environment
const getApiBaseUrl = () => {
  // First, check if URL is stored in localStorage (runtime configuration)
  const storedUrl = localStorage.getItem('API_BASE_URL');
  if (storedUrl && storedUrl.trim() !== '') {
    return storedUrl.trim();
  }
  
  // Check environment variable (highest priority for build-time config)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Check mobile-specific environment variable
  if (import.meta.env.VITE_MOBILE_API_URL) {
    return import.meta.env.VITE_MOBILE_API_URL;
  }
  
  // If running on mobile (Capacitor), we need a configured URL
  if (isCapacitorInternal()) {
    // Try common development IPs (user can override via localStorage)
    // These are common local network IPs - user should update to their actual IP
    const commonDevIPs = [
      '192.168.1.100',
      '192.168.0.100', 
      '10.0.2.2' // Android emulator localhost
    ];
    
    // For now, return a URL that will show a clear error
    // User must configure via environment variable or localStorage
    console.error('⚠️ MOBILE API URL NOT CONFIGURED!');
    console.error('Please do one of the following:');
    console.error('1. Set VITE_MOBILE_API_URL in .env file');
    console.error('2. Or set API_BASE_URL in localStorage');
    console.error('Example: localStorage.setItem("API_BASE_URL", "http://YOUR_IP:5000/api")');
    
    // Return a URL that will fail with a clear error
    return 'http://localhost:5000/api'; // Will fail on mobile, but error will be clear
  }
  
  // For web/desktop, use localhost for development
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

// Export function to update API URL at runtime (useful for mobile)
export const setApiBaseUrl = (url) => {
  localStorage.setItem('API_BASE_URL', url);
  // Note: This won't update existing API_BASE_URL constant, but new requests will use it
  console.log('API URL updated to:', url);
};

// Export function to get current API URL
export const getCurrentApiUrl = () => {
  return localStorage.getItem('API_BASE_URL') || API_BASE_URL;
};

// Export isCapacitor function for use in components
export const isCapacitor = isCapacitorInternal;

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
    // Get current API URL (may have been updated at runtime)
    const currentApiUrl = localStorage.getItem('API_BASE_URL') || API_BASE_URL;
    const fullUrl = `${currentApiUrl}${endpoint}`;
    
    // Log for debugging (only in development)
    if (import.meta.env.DEV) {
      console.log(`🌐 API Request: ${config.method || 'GET'} ${fullUrl}`);
    }
    
    const response = await fetch(fullUrl, config);
    
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
    // Handle network errors with helpful messages for mobile
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const currentApiUrl = localStorage.getItem('API_BASE_URL') || API_BASE_URL;
      
      if (isCapacitorInternal() && currentApiUrl.includes('localhost')) {
        throw new Error('Mobile API Error: localhost does not work on mobile devices. Please configure API_BASE_URL in localStorage or set VITE_MOBILE_API_URL. See MOBILE_API_SETUP.md for instructions.');
      }
      
      throw new Error(`Network error: Unable to connect to server at ${currentApiUrl}. Please check if the backend is running and the API URL is correct.`);
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

  deleteReport: async (reportId) => {
    return apiRequest(`/reports/${reportId}`, {
      method: 'DELETE',
    });
  },
};

// Notifications API functions
export const notificationsAPI = {
  getNotifications: async () => {
    return apiRequest('/notifications', {
      method: 'GET',
    });
  },

  getUnreadCount: async () => {
    return apiRequest('/notifications/unread-count', {
      method: 'GET',
    });
  },

  markAsRead: async (notificationId) => {
    return apiRequest(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  },

  markAllAsRead: async () => {
    return apiRequest('/notifications/mark-all-read', {
      method: 'PATCH',
    });
  },
};
