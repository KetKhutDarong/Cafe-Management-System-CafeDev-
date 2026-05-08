import { useState, useEffect, type ReactNode } from "react";
import { Check, Clock, Coffee, Utensils, Bell, ArrowLeft, Star, Heart, Share2, MapPin, Phone, Info, Printer, Loader2, ShoppingBag, ChevronRight, Calendar, Gift } from "lucide-react";
import { printReceipt } from "@/lib/printReceipt";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/AuthContext";
import { useLanguage } from "@/LanguageContext";
import { useLocation } from "@/LocationContext";
import api from "@/services/api";
import { Order } from "@/types";
import SupportModal from "@/components/SupportModal";
import FeedbackModal from "@/components/FeedbackModal";

export default function OrderStatus() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const { currentLocation } = useLocation();

  const STATUS_STEPS = [
    { id: 'Pending', label: t('order.status.pending'), icon: <Bell size={24} />, description: t('order.desc.pending') },
    { id: 'Preparing', label: t('order.status.preparing'), icon: <Utensils size={24} />, description: t('order.desc.preparing') },
    { id: 'Ready', label: t('order.status.ready'), icon: <Coffee size={24} />, description: t('order.desc.ready') },
    { id: 'Completed', label: t('order.status.completed'), icon: <Check size={24} />, description: t('order.desc.completed') },
  ];

  const [order, setOrder] = useState<Order | null>(null);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const fetchOrder = async (showLoading = false) => {
    if (!orderId) {
      if (isAuthenticated) {
        if (showLoading) setLoading(true);
        try {
          const params = currentLocation ? { locationId: currentLocation.id || currentLocation._id } : {};
          const response = await api.get("/orders/my-orders", { params });
          setMyOrders(response.data);
          setError(null);
        } catch (err) {
          console.error("Error fetching my orders:", err);
          setError(t('order.error.loadOrders'));
        } finally {
          if (showLoading) setLoading(false);
        }
      } else {
        setLoading(false);
      }
      return;
    }

    if (showLoading) setLoading(true);
    try {
      const response = await api.get(`/orders/${orderId}`);
      const newOrder = response.data;
      
      // Check if status changed to Completed to show rewards toast
      if (order && order.status !== 'Completed' && newOrder.status === 'Completed') {
        toast.success(t('order.completed.toast'), {
          description: t('order.earnedPoints', { points: Math.round(newOrder.total * 10) }),
          duration: 5000,
        });
      }

      // Check if payment status changed to Paid
      if (order && order.paymentStatus !== 'Paid' && newOrder.paymentStatus === 'Paid') {
        toast.success(t('order.paymentReceived'), {
          description: t('order.paymentConfirmed'),
          duration: 5000,
        });
      }
      
      setOrder(newOrder);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching order:", err);
      setError(t('order.error.loadStatus'));
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder(true);
    
    // Polling every 5 seconds if viewing a specific order
    let interval: any;
    if (orderId) {
      interval = setInterval(() => {
        fetchOrder();
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [orderId, isAuthenticated]);

  // Simulate time left based on status
  useEffect(() => {
    if (order) {
      if (order.status === 'Pending') setTimeLeft(15);
      else if (order.status === 'Preparing') setTimeLeft(8);
      else if (order.status === 'Ready') setTimeLeft(2);
      else if (order.status === 'Completed') setTimeLeft(0);
    }
  }, [order?.status]);

  const handlePrintReceipt = () => {
    if (!order) return;
    toast.success(t('order.generatingReceipt'));
    printReceipt(order, t('common.appName'));
  };

  const handleShare = async () => {
    if (!order) return;
    const shareData = {
      title: `${t('common.appName')} - Order #${order.orderNumber || order.id.slice(-6)}`,
      text: `${t('order.checkingStatus', { appName: t('common.appName') })}: ${order.status}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success(t('order.linkCopied'));
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const toggleFavorite = () => {
    setIsFavorited(!isFavorited);
    if (!isFavorited) {
      toast.success(t('order.addedToFavorites'));
    } else {
      toast.info(t('order.removedFromFavorites'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 size={48} className="text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium">{t('order.loadingStatus')}</p>
      </div>
    );
  }

  if (error || (!order && orderId)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center transition-colors duration-300">
        <div className="w-20 h-20 bg-destructive/10 rounded-3xl flex items-center justify-center text-destructive mb-6">
          <Bell size={40} />
        </div>
        <h2 className="text-2xl font-display font-bold mb-2 text-foreground">{t('order.notFound')}</h2>
        <p className="text-muted-foreground max-w-xs mx-auto mb-8">{t('order.notFoundDesc')}</p>
        <Link to="/" className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:opacity-90 transition-all">
          {t('order.backToMenu')}
        </Link>
      </div>
    );
  }

  if (!orderId) {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans transition-colors duration-300">
        <header className="bg-card px-6 py-6 flex items-center justify-between border-b border-border sticky top-0 z-10">
          <Link to="/" className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div className="text-center">
            <h1 className="font-display font-bold text-xl tracking-tight text-card-foreground">{t('order.myOrders')}</h1>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{t('order.history')} • {user?.name || t('common.guest')}</p>
          </div>
          <div className="w-12 h-12" /> {/* Spacer */}
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-4xl mx-auto w-full">
          {!isAuthenticated ? (
            <div className="bg-card rounded-[40px] p-12 text-center shadow-sm border border-border">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center text-primary mx-auto mb-6">
                <ShoppingBag size={40} />
              </div>
              <h2 className="text-2xl font-display font-bold mb-2 text-card-foreground">{t('order.loginToSee')}</h2>
              <p className="text-muted-foreground mb-8">{t('order.loginDesc')}</p>
              <Link to="/login" className="inline-block px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:opacity-90 transition-all">
                {t('order.loginNow')}
              </Link>
            </div>
          ) : myOrders.length === 0 ? (
            <div className="bg-card rounded-[40px] p-12 text-center shadow-sm border border-border">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center text-muted-foreground/30 mx-auto mb-6">
                <ShoppingBag size={40} />
              </div>
              <h2 className="text-2xl font-display font-bold mb-2 text-card-foreground">{t('order.noOrders')}</h2>
              <p className="text-muted-foreground mb-8">{t('order.noOrdersDesc')}</p>
              <Link to="/" className="inline-block px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:opacity-90 transition-all">
                {t('order.browseMenu')}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myOrders.map((order: any, idx) => (
                <motion.div
                  key={`order-history-${order.id || order._id || `idx-${idx}`}-${idx}`}
                  whileHover={{ y: -4 }}
                  onClick={() => navigate(`/order-status/${order.id}`)}
                  className="bg-card p-6 rounded-[32px] shadow-sm border border-border hover:border-primary/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center",
                        order.status === 'Completed' ? "bg-primary/10 text-primary" : "bg-accent/50 text-accent-foreground"
                      )}>
                        {order.status === 'Completed' ? <Check size={28} /> : <Clock size={28} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-card-foreground">{t('order.orderNumberLabel')}{order.orderNumber || order.id.slice(-6)}</h3>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            order.status === 'Completed' ? "bg-primary/10 text-primary" : "bg-accent/50 text-accent-foreground"
                          )}>
                            {order.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(order.createdAt).toLocaleDateString()}</span>
                          <span className="w-1 h-1 bg-border rounded-full" />
                          <span>{t('order.itemsCount', { count: order.items?.length || 0 })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div className="hidden sm:block">
                        <p className="text-lg font-display font-bold text-card-foreground">${order.total.toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{order.type === 'Dine-in' ? t('checkout.dineIn') : t('checkout.takeaway')}</p>
                      </div>
                      <ChevronRight size={20} className="text-muted-foreground/30 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.id === order.status);
  const currentStep = currentStepIndex === -1 ? 0 : currentStepIndex;

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans transition-colors duration-300">
      <header className="bg-card px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between border-b border-border sticky top-0 z-10 transition-colors duration-300">
        <Link to="/" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
        </Link>
        <div className="text-center px-2">
          <h1 className="font-display font-bold text-lg sm:text-xl tracking-tight text-card-foreground truncate max-w-[150px] sm:max-w-none">{t('order.statusTitle')}</h1>
          <p className="text-[8px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-widest truncate max-w-[150px] sm:max-w-none">{t('order.orderNumberLabel')}{order.orderNumber || order.id.slice(-6)} • {order.customerName}</p>
        </div>
        <button 
          onClick={handleShare}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Share2 size={18} className="sm:w-5 sm:h-5" />
        </button>
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Column: Status */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-card rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 shadow-sm text-center relative overflow-hidden border border-border transition-colors duration-300">
              <div className="absolute top-0 left-0 right-0 h-2 bg-muted">
                <motion.div 
                  className="h-full bg-primary" 
                  initial={{ width: '0%' }}
                  animate={{ width: `${((currentStep + 1) / STATUS_STEPS.length) * 100}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
              
              <div className="mb-6 sm:mb-8 mt-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4 sm:mb-6 relative">
                  {order.status !== 'Completed' && (
                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                  )}
                  {order.paymentStatus === 'Paid' && order.paymentMethod === 'KHQR' && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg border-4 border-card z-20"
                    >
                      <Check size={16} strokeWidth={3} />
                    </motion.div>
                  )}
                  {STATUS_STEPS[currentStep].icon}
                </div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold mb-2 text-card-foreground">
                  {order.paymentMethod === 'KHQR' && order.paymentStatus === 'Paid' && order.status === 'Pending' 
                    ? t('order.paymentReceived') 
                    : STATUS_STEPS[currentStep].label}
                </h2>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {order.paymentMethod === 'KHQR' && order.paymentStatus === 'Paid' && order.status === 'Pending'
                    ? t('order.paymentConfirmedDesc')
                    : STATUS_STEPS[currentStep].description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border pt-6 sm:pt-8">
                <div className="text-center border-r border-border">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">{t('order.estimatedTime')}</p>
                  <p className="text-xl sm:text-2xl font-display font-bold text-card-foreground">{timeLeft} {t('order.mins')}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">{t('order.type')}</p>
                  <p className="text-xl sm:text-2xl font-display font-bold text-card-foreground">{order.type === 'Dine-in' ? t('checkout.dineIn') : t('checkout.takeaway')}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-2">
              {STATUS_STEPS.map((step, index) => (
                <div key={`status-step-${step.id || index}-${index}`} className="flex items-start gap-4 sm:gap-6 relative">
                  {index < STATUS_STEPS.length - 1 && (
                    <div className={cn(
                      "absolute left-5 sm:left-6 top-10 sm:top-12 w-0.5 h-10 sm:h-12",
                      index < currentStep ? "bg-primary" : "bg-muted"
                    )} />
                  )}
                  <div className={cn(
                    "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-500 z-10",
                    index <= currentStep ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-card text-muted-foreground/30 border border-border"
                  )}>
                    {index < currentStep ? <Check size={20} className="sm:w-6 sm:h-6" /> : step.icon}
                  </div>
                  <div className="pt-1 sm:pt-2">
                    <h4 className={cn(
                      "text-xs sm:text-sm font-bold uppercase tracking-widest",
                      index <= currentStep ? "text-card-foreground" : "text-muted-foreground/30"
                    )}>{step.label}</h4>
                    {index === currentStep && (
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 font-medium">{step.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card text-card-foreground rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 shadow-xl border border-border transition-colors duration-300">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h3 className="text-lg sm:text-xl font-display font-bold">{t('order.summary')}</h3>
                <p className="text-sm font-bold text-primary">${order.total.toFixed(2)}</p>
              </div>
              <div className="space-y-4 mb-6 sm:mb-8 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                {order.items.map((item, idx) => (
                  <div key={`order-item-summary-${(order as any).id || (order as any)._id || 'view'}-${(item as any).id || (item as any)._id || idx}-${idx}`} className="flex justify-between items-center">
                    <div className="flex gap-3">
                      <span className="text-sm font-bold text-muted-foreground">{item.quantity}x</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.name || item.menuItem?.name}</p>
                        {item.selectedVariant && (
                          <p className="text-[10px] text-muted-foreground">{item.selectedVariant.name}</p>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-bold flex-shrink-0">${((item.price || item.menuItem?.price || 0) * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              {order.paymentMethod === 'Gift Card' && (
                <div className="mb-6 p-4 bg-primary/10 rounded-2xl border border-primary/20 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                    <Gift size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{t('checkout.giftCard')}</p>
                    <p className="text-sm font-bold">Paid with Gift Card</p>
                    {order.giftCardNumber && (
                      <p className="text-[10px] text-muted-foreground tracking-widest">**** **** **** {order.giftCardNumber.slice(-4)}</p>
                    )}
                  </div>
                </div>
              )}

              <button 
                onClick={() => setIsSupportOpen(true)}
                className="w-full py-3.5 bg-muted hover:bg-accent/50 text-card-foreground rounded-xl sm:rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <span className="flex items-center gap-2">
                  <Info size={18} />
                  {t('order.needHelp')}
                </span>
              </button>
            </div>

            <div className="bg-card rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 shadow-sm border border-border transition-colors duration-300">
              <h3 className="text-lg sm:text-xl font-display font-bold mb-6 text-card-foreground">{t('order.branchInfo')}</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                    <MapPin size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-card-foreground">{t('order.mainBranch')}</p>
                    <p className="text-xs text-muted-foreground font-medium">{t('order.address')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                    <Phone size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-card-foreground">{t('order.phone')}</p>
                    <p className="text-xs text-muted-foreground font-medium">{t('order.callInquiries')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-card p-6 border-t border-border sticky bottom-0 z-10">
        <div className="max-w-2xl mx-auto flex gap-4">
          <button 
            onClick={() => setIsFeedbackOpen(true)}
            className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            <Star size={18} fill="currentColor" />
            {t('order.rate')}
          </button>
          <button 
            onClick={handlePrintReceipt}
            className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
            title={t('order.printReceipt')}
          >
            <Printer size={24} />
          </button>
          <button 
            onClick={toggleFavorite}
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
              isFavorited ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:text-destructive"
            )}
          >
            <Heart size={24} fill={isFavorited ? "currentColor" : "none"} />
          </button>
        </div>
      </footer>

      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
      <FeedbackModal 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
        orderId={(order as any)?.id || (order as any)?._id}
        orderNumber={order?.orderNumber}
      />
    </div>
  );
}
