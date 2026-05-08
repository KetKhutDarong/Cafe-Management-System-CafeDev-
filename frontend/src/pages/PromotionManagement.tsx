import { useState, useEffect } from "react";
import { 
  Search, 
  Plus, 
  Calendar, 
  Clock, 
  Tag, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  AlertCircle,
  Percent,
  DollarSign,
  Coffee,
  ShoppingBag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/LanguageContext";
import { useLocation } from "@/LocationContext";
import api from "@/services/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import ConfirmModal from "@/components/ConfirmModal";

interface Promotion {
  id: string;
  _id?: string;
  name: string;
  description: string;
  type: "percentage" | "fixed" | "bogo";
  value: number;
  targetType: "category" | "item" | "all";
  targetIds: string[];
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  isActive: boolean;
  locationId?: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function PromotionManagement() {
  const { t } = useLanguage();
  const { currentLocation, locations } = useLocation();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState<Partial<Promotion>>({
    name: "",
    description: "",
    type: "percentage",
    value: 0,
    targetType: "all",
    targetIds: [],
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    startTime: "09:00",
    endTime: "17:00",
    isActive: true
  });
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [menuItems, setMenuItems] = useState<{id: string, name: string}[]>([]);
  const [activeTab, setActiveTab] = useState<'promotions' | 'coupons'>('promotions');
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [couponFormData, setCouponFormData] = useState<any>({
    code: "",
    description: "",
    type: "percentage",
    value: 0,
    minOrderAmount: 0,
    maxDiscount: undefined,
    startDate: "",
    endDate: "",
    active: true,
    usageLimit: undefined
  });
  const [isDeletePromoModalOpen, setIsDeletePromoModalOpen] = useState(false);
  const [isDeleteCouponModalOpen, setIsDeleteCouponModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const params = currentLocation ? { locationId: currentLocation.id || currentLocation._id } : {};
      const response = await api.get("/promotions", { params });
      // Normalize IDs and ensure arrays exist
      const normalizedPromotions = response.data.map((p: any) => ({
        ...p,
        id: (p._id || p.id).toString(),
        targetIds: p.targetIds || [],
        daysOfWeek: p.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]
      }));
      setPromotions(normalizedPromotions);
    } catch (error) {
      console.error("Failed to fetch promotions:", error);
      toast.error("Failed to load promotions");
    } finally {
      setLoading(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      const params = currentLocation ? { locationId: currentLocation.id || currentLocation._id } : {};
      const response = await api.get("/coupons", { params });
      setCoupons(response.data);
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
    }
  };

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...couponFormData,
        locationId: (currentLocation?.id || currentLocation?._id)?.toString()
      };
      
      if (editingCoupon) {
        await api.put(`/coupons/${editingCoupon.id || editingCoupon._id}`, payload);
        toast.success("Coupon updated successfully");
      } else {
        await api.post("/coupons", payload);
        toast.success("Coupon created successfully");
      }
      setIsCouponModalOpen(false);
      setEditingCoupon(null);
      fetchCoupons();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to save coupon");
    }
  };

  const fetchMetadata = async () => {
    try {
      const itemsRes = await api.get("/menu-items");
      const items = itemsRes.data.map((i: any, idx: number) => {
        const id = (i.id || i._id || `item-${idx}`).toString();
        return { 
          id, 
          name: i.name || `Item ${id.substring(0, 4)}`,
          category: i.category || 'Uncategorized'
        }
      });
      setMenuItems(items);
      
      // Derive categories from items
      const uniqueCategories = Array.from(new Set(items.map((i: any) => i.category).filter(Boolean)));
      if (uniqueCategories.length > 0) {
        setCategories(uniqueCategories.map(cat => ({ id: cat as string, name: cat as string })));
      } else {
        // Fallback categories if none found in menu items
        setCategories([
          { id: 'Coffee', name: 'Coffee' },
          { id: 'Tea', name: 'Tea' },
          { id: 'Bakery', name: 'Bakery' },
          { id: 'Savory', name: 'Savory' }
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch metadata:", error);
      // Fallback categories on error
      setCategories([
        { id: 'Coffee', name: 'Coffee' },
        { id: 'Tea', name: 'Tea' },
        { id: 'Bakery', name: 'Bakery' },
        { id: 'Savory', name: 'Savory' }
      ]);
    }
  };

  useEffect(() => {
    fetchPromotions();
    fetchCoupons();
    fetchMetadata();
  }, [currentLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create a clean payload without ID fields
      const { id, _id, ...cleanFormData } = formData as any;
      const payload = {
        ...cleanFormData,
        locationId: (currentLocation?.id || currentLocation?._id)?.toString()
      };
      
      if (editingPromotion) {
        const promoId = editingPromotion.id || editingPromotion._id;
        await api.put(`/promotions/${promoId}`, payload);
        toast.success("Promotion updated successfully");
      } else {
        await api.post("/promotions", payload);
        toast.success("Promotion created successfully");
      }
      setIsModalOpen(false);
      setEditingPromotion(null);
      fetchPromotions();
    } catch (error) {
      console.error("Failed to save promotion:", error);
      toast.error("Failed to save promotion");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/promotions/${id}`);
      toast.success("Promotion deleted");
      fetchPromotions();
    } catch (error) {
      console.error("Failed to delete promotion:", error);
      toast.error("Failed to delete promotion");
    }
  };

  const toggleDay = (day: number) => {
    const current = formData.daysOfWeek || [];
    if (current.includes(day)) {
      setFormData({ ...formData, daysOfWeek: current.filter(d => d !== day) });
    } else {
      setFormData({ ...formData, daysOfWeek: [...current, day].sort() });
    }
  };

  return (
    <div className="p-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground mb-1">{t('admin.promotions')} & Rewards</h2>
          <p className="text-sm text-muted-foreground">Manage happy hours, automatic discounts and manual coupons</p>
        </div>
        <button 
          onClick={() => {
            if (activeTab === 'promotions') {
              setEditingPromotion(null);
              setFormData({
                name: "",
                description: "",
                type: "percentage",
                value: 0,
                targetType: "all",
                targetIds: [],
                daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
                startTime: "09:00",
                endTime: "17:00",
                isActive: true
              });
              setIsModalOpen(true);
            } else {
              setEditingCoupon(null);
              setCouponFormData({
                code: "",
                description: "",
                type: "percentage",
                value: 0,
                minOrderAmount: 0,
                maxDiscount: undefined,
                startDate: "",
                endDate: "",
                active: true,
                usageLimit: undefined
              });
              setIsCouponModalOpen(true);
            }
          }}
          className="flex items-center gap-3 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
        >
          <Plus size={20} />
          {activeTab === 'promotions' ? t('admin.addPromotion') : "Create Coupon"}
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-2xl w-fit mb-10">
        <button 
          onClick={() => setActiveTab('promotions')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-bold transition-all",
            activeTab === 'promotions' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Happy Hours & Automatic
        </button>
        <button 
          onClick={() => setActiveTab('coupons')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-bold transition-all",
            activeTab === 'coupons' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Promo Codes & Coupons
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : activeTab === 'promotions' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {promotions.map((promo, idx) => (
            // ... existing promotion card ...
            <motion.div 
              layout
              key={promo.id || promo._id || `promo-${idx}`}
              className="group bg-card p-6 rounded-[24px] border border-border shadow-sm hover:shadow-xl transition-all relative overflow-hidden"
            >
               <div className={cn(
                "absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-5 group-hover:scale-110 transition-transform pointer-events-none",
                promo.isActive ? "bg-primary" : "bg-muted"
              )} />
              
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  "p-3 rounded-2xl",
                  promo.isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {promo.type === 'percentage' ? <Percent size={20} /> : <DollarSign size={20} />}
                </div>
                <div className="flex items-center gap-2 relative z-10">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("Editing promotion:", promo);
                      setEditingPromotion(promo);
                      setFormData({ ...promo });
                      setIsModalOpen(true);
                    }}
                    className="p-2 text-muted-foreground hover:bg-muted rounded-xl transition-colors relative z-20"
                    title={t('common.edit')}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const id = promo.id || promo._id;
                      if (!id) return;
                      
                      setItemToDelete(id.toString());
                      setIsDeletePromoModalOpen(true);
                    }}
                    className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-xl transition-colors relative z-20"
                    title={t('common.delete')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-bold text-foreground mb-1">{promo.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1">{promo.description || "No description provided"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-muted/50 p-3 rounded-2xl border border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{t('promo.type')}</p>
                  <p className="text-sm font-bold text-foreground">
                    {promo.type === 'percentage' ? `${promo.value}% Off` : promo.type === 'fixed' ? `$${promo.value} Flat` : t('menu.bogo')}
                  </p>
                </div>
                <div className="bg-muted/50 p-3 rounded-2xl border border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{t('promo.target')}</p>
                  <p className="text-sm font-bold text-foreground capitalize">
                    {promo.targetType === 'all' ? t('menu.all') : promo.targetType === 'category' ? `${promo.targetIds.length} categories` : `${promo.targetIds.length} items`}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
                  <Clock size={14} className="text-primary" />
                  <span>{promo.startTime} - {promo.endTime}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar size={14} className="text-primary" />
                  <div className="flex gap-1">
                    {DAYS.map((day, i) => (
                      <span 
                        key={day} 
                        className={cn(
                          "text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-md border",
                          promo.daysOfWeek.includes(i) 
                            ? "bg-primary/10 text-primary border-primary/20" 
                            : "bg-muted text-muted-foreground border-transparent"
                        )}
                      >
                        {day[0]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  promo.isActive ? "bg-green-500 animate-pulse" : "bg-gray-400"
                )} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {promo.isActive ? "Active on Schedule" : "Manually Disabled"}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {coupons.map((coupon, idx) => (
            <motion.div 
              layout
              key={coupon.id || coupon._id || `coupon-${idx}`}
              className="group bg-card p-6 rounded-[24px] border border-border shadow-sm hover:shadow-xl transition-all relative overflow-hidden"
            >
               <div className={cn(
                "absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-5 group-hover:scale-110 transition-transform pointer-events-none",
                coupon.active ? "bg-primary" : "bg-muted"
              )} />
              
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                  coupon.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {coupon.type}
                </div>
                <div className="flex items-center gap-2 relative z-10">
                  <button 
                    onClick={() => {
                        setEditingCoupon(coupon);
                        setCouponFormData({
                          ...coupon,
                          startDate: coupon.startDate ? format(new Date(coupon.startDate), "yyyy-MM-dd") : "",
                          endDate: coupon.endDate ? format(new Date(coupon.endDate), "yyyy-MM-dd") : ""
                        });
                        setIsCouponModalOpen(true);
                    }}
                    className="p-2 text-muted-foreground hover:bg-muted rounded-xl transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => {
                        setItemToDelete(coupon.id || coupon._id);
                        setIsDeleteCouponModalOpen(true);
                    }}
                    className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-xl transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                    <Tag size={14} className="text-primary" />
                    <h3 className="text-lg font-black text-foreground tracking-tight">{coupon.code}</h3>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">{coupon.description || "No description provided"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-muted/50 p-3 rounded-2xl border border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{t('promo.value')}</p>
                  <p className="text-sm font-bold text-foreground">
                    {coupon.type === 'percentage' || coupon.type === 'first_order' ? `${coupon.value}% Off` : coupon.type === 'bogo' ? "BOGO" : `$${coupon.value} Flat`}
                  </p>
                </div>
                <div className="bg-muted/50 p-3 rounded-2xl border border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Usage</p>
                  <p className="text-sm font-bold text-foreground">
                    {coupon.usageCount} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : "Used"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {coupon.minOrderAmount > 0 && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                        <div className="w-1 h-1 bg-primary rounded-full" />
                        Min Order: ${coupon.minOrderAmount}
                    </div>
                )}
                {coupon.endDate && (
                     <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                        <div className="w-1 h-1 bg-primary rounded-full" />
                        Expires: {format(new Date(coupon.endDate), "MMM dd, yyyy")}
                    </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-2xl bg-card rounded-[32px] shadow-2xl border border-border p-8 overflow-y-auto max-h-[90vh] no-scrollbar"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-display font-bold text-foreground">
                {editingPromotion ? t('admin.editPromotion') : t('admin.createPromotion')}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">{t('promo.name')}</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary transition-all text-foreground"
                    placeholder="e.g., Summer Happy Hour"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">{t('promo.type')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'percentage', label: '% Off', icon: Percent },
                      { id: 'fixed', label: '$ Back', icon: DollarSign },
                      { id: 'bogo', label: 'BOGO', icon: ShoppingBag }
                    ].map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: type.id as any })}
                        className={cn(
                          "flex flex-col items-center gap-1 p-3 rounded-xl border text-[10px] font-bold transition-all",
                          formData.type === type.id 
                            ? "bg-primary text-primary-foreground border-primary" 
                            : "bg-muted text-muted-foreground border-border hover:bg-accent"
                        )}
                      >
                        <type.icon size={16} />
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">
                    {t('promo.value')} {formData.type === 'percentage' ? '(%)' : formData.type === 'fixed' ? '($)' : ''}
                  </label>
                  <input
                    type="number"
                    required={formData.type !== 'bogo'}
                    disabled={formData.type === 'bogo'}
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary transition-all text-foreground"
                    placeholder={formData.type === 'percentage' ? "e.g. 20 for 20%" : formData.type === 'fixed' ? "e.g. 5 for $5" : "BOGO is 100% off 2nd item"}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">{t('promo.target')}</label>
                  <select
                    value={formData.targetType}
                    onChange={(e) => setFormData({ ...formData, targetType: e.target.value as any, targetIds: [] })}
                    className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary transition-all text-foreground appearance-none"
                  >
                    <option value="all">{t('menu.all')}</option>
                    <option value="category">Specific Categories</option>
                    <option value="item">Specific Items</option>
                  </select>
                </div>
              </div>

              {formData.targetType !== 'all' && (
                <div className="bg-muted/50 p-6 rounded-2xl border border-border">
                   <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 block">
                    {formData.targetType === 'category' ? "Select Categories" : "Select Items"} 
                    <span className="ml-2 lowercase font-normal opacity-70">({formData.targetIds?.length || 0} selected)</span>
                  </label>
                  <div className="flex flex-wrap gap-3 max-h-64 overflow-y-auto p-2 rounded-xl border border-dashed border-border/50 bg-muted/20">
                    {(formData.targetType === 'category' ? categories : menuItems).length > 0 ? (
                      (formData.targetType === 'category' ? categories : menuItems).map((item, idx) => (
                        <button
                          key={`${item.id}-${idx}`}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const ids = formData.targetIds || [];
                            if (ids.includes(item.id)) {
                              setFormData({ ...formData, targetIds: ids.filter(id => id !== item.id) });
                            } else {
                              setFormData({ ...formData, targetIds: [...ids, item.id] });
                            }
                          }}
                          className={cn(
                            "px-4 py-2 rounded-xl border text-xs font-bold transition-all min-h-[40px] flex items-center justify-center",
                            formData.targetIds?.includes(item.id)
                              ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-105"
                              : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-accent"
                          )}
                        >
                          {item.name || 'Unnamed'}
                        </button>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic p-4 w-full text-center">
                        No {formData.targetType === 'category' ? 'categories' : 'items'} found. Please add them to the menu first.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">{t('promo.startTime')}</label>
                   <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                      type="time"
                      required
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full pl-12 pr-6 py-4 bg-muted border border-border rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary transition-all text-foreground"
                    />
                   </div>
                </div>
                <div>
                   <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">{t('promo.endTime')}</label>
                   <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                      type="time"
                      required
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full pl-12 pr-6 py-4 bg-muted border border-border rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary transition-all text-foreground"
                    />
                   </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 block">{t('promo.days')}</label>
                <div className="flex justify-between gap-2">
                  {DAYS.map((day, i) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(i)}
                      className={cn(
                        "flex-1 py-4 rounded-xl border text-xs font-black transition-all",
                        formData.daysOfWeek?.includes(i)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-muted-foreground border-border hover:bg-accent"
                      )}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl border border-border">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 rounded-md border-border text-primary focus:ring-primary"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-foreground cursor-pointer select-none">
                  {t('promo.status')}
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-8 py-4 bg-muted text-foreground rounded-2xl font-bold hover:bg-accent transition-all"
                >
                  {t('inventory.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  {editingPromotion ? t('common.save') : t('common.add')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsCouponModalOpen(false)}
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-2xl bg-card rounded-[32px] shadow-2xl border border-border p-8 overflow-y-auto max-h-[90vh] no-scrollbar"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-display font-bold text-foreground">
                {editingCoupon ? "Edit Coupon" : "Create Coupon"}
              </h3>
              <button 
                onClick={() => setIsCouponModalOpen(false)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCouponSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Coupon Code</label>
                  <input
                    type="text"
                    required
                    value={couponFormData.code}
                    onChange={(e) => setCouponFormData({ ...couponFormData, code: e.target.value.toUpperCase() })}
                    className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-black uppercase tracking-widest focus:ring-2 focus:ring-primary transition-all text-foreground"
                    placeholder="e.g., SAVE20"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Type</label>
                  <select
                    value={couponFormData.type}
                    onChange={(e) => setCouponFormData({ ...couponFormData, type: e.target.value as any })}
                    className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary transition-all text-foreground appearance-none tracking-widest"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                    <option value="first_order">First Order (%)</option>
                    <option value="bogo">Buy 1 Get 1 (BOGO)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Description</label>
                <textarea
                  value={couponFormData.description}
                  onChange={(e) => setCouponFormData({ ...couponFormData, description: e.target.value })}
                  className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary transition-all text-foreground resize-none"
                  rows={2}
                  placeholder="Describe the offer..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Value</label>
                  <input
                    type="number"
                    value={couponFormData.value}
                    onChange={(e) => setCouponFormData({ ...couponFormData, value: parseFloat(e.target.value) })}
                    className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary transition-all text-foreground"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Min Order ($)</label>
                  <input
                    type="number"
                    value={couponFormData.minOrderAmount}
                    onChange={(e) => setCouponFormData({ ...couponFormData, minOrderAmount: parseFloat(e.target.value) })}
                    className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary transition-all text-foreground"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Usage Limit</label>
                  <input
                    type="number"
                    value={couponFormData.usageLimit}
                    onChange={(e) => setCouponFormData({ ...couponFormData, usageLimit: parseInt(e.target.value) })}
                    className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary transition-all text-foreground"
                    placeholder="Unlimited"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Start Date</label>
                  <input
                    type="date"
                    value={couponFormData.startDate}
                    onChange={(e) => setCouponFormData({ ...couponFormData, startDate: e.target.value })}
                    className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary transition-all text-foreground"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">End Date</label>
                  <input
                    type="date"
                    value={couponFormData.endDate}
                    onChange={(e) => setCouponFormData({ ...couponFormData, endDate: e.target.value })}
                    className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary transition-all text-foreground"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="flex-1 px-8 py-4 bg-muted text-foreground rounded-2xl font-bold hover:bg-accent transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-xs tracking-widest uppercase"
                >
                  {editingCoupon ? "Save Coupon" : "Create Coupon"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <ConfirmModal
        isOpen={isDeletePromoModalOpen}
        onClose={() => {
          setIsDeletePromoModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={async () => {
          if (itemToDelete) {
            await api.delete(`/promotions/${itemToDelete}`);
            toast.success("Promotion deleted");
            fetchPromotions();
            setIsDeletePromoModalOpen(false);
            setItemToDelete(null);
          }
        }}
        title="Delete Promotion"
        message="Are you sure you want to delete this promotion? This action cannot be undone."
        variant="danger"
      />

      <ConfirmModal
        isOpen={isDeleteCouponModalOpen}
        onClose={() => {
          setIsDeleteCouponModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={async () => {
          if (itemToDelete) {
            await api.delete(`/coupons/${itemToDelete}`);
            toast.success("Coupon deleted");
            fetchCoupons();
            setIsDeleteCouponModalOpen(false);
            setItemToDelete(null);
          }
        }}
        title="Delete Coupon"
        message="Are you sure you want to delete this coupon? This action cannot be undone."
        variant="danger"
      />
    </div>
  );
}
