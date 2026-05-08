import { useState, type ReactNode, type FormEvent, useEffect, useRef } from "react";
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight, 
  Box, 
  AlertTriangle, 
  CheckCircle2, 
  Truck,
  X,
  Save,
  Trash2,
  RefreshCw,
  History,
  Loader2,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  FileText,
  Printer,
  Beaker
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InventoryItem, InventoryLog, MenuItem } from "@/types";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useLanguage } from "@/LanguageContext";
import { useLocation } from "@/LocationContext";
import api from "@/services/api";
import ConfirmModal from "@/components/ConfirmModal";
import StockTransferModal from "@/components/StockTransferModal";
import StockTransferPortal from "@/components/StockTransferPortal";
import * as XLSX from "xlsx";
import { StockTransfer } from "@/types";
import { format } from "date-fns";

const CATEGORIES = (t: any) => [
  t('inventory.categoryAll'),
  t('inventory.categoryCoffee'),
  t('inventory.categoryDairy'),
  t('inventory.categoryFood'),
  t('inventory.categorySyrups'),
  t('inventory.categorySupplies')
];
const STATUSES = (t: any) => [
  t('inventory.statusAll'),
  t('inventory.statusInStock'),
  t('inventory.statusLowStock'),
  t('inventory.statusOutOfStock')
];

