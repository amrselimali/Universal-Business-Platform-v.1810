import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  traceId?: string;
}

interface NotificationContextType {
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string, traceId?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = useCallback((item: Omit<NotificationItem, 'id'>) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setNotifications((prev) => [...prev, { ...item, id }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 6000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showSuccess = (title: string, message?: string) => addNotification({ type: 'success', title, message });
  const showError = (title: string, message?: string, traceId?: string) =>
    addNotification({ type: 'error', title, message, traceId });
  const showWarning = (title: string, message?: string) => addNotification({ type: 'warning', title, message });
  const showInfo = (title: string, message?: string) => addNotification({ type: 'info', title, message });

  return (
    <NotificationContext.Provider
      value={{ showSuccess, showError, showWarning, showInfo, removeNotification }}
    >
      {children}
      <div className="fixed bottom-4 end-4 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${
              n.type === 'success'
                ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900'
                : n.type === 'error'
                ? 'bg-rose-50/95 border-rose-200 text-rose-900'
                : n.type === 'warning'
                ? 'bg-amber-50/95 border-amber-200 text-amber-900'
                : 'bg-blue-50/95 border-blue-200 text-blue-900'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {n.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {n.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600" />}
              {n.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
              {n.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
            </div>
            <div className="flex-1 text-sm">
              <h4 className="font-semibold">{n.title}</h4>
              {n.message && <p className="mt-1 text-xs opacity-90 leading-relaxed">{n.message}</p>}
              {n.traceId && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-100/80 text-[11px] font-mono text-rose-800">
                  <span>رقم التتبع / Trace ID:</span>
                  <span className="font-bold select-all">{n.traceId}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => removeNotification(n.id)}
              className="shrink-0 text-gray-400 hover:text-gray-600 p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within a NotificationProvider');
  return context;
};
