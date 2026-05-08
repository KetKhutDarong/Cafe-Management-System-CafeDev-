import { useState, useEffect, type ReactNode } from "react";
import { Search, Plus, Filter, MoreVertical, Download, User, Mail, Phone, Calendar, Star, History, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import api from "@/services/api";
import { useLanguage } from "@/LanguageContext";
import { useLocation } from "@/LocationContext";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  points: number;
  membershipLevel: string;
  createdAt: string;
  lastVisit: string;
  totalSpent: number;
  status: string;
}

export default function CustomerManagement() {
  const { t } = useLanguage();
  const { currentLocation } = useLocation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, [currentLocation]);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const params = currentLocation ? { locationId: currentLocation.id || currentLocation._id } : {};
      const res = await api.get("/customers", { params });
      if (Array.isArray(res.data)) {
        setCustomers(res.data);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error(t('customer.loadError'));
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = Array.isArray(customers) ? customers.filter(c => 
    (c.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (c.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (c.phone || "").includes(searchQuery)
  ) : [];

  const getLevelColor = (level: string = "") => {
    switch (level?.toLowerCase() || "") {
      case 'gold': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30';
      case 'silver': return 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-500/20 dark:text-stone-400 dark:border-stone-500/30';
      default: return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30';
    }
  };

  return (
    <div className="p-4 sm:p-8 bg-background min-h-full transition-colors duration-300">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold mb-1 text-foreground">{t('customer.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('customer.subtitle')}</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              setSelectedCustomer(null);
              setShowModal(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={18} />
            {t('customer.add')}
          </button>
          <button 
            className="p-3 bg-card rounded-2xl shadow-sm hover:bg-muted transition-colors border border-border"
          >
            <Download size={20} className="text-muted-foreground" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <SummaryCard title={t('customer.total')} value={(Array.isArray(customers) ? customers.length : 0).toString()} icon={<User size={20} />} trend="+12%" isPositive />
        <SummaryCard title={t('customer.active')} value={(Array.isArray(customers) ? customers.filter(c => (c.points || 0) > 0).length : 0).toString()} icon={<Star size={20} />} trend="+5%" isPositive />
        <SummaryCard title={t('customer.points')} value={(Array.isArray(customers) ? customers.reduce((sum, c) => sum + (c.points || 0), 0) : 0).toLocaleString()} icon={<CreditCard size={20} />} trend="+8%" isPositive />
        <SummaryCard title={t('customer.retention')} value="78%" icon={<History size={20} />} trend="-2%" isPositive={false} />
      </div>

      <div className="bg-card rounded-[40px] shadow-sm overflow-hidden border border-border">
        <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-6 bg-muted/30">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder={t('customer.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-card border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary transition-all text-sm text-foreground"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-muted transition-all text-muted-foreground">
              <Filter size={14} />
              {t('customer.filter')}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-border">
                <th className="px-8 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('customer.label')}</th>
                <th className="px-6 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('customer.contact')}</th>
                <th className="px-6 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('customer.membership')}</th>
                <th className="px-6 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('customer.pointsLabel')}</th>
                <th className="px-6 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('customer.lastVisit')}</th>
                <th className="px-8 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">{t('customer.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground font-medium">{t('customer.loading')}</p>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <User size={32} className="text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">{t('customer.notFound')}</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, idx) => (
                  <tr key={`customer-${customer.id || (customer as any)._id || idx}-${idx}`} className="hover:bg-muted/50 transition-colors group">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                          {customer.name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{customer.name}</p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                            {t('customer.joined', { date: new Date(customer.createdAt || Date.now()).toLocaleDateString() })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail size={12} className="text-muted-foreground/70" />
                          {customer.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone size={12} className="text-muted-foreground/70" />
                          {customer.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                        getLevelColor(customer.membershipLevel)
                      )}>
                        {customer.membershipLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Star size={14} className="text-amber-400 fill-amber-400" />
                        <span className="text-sm font-bold text-foreground">{customer.points} {t('profile.pts')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {new Date(customer.lastVisit || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-4 text-right">
                      <button 
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowModal(true);
                        }}
                        className="p-2 hover:bg-card hover:shadow-md rounded-lg transition-all text-muted-foreground hover:text-primary"
                      >
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-card rounded-[40px] shadow-2xl overflow-hidden border border-border"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-display font-bold text-foreground">
                    {selectedCustomer ? t('customer.edit') : t('customer.new')}
                  </h3>
                  <button 
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-muted rounded-full transition-colors"
                  >
                    <Plus size={24} className="rotate-45 text-muted-foreground" />
                  </button>
                </div>

                <form className="space-y-6" onSubmit={(e) => {
                  e.preventDefault();
                  toast.success(selectedCustomer ? t('customer.successUpdate') : t('customer.successAdd'));
                  setShowModal(false);
                  fetchCustomers();
                }}>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">{t('customer.fullName')}</label>
                    <input 
                      type="text" 
                      required
                      defaultValue={selectedCustomer?.name}
                      placeholder={t('customer.namePlaceholder')}
                      className="w-full px-5 py-3.5 bg-muted border-none rounded-2xl text-sm text-foreground focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">{t('customer.email')}</label>
                    <input 
                      type="email" 
                      required
                      defaultValue={selectedCustomer?.email}
                      placeholder={t('customer.emailPlaceholder')}
                      className="w-full px-5 py-3.5 bg-muted border-none rounded-2xl text-sm text-foreground focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">{t('customer.phone')}</label>
                    <input 
                      type="tel" 
                      required
                      defaultValue={selectedCustomer?.phone}
                      placeholder={t('customer.phonePlaceholder')}
                      className="w-full px-5 py-3.5 bg-muted border-none rounded-2xl text-sm text-foreground focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                  
                  <div className="pt-4 flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 py-4 bg-muted text-muted-foreground rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-accent/50 transition-all"
                    >
                      {t('common.cancel')}
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                    >
                      {selectedCustomer ? t('customer.edit') : t('customer.new')}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SummaryCard({ title, value, icon, trend, isPositive }: { title: string, value: string, icon: ReactNode, trend: string, isPositive: boolean }) {
  return (
    <div className="bg-card p-6 rounded-[32px] shadow-sm border border-border group hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
          {icon}
        </div>
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold",
          isPositive ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
        )}>
          {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend}
        </div>
      </div>
      <p className="text-2xl font-display font-bold mb-1 text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{title}</p>
    </div>
  );
}

function ArrowUpRight({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7 17 10-10M7 7h10v10" />
    </svg>
  );
}

function ArrowDownRight({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7 7 10 10M17 7v10H7" />
    </svg>
  );
}
