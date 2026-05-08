import { useState, type ReactNode, useRef, useEffect } from "react";
import { Search, Coffee, IceCream, Leaf, Croissant, Sandwich, ShoppingBag, Plus, Minus, Trash2, ArrowRight, QrCode, X, Check, User, LogOut, History, Globe, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { MenuItem, CartItem, MenuItemVariant, Modifier } from "@/types";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/AuthContext";
import { useLanguage } from "@/LanguageContext";
import { useLocation } from "@/LocationContext";
import { useTheme } from "@/ThemeContext";
import { Moon, Sun, MessageSquare } from "lucide-react";
import SupportModal from "@/components/SupportModal";

const COFFEE_MODIFIERS: Modifier[] = [
  { id: 'm1', name: 'Extra Shot', price: 0.5 },
  { id: 'm2', name: 'Oat Milk', price: 0.75 },
  { id: 'm3', name: 'Vanilla Syrup', price: 0.5 },
  { id: 'm4', name: 'Caramel Drizzle', price: 0.5 },
  { id: 'm5', name: 'Whipped Cream', price: 0.5 }
];

const TEA_MODIFIERS: Modifier[] = [
  { id: 't1', name: 'Honey', price: 0.5 },
  { id: 't2', name: 'Lemon Slice', price: 0.25 },
  { id: 't3', name: 'Chia Seeds', price: 0.75 },
  { id: 't4', name: 'Oat Milk', price: 0.75 }
];

const SMOOTHIE_MODIFIERS: Modifier[] = [
  { id: 's1', name: 'Protein Powder', price: 1.0 },
  { id: 's2', name: 'Chia Seeds', price: 0.75 },
  { id: 's3', name: 'Extra Fruit', price: 1.0 },
  { id: 's4', name: 'Honey', price: 0.5 }
];

const BAKERY_MODIFIERS: Modifier[] = [
  { id: 'b1', name: 'Extra Butter', price: 0.25 },
  { id: 'b2', name: 'Jam', price: 0.5 },
  { id: 'b3', name: 'Cream Cheese', price: 0.75 },
  { id: 'b4', name: 'Warm Up', price: 0.0 }
];

const SAVORY_MODIFIERS: Modifier[] = [
  { id: 'sv1', name: 'Extra Egg', price: 1.0 },
  { id: 'sv2', name: 'Add Bacon', price: 1.5 },
  { id: 'sv3', name: 'Side Salad', price: 2.0 },
  { id: 'sv4', name: 'Sriracha', price: 0.25 },
  { id: 'sv5', name: 'Warm Up', price: 0.0 }
];

const getItemTranslationKey = (name: string) => {
  return `menu.item.${name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_+|_+$)/g, '')}.name`;
};

const MENU_ITEMS: MenuItem[] = [
  {
    id: '1',
    name: 'Cappuccino',
    description: 'Rich espresso with a deep layer of foamed milk.',
    price: 4.50,
    category: 'Coffee',
    image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&q=80&w=1000',
    status: 'Active',
    variants: [
      { id: 'v1', name: 'Small', price: 4.00 },
      { id: 'v2', name: 'Medium', price: 4.50 },
      { id: 'v3', name: 'Large', price: 5.00 }
    ],
    modifiers: COFFEE_MODIFIERS
  },
  {
    id: '2',
    name: 'Butter Croissant',
    description: 'Flaky, buttery, and freshly baked every morning.',
    price: 3.00,
    category: 'Bakery',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=1000',
    status: 'Active',
    modifiers: BAKERY_MODIFIERS
  },
  {
    id: '3',
    name: 'Iced Matcha Latte',
    description: 'Premium grade matcha with cold milk served over ice.',
    price: 5.50,
    category: 'Tea',
    image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&q=80&w=1000',
    status: 'Active',
    variants: [
      { id: 'v5', name: 'Small', price: 5.00 },
      { id: 'v6', name: 'Medium', price: 5.50 },
      { id: 'v7', name: 'Large', price: 6.00 }
    ],
    modifiers: TEA_MODIFIERS
  },
  {
    id: '4',
    name: 'Mango Smoothie',
    description: 'Fresh mango blended with yogurt and honey.',
    price: 6.00,
    category: 'Smoothie',
    image: 'https://images.unsplash.com/photo-1550586678-f7225f03c44b?auto=format&fit=crop&q=80&w=1000',
    status: 'Sold Out',
    modifiers: SMOOTHIE_MODIFIERS
  },
  {
    id: '5',
    name: 'Blueberry Muffin',
    description: 'Freshly baked with real blueberries and a crumbly top.',
    price: 3.25,
    category: 'Bakery',
    image: 'https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&q=80&w=1000',
    status: 'Active',
    modifiers: BAKERY_MODIFIERS
  },
  {
    id: '6',
    name: 'Avocado Cream',
    description: 'Creamy avocado blended with condensed milk and ice.',
    price: 6.00,
    category: 'Smoothie',
    image: 'https://images.unsplash.com/photo-1525385133335-842822916523?q=80&w=1000&auto=format&fit=crop',
    status: 'Active',
    modifiers: SMOOTHIE_MODIFIERS
  },
  {
    id: '7',
    name: 'Strawberry Banana',
    description: 'Classic blend of fresh strawberries and ripe bananas.',
    price: 5.80,
    category: 'Smoothie',
    image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?q=80&w=1000&auto=format&fit=crop',
    status: 'Active',
    modifiers: SMOOTHIE_MODIFIERS
  },
  {
    id: '8',
    name: 'Avocado Toast',
    description: 'Whole grain toast topped with mashed avocado, poached egg, and red pepper flakes.',
    price: 7.50,
    category: 'Savory',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=1000&auto=format&fit=crop',
    status: 'Active',
    modifiers: SAVORY_MODIFIERS
  },
  {
    id: '9',
    name: 'Smoked Salmon Bagel',
    description: 'Toasted bagel with cream cheese, smoked salmon, capers, and red onion.',
    price: 8.50,
    category: 'Savory',
    image: 'https://images.unsplash.com/photo-1510225816859-00cc3f62803b?q=80&w=1000&auto=format&fit=crop',
    status: 'Active',
    modifiers: SAVORY_MODIFIERS
  },
  {
    id: '10',
    name: 'Grilled Chicken Sandwich',
    description: 'Grilled chicken breast, pesto, fresh mozzarella, and tomato on ciabatta.',
    price: 9.50,
    category: 'Savory',
    image: 'https://images.unsplash.com/photo-1524397057410-1e775ed476f3?q=80&w=1000&auto=format&fit=crop',
    status: 'Active',
    modifiers: SAVORY_MODIFIERS
  },
  {
    id: '11',
    name: 'Quiche Lorraine',
    description: 'Classic French quiche with bacon, shallots, and Swiss cheese in a buttery crust.',
    price: 6.50,
    category: 'Savory',
    image: 'https://images.unsplash.com/photo-1628191139360-4083564d03fd?q=80&w=1000&auto=format&fit=crop',
    status: 'Active',
    modifiers: SAVORY_MODIFIERS
  },
  {
    id: '12',
    name: 'Eggs Benedict',
    description: 'Two poached eggs and Canadian bacon on an English muffin, topped with hollandaise sauce.',
    price: 11.00,
    category: 'Savory',
    image: 'https://images.unsplash.com/photo-1600326145359-3a44909d1a39?q=80&w=1000&auto=format&fit=crop',
    status: 'Active',
    modifiers: SAVORY_MODIFIERS
  },
  {
    id: '13',
    name: 'Tuna Melt Panini',
    description: 'Tuna salad, melted cheddar cheese, and pickles on sourdough bread.',
    price: 8.00,
    category: 'Savory',
    image: 'https://images.unsplash.com/photo-1621852003158-ac3f9540bc7a?q=80&w=1000&auto=format&fit=crop',
    status: 'Active',
    modifiers: SAVORY_MODIFIERS
  },
  {
    id: '14',
    name: 'Honey Lavender Latte',
    description: 'A calming blend of espresso, steamed milk, and sweet lavender honey.',
    price: 4.75,
    category: 'Coffee',
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&q=80&w=1000',
    status: 'Active',
    modifiers: COFFEE_MODIFIERS
  },
  {
    id: '15',
    name: 'Truffle Mushroom Omelette',
    description: 'Fluffy three-egg omelette with sautéed mushrooms and truffle oil.',
    price: 9.50,
    category: 'Savory',
    image: 'https://images.unsplash.com/photo-1510629954389-c1e0da47d414?auto=format&fit=crop&q=80&w=1000',
    status: 'Active',
    modifiers: BAKERY_MODIFIERS
  }
];

import api from "@/services/api";

export default function CustomerMenu() {
  const { tableId } = useParams();
  const { user, logout, isAuthenticated } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { currentLocation, setCurrentLocation, locations } = useLocation();
  const { themes, setTheme } = useTheme();
  const theme = themes['customer'];
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      let locationId = null;
      
      if (tableId) {
        try {
          const tableRes = await api.get(`/tables/${tableId}`);
          locationId = tableRes.data.locationId;
          
          if (locationId) {
            const loc = locations.find(l => (l.id || l._id) === locationId);
            if (loc) setCurrentLocation(loc);
          }
        } catch (err) {
          console.error("Error fetching table location:", err);
        }
      } else if (currentLocation) {
        locationId = currentLocation.id || currentLocation._id;
      }

      const params = locationId ? { locationId } : {};
      const response = await api.get("/menu-items", { params });
      if (Array.isArray(response.data) && response.data.length > 0) {
        setMenuItems(response.data);
      } else {
        console.warn("Menu items response is empty or not an array, falling back to static data");
        setMenuItems(MENU_ITEMS);
      }
    } catch (error: any) {
      console.error("Error fetching menu items, falling back to static data:", error);
      setMenuItems(MENU_ITEMS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, [currentLocation?.id, currentLocation?._id]);

  // Store tableId in localStorage if present in URL
  useEffect(() => {
    if (tableId) {
      localStorage.setItem('currentTable', tableId);
      toast.success(t('common.welcomeTable', { tableId }));
    }
  }, [tableId, t]);

  const CATEGORIES = [
    { id: 'all', name: t('menu.all'), icon: Coffee },
    { id: 'Coffee', name: t('menu.coffee'), icon: Coffee },
    { id: 'Tea', name: t('menu.tea'), icon: Leaf },
    { id: 'Smoothie', name: t('menu.smoothie'), icon: IceCream },
    { id: 'Bakery', name: t('menu.bakery'), icon: Croissant },
    { id: 'Savory', name: t('menu.savory'), icon: Sandwich },
  ];
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isRewardsModalOpen, setIsRewardsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [promotions, setPromotions] = useState<any[]>([]);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchPromotions = async () => {
    try {
      const locationId = currentLocation?.id || currentLocation?._id;
      if (!locationId) return;
      const response = await api.get("/promotions", { params: { locationId } });
      setPromotions(response.data);
    } catch (error) {
      console.error("Failed to fetch promotions:", error);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, [currentLocation?.id, currentLocation?._id]);

  const getActivePromotion = (item: MenuItem) => {
    const now = new Date();
    const day = now.getDay();
    const currentTime = format(now, "HH:mm");

    return promotions.find(promo => {
      if (!promo.isActive) return false;
      if (!promo.daysOfWeek.includes(day)) return false;
      if (currentTime < promo.startTime || currentTime > promo.endTime) return false;
      
      if (promo.targetType === 'all') return true;
      if (promo.targetType === 'category' && promo.targetIds.includes(item.category)) return true;
      if (promo.targetType === 'item' && (promo.targetIds.includes(item.id!) || promo.targetIds.includes((item as any)._id))) return true;
      
      return false;
    });
  };

  const calculateDiscountedPrice = (item: MenuItem, basePrice: number) => {
    const promo = getActivePromotion(item);
    if (!promo) return basePrice;

    if (promo.type === 'percentage') {
      return basePrice * (1 - promo.value / 100);
    } else if (promo.type === 'fixed') {
      return Math.max(0, basePrice - promo.value);
    } else if (promo.type === 'bogo') {
      // BOGO is handled at cart level usually, but here we can mark it
      return basePrice;
    }
    return basePrice;
  };

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredItems = (Array.isArray(menuItems) ? menuItems : []).filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = (item.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (item: MenuItem, variant?: MenuItemVariant, modifiers: Modifier[] = [], customizations: Record<string, string> = {}) => {
    const itemId = item.id || (item as any)._id || 'unknown';
    const variantId = variant?.id || (variant as any)?._id || 'base';
    const cartItemId = `${itemId}-${variantId}-${modifiers.map(m => m.id || (m as any)._id).sort().join('-')}-${Object.values(customizations).sort().join('-')}`;
    
    // Auto price calculation: use scheduled promotion price if active, otherwise fallback to static promotion price
    const basePrice = variant ? variant.price : item.price;
    const itemPromo = getActivePromotion(item);
    
    let finalBasePrice = basePrice;
    
    if (itemPromo) {
      if (itemPromo.type === 'percentage') finalBasePrice = basePrice * (1 - itemPromo.value / 100);
      else if (itemPromo.type === 'fixed') finalBasePrice = Math.max(0, basePrice - itemPromo.value);
    } else if (item.isPromotion && item.promotionPrice !== undefined && item.promotionPrice > 0 && item.price > 0) {
      const discountRatio = item.promotionPrice / item.price;
      finalBasePrice = basePrice * discountRatio;
    }
    
    const itemPrice = finalBasePrice + modifiers.reduce((sum, m) => sum + m.price, 0);
    const itemName = variant ? `${item.name} (${variant.name})` : item.name;

    setCart(prev => {
      const existing = prev.find(i => i.id === cartItemId);
      if (existing) {
        toast.success(t('cart.addedAnother', { name: itemName }), { id: `add-${cartItemId}` });
        return prev.map(i => i.id === cartItemId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      toast.success(t('cart.added', { name: itemName }), { id: `add-${cartItemId}` });
      return [...prev, { 
        id: cartItemId, 
        menuItem: { ...item, price: itemPrice, name: itemName }, 
        quantity: 1, 
        selectedVariant: variant,
        selectedModifiers: modifiers,
        customizations
      }];
    });
    setCustomizingItem(null);
  };

  const removeFromCart = (id: string, name: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
    toast.error(t('cart.removed', { name }));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-background overflow-hidden transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.aside 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-card z-[70] flex flex-col shadow-2xl lg:hidden overflow-y-auto no-scrollbar"
            >
              <div className="p-6 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
                    <img src="/cafedev_logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                  </div>
                  <h1 className="font-display font-bold text-xl tracking-tight text-card-foreground">{t('common.appName')}</h1>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-accent/50 rounded-full">
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>
              <nav className="flex-1 px-4 py-6 space-y-2">
                <p className="px-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-4">{t('menu.categories')}</p>
                {[
                  { id: 'all', name: t('menu.all'), icon: Coffee },
                  { id: 'Coffee', name: t('menu.coffee'), icon: Coffee },
                  { id: 'Tea', name: t('menu.tea'), icon: Leaf },
                  { id: 'Smoothie', name: t('menu.smoothie'), icon: IceCream },
                  { id: 'Bakery', name: t('menu.bakery'), icon: Croissant },
                  { id: 'Savory', name: t('menu.savory'), icon: Sandwich },
                ].map(cat => (
                  <button
                    key={`mobile-sidebar-cat-${cat.id}`}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setIsSidebarOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                      activeCategory === cat.id 
                        ? "bg-primary text-primary-foreground font-semibold" 
                        : "text-muted-foreground hover:bg-accent/50"
                    )}
                  >
                    <cat.icon size={20} />
                    <span className="text-sm">{cat.name}</span>
                  </button>
                ))}
              </nav>
              <div className="p-6 border-t border-border flex flex-col gap-3">
                <button 
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light', 'customer')}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-muted text-foreground rounded-xl font-bold text-sm"
                >
                  {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                  {theme === 'light' ? t('common.darkMode') : t('common.lightMode')}
                </button>
                <button 
                  onClick={() => { setIsSidebarOpen(false); setIsQRModalOpen(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm"
                >
                  <QrCode size={20} />
                  {t('qr.title')}
                </button>
                <button 
                  onClick={() => { setIsSidebarOpen(false); setIsSupportOpen(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-muted text-foreground rounded-xl font-bold text-sm"
                >
                  <MessageSquare size={20} />
                  {t('auth.support')}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 bg-card border-r border-border flex-col transition-colors duration-300 overflow-y-auto no-scrollbar shrink-0">
        <div className="p-6 flex items-center gap-3">
          <Link to="/" className="w-10 h-10 bg-white rounded-xl flex items-center justify-center overflow-hidden hover:scale-105 transition-transform shadow-sm">
            <img src="/cafedev_logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          </Link>
          <h1 className="font-display font-bold text-xl tracking-tight text-card-foreground">{t('common.appName')}</h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          <p className="px-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-4">{t('menu.categories')}</p>
          {[
            { id: 'all', name: t('menu.all'), icon: Coffee },
            { id: 'Coffee', name: t('menu.coffee'), icon: Coffee },
            { id: 'Tea', name: t('menu.tea'), icon: Leaf },
            { id: 'Smoothie', name: t('menu.smoothie'), icon: IceCream },
            { id: 'Bakery', name: t('menu.bakery'), icon: Croissant },
            { id: 'Savory', name: t('menu.savory'), icon: Sandwich },
          ].map(cat => (
            <button
              key={`desktop-sidebar-cat-${cat.id}`}
              onClick={() => {
                setActiveCategory(cat.id);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                activeCategory === cat.id 
                  ? "bg-primary text-primary-foreground font-semibold" 
                  : "text-muted-foreground hover:bg-accent/50"
              )}
            >
              <cat.icon size={20} />
              <span className="text-sm">{cat.name}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 space-y-4">
          <div 
            onClick={() => setIsRewardsModalOpen(true)}
            className="bg-muted p-4 rounded-xl relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow group min-h-[100px] flex flex-col justify-center"
          >
            <div className="relative z-10">
              <ShoppingBag className="text-primary mb-2 group-hover:scale-110 transition-transform" size={24} />
              <p className="font-bold text-sm mb-1 text-foreground">{t('rewards.title')}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{t('rewards.subtitle')}</p>
            </div>
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-primary opacity-10 rounded-full" />
          </div>

          <div 
            onClick={() => setIsQRModalOpen(true)}
            className="bg-primary p-4 rounded-2xl relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow group min-h-[100px] flex flex-col justify-center"
          >
            <div className="relative z-10 text-white">
              <QrCode className="text-white mb-2 group-hover:scale-110 transition-transform" size={24} />
              <p className="font-bold text-sm mb-1">{t('qr.title')}</p>
              <p className="text-[11px] text-muted leading-relaxed">{t('qr.subtitle')}</p>
            </div>
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white opacity-5 rounded-full" />
          </div>

          <div 
            onClick={() => setIsSupportOpen(true)}
            className="bg-muted p-4 rounded-xl relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow group min-h-[100px] flex flex-col justify-center"
          >
            <div className="relative z-10">
              <MessageSquare className="text-primary mb-2 group-hover:scale-110 transition-transform" size={24} />
              <p className="font-bold text-sm mb-1 text-foreground">{t('auth.support')}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{t('support.subtitle')}</p>
            </div>
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-primary opacity-10 rounded-full" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 relative transition-colors duration-300">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 sm:px-8 mb-6 transition-all duration-300">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                {/* Left: Search Bar */}
                <div className="flex items-center gap-4 w-full lg:w-auto flex-1">
                  <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="lg:hidden p-2.5 hover:bg-accent rounded-xl transition-colors text-muted-foreground border border-border"
                  >
                    <LayoutDashboard size={20} />
                  </button>
                  <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                    <input
                      type="text"
                      placeholder={t('menu.search')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 bg-card border border-border focus:border-primary/50 rounded-2xl focus:ring-4 focus:ring-primary/5 transition-all text-sm text-foreground placeholder:text-muted-foreground/60 font-medium"
                    />
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-end w-full lg:w-auto gap-2 sm:gap-4">
                  {/* Branch Selector - Refined as a Cohesive Button */}
                  {currentLocation && (
                    <Link 
                      to="/locations"
                      className="flex items-center gap-3 px-3 py-1.5 hover:bg-accent/30 rounded-2xl transition-all border border-border group"
                    >
                      <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        <Coffee size={14} />
                      </div>
                      <div className="flex flex-col text-left pr-2">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.15em] leading-none mb-1">{t('menu.currentBranch')}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-foreground leading-none">{currentLocation.name}</span>
                          {!tableId && <span className="text-[10px] text-primary font-bold ml-1 opacity-0 group-hover:opacity-100 transition-opacity">Change</span>}
                        </div>
                      </div>
                    </Link>
                  )}

                  <div className="h-8 w-px bg-border hidden sm:block mx-1" />

                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => setIsCartOpen(true)}
                      className="xl:hidden relative p-2.5 hover:bg-accent rounded-xl text-muted-foreground transition-colors border border-transparent hover:border-border"
                    >
                      <ShoppingBag size={20} />
                      {cart.length > 0 && (
                        <span className="absolute top-1 right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-background">
                          {cart.reduce((sum, item) => sum + item.quantity, 0)}
                        </span>
                      )}
                    </button>
                    
                    <div className="flex items-center bg-muted/50 p-1 rounded-xl border border-border">
                      <button 
                        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light', 'customer')}
                        className="p-1.5 hover:bg-background hover:shadow-sm rounded-lg transition-all text-muted-foreground hover:text-foreground"
                        title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                      >
                        {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
                      </button>
                      <button 
                        onClick={() => setLanguage(language === 'en' ? 'km' : 'en')}
                        className="p-1.5 hover:bg-background hover:shadow-sm rounded-lg transition-all flex items-center gap-1.5 text-muted-foreground hover:text-foreground group"
                      >
                        <Globe size={15} className="group-hover:text-primary transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                          {language === 'en' ? 'EN' : 'KM'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="h-8 w-px bg-border hidden sm:block mx-1" />

                  {!isAuthenticated ? (
                    <div className="flex items-center gap-2">
                      <Link 
                        to="/login" 
                        className="px-5 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-all"
                      >
                        {t('auth.login')}
                      </Link>
                      <Link 
                        to="/signup" 
                        className="px-5 py-2.5 text-xs font-bold bg-primary text-primary-foreground rounded-xl hover:opacity-90 shadow-lg shadow-primary/20 transition-all flex items-center justify-center min-w-[100px]"
                      >
                        {t('auth.signup')}
                      </Link>
                    </div>
                  ) : (
                    <div className="relative" ref={profileRef}>
                      <button 
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-3 p-1.5 pr-3 bg-muted/30 hover:bg-muted/50 border border-border rounded-2xl transition-all group"
                      >
                        <div className="w-8 h-8 rounded-xl overflow-hidden ring-2 ring-transparent group-hover:ring-primary/20 transition-all border border-border">
                          <img src={user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Felix'}`} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="hidden sm:flex flex-col text-left items-start">
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Account</span>
                          <span className="text-xs font-bold text-foreground leading-none truncate max-w-[80px]">{user?.name}</span>
                        </div>
                      </button>

                      <AnimatePresence>
                        {isProfileOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-3 w-64 bg-card rounded-2xl shadow-2xl border border-border overflow-hidden z-50 transition-colors duration-300"
                          >
                            <div className="p-5 border-b border-border bg-muted/30">
                              <p className="text-sm font-bold text-foreground">{user?.name}</p>
                              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 truncate">{user?.email}</p>
                            </div>
                            <div className="p-2">
                              <button 
                                onClick={() => { navigate('/profile'); setIsProfileOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-accent/50 hover:text-foreground rounded-xl transition-all"
                              >
                                <User size={16} />
                                {t('settings.profile')}
                              </button>
                              <button 
                                onClick={() => { navigate('/order-status'); setIsProfileOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-accent/50 hover:text-foreground rounded-xl transition-all"
                              >
                                <History size={16} />
                                {t('auth.myOrders')}
                              </button>
                              {(user?.role === 'admin' || user?.role === 'manager') && (
                                <button 
                                  onClick={() => { navigate('/admin'); setIsProfileOpen(false); }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-accent/50 hover:text-foreground rounded-xl transition-all"
                                >
                                  <LayoutDashboard size={16} />
                                  {t('auth.adminDashboard')}
                                </button>
                              )}
                              <div className="h-px bg-border my-2 mx-2" />
                              <button 
                                onClick={() => { logout(); setIsProfileOpen(false); toast.success("Logged out successfully"); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                              >
                                <LogOut size={16} />
                                {t('auth.logout')}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            </header>

        {/* Mobile Categories Scroll */}
        <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
          {[
            { id: 'all', name: t('menu.all'), icon: Coffee },
            { id: 'Coffee', name: t('menu.coffee'), icon: Coffee },
            { id: 'Tea', name: t('menu.tea'), icon: Leaf },
            { id: 'Smoothie', name: t('menu.smoothie'), icon: IceCream },
            { id: 'Bakery', name: t('menu.bakery'), icon: Croissant },
            { id: 'Savory', name: t('menu.savory'), icon: Sandwich },
          ].map(cat => (
            <button
              key={`mobile-scroll-cat-${cat.id}`}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all text-xs font-bold",
                activeCategory === cat.id 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "bg-card text-muted-foreground shadow-sm"
              )}
            >
              <cat.icon size={14} />
              {cat.name}
            </button>
          ))}
        </div>

        {/* Hero Banner */}
        <section className="relative h-48 sm:h-60 rounded-xl overflow-hidden mb-8 group cursor-pointer">
          <img 
            src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=1200" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            alt="Cafe Shop"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
          <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-center max-w-lg">
            <span className="inline-block px-2 py-0.5 bg-primary text-primary-foreground text-[8px] font-bold rounded-md mb-3 w-fit uppercase tracking-wider">{t('menu.newArrival')}</span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-3 leading-tight">{t('menu.title')}</h2>
            <p className="text-gray-200 text-xs sm:text-sm line-clamp-2">{t('menu.subtitle')}</p>
          </div>
        </section>

        {/* Coffee Section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-display font-bold text-card-foreground">{t('menu.coffee')}</h3>
            <button 
              onClick={() => { setActiveCategory('Coffee'); }}
              className="text-primary text-xs font-semibold hover:underline"
            >
              {t('menu.seeAll')}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {filteredItems.filter(i => i.category === 'Coffee').map((item, idx) => (
              <ItemCard 
                key={`coffee-${item.id || (item as any)._id || idx}-${idx}`} 
                item={item} 
                onAdd={() => setCustomizingItem(item)} 
                activePromo={getActivePromotion(item)}
              />
            ))}
          </div>
        </section>

        {/* Tea Section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-display font-bold text-card-foreground">{t('menu.tea')}</h3>
            <button 
              onClick={() => { setActiveCategory('Tea'); }}
              className="text-primary text-xs font-semibold hover:underline"
            >
              {t('menu.seeAll')}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {filteredItems.filter(i => i.category === 'Tea').map((item, idx) => (
              <ItemCard 
                key={`tea-${item.id || (item as any)._id || idx}-${idx}`} 
                item={item} 
                onAdd={() => setCustomizingItem(item)} 
                activePromo={getActivePromotion(item)}
              />
            ))}
          </div>
        </section>

        {/* Bakery Section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-display font-bold text-card-foreground">{t('menu.bakery')}</h3>
            <button 
              onClick={() => { setActiveCategory('Bakery'); }}
              className="text-primary text-xs font-semibold hover:underline"
            >
              {t('menu.seeAll')}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {filteredItems.filter(i => i.category === 'Bakery').map((item, idx) => (
              <ItemCard 
                key={`bakery-${item.id || (item as any)._id || idx}-${idx}`} 
                item={item} 
                onAdd={() => setCustomizingItem(item)} 
                activePromo={getActivePromotion(item)}
              />
            ))}
          </div>
        </section>

        {/* Savory Section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-display font-bold text-card-foreground">{t('menu.savory')}</h3>
            <button 
              onClick={() => { setActiveCategory('Savory'); }}
              className="text-primary text-xs font-semibold hover:underline"
            >
              {t('menu.seeAll')}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {filteredItems.filter(i => i.category === 'Savory').map((item, idx) => (
              <ItemCard 
                key={`savory-${item.id || (item as any)._id || idx}-${idx}`} 
                item={item} 
                onAdd={() => setCustomizingItem(item)} 
                activePromo={getActivePromotion(item)}
              />
            ))}
          </div>
        </section>

        {/* Smoothie Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-display font-bold text-card-foreground">{t('menu.smoothie')}</h3>
            <button 
              onClick={() => { setActiveCategory('Smoothie'); }}
              className="text-primary text-xs font-semibold hover:underline"
            >
              {t('menu.seeAll')}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {filteredItems.filter(i => i.category === 'Smoothie').map((item, idx) => (
              <ItemCard key={`smoothie-${item.id || (item as any)._id || idx}-${idx}`} item={item} onAdd={() => setCustomizingItem(item)} />
            ))}
          </div>
        </section>


        <AnimatePresence>
          {customizingItem && (
            <CustomizeModal 
              key="customize-modal"
              item={customizingItem} 
              onClose={() => setCustomizingItem(null)} 
              onAdd={addToCart}
            />
          )}
          {isQRModalOpen && (
            <QRModal key="qr-modal" onClose={() => setIsQRModalOpen(false)} />
          )}
          {isRewardsModalOpen && (
            <RewardsModal key="rewards-modal" onClose={() => setIsRewardsModalOpen(false)} />
          )}
          <SupportModal key="support-modal" isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
        </AnimatePresence>
          </>
        )}
      </main>

      {/* Cart Sidebar - Desktop */}
      <aside className="hidden xl:flex w-[400px] bg-card border-l border-border flex-col z-30 transition-colors duration-300 shrink-0">
        <CartContent cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} subtotal={subtotal} tax={tax} total={total} t={t} navigate={navigate} />
      </aside>

      {/* Cart Drawer - Mobile */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] xl:hidden"
            />
            <motion.aside 
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-card z-[70] flex flex-col shadow-2xl xl:hidden border-l border-border"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-xl font-display font-bold text-card-foreground">{t('cart.title')}</h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-accent/50 rounded-full">
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>
              <CartContent cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} subtotal={subtotal} tax={tax} total={total} t={t} navigate={navigate} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Floating Cart Button - Mobile */}
      {cart.length > 0 && (
        <motion.button
          initial={{ scale: 0, y: 100 }}
          animate={{ scale: 1, y: 0 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsCartOpen(true)}
          className="xl:hidden fixed bottom-6 right-6 w-16 h-16 bg-primary text-white rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center z-50"
        >
          <ShoppingBag size={28} />
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-primary">
            {cart.reduce((sum, item) => sum + item.quantity, 0)}
          </span>
        </motion.button>
      )}
    </div>
  );
}

function CartContent({ cart, updateQuantity, removeFromCart, subtotal, tax, total, t, navigate }: any) {
  const { language } = useLanguage();
  return (
    <>
      <div className="p-6 sm:p-8 flex items-center justify-between xl:hidden">
        <h2 className="text-2xl font-display font-bold text-card-foreground">{t('cart.title')}</h2>
        <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full">Order #1024</span>
      </div>
      <div className="p-8 flex items-center justify-between hidden xl:flex">
        <h2 className="text-2xl font-display font-bold text-card-foreground">{t('cart.title')}</h2>
        <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full">Order #1024</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 sm:px-8 space-y-6 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 py-20">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                <ShoppingBag size={40} strokeWidth={1} />
              </div>
              <p className="text-sm font-medium">{t('cart.empty')}</p>
            </div>
          ) : (
            cart.map((item: any, idx: number) => (
              <motion.div 
                key={`cart-item-${item.id || idx}-${idx}`}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex gap-4 group"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                  <img src={item.menuItem.image} alt={item.menuItem.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1">
                    <h4 className="font-bold text-sm text-card-foreground truncate pr-2">
                      {language === 'km'
                        ? (item.menuItem.nameKm || t(getItemTranslationKey(item.menuItem.name)) || item.menuItem.name)
                        : item.menuItem.name
                      }
                    </h4>
                    <span className="font-bold text-sm text-card-foreground flex-shrink-0">${(item.menuItem.price * item.quantity).toFixed(2)}</span>
                  </div>
                  <div className="mb-3">
                    {item.selectedModifiers.length > 0 && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        + {item.selectedModifiers.map((m: any) => m.name).join(', ')}
                      </p>
                    )}
                    {item.customizations && (
                      <p className="text-[10px] text-muted-foreground">
                        {item.customizations.sugarLevel && `${t('menu.sugar')}: ${item.customizations.sugarLevel}`}
                        {item.customizations.iceLevel && ` • ${t('menu.ice')}: ${item.customizations.iceLevel}`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 bg-muted rounded-lg px-2 py-1">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-primary text-muted-foreground transition-colors"><Minus size={14} /></button>
                      <span className="text-xs font-bold w-4 text-center text-card-foreground">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-primary text-muted-foreground transition-colors"><Plus size={14} /></button>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id, item.menuItem.name)}
                      className="p-2 text-muted-foreground/50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 sm:p-8 border-t border-border space-y-4 bg-card transition-colors duration-300">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{t('cart.subtotal')}</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{t('cart.tax')}</span>
            <span className="font-medium">${tax.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex justify-between items-end pt-2">
          <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t('cart.total')}</span>
          <span className="text-2xl sm:text-3xl font-display font-bold text-card-foreground">${total.toFixed(2)}</span>
        </div>
        <button 
          onClick={() => navigate('/checkout')}
          disabled={cart.length === 0}
          className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl shadow-primary/20 mt-4 group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('cart.checkout')}
          <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
        </button>
        <p className="text-[10px] text-center text-muted-foreground">{t('cart.secure')}</p>
      </div>
    </>
  );
}

function ItemCard({ item, onAdd, activePromo, ...props }: { item: MenuItem, onAdd: () => void, activePromo?: any, [key: string]: any }) {
  const { t, language } = useLanguage();
  
  const hasPromo = !!activePromo || (item.isPromotion && item.promotionPrice !== undefined && item.promotionPrice > 0);
  
  const getPromoPrice = () => {
    const basePrice = item.variants && item.variants.length > 0 ? Math.min(...item.variants.map(v => v.price)) : item.price;
    
    if (activePromo) {
      if (activePromo.type === 'percentage') return basePrice * (1 - activePromo.value / 100);
      if (activePromo.type === 'fixed') return Math.max(0, basePrice - activePromo.value);
    }
    
    if (item.isPromotion && item.promotionPrice !== undefined && item.promotionPrice > 0 && item.price > 0) {
       const ratio = item.promotionPrice / item.price;
       return basePrice * ratio;
    }
    
    return basePrice;
  };

  const originalPrice = item.variants && item.variants.length > 0 ? Math.min(...item.variants.map(v => v.price)) : item.price;
  const promoPrice = getPromoPrice();

  return (
    <div className={cn(
      "bg-card rounded-xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 group relative border border-border flex flex-col h-full",
      item.status === 'Sold Out' && "opacity-75 grayscale-[0.5]"
    )}
    >
      <div className="relative h-44 rounded-xl overflow-hidden mb-4 bg-muted">
        <img 
          src={item.image} 
          alt={item.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          referrerPolicy="no-referrer" 
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '')}/400/300`;
          }}
        />
        
        {item.status === 'Sold Out' && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
            <span className="px-3 py-1.5 bg-card text-card-foreground text-[10px] font-bold rounded-lg uppercase tracking-widest">{t('menu.soldOut')}</span>
          </div>
        )}

        {item.isSugarFree && (
          <span className="absolute top-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-md text-white text-[8px] font-bold rounded-md uppercase tracking-wider">{t('menu.sugarFree')}</span>
        )}
        {item.isGlutenFree && (
          <span className="absolute top-3 left-3 px-2 py-1 bg-primary text-primary-foreground text-[8px] font-bold rounded-md uppercase tracking-wider">{t('menu.gfOption')}</span>
        )}
        
        {hasPromo && promoPrice < originalPrice && (
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            <span className="px-2 py-1 bg-red-500 text-white text-[8px] font-bold rounded-md uppercase tracking-wider shadow-lg animate-pulse">
              {activePromo ? activePromo.name : `${Math.max(1, Math.min(99, Math.round((1 - promoPrice / originalPrice) * 100)))}% OFF`}
            </span>
          </div>
        )}
        
        {item.status !== 'Sold Out' && (
          <button 
            onClick={onAdd}
            className="absolute top-3 right-3 w-9 h-9 bg-card/90 backdrop-blur-md rounded-full flex items-center justify-center text-muted-foreground hover:text-primary transition-all shadow-lg hover:scale-110 active:scale-95 border border-border"
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      <div className="flex flex-col flex-1">
        <div className="flex justify-between items-start gap-4 mb-1.5">
          <h4 className="text-base font-bold text-card-foreground group-hover:text-primary transition-colors flex-1">
            {(() => {
              const translationKey = getItemTranslationKey(item.name);
              const translated = t(translationKey);
              if (language === 'km') {
                return item.nameKm || (translated !== translationKey ? translated : item.name);
              }
              return translated !== translationKey ? translated : item.name;
            })()}
          </h4>
          <div className="flex flex-col items-end">
            {hasPromo && promoPrice < originalPrice ? (
              <>
                <span className="text-base font-display font-bold text-red-500">
                  ${promoPrice.toFixed(2)}
                </span>
                <span className="text-[10px] text-muted-foreground line-through font-medium">
                  ${originalPrice.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-base font-display font-bold text-primary">
                ${originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed flex-1">
          {(() => {
            const translationKey = getItemTranslationKey(item.name).replace('.name', '.desc');
            const translated = t(translationKey);
            if (language === 'km') {
              return item.descriptionKm || (translated !== translationKey ? translated : item.description);
            }
            return translated !== translationKey ? translated : item.description;
          })()}
        </p>

          <button 
            onClick={onAdd}
            disabled={item.status === 'Sold Out'}
            className={cn(
              "w-full py-3.5 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200",
              item.status === 'Sold Out'
                ? "bg-muted text-muted-foreground border-border cursor-not-allowed"
                : "border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary hover:shadow-lg hover:shadow-primary/20"
            )}
          >
          {item.status === 'Sold Out' ? t('menu.outOfStock') : (
            <>
              <Plus size={18} />
              {t('menu.addToOrder')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function RewardsModal({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const { user, isAuthenticated, updateUser } = useAuth();
  const { currentLocation } = useLocation();
  const navigate = useNavigate();
  const [isRedeeming, setIsRedeeming] = useState(false);

  const points = user?.points || 0;
  const level = user?.membershipLevel || 'Bronze';
  const nextLevel = level === 'Bronze' ? 'Silver' : level === 'Silver' ? 'Gold' : 'Platinum';
  const pointsToNext = level === 'Bronze' ? 500 : level === 'Silver' ? 1500 : 5000;
  const progress = (points / pointsToNext) * 100;

  const REWARDS = [
    { id: '1', name: 'Free Espresso', cost: 150, icon: Coffee },
    { id: '2', name: '10% Discount', cost: 300, icon: ShoppingBag },
    { id: '3', name: 'Free Pastry', cost: 450, icon: Croissant },
    { id: '4', name: 'Buy 1 Get 1 Free', cost: 600, icon: Coffee },
  ];

  const handleRedeem = async (reward: any) => {
    if (points < reward.cost) {
      toast.error(t('rewards.insufficientPoints'));
      return;
    }

    setIsRedeeming(true);
    try {
      const response = await api.post("/auth/redeem-points", {
        cost: reward.cost,
        rewardName: reward.name,
        locationId: currentLocation?.id || currentLocation?._id
      });
      
      if (response.data.user) {
        updateUser(response.data.user);
        toast.success(response.data.message);
      }
    } catch (error: any) {
      console.error("Redemption error:", error);
      toast.error(error.response?.data?.error || t('rewards.redeemError'));
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-card rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300 border border-border"
      >
        <div className="p-6 sm:p-8 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
          <h3 className="text-2xl font-display font-bold text-card-foreground">{t('rewards.title')}</h3>
          <button onClick={onClose} className="p-2 hover:bg-accent/50 rounded-full transition-colors">
            <X size={24} className="text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar">
          {!isAuthenticated ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-muted text-primary rounded-xl flex items-center justify-center mx-auto mb-6">
                <ShoppingBag size={40} />
              </div>
              <h4 className="text-xl font-bold mb-2 text-foreground">{t('rewards.joinTitle')}</h4>
              <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto">{t('rewards.joinDesc')}</p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => { navigate('/login'); onClose(); }}
                  className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-xl shadow-primary/20"
                >
                  {t('rewards.loginToEarn')}
                </button>
                <button 
                  onClick={() => { navigate('/signup'); onClose(); }}
                  className="w-full py-4 rounded-xl font-bold text-sm text-muted-foreground hover:text-foreground transition-all"
                >
                  {t('rewards.createAccount')}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Points Card */}
              <div className="bg-primary rounded-xl p-8 text-primary-foreground relative overflow-hidden shadow-lg shadow-primary/20">
                <div className="relative z-10">
                  <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mb-2">{t('rewards.balance')}</p>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-5xl font-display font-black">{points}</span>
                    <span className="text-sm font-bold opacity-70 uppercase tracking-wider">{t('rewards.points')}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="opacity-90">{level} Member</span>
                      <span className="opacity-70">{nextLevel} at {pointsToNext} pts</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${Math.min(progress, 100)}%` }}
                         className="h-full bg-white rounded-full"
                       />
                    </div>
                  </div>
                </div>
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white opacity-10 rounded-full blur-3xl" />
              </div>

              {/* Rewards List */}
              <section>
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] mb-4">{t('rewards.available')}</h4>
                <div className="grid grid-cols-1 gap-3">
                  {REWARDS.map((reward, idx) => (
                    <div 
                      key={reward.id || `reward-${idx}`}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border transition-all duration-200",
                        points >= reward.cost 
                          ? "border-border bg-card hover:border-primary cursor-pointer group" 
                          : "border-border/50 bg-muted/50 opacity-60"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                          points >= reward.cost ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          <reward.icon size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-card-foreground">{reward.name}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{reward.cost} {t('rewards.points')}</p>
                        </div>
                      </div>
                      <button 
                        disabled={points < reward.cost || isRedeeming}
                        onClick={() => handleRedeem(reward)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                          points >= reward.cost 
                            ? "bg-primary text-primary-foreground hover:opacity-90" 
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {isRedeeming ? "..." : t('rewards.redeem')}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>

        <div className="p-6 border-t border-border sticky bottom-0 bg-card z-10">
          <button 
            onClick={onClose}
            className="w-full py-4 rounded-2xl font-bold text-base text-muted-foreground hover:text-foreground transition-all"
          >
            {t('common.close')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function QRModal({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const currentUrl = window.location.origin;
  const tableId = localStorage.getItem('currentTable') || '04';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-sm bg-card rounded-xl shadow-2xl overflow-hidden p-8 text-center border border-border"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-accent/50 rounded-full transition-colors">
          <X size={20} className="text-muted-foreground" />
        </button>
        
        <div className="mb-6 inline-flex items-center justify-center w-16 h-16 bg-muted text-primary rounded-xl">
          <QrCode size={32} />
        </div>
        
        <h3 className="text-2xl font-display font-bold text-card-foreground mb-2">{t('qr.title')}</h3>
        <p className="text-sm text-muted-foreground mb-8">{t('qr.scanDesc', { tableId })}</p>
        
        <div className="bg-muted p-6 rounded-xl mb-8 flex items-center justify-center">
          <div className="w-48 h-48 bg-white p-4 rounded-lg shadow-sm border border-border">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${currentUrl}/menu/${tableId}`} 
              alt="QR Code" 
              className="w-full h-full"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-sm hover:opacity-90 transition-all"
        >
          {t('common.close')}
        </button>
      </motion.div>
    </div>
  );
}

function CustomizeModal({ item, onClose, onAdd }: { item: MenuItem, onClose: () => void, onAdd: (item: MenuItem, variant?: MenuItemVariant, modifiers?: Modifier[], customizations?: Record<string, string>) => void }) {
  const { t, language } = useLanguage();
  const [selectedVariant, setSelectedVariant] = useState<MenuItemVariant | undefined>(item.variants?.[0]);
  const [selectedModifiers, setSelectedModifiers] = useState<Modifier[]>([]);
  const [sugarLevel, setSugarLevel] = useState('100%');
  const [iceLevel, setIceLevel] = useState('100%');

  const discountRatio = (item.isPromotion && item.promotionPrice !== undefined && item.promotionPrice > 0 && item.price > 0) 
    ? (item.promotionPrice / item.price) 
    : 1;

  const basePrice = (selectedVariant?.price || item.price) * discountRatio;
  const totalPrice = basePrice + selectedModifiers.reduce((sum, m) => sum + m.price, 0);

  const toggleModifier = (modifier: Modifier) => {
    const modId = modifier.id || (modifier as any)._id;
    setSelectedModifiers(prev => 
      prev.find(m => (m.id || (m as any)._id) === modId) 
        ? prev.filter(m => (m.id || (m as any)._id) !== modId) 
        : [...prev, modifier]
    );
  };

  const categoryLower = item.category?.toLowerCase() || '';
  const isDrink = ['coffee', 'tea', 'smoothie'].includes(categoryLower);
  const toppingsTitle = ['bakery', 'savory'].includes(categoryLower) ? t('menu.addons') : t('menu.toppings');

  // Fallback modifiers if not provided by API
  const displayModifiers = (item.modifiers && item.modifiers.length > 0) 
    ? item.modifiers 
    : (categoryLower === 'coffee' ? COFFEE_MODIFIERS : 
       categoryLower === 'tea' ? TEA_MODIFIERS : 
       categoryLower === 'smoothie' ? SMOOTHIE_MODIFIERS : 
       categoryLower === 'bakery' ? BAKERY_MODIFIERS :
       categoryLower === 'savory' ? SAVORY_MODIFIERS : []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-[540px] bg-card rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300 border border-border"
      >
        <div className="p-6 sm:p-8 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
          <h3 className="text-2xl font-display font-bold text-card-foreground">
            {t('menu.customize')} {' '}
            {(() => {
              const translationKey = getItemTranslationKey(item.name);
              const translated = t(translationKey);
              if (language === 'km') {
                return item.nameKm || (translated !== translationKey ? translated : item.name);
              }
              return translated !== translationKey ? translated : item.name;
            })()}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-accent/50 rounded-full transition-colors">
            <X size={24} className="text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar">
          {/* Size Selection */}
          {item.variants && item.variants.length > 0 && (
            <section>
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-4">{t('menu.size')}</h4>
              <div className="flex gap-2 p-1.5 bg-muted rounded-xl">
                {item.variants.map((v, idx) => (
                  <button
                    key={v.id || (v as any)._id || `variant-${idx}`}
                    onClick={() => setSelectedVariant(v)}
                    className={cn(
                      "flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-200 border-2",
                      (selectedVariant?.id === v.id || selectedVariant?.name === v.name)
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 border-primary" 
                        : "text-muted-foreground hover:bg-card/50 hover:text-foreground border-transparent"
                    )}
                  >
                    {(() => {
                      const sanitizedKey = v.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_+|_+$)/g, '');
                      const translationKey = `menu.size.${sanitizedKey}`;
                      const translated = t(translationKey);
                      if (language === 'km') {
                        return v.nameKm || (translated !== translationKey ? translated : v.name);
                      }
                      return translated !== translationKey ? translated : v.name;
                    })()}
                  </button>
                ))}
              </div>
            </section>
          )}

          {isDrink && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Sugar Level */}
              <section>
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-4">{t('menu.sugarLevel')}</h4>
                <div className="flex gap-1.5 p-1.5 bg-muted rounded-xl">
                  {['0%', '50%', '100%'].map(level => (
                    <button
                      key={`sugar-${level}`}
                      onClick={() => setSugarLevel(level)}
                      className={cn(
                        "flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-200",
                        sugarLevel === level 
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 ring-1 ring-primary" 
                          : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </section>

              {/* Ice Level */}
              <section>
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-4">{t('menu.iceLevel')}</h4>
                <div className="flex gap-1.5 p-1.5 bg-muted rounded-xl">
                  {[
                    { key: 'noIce', label: t('menu.noIce') },
                    { key: 'lessIce', label: t('menu.lessIce') },
                    { key: '100%', label: '100%' },
                    { key: 'extraIce', label: t('menu.extraIce') }
                  ].map(level => (
                    <button
                      key={`ice-${level.key}`}
                      onClick={() => setIceLevel(level.key)}
                      className={cn(
                        "flex-1 py-3 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all text-center duration-200",
                        iceLevel === level.key 
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 ring-1 ring-primary" 
                          : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
                      )}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* Toppings / Modifiers */}
          {displayModifiers.length > 0 && (
            <section>
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-4">{toppingsTitle}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {displayModifiers.map((m, idx) => (
                  <button
                    key={m.id || (m as any)._id || `modifier-${idx}`}
                    onClick={() => toggleModifier(m)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border transition-all text-left duration-200",
                      selectedModifiers.find(sm => (sm.id || (sm as any)._id) === (m.id || (m as any)._id))
                        ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50 bg-card"
                    )}
                  >
                    <p className="text-xs font-bold text-card-foreground">
                      {(() => {
                        const sanitizedKey = m.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_+|_+$)/g, '');
                        const translationKey = `menu.modifier.${sanitizedKey}`;
                        const translated = t(translationKey);
                        if (language === 'km') {
                          return m.nameKm || (translated !== translationKey ? translated : m.name);
                        }
                        return translated !== translationKey ? translated : m.name;
                      })()}
                    </p>
                    <span className="text-[10px] font-bold text-muted-foreground">+${m.price.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="p-6 sm:p-8 border-t border-border sticky bottom-0 bg-card z-10">
          <button 
            onClick={() => onAdd(item, selectedVariant, selectedModifiers, { sugarLevel, iceLevel })}
            className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl shadow-primary/20"
          >
            {t('menu.addToOrder')} • ${totalPrice.toFixed(2)}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
