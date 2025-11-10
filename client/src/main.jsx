import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Suppress Google Maps deprecation warnings globally
// These warnings are informational - the APIs still work fine
const originalWarn = console.warn;
const originalError = console.error;

console.warn = (...args) => {
  const message = args.join(' ').toLowerCase();
  // Filter out Google Maps deprecation warnings and loader warnings
  if (message.includes('autocompleteservice is not available') ||
      message.includes('placesservice is not available') ||
      message.includes('autocompletesuggestion') ||
      message.includes('place instead') ||
      message.includes('march 1st, 2025') ||
      message.includes('no options were set before calling importlibrary') ||
      message.includes('make sure to configure the loader using setoptions') ||
      message.includes('map\'s styles property cannot be set when a mapid is present')) {
    return; // Suppress these warnings
  }
  originalWarn.apply(console, args);
};

console.error = (...args) => {
  const message = args.join(' ').toLowerCase();
  // Filter out Google Maps deprecation errors
  if (message.includes('autocompleteservice is not available') ||
      message.includes('placesservice is not available') ||
      message.includes('autocompletesuggestion') ||
      message.includes('place instead') ||
      message.includes('march 1st, 2025') ||
      message.includes('icon from the manifest') ||
      message.includes('download error or resource isn\'t a valid image')) {
    return; // Suppress these errors
  }
  originalError.apply(console, args);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
