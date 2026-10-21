import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, X, ShieldCheck, Loader2 } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  amount: number;
  title: string;
  description: string;
  type: 'hire' | 'book';
}

export function CheckoutModal({ isOpen, onClose, onConfirm, amount, title, description, type }: CheckoutModalProps) {
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePayment = async () => {
    setProcessing(true);
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    try {
      await onConfirm();
      onClose();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-surface border border-border rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative"
        >
          <button 
            onClick={onClose}
            disabled={processing}
            className="absolute top-4 right-4 p-2 text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-8 mt-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
              <CreditCard className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-display font-bold">{title}</h2>
            <p className="text-text-muted mt-2">{description}</p>
          </div>

          <div className="bg-background border border-border rounded-2xl p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-text-muted font-medium">Total Amount</span>
              <span className="text-3xl font-mono font-bold text-primary">₹{amount}</span>
            </div>
            
            <div className="pt-4 border-t border-border border-dashed space-y-3">
              <div className="flex items-center gap-3 text-sm text-text-muted">
                <ShieldCheck className="w-4 h-4 text-accent" />
                <span>Secure 256-bit encryption</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-text-muted">
                <CreditCard className="w-4 h-4 text-primary" />
                <span>Mock payment - No real card charged</span>
              </div>
            </div>
          </div>

          <button
            onClick={handlePayment}
            disabled={processing}
            className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(108,99,255,0.3)] hover:shadow-[0_0_25px_rgba(108,99,255,0.5)] flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing Payment...
              </>
            ) : (
              `Pay ₹${amount} & ${type === 'hire' ? 'Subscribe' : 'Confirm'}`
            )}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
