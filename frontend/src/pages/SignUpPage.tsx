import { useState, useEffect, type FormEvent } from "react";
import { Mail, Lock, Eye, EyeOff, AlertCircle, User, Coffee, ArrowRight, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { signup, getGoogleAuthUrl } from "../services/authService";
import { toast } from "sonner";
import { useLanguage } from "@/LanguageContext";
import { useAuth } from "@/AuthContext";
import { useLocation } from "@/LocationContext";
import SupportModal from "@/components/SupportModal";

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.05 20.28c-.98.95-2.05 1.61-3.22 1.61-1.14 0-1.54-.71-2.87-.71-1.35 0-1.85.71-2.87.71-1.14 0-2.29-.75-3.26-1.71-1.99-1.97-3.41-5.63-3.41-8.79 0-3.13 1.61-4.82 3.13-4.82 1.1 0 1.85.63 2.68.63.79 0 1.22-.63 2.52-.63 1.35 0 2.44.67 3.11 1.65-2.76 1.65-2.32 5.39.46 6.53-.59 1.5-1.37 3.01-2.27 3.53zM12.03 7.25c-.11-2.13 1.65-3.94 3.53-4.25.22 2.17-1.77 4.17-3.53 4.25z"/>
  </svg>
);

export default function SignUpPage() {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('signup');
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { currentLocation } = useLocation();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.endsWith('.run.app') && !event.origin.includes('localhost')) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { user: userData, token } = event.data.payload;
        login(userData);
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));
        
        toast.success(`${t('auth.welcomeBack')}, ${userData.name}!`);
        
        if (["admin", "manager"].includes(userData.role)) {
          navigate("/admin");
        } else {
          // If staff has admin permissions but no order permission, send to admin dashboard
          const perms = userData.permissions || {};
          const hasAdminPerms = Object.entries(perms).some(([key, val]) => 
            key !== 'manageOrders' && val === true
          );
          
          if (hasAdminPerms && perms.manageOrders === false) {
            navigate("/admin");
          } else {
            navigate("/staff");
          }
        }
      } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        toast.error(`Google login failed: ${event.data.error}`);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [login, navigate, t]);

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await signup({ 
        name, 
        email, 
        password,
        locationId: currentLocation?.id || currentLocation?._id 
      });
      toast.success(t('auth.accountCreated'));
      navigate("/login");
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || t('auth.signupError');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { url } = await getGoogleAuthUrl();
      const authWindow = window.open(
        url,
        'google_oauth_popup',
        'width=600,height=700'
      );

      if (!authWindow) {
        toast.error('Please allow popups to login with Google');
      }
    } catch (err: any) {
      toast.error('Failed to initiate Google login');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 font-sans transition-colors duration-300">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 bg-card rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden lg:min-h-[700px] border border-border transition-colors duration-300 relative">
        
        {/* Left Side: Brand & Image (Visible on LG up) */}
        <div className="hidden lg:flex flex-col relative bg-[#121212] p-16 justify-between overflow-hidden">
          <div className="absolute inset-0 z-0">
             <img 
              src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=2000&auto=format&fit=crop" 
              alt="Artisan Coffee" 
              className="w-full h-full object-cover opacity-60 scale-110 hover:scale-100 transition-transform duration-[15s] ease-out"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-primary/5" />
          </div>

          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-4 group">
              <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-all duration-500 shadow-2xl shadow-primary/30 overflow-hidden">
                <img src="/cafedev_logo.png" alt="Logo" className="w-10 h-10 object-contain" />
              </div>
              <span className="font-display font-bold text-3xl text-white tracking-tight drop-shadow-md">{t('common.appName')}</span>
            </Link>
          </div>

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-5xl font-display font-bold text-white mb-8 leading-[1.05] tracking-tight">
                {t('auth.joinCommunity')}
              </h2>
              <p className="text-lg text-gray-300 font-medium leading-relaxed max-w-sm opacity-90">
                {t('auth.signupDesc')}
              </p>
            </motion.div>


          </div>

          <div className="relative z-10 flex gap-8 text-[10px] uppercase font-bold tracking-[0.3em] text-white/50">
            <span className="hover:text-primary transition-colors cursor-pointer hover:translate-y-[-2px] duration-300">INSTAGRAM</span>
            <span className="hover:text-primary transition-colors cursor-pointer hover:translate-y-[-2px] duration-300">TWITTER</span>
            <span className="hover:text-primary transition-colors cursor-pointer hover:translate-y-[-2px] duration-300">FACEBOOK</span>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 sm:p-12 lg:p-20 flex flex-col justify-center relative bg-card">
          <div className="lg:hidden absolute top-8 left-8 right-8 flex justify-between items-center">
             <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden">
                <img src="/cafedev_logo.png" alt="Logo" className="w-7 h-7 object-contain" />
              </div>
              <span className="font-display font-bold text-lg text-foreground tracking-tight">{t('common.appName')}</span>
            </Link>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm mx-auto"
          >
            <div className="mb-8 text-center lg:text-left pt-12 lg:pt-0">
              <h1 className="text-4xl font-display font-bold mb-4 tracking-tight text-card-foreground">
                {t('auth.signup')}
              </h1>
              <p className="text-sm text-muted-foreground font-medium">
                {t('auth.signupWelcome')}
              </p>
            </div>

            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('auth.fullName')}</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('checkout.namePlaceholder')}
                    className="w-full pl-12 pr-4 py-3.5 bg-muted/30 border border-border rounded-2xl font-semibold text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-card-foreground placeholder:text-muted-foreground/50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('auth.emailAddress')}</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.emailPlaceholder')}
                    className="w-full pl-12 pr-4 py-3.5 bg-muted/30 border border-border rounded-2xl font-semibold text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-card-foreground placeholder:text-muted-foreground/50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('auth.password')}</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3.5 bg-muted/30 border border-border rounded-2xl font-semibold text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-card-foreground placeholder:text-muted-foreground/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs font-bold flex items-center gap-3">
                      <AlertCircle size={16} />
                      {error}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-sm flex items-center justify-center gap-3 hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-primary/20 group mt-4"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    {t('auth.signup')}
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-card px-4 text-muted-foreground font-black tracking-[0.2em]">{t('auth.orContinueWith')}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-3 py-3 border border-border rounded-2xl hover:bg-muted font-bold text-[11px] uppercase tracking-widest text-card-foreground transition-all hover:border-muted-foreground/20"
              >
                <div className="bg-white p-1 rounded-full shadow-sm">
                  <GoogleIcon />
                </div>
                Google
              </button>
              <button className="flex items-center justify-center gap-3 py-3 border border-border rounded-2xl hover:bg-muted font-bold text-[11px] uppercase tracking-widest text-card-foreground transition-all hover:border-muted-foreground/20">
                <AppleIcon />
                Apple
              </button>
            </div>

            <div className="mt-8 text-center text-xs text-muted-foreground font-medium">
              {t('auth.alreadyMember')}{' '}
              <Link to="/login" className="text-primary font-bold hover:underline transition-all">
                {t('auth.login')}
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-8 opacity-50">
        <Link to="/privacy" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">{t('auth.privacyPolicy')}</Link>
        <span className="hidden sm:inline w-1 h-1 bg-muted-foreground rounded-full" />
        <Link to="/terms" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">{t('auth.termsOfService')}</Link>
        <span className="hidden sm:inline w-1 h-1 bg-muted-foreground rounded-full" />
        <button onClick={() => setIsSupportOpen(true)} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">{t('auth.support')}</button>
      </div>

      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
    </div>
  );
}
