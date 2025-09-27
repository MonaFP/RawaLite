import {createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { AppError, getUserFriendlyMessage } from '../lib/errors';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (type: NotificationType, message: string, duration?: number) => void;
  showError: (error: AppError | string) => void;
  showSuccess: (message: string) => void;
  showInfo: (message: string) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const showNotification = useCallback((
    type: NotificationType,
    message: string,
    duration: number = 5000
  ) => {
    const id = Date.now().toString();
    const notification: Notification = { id, type, message, duration };
    
    setNotifications(prev => [...prev, notification]);

    if (duration > 0) {
      setTimeout(() => removeNotification(id), duration);
    }
  }, [removeNotification]);

  const showError = useCallback((error: AppError | string) => {
    const message = typeof error === 'string' ? error : getUserFriendlyMessage(error);
    showNotification('error', message);
  }, [showNotification]);

  const showSuccess = useCallback((message: string) => {
    showNotification('success', message);
  }, [showNotification]);

  const showInfo = useCallback((message: string) => {
    showNotification('info', message);
  }, [showNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
        showError,
        showSuccess,
        showInfo,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Notification Toast Component
export function NotificationToast({ notification, onRemove }: {
  notification: Notification;
  onRemove: (id: string) => void;
}) {
  return (
    <div className={`notification-toast notification-${notification.type}`}>
      <div className="notification-content">
        <span className="notification-message">{notification.message}</span>
        <button 
          className="notification-close"
          onClick={() => onRemove(notification.id)}
          aria-label="Schließen"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// Notification Container Component
export function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
        />
      ))}
    </div>
  );
}