export default function InventoryManagement() {
  const { t } = useLanguage();
  const { currentLocation } = useLocation();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'logs' | 'transfers'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(t('inventory.categoryAll'));
  const [activeStatus, setActiveStatus] = useState(t('inventory.statusAll'));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const fetchInventory = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const params = currentLocation ? { locationId: currentLocation.id || currentLocation._id } : {};
      const response = await api.get("/inventory", { params });
      setInventory(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      if (showLoading) toast.error(t('inventory.loadError'));
      setInventory([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchLogs = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const params = currentLocation ? { locationId: currentLocation.id || currentLocation._id } : {};
      const response = await api.get("/inventory/logs", { params });
      setLogs(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      if (showLoading) toast.error(t('inventory.loadError'));
      setLogs([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await api.get("/menu");
      setMenuItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.warn("Failed to fetch menu items for cross-reference:", error);
      setMenuItems([]);
    }
  };

  useEffect(() => {
    const init = async (showLoading = true) => {
      await Promise.all([fetchInventory(showLoading), fetchLogs(showLoading), fetchMenuItems()]);
    };
    init(true);

    const interval = setInterval(() => init(false), 10000); // 10 seconds for inventory
    return () => clearInterval(interval);
  }, [currentLocation]);

  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExportCSV = () => {
    // Inventory CSV
    const headers = ['Name', 'Category', 'Quantity', 'Unit', 'Status', 'SKU', 'Supplier', 'Threshold'];
    const rows = inventory.map(item => [
      item.name,
      item.category,
      item.quantity,
      item.unit,
      item.status,
      item.sku,
      item.supplier || '',
      item.threshold
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Cafe_Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setShowExportMenu(false);
    toast.success("Inventory CSV exported successfully");
  };

  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      // Inventory Sheet
      const invData = [
        ["INVENTORY STATUS REPORT"],
        [`Generated: ${new Date().toLocaleString()}`],
        [],
        ["Name", "Category", "Quantity", "Unit", "Status", "SKU", "Supplier", "Threshold"],
        ...inventory.map(i => [i.name, i.category, i.quantity, i.unit, i.status, i.sku, i.supplier || '', i.threshold])
      ];
      const wsInv = XLSX.utils.aoa_to_sheet(invData);
      wsInv['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, wsInv, "Inventory List");

      // Transaction Logs Sheet
      const logData = [
        ["INVENTORY TRANSACTION LOGS"],
        [],
        ["Date", "Item Name", "Type", "Amount", "Reason", "Handled By"],
        ...logs.map(l => [
          new Date(l.createdAt).toLocaleString(),
          l.itemName,
          l.type.toUpperCase(),
          l.amount,
          l.reason,
          l.userName
        ])
      ];
      const wsLogs = XLSX.utils.aoa_to_sheet(logData);
      wsLogs['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 30 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsLogs, "Activity Logs");

      XLSX.writeFile(wb, `Cafe_Professional_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      setShowExportMenu(false);
      toast.success("Inventory Excel report exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export Excel report");
    } finally {
      setIsExporting(false);
    }
  };
  const lowStockCount = inventory.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock').length;
  const healthyStockCount = inventory.filter(i => i.status === 'In Stock').length;
  const totalValue = inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === t('inventory.categoryAll') || item.category === activeCategory;
    const matchesStatus = activeStatus === t('inventory.statusAll') || item.status === activeStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const filteredLogs = logs.filter(log => 
    log.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveItem = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const itemData = {
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      quantity: Number(formData.get('quantity')),
      unit: formData.get('unit') as string,
      maxQuantity: Number(formData.get('maxQuantity')),
      threshold: Number(formData.get('threshold')),
      sku: formData.get('sku') as string || `SKU: ${Math.floor(Math.random() * 90000) + 10000}`,
      supplier: formData.get('supplier') as string,
    };

    try {
      const payload = { ...itemData, locationId: currentLocation?.id || currentLocation?._id };
      if (editingItem) {
        const response = await api.put(`/inventory/${editingItem.id}`, payload);
        setInventory(prev => prev.map(item => item.id === editingItem.id ? response.data : item));
        toast.success(t('inventory.successUpdate'));
      } else {
        const response = await api.post("/inventory", payload);
        setInventory(prev => [...prev, response.data]);
        toast.success(t('inventory.successAdd'));
      }
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (error) {
      toast.error(t('inventory.loadError'));
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await api.delete(`/inventory/${id}`);
      setInventory(prev => prev.filter(item => item.id !== id));
      toast.success(t('inventory.successDelete'));
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (error) {
      toast.error(t('inventory.loadError'));
    }
  };

  const handleAdjustStock = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!adjustingItem) return;

    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get('amount'));
    const type = formData.get('type') as 'in' | 'out';
    const reason = formData.get('reason') as string;

    try {
      const response = await api.post(`/inventory/${adjustingItem.id}/adjust`, {
        amount,
        type,
        reason
      });
      
      setInventory(prev => prev.map(item => item.id === adjustingItem.id ? response.data : item));
      fetchLogs(); // Refresh logs
      toast.success(t('inventory.successUpdate'));
      setIsAdjustModalOpen(false);
      setAdjustingItem(null);
    } catch (error) {
      toast.error(t('inventory.loadError'));
    }
  };

  return (
    <div className="p-4 sm:p-8 bg-background min-h-full transition-colors duration-300">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold mb-1 text-foreground">{t('inventory.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('inventory.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative" ref={exportMenuRef}>
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-card border border-border rounded-2xl font-bold text-sm text-foreground hover:bg-muted transition-all shadow-sm group"
            >
              <Download size={18} className={cn(isExporting && "animate-bounce")} />
              {t('inventory.exportReport')}
              <ChevronDown size={14} className={cn("transition-transform duration-300", showExportMenu && "rotate-180")} />
            </button>

            <AnimatePresence>
              {showExportMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-56 bg-card rounded-2xl shadow-2xl border border-border overflow-hidden z-20"
                >
                  <div className="p-2 space-y-1">
                    <button 
                      onClick={handleExportExcel}
                      disabled={isExporting}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted rounded-xl transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Excel Worksheet</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Recommended</p>
                      </div>
                    </button>
                    <button 
                      onClick={handleExportCSV}
                      disabled={isExporting}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted rounded-xl transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">CSV Format</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Standard Text</p>
                      </div>
                    </button>
                    <div className="pt-2 border-t border-border mt-1">
                      <button 
                        onClick={() => { window.print(); setShowExportMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted rounded-xl transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <Printer size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">Print Inventory</p>
                          <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Physical Copy</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button 
            onClick={() => { setEditingItem(null); setIsTransferModalOpen(true); }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-card text-muted-foreground hover:text-primary rounded-2xl font-bold text-sm transition-all border border-border shadow-sm group"
          >
            <Truck size={18} className="group-hover:translate-x-1 transition-transform" />
            {t('inventory.stockTransfers')}
          </button>
          <button 
            onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={18} />
            {t('inventory.addItem')}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <SummaryCard 
          title={t('staff.items')} 
          value={inventory.length.toString()} 
          icon={<Box className="text-primary" />} 
          trend={t('inventory.totalUnits', { count: totalValue })} 
          trendIcon={<ArrowUpRight size={14} />} 
        />
        <SummaryCard 
          title={t('inventory.lowStock')} 
          value={lowStockCount.toString()} 
          icon={<AlertTriangle className="text-orange-500" />} 
          trend={t('inventory.requiresAttention')} 
          isWarning={lowStockCount > 0} 
        />
        <SummaryCard 
          title={t('inventory.healthyStock')} 
          value={healthyStockCount.toString()} 
          icon={<CheckCircle2 className="text-primary" />} 
          trend={`${inventory.length > 0 ? Math.round((healthyStockCount / inventory.length) * 100) : 0}% ${t('inventory.ofInventory')}`} 
        />
        <SummaryCard 
          title={t('inventory.recentActivity')} 
          value={logs.length.toString()} 
          icon={<History className="text-blue-500" />} 
          trend={t('inventory.entries')} 
        />
      </div>

      <div className="bg-card rounded-xl shadow-sm overflow-hidden border border-border">
        <div className="p-6 sm:p-8 border-b border-border">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div className="flex items-center gap-2 bg-muted p-1 rounded-xl w-fit">
              <button
                onClick={() => setActiveTab('inventory')}
                className={cn(
                  "px-6 py-2.5 rounded-lg text-xs font-bold transition-all",
                  activeTab === 'inventory' ? "bg-card text-card-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t('inventory.title')}
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={cn(
                  "px-6 py-2.5 rounded-lg text-xs font-bold transition-all",
                  activeTab === 'logs' ? "bg-card text-card-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t('staff.analytics')}
              </button>
              <button
                onClick={() => setActiveTab('transfers')}
                className={cn(
                  "px-6 py-2.5 rounded-lg text-xs font-bold transition-all",
                  activeTab === 'transfers' ? "bg-card text-card-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t('inventory.stockTransfers')}
              </button>
            </div>

            <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="text"
                  placeholder={activeTab === 'inventory' ? t('inventory.search') : t('inventory.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-muted border-none rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              
              {activeTab === 'inventory' && (
                <div className="flex flex-col sm:flex-row items-stretch gap-4">
                  <select 
                    value={activeCategory}
                    onChange={(e) => setActiveCategory(e.target.value)}
                    className="bg-muted px-4 py-3 rounded-xl border-none text-sm font-medium text-foreground focus:ring-2 focus:ring-primary"
                  >
                    {CATEGORIES(t).map((cat: string, i: number) => <option key={`cat-opt-${i}-${cat}`} value={cat}>{cat}</option>)}
                  </select>

                  <select 
                    value={activeStatus}
                    onChange={(e) => setActiveStatus(e.target.value)}
                    className="bg-muted px-4 py-3 rounded-xl border-none text-sm font-medium text-foreground focus:ring-2 focus:ring-primary"
                  >
                    {STATUSES(t).map((status: string, i: number) => <option key={`status-opt-${i}-${status}`} value={status}>{status}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center">
            <Loader2 size={48} className="text-primary animate-spin mb-4" />
            <p className="text-muted-foreground font-medium">{t('customer.loading')}</p>
          </div>
        ) : activeTab === 'inventory' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-8 py-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('inventory.name')}</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('inventory.category')}</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('inventory.supplier')}</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('inventory.quantity')}</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('inventory.threshold')}</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('inventory.status')}</th>
                  <th className="px-8 py-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredInventory.map((item, idx) => (
                  <tr key={`inventory-item-${item.id || (item as any)._id || 'inv'}-${idx}-${item.name}`} className="group hover:bg-accent/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center text-muted-foreground">
                          <Box size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{item.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-muted text-foreground text-[10px] font-bold rounded-full uppercase tracking-widest">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-medium text-foreground">{item.supplier || t('common.notProvided')}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="w-48">
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                          <span>{item.quantity} {item.unit}</span>
                          <span>of {item.maxQuantity} {item.unit}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-1000",
                              item.status === 'In Stock' ? "bg-primary" : item.status === 'Low Stock' ? "bg-warning" : "bg-destructive"
                            )} 
                            style={{ width: `${(item.quantity / item.maxQuantity) * 100}%` }} 
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-medium text-foreground">{item.threshold} {item.unit}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest",
                        item.status === 'In Stock' ? "bg-muted dark:bg-primary/20 text-primary" : item.status === 'Low Stock' ? "bg-orange-50 dark:bg-orange-500/20 text-orange-500" : "bg-red-50 dark:bg-red-500/20 text-red-500"
                      )}>
                        {item.status === 'In Stock' ? t('inventory.inStock') : item.status === 'Low Stock' ? t('inventory.lowStock') : t('inventory.outOfStock')}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 text-muted-foreground">
                        <button 
                          onClick={() => {
                            setAdjustingItem(item);
                            setIsTransferModalOpen(true);
                          }}
                          className="p-2 hover:bg-muted rounded-lg transition-colors hover:text-primary"
                          title={t('inventory.requestTransfer')}
                        >
                          <Truck size={18} />
                        </button>
                        <button 
                          onClick={() => {
                            setAdjustingItem(item);
                            setIsAdjustModalOpen(true);
                          }}
                          className="p-2 hover:bg-muted rounded-lg transition-colors hover:text-primary"
                          title="Adjust Stock"
                        >
                          <RefreshCw size={18} />
                        </button>
                        <button 
                          onClick={() => {
                            setEditingItem(item);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <MoreVertical size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'logs' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              {/* log table */}
              <thead>
                <tr className="border-b border-border">
                  <th className="px-8 py-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('order.date')}</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('inventory.name')}</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('inventory.category')}</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('inventory.quantity')}</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('inventory.subtitle')}</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('customer.label')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLogs.map((log, idx) => (
                  <tr key={`${log.id || (log as any)._id || 'log'}-${idx}-${log.createdAt}`} className="group hover:bg-accent/50 transition-colors">
                    <td className="px-8 py-6">
                      <p className="text-xs font-medium text-foreground">{format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-bold text-foreground">{log.itemName}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-widest",
                        log.type === 'in' ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                      )}>
                        {log.type === 'in' ? t('inventory.inStock') : t('inventory.outOfStock')}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <p className={cn(
                        "text-sm font-bold",
                        log.amount > 0 ? "text-primary" : "text-destructive"
                      )}>
                        {log.amount > 0 ? `+${log.amount}` : log.amount}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs text-muted-foreground">{log.reason}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-medium text-foreground">{log.userName}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8">
            <StockTransferPortal />
          </div>
        )}

        <div className="p-6 sm:p-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-sm text-muted-foreground">
            {activeTab === 'inventory' 
              ? `${t('inventory.showing')} ${filteredInventory.length} ${t('inventory.entries')}`
              : activeTab === 'logs'
              ? `${t('inventory.showing')} ${filteredLogs.length} ${t('inventory.entries')}`
              : ''
            }
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-30" disabled>
              <ArrowLeft size={16} />
            </button>
            <button className="w-8 h-8 rounded-lg text-xs font-bold bg-primary text-primary-foreground">1</button>
            <button className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-30" disabled>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Manual Stock Adjustment Modal */}
      <AnimatePresence>
        {isAdjustModalOpen && adjustingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdjustModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-card rounded-[40px] shadow-2xl overflow-hidden border border-border"
            >
              <div className="p-8 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-display font-bold text-foreground">{t('inventory.edit')}</h3>
                  <p className="text-sm text-muted-foreground">{adjustingItem.name}</p>
                </div>
                <button 
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="p-3 bg-muted text-muted-foreground rounded-2xl hover:bg-accent/50 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAdjustStock} className="p-8 space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{t('inventory.status')}</label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="relative flex items-center justify-center p-4 bg-muted rounded-2xl cursor-pointer group">
                      <input type="radio" name="type" value="in" defaultChecked className="sr-only peer" />
                      <div className="peer-checked:text-primary text-muted-foreground font-bold text-sm transition-colors">{t('inventory.inStock')} (+)</div>
                      <div className="absolute inset-0 border-2 border-transparent peer-checked:border-primary rounded-2xl transition-all" />
                    </label>
                    <label className="relative flex items-center justify-center p-4 bg-muted rounded-2xl cursor-pointer group">
                      <input type="radio" name="type" value="out" className="sr-only peer" />
                      <div className="peer-checked:text-destructive text-muted-foreground font-bold text-sm transition-colors">{t('inventory.outOfStock')} (-)</div>
                      <div className="absolute inset-0 border-2 border-transparent peer-checked:border-destructive rounded-2xl transition-all" />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{t('inventory.quantity')} ({adjustingItem.unit})</label>
                  <input
                    name="amount"
                    type="number"
                    required
                    min="1"
                    className="w-full px-4 py-3 bg-muted border-none rounded-2xl text-sm text-foreground focus:ring-2 focus:ring-primary transition-all"
                    placeholder={t('inventory.quantity')}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{t('inventory.subtitle')}</label>
                  <select
                    name="reason"
                    required
                    className="w-full px-4 py-3 bg-muted border-none rounded-2xl text-sm text-foreground focus:ring-2 focus:ring-primary transition-all"
                  >
                    <option value="Restock">{t('inventory.inStock')}</option>
                    <option value="Correction">{t('inventory.edit')}</option>
                    <option value="Waste">{t('inventory.outOfStock')}</option>
                    <option value="Damage">{t('inventory.outOfStock')}</option>
                    <option value="Other">{t('common.other')}</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                  <Save size={20} />
                  {t('inventory.save')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delivery / Add Item Modal */}
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
                  <h3 className="text-2xl font-display font-bold text-foreground">{editingItem ? t('inventory.edit') : t('inventory.addItem')}</h3>
                  <p className="text-sm text-muted-foreground">{t('inventory.enterDetails')}</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-3 bg-muted text-muted-foreground rounded-2xl hover:bg-accent/50 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{t('inventory.name')}</label>
                    <input
                      name="name"
                      defaultValue={editingItem?.name}
                      required
                      className="w-full px-4 py-3 bg-muted border-none rounded-2xl text-sm text-foreground focus:ring-2 focus:ring-primary transition-all"
                      placeholder={t('inventory.placeholderName')}
                    />
                  </div>

                  {editingItem && (
                    <div className="col-span-2 p-5 bg-primary/5 rounded-2xl border border-primary/10">
                      <div className="flex items-center gap-2 mb-3">
                        <Beaker className="text-primary" size={16} />
                        <h4 className="text-[10px] font-bold text-foreground uppercase tracking-widest">Used in Recipes</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {menuItems.filter(mi => mi.ingredients?.some(ing => ing.inventoryId === editingItem.id)).length > 0 ? (
                          menuItems.filter(mi => mi.ingredients?.some(ing => ing.inventoryId === editingItem.id)).map(mi => (
                            <div key={`used-in-${mi.id}`} className="px-3 py-1.5 bg-card border border-border rounded-lg flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full overflow-hidden">
                                <img src={mi.image} alt="" className="w-full h-full object-cover" />
                              </div>
                              <span className="text-xs font-bold text-foreground">{mi.name}</span>
                              <span className="text-[10px] text-muted-foreground">({mi.ingredients?.find(ing => ing.inventoryId === editingItem.id)?.quantity} {editingItem.unit})</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-[10px] text-muted-foreground italic">Not used in any recipes yet.</p>
                        )}
                        <p className="w-full mt-2 text-[9px] text-muted-foreground">
                          Note: You can link this ingredient to recipes in the <span className="font-bold">Menu Management</span> section.
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{t('inventory.category')}</label>
                    <select
                      name="category"
                      defaultValue={editingItem?.category || CATEGORIES(t)[1]}
                      className="w-full px-4 py-3 bg-muted border-none rounded-2xl text-sm text-foreground focus:ring-2 focus:ring-primary transition-all"
                    >
                      {CATEGORIES(t).slice(1).map((cat: string, i: number) => <option key={`modal-cat-${i}-${cat}`} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{t('inventory.unit')}</label>
                    <input
                      name="unit"
                      defaultValue={editingItem?.unit}
                      required
                      className="w-full px-4 py-3 bg-muted border-none rounded-2xl text-sm text-foreground focus:ring-2 focus:ring-primary transition-all"
                      placeholder={t('inventory.placeholderUnit')}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{t('inventory.quantity')}</label>
                    <input
                      name="quantity"
                      type="number"
                      defaultValue={editingItem?.quantity}
                      required
                      className="w-full px-4 py-3 bg-muted border-none rounded-2xl text-sm text-foreground focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{t('inventory.maxQuantity')}</label>
                    <input
                      name="maxQuantity"
                      type="number"
                      defaultValue={editingItem?.maxQuantity}
                      required
                      className="w-full px-4 py-3 bg-muted border-none rounded-2xl text-sm text-foreground focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{t('inventory.threshold')}</label>
                    <input
                      name="threshold"
                      type="number"
                      defaultValue={editingItem?.threshold}
                      required
                      className="w-full px-4 py-3 bg-muted border-none rounded-2xl text-sm text-foreground focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{t('inventory.sku')} (Optional)</label>
                    <input
                      name="sku"
                      defaultValue={editingItem?.sku}
                      className="w-full px-4 py-3 bg-muted border-none rounded-2xl text-sm text-foreground focus:ring-2 focus:ring-primary transition-all"
                      placeholder={t('inventory.skuPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{t('inventory.supplier')}</label>
                    <input
                      name="supplier"
                      defaultValue={editingItem?.supplier}
                      className="w-full px-4 py-3 bg-muted border-none rounded-2xl text-sm text-foreground focus:ring-2 focus:ring-primary transition-all"
                      placeholder={t('inventory.placeholderSupplier')}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  {editingItem && (
                    <button
                      type="button"
                      onClick={() => {
                        setItemToDelete(editingItem.id);
                        setIsConfirmOpen(true);
                      }}
                      className="px-6 py-4 bg-destructive/10 text-destructive rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-destructive/20 transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                  >
                    <Save size={20} />
                    {editingItem ? t('inventory.save') : t('inventory.add')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => itemToDelete && handleDeleteItem(itemToDelete)}
        title={t('inventory.deleteConfirmTitle') || 'Delete Item'}
        message={t('inventory.confirmDelete')}
      />

      <StockTransferModal 
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setAdjustingItem(null);
        }}
        onSuccess={() => {
          fetchInventory();
          fetchLogs();
          setActiveTab('transfers');
        }}
        initialItem={adjustingItem}
      />
    </div>
  );
}

function SummaryCard({ title, value, icon, trend, trendIcon, isWarning }: { title: string, value: string, icon: ReactNode, trend: string, trendIcon?: ReactNode, isWarning?: boolean }) {
  return (
    <div className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-xl transition-all duration-300 group">
      <div className="flex items-center justify-between mb-6">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform text-primary">
          {icon}
        </div>
        {isWarning && <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />}
      </div>
      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">{title}</p>
      <p className="text-4xl font-display font-bold mb-2 text-foreground">{value}</p>
      <div className={cn(
        "flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest",
        isWarning ? "text-destructive" : "text-primary"
      )}>
        {trendIcon}
        {trend}
      </div>
    </div>
  );
}

function ArrowLeftIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ArrowRightIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

