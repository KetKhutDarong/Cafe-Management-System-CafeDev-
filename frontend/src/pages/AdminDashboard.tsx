import { useState, useEffect, useRef } from "react";
import { Routes, Route, Link, useLocation as useRouteLocation, useNavigate, Navigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Box, 
  Utensils, 
  BarChart3, 
  Settings, 
  LogOut, 
  Bell, 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight,
  Menu,
  X,
  Moon,
  Sun,
  Globe,
  User,
  MapPin,
  ClipboardList,
  Package,
  RefreshCw,
  Database,
  Coffee,
  Tag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import EmployeeManagement from "./EmployeeManagement";
import InventoryManagement from "./InventoryManagement";
import MenuManagement from "./MenuManagement";
import TableManagement from "./TableManagement";
import CustomerManagement from "./CustomerManagement";
import Analytics from "./Analytics";
import SettingsPage from "./Settings";
import LocationManagement from "./LocationManagement";
import SupportManagement from "./SupportManagement";
import FeedbackManagement from "./FeedbackManagement";
import PromotionManagement from "./PromotionManagement";
import { useAuth } from "@/AuthContext";
import { useLanguage } from "@/LanguageContext";
import { useTheme } from "@/ThemeContext";
import { useLocation } from "@/LocationContext";
import { toast } from "sonner";
import { getSalesReport, seedSampleData } from "@/services/reportService";
import * as notificationService from "@/services/notificationService";
import SupportModal from "@/components/SupportModal";
import ConfirmModal from "@/components/ConfirmModal";
import { MessageSquare } from "lucide-react";

const NAV_ITEMS = [
  { id: 'dashboard', name: 'admin.dashboard', icon: LayoutDashboard, path: '/admin' },
  { id: 'employees', name: 'admin.employees', icon: Users, path: '/admin/employees' },
  { id: 'inventory', name: 'admin.inventory', icon: Box, path: '/admin/inventory' },
  { id: 'customers', name: 'admin.customers', icon: Users, path: '/admin/customers' },
  { id: 'promotions', name: 'admin.promotions', icon: Tag, path: '/admin/promotions' },
  { id: 'menu', name: 'admin.menu', icon: Utensils, path: '/admin/menu' },
  { id: 'tables', name: 'admin.tables', icon: LayoutDashboard, path: '/admin/tables' },
  { id: 'reports', name: 'admin.reports', icon: BarChart3, path: '/admin/reports' },
  { id: 'locations', name: 'admin.locations', icon: MapPin, path: '/admin/locations' },
  { id: 'feedback', name: 'admin.feedback', icon: MessageSquare, path: '/admin/feedback' },
  { id: 'support-requests', name: 'admin.support', icon: MessageSquare, path: '/admin/support' },
  { id: 'profile', name: 'admin.myProfile', icon: Users, path: '/profile' },
  { id: 'settings', name: 'admin.settings', icon: Settings, path: '/admin/settings' },
];

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
};

