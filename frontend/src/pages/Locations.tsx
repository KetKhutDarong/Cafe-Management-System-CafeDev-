import { MapPin, Phone, Clock, Coffee, ArrowRight, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../LanguageContext";
import { useLocation } from "../LocationContext";
import { cn } from "@/lib/utils";

export default function Locations() {
  const { t } = useLanguage();
  const { locations, isLoading, setCurrentLocation } = useLocation();
  const navigate = useNavigate();

  const handleSelectLocation = (loc: any) => {
    setCurrentLocation(loc);
    navigate('/');
  };

  const handleGetDirections = (loc: any) => {
    if (loc.addressUrl) {
      window.open(loc.addressUrl, '_blank');
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.name)}`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans transition-colors duration-300">
      <header className="bg-card px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between border-b border-border sticky top-0 z-10 transition-colors duration-300">
        <div className="flex items-center gap-4">
          <Link to="/" className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground overflow-hidden">
            <img src="/cafedev_logo.png" alt="Logo" className="w-8 h-8 object-contain translate-y-[-1px]" />
          </Link>
          <h1 className="font-display font-bold text-lg sm:text-xl tracking-tight text-card-foreground">{t('locations.title')}</h1>
        </div>
        <nav className="flex items-center gap-4 sm:gap-6">
          <Link to="/" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">{t('nav.menu')}</Link>
          <Link to="/login" className="px-4 sm:px-5 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all">{t('auth.login')}</Link>
        </nav>
      </header>

      <main className="p-4 sm:p-8 max-w-7xl mx-auto">
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4 text-foreground">{t('locations.findNear')}</h2>
          <p className="text-muted-foreground font-medium">{t('locations.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {locations.map((loc, idx) => (
            <div key={loc.id || loc._id || `loc-${idx}`} className="bg-card rounded-[40px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group border border-border">
              <div className="h-64 relative overflow-hidden">
                <img src={loc.image} alt={loc.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <span className={cn(
                    "px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-widest",
                    loc.status === 'Active' ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                  )}>
                    {loc.status === 'Active' ? t('locations.openNow') : 'Closed'}
                  </span>
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-display font-bold mb-6 text-card-foreground">{loc.name}</h3>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-4">
                    <MapPin size={20} className="text-primary shrink-0" />
                    <p className="text-sm text-muted-foreground font-medium">{loc.address}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Phone size={20} className="text-primary shrink-0" />
                    <p className="text-sm text-muted-foreground font-medium">{loc.phone || 'No phone'}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Clock size={20} className="text-primary shrink-0" />
                    <p className="text-sm text-muted-foreground font-medium">{loc.hours || 'No hours'}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => handleSelectLocation(loc)}
                    className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 shadow-lg shadow-primary/20 transition-all group"
                  >
                    {t('menu.selectBranch')}
                    <Coffee size={18} className="transition-transform group-hover:scale-110" />
                  </button>
                  <button 
                    onClick={() => handleGetDirections(loc)}
                    className="w-full py-4 bg-muted rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-accent transition-all group text-muted-foreground"
                  >
                    {t('locations.getDirections')}
                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
