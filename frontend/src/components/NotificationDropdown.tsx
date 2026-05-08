import { Bell, Check, Clock, X, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/LanguageContext";

export interface Notification {
  id: string;
  title: string;
  message: string;
  time?: string;
  createdAt?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
}

interface NotificationDropdownProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

export default function NotificationDropdown({ 
  notifications, 
  onMarkAsRead, 
  onMarkAllAsRead,
  onClearAll
}: NotificationDropdownProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTimeAgo = (date?: string) => {
    if (!date) return '';
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return t('notifications.justNow');
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return t('notifications.minutesAgo', { count: diffInMinutes });
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return t('notifications.hoursAgo', { count: diffInHours });
    const diffInDays = Math.floor(diffInHours / 24);
    return t('notifications.daysAgo', { count: diffInDays });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <Check className="text-primary" size={16} />;
      case 'warning': return <AlertCircle className="text-amber-500" size={16} />;
      case 'error': return <X className="text-red-500" size={16} />;
      default: return <Info className="text-blue-500" size={16} />;
    }
  };

  const getTypeBg = (type: Notification['type']) => {
    switch (type) {
      case 'success': return "bg-primary/10";
      case 'warning': return "bg-amber-500/10";
      case 'error': return "bg-destructive/10";
      default: return "bg-blue-500/10";
    }
  };

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={cn(
          "p-2 sm:p-2.5 rounded-full transition-all relative border border-transparent",
          isOpen 
            ? "bg-muted text-foreground border-border" 
            : "text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border"
        )}
      >
        <Bell size={18} className="sm:w-5 sm:h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-background" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-card rounded-3xl shadow-2xl border border-border overflow-hidden z-50"
          >
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/50">
              <div>
                <h3 className="font-display font-bold text-foreground">{t('notifications.title')}</h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                  {t('notifications.unreadCount', { count: unreadCount })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={onMarkAllAsRead}
                  className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline"
                >
                  {t('notifications.markAllRead')}
                </button>
                <button 
                  onClick={onClearAll}
                  className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
                  title={t('notifications.clearAll')}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length > 0 ? (
                <div className="divide-y divide-border">
                  {notifications.map((notification, idx) => (
                    <div 
                      key={`notif-${notification.id}-${idx}`}
                      onClick={() => onMarkAsRead(notification.id)}
                      className={cn(
                        "p-4 flex gap-4 hover:bg-muted/50 transition-colors cursor-pointer relative group",
                        !notification.read && "bg-primary/5"
                      )}
                    >
                      {!notification.read && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                      )}
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", getTypeBg(notification.type))}>
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={cn("text-sm font-bold truncate", notification.read ? "text-muted-foreground" : "text-foreground")}>
                            {notification.title}
                          </h4>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1">
                            <Clock size={10} />
                            {notification.createdAt ? formatTimeAgo(notification.createdAt) : notification.time}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-muted-foreground/30 mb-4">
                    <Bell size={32} />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">{t('notifications.noNotifications')}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">{t('notifications.noNotificationsDesc')}</p>
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-4 border-t border-border bg-muted/20">
                <button className="w-full py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
                  {t('notifications.viewAll')}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
