import { useState, useRef, useEffect } from "react";
import { ArrowLeft, CreditCard, Wallet, Gift, ShieldCheck, Lock, HelpCircle, CheckCircle2, Trash2, Edit2, RefreshCw, Printer, LogOut, Settings, User, Globe, Loader2, ShoppingBag } from "lucide-react";
import { printReceipt } from "@/lib/printReceipt";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useAuth } from "@/AuthContext";
import { useLanguage } from "@/LanguageContext";
import { useLocation } from "@/LocationContext";
import api from "@/services/api";
import { CartItem } from "@/types";

export default function Checkout() {
  const { user, logout, isAuthenticated } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { currentLocation } = useLocation();
  const [activeTab, setActiveTab] = useState('card');
  const [orderType, setOrderType] = useState<'Dine-in' | 'Takeaway'>('Dine-in');
  const [selectedTable, setSelectedTable] = useState('04');
  const [billingSame, setBillingSame] = useState(true);
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [khqrImage, setKhqrImage] = useState<string | null>(null);
  const [giftCardNumber, setGiftCardNumber] = useState("");
  const [giftCardPin, setGiftCardPin] = useState("");
  const [giftCardBalance, setGiftCardBalance] = useState<number | null>(null);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchKHQR = async () => {
      try {
        const response = await api.get("/settings/khqr_image");
        setKhqrImage(response.data);
      } catch (error) {
        console.error("Error fetching KHQR image:", error);
      }
    };
    fetchKHQR();
  }, []);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const PAYMENT_TABS = [
    { id: 'card', label: t('checkout.card'), icon: <CreditCard size={18} /> },
    { id: 'khqr', label: t('checkout.khqr'), icon: <div className="w-4.5 h-4.5 bg-primary text-white rounded-[4px] flex items-center justify-center text-[8px] font-black">QR</div> },
    { id: 'cash', label: t('checkout.cash'), icon: <Wallet size={18} /> },
    { id: 'gift', label: t('checkout.giftCard'), icon: <Gift size={18} /> },
  ];

  const subtotal = cart.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
  const serviceCharge = subtotal * 0.05;
  const tax = (subtotal + serviceCharge) * 0.1;
  const total = subtotal + serviceCharge + tax - discount;

  const handleApplyPromo = async () => {
    if (!promoCode) return;
    
    setIsValidatingPromo(true);
    try {
      const response = await api.post("/coupons/validate", {
        code: promoCode,
        amount: subtotal,
        customerId: user?.id,
        locationId: currentLocation?.id || currentLocation?._id,
        items: cart.map(item => ({
          price: item.menuItem.price,
          quantity: item.quantity
        }))
      });
      
      setDiscount(response.data.discount);
      setAppliedCoupon(response.data.coupon);
      toast.success(response.data.message);
    } catch (error: any) {
      console.error("Promo validation error:", error);
      toast.error(error.response?.data?.error || t('checkout.invalidPromo'));
      setDiscount(0);
      setAppliedCoupon(null);
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast.error(t('cart.empty'));
      return;
    }

    setIsPlacingOrder(true);
    try {
      const orderData = {
        customerId: user?.id,
        customerName: user?.name || t('common.guest'),
        locationId: currentLocation?.id || currentLocation?._id,
        items: cart.map(item => ({
          id: item.menuItem.id || (item.menuItem as any)._id,
          name: item.menuItem.name,
          quantity: item.quantity,
          price: item.menuItem.price,
          category: item.menuItem.category,
          selectedVariant: item.selectedVariant,
          selectedModifiers: item.selectedModifiers,
          customizations: item.customizations
        })),
        subtotal,
        tax: tax + serviceCharge,
        total,
        type: orderType,
        table: orderType === 'Dine-in' ? selectedTable : undefined,
        status: 'Pending',
        paymentMethod: activeTab === 'card' ? 'Card' : 
                       activeTab === 'khqr' ? 'KHQR' : 
                       activeTab === 'cash' ? 'Cash' : 'Gift Card',
        giftCardNumber: activeTab === 'gift' ? giftCardNumber : undefined,
        giftCardPin: activeTab === 'gift' ? giftCardPin : undefined,
        promoCode: appliedCoupon?.code,
        discount: discount,
        paymentStatus: 'Pending'
      };

      const response = await api.post("/orders", orderData);
      const order = response.data;
      
      localStorage.removeItem('cart');
      toast.success(t('checkout.orderSuccess'));
      navigate(`/order-status/${order.id || order._id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('checkout.orderError'));
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handlePrintReceipt = () => {
    toast.success(t('checkout.generatingReceipt'));
    const mockOrder: any = {
      id: 'PRE-ORDER',
      orderNumber: 'PRE-ORDER',
      customerName: user?.name || t('common.guest'),
      createdAt: new Date().toISOString(),
      items: cart.map(item => ({
        name: item.menuItem.name,
        quantity: item.quantity,
        price: item.menuItem.price,
        selectedVariant: item.selectedVariant,
        selectedModifiers: item.selectedModifiers
      })),
      subtotal,
      tax: tax + serviceCharge,
      total,
      paymentMethod: activeTab === 'card' ? 'Card' : 
                     activeTab === 'khqr' ? 'KHQR' : 
                     activeTab === 'cash' ? 'Cash' : 'Gift Card',
      paymentStatus: 'Pending',
      type: orderType,
      table: selectedTable
    };
    printReceipt(mockOrder, t('common.appName'));
  };

  const handleCheckBalance = async () => {
    if (!giftCardNumber || !giftCardPin) {
      toast.error(t('checkout.giftCardPlaceholder'));
      return;
    }
    setIsCheckingBalance(true);
    try {
      const response = await api.post("/gift-cards/check-balance", {
        cardNumber: giftCardNumber,
        pin: giftCardPin
      });
      setGiftCardBalance(response.data.balance);
      toast.success(`${t('rewards.balance')}: $${response.data.balance.toFixed(2)}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to check balance");
      setGiftCardBalance(null);
    } finally {
      setIsCheckingBalance(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="bg-card px-4 sm:px-8 py-4 flex items-center justify-between border-b border-border sticky top-0 z-50 transition-colors duration-300">
        <div className="flex items-center gap-2 sm:gap-6">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-accent/50 rounded-full transition-colors"
          >
            <ArrowLeft size={18} className="sm:w-5 sm:h-5 text-card-foreground" />
          </button>
          <h1 className="text-sm sm:text-lg font-bold text-card-foreground truncate max-w-[120px] sm:max-w-none">{t('checkout.title')}</h1>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-4">
          <button 
            onClick={() => setLanguage(language === 'en' ? 'km' : 'en')}
            className="p-2 hover:bg-accent/50 rounded-lg transition-colors flex items-center gap-1 sm:gap-2 text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
            title={t('checkout.switchLanguage')}
          >
            <Globe size={16} className="sm:w-4.5 sm:h-4.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {language === 'en' ? 'EN' : 'KM'}
            </span>
          </button>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-muted border border-border rounded-xl text-xs font-bold text-muted-foreground">
            <Lock size={14} className="text-muted-foreground/50" />
            {t('checkout.secureSession')}
          </div>
          <div className="relative" ref={profileRef}>
            <div 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted border-2 border-card shadow-sm overflow-hidden flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary transition-all"
            >
              <img src={user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Felix'}`} alt={t('common.userAvatar')} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-56 bg-card rounded-2xl shadow-xl border border-border overflow-hidden z-50 transition-colors duration-300"
                >
                  <div className="p-4 border-b border-border bg-muted/50">
                    <p className="text-sm font-bold text-card-foreground">{user?.name || t('common.guest')}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{user?.email || t('auth.notLoggedIn')}</p>
                  </div>
                  <div className="p-2">
                    {isAuthenticated ? (
                      <>
                        <button 
                          onClick={() => { navigate('/admin/settings'); setIsProfileOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent/50 rounded-xl transition-colors"
                        >
                          <Settings size={16} />
                          {t('auth.settings')}
                        </button>
                        <div className="h-px bg-border my-1" />
                        <button 
                          onClick={() => { logout(); setIsProfileOpen(false); toast.success(t('auth.logoutSuccess')); navigate('/login'); }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                        >
                          <LogOut size={16} />
                          {t('auth.logout')}
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => { navigate('/login'); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-primary hover:bg-accent/50 rounded-xl transition-colors"
                      >
                        <Lock size={16} />
                        {t('auth.login')}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Payment Method */}
          <div className="lg:col-span-7 space-y-6">
            {/* Order Type Selection */}
            <div className="bg-card rounded-3xl border border-border p-6 shadow-sm transition-colors duration-300">
              <h3 className="text-lg font-bold mb-4 text-card-foreground">{t('checkout.orderType')}</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setOrderType('Dine-in')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    orderType === 'Dine-in' ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    orderType === 'Dine-in' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <CheckCircle2 size={20} />
                  </div>
                  <span className={cn("font-bold text-sm", orderType === 'Dine-in' ? "text-card-foreground" : "text-muted-foreground")}>{t('checkout.dineIn')}</span>
                </button>
                <button
                  onClick={() => setOrderType('Takeaway')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    orderType === 'Takeaway' ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    orderType === 'Takeaway' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <ArrowLeft className="rotate-180" size={20} />
                  </div>
                  <span className={cn("font-bold text-sm", orderType === 'Takeaway' ? "text-card-foreground" : "text-muted-foreground")}>{t('checkout.takeaway')}</span>
                </button>
              </div>

              {orderType === 'Dine-in' && (
                <div className="mt-6 space-y-3">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('checkout.tableNumber')}</label>
                  <div className="grid grid-cols-5 gap-2">
                    {['01', '02', '03', '04', '05'].map(tableNum => (
                      <button
                        key={`table-select-${tableNum}`}
                        onClick={() => setSelectedTable(tableNum)}
                        className={cn(
                          "py-2.5 rounded-lg font-bold text-xs transition-all",
                          selectedTable === tableNum ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent/50"
                        )}
                      >
                        {tableNum}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-display font-black mb-1 text-card-foreground">{t('checkout.paymentMethod')}</h2>
              <p className="text-xs text-muted-foreground font-medium">{t('checkout.paymentDesc')}</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border overflow-x-auto no-scrollbar">
              {PAYMENT_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 px-4 sm:px-6 py-3 transition-all relative min-w-[80px] sm:min-w-0",
                    activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.icon}
                  <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" 
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Payment Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'card' && (
                <motion.div 
                  key="card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-card rounded-3xl border border-border p-6 shadow-sm space-y-6 transition-colors duration-300"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('checkout.cardNumber')}</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50">
                        <CreditCard size={18} />
                      </div>
                      <input 
                        type="text" 
                        placeholder={t('checkout.cardNumberPlaceholder')} 
                        className="w-full pl-12 pr-20 py-3.5 bg-muted border-none rounded-xl text-base font-medium tracking-widest focus:ring-2 focus:ring-primary transition-all text-card-foreground placeholder:text-muted-foreground/50"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        <div className="w-7 h-4 bg-muted border border-border rounded flex items-center justify-center text-[7px] font-bold text-muted-foreground">MC</div>
                        <div className="w-7 h-4 bg-primary/10 rounded flex items-center justify-center text-[7px] font-bold text-primary">VISA</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('checkout.expiryDate')}</label>
                      <input 
                        type="text" 
                        placeholder={t('checkout.expiryPlaceholder')} 
                        className="w-full px-4 py-3.5 bg-muted border-none rounded-xl text-base font-medium focus:ring-2 focus:ring-primary transition-all text-card-foreground placeholder:text-muted-foreground/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('checkout.cvc')}</label>
                        <HelpCircle size={14} className="text-muted-foreground/30 cursor-help" />
                      </div>
                      <input 
                        type="text" 
                        placeholder={t('checkout.cvcPlaceholder')} 
                        className="w-full px-4 py-3.5 bg-muted border-none rounded-xl text-base font-medium focus:ring-2 focus:ring-primary transition-all text-card-foreground placeholder:text-muted-foreground/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('checkout.cardholderName')}</label>
                    <input 
                      type="text" 
                      placeholder={t('checkout.namePlaceholder')} 
                      className="w-full px-4 py-3.5 bg-muted border-none rounded-xl text-base font-medium focus:ring-2 focus:ring-primary transition-all text-card-foreground placeholder:text-muted-foreground/50"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <button 
                      onClick={() => setBillingSame(!billingSame)}
                      className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                        billingSame ? "bg-primary border-primary" : "border-border"
                      )}
                    >
                      {billingSame && <CheckCircle2 size={12} className="text-primary-foreground" />}
                    </button>
                    <span className="text-xs font-medium text-muted-foreground">{t('checkout.sameAsShipping')}</span>
                  </div>
                </motion.div>
              )}

              {activeTab === 'khqr' && (
                <motion.div 
                  key="khqr"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-card rounded-3xl border border-border p-8 shadow-sm flex flex-col items-center text-center transition-colors duration-300"
                >
                  <div className="w-48 h-48 bg-muted rounded-3xl border-2 border-dashed border-border flex items-center justify-center mb-6 relative group overflow-hidden">
                    {khqrImage ? (
                      <img 
                        src={khqrImage} 
                        alt="KHQR" 
                        className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <RefreshCw className="animate-spin-slow" size={32} />
                        <p className="text-[10px] font-bold uppercase tracking-widest">{t('checkout.loadingQR')}</p>
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-card/40 backdrop-blur-[2px]">
                      <RefreshCw className="text-primary animate-spin-slow" size={32} />
                    </div>
                  </div>
                  <h4 className="text-lg font-bold mb-2 text-card-foreground">{t('checkout.scanToPay')}</h4>
                  <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed">
                    {t('checkout.scanToPayDesc')}
                  </p>
                  <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                    {t('checkout.waitingForPayment')}
                  </div>
                </motion.div>
              )}

              {activeTab === 'cash' && (
                <motion.div 
                  key="cash"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-card rounded-3xl border border-border p-8 shadow-sm text-center transition-colors duration-300"
                >
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Wallet size={32} />
                  </div>
                  <h4 className="text-lg font-bold mb-2 text-card-foreground">{t('checkout.cash')}</h4>
                  <p className="text-xs text-muted-foreground max-w-[280px] mx-auto leading-relaxed mb-8">
                    {t('checkout.cashDesc')}
                  </p>
                  <div className="p-4 bg-muted rounded-2xl border border-border inline-block">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">{t('checkout.amountToPay')}</p>
                    <p className="text-2xl font-display font-black text-card-foreground">${total.toFixed(2)}</p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'gift' && (
                <motion.div 
                  key="gift"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-card rounded-3xl border border-border p-6 shadow-sm space-y-6 transition-colors duration-300"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('checkout.giftCardNumber')}</label>
                    <input 
                      type="text" 
                      placeholder={t('checkout.giftCardPlaceholder')} 
                      value={giftCardNumber}
                      onChange={(e) => setGiftCardNumber(e.target.value)}
                      className="w-full px-4 py-3.5 bg-muted border-none rounded-xl text-base font-medium tracking-widest focus:ring-2 focus:ring-primary transition-all text-card-foreground placeholder:text-muted-foreground/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('checkout.pin')}</label>
                    <input 
                      type="password" 
                      placeholder={t('checkout.pinPlaceholder')} 
                      value={giftCardPin}
                      onChange={(e) => setGiftCardPin(e.target.value)}
                      className="w-full px-4 py-3.5 bg-muted border-none rounded-xl text-base font-medium focus:ring-2 focus:ring-primary transition-all text-card-foreground placeholder:text-muted-foreground/50"
                    />
                  </div>
                  {giftCardBalance !== null && (
                    <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">{t('rewards.balance')}</p>
                      <p className="text-xl font-display font-black text-primary">${giftCardBalance.toFixed(2)}</p>
                    </div>
                  )}
                  <button 
                    onClick={handleCheckBalance}
                    disabled={isCheckingBalance}
                    className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    {isCheckingBalance ? <Loader2 size={16} className="animate-spin" /> : t('checkout.checkBalance')}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>


            {/* Security Badges */}
            <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2 text-xs font-bold text-primary">
                  <ShieldCheck size={16} />
                  {t('checkout.secureCheckout')}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-primary">
                  <CheckCircle2 size={16} />
                  {t('checkout.pciCompliant')}
                </div>
              </div>
              <p className="text-xs font-bold text-muted-foreground">{t('checkout.poweredBy')}</p>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-card rounded-3xl border border-border shadow-xl overflow-hidden sticky top-24 transition-colors duration-300">
              <div className="p-6 border-b border-border">
                <h3 className="text-xl font-bold mb-0.5 text-card-foreground">{t('checkout.orderSummary')}</h3>
                <p className="text-xs text-muted-foreground font-medium">{t('checkout.storeName')}</p>
              </div>

              <div className="p-6 space-y-6 max-h-[350px] overflow-y-auto custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingBag size={40} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">{t('cart.empty')}</p>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div key={`checkout-item-${item.id || idx}-${idx}`} className="flex gap-4 group">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                        <img src={item.menuItem.image} alt={t('common.itemImage')} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-0.5">
                          <h4 className="text-sm font-bold text-card-foreground">{item.menuItem.name}</h4>
                          <span className="text-sm font-bold text-card-foreground">${(item.menuItem.price * item.quantity).toFixed(2)}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium mb-2">
                          {item.quantity}x • {item.selectedVariant?.name || t('checkout.standard')}
                          {item.selectedModifiers.length > 0 && ` • ${item.selectedModifiers.map(m => m.name).join(', ')}`}
                        </p>
                        <div className="flex items-center gap-3">
                          <button className="text-[9px] font-bold text-primary uppercase tracking-widest hover:underline">{t('common.edit')}</button>
                          <div className="w-px h-2 bg-border" />
                          <button className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest hover:text-destructive transition-colors">{t('common.remove')}</button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 bg-muted/50 space-y-3">
                <div className="flex justify-between text-xs font-medium text-muted-foreground">
                  <span>{t('checkout.subtotal')}</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-medium text-muted-foreground">
                  <span>{t('checkout.serviceCharge')}</span>
                  <span>${serviceCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-medium text-muted-foreground">
                  <span>{t('checkout.tax')}</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-xs font-bold text-primary">
                    <span>{t('checkout.discount')}</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-end pt-2">
                  <span className="text-base font-bold text-card-foreground">{t('checkout.total')}</span>
                  <span className="text-2xl font-display font-black text-card-foreground">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder={t('checkout.promoCode')} 
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1 px-4 py-3 bg-muted border-none rounded-xl text-xs font-bold uppercase tracking-widest focus:ring-2 focus:ring-primary transition-all text-card-foreground placeholder:text-muted-foreground/50"
                  />
                  <button 
                    onClick={handleApplyPromo}
                    disabled={isValidatingPromo || !promoCode}
                    className="px-4 py-3 bg-primary text-primary-foreground rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {isValidatingPromo ? <Loader2 size={12} className="animate-spin" /> : t('checkout.apply')}
                  </button>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder || cart.length === 0}
                    className="flex-1 bg-primary text-primary-foreground py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl shadow-primary/20 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPlacingOrder ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        {t('checkout.placeOrder')} ${total.toFixed(2)}
                        <Lock size={18} className="group-hover:scale-110 transition-transform" />
                      </>
                    )}
                  </button>
                  <button 
                    onClick={handlePrintReceipt}
                    className="p-4 bg-card border border-border text-muted-foreground rounded-2xl hover:bg-accent/50 transition-all flex items-center justify-center"
                    title={t('checkout.printReceipt')}
                  >
                    <Printer size={20} />
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-4 leading-relaxed px-2">
                  {t('checkout.terms')}
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
