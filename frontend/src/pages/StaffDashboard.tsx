import { useState, type ReactNode, useRef, useEffect } from "react";
import { Search, Plus, Filter, MoreVertical, Bell, Check, X, Clock, Play, Printer, User, Coffee, Utensils, AlertCircle, LogOut, Settings, Loader2, Box } from "lucide-react";
import { printReceipt } from "@/lib/printReceipt";
import { cn } from "@/lib/utils";
import { Order } from "@/types";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useAuth } from "@/AuthContext";
import { useLanguage } from "@/LanguageContext";
import { useTheme } from "@/ThemeContext";
import { useLocation } from "@/LocationContext";
import { Moon, Sun, MapPin, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Globe } from "lucide-react";
import api from "@/services/api";
import * as notificationService from "@/services/notificationService";
import NotificationDropdown, { Notification } from "@/components/NotificationDropdown";
import SupportModal from "@/components/SupportModal";

export default function StaffDashboard() {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { currentLocation, locations, setCurrentLocation } = useLocation();
  const { themes, setTheme } = useTheme();
  const theme = themes['staff'];
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'redemptions'>('orders');
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'time' | 'priority'>('priority');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    try {
      const locationId = currentLocation?.id || currentLocation?._id;
      const data = await notificationService.getNotifications(locationId);
      setNotifications(data);
    } catch (error: any) {
      console.error("Failed to fetch notifications:", error);
      if (error.response?.status !== 403) {
        // notificationService might not throw with axios but worth a check
      }
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      toast.error(t('notification.markReadError'));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      toast.error(t('notification.markAllReadError'));
    }
  };

  const handleClearAll = async () => {
    try {
      await notificationService.clearNotifications();
      setNotifications([]);
    } catch (error) {
      toast.error(t('notification.clearError'));
    }
  };

  const fetchOrders = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const params = currentLocation ? { locationId: currentLocation.id || currentLocation._id } : {};
      const response = await api.get("/orders", { params });
      setOrders(response.data);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      if (error.response?.status !== 403) {
        toast.error(t('staff.orderUpdateError'));
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchRedemptions = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const params = currentLocation ? { locationId: currentLocation.id || currentLocation._id } : {};
      const response = await api.get("/redemptions", { params });
      setRedemptions(response.data);
    } catch (error: any) {
      console.error("Error fetching redemptions:", error);
      if (error.response?.status !== 403) {
        toast.error(t('staff.redemptionUpdateError'));
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const isStaffRole = user && ['manager', 'cashier', 'barista'].includes(user.role);
  const employeePermissions = user?.permissions || {};
  
  // If specific permission is explicitly false, or if it's missing and user is not a staff role
  const canManageOrders = user?.role === 'admin' || 
    (employeePermissions.manageOrders !== undefined 
      ? employeePermissions.manageOrders 
      : isStaffRole);

  useEffect(() => {
    if (!canManageOrders) {
      setLoading(false);
      return;
    }

    fetchOrders(true);
    fetchRedemptions();
    fetchNotifications();
    
    // Polling every 5 seconds for staff
    const interval = setInterval(() => {
      fetchOrders();
      fetchRedemptions();
      fetchNotifications();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentLocation, canManageOrders]);

  // Check if they have any administrative permissions even if they can't manage orders
  const hasOtherAdminPerms = Object.entries(employeePermissions).some(([key, val]) => 
    key !== 'manageOrders' && val === true
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOrders = orders
    .filter(order => {
      const matchesStatus = filter === 'All' ? order.status !== 'Completed' : order.status === filter;
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        order.customerName?.toLowerCase().includes(searchLower) ||
        order.orderNumber?.toLowerCase().includes(searchLower) ||
        order.table?.toLowerCase().includes(searchLower) ||
        order.items.some(item => (item.name || item.menuItem?.name || '').toLowerCase().includes(searchLower));
      
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityMap = { 'Urgent': 0, 'High': 1, 'Normal': 2 };
        const aPriority = priorityMap[a.priority as keyof typeof priorityMap] ?? 2;
        const bPriority = priorityMap[b.priority as keyof typeof priorityMap] ?? 2;
        return aPriority - bPriority;
      }
      return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
    });

  const updateOrderStatus = async (id: string, newStatus: Order['status']) => {
    try {
      const response = await api.put(`/orders/${id}/status`, { status: newStatus });
      setOrders(prev => prev.map(o => (o.id === id || (o as any)._id === id) ? response.data : o));
      toast.success(t('staff.orderUpdateSuccess', { status: newStatus }));
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('staff.orderUpdateError'));
    }
  };

  const updatePaymentStatus = async (id: string, newStatus: Order['paymentStatus']) => {
    try {
      const response = await api.put(`/orders/${id}/payment`, { paymentStatus: newStatus });
      setOrders(prev => prev.map(o => (o.id === id || (o as any)._id === id) ? response.data : o));
      toast.success(t('staff.paymentUpdateSuccess', { status: newStatus }));
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('staff.paymentUpdateError'));
    }
  };

  const updateRedemptionStatus = async (id: string, newStatus: string) => {
    try {
      const response = await api.put(`/redemptions/${id}`, { status: newStatus });
      setRedemptions(prev => prev.map(r => (r.id === id || (r as any)._id === id) ? response.data : r));
      toast.success(t('staff.redemptionUpdateSuccess', { status: newStatus }));
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('staff.redemptionUpdateError'));
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden transition-colors duration-300">
      <header className="bg-card border-b border-border px-4 sm:px-8 py-4 flex items-center justify-between transition-colors duration-300 z-40 relative">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center overflow-hidden">
            <img src="/cafedev_logo.png" alt="Logo" className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg sm:text-xl tracking-tight text-foreground">{t('common.appName')} {t('staff.staffUser')}</h1>
            <p className="text-[8px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{t('staff.realTimeQueue')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-6">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-muted text-primary rounded-full text-xs font-bold uppercase tracking-widest">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            {t('staff.liveFeedActive')}
          </div>
          <div className="flex items-center gap-1 sm:gap-4">
            <button 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light', 'staff')}
              className="p-2 sm:p-2.5 hover:bg-muted rounded-full transition-colors flex items-center gap-2 text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
              title={theme === 'light' ? t('staff.switchToDark') : t('staff.switchToLight')}
            >
              {theme === 'light' ? <Moon size={18} className="sm:w-5 sm:h-5" /> : <Sun size={18} className="sm:w-5 sm:h-5" />}
            </button>
            <button 
              onClick={() => setLanguage(language === 'en' ? 'km' : 'en')}
              className="p-2 sm:p-2.5 hover:bg-muted rounded-full transition-colors flex items-center gap-2 text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
              title={language === 'en' ? t('staff.switchToKhmer') : t('staff.switchToEnglish')}
            >
              <Globe size={18} className="sm:w-5 sm:h-5" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider hidden xs:inline">
                {language === 'en' ? 'EN' : 'KM'}
              </span>
            </button>
            <NotificationDropdown 
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onClearAll={handleClearAll}
            />

            {/* Location Switcher */}
            <div className="hidden sm:flex items-center gap-2 bg-muted p-1 rounded-xl border border-border shadow-sm">
              <MapPin size={16} className="ml-3 text-primary" />
              <select 
                value={currentLocation?.id || currentLocation?._id || ''}
                onChange={(e) => {
                  const loc = locations.find(l => (l.id || l._id) === e.target.value);
                  setCurrentLocation(loc || null);
                }}
                className="bg-transparent border-none text-xs font-bold text-foreground focus:ring-0 pr-8"
              >
                <option value="">{t('admin.allLocations')}</option>
                {locations.map((loc, idx) => (
                  <option key={loc.id || loc._id || `loc-opt-${idx}`} value={loc.id || loc._id}>{loc.name}</option>
                ))}
              </select>
            </div>

            <div className="relative" ref={profileRef}>
              <div 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted overflow-hidden border-2 border-card shadow-sm cursor-pointer hover:ring-2 hover:ring-primary transition-all"
              >
                <img src={user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Staff'}`} alt={t('staff.staffUser')} referrerPolicy="no-referrer" />
              </div>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-card rounded-xl shadow-xl border border-border overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-border bg-muted/50">
                      <p className="text-sm font-bold text-foreground">{user?.name || t('staff.staffUser')}</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest capitalize">{user?.role || t('staff.staffMember')}</p>
                    </div>
                    <div className="p-2">
                      <button 
                        onClick={() => { navigate('/profile'); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted rounded-xl transition-colors"
                      >
                        <User size={16} />
                        {t('admin.myProfile')}
                      </button>
                      {(user?.role === 'admin' || user?.role === 'manager' || user?.permissions?.manageInventory) && (
                        <button 
                          onClick={() => { navigate('/admin/inventory'); setIsProfileOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted rounded-xl transition-colors"
                        >
                          <Box size={16} />
                          {t('staff.inventoryManagement')}
                        </button>
                      )}
                      <button 
                        onClick={() => { navigate('/admin/settings'); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted rounded-xl transition-colors"
                      >
                        <Settings size={16} />
                        {t('auth.settings')}
                      </button>
                      <button 
                        onClick={() => { setIsSupportOpen(true); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted rounded-xl transition-colors"
                      >
                        <MessageSquare size={16} />
                        {t('auth.support')}
                      </button>
                      <div className="h-px bg-border my-1" />
                      <button 
                        onClick={() => { logout(); setIsProfileOpen(false); toast.success(t('staff.logoutSuccess')); navigate('/login'); }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                      >
                        <LogOut size={16} />
                        {t('auth.logout')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center">
            <Loader2 size={48} className="text-primary animate-spin mb-4" />
            <p className="text-muted-foreground font-medium">{t('staff.loadingOrders')}</p>
          </div>
        ) : !canManageOrders ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-destructive/10 rounded-3xl flex items-center justify-center text-destructive mb-6">
              <AlertCircle size={40} />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2 text-foreground">{t('staff.accessDenied')}</h2>
            <p className="text-muted-foreground max-w-md">
              {t('staff.accessDeniedDesc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              {hasOtherAdminPerms && (
                <button 
                  onClick={() => navigate('/admin')}
                  className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                  {t('admin.dashboard')}
                </button>
              )}
              <button 
                onClick={() => navigate('/profile')}
                className={cn(
                  "px-8 py-4 rounded-2xl font-bold transition-all",
                  hasOtherAdminPerms ? "bg-muted text-foreground hover:bg-muted/80" : "bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20"
                )}
              >
                {t('staff.goToProfile')}
              </button>
              <button 
                onClick={() => {
                  logout();
                  navigate('/login');
                  toast.success(t('staff.logoutSuccess'));
                }}
                className="px-8 py-4 bg-destructive/10 text-destructive rounded-2xl font-bold hover:bg-destructive/20 transition-all"
              >
                {t('auth.logout')}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
              <SummaryCard title={t('staff.liveOrders')} value={orders.filter(o => o.status !== 'Completed').length.toString()} icon={<Utensils size={20} />} />
              <SummaryCard title={t('staff.avgPrepTime')} value="4m 12s" icon={<Clock size={20} />} />
              <SummaryCard title={t('staff.completedToday')} value={orders.filter(o => o.status === 'Completed').length.toString()} icon={<Check size={20} />} />
              <SummaryCard title={t('staff.urgentOrders')} value={orders.filter(o => o.priority === 'Urgent').length.toString()} icon={<AlertCircle size={20} />} isWarning />
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="relative w-full lg:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('staff.searchOrders')}
                    className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground placeholder-muted-foreground"
                  />
                </div>
                <div className="flex bg-card p-1 rounded-xl shadow-sm border border-border">
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={cn(
                      "px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                      activeTab === 'orders' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Utensils size={14} />
                    {t('staff.orders')}
                  </button>
                  <button
                    onClick={() => setActiveTab('redemptions')}
                    className={cn(
                      "px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                      activeTab === 'redemptions' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Coffee size={14} />
                    {t('staff.redemptions')}
                    {redemptions.filter(r => r.status === 'Pending').length > 0 && (
                      <span className="w-4 h-4 bg-destructive text-destructive-foreground text-[8px] flex items-center justify-center rounded-full">
                        {redemptions.filter(r => r.status === 'Pending').length}
                      </span>
                    )}
                  </button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {activeTab === 'orders' && (
                  <>
                    <div className="flex items-center gap-2 bg-card p-1 rounded-xl shadow-sm border border-border w-full sm:w-auto">
                      <button
                        onClick={() => setSortBy('priority')}
                        className={cn(
                          "flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all",
                          sortBy === 'priority' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {t('staff.priority')}
                      </button>
                      <button
                        onClick={() => setSortBy('time')}
                        className={cn(
                          "flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all",
                          sortBy === 'time' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {t('staff.time')}
                      </button>
                    </div>
                    <div className="flex overflow-x-auto no-scrollbar gap-2 w-full sm:w-auto pb-2 sm:pb-0">
                      {['All', 'Pending', 'Preparing', 'Ready', 'Completed'].map(f => (
                        <button
                          key={f}
                          onClick={() => {
                            setFilter(f);
                            toast.success(t('staff.filteredBy', { filter: f }));
                          }}
                          className={cn(
                            "flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all text-center whitespace-nowrap",
                            filter === f ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-card text-muted-foreground hover:bg-muted border border-border"
                          )}
                        >
                          {f === 'All' ? t('staff.allOrders') : t(`staff.${f.toLowerCase()}` as any)}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {activeTab === 'orders' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                  {filteredOrders.map((order, idx) => (
                    <OrderCard 
                      key={`order-${order.id || (order as any)._id || idx}-${idx}`} 
                      order={order} 
                      onUpdateStatus={(status) => updateOrderStatus(order.id || (order as any)._id, status)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                  {redemptions
                    .filter(r => {
                      const matchesStatus = r.status !== 'Claimed' || filter === 'All';
                      const searchLower = searchQuery.toLowerCase();
                      const matchesSearch = !searchQuery || 
                        r.userName?.toLowerCase().includes(searchLower) ||
                        r.rewardName?.toLowerCase().includes(searchLower);
                      return matchesStatus && matchesSearch;
                    })
                    .map((redemption, idx) => (
                    <RedemptionCard 
                      key={`redemption-${redemption.id || redemption._id || idx}-${idx}`} 
                      redemption={redemption} 
                      onUpdateStatus={(status) => updateRedemptionStatus(redemption.id || redemption._id, status)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>
      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
    </div>
  );

  function SummaryCard({ title, value, icon, isWarning }: { title: string, value: string, icon: ReactNode, isWarning?: boolean }) {
    return (
      <div className="bg-card p-4 rounded-xl shadow-sm flex items-center gap-4 group hover:shadow-xl transition-all duration-300 cursor-pointer border border-border">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform",
          isWarning ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
        )}>
          {icon}
        </div>
        <div>
          <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mb-0.5">{title}</p>
          <p className={cn("text-2xl font-display font-bold text-foreground", isWarning && "text-destructive")}>{value}</p>
        </div>
      </div>
    );
  }

  function OrderCard({ order, onUpdateStatus }: { order: Order, onUpdateStatus: (status: Order['status']) => void, key?: any }) {
    return (
      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          "bg-card rounded-xl shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300 border-2",
          order.priority === 'Urgent' ? "border-destructive/50" : 
          order.priority === 'High' ? "border-warning/30" : "border-border"
        )}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-display font-bold text-foreground">#{order.orderNumber || order.id || (order as any)._id?.slice(-4)}</h3>
            <div className="flex flex-wrap gap-1">
              {order.priority === 'Urgent' && (
                <span className="px-1.5 py-0.5 bg-destructive text-destructive-foreground text-[7px] font-bold rounded-md uppercase tracking-wider animate-pulse">{t('staff.urgent')}</span>
              )}
              {order.priority === 'High' && (
                <span className="px-1.5 py-0.5 bg-warning/20 text-warning text-[7px] font-bold rounded-md uppercase tracking-wider">{t('staff.high')}</span>
              )}
              <span className={cn(
                "px-1.5 py-0.5 text-[7px] font-bold rounded-md uppercase tracking-wider",
                order.type === 'Dine-in' ? "bg-info/10 text-info" : "bg-primary/10 text-primary"
              )}>
                {order.type === 'Dine-in' ? t('checkout.dineIn') : t('checkout.takeaway')}
              </span>
              {order.paymentMethod === 'KHQR' && (
                <span className={cn(
                  "px-1.5 py-0.5 text-[7px] font-bold rounded-md uppercase tracking-wider",
                  order.paymentStatus === 'Paid' ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"
                )}>
                  KHQR {order.paymentStatus === 'Paid' ? t('order.paid') : t('order.pending')}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{order.timestamp || new Date(order.createdAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        <div className="p-4 flex-1">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h4 className="font-bold text-base mb-0.5 text-foreground">{order.customerName}</h4>
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                {order.table ? `${t('staff.table')} ${order.table}` : t('checkout.takeaway')}
              </p>
            </div>
            <div className={cn(
              "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest",
              order.status === 'Pending' ? "bg-muted text-muted-foreground" :
              order.status === 'Preparing' ? "bg-info/10 text-info" :
              order.status === 'Ready' ? "bg-primary/10 text-primary" : 
              order.status === 'Completed' ? "bg-primary/20 text-primary" : "bg-destructive/10 text-destructive"
            )}>
              {t(`staff.${order.status.toLowerCase()}` as any)}
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {order.items.map((item, i) => {
              const orderId = order.id || (order as any)._id || order.orderNumber || 'order';
              const itemId = item.id || item.menuItem?.id || i;
              const itemKey = `order-${orderId}-item-${itemId}-${i}-${item.name || 'item'}`;
              return (
                <div key={itemKey} className="bg-muted/50 p-2.5 rounded-xl border border-border">
                  <div className="flex justify-between items-start mb-0.5">
                    <div className="flex gap-2">
                      <span className="text-xs font-bold text-primary">{item.quantity}x</span>
                      <p className="text-xs font-bold text-foreground">{item.name || item.menuItem?.name}</p>
                    </div>
                    {item.selectedVariant && (
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{item.selectedVariant.name}</span>
                    )}
                  </div>
                  
                  {/* Customizations & Modifiers */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {item.selectedModifiers?.map((m, mIdx) => (
                      <span key={`${itemKey}-mod-${m.id || mIdx}-${m.name}`} className="px-1.5 py-0.5 bg-card border border-border text-[8px] font-bold text-muted-foreground rounded-md uppercase tracking-wider">
                        + {m.name}
                      </span>
                    ))}
                    {item.customizations && Object.entries(item.customizations).map(([key, value], cIdx) => (
                      <span key={`${itemKey}-cust-${key}-${cIdx}`} className="px-1.5 py-0.5 bg-card border border-border text-[8px] font-bold text-primary rounded-md uppercase tracking-wider">
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            {order.paymentMethod === 'KHQR' && order.paymentStatus === 'Pending' && (
              <button 
                onClick={() => updatePaymentStatus(order.id || (order as any)._id, 'Paid')}
                className="flex-1 py-3 bg-warning text-warning-foreground rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-warning/20"
              >
                <Check size={16} />
                {t('staff.confirmPayment')}
              </button>
            )}
            {order.status === 'Ready' ? (
              <button 
                onClick={() => onUpdateStatus('Completed')}
                className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                <Check size={16} />
                {t('staff.markAsCompleted')}
              </button>
            ) : order.status === 'Preparing' ? (
              <button 
                onClick={() => onUpdateStatus('Ready')}
                className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                <Bell size={16} />
                {t('staff.markAsReady')}
              </button>
            ) : order.status === 'Completed' ? (
              <div className="flex-1 py-3 bg-muted text-muted-foreground rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                <Check size={16} />
                {t('staff.completed')}
              </div>
            ) : (
              <button 
                onClick={() => onUpdateStatus('Preparing')}
                className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                <Play size={14} fill="currentColor" />
                {t('staff.preparing')}
              </button>
            )}
            
            <button 
              onClick={() => printReceipt(order, t('common.appName'))}
              className="p-3 border border-border rounded-xl text-muted-foreground hover:bg-muted transition-colors"
              title={t('staff.printTicket')}
            >
              <Printer size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  function RedemptionCard({ redemption, onUpdateStatus }: { redemption: any, onUpdateStatus: (status: string) => void }) {
    return (
      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          "bg-card rounded-xl shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300 border-2",
          redemption.status === 'Pending' ? "border-primary/20" : "border-border"
        )}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
              <Coffee size={16} />
            </div>
            <h3 className="text-lg font-display font-bold text-foreground">{t('staff.rewardClaim')}</h3>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {new Date(redemption.redeemedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        <div className="p-4 flex-1">
          <div className="mb-6">
            <h4 className="font-bold text-base mb-1 text-foreground">{redemption.userName}</h4>
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2 py-0.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full uppercase tracking-widest">
                {redemption.rewardName}
              </span>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                {redemption.cost} {t('staff.points')}
              </span>
            </div>
            
            <div className={cn(
              "inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest",
              redemption.status === 'Pending' ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"
            )}>
              {t(`staff.${redemption.status.toLowerCase()}` as any)}
            </div>
          </div>

          <div className="flex gap-2">
            {redemption.status === 'Pending' ? (
              <button 
                onClick={() => onUpdateStatus('Claimed')}
                className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                <Check size={16} />
                {t('staff.markAsClaimed')}
              </button>
            ) : (
              <div className="flex-1 py-3 bg-muted text-muted-foreground rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                <Check size={16} />
                {t('staff.claimedAt', { time: new Date(redemption.claimedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
}
