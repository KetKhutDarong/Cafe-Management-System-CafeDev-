import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreVertical, Users, CheckCircle2, XCircle, Clock, Coffee, Loader2, QrCode as QrIcon, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Table as TableType } from '@/types';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmModal from "@/components/ConfirmModal";

import { useLanguage } from "@/LanguageContext";
import { useLocation } from "@/LocationContext";

export default function TableManagement() {
  const { t } = useLanguage();
  const { currentLocation } = useLocation();
  const navigate = useNavigate();
  const [tables, setTables] = useState<TableType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<TableType['status'] | 'All'>('All');
  const [selectedTableQR, setSelectedTableQR] = useState<TableType | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableType | null>(null);
  const [formData, setFormData] = useState({ number: '', capacity: 2 });
  const [publicAppUrl, setPublicAppUrl] = useState<string>("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      const response = await api.get("/settings");
      if (response.data.public_app_url) {
        setPublicAppUrl(response.data.public_app_url);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const fetchTables = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const params = currentLocation ? { locationId: currentLocation.id || currentLocation._id } : {};
      const response = await api.get("/tables", { params });
      setTables(response.data);
    } catch (error: any) {
      console.error("Error fetching tables:", error);
      if (showLoading) toast.error(t('table.loadError'));
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    fetchSettings();
    
    // Polling every 5 seconds for real-time table status
    const interval = setInterval(() => fetchTables(false), 5000);
    return () => clearInterval(interval);
  }, [currentLocation]);

  const filteredTables = tables.filter(table => {
    const matchesSearch = table.number.includes(searchTerm);
    const matchesStatus = filterStatus === 'All' || table.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const updateTableStatus = async (id: string, newStatus: TableType['status']) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'Available' || newStatus === 'Cleaning') {
        updateData.currentOrderId = null;
      }
      
      const response = await api.put(`/tables/${id}`, updateData);
      setTables(prev => prev.map(t => (t.id === id || (t as any)._id === id) ? response.data : t));
      toast.success(t('table.successUpdate'));
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('common.error'));
    }
  };

  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tableData = {
        ...formData,
        locationId: currentLocation?.id || currentLocation?._id
      };

      if (editingTable) {
        const response = await api.put(`/tables/${editingTable.id || (editingTable as any)._id}`, tableData);
        setTables(prev => prev.map(t => (t.id === editingTable.id || (t as any)._id === (editingTable as any)._id) ? response.data : t));
        toast.success(t('table.successUpdate'));
      } else {
        const response = await api.post('/tables', tableData);
        setTables(prev => [...prev, response.data]);
        toast.success(t('table.successAdd'));
      }
      setIsAddModalOpen(false);
      setEditingTable(null);
      setFormData({ number: '', capacity: 2 });
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('common.error'));
    }
  };

  const handleDeleteTable = async (id: string) => {
    try {
      await api.delete(`/tables/${id}`);
      setTables(prev => prev.filter(t => t.id !== id && (t as any)._id !== id));
      toast.success(t('table.successDelete'));
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('common.error'));
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById('table-qr-code-svg');
    if (!svg || !selectedTableQR) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      const scale = 4;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `Table-${selectedTableQR.number}-QR.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.src = url;
  };

  return (
    <div className="p-4 sm:p-6 bg-background min-h-full transition-colors duration-300">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold mb-0.5 text-foreground">{t('table.title')}</h2>
          <p className="text-xs text-muted-foreground">{t('table.subtitle')}</p>
        </div>
        <button 
          onClick={() => {
            setEditingTable(null);
            setFormData({ number: '', capacity: 2 });
            setIsAddModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/10 text-sm"
        >
          <Plus size={18} />
          <span>{t('table.addNew')}</span>
        </button>
      </header>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder={t('table.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card border-none rounded-xl shadow-sm focus:ring-2 focus:ring-primary transition-all text-sm text-foreground"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-card p-1 rounded-xl shadow-sm border border-border overflow-x-auto no-scrollbar">
            {(['All', 'Available', 'Occupied', 'Reserved', 'Cleaning'] as const).map((status, sIdx) => (
              <button
                key={`table-filter-${status}-${sIdx}`}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap",
                  filterStatus === status 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {status === 'All' ? t('table.all') : 
                 status === 'Available' ? t('table.available') : 
                 status === 'Occupied' ? t('table.occupied') : 
                 status === 'Reserved' ? t('table.reserved') : 
                 status === 'Cleaning' ? t('table.cleaning') : status}
              </button>
            ))}
          </div>
        </div>
        <button className="hidden sm:block p-2.5 bg-card rounded-xl shadow-sm hover:bg-muted transition-colors border border-border">
          <Filter size={18} className="text-muted-foreground" />
        </button>
      </div>

      {/* Tables Grid */}
      {loading && tables.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center">
          <Loader2 size={32} className="text-primary animate-spin mb-4" />
          <p className="text-gray-500 text-sm">{t('table.loading')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredTables.map((table, idx) => (
            <div 
              key={`table-card-${table.id || (table as any)._id || table.number || idx}-${idx}`}
              className={cn(
                "bg-card p-4 rounded-2xl shadow-sm border-2 transition-all duration-300 hover:shadow-xl",
                table.status === 'Available' ? "border-transparent" : 
                table.status === 'Occupied' ? "border-red-100 dark:border-red-500/20" :
                table.status === 'Reserved' ? "border-blue-100 dark:border-blue-500/20" : "border-amber-100 dark:border-amber-500/20"
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-primary-foreground font-display font-bold text-lg",
                  table.status === 'Available' ? "bg-primary" : 
                  table.status === 'Occupied' ? "bg-red-500" :
                  table.status === 'Reserved' ? "bg-blue-500" : "bg-amber-500"
                )}>
                  {table.number}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setSelectedTableQR(table)}
                    className="p-2 hover:bg-primary/10 text-primary rounded-xl transition-colors"
                    title="Generate QR Code"
                  >
                    <QrIcon size={20} />
                  </button>
                  <button 
                    onClick={() => {
                      setEditingTable(table);
                      setFormData({ number: table.number, capacity: table.capacity });
                      setIsAddModalOpen(true);
                    }}
                    className="p-2 hover:bg-muted rounded-xl transition-colors"
                  >
                    <MoreVertical size={20} className="text-muted-foreground" />
                  </button>
                  <button 
                    onClick={() => {
                      setTableToDelete(table.id || (table as any)._id);
                      setIsConfirmOpen(true);
                    }}
                    className="p-2 hover:bg-destructive/10 text-destructive rounded-xl transition-colors"
                  >
                    <XCircle size={20} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users size={14} />
                    <span className="text-[9px] font-bold uppercase tracking-widest">{t('table.capacity')}</span>
                  </div>
                  <span className="text-xs font-bold text-foreground">{t('table.capacityCount', { count: table.capacity })}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock size={14} />
                    <span className="text-[9px] font-bold uppercase tracking-widest">{t('table.status')}</span>
                  </div>
                  <div className={cn(
                    "px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-widest",
                    table.status === 'Available' ? "bg-primary/10 text-primary" : 
                    table.status === 'Occupied' ? "bg-red-500/10 text-red-500" :
                    table.status === 'Reserved' ? "bg-blue-500/10 text-blue-500" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  )}>
                    {table.status === 'Available' ? t('table.available') : 
                     table.status === 'Occupied' ? t('table.occupied') : 
                     table.status === 'Reserved' ? t('table.reserved') : 
                     table.status === 'Cleaning' ? t('table.cleaning') : table.status}
                  </div>
                </div>

                {table.currentOrderId && (
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-primary">
                        <Coffee size={14} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">{t('admin.activeOrder')}</span>
                      </div>
                      <span className="text-xs font-bold text-foreground">
                        {typeof table.currentOrderId === 'string' ? table.currentOrderId : (table.currentOrderId as any).orderNumber || t('table.occupied')}
                      </span>
                    </div>
                    {typeof table.currentOrderId !== 'string' && (table.currentOrderId as any).id && (
                      <button 
                        onClick={() => navigate(`/order-status/${(table.currentOrderId as any).id}`)}
                        className="w-full py-1.5 bg-muted text-muted-foreground rounded-lg text-[9px] font-bold hover:bg-accent/50 transition-all border border-border"
                      >
                        {t('admin.viewOrder')}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                {table.status === 'Available' ? (
                  <button 
                    onClick={() => updateTableStatus(table.id || (table as any)._id, 'Occupied')}
                    className="col-span-2 py-2.5 bg-foreground text-background rounded-xl text-[10px] font-bold hover:opacity-90 transition-all"
                  >
                    {t('admin.markOccupied')}
                  </button>
                ) : table.status === 'Occupied' ? (
                  <>
                    <button 
                      onClick={() => updateTableStatus(table.id || (table as any)._id, 'Cleaning')}
                      className="py-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl text-[10px] font-bold hover:bg-amber-500/20 transition-all"
                    >
                      {t('admin.toCleaning')}
                    </button>
                    <button 
                      onClick={() => updateTableStatus(table.id || (table as any)._id, 'Available')}
                      className="py-2.5 bg-primary/10 text-primary rounded-xl text-[10px] font-bold hover:opacity-90 transition-all"
                    >
                      {t('admin.freeTable')}
                    </button>
                  </>
                ) : table.status === 'Cleaning' ? (
                  <button 
                    onClick={() => updateTableStatus(table.id || (table as any)._id, 'Available')}
                    className="col-span-2 py-2.5 bg-primary/10 text-primary rounded-xl text-[10px] font-bold hover:opacity-90 transition-all"
                  >
                    {t('admin.finishCleaning')}
                  </button>
                ) : (
                  <button 
                    onClick={() => updateTableStatus(table.id || (table as any)._id, 'Available')}
                    className="col-span-2 py-2.5 bg-muted text-muted-foreground rounded-xl text-[10px] font-bold hover:bg-accent/50 transition-all"
                  >
                    {t('admin.cancelReservation')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-card p-8 rounded-[32px] shadow-2xl max-w-md w-full relative border border-border"
            >
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-6 right-6 p-2 hover:bg-muted rounded-full transition-colors"
              >
                <XCircle size={24} className="text-muted-foreground" />
              </button>

              <h3 className="text-2xl font-display font-bold text-foreground mb-6">
                {editingTable ? t('table.editTitle') : t('table.addNew')}
              </h3>

              <form onSubmit={handleSaveTable} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    {t('table.number')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    className="w-full px-4 py-3 bg-muted border-none rounded-xl focus:ring-2 focus:ring-primary transition-all text-foreground"
                    placeholder="e.g. 01"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    {t('table.capacity')}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={isNaN(formData.capacity) ? '' : formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value === '' ? NaN : parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-muted border-none rounded-xl focus:ring-2 focus:ring-primary transition-all text-foreground"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-3.5 bg-muted text-muted-foreground rounded-xl font-bold hover:bg-accent/50 transition-all"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3.5 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                  >
                    {t('table.save')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {selectedTableQR && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-card p-8 rounded-[40px] shadow-2xl max-w-sm w-full relative border border-border"
            >
              <button 
                onClick={() => setSelectedTableQR(null)}
                className="absolute top-6 right-6 p-2 hover:bg-muted rounded-full transition-colors"
              >
                <XCircle size={24} className="text-muted-foreground" />
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
                  <QrIcon size={32} />
                </div>
                <h3 className="text-2xl font-display font-bold text-foreground">{t('table.qrTitle', { number: selectedTableQR.number })}</h3>
                <p className="text-sm text-muted-foreground">{t('table.scanToView')}</p>
              </div>

              <div className="bg-white p-6 rounded-[32px] shadow-inner border border-border flex items-center justify-center mb-8">
                <QRCodeSVG 
                  id="table-qr-code-svg"
                  value={`${publicAppUrl || window.location.origin}/menu/${selectedTableQR.id || (selectedTableQR as any)._id}`}
                  size={200}
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                    src: "/logo.svg",
                    x: undefined,
                    y: undefined,
                    height: 40,
                    width: 40,
                    excavate: true,
                  }}
                />
              </div>

              <div className="space-y-3">
                <button 
                  onClick={downloadQR}
                  className="w-full py-4 bg-foreground text-background rounded-2xl font-bold flex items-center justify-center gap-3 hover:scale-[1.02] transition-all"
                >
                  <Download size={20} />
                  {t('table.downloadQR')}
                </button>
                <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-widest">
                  URL: {publicAppUrl || window.location.origin}/menu/{selectedTableQR.id || (selectedTableQR as any)._id}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => tableToDelete && handleDeleteTable(tableToDelete)}
        title={t('common.confirmDelete') || 'Delete Table'}
        message={t('common.confirmDelete')}
      />
    </div>
  );
}
