import { useState, useEffect } from "react";
import { X, Search, Truck, ArrowRight, Save, Loader2, AlertCircle, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/LanguageContext";
import { useLocation } from "@/LocationContext";
import api from "@/services/api";
import { toast } from "sonner";
import { InventoryItem, StockTransfer } from "@/types";

interface StockTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialItem?: InventoryItem | null;
}

interface TransferItemRow {
  itemId: string;
  name: string;
  quantity: number;
  unit: string;
  pendingName?: string;
}

export default function StockTransferModal({ isOpen, onClose, onSuccess, initialItem }: StockTransferModalProps) {
  const { t } = useLanguage();
  const { currentLocation, locations } = useLocation();
  const [loading, setLoading] = useState(false);
  const [sourceLocationId, setSourceLocationId] = useState("");
  const [items, setItems] = useState<TransferItemRow[]>([]);
  const [availableItems, setAvailableItems] = useState<InventoryItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const otherLocations = locations.filter(loc => (loc.id || loc._id) !== (currentLocation?.id || currentLocation?._id));

  useEffect(() => {
    if (initialItem && isOpen) {
      setItems([{
        itemId: "", 
        name: initialItem.name,
        quantity: Math.max(1, initialItem.threshold - initialItem.quantity),
        unit: initialItem.unit,
        pendingName: initialItem.name
      }]);
    } else if (isOpen) {
      setItems([]);
    }
  }, [initialItem, isOpen]);

  const fetchSourceItems = async (locId: string) => {
    if (!locId) return;
    setLoadingItems(true);
    try {
      const response = await api.get("/inventory", { params: { locationId: locId } });
      const fetchedItems = response.data;
      setAvailableItems(fetchedItems);
      
      // Auto-match items if we have pending matches
      setItems(prevItems => prevItems.map(item => {
        if (item.pendingName && !item.itemId) {
          const match = fetchedItems.find((ai: any) => ai.name.toLowerCase() === item.pendingName?.toLowerCase());
          if (match) {
            return {
              ...item,
              itemId: match.id || match._id,
              name: match.name,
              unit: match.unit,
              pendingName: undefined
            };
          }
        }
        return item;
      }));
    } catch (error) {
      toast.error("Failed to fetch source inventory");
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    if (sourceLocationId) {
      fetchSourceItems(sourceLocationId);
    }
  }, [sourceLocationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceLocationId) {
      toast.error(t('inventory.selectSource'));
      return;
    }
    if (items.length === 0) {
      toast.error(t('inventory.selectItem'));
      return;
    }

    setLoading(true);
    try {
      await api.post("/stock-transfers", {
        fromLocationId: sourceLocationId,
        toLocationId: currentLocation?.id || currentLocation?._id,
        items,
        reason,
        notes
      });
      toast.success(t('inventory.requestTransferSuccess'));
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(t('inventory.requestTransferError'));
    } finally {
      setLoading(false);
    }
  };

  const addItemRow = () => {
    setItems([...items, { itemId: "", name: "", quantity: 1, unit: "" }]);
  };

  const updateItemRow = (index: number, itemId: string) => {
    const selected = availableItems.find(i => i.id === itemId);
    if (!selected) return;
    
    const newItems = [...items];
    newItems[index] = {
      itemId: selected.id,
      name: selected.name,
      quantity: 1,
      unit: selected.unit
    };
    setItems(newItems);
  };

  const updateItemQty = (index: number, qty: number) => {
    const newItems = [...items];
    newItems[index].quantity = qty;
    setItems(newItems);
  };

  const removeItemRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-card rounded-[32px] shadow-2xl overflow-hidden border border-border"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <Truck size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-bold text-foreground">
                      {t('inventory.requestTransfer')}
                    </h3>
                    <p className="text-xs text-muted-foreground">{t('inventory.stockTransfersDesc') || 'Request supplies from another branch'}</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* From/To Display */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">{t('inventory.sourceLocation')}</label>
                    <select 
                      value={sourceLocationId}
                      onChange={(e) => setSourceLocationId(e.target.value)}
                      className="w-full px-5 py-3.5 bg-muted border-none rounded-2xl text-sm text-foreground focus:ring-2 focus:ring-primary transition-all appearance-none cursor-pointer"
                      required
                    >
                      <option value="">{t('inventory.selectSource')}</option>
                      {otherLocations.map(loc => (
                        <option key={loc.id || loc._id} value={loc.id || loc._id}>{loc.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">{t('inventory.destinationLocation')}</label>
                    <div className="w-full px-5 py-3.5 bg-muted/50 rounded-2xl text-sm text-foreground border border-border flex items-center gap-2">
                      <span className="font-bold text-primary">{currentLocation?.name}</span>
                      <span className="text-xs text-muted-foreground">(This Branch)</span>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">{t('inventory.itemsRequested') || 'Items Requested'}</label>
                    <button 
                      type="button"
                      onClick={addItemRow}
                      className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest"
                    >
                      + {t('common.addMore') || 'Add More'}
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    {!sourceLocationId ? (
                      <div className="flex flex-col items-center justify-center p-8 bg-muted/20 border border-dashed border-border rounded-2xl gap-2">
                        <AlertCircle size={20} className="text-muted-foreground" />
                        <p className="text-xs text-muted-foreground text-center">
                          {t('inventory.selectSourceFirst') || 'Please select a source branch first to see available stock'}
                        </p>
                      </div>
                    ) : (
                      items.map((item, idx) => (
                        <div key={idx} className="flex gap-3 items-center bg-muted/30 p-3 rounded-2xl border border-border">
                          <div className="flex-1 relative">
                            <select 
                              value={item.itemId}
                              onChange={(e) => updateItemRow(idx, e.target.value)}
                              disabled={loadingItems}
                              className="w-full bg-transparent border-none text-sm font-bold text-foreground focus:ring-0 cursor-pointer disabled:opacity-50 appearance-none pr-8"
                            >
                              <option value="">{loadingItems ? 'Loading...' : t('inventory.selectItem')}</option>
                              {availableItems.map(ai => (
                                <option key={ai.id} value={ai.id}>{ai.name} ({ai.quantity} {ai.unit})</option>
                              ))}
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                              <ChevronDown size={14} />
                            </div>
                          </div>
                          <div className="w-32 flex items-center bg-card rounded-xl border border-border px-3 py-1">
                            <input 
                              type="number"
                              min="0.1"
                              step="0.1"
                              value={isNaN(item.quantity) ? '' : item.quantity}
                              onChange={(e) => {
                                const val = e.target.value === '' ? NaN : parseFloat(e.target.value);
                                updateItemQty(idx, val);
                              }}
                              className="w-full bg-transparent border-none text-sm font-bold text-foreground focus:ring-0 text-center"
                            />
                            <span className="text-[10px] text-muted-foreground font-bold">{item.unit || '-'}</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => removeItemRow(idx)}
                            className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">{t('inventory.transferReason')}</label>
                    <input 
                      type="text" 
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. Running out of milk"
                      className="w-full px-5 py-3.5 bg-muted border-none rounded-2xl text-sm text-foreground focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">{t('inventory.transferNotes')}</label>
                    <input 
                      type="text" 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Special instructions..."
                      className="w-full px-5 py-3.5 bg-muted border-none rounded-2xl text-sm text-foreground focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                </div>

                <div className="pt-6 flex gap-4">
                  <button 
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-4 bg-muted text-muted-foreground rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-accent/50 transition-all border border-border"
                  >
                    {t('common.cancel')}
                  </button>
                  <button 
                    type="submit"
                    disabled={loading || items.length === 0}
                    className="flex-[2] py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {t('inventory.requestTransfer')}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
