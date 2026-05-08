import { useState, type FormEvent, useEffect } from "react";
import { Search, Plus, MapPin, Phone, Clock, X, Save, Trash2, Loader2, Edit2, Camera, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useLanguage } from "@/LanguageContext";
import { useLocation } from "@/LocationContext";
import api from "@/services/api";
import ConfirmModal from "@/components/ConfirmModal";
import SupportModal from "@/components/SupportModal";

interface Location {
  id: string;
  _id?: string;
  name: string;
  address: string;
  addressUrl?: string;
  phone?: string;
  hours?: string;
  image?: string;
  status: 'Active' | 'Inactive';
}

export default function LocationManagement() {
  const { t } = useLanguage();
  const { locations, refreshLocations } = useLocation();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<string | null>(null);

  const filteredLocations = locations.filter(loc => 
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveLocation = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const locationData = {
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      addressUrl: formData.get('addressUrl') as string,
      phone: formData.get('phone') as string,
      hours: formData.get('hours') as string,
      image: formData.get('image') as string || "https://images.unsplash.com/photo-1525610553991-2bede1a236e2?auto=format&fit=crop&q=80&w=800",
      status: formData.get('status') as 'Active' | 'Inactive',
    };

    try {
      setLoading(true);
      if (editingLocation) {
        await api.put(`/locations/${editingLocation.id || editingLocation._id}`, locationData);
        toast.success(t('location.successUpdate'));
      } else {
        await api.post("/locations", locationData);
        toast.success(t('location.successAdd'));
      }
      await refreshLocations();
      setIsModalOpen(false);
      setEditingLocation(null);
    } catch (error) {
      toast.error(t('location.saveError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    try {
      setLoading(true);
      await api.delete(`/locations/${id}`);
      await refreshLocations();
      toast.success(t('location.successDelete'));
    } catch (error) {
      toast.error(t('location.deleteError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 bg-background min-h-full transition-colors duration-300">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold mb-1 text-foreground">{t('location.mgmtTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('location.mgmtSubtitle')}</p>
        </div>
        <button 
          onClick={() => { setEditingLocation(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus size={18} />
          {t('location.addNew')}
        </button>
      </header>

      <div className="mb-8 relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input
          type="text"
          placeholder="Search branches..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-card border-none rounded-2xl shadow-sm text-sm text-foreground focus:ring-2 focus:ring-primary transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredLocations.map((loc, idx) => (
          <div key={`loc-card-${loc.id || loc._id || idx}-${idx}`} className="bg-card rounded-[40px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group border border-border">
            <div className="h-48 relative overflow-hidden">
              <img src={loc.image} alt={loc.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-6 left-6 flex items-center gap-2">
                <span className={cn(
                  "px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-widest",
                  loc.status === 'Active' ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                )}>
                  {loc.status}
                </span>
              </div>
              <div className="absolute top-4 right-4 flex gap-2">
                <button 
                  onClick={() => { setEditingLocation(loc); setIsModalOpen(true); }}
                  className="p-2 bg-white/20 backdrop-blur-md text-white rounded-xl hover:bg-white/40 transition-all"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => {
                    setLocationToDelete(loc.id || loc._id!);
                    setIsConfirmOpen(true);
                  }}
                  className="p-2 bg-destructive/20 backdrop-blur-md text-destructive rounded-xl hover:bg-destructive/40 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="p-8">
              <h3 className="text-xl font-display font-bold mb-4 text-foreground">{loc.name}</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-primary shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-muted-foreground font-medium">{loc.address}</p>
                    {loc.addressUrl && (
                      <a 
                        href={loc.addressUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] text-primary hover:underline font-bold"
                      >
                        View on Map
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-primary shrink-0" />
                  <p className="text-xs text-muted-foreground font-medium">{loc.phone || 'No phone'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Clock size={16} className="text-primary shrink-0" />
                  <p className="text-xs text-muted-foreground font-medium">{loc.hours || 'No hours'}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
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
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-card rounded-[40px] shadow-2xl overflow-hidden border border-border"
            >
              <div className="p-8 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-display font-bold text-foreground">{editingLocation ? t('location.edit') : t('location.addNew')}</h3>
                  <p className="text-sm text-muted-foreground">{t('location.enterDetails')}</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-3 bg-muted text-muted-foreground rounded-2xl hover:bg-accent/50 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveLocation} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{t('location.name')}</label>
                    <input
                      name="name"
                      defaultValue={editingLocation?.name}
                      required
                      className="w-full px-4 py-3 bg-muted border-none rounded-2xl text-sm text-foreground focus:ring-2 focus:ring-primary transition-all"
                      placeholder="e.g. CafeDev Central"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{t('location.address')}</label>
                    <input
                      name="address"
                      defaultValue={editingLocation?.address}
                      required
                      className="w-full px-4 py-3 bg-muted border-none rounded-2xl text-sm text-foreground focus:ring-2 focus:ring-primary transition-all"
                      placeholder="Full street address"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{t('location.addressUrl')}</label>
                    <input
                      name="addressUrl"
                      defaultValue={editingLocation?.addressUrl}
                      className="w-full px-4 py-3 bg-muted border-none rounded-2xl text-sm text-foreground focus:ring-2 focus:ring-primary transition-all"
                      placeholder="https://maps.google.com/..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{t('location.phone')}</label>
                      <input
                        name="phone"
                        defaultValue={editingLocation?.phone}
                        className="w-full px-4 py-3 bg-muted border-none rounded-2xl text-sm text-foreground focus:ring-2 focus:ring-primary transition-all"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{t('location.hours')}</label>
                      <input
                        name="hours"
                        defaultValue={editingLocation?.hours}
                        className="w-full px-4 py-3 bg-muted border-none rounded-2xl text-sm text-foreground focus:ring-2 focus:ring-primary transition-all"
                        placeholder="e.g. 6:00 AM - 8:00 PM"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Image URL</label>
                    <input
                      name="image"
                      defaultValue={editingLocation?.image}
                      className="w-full px-4 py-3 bg-muted border-none rounded-2xl text-sm text-foreground focus:ring-2 focus:ring-primary transition-all"
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{t('location.status')}</label>
                    <select
                      name="status"
                      defaultValue={editingLocation?.status || 'Active'}
                      className="w-full px-4 py-3 bg-muted border-none rounded-2xl text-sm text-foreground focus:ring-2 focus:ring-primary transition-all"
                    >
                      <option value="Active">{t('location.active')}</option>
                      <option value="Inactive">{t('location.inactive')}</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  {t('common.save')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <SupportModal isOpen={false} onClose={() => {}} /> {/* Placeholder if needed */}
      
      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => locationToDelete && handleDeleteLocation(locationToDelete)}
        title={t('location.deleteConfirmTitle') || 'Delete Location'}
        message={t('location.deleteConfirm')}
      />
    </div>
  );
}
