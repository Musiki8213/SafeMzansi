import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MapPin, Clock, Map, AlertCircle } from 'lucide-react';
import { notificationsAPI } from '../utils/api';

// Helper function to format time since
const getTimeSince = (timestamp) => {
  const now = new Date();
  const then = new Date(timestamp);
  const diffInSeconds = Math.floor((now - then) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} min ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
};

function ReportNotificationPopup({ notification, onClose, onViewOnMap }) {
  const navigate = useNavigate();

  const markAsRead = async () => {
    const notifId = notification.id || notification._id;
    if (notifId) {
      try {
        await notificationsAPI.markAsRead(notifId);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const handleViewOnMap = async () => {
    await markAsRead();
    if (onViewOnMap) {
      onViewOnMap(notification.lat, notification.lng);
    } else {
      navigate(`/map?lat=${notification.lat}&lng=${notification.lng}`);
    }
    onClose();
  };

  const handleViewAlerts = async () => {
    await markAsRead();
    navigate('/alerts');
    onClose();
  };

  const handleClose = async () => {
    await markAsRead();
    onClose();
  };

  if (!notification) {
    console.warn('ReportNotificationPopup: No notification provided');
    return null;
  }

  console.log('ReportNotificationPopup rendering with:', notification);

  return (
    <div 
      className="report-notification-popup"
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 99999,
        minWidth: '320px',
        maxWidth: '400px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        border: '2px solid #DC2626',
        animation: 'slideInRight 0.3s ease-out',
        overflow: 'hidden',
        pointerEvents: 'auto'
      }}
    >
      {/* Header */}
      <div style={{
        backgroundColor: '#DC2626',
        color: 'white',
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle className="w-5 h-5" />
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>
            New Crime Report
          </h3>
        </div>
        <button
          onClick={handleClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '4px',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
          onMouseLeave={(e) => e.target.style.background = 'transparent'}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '1.25rem' }}>
        {/* Crime Type */}
        <div style={{ marginBottom: '1rem' }}>
          <span style={{
            display: 'inline-block',
            padding: '0.375rem 0.75rem',
            backgroundColor: '#DC2626',
            color: 'white',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: '600'
          }}>
            {notification.type}
          </span>
        </div>

        {/* Location */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          marginBottom: '0.75rem',
          color: '#374151',
          fontSize: '0.9375rem'
        }}>
          <MapPin className="w-4 h-4" style={{ color: '#6B7280', flexShrink: 0 }} />
          <span style={{ fontWeight: '500' }}>{notification.location}</span>
        </div>

        {/* Time */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          marginBottom: '1rem',
          color: '#6B7280',
          fontSize: '0.875rem'
        }}>
          <Clock className="w-4 h-4" style={{ flexShrink: 0 }} />
          <span>{getTimeSince(notification.createdAt || notification.timestamp)}</span>
        </div>

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem',
          flexDirection: 'column'
        }}>
          <button
            onClick={handleViewOnMap}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#DC2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9375rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#B91C1C'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#DC2626'}
          >
            <Map className="w-4 h-4" />
            View on Map
          </button>
          <button
            onClick={handleViewAlerts}
            style={{
              width: '100%',
              padding: '0.625rem',
              backgroundColor: 'transparent',
              color: '#DC2626',
              border: '1px solid #DC2626',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#FEE2E2'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            View in Alerts
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default ReportNotificationPopup;

