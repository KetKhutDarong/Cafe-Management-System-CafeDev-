import { useState, useEffect, type ChangeEvent, type FormEvent, useRef } from "react";
import { Search, Plus, Filter, MoreVertical, Edit2, Trash2, Image as ImageIcon, Bell, Check, X, PlusCircle, Save, AlertCircle, Beaker } from "lucide-react";
import { cn } from "@/lib/utils";
import { MenuItem, Modifier, MenuItemVariant, InventoryItem, Ingredient } from "@/types";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: '1',
    name: 'Cappuccino',
    description: 'Rich espresso with a deep layer of foamed milk.',
    price: 4.50,
    category: 'Coffee',
    image: 'https://picsum.photos/seed/cappuccino/400/300',
    status: 'Active',
    variants: [
      { id: 'v1', name: 'Hot S', price: 4.00 },
      { id: 'v2', name: 'Hot M', price: 4.50 },
      { id: 'v3', name: 'Hot L', price: 5.00 },
      { id: 'v4', name: 'Iced M', price: 4.75 }
    ],
    modifiers: [
      { id: 'm1', name: 'Oat Milk', price: 0.50 },
      { id: 'm2', name: 'Extra Shot', price: 1.00 }
    ]
  },
  {
    id: '2',
    name: 'Butter Croissant',
    description: 'Flaky, buttery, and freshly baked every morning.',
    price: 3.00,
    category: 'Bakery',
    image: 'https://picsum.photos/seed/croissant/400/300',
    status: 'Active'
  },
  {
    id: '3',
    name: 'Iced Matcha Latte',
    description: 'Premium grade matcha with cold milk served over ice.',
    price: 5.50,
    category: 'Tea',
    image: 'https://picsum.photos/seed/matcha/400/300',
    status: 'Active',
    variants: [
      { id: 'v5', name: 'S', price: 5.00 },
      { id: 'v6', name: 'M', price: 5.50 },
      { id: 'v7', name: 'L', price: 6.00 }
    ]
  },
  {
    id: '4',
    name: 'Mango Smoothie',
    description: 'Fresh mango blended with yogurt and honey.',
    price: 6.00,
    category: 'Smoothie',
    image: 'https://picsum.photos/seed/mango/400/300',
    status: 'Sold Out'
  }
];

const CATEGORIES = [
  'Coffee',
  'Tea',
  'Smoothie',
  'Bakery',
  'Food'
];

import api from "@/services/api";
import * as notificationService from "@/services/notificationService";
import NotificationDropdown, { Notification } from "@/components/NotificationDropdown";
import ConfirmModal from "@/components/ConfirmModal";

import { useLanguage } from "@/LanguageContext";
import { useLocation } from "@/LocationContext";
import { useAuth } from "@/AuthContext";

