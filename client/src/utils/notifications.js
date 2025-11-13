/**
 * Browser Notification Utility
 * Handles requesting permission and showing browser notifications
 */

/**
 * Request notification permission from the user
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

/**
 * Show a browser notification
 * @param {string} title - Notification title
 * @param {object} options - Notification options
 */
export const showNotification = (title, options = {}) => {
  if (!('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'safemzansi-report', // Replace previous notifications with same tag
      requireInteraction: false,
      silent: false,
      ...options
    });

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    // Handle click to focus window and navigate to notifications
    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();
      notification.close();
      
      // Navigate to notifications page if available
      if (window.location.pathname !== '/notifications') {
        window.location.href = '/notifications';
      }
    };

    return notification;
  }
};

/**
 * Show notification for new crime report
 * @param {object} report - Report object with type, location, etc.
 */
export const notifyNewReport = (report) => {
  const title = `🚨 New ${report.type || 'Crime'} Report`;
  const body = `${report.location || 'Unknown Location'}\n${report.description || ''}`;
  
  showNotification(title, {
    body: body.length > 100 ? body.substring(0, 100) + '...' : body,
    data: {
      reportId: report.id,
      type: 'new_report'
    }
  });
};

/**
 * Check if notifications are supported and enabled
 */
export const isNotificationSupported = () => {
  return 'Notification' in window;
};

/**
 * Check if notifications are permitted
 */
export const isNotificationPermitted = () => {
  return Notification.permission === 'granted';
};

