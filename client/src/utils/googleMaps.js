import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

// Google Maps API Key
export const GOOGLE_MAPS_API_KEY = 'AIzaSyAeoH2TrdBXsN6v_ETdXwsi7wo2hdo02D8';

// Track if Google Maps API has been initialized (prevents setOptions warning)
let mapsApiInitialized = false;
let initPromise = null;

/**
 * Initialize Google Maps API once globally
 * This prevents the setOptions warning and ensures optimal loading
 */
export const initializeGoogleMaps = async () => {
  // If Google Maps is already loaded (e.g., from a script tag), skip setOptions
  if (window.google?.maps?.importLibrary) {
    mapsApiInitialized = true;
    return Promise.resolve();
  }

  // If already initialized, return immediately
  if (mapsApiInitialized && window.google?.maps) {
    return Promise.resolve();
  }

  // If initialization is in progress, return the existing promise
  if (initPromise) {
    return initPromise;
  }

  // Start initialization
  initPromise = (async () => {
    try {
      // Only call setOptions if Google Maps isn't already loaded
      if (!mapsApiInitialized && !window.google?.maps?.importLibrary) {
        setOptions({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: ['places', 'geocoding', 'visualization']
        });
        mapsApiInitialized = true;
        console.log('Google Maps API initialized globally');
      }

      // Wait for Google Maps to be available
      if (!window.google?.maps) {
        // Import maps library to trigger loading
        await importLibrary('maps');
      }

      return Promise.resolve();
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      mapsApiInitialized = false;
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
};

/**
 * Import a Google Maps library
 * Ensures API is initialized first
 */
export const loadGoogleMapsLibrary = async (libraryName) => {
  await initializeGoogleMaps();
  return await importLibrary(libraryName);
};

/**
 * Get PlacesServiceStatus enum
 */
export const getPlacesServiceStatus = () => {
  if (window.google?.maps?.places?.PlacesServiceStatus) {
    return window.google.maps.places.PlacesServiceStatus;
  }
  return null;
};

