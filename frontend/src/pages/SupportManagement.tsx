import { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle,
  Mail,
  User,
  ExternalLink,
  MessageCircle,
  ChevronRight,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "@/LanguageContext";
import { toast } from "sonner";
import api from "@/services/api";
import { format } from "date-fns";

interface SupportRequest {
  _id: string;
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
  status: 'Open' | 'Pending' | 'Resolved' | 'Closed';
  createdAt: string;
  userId?: string;
}

export default function SupportManagement() {
  const { t, language } = useLanguage();
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/support");
      setRequests(response.data);
    } catch (error) {
      console.error("Error fetching support requests:", error);
      toast.error(t('support.loadError') || "Failed to load support requests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/support/${id}/status`, { status });
      setRequests(prev => prev.map(r => (r._id === id || r.id === id) ? { ...r, status: status as any } : r));
      if (selectedRequest && (selectedRequest._id === id || selectedRequest.id === id)) {
        setSelectedRequest({ ...selectedRequest, status: status as any });
      }
      toast.success(t('support.statusUpdated') || "Status updated successfully");
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const filteredRequests = requests.filter(req => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      req.name.toLowerCase().includes(searchLower) ||
      req.email.toLowerCase().includes(searchLower) ||
      req.subject.toLowerCase().includes(searchLower);
    
    const matchesStatus = statusFilter === 'All' || req.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Open': return <AlertCircle size={16} className="text-destructive" />;
      case 'Pending': return <Clock size={16} className="text-warning" />;
      case 'Resolved': return <CheckCircle2 size={16} className="text-success" />;
      case 'Closed': return <XCircle size={16} className="text-muted-foreground" />;
      default: return <AlertCircle size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return "bg-destructive/10 text-destructive border-destructive/20";
      case 'Pending': return "bg-warning/10 text-warning border-warning/20";
      case 'Resolved': return "bg-success/10 text-success border-success/20";
      case 'Closed': return "bg-muted text-muted-foreground border-border";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="p-4 sm:p-8 h-full flex flex-col bg-background transition-colors duration-300">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">{t('support.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('support.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('admin.search') || "Search requests..."}
              className="pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary transition-all w-full sm:w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary transition-all"
          >
            <option value="All">{t('common.all')}</option>
            <option value="Open">Open</option>
            <option value="Pending">Pending</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </header>

      <div className="flex-1 bg-card rounded-[32px] border border-border shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('support.name')}</th>
                <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('support.subject')}</th>
                <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('common.status')}</th>
                <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('common.date')}</th>
                <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8">
                      <div className="h-4 bg-muted rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground italic">
                    {t('common.noRecords')}
                  </td>
                </tr>
              ) : filteredRequests.map((req, idx) => (
                <tr 
                  key={`support-req-${req._id || req.id || idx}-${idx}`} 
                  className="hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => {
                    setSelectedRequest(req);
                    setIsDetailModalOpen(true);
                  }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {req.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{req.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{req.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-foreground line-clamp-1">{req.subject}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{t(`support.category.${req.category.toLowerCase()}` as any)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border",
                      getStatusColor(req.status)
                    )}>
                      {getStatusIcon(req.status)}
                      {t(`support.status.${req.status.toLowerCase()}` as any)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">
                    {format(new Date(req.createdAt), 'MMM dd, yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                    <div className="relative inline-block group/menu">
                      <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <MoreHorizontal size={18} className="text-muted-foreground" />
                      </button>
                      <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-xl shadow-xl z-50 py-2 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all">
                        {['Open', 'Pending', 'Resolved', 'Closed'].map((status, sIdx) => (
                          <button
                            key={`status-action-${status}-${sIdx}`}
                            onClick={() => handleUpdateStatus(req._id || req.id, status)}
                            className={cn(
                              "w-full px-4 py-2 text-left text-xs hover:bg-muted flex items-center gap-2",
                              req.status === status ? "text-primary font-bold" : "text-muted-foreground"
                            )}
                          >
                            <span className={cn("w-2 h-2 rounded-full", status === 'Open' ? "bg-destructive" : status === 'Pending' ? "bg-warning" : status === 'Resolved' ? "bg-success" : "bg-muted-foreground")} />
                            {t('common.confirm')} {t(`support.status.${status.toLowerCase()}` as any)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {isDetailModalOpen && selectedRequest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-card rounded-[32px] shadow-2xl overflow-hidden border border-border flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-border bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <MessageCircle size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold text-foreground">Support Request</h3>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Ticket #{selectedRequest._id.slice(-6)}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-2 hover:bg-muted rounded-xl text-muted-foreground transition-colors"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('support.name')}</p>
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <User size={16} className="text-primary" />
                        {selectedRequest.name}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('support.email')}</p>
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <Mail size={16} className="text-primary" />
                        {selectedRequest.email}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('common.status')}</p>
                      <div className="flex flex-wrap gap-2">
                        {['Open', 'Pending', 'Resolved', 'Closed'].map((status, sIdx) => (
                          <button
                            key={`modal-status-${status}-${sIdx}`}
                            onClick={() => handleUpdateStatus(selectedRequest._id || selectedRequest.id, status)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border",
                              selectedRequest.status === status 
                                ? getStatusColor(status)
                                : "bg-card text-muted-foreground border-border hover:bg-muted"
                            )}
                          >
                            {t(`support.status.${status.toLowerCase()}` as any)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('common.date')}</p>
                      <p className="text-sm font-medium text-foreground">{format(new Date(selectedRequest.createdAt), 'MMMM dd, yyyy HH:mm')}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('support.subject')}</p>
                  <p className="text-lg font-bold text-foreground bg-muted/30 p-4 rounded-2xl border border-border">{selectedRequest.subject}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('support.message')}</p>
                  <div className="bg-muted/30 p-6 rounded-2xl border border-border min-h-[150px]">
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selectedRequest.message}</p>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-border bg-muted/10 flex items-center justify-between">
                <p className="text-xs text-muted-foreground italic">
                  {language === 'km' ? 'សម្គាល់៖ អ្នកកំពុងមើលសំណើគាំទ្រអតិថិជន។' : 'Note: You are viewing a customer support request.'}
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                       window.location.href = `mailto:${selectedRequest.email}?subject=Re: ${selectedRequest.subject}`;
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-xs hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                  >
                    <Mail size={16} />
                    {language === 'km' ? 'ឆ្លើយតបតាមអ៊ីមែល' : 'Reply via Email'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
