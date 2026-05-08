import { useState, useEffect } from "react";
import { User, Lock, Bell, Shield, Globe, Moon, Sun, Save, Key, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useLanguage } from "@/LanguageContext";
import { useLocation } from "react-router-dom";
import { useTheme, type ThemeScope } from "@/ThemeContext";
import api from "@/services/api";

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { themes, setTheme } = useTheme();
  const location = useLocation();

  const scope: ThemeScope = location.pathname.startsWith('/admin') ? 'admin' : 
                         location.pathname.startsWith('/staff') ? 'staff' : 'customer';
  const theme = themes[scope];

  const [activeTab, setActiveTab ] = useState('profile');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [settings, setSettings] = useState<any>({});

  const [notifPrefs, setNotifPrefs] = useState({
    orderAlerts: true,
    inventoryAlerts: true,
    staffMessages: false,
    dailyReports: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (user?.notificationPreferences) {
      setNotifPrefs(user.notificationPreferences);
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const response = await api.get("/settings");
      setSettings(response.data);
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleToggleNotif = async (key: string, value: boolean) => {
    const updatedPrefs = { ...notifPrefs, [key]: value };
    setNotifPrefs(updatedPrefs);
    
    try {
      const response = await api.put("/auth/profile", { 
        notificationPreferences: updatedPrefs 
      });
      if (response.data.user) {
        updateUser(response.data.user);
        toast.success(t('common.save') || "Settings saved");
      }
    } catch (error) {
      console.error("Error saving notifications:", error);
      toast.error(t('common.error') || "Failed to save settings");
      // Revert state on error
      setNotifPrefs(notifPrefs);
    }
  };

  const TABS = [
    { id: 'profile', name: t('settings.profile'), icon: User },
    { id: 'security', name: t('settings.security'), icon: Lock },
    { id: 'notifications', name: t('settings.notifications'), icon: Bell },
    { id: 'general', name: t('settings.general'), icon: Globe },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <header className="mb-10">
        <h2 className="text-2xl sm:text-3xl font-display font-bold mb-1 text-foreground">{t('settings.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('settings.subtitle')}</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Sidebar Tabs */}
        <aside className="flex lg:flex-col gap-2 overflow-x-auto no-scrollbar pb-2 lg:pb-0 lg:w-64">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm transition-all whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-muted text-primary shadow-sm" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <tab.icon size={20} />
              {tab.name}
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <div className="flex-1 bg-card rounded-[40px] shadow-sm p-6 sm:p-10 border border-border">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-10"
              >
                <section>
                  <h3 className="text-xl font-display font-bold mb-8 text-card-foreground">{t('settings.publicProfile')}</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-8 mb-10">
                    <div className="relative group self-center sm:self-auto">
                      <div className="w-32 h-32 rounded-[40px] bg-muted overflow-hidden border-4 border-card shadow-xl">
                        <img src={user?.image || "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"} alt={t('settings.profile')} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <button className="absolute -bottom-2 -right-2 p-3 bg-primary text-primary-foreground rounded-2xl shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
                        <Camera size={18} />
                      </button>
                    </div>
                    <div className="text-center sm:text-left">
                      <h4 className="text-lg font-bold mb-1 text-card-foreground">{user?.name || t('settings.adminUser')}</h4>
                      <p className="text-sm text-muted-foreground mb-4">{user?.role || t('settings.administrator')}</p>
                      <button className="text-primary text-xs font-bold uppercase tracking-widest hover:underline">{t('settings.changePhoto')}</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-4">{t('settings.fullName')}</label>
                      <input 
                        type="text" 
                        defaultValue={user?.name}
                        className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-medium text-card-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-4">{t('settings.emailAddress')}</label>
                      <input 
                        type="email" 
                        defaultValue={user?.email}
                        className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-medium text-card-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-4">{t('settings.phoneNumber')}</label>
                      <input 
                        type="tel" 
                        defaultValue={t('settings.phonePlaceholder')}
                        className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-medium text-card-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-4">{t('settings.location')}</label>
                      <input 
                        type="text" 
                        defaultValue={t('settings.locationPlaceholder')}
                        className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-medium text-card-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </section>

                <div className="pt-8 border-t border-border flex justify-end">
                  <button 
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:opacity-90 transition-all shadow-xl shadow-primary/20"
                  >
                    <Save size={20} />
                    {t('settings.saveChanges')}
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-10"
              >
                <section>
                  <h3 className="text-xl font-display font-bold mb-8 text-card-foreground">{t('settings.securitySettings')}</h3>
                  <div className="space-y-6">
                    <div className="p-6 bg-muted border border-border rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-card rounded-2xl flex items-center justify-center text-muted-foreground shadow-sm">
                          <Key size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-card-foreground">{t('settings.password')}</p>
                          <p className="text-xs text-muted-foreground">{t('settings.lastChanged')}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsPasswordModalOpen(true)}
                        className="w-full sm:w-auto px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all"
                      >
                        {t('settings.changePassword')}
                      </button>
                    </div>

                    <div className="p-6 bg-muted border border-border rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-card rounded-2xl flex items-center justify-center text-muted-foreground shadow-sm">
                          <Shield size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-card-foreground">{t('settings.twoFactor')}</p>
                          <p className="text-xs text-muted-foreground">{t('settings.twoFactorDesc')}</p>
                        </div>
                      </div>
                      <button className="w-full sm:w-auto px-6 py-3 border border-border rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-card transition-all text-muted-foreground">
                        {t('settings.enable')}
                      </button>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-10"
              >
                <section>
                  <h3 className="text-xl font-display font-bold mb-8 text-card-foreground">{t('settings.notificationPrefs')}</h3>
                  <div className="space-y-4">
                    <NotificationToggle 
                      title={t('settings.orderAlerts')} 
                      description={t('settings.orderAlertsDesc')} 
                      checked={notifPrefs.orderAlerts} 
                      onChange={(val) => handleToggleNotif('orderAlerts', val)}
                    />
                    <NotificationToggle 
                      title={t('settings.inventoryAlerts')} 
                      description={t('settings.inventoryAlertsDesc')} 
                      checked={notifPrefs.inventoryAlerts} 
                      onChange={(val) => handleToggleNotif('inventoryAlerts', val)}
                    />
                    <NotificationToggle 
                      title={t('settings.staffMessages')} 
                      description={t('settings.staffMessagesDesc')} 
                      checked={notifPrefs.staffMessages} 
                      onChange={(val) => handleToggleNotif('staffMessages', val)}
                    />
                    <NotificationToggle 
                      title={t('settings.dailyReports')} 
                      description={t('settings.dailyReportsDesc')} 
                      checked={notifPrefs.dailyReports} 
                      onChange={(val) => handleToggleNotif('dailyReports', val)}
                    />
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'general' && (
              <motion.div
                key="general"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-10"
              >
                <section>
                  <h3 className="text-xl font-display font-bold mb-8 text-card-foreground">{t('settings.generalPrefs')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-4">{t('settings.language')}</label>
                      <select 
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as any)}
                        className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-medium text-card-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      >
                        <option value="en">{t('settings.english')}</option>
                        <option value="km">{t('settings.khmer')}</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-4">{t('settings.timezone')}</label>
                      <select className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-medium text-card-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all">
                        <option>{t('settings.pacificTime')}</option>
                        <option>{t('settings.easternTime')}</option>
                        <option>{t('settings.utc')}</option>
                        <option>{t('settings.indochinaTime')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-10 p-6 sm:p-8 bg-muted border border-border rounded-[32px]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div>
                        <p className="font-bold text-sm text-card-foreground">{t('settings.themeMode')}</p>
                        <p className="text-xs text-muted-foreground">{t('settings.themeModeDesc')}</p>
                      </div>
                      <div className="flex bg-card p-1 rounded-2xl shadow-sm border border-border self-start sm:self-auto">
                        <button 
                          onClick={() => setTheme('light', scope)}
                          className={cn(
                            "p-3 rounded-xl transition-all",
                            theme === 'light' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Sun size={20} />
                        </button>
                        <button 
                          onClick={() => setTheme('dark', scope)}
                          className={cn(
                            "p-3 rounded-xl transition-all",
                            theme === 'dark' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Moon size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* Password Change Modal */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-card rounded-[40px] shadow-2xl overflow-hidden border border-border"
            >
              <div className="p-8 border-b border-border">
                <h3 className="text-2xl font-display font-bold text-card-foreground">{t('settings.changePassword')}</h3>
              </div>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success(t('settings.passwordUpdated'));
                  setIsPasswordModalOpen(false);
                }}
                className="p-8 space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-4">{t('settings.currentPassword')}</label>
                  <input 
                    type="password" 
                    required
                    className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-medium text-card-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-4">{t('settings.newPassword')}</label>
                  <input 
                    type="password" 
                    required
                    className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-medium text-card-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-4">{t('settings.confirmPassword')}</label>
                  <input 
                    type="password" 
                    required
                    className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-medium text-card-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="flex-1 py-4 bg-muted text-muted-foreground rounded-2xl font-bold hover:bg-muted/80 transition-all"
                  >
                    {t('common.cancel')}
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:opacity-90 transition-all shadow-xl shadow-primary/20"
                  >
                    {t('settings.updatePassword')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NotificationToggle({ title, description, checked, onChange }: { title: string, description: string, checked: boolean, onChange: (val: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-6 bg-muted border border-border rounded-3xl">
      <div>
        <p className="font-bold text-sm text-card-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button 
        onClick={() => onChange(!checked)}
        className={cn(
          "w-14 h-8 rounded-full transition-all relative",
          checked ? "bg-primary" : "bg-border"
        )}
      >
        <div className={cn(
          "absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm",
          checked ? "left-7" : "left-1"
        )} />
      </button>
    </div>
  );
}
