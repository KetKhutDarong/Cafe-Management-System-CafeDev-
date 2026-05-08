import { useState, useEffect } from "react";
import { 
  Truck, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  MoreVertical,
  Calendar,
  Box,
  MapPin,
  RefreshCw,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/LanguageContext";
import { useLocation } from "@/LocationContext";
import api from "@/services/api";
import { toast } from "sonner";
import { StockTransfer } from "@/types";

export default function StockTransferPortal() {
  const { t } = useLanguage();
  const { currentLocation } = useLocation();
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'inbound' | 'outbound'>('all');

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const params = currentLocation ? { locationId: currentLocation.id || currentLocation._id } : {};
      const response = await api.get("/stock-transfers", { params });
      setTransfers(response.data);
    } catch (error) {
      toast.error("Failed to fetch stock transfers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [currentLocation]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/stock-transfers/${id}/status`, { status });
      toast.success(t('inventory.transferStatusUpdated') || "Transfer status updated");
      fetchTransfers();
    } catch (error) {
      toast.error(t('inventory.updateError'));
    }
  };

  const filteredTransfers = transfers.filter(tr => {
    if (filter === 'all') return true;
    const isDestination = (tr.toLocationId as any)._id === (currentLocation?.id || currentLocation?._id) || tr.toLocationId === (currentLocation?.id || currentLocation?._id);
    if (filter === 'inbound') return isDestination;
    if (filter === 'outbound') return !isDestination;
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Requested": return <Clock size={16} className="text-amber-500" />;
      case "Pending": return <Clock size={16} className="text-amber-500" />;
      case "In Transit": return <Truck size={16} className="text-primary" />;
      case "Completed": return <CheckCircle2 size={16} className="text-success" />;
      case "Cancelled": return <XCircle size={16} className="text-destructive" />;
      default: return <Clock size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Requested": return "bg-amber-100 text-amber-600";
      case "In Transit": return "bg-primary/10 text-primary";
      case "Completed": return "bg-success/10 text-success";
      case "Cancelled": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <RefreshCw size={40} className="text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex p-1 bg-muted rounded-xl gap-1">
          <button 
            onClick={() => setFilter('all')}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-lg transition-all",
              filter === 'all' ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:bg-card/50"
            )}
          >
            {t('common.all') || 'All'}
          </button>
          <button 
            onClick={() => setFilter('inbound')}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-lg transition-all",
              filter === 'inbound' ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:bg-card/50"
            )}
          >
            {t('inventory.inbound') || 'Inbound'}
          </button>
          <button 
            onClick={() => setFilter('outbound')}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-lg transition-all",
              filter === 'outbound' ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:bg-card/50"
            )}
          >
            {t('inventory.outbound') || 'Outbound'}
          </button>
        </div>
        <button 
          onClick={fetchTransfers}
          className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredTransfers.length === 0 ? (
          <div className="text-center p-20 bg-muted/20 rounded-[32px] border border-dashed border-border">
            <Truck size={48} className="mx-auto text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground italic">{t('inventory.noTransfers') || "No active stock transfers"}</p>
          </div>
        ) : (
          filteredTransfers.map((tr) => {
            const isDestination = (tr.toLocationId as any)._id === (currentLocation?.id || currentLocation?._id) || tr.toLocationId === (currentLocation?.id || currentLocation?._id);
            const canManage = isDestination ? tr.status === 'In Transit' : tr.status === 'Requested' || tr.status === 'Pending';
            
            return (
              <motion.div 
                key={tr.id || tr._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card p-6 rounded-[32px] border border-border hover:shadow-lg transition-all group"
              >
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between sm:justify-start sm:gap-4">
                      <div className={cn(
                        "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                        getStatusColor(tr.status)
                      )}>
                        {getStatusIcon(tr.status)}
                        {t(`inventory.status${tr.status.replace(' ', '')}`)}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <Calendar size={12} />
                        {format(new Date(tr.createdAt || Date.now()), 'MMM dd, HH:mm')}
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex-1 space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">
                          {isDestination ? t('inventory.sourceLocation') : t('inventory.destinationLocation')}
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-muted-foreground">
                            <MapPin size={20} />
                          </div>
                          <div>
                            <p className="font-display font-bold text-lg text-foreground">
                              {isDestination ? (tr.fromLocationId as any).name : (tr.toLocationId as any).name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {isDestination ? (
                                <span className="flex items-center gap-1"><ArrowDownRight size={12} /> {t('inventory.inbound')}</span>
                              ) : (
                                <span className="flex items-center gap-1"><ArrowUpRight size={12} /> {t('inventory.outbound')}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="hidden sm:block">
                         <div className="w-10 h-10 bg-muted/50 rounded-full flex items-center justify-center">
                            <ArrowRight size={20} className="text-muted-foreground/30" />
                         </div>
                      </div>

                      <div className="flex-1 space-y-1 text-right sm:text-left">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">
                           Items
                        </p>
                        <div className="space-y-1">
                          {tr.items.map((item, i) => (
                            <div key={i} className="flex items-center justify-end sm:justify-start gap-2">
                              <span className="text-sm font-bold text-foreground">{item.name}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-muted rounded-full">
                                {item.quantity} {item.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {(tr.reason || tr.notes) && (
                      <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 text-xs text-muted-foreground italic">
                        {tr.reason && <p><span className="font-bold not-italic text-foreground/70">{t('inventory.transferReason')}:</span> {tr.reason}</p>}
                        {tr.notes && <p><span className="font-bold not-italic text-foreground/70">{t('inventory.transferNotes')}:</span> {tr.notes}</p>}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-row md:flex-col items-center justify-end gap-2 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                    {tr.status === 'Requested' && !isDestination && (
                      <button 
                        onClick={() => handleUpdateStatus(tr.id || tr._id || '', 'In Transit')}
                        className="flex-1 md:w-32 py-2.5 bg-primary text-primary-foreground rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2"
                      >
                        <Truck size={14} />
                        {t('inventory.markInTransit')}
                      </button>
                    )}
                    
                    {tr.status === 'In Transit' && isDestination && (
                      <button 
                        onClick={() => handleUpdateStatus(tr.id || tr._id || '', 'Completed')}
                        className="flex-1 md:w-32 py-2.5 bg-success text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-success/10"
                      >
                        <CheckCircle2 size={14} />
                        {t('inventory.markCompleted')}
                      </button>
                    )}

                    {(tr.status === 'Requested' || tr.status === 'Pending') && (
                      <button 
                        onClick={() => handleUpdateStatus(tr.id || tr._id || '', 'Cancelled')}
                        className="flex-1 md:w-32 py-2.5 bg-muted text-muted-foreground rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-destructive/10 hover:text-destructive transition-all flex items-center justify-center gap-2"
                      >
                        <XCircle size={14} />
                        {t('common.cancel') || 'Cancel'}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
