import { useState, useEffect } from "react";
import { Star, MessageSquare, Filter, RefreshCw, CheckCircle, Archive, Trash2, User, Calendar, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/LanguageContext";
import { useLocation } from "@/LocationContext";
import api from "@/services/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

export default function FeedbackManagement() {
  const { t } = useLanguage();
  const { currentLocation } = useLocation();
  const [feedback, setFeedback] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterRating, setFilterRating] = useState<number | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<string | 'All'>('All');

  const fetchData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const params = currentLocation ? { locationId: currentLocation.id || currentLocation._id } : {};
      const [feedbackRes, statsRes] = await Promise.all([
        api.get("/feedback", { params }),
        api.get("/feedback/stats", { params })
      ]);
      setFeedback(feedbackRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Failed to fetch feedback:", error);
      toast.error(t('feedback.loadError'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentLocation]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/feedback/${id}`, { status });
      setFeedback(prev => prev.map(f => (f._id === id || f.id === id) ? { ...f, status } : f));
      toast.success(t('feedback.updateSuccess'));
    } catch (error) {
      toast.error(t('feedback.updateError'));
    }
  };

  const filteredFeedback = feedback.filter(f => {
    const matchesRating = filterRating === 'All' || f.rating === filterRating;
    const matchesStatus = filterStatus === 'All' || f.status === filterStatus;
    return matchesRating && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">{t('feedback.managementTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('feedback.managementDesc')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setIsRefreshing(true);
              fetchData(false);
            }}
            disabled={isRefreshing}
            className="p-3 bg-card rounded-2xl shadow-sm hover:bg-muted transition-colors border border-border text-muted-foreground disabled:opacity-50"
          >
            <RefreshCw size={18} className={cn(isRefreshing && "animate-spin")} />
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{t('feedback.avgRating')}</p>
          <div className="flex items-end gap-3">
            <h4 className="text-3xl font-display font-bold text-foreground">{stats?.avgRating || 0}</h4>
            <div className="flex mb-1">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} size={14} className={cn(Math.round(stats?.avgRating || 0) >= s ? "fill-primary text-primary" : "text-muted fill-muted/30")} />
              ))}
            </div>
          </div>
        </div>
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{t('feedback.totalResponses')}</p>
          <h4 className="text-3xl font-display font-bold text-foreground">{stats?.total || 0}</h4>
        </div>
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border lg:col-span-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">{t('feedback.ratingDistribution')}</p>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(r => (
              <div key={r} className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-muted-foreground w-4">{r}★</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${stats?.total > 0 ? (stats.ratingDistribution[r] / stats.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground w-8 text-right">{stats?.ratingDistribution[r] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <div className="flex items-center gap-2 bg-card p-1 rounded-xl border border-border shadow-sm">
          <Filter size={14} className="ml-3 text-muted-foreground" />
          <select 
            value={filterRating} 
            onChange={(e) => setFilterRating(e.target.value === 'All' ? 'All' : Number(e.target.value))}
            className="bg-transparent border-none text-xs font-bold text-foreground focus:ring-0 pr-8"
          >
            <option value="All">{t('feedback.allRatings')}</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
        <div className="flex items-center gap-2 bg-card p-1 rounded-xl border border-border shadow-sm">
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-transparent border-none text-xs font-bold text-foreground focus:ring-0 pr-8"
          >
            <option value="All">{t('feedback.allStatus')}</option>
            <option value="New">New</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredFeedback.length === 0 ? (
          <div className="bg-card p-12 text-center rounded-[32px] border border-border">
            <MessageSquare size={48} className="mx-auto text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground italic">{t('feedback.noFeedback')}</p>
          </div>
        ) : (
          filteredFeedback.map((f, idx) => (
            <motion.div 
              key={f._id || f.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card p-6 rounded-[32px] shadow-sm border border-border group"
            >
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center justify-between sm:justify-start sm:gap-6">
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={16} className={cn(f.rating >= s ? "fill-primary text-primary" : "text-muted fill-muted/30")} />
                      ))}
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest",
                      f.status === 'New' ? "bg-primary/10 text-primary" : 
                      f.status === 'Reviewed' ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    )}>
                      {f.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-foreground font-medium leading-relaxed italic">
                      "{f.comment || t('feedback.noComment')}"
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5 font-bold">
                        <User size={12} />
                        {f.customerName || 'Guest'}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ExternalLink size={12} />
                        Order #{f.orderNumber || 'N/A'}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        {format(new Date(f.createdAt), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-center justify-end gap-2">
                  {f.status !== 'Reviewed' && (
                    <button 
                      onClick={() => handleUpdateStatus(f._id || f.id, 'Reviewed')}
                      className="p-2 hover:bg-success/10 text-muted-foreground hover:text-success rounded-xl transition-all"
                      title="Mark as Reviewed"
                    >
                      <CheckCircle size={20} />
                    </button>
                  )}
                  {f.status !== 'Archived' && (
                    <button 
                      onClick={() => handleUpdateStatus(f._id || f.id, 'Archived')}
                      className="p-2 hover:bg-muted text-muted-foreground rounded-xl transition-all"
                      title="Archive"
                    >
                      <Archive size={20} />
                    </button>
                  )}
                  <button 
                    className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-xl transition-all"
                    title="Delete"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
