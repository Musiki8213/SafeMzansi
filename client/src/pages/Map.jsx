import { useState, useEffect, useCallback, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Filter, MapPin, Clock, AlertTriangle, Navigation, Search, X, Info, Plus } from 'lucide-react';
import { reportsAPI } from '../utils/api';
import toast from 'react-hot-toast';

// Default coordinates for Johannesburg, South Africa
const DEFAULT_CENTER = [28.0473, -26.2041]; // [lng, lat]
const DEFAULT_ZOOM = 12;

// Crime type colors - professional palette
const crimeTypeColors = {
  Theft: '#FF6B6B',
  Robbery: '#DC2626',
  Assault: '#EA580C',
  Vandalism: '#F59E0B',
  'Drug Activity': '#8B5CF6',
  'Suspicious Activity': '#6366F1',
  'Domestic Violence': '#EC4899',
  Hijacking: '#B91C1C',
  Burglary: '#F97316',
  Other: '#6B7280'
};

// Danger level colors for heatmap - Green/Yellow/Orange/Red gradient
const dangerLevels = {
  low: { color: '#10B981', intensity: 0.3 },      // Green - low danger
  medium: { color: '#FBBF24', intensity: 0.6 },   // Yellow - medium danger
  high: { color: '#F97316', intensity: 0.9 },      // Orange - high danger
  critical: { color: '#DC2626', intensity: 1.0 }  // Red - critical danger
};

/**
 * Calculate danger level based on crime count
 */
const getDangerLevel = (count) => {
  if (count >= 10) return 'critical';
  if (count >= 5) return 'high';
  if (count >= 2) return 'medium';
  return 'low';
};

/**
 * Format date for display
 */
const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString || 'Unknown date';
  }
};

