import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, X, Check } from "lucide-react";
import { useLanguage } from "@/LanguageContext";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'danger'
}: ConfirmModalProps) {
  const { t } = useLanguage();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-card rounded-[32px] shadow-2xl overflow-hidden border border-border"
          >
            <div className="p-8 flex flex-col items-center text-center">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mb-6",
                variant === 'danger' ? "bg-destructive/10 text-destructive" :
                variant === 'warning' ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"
              )}>
                <AlertTriangle size={32} />
              </div>
              
              <h3 className="text-2xl font-display font-bold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                {message}
              </p>

              <div className="flex gap-4 w-full">
                <button 
                  onClick={onClose}
                  className="flex-1 py-4 bg-muted text-muted-foreground rounded-2xl font-bold hover:bg-muted/80 transition-all"
                >
                  {cancelText || t('common.cancel')}
                </button>
                <button 
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={cn(
                    "flex-1 py-4 text-white rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2",
                    variant === 'danger' ? "bg-destructive shadow-destructive/20 hover:opacity-90" :
                    variant === 'warning' ? "bg-warning shadow-warning/20 hover:opacity-90" :
                    "bg-primary shadow-primary/20 hover:opacity-90"
                  )}
                >
                  <Check size={20} />
                  {confirmText || t('common.confirm')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
