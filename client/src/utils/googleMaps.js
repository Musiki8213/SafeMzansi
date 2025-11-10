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
  // If already initialized and Google Maps is fully loaded, return immediately
  if (mapsApiInitialized && window.google?.maps?.Map) {
    return Promise.resolve();
  }

  // If initialization is in progress, return the existing promise
  if (initPromise) {
    return initPromise;
  }

  // Start initialization
  initPromise = (async () => {
    try {
      // CRITICAL: Always call setOptions first, even if Google Maps appears to be loaded
      // This ensures the loader is properly configured before any importLibrary calls
      // The @googlemaps/js-api-loader requires setOptions to be called before importLibrary
      if (!mapsApiInitialized) {
        setOptions({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: ['places', 'geocoding', 'visualization']
        });
        mapsApiInitialized = true;
        console.log('Google Maps API initialized globally');
      }

      // Wait for Google Maps to be available
      // If it's not loaded yet, import the maps library to trigger loading
      if (!window.google?.maps) {
        await importLibrary('maps');
      } else if (!window.google?.maps?.Map) {
        // If maps object exists but Map class doesn't, import it
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
 * Ensures API is initialized first (setOptions is always called)
 */
export const loadGoogleMapsLibrary = async (libraryName) => {
  // Always ensure initialization (which calls setOptions) before importing
  await initializeGoogleMaps();
  
  // Now safe to import the library
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