export default function MenuManagement() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { currentLocation } = useLocation();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

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
      toast.error(t('common.error'));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>, mode: 'panel' | 'modal') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('image', file);

    setIsUploading(true);
    try {
      const response = await api.post('/auth/upload', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const imageUrl = response.data.url;
      
      if (mode === 'panel' && selectedItem) {
        setSelectedItem({ ...selectedItem, image: imageUrl });
      } else if (mode === 'modal') {
        setFormData(prev => ({ ...prev, image: imageUrl }));
      }
      
      toast.success(t('common.success'));
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.error || t('common.error'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearAll = async () => {
    try {
      await notificationService.clearNotifications();
      setNotifications([]);
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      const params = currentLocation ? { locationId: currentLocation.id || currentLocation._id } : {};
      const response = await api.get("/menu-items", { params });
      if (Array.isArray(response.data)) {
        setMenuItems(response.data);
        if (response.data.length > 0) {
          setSelectedItem(response.data[0]);
        }
      } else {
        console.error("Menu items response is not an array:", response.data);
        setMenuItems([]);
      }
    } catch (error: any) {
      console.error("Error fetching menu items:", error);
      toast.error(t('menu.loadError'));
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
    fetchNotifications();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [currentLocation]);

  // Use separate effect for inventory to handle permissions gracefully
  useEffect(() => {
    const checkAndFetchInventory = async () => {
      // Check if user has permission to manage inventory
      // We can't use hasPerm here easily as it's defined in parent, 
      // but we can check the user object directly.
      const isStaffModel = ['admin', 'manager', 'cashier', 'barista'].includes(user?.role || '');
      const hasInventoryPerm = user?.role === 'admin' || 
                              (user?.permissions?.manageInventory !== undefined ? user.permissions.manageInventory : user?.role === 'manager');
      
      if (hasInventoryPerm) {
        fetchInventory();
      }
    };
    checkAndFetchInventory();
  }, [user]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(t('menu.allItems'));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState<Partial<MenuItem>>({});
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const fetchInventory = async () => {
    try {
      const response = await api.get("/inventory");
      setInventory(response.data);
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    }
  };

  const filteredItems = (Array.isArray(menuItems) ? menuItems : []).filter(item => {
    const matchesSearch = (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (item.category || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === t('menu.allItems') || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddItem = () => {
    setModalMode('add');
    setFormData({
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      description: '',
      price: 0,
      category: 'Coffee',
      image: 'https://picsum.photos/seed/new/400/300',
      status: 'Active',
      locationId: currentLocation?.id || currentLocation?._id,
      isPromotion: false,
      promotionPrice: 0,
      promotionLabel: '',
      variants: [],
      modifiers: [],
      ingredients: []
    });
    setIsModalOpen(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setModalMode('edit');
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await api.delete(`/menu-items/${id}`);
      const updated = (Array.isArray(menuItems) ? menuItems : []).filter(item => item.id !== id);
      setMenuItems(updated);
      if (selectedItem?.id === id) {
        setSelectedItem(updated.length > 0 ? updated[0] : null);
      }
      toast.success(t('menu.successDelete'));
    } catch (error: any) {
      console.error("Error deleting menu item:", error);
      toast.error(t('menu.loadError'));
    }
  };

  const handleToggleStatus = async (item: MenuItem) => {
    const newStatus = item.status === 'Active' ? 'Sold Out' : 'Active';
    try {
      const response = await api.put(`/menu-items/${item.id}`, { ...item, status: newStatus });
      const updated = menuItems.map(i => i.id === item.id ? response.data : i);
      setMenuItems(updated);
      if (selectedItem?.id === item.id) {
        setSelectedItem(response.data);
      }
      toast.success(`${item.name} is now ${newStatus === 'Active' ? t('menu.active') : t('menu.soldOut')}`);
    } catch (error: any) {
      console.error("Error toggling status:", error);
      toast.error(t('common.error'));
    }
  };

  const sanitizeMenuItem = (item: any) => {
    const cleaned = { ...item };
    
    // Remove id from body to avoid potential conflict with _id
    delete cleaned.id;
    delete cleaned._id;

    // Filter out ingredients with no inventoryId or invalid one
    if (cleaned.ingredients) {
      cleaned.ingredients = cleaned.ingredients.filter((ing: any) => 
        ing.inventoryId && ing.inventoryId.trim() !== "" && ing.inventoryId !== "undefined"
      );
    }
    
    // Ensure numeric values are numbers
    if (cleaned.price !== undefined) {
      const p = parseFloat(cleaned.price as any);
      cleaned.price = isNaN(p) ? 0 : p;
    }
    if (cleaned.promotionPrice !== undefined) {
      const pp = parseFloat(cleaned.promotionPrice as any);
      cleaned.promotionPrice = isNaN(pp) ? undefined : pp;
    }

    return cleaned;
  };

  const handleModalSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const sanitizedData = sanitizeMenuItem(formData);
    try {
      if (modalMode === 'add') {
        const response = await api.post("/menu-items", sanitizedData);
        setMenuItems([...menuItems, response.data]);
        setSelectedItem(response.data);
        toast.success(t('menu.successAdd'));
      } else {
        const response = await api.put(`/menu-items/${formData.id}`, sanitizedData);
        const updated = menuItems.map(i => i.id === formData.id ? response.data : i);
        setMenuItems(updated);
        if (selectedItem?.id === formData.id) {
          setSelectedItem(response.data);
        }
        toast.success(t('menu.successUpdate'));
      }
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Error saving menu item:", error);
      toast.error(error.response?.data?.error || t('menu.loadError'));
    }
  };

  const handleSavePanel = async () => {
    if (!selectedItem) return;
    const sanitizedData = sanitizeMenuItem(selectedItem);
    try {
      const response = await api.put(`/menu-items/${selectedItem.id}`, sanitizedData);
      const updated = menuItems.map(i => i.id === selectedItem.id ? response.data : i);
      setMenuItems(updated);
      setSelectedItem(response.data);
      toast.success(t('menu.successUpdate'));
    } catch (error: any) {
      console.error("Error saving menu item:", error);
      toast.error(error.response?.data?.error || t('menu.loadError'));
    }
  };

  const [showMobileEdit, setShowMobileEdit] = useState(false);

  useEffect(() => {
    if (selectedItem) {
      // On mobile, when an item is selected, we might want to show the edit panel
      // But we'll let the user click to open it or show it automatically on larger screens
    }
  }, [selectedItem]);

  return (
    <div className="p-4 sm:p-8 h-full flex flex-col bg-background transition-colors duration-300">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-card-foreground">{t('menu.mgmtTitle')}</h2>
          <p className="text-muted-foreground text-sm mt-1">{t('menu.mgmtSubtitle')}</p>
        </div>
        <div className="flex items-center gap-4">
          <NotificationDropdown 
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onClearAll={handleClearAll}
          />
          <button 
            onClick={handleAddItem}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={18} />
            {t('menu.addItem')}
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0 overflow-hidden">
        {/* Menu List */}
        <div className={cn(
          "flex-1 bg-card rounded-xl shadow-sm flex flex-col overflow-hidden border border-border transition-all duration-300",
          showMobileEdit ? "hidden lg:flex" : "flex"
        )}>
          <div className="p-6 sm:p-8 border-b border-border flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('menu.search')}
                className="w-full pl-12 pr-4 py-3 bg-muted border-none rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
              {[t('menu.allItems'), ...CATEGORIES].map((filter, i) => (
                <button
                  key={`filter-${i}-${filter}`}
                  onClick={() => setActiveCategory(filter)}
                  className={cn(
                    "px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                    activeCategory === filter ? "bg-primary text-primary-foreground shadow-lg" : "bg-muted text-muted-foreground hover:bg-accent/50"
                  )}
                >
                  {filter === t('menu.allItems') ? filter : t(`inventory.category${filter}` as any)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="border-b border-border">
                  <th className="px-8 py-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('menu.image')}</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('menu.name')}</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('menu.category')}</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('menu.price')}</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('menu.status')}</th>
                  <th className="px-8 py-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.map((item, idx) => (
                  <tr 
                    key={`menu-item-${item.id || (item as any)._id || idx}-${idx}`} 
                    onClick={() => {
                      setSelectedItem(item);
                      if (window.innerWidth < 1024) setShowMobileEdit(true);
                    }}
                    className={cn(
                      "group cursor-pointer transition-colors",
                      selectedItem?.id === item.id ? "bg-primary/10" : "hover:bg-muted/50"
                    )}
                  >
                    <td className="px-8 py-6">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-muted border-2 border-card shadow-sm">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-foreground">{item.name}</p>
                          {item.isPromotion && item.promotionPrice !== undefined && item.promotionPrice > 0 && item.price > 0 && item.promotionPrice < item.price && (
                            <span className="px-2 py-0.5 bg-red-500 text-white text-[8px] font-bold rounded-md uppercase tracking-wider animate-pulse whitespace-nowrap">
                              {Math.max(1, Math.min(99, Math.round((1 - item.promotionPrice / item.price) * 100)))}% OFF
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest truncate max-w-[150px]">{item.description}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-widest",
                        item.category === t('inventory.categoryCoffee') ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                        item.category === t('inventory.categoryTea') ? "bg-stone-500/10 text-stone-600 dark:text-stone-400" :
                        item.category === t('inventory.categorySmoothie') ? "bg-purple-500/10 text-purple-600 dark:text-purple-400" :
                        "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                      )}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      {item.isPromotion && item.promotionPrice !== undefined && item.promotionPrice > 0 ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-red-500">${item.promotionPrice.toFixed(2)}</span>
                          <span className="text-[10px] text-muted-foreground line-through">${item.price.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="text-sm font-bold text-foreground">${item.price.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleToggleStatus(item); }}
                        className="flex items-center gap-2 group/status"
                      >
                        <div className={cn(
                          "w-2 h-2 rounded-full transition-all group-hover/status:scale-125",
                          item.status === 'Active' ? "bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" : "bg-destructive shadow-[0_0_8px_rgba(var(--destructive-rgb),0.5)]"
                        )} />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-muted-foreground">{item.status === 'Active' ? t('menu.active') : t('menu.soldOut')}</span>
                        </div>
                      </button>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEditItem(item); }}
                          className="p-2 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setItemToDelete(item.id); 
                            setIsConfirmOpen(true); 
                          }}
                          className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Edit Panel */}
        <div className={cn(
          "w-full lg:w-[450px] bg-card rounded-[40px] shadow-sm flex flex-col overflow-hidden border border-border transition-all duration-300",
          showMobileEdit ? "flex" : "hidden lg:flex"
        )}>
          {!selectedItem ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
              <ImageIcon size={48} strokeWidth={1} className="mb-4 opacity-20" />
              <p className="text-sm font-medium">{t('menu.selectItem')}</p>
              <p className="text-[10px] uppercase tracking-widest mt-2 opacity-50">{t('menu.chooseFromList')}</p>
            </div>
          ) : (
            <>
              <div className="p-6 sm:p-8 border-b border-border flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setShowMobileEdit(false)}
                    className="lg:hidden p-2 bg-card rounded-xl shadow-sm"
                  >
                    <X size={20} className="text-muted-foreground" />
                  </button>
                  <h3 className="text-xl font-display font-bold text-foreground">{t('menu.quickEdit')}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleToggleStatus(selectedItem)}
                    className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                      selectedItem.status === 'Active' ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                    )}
                  >
                    {selectedItem.status === 'Active' ? t('menu.active') : t('menu.soldOut')}
                  </button>
                  <button 
                    onClick={() => {
                      setItemToDelete(selectedItem.id);
                      setIsConfirmOpen(true);
                    }}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('menu.itemImage')}</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative h-48 rounded-xl overflow-hidden group cursor-pointer border-4 border-muted"
              >
                {isUploading ? (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : null}
                <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                  <ImageIcon size={32} className="mb-2" />
                  <span className="text-xs font-bold uppercase tracking-widest">{t('menu.changeImage')}</span>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'panel')}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('menu.itemName')}</label>
                <input
                  type="text"
                  value={selectedItem.name || ""}
                  onChange={(e) => setSelectedItem({ ...selectedItem, name: e.target.value })}
                  className="w-full py-4 px-6 bg-muted border-none rounded-xl text-sm font-medium text-foreground focus:ring-2 focus:ring-primary transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('menu.category')}</label>
                  <select 
                    value={selectedItem.category || ""}
                    onChange={(e) => setSelectedItem({ ...selectedItem, category: e.target.value })}
                    className="w-full py-4 px-6 bg-muted border-none rounded-xl text-sm font-medium text-foreground focus:ring-2 focus:ring-primary transition-all appearance-none"
                  >
                    {CATEGORIES.map((cat: string) => <option key={cat} value={cat}>{t(`inventory.category${cat}` as any)}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('menu.basePrice')} ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={isNaN(selectedItem.price) ? '' : selectedItem.price}
                    onChange={(e) => {
                      const newPrice = e.target.value === '' ? NaN : parseFloat(e.target.value);
                      const oldPrice = selectedItem.price;
                      const updatedVariants = selectedItem.variants?.map(v => {
                        if (v.price === oldPrice) return { ...v, price: newPrice };
                        return v;
                      });
                      setSelectedItem({ ...selectedItem, price: newPrice, variants: updatedVariants });
                    }}
                    className="w-full py-4 px-6 bg-muted border-none rounded-xl text-sm font-medium text-foreground focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              {/* Recipe Ingredients Section - MOVED HIGHER FOR BETTER VISIBILITY */}
              <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Beaker className="text-primary" size={16} />
                    <label className="text-xs font-bold text-foreground uppercase tracking-widest">{t('inventory.ingredients' as any) || 'Recipe Ingredients'}</label>
                  </div>
                  <button 
                    onClick={() => {
                      const newIngredient: Ingredient = { inventoryId: '', name: '', quantity: 0, unit: '' };
                      setSelectedItem({ ...selectedItem, ingredients: [...(selectedItem.ingredients || []), newIngredient] });
                    }}
                    className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all"
                  >
                    <Plus size={12} />
                    {t('common.add')}
                  </button>
                </div>
                <div className="space-y-2">
                  {selectedItem.ingredients?.map((ing, idx) => (
                    <div key={`panel-ing-${idx}-${ing.inventoryId || 'new'}`} className="flex flex-col gap-2 p-3 bg-card rounded-xl border border-border shadow-sm">
                      <div className="flex items-center gap-2">
                        <select 
                          value={ing.inventoryId}
                          onChange={(e) => {
                            const invItem = inventory.find(i => (i as any).id === e.target.value || (i as any)._id === e.target.value);
                            const newIngs = [...(selectedItem.ingredients || [])];
                            newIngs[idx] = { 
                              ...newIngs[idx], 
                              inventoryId: e.target.value,
                              name: invItem?.name || '',
                              unit: invItem?.unit || ''
                            };
                            setSelectedItem({ ...selectedItem, ingredients: newIngs });
                          }}
                          className="flex-1 bg-transparent border-none p-0 text-xs font-bold focus:ring-0 text-foreground appearance-none cursor-pointer"
                        >
                          <option value="">{t('inventory.selectItem')}</option>
                          {inventory.map((i, invIdx) => (
                            <option key={`opt-inv-${(i as any).id || (i as any)._id || invIdx}-${invIdx}`} value={(i as any).id || (i as any)._id}>{i.name}</option>
                          ))}
                        </select>
                        <button 
                          onClick={() => {
                            const newIngs = selectedItem.ingredients?.filter((_, i) => i !== idx);
                            setSelectedItem({ ...selectedItem, ingredients: newIngs });
                          }}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-1 bg-muted/50 rounded-lg px-2 py-1.5 border border-border">
                          <input 
                            type="number"
                            step="0.1"
                            placeholder="Qty"
                            className="w-full bg-transparent border-none p-0 text-[10px] font-bold focus:ring-0 text-foreground" 
                            value={isNaN(ing.quantity) ? '' : ing.quantity}
                            onChange={(e) => {
                              const val = e.target.value === '' ? NaN : parseFloat(e.target.value);
                              const newIngs = [...(selectedItem.ingredients || [])];
                              newIngs[idx].quantity = val;
                              setSelectedItem({ ...selectedItem, ingredients: newIngs });
                            }}
                          />
                          <span className="text-[10px] text-muted-foreground font-bold">{ing.unit}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!selectedItem.ingredients || selectedItem.ingredients.length === 0) && (
                    <div className="text-center py-6 px-4 bg-muted/20 border border-dashed border-border rounded-xl">
                      <Beaker className="mx-auto text-muted-foreground/30 mb-2" size={24} />
                      <p className="text-[10px] text-muted-foreground italic font-medium leading-relaxed">
                        {t('menu.noIngredients' as any) || 'No ingredients defined'}. <br/>
                        {t('menu.addIngredientsHint' as any) || 'Add ingredients like Espresso Beans.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('menu.description')}</label>
                <textarea
                  rows={3}
                  value={selectedItem.description || ""}
                  onChange={(e) => setSelectedItem({ ...selectedItem, description: e.target.value })}
                  className="w-full py-4 px-6 bg-muted border-none rounded-xl text-sm font-medium text-foreground focus:ring-2 focus:ring-primary transition-all resize-none"
                />
              </div>

              {/* Promotion Section */}
              <div className="p-6 bg-primary/5 rounded-[32px] border border-primary/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-primary">{t('menu.promote')}</h4>
                    <p className="text-[10px] text-muted-foreground">{t('menu.promoteDesc' as any) || 'Special discounts and targeted promotions'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedItem({ ...selectedItem, isPromotion: !selectedItem.isPromotion })}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative transition-colors",
                      selectedItem.isPromotion ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <motion.div 
                      initial={false}
                      animate={{ x: selectedItem.isPromotion ? 24 : 0 }}
                      className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm"
                    />
                  </button>
                </div>

                {selectedItem.isPromotion && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="grid grid-cols-2 gap-4 pt-2"
                  >
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Discount %</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={selectedItem.price > 0 && selectedItem.promotionPrice !== undefined && selectedItem.promotionPrice > 0 ? Math.round((1 - selectedItem.promotionPrice / selectedItem.price) * 100) : ""}
                          onChange={(e) => {
                            const pct = parseFloat(e.target.value) || 0;
                            const newPrice = (selectedItem.price || 0) * (1 - pct / 100);
                            setSelectedItem({ ...selectedItem, promotionPrice: Math.max(0, Math.round(newPrice * 100) / 100) });
                          }}
                          className="w-full py-3 px-4 bg-card border border-border rounded-xl text-sm font-medium text-foreground focus:ring-2 focus:ring-primary transition-all"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('menu.promotionPrice')}</label>
                      <input
                        type="number"
                        step="0.01"
                        value={selectedItem.promotionPrice || ""}
                        onChange={(e) => setSelectedItem({ ...selectedItem, promotionPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full py-3 px-4 bg-card border border-border rounded-xl text-sm font-medium text-foreground focus:ring-2 focus:ring-primary transition-all"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Variants Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('menu.variants')} (Hot/Iced, Size)</label>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        const newVariants = selectedItem.variants?.map(v => ({ ...v, price: selectedItem.price }));
                        setSelectedItem({ ...selectedItem, variants: newVariants });
                        toast.success(t('menu.successUpdate'));
                      }}
                      className="text-info text-[10px] font-bold uppercase tracking-widest hover:underline"
                    >
                      {t('menu.syncPrices')}
                    </button>
                    <button 
                      onClick={() => {
                        const newVariant = { id: Math.random().toString(), name: 'New Variant', price: selectedItem.price };
                        setSelectedItem({ ...selectedItem, variants: [...(selectedItem.variants || []), newVariant] });
                      }}
                      className="text-primary text-[10px] font-bold uppercase tracking-widest hover:underline"
                    >
                      {t('menu.addSize')}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {selectedItem.variants?.map((variant, idx) => (
                    <div key={`variant-${variant.id || idx}-${idx}`} className="flex items-center gap-2 p-3 bg-muted rounded-xl">
                      <input 
                        className="flex-1 bg-transparent border-none p-0 text-xs font-bold focus:ring-0 text-foreground" 
                        value={variant.name}
                        onChange={(e) => {
                          const newVariants = [...(selectedItem.variants || [])];
                          newVariants[idx].name = e.target.value;
                          setSelectedItem({ ...selectedItem, variants: newVariants });
                        }}
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">$</span>
                        <input 
                          type="number"
                          step="0.01"
                          className="w-16 bg-transparent border-none p-0 text-xs font-bold focus:ring-0 text-right text-foreground" 
                          value={isNaN(variant.price) ? '' : variant.price}
                          onChange={(e) => {
                            const val = e.target.value === '' ? NaN : parseFloat(e.target.value);
                            const newVariants = [...(selectedItem.variants || [])];
                            newVariants[idx].price = val;
                            setSelectedItem({ ...selectedItem, variants: newVariants });
                          }}
                        />
                      </div>
                      <button 
                        onClick={() => {
                          const newVariants = selectedItem.variants?.filter((_, i) => i !== idx);
                          setSelectedItem({ ...selectedItem, variants: newVariants });
                        }}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {(!selectedItem.variants || selectedItem.variants.length === 0) && (
                    <p className="text-[10px] text-muted-foreground italic text-center py-2">{t('menu.noVariants')}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('menu.modifiers')}</label>
                  <button 
                    onClick={() => {
                      const newModifier = { id: Math.random().toString(), name: 'New Modifier', price: 0.50 };
                      setSelectedItem({ ...selectedItem, modifiers: [...(selectedItem.modifiers || []), newModifier] });
                    }}
                    className="text-primary text-[10px] font-bold uppercase tracking-widest hover:underline"
                  >
                    {t('menu.addModifier')}
                  </button>
                </div>
                <div className="space-y-2">
                  {selectedItem.modifiers?.map((mod, idx) => (
                    <div key={`mod-${mod.id || idx}-${idx}`} className="flex items-center gap-2 p-3 bg-muted rounded-xl">
                      <input 
                        className="flex-1 bg-transparent border-none p-0 text-xs font-bold focus:ring-0 text-foreground" 
                        value={mod.name}
                        onChange={(e) => {
                          const newMods = [...(selectedItem.modifiers || [])];
                          newMods[idx].name = e.target.value;
                          setSelectedItem({ ...selectedItem, modifiers: newMods });
                        }}
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">+$</span>
                        <input 
                          type="number"
                          step="0.01"
                          className="w-16 bg-transparent border-none p-0 text-xs font-bold focus:ring-0 text-right text-foreground" 
                          value={isNaN(mod.price) ? '' : mod.price}
                          onChange={(e) => {
                            const val = e.target.value === '' ? NaN : parseFloat(e.target.value);
                            const newMods = [...(selectedItem.modifiers || [])];
                            newMods[idx].price = val;
                            setSelectedItem({ ...selectedItem, modifiers: newMods });
                          }}
                        />
                      </div>
                      <button 
                        onClick={() => {
                          const newMods = selectedItem.modifiers?.filter((_, i) => i !== idx);
                          setSelectedItem({ ...selectedItem, modifiers: newMods });
                        }}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {(!selectedItem.modifiers || selectedItem.modifiers.length === 0) && (
                    <p className="text-[10px] text-muted-foreground italic text-center py-2">{t('menu.noModifiers')}</p>
                  )}
                </div>
              </div>

            </div>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => {
                  const original = menuItems.find(i => i.id === selectedItem.id);
                  if (original) setSelectedItem(original);
                }}
                className="flex-1 py-4 border border-border rounded-2xl font-bold text-sm text-muted-foreground hover:bg-muted transition-all"
              >
                {t('menu.reset')}
              </button>
              <button 
                onClick={handleSavePanel}
                className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {t('menu.saveChanges')}
              </button>
            </div>
          </div>
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-card rounded-[40px] shadow-2xl overflow-hidden border border-border"
            >
              <div className="p-8 border-b border-border flex items-center justify-between bg-muted/30">
                <div>
                  <h3 className="text-2xl font-display font-bold text-foreground">
                    {modalMode === 'add' ? t('menu.addNewItem') : t('menu.editMenuItem')}
                  </h3>
                  <p className="text-muted-foreground text-sm">{t('menu.fillDetails')}</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-card rounded-full transition-colors"
                >
                  <X size={24} className="text-muted-foreground" />
                </button>
              </div>

              <form onSubmit={handleModalSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('menu.itemName')}</label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full py-4 px-6 bg-muted border-none rounded-2xl text-sm font-medium text-foreground focus:ring-2 focus:ring-primary transition-all"
                      placeholder={t('menu.placeholderName')}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('menu.category')}</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full py-4 px-6 bg-muted border-none rounded-2xl text-sm font-medium text-foreground focus:ring-2 focus:ring-primary transition-all appearance-none"
                    >
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{t(`inventory.category${cat}` as any)}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('menu.description')}</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full py-4 px-6 bg-muted border-none rounded-2xl text-sm font-medium text-foreground focus:ring-2 focus:ring-primary transition-all resize-none"
                    placeholder={t('menu.placeholderDesc')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('menu.basePrice')} ($)</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={isNaN(formData.price!) ? '' : formData.price}
                      onChange={(e) => {
                        const newPrice = e.target.value === '' ? NaN : parseFloat(e.target.value);
                        const oldPrice = formData.price || 0;
                        const updatedVariants = formData.variants?.map(v => {
                          if (v.price === oldPrice) return { ...v, price: newPrice };
                          return v;
                        });
                        setFormData({ ...formData, price: newPrice, variants: updatedVariants });
                      }}
                      className="w-full py-4 px-6 bg-muted border-none rounded-2xl text-sm font-medium text-foreground focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('menu.status')}</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full py-4 px-6 bg-muted border-none rounded-2xl text-sm font-medium text-foreground focus:ring-2 focus:ring-primary transition-all appearance-none"
                    >
                      <option value="Active">{t('menu.active')}</option>
                      <option value="Sold Out">{t('menu.soldOut')}</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('menu.imageUrl')}</label>
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        className="w-full py-4 px-6 bg-muted border-none rounded-2xl text-sm font-medium text-foreground focus:ring-2 focus:ring-primary transition-all"
                        placeholder={t('menu.placeholderUrl')}
                      />
                      <button 
                        type="button"
                        onClick={() => modalFileInputRef.current?.click()}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 transition-colors"
                      >
                        <ImageIcon size={20} />
                      </button>
                    </div>
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-muted border border-border relative">
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <input 
                      type="file" 
                      ref={modalFileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'modal')}
                    />
                  </div>
                </div>

                {/* Promotion Section */}
                <div className="p-6 bg-primary/5 rounded-[32px] border border-primary/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-primary">{t('menu.promote')}</h4>
                      <p className="text-[10px] text-muted-foreground">{t('menu.promoteDesc' as any) || 'Special discounts and targeted promotions'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isPromotion: !formData.isPromotion })}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative transition-colors",
                        formData.isPromotion ? "bg-primary" : "bg-muted"
                      )}
                    >
                      <motion.div 
                        initial={false}
                        animate={{ x: formData.isPromotion ? 24 : 0 }}
                        className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm"
                      />
                    </button>
                  </div>

                  {formData.isPromotion && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="grid grid-cols-2 gap-4 pt-2"
                    >
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Discount %</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={formData.price !== undefined && formData.price > 0 && formData.promotionPrice !== undefined && formData.promotionPrice > 0 ? Math.round((1 - formData.promotionPrice / formData.price) * 100) : ""}
                            onChange={(e) => {
                              const pct = parseFloat(e.target.value) || 0;
                              const newPrice = (formData.price || 0) * (1 - pct / 100);
                              setFormData({ ...formData, promotionPrice: Math.max(0, Math.round(newPrice * 100) / 100) });
                            }}
                            className="w-full py-3 px-4 bg-card border border-border rounded-xl text-sm font-medium text-foreground focus:ring-2 focus:ring-primary transition-all"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('menu.promotionPrice')}</label>
                        <input
                          type="number"
                          step="0.01"
                          value={isNaN(formData.promotionPrice!) ? '' : formData.promotionPrice}
                          onChange={(e) => setFormData({ ...formData, promotionPrice: e.target.value === '' ? NaN : parseFloat(e.target.value) })}
                          className="w-full py-3 px-4 bg-card border border-border rounded-xl text-sm font-medium text-foreground focus:ring-2 focus:ring-primary transition-all"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Recipe Ingredients Section */}
                <div className="p-6 bg-primary/5 rounded-[32px] border border-primary/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Beaker className="text-primary" size={20} />
                      <label className="text-sm font-bold text-foreground uppercase tracking-widest">{t('inventory.ingredients' as any) || 'Recipe Ingredients'}</label>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        const newIngredient: Ingredient = { inventoryId: '', name: '', quantity: 0, unit: '' };
                        setFormData({ ...formData, ingredients: [...(formData.ingredients || []), newIngredient] });
                      }}
                      className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                    >
                      <Plus size={14} />
                      {t('common.add')}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.ingredients?.map((ing, idx) => (
                      <div key={`modal-ing-${idx}-${ing.inventoryId || 'new'}`} className="flex flex-col gap-3 p-4 bg-card rounded-[24px] border border-border shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 relative">
                            <select 
                              value={ing.inventoryId}
                              onChange={(e) => {
                                const invItem = inventory.find(i => (i as any).id === e.target.value || (i as any)._id === e.target.value);
                                const newIngs = [...(formData.ingredients || [])];
                                newIngs[idx] = { 
                                  ...newIngs[idx], 
                                  inventoryId: e.target.value,
                                  name: invItem?.name || '',
                                  unit: invItem?.unit || ''
                                };
                                setFormData({ ...formData, ingredients: newIngs });
                              }}
                              className="w-full bg-muted border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary text-foreground appearance-none cursor-pointer"
                            >
                              <option value="">{t('inventory.selectItem')}</option>
                              {inventory.map((i, invIdx) => (
                                <option key={`modal-opt-inv-${(i as any).id || (i as any)._id || invIdx}-${invIdx}`} value={(i as any).id || (i as any)._id}>{i.name}</option>
                              ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                              <PlusCircle size={14} className="text-muted-foreground rotate-45" />
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => {
                              const newIngs = formData.ingredients?.filter((_, i) => i !== idx);
                              setFormData({ ...formData, ingredients: newIngs });
                            }}
                            className="p-2 text-muted-foreground hover:text-destructive transition-colors bg-muted rounded-xl"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 flex items-center gap-2 bg-muted rounded-xl px-4 py-3 border border-transparent focus-within:border-primary/30 transition-all">
                            <input 
                              type="number"
                              step="0.1"
                              placeholder="Quantity"
                              className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0 text-foreground" 
                              value={isNaN(ing.quantity) ? '' : ing.quantity}
                              onChange={(e) => {
                                const val = e.target.value === '' ? NaN : parseFloat(e.target.value);
                                const newIngs = [...(formData.ingredients || [])];
                                newIngs[idx].quantity = val;
                                setFormData({ ...formData, ingredients: newIngs });
                              }}
                            />
                            <span className="text-xs text-muted-foreground font-bold bg-background px-2 py-1 rounded-lg border border-border">{ing.unit || '-'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!formData.ingredients || formData.ingredients.length === 0) && (
                      <div className="text-center py-10 px-6 bg-muted/20 border-2 border-dashed border-border rounded-[32px]">
                        <Beaker className="mx-auto text-muted-foreground/20 mb-4" size={40} />
                        <p className="text-sm text-muted-foreground italic font-medium max-w-[200px] mx-auto leading-relaxed">
                          {t('menu.noIngredients' as any) || 'No ingredients defined'}. <br/>
                          <span className="text-xs opacity-75">{t('menu.addIngredientsHint' as any) || 'Add ingredients like Espresso Beans.'}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

              <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 border border-border rounded-2xl font-bold text-sm text-muted-foreground hover:bg-muted transition-all"
                  >
                    {t('common.cancel')}
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-xl shadow-primary/20"
                  >
                    {modalMode === 'add' ? t('menu.addItem') : t('menu.updateItem')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => itemToDelete && handleDeleteItem(itemToDelete)}
        title={t('menu.deleteConfirmTitle') || 'Delete Item'}
        message={t('menu.confirmDelete')}
      />
    </div>
  );
}