function SafeMzansiMap() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [hoveredReport, setHoveredReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(false);
  
  // Filter states
  const [selectedType, setSelectedType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Location search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  // Manual pin placement
  const [isPlacingPin, setIsPlacingPin] = useState(false);
  const [manualPinLocation, setManualPinLocation] = useState(null);
  const manualPinMarker = useRef(null);
  
  // Markers, popup, and heatmap refs
  const markersRef = useRef([]);
  const hotspotMarkersRef = useRef([]);
  const popupRef = useRef(null);
  const heatmapSourceRef = useRef(null);
  const heatmapLayerRef = useRef(null);

  /**
   * Initialize MapLibre GL JS map
   */
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm-tiles-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 22
          }
        ]
      },
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM
    });

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    
    // Add scale control
    const scale = new maplibregl.ScaleControl({
      maxWidth: 100,
      unit: 'metric'
    });
    map.current.addControl(scale, 'bottom-left');

    // Handle map click for manual pin placement
    map.current.on('click', (e) => {
      if (isPlacingPin) {
        const { lng, lat } = e.lngLat;
        setManualPinLocation({ lng, lat });
        setIsPlacingPin(false);
        addManualPinMarker(lng, lat);
        toast.success('Location selected! You can now report a crime at this location.');
      }
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [isPlacingPin]);

  /**
   * Add manual pin marker
   */
  const addManualPinMarker = useCallback((lng, lat) => {
    if (!map.current || manualPinMarker.current) return;

    // Create marker element
    const el = document.createElement('div');
    el.className = 'manual-pin-marker';
    el.innerHTML = `
      <svg width="40" height="56" viewBox="0 0 32 48" style="filter: drop-shadow(0 4px 8px rgba(16, 185, 129, 0.4)); animation: bounce-in 0.3s ease;">
        <path fill="#10B981" stroke="white" stroke-width="3" d="M16 0C7.163 0 0 7.163 0 16c0 16 16 32 16 32s16-16 16-32C32 7.163 24.837 0 16 0z"/>
        <circle fill="white" cx="16" cy="16" r="8"/>
        <circle fill="#10B981" cx="16" cy="16" r="4"/>
      </svg>
    `;

    manualPinMarker.current = new maplibregl.Marker({ element: el })
      .setLngLat([lng, lat])
      .addTo(map.current);
  }, []);

  /**
   * Fetch crime reports from API
   * 
   * Fetches on mount and then polls every 30 seconds for real-time updates.
   * To add a new report programmatically:
   * 1. Call reportsAPI.submitReport() to save to backend
   * 2. Then add to local state: setReports(prev => [...prev, newReport])
   * 3. Hotspots will automatically recalculate
   */
  useEffect(() => {
    let previousReportIds = new Set();
    
    const fetchReports = async (showToast = false) => {
      try {
        if (!showToast) setLoading(true);
        const response = await reportsAPI.getReports();
        
        const reportsData = response.reports || response.data || response || [];
        
        const validReports = reportsData
          .filter(report => report.lat && report.lng)
          .map(report => ({
            id: report.id || report._id || `report_${Date.now()}_${Math.random()}`,
            title: report.title || report.type || 'Crime Report',
            type: report.type || 'Other',
            description: report.description || '',
            location: report.location || 'Unknown Location',
            lat: parseFloat(report.lat),
            lng: parseFloat(report.lng),
            createdAt: report.createdAt || report.date || new Date().toISOString(),
            verified: report.verified || false
          }));
        
        // Check for new reports (for animation and toast)
        const currentReportIds = new Set(validReports.map(r => r.id));
        const newReports = validReports.filter(r => !previousReportIds.has(r.id));
        
        setReports(validReports);
        setFilteredReports(validReports);
        previousReportIds = currentReportIds;
        
        // Show subtle notification if new reports added during polling
        if (showToast && newReports.length > 0) {
          toast.success(`${newReports.length} new report${newReports.length > 1 ? 's' : ''} added`, {
            duration: 2000,
            icon: '📍'
          });
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
        if (!error.message.includes('404') && !error.message.includes('not found')) {
          if (!showToast) {
            toast.error('Failed to load crime reports');
          }
        }
        if (!showToast) {
          setReports([]);
          setFilteredReports([]);
        }
      } finally {
        if (!showToast) setLoading(false);
      }
    };

    // Initial fetch
    fetchReports();

    // Set up periodic polling every 30 seconds
    const pollInterval = setInterval(() => {
      fetchReports(true); // true = show toast for new reports
    }, 30000); // 30 seconds

    // Cleanup interval on unmount
    return () => clearInterval(pollInterval);
  }, []);

  // Filter reports
  useEffect(() => {
    let filtered = [...reports];

    if (selectedType) {
      filtered = filtered.filter(report => report.type === selectedType);
    }

    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter(report => {
        const reportDate = new Date(report.createdAt);
        return reportDate >= start;
      });
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(report => {
        const reportDate = new Date(report.createdAt);
        return reportDate <= end;
      });
    }

    setFilteredReports(filtered);
  }, [selectedType, startDate, endDate, reports]);

  // Calculate distance between coordinates (Haversine formula)
  const getDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  /**
   * Calculate hotspots (grouped by proximity)
   * Hotspots are automatically recalculated when filteredReports changes.
   */
  const calculateHotspots = useCallback(() => {
    const hotspots = [];
    const processed = new Set();
    
    filteredReports.forEach((report, index) => {
      if (processed.has(index)) return;
      
      const nearby = [report];
      filteredReports.forEach((other, otherIndex) => {
        if (index === otherIndex || processed.has(otherIndex)) return;
        
        const distance = getDistance(
          report.lat, report.lng,
          other.lat, other.lng
        );
        
        if (distance < 0.5) { // ~500 meters
          nearby.push(other);
          processed.add(otherIndex);
        }
      });
      
      if (nearby.length > 0) {
        processed.add(index);
        const centerLat = nearby.reduce((sum, r) => sum + r.lat, 0) / nearby.length;
        const centerLng = nearby.reduce((sum, r) => sum + r.lng, 0) / nearby.length;
        
        hotspots.push({
          id: `hotspot_${index}`,
          lat: centerLat,
          lng: centerLng,
          count: nearby.length,
          reports: nearby,
          dangerLevel: getDangerLevel(nearby.length)
        });
      }
    });
    
    return hotspots;
  }, [filteredReports, getDistance]);

  const hotspots = calculateHotspots();

  /**
   * Update heatmap layer when reports change
   */
  useEffect(() => {
    if (!map.current || filteredReports.length === 0) return;

    // Wait for map to be fully loaded
    if (!map.current.loaded()) {
      map.current.on('load', () => {
        updateHeatmap();
      });
    } else {
      updateHeatmap();
    }

    function updateHeatmap() {
      // Remove existing heatmap source and layer
      if (heatmapLayerRef.current && map.current.getLayer('heatmap-layer')) {
        map.current.removeLayer('heatmap-layer');
      }
      if (heatmapSourceRef.current && map.current.getSource('heatmap-source')) {
        map.current.removeSource('heatmap-source');
      }

      // Create GeoJSON for heatmap
      const heatmapData = {
        type: 'FeatureCollection',
        features: filteredReports.map(report => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [report.lng, report.lat]
          },
          properties: {
            intensity: 1,
            weight: 1
          }
        }))
      };

      // Add heatmap source
      map.current.addSource('heatmap-source', {
        type: 'geojson',
        data: heatmapData
      });

      // Add heatmap layer
      map.current.addLayer({
        id: 'heatmap-layer',
        type: 'heatmap',
        source: 'heatmap-source',
        maxzoom: 15,
        paint: {
          'heatmap-weight': {
            property: 'weight',
            type: 'identity'
          },
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0.3,
            9, 0.7,
            15, 1
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(16, 185, 129, 0)',      // Green - low density
            0.2, 'rgba(16, 185, 129, 0.3)', // Green - low density
            0.4, 'rgba(251, 191, 36, 0.5)', // Yellow - medium density
            0.6, 'rgba(249, 115, 22, 0.7)', // Orange - high density
            0.8, 'rgba(220, 38, 38, 0.9)',  // Red - very high density
            1, 'rgba(153, 27, 27, 1)'       // Dark red - critical density
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 20,
            9, 30,
            15, 50
          ],
          'heatmap-opacity': 0.7
        }
      });

      heatmapSourceRef.current = 'heatmap-source';
      heatmapLayerRef.current = 'heatmap-layer';
    }
  }, [filteredReports]);

  /**
   * Show popup with crime details
   */
  const showPopup = useCallback((report, lng, lat) => {
    if (!map.current) return;

    // Remove existing popup
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }

    const isHotspot = report.count !== undefined;
    let content = '';

    if (isHotspot) {
      const danger = dangerLevels[report.dangerLevel];
      content = `
        <div class="crime-popup-content">
          <div class="popup-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${danger.color}" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 8px;">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <h3 style="margin: 0; display: inline-block; color: #1D3557; font-size: 1.125rem;">Hotspot Area</h3>
          </div>
          <p style="margin: 0.5rem 0; font-weight: 600; color: #2B2D42;">Danger Level: <strong>${report.dangerLevel.toUpperCase()}</strong></p>
          <p style="margin: 0.5rem 0; color: #666; font-size: 0.875rem;">${report.count} reports in this area</p>
          <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(29, 53, 87, 0.1);">
            ${report.reports.slice(0, 3).map((r, idx) => `
              <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; font-size: 0.875rem;">
                <span style="font-weight: 600; color: #2B2D42;">${r.type}</span>
                <span style="color: #999; font-size: 0.75rem;">${formatDate(r.createdAt)}</span>
              </div>
            `).join('')}
            ${report.reports.length > 3 ? `<p style="font-size: 0.75rem; color: #999; font-style: italic; margin-top: 0.5rem;">+${report.reports.length - 3} more reports</p>` : ''}
          </div>
        </div>
      `;
    } else {
      const color = crimeTypeColors[report.type] || crimeTypeColors.Other;
      content = `
        <div class="crime-popup-content">
          <div class="popup-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 8px;">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <h3 style="margin: 0; display: inline-block; color: #1D3557; font-size: 1.125rem;">${report.title}</h3>
          </div>
          <p style="margin: 0.5rem 0; font-weight: 600; color: #2B2D42;">${report.type}</p>
          <p style="margin: 0.25rem 0; color: #666; font-size: 0.875rem; display: flex; align-items: center;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            ${report.location}
          </p>
          <p style="margin: 0.25rem 0; color: #666; font-size: 0.875rem; display: flex; align-items: center;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            ${formatDate(report.createdAt)}
          </p>
          ${report.description ? `<p style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(29, 53, 87, 0.1); color: #2B2D42; font-size: 0.875rem; line-height: 1.5;">${report.description}</p>` : ''}
          <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(29, 53, 87, 0.1); font-size: 0.875rem; display: flex; align-items: center; gap: 0.5rem;">
            <span>Status:</span>
            <span style="display: inline-flex; align-items: center; gap: 0.25rem; color: ${report.verified ? '#10B981' : '#9CA3AF'}; font-weight: 600;">
              ${report.verified 
                ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg> Verified'
                : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg> Unverified'}
            </span>
          </div>
        </div>
      `;
    }

    // Create popup
    popupRef.current = new maplibregl.Popup({ closeOnClick: false, closeButton: true })
      .setLngLat([lng, lat])
      .setHTML(content)
      .addTo(map.current);
  }, []);

  /**
   * Update hotspot markers
   */
  useEffect(() => {
    if (!map.current || !map.current.loaded()) return;

    // Remove existing hotspot markers
    hotspotMarkersRef.current.forEach(marker => marker.remove());
    hotspotMarkersRef.current = [];

    // Add hotspot markers
    hotspots.forEach((hotspot) => {
      const danger = dangerLevels[hotspot.dangerLevel];
      
      // Create marker element with smooth animation
      const el = document.createElement('div');
      el.className = 'hotspot-marker';
      el.style.cssText = `
        width: ${Math.min(80, 25 + hotspot.count * 6)}px;
        height: ${Math.min(80, 25 + hotspot.count * 6)}px;
        border-radius: 50%;
        background-color: ${danger.color};
        opacity: ${danger.intensity};
        border: 3px solid ${danger.color};
        box-shadow: 0 0 20px ${danger.color}80;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 700;
        font-size: 0.875rem;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        animation: hotspot-pulse 2s ease-in-out infinite, hotspot-appear 0.6s ease-out;
      `;
      el.textContent = hotspot.count;

      // Add hover effects with smooth transitions
      el.addEventListener('mouseenter', () => {
        setHoveredReport(hotspot.id);
        el.style.transform = 'scale(1.2) translateY(-4px)';
        el.style.opacity = Math.min(1, danger.intensity + 0.2);
        el.style.boxShadow = `0 0 40px ${danger.color}FF`;
        el.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      });
      el.addEventListener('mouseleave', () => {
        setHoveredReport(null);
        el.style.transform = 'scale(1) translateY(0)';
        el.style.opacity = danger.intensity;
        el.style.boxShadow = `0 0 20px ${danger.color}80`;
        el.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      });

      // Create marker
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([hotspot.lng, hotspot.lat])
        .addTo(map.current);

      // Add click handler
      el.addEventListener('click', () => {
        setSelectedReport(hotspot);
        showPopup(hotspot, hotspot.lng, hotspot.lat);
      });

      hotspotMarkersRef.current.push(marker);
    });
  }, [hotspots, showPopup]);

  /**
   * Add individual report pins with clustering support for large datasets
   * 
   * For datasets with > 100 reports, pins are only shown at zoom level 12+
   * to improve performance. Hotspots are always shown.
   */
  useEffect(() => {
    if (!map.current || !map.current.loaded()) return;

    // Remove existing report markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    // Clustering: Only show individual pins at higher zoom levels for large datasets
    const currentZoom = map.current.getZoom();
    const shouldShowPins = filteredReports.length <= 100 || currentZoom >= 12;
    
    if (!shouldShowPins) {
      // At low zoom with many reports, only show hotspots
      return;
    }

    // Add individual report pins
    filteredReports.forEach((report) => {
      const color = crimeTypeColors[report.type] || crimeTypeColors.Other;
      const isVerified = report.verified;
      
      // Create pin element with verified/unverified differentiation
      const el = document.createElement('div');
      el.className = `report-pin ${isVerified ? 'verified' : 'unverified'}`;
      
      // Verified pins have checkmark, unverified have exclamation
      const iconContent = isVerified 
        ? `<path fill="white" d="M16 12l-4-4-2 2 6 6 8-8-2-2z"/><circle fill="white" cx="16" cy="16" r="6"/>`
        : `<path fill="white" d="M16 10v6M16 20h.01"/><circle fill="white" cx="16" cy="16" r="6"/>`;
      
      // Verified pins have green border, unverified have gray border
      const borderColor = isVerified ? '#10B981' : '#9CA3AF';
      const borderWidth = isVerified ? 3 : 2;
      
      el.innerHTML = `
        <svg width="32" height="48" viewBox="0 0 32 48" style="cursor: pointer; transition: all 0.3s ease; filter: ${isVerified ? 'drop-shadow(0 2px 8px rgba(16, 185, 129, 0.4))' : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'};">
          <path fill="${color}" stroke="${borderColor}" stroke-width="${borderWidth}" d="M16 0C7.163 0 0 7.163 0 16c0 16 16 32 16 32s16-16 16-32C32 7.163 24.837 0 16 0z"/>
          ${iconContent}
        </svg>
      `;
      el.style.cssText = 'cursor: pointer; transition: all 0.3s ease; animation: pin-appear 0.5s ease-out;';

      // Add hover effects with smooth transitions
      el.addEventListener('mouseenter', () => {
        setHoveredReport(report.id);
        el.style.transform = 'scale(1.3) translateY(-4px)';
        el.style.filter = isVerified 
          ? 'brightness(1.3) drop-shadow(0 6px 16px rgba(16, 185, 129, 0.6))'
          : 'brightness(1.3) drop-shadow(0 6px 16px rgba(0,0,0,0.5))';
        el.style.opacity = '1';
        el.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      });
      el.addEventListener('mouseleave', () => {
        setHoveredReport(null);
        el.style.transform = 'scale(1) translateY(0)';
        el.style.filter = isVerified 
          ? 'drop-shadow(0 2px 8px rgba(16, 185, 129, 0.4))'
          : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))';
        el.style.opacity = '0.9';
        el.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      });

      // Create marker
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([report.lng, report.lat])
        .addTo(map.current);

      // Add click handler
      el.addEventListener('click', () => {
        setSelectedReport(report);
        showPopup(report, report.lng, report.lat);
      });

      markersRef.current.push(marker);
    });
  }, [filteredReports, showPopup]);

  // Update pins when zoom changes (for clustering)
  useEffect(() => {
    if (!map.current) return;
    
    const handleZoom = () => {
      // Trigger re-render of pins when zoom changes
      const currentZoom = map.current.getZoom();
      const shouldShowPins = filteredReports.length <= 100 || currentZoom >= 12;
      
      // Force update by toggling a state or re-adding markers
      if (shouldShowPins && markersRef.current.length === 0) {
        // Re-add markers if zoomed in enough
        const event = new Event('zoomend');
        map.current.fire('zoomend');
      }
    };
    
    map.current.on('zoomend', handleZoom);
    
    return () => {
      if (map.current) {
        map.current.off('zoomend', handleZoom);
      }
    };
  }, [filteredReports]);

  // Handle location search with Nominatim
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'SafeMzansi/1.0'
          }
        }
      )
        .then(response => response.json())
        .then(data => {
          setSearchResults(data.map(item => ({
            name: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon)
          })));
        })
        .catch(error => {
          console.error('Error searching location:', error);
        });
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Center map on selected location
  const centerOnLocation = (lat, lng) => {
    if (map.current) {
      map.current.flyTo({
        center: [lng, lat],
        zoom: 15
      });
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  // Center on user's current location
  const centerOnUser = () => {
    if (navigator.geolocation && map.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = [position.coords.longitude, position.coords.latitude];
          map.current.flyTo({
            center: location,
            zoom: 15
          });
          setLocationError(false);
          toast.success('Centered on your location');
        },
        (error) => {
          setLocationError(true);
          toast.error('Unable to access your location');
        }
      );
    } else {
      toast.error('Geolocation not supported');
    }
  };

  // Get unique crime types for filter
  const uniqueTypes = [...new Set(reports.map(r => r.type))].sort();

  return (
    <div className="map-page">
      <div className="map-container">
        <div ref={mapContainer} className="map-container-inner" />
        
        {loading && (
          <div className="map-loading">
            <div className="loading-spinner"></div>
            <p>Loading map and crime reports...</p>
          </div>
        )}

        {/* Location error message */}
        {locationError && (
          <div className="map-location-error">
            <p>Unable to access your location</p>
          </div>
        )}

        {/* Search Bar */}
        <div className="map-search-bar glassy-overlay">
          <div className="search-input-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location..."
              className="search-input"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="search-clear"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((result, idx) => (
                <div
                  key={idx}
                  className="search-result-item"
                  onClick={() => centerOnLocation(result.lat, result.lng)}
                >
                  <MapPin className="w-4 h-4" />
                  <span>{result.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filter Panel */}
        <div className={`map-filter-panel glassy-overlay ${showFilters ? 'active' : ''}`}>
          <div className="filter-header">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="filter-toggle"
            >
              <Filter className="filter-icon" />
              <span>Filters</span>
            </button>
          </div>

          {showFilters && (
            <div className="filter-content">
              <div className="filter-group">
                <label className="filter-label">Crime Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Types</option>
                  {uniqueTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Date Range</label>
                <div className="date-inputs">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="filter-input"
                    placeholder="Start Date"
                  />
                  <span className="date-separator">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="filter-input"
                    placeholder="End Date"
                  />
                </div>
              </div>

              <div className="filter-stats">
                <p className="filter-stat-text">
                  Showing <strong>{filteredReports.length}</strong> of <strong>{reports.length}</strong> reports
                </p>
              </div>

              {(selectedType || startDate || endDate) && (
                <button
                  onClick={() => {
                    setSelectedType('');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="filter-clear-btn"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="map-legend glassy-overlay">
          <div className="legend-header">
            <Info className="legend-icon" />
            <h4>Danger Levels</h4>
          </div>
          <div className="legend-items">
            {Object.entries(dangerLevels).map(([level, config]) => (
              <div key={level} className="legend-item">
                <div
                  className="legend-color"
                  style={{
                    backgroundColor: config.color,
                    opacity: config.intensity
                  }}
                />
                <span className="legend-label">{level.charAt(0).toUpperCase() + level.slice(1)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Center on User Button */}
        <button
          onClick={centerOnUser}
          className="center-user-btn glassy-overlay"
          title="Center on my location"
        >
          <Navigation className="w-5 h-5" />
        </button>

        {/* Place Pin Button */}
        <button
          onClick={() => {
            setIsPlacingPin(!isPlacingPin);
            if (isPlacingPin) {
              if (manualPinMarker.current) {
                manualPinMarker.current.remove();
                manualPinMarker.current = null;
              }
              setManualPinLocation(null);
              toast.info('Pin placement cancelled');
            } else {
              toast.info('Click on the map to place a pin for reporting');
            }
          }}
          className={`place-pin-btn glassy-overlay ${isPlacingPin ? 'active' : ''}`}
          title="Place pin on map to report crime"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Manual Pin Location Info */}
        {manualPinLocation && (
          <div className="manual-pin-info glassy-overlay">
            <p className="manual-pin-text">
              <MapPin className="w-4 h-4" />
              Location selected: {manualPinLocation.lat.toFixed(6)}, {manualPinLocation.lng.toFixed(6)}
            </p>
            <button
              onClick={() => {
                if (manualPinMarker.current) {
                  manualPinMarker.current.remove();
                  manualPinMarker.current = null;
                }
                setManualPinLocation(null);
                setIsPlacingPin(false);
              }}
              className="manual-pin-clear"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SafeMzansiMap;