export default function AdminDashboard() {
  const routeLocation = useRouteLocation();
  const { logout, user } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { themes, setTheme } = useTheme();
  const theme = themes['admin'];
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success(t('admin.logoutSuccess'));
    navigate("/login");
  };

  const filteredNavItems = NAV_ITEMS.filter(item => {
    if (user?.role === 'admin') return true;
    
    const permissions = user?.permissions || {};
    const isManager = user?.role === 'manager';
    const isStaff = ['manager', 'cashier', 'barista'].includes(user?.role || '');

    // Helper to check permission with fallback to role-based defaults
    const check = (key: string, roleDefault: boolean) => {
      return permissions[key] !== undefined ? permissions[key] : roleDefault;
    };
    
    switch (item.id) {
      case 'employees': return check('manageEmployees', false);
      case 'inventory': return check('manageInventory', isManager);
      case 'customers': return isManager;
      case 'promotions': return check('manageMenu', isManager);
      case 'menu': return check('manageMenu', isManager);
      case 'tables': return check('manageTables', isStaff);
      case 'reports': return check('viewReports', isManager);
      case 'support-requests': return check('manageSupport', isManager);
      case 'feedback': return check('manageSupport', isManager);
      case 'locations': return false; // Strict admin only
      case 'dashboard': return isManager || check('viewReports', isManager);
      case 'profile': return true;
      case 'settings': return false; // Strict admin only
      default: return true;
    }
  });

  // Re-usable permission check for routes
  const hasPerm = (key: string, roleDefault: boolean) => {
    if (user?.role === 'admin') return true;
    const permissions = user?.permissions || {};
    return permissions[key] !== undefined ? permissions[key] : roleDefault;
  };
  const isManager = user?.role === 'manager';
  const isStaff = ['manager', 'cashier', 'barista'].includes(user?.role || '');

  // Redirect if at index and dashboard is not allowed
  useEffect(() => {
    if (routeLocation.pathname === '/admin' || routeLocation.pathname === '/admin/') {
      const hasDashboard = filteredNavItems.some(item => item.id === 'dashboard');
      if (!hasDashboard && filteredNavItems.length > 0) {
        // Find the first navigation item that is not the profile
        const firstPermitted = filteredNavItems.find(item => item.id !== 'profile') || filteredNavItems[0];
        navigate(firstPermitted.path, { replace: true });
      }
    }
  }, [routeLocation.pathname, filteredNavItems, navigate]);

  return (
    <div className="flex h-screen bg-background text-foreground transition-colors duration-300 overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:relative inset-y-0 left-0 w-64 bg-secondary border-r border-border flex flex-col z-50 transition-transform duration-300 lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-card rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-primary/20">
            <img src="/cafedev_logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg tracking-tight text-foreground">{t('common.appName')}</h1>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{t('admin.managementSystem')}</p>
          </div>
        </div>

        {/* Back to Orders Button for Staff/Managers - only if not a Super Admin */}
        {user && user.role !== 'admin' && (() => {
          const isStaffRole = ['manager', 'cashier', 'barista'].includes(user.role);
          const canManageOrders = (user.permissions?.manageOrders !== undefined 
              ? user.permissions.manageOrders 
              : isStaffRole);
          return canManageOrders;
        })() && (
          <div className="px-4 mb-4">
            <button
              onClick={() => navigate('/staff')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
            >
              <Utensils size={18} />
              {t('staff.backToOrders')}
            </button>
          </div>
        )}

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {filteredNavItems.map(item => {
            const isActive = routeLocation.pathname === item.path;
            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-muted text-primary font-semibold border-l-[3px] border-primary" 
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <item.icon 
                  size={20} 
                  className={cn(
                    "transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                  )} 
                />
                <span className="text-sm">{t(item.name as any)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <button 
            onClick={() => setIsSupportOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-all font-bold text-xs"
          >
            <MessageSquare size={18} />
            <span className="lg:hidden xl:inline">{t('auth.support')}</span>
          </button>
          <div className="flex items-center justify-between px-2">
            <button 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light', 'admin')}
              className="p-2.5 hover:bg-muted rounded-xl transition-colors text-muted-foreground flex items-center gap-2"
              title={theme === 'light' ? t('staff.switchToDark') : t('staff.switchToLight')}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              <span className="text-[10px] font-bold uppercase tracking-widest lg:hidden xl:inline">{theme === 'light' ? t('settings.dark') : t('settings.light')}</span>
            </button>
            <button 
              onClick={() => setLanguage(language === 'en' ? 'km' : 'en')}
              className="p-2.5 hover:bg-muted rounded-xl transition-colors flex items-center gap-2 text-muted-foreground"
              title={language === 'en' ? t('staff.switchToKhmer') : t('staff.switchToEnglish')}
            >
              <Globe size={18} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{language === 'en' ? 'EN' : 'KM'}</span>
            </button>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-muted transition-colors group">
            <Link to="/profile" className="flex items-center gap-3 flex-1 min-w-0" onClick={() => setIsSidebarOpen(false)}>
              <div className="w-10 h-10 rounded-full bg-muted overflow-hidden border-2 border-card shadow-sm hover:ring-2 hover:ring-primary transition-all">
                <img src={user?.image || "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"} alt={t('settings.profile')} referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-bold truncate text-foreground">{user?.name || t('admin.adminUser')}</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest capitalize">{user?.role || t('admin.superAdmin')}</p>
              </div>
            </Link>
            <button onClick={handleLogout} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        <div className="lg:hidden p-4 bg-secondary border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-card rounded-lg flex items-center justify-center overflow-hidden shadow-sm">
              <img src="/cafedev_logo.png" alt="Logo" className="w-6 h-6 object-contain" />
            </div>
            <span className="font-bold text-sm text-foreground">{t('common.appName')}</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <MoreVertical size={20} />
          </button>
        </div>
        <div className="flex-1">
          <Routes>
            <Route index element={<DashboardOverview />} />
            <Route path="employees" element={
              hasPerm('manageEmployees', false) ? <EmployeeManagement /> : <Navigate to="/admin" replace />
            } />
            <Route path="inventory" element={
              hasPerm('manageInventory', isManager) ? <InventoryManagement /> : <Navigate to="/admin" replace />
            } />
            <Route path="customers" element={
              isManager || user?.role === 'admin' ? <CustomerManagement /> : <Navigate to="/admin" replace />
            } />
            <Route path="menu" element={
              hasPerm('manageMenu', isManager) ? <MenuManagement /> : <Navigate to="/admin" replace />
            } />
            <Route path="tables" element={
              hasPerm('manageTables', isStaff) ? <TableManagement /> : <Navigate to="/admin" replace />
            } />
            <Route path="reports" element={
              hasPerm('viewReports', isManager) ? <Analytics /> : <Navigate to="/admin" replace />
            } />
            <Route path="locations" element={
              user?.role === "admin" ? <LocationManagement /> : <Navigate to="/admin" replace />
            } />
            <Route path="support" element={
              hasPerm('manageSupport', isManager) ? <SupportManagement /> : <Navigate to="/admin" replace />
            } />
            <Route path="feedback" element={
              hasPerm('manageSupport', isManager) ? <FeedbackManagement /> : <Navigate to="/admin" replace />
            } />
            <Route path="promotions" element={
              hasPerm('manageMenu', isManager) ? <PromotionManagement /> : <Navigate to="/admin" replace />
            } />
            <Route path="settings" element={
              user?.role === "admin" ? <SettingsPage /> : <Navigate to="/admin" replace />
            } />
          </Routes>
        </div>
      </main>

      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
    </div>
  );
}

import NotificationDropdown, { Notification } from "@/components/NotificationDropdown";

function DashboardOverview() {
  const { t, language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const { themes } = useTheme();
  const theme = themes['admin'];
  const { currentLocation, locations, setCurrentLocation } = useLocation();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
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

  const fetchStats = async (showLoading = true) => {
    // Check if user has permission to view reports
    const hasViewReports = user?.role === 'admin' || 
                           (user?.permissions?.viewReports !== undefined ? user.permissions.viewReports : user?.role === 'manager');
    
    if (!hasViewReports) {
      if (showLoading) setIsLoading(false);
      return;
    }

    if (showLoading) setIsLoading(true);
    try {
      const params = currentLocation ? { locationId: currentLocation.id || currentLocation._id } : {};
      const data = await getSalesReport(params);
      setStats(data);
      await fetchNotifications();
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      toast.error(t('admin.loadError'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh every 5 seconds for real-time feel
    const interval = setInterval(() => {
      fetchStats(false);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [currentLocation]);

  const handleSeedData = async () => {
    setIsRefreshing(true);
    try {
      const params = currentLocation ? { locationId: currentLocation.id || currentLocation._id } : {};
      await seedSampleData(params);
      toast.success(t('admin.seedSuccess'));
      fetchStats(false);
    } catch (error) {
      toast.error(t('admin.seedError'));
    } finally {
      setIsRefreshing(false);
    }
  };

  const calculateTrend = (current: number, previous: number) => {
    if (!previous || previous === 0) return current > 0 ? "+100%" : "0%";
    const diff = ((current - previous) / previous) * 100;
    return `${diff >= 0 ? '+' : ''}${diff.toFixed(0)}%`;
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchStats(false);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 relative z-40">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">{t('admin.dashboardOverview')}</h2>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full border border-green-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Live</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{t('admin.welcomeBack')}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          {/* Location Switcher */}
          <div className="flex items-center gap-2 bg-card p-1 rounded-2xl border border-border shadow-sm">
            <MapPin size={16} className="ml-3 text-primary" />
            <select 
              value={currentLocation?.id || currentLocation?._id || ''}
              onChange={(e) => {
                const loc = locations.find(l => (l.id || l._id) === e.target.value);
                setCurrentLocation(loc || null);
              }}
              className="bg-transparent border-none text-xs font-bold text-card-foreground focus:ring-0 pr-8"
            >
              <option value="">{t('admin.allLocations')}</option>
              {locations.map((loc, idx) => (
                <option key={loc.id || loc._id || `loc-opt-${idx}`} value={loc.id || loc._id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-3 bg-card rounded-2xl shadow-sm hover:bg-muted transition-colors border border-border flex items-center gap-2 text-sm font-medium text-muted-foreground disabled:opacity-50"
            >
              <RefreshCw size={18} className={cn(isRefreshing && "animate-spin")} />
              <span className="hidden sm:inline">{t('admin.refresh')}</span>
            </button>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder={t('admin.searchSystem')}
              className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-2xl shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-card-foreground"
            />
          </div>
          <NotificationDropdown 
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onClearAll={handleClearAll}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard 
          title={t('admin.totalRevenue')} 
          value={formatCurrency(stats?.totalRevenue || 0)} 
          trend={calculateTrend(stats?.totalRevenue || 0, stats?.previous?.totalRevenue || 0)} 
          isPositive={(stats?.totalRevenue || 0) >= (stats?.previous?.totalRevenue || 0)} 
          previousValue={stats?.previous?.totalRevenue || 0}
        />
        <StatCard 
          title={t('admin.totalOrders')} 
          value={stats?.totalOrders?.toString() || "0"} 
          trend={calculateTrend(stats?.totalOrders || 0, stats?.previous?.totalOrders || 0)} 
          isPositive={(stats?.totalOrders || 0) >= (stats?.previous?.totalOrders || 0)} 
          previousValue={stats?.previous?.totalOrders || 0}
          isCurrency={false}
        />
        <StatCard 
          title={t('admin.activeOrders')} 
          value={stats?.activeOrders?.toString() || "0"} 
          trend="Live" 
          isPositive 
          onClick={() => navigate('/staff')}
        />
        <StatCard 
          title={t('admin.avgOrderValue')} 
          value={formatCurrency(stats?.avgOrderValue || 0)} 
          trend={calculateTrend(stats?.avgOrderValue || 0, stats?.previous?.avgOrderValue || 0)} 
          isPositive={(stats?.avgOrderValue || 0) >= (stats?.previous?.avgOrderValue || 0)} 
          previousValue={stats?.previous?.avgOrderValue || 0}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-card p-6 sm:p-8 rounded-[32px] shadow-sm border border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h3 className="text-xl font-display font-bold text-card-foreground">{t('admin.revenueTrends')}</h3>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-primary" /> {t('admin.current')}</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-muted" /> {t('admin.previous')}</div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.revenueTrends || []}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: 'currentColor' }}
                  className="text-muted-foreground"
                  dy={10}
                />
                <RechartsTooltip 
                  cursor={{ fill: 'transparent' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card p-3 rounded-xl shadow-xl border border-border">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                          <p className="text-sm font-bold text-card-foreground">{formatCurrency(payload[0].value as number)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="current" 
                  fill="var(--primary)" 
                  radius={[6, 6, 0, 0]} 
                  barSize={32}
                />
                <Bar 
                  dataKey="previous" 
                  fill="var(--muted)" 
                  radius={[6, 6, 0, 0]} 
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card p-6 sm:p-8 rounded-[32px] shadow-sm border border-border">
          <h3 className="text-xl font-display font-bold mb-8 text-card-foreground">{t('admin.salesByCategory')}</h3>
          <div className="flex flex-col items-center">
            <div className="w-full h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.categorySales || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(stats?.categorySales || []).map((entry: any, index: number) => (
                      <Cell key={`admin-dash-pie-cell-${index}-${entry.name || 'entry'}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-2xl sm:text-3xl font-display font-bold text-card-foreground">{stats?.totalOrders || 0}</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{t('admin.totalSales')}</p>
              </div>
            </div>
            <div className="w-full space-y-4 mt-4">
              {(stats?.categorySales || []).map((cat: any, i: number) => (
                <CategoryStat 
                  key={`admin-dash-cat-stat-${i}-${cat.name || 'cat'}`} 
                  label={cat.name} 
                  value={`${cat.value}%`} 
                  color={cat.color || (cat.name === 'Coffee' ? 'var(--primary)' : 'var(--muted)')} 
                />
              ))}
              {(!stats?.categorySales || stats.categorySales.length === 0) && (
                <p className="text-xs text-center text-muted-foreground">{t('admin.noCategoryData')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  trend, 
  isPositive, 
  previousValue, 
  isCurrency = true,
  onClick
}: { 
  title: string, 
  value: string, 
  trend: string, 
  isPositive: boolean, 
  previousValue?: number, 
  isCurrency?: boolean,
  onClick?: () => void
}) {
  const { t } = useLanguage();
  return (
    <div 
      onClick={onClick}
      className={cn(
        "bg-card p-6 rounded-[14px] border border-border group hover:shadow-xl transition-all duration-300",
        onClick ? "cursor-pointer hover:border-primary/50" : "cursor-default"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold",
          trend === 'Live' ? "bg-primary/15 text-primary border border-primary/40" :
          isPositive ? "bg-success/15 text-success border border-success/40" : "bg-destructive/15 text-destructive border border-destructive/40"
        )}>
          {trend === 'Live' ? <RefreshCw size={12} className="animate-spin" /> : (isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />)}
          {trend}
        </div>
      </div>
      <p className="text-3xl font-display font-bold group-hover:scale-105 transition-transform origin-left text-card-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">
        {trend === 'Live' ? t('admin.currentlyActive') : t('admin.vsLastPeriod', { amount: previousValue !== undefined ? (isCurrency ? formatCurrency(previousValue) : previousValue.toString()) : "N/A" })}
      </p>
    </div>
  );
}

function CategoryStat({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div 
      className="flex items-center justify-between cursor-pointer hover:bg-accent/50 p-2 rounded-xl transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <span className="text-sm font-bold text-card-foreground">{value}</span>
    </div>
  );
}
