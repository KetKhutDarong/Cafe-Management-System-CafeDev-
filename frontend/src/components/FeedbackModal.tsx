import { useState } from "react";
import { Star, MessageSquare, X, Send } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/LanguageContext";
import api from "@/services/api";
import { toast } from "sonner";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber?: string;
}

export default function FeedbackModal({ isOpen, onClose, orderId, orderNumber }: FeedbackModalProps) {
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      return toast.error(t('feedback.ratingRequired'));
    }

    setIsSubmitting(true);
    try {
      await api.post("/feedback", {
        orderId,
        rating,
        comment
      });
      toast.success(t('feedback.success'));
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('feedback.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-card rounded-[40px] shadow-2xl overflow-hidden border border-border"
          >
            <div className="p-8 border-b border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <Star size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-foreground">{t('feedback.title')}</h3>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
                    {orderNumber ? `Order #${orderNumber}` : t('feedback.shareExp')}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-xl text-muted-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="text-center space-y-4">
                <p className="text-sm font-medium text-muted-foreground">{t('feedback.howWasIt')}</p>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform active:scale-90"
                    >
                      <Star
                        size={40}
                        className={cn(
                          "transition-colors",
                          (hoverRating || rating) >= star
                            ? "fill-primary text-primary"
                            : "text-muted border-none fill-muted/30"
                        )}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-xs font-bold text-primary uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2">
                    {rating === 5 ? t('feedback.excellent') : 
                     rating === 4 ? t('feedback.great') : 
                     rating === 3 ? t('feedback.good') : 
                     rating === 2 ? t('feedback.fair') : t('feedback.poor')}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest ml-4">
                  {t('feedback.commentLabel')}
                </label>
                <div className="relative group">
                  <MessageSquare className="absolute left-6 top-6 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    placeholder={t('feedback.placeholder')}
                    className="w-full pl-16 pr-6 py-5 bg-muted border-none rounded-[24px] font-bold text-sm focus:ring-2 focus:ring-primary transition-all resize-none text-card-foreground"
                  />
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting || rating === 0}
                className="w-full py-5 bg-primary text-primary-foreground rounded-[24px] font-bold text-sm flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-[0_20px_40px_-15px_rgba(var(--primary-rgb),0.3)] disabled:opacity-50 disabled:shadow-none"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={18} />
                    {t('feedback.submit')}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
