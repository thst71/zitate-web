import { useState, useEffect } from 'react';
import './OfflineIndicator.css';

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="offline-indicator" role="alert" aria-live="polite">
      <div className="offline-indicator-content">
        <span className="offline-icon">📵</span>
        <span className="offline-text">You're offline. Changes will sync when reconnected.</span>
      </div>
    </div>
  );
};
