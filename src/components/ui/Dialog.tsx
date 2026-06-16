import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, AlertCircle, Info, HelpCircle } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { cn } from '@/src/lib/utils';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  type?: 'ALERT' | 'CONFIRM' | 'INPUT';
  title: string;
  message: string;
  inputValue?: string;
  onConfirm?: (value?: string) => void;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger' | 'success' | 'info';
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  type = 'ALERT',
  title,
  message,
  inputValue: initialInputValue = '',
  onConfirm,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
}) => {
  const [inputValue, setInputValue] = useState(initialInputValue);

  useEffect(() => {
    if (isOpen) {
      setInputValue(initialInputValue);
    }
  }, [isOpen, initialInputValue]);

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(type === 'INPUT' ? inputValue : undefined);
    }
    onClose();
  };

  const Icon = () => {
    switch (variant) {
      case 'success': return <CheckCircle className="text-emerald-500" size={32} />;
      case 'danger': return <AlertCircle className="text-rose-500" size={32} />;
      case 'info': return <Info className="text-indigo-500" size={32} />;
      default: return type === 'CONFIRM' ? <HelpCircle className="text-amber-500" size={32} /> : <Info className="text-indigo-500" size={32} />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden border border-slate-100"
          >
            {/* Header / Icon */}
            <div className="p-8 pb-4 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <Icon />
              </div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h3>
              <p className="text-slate-500 mt-2 font-medium leading-relaxed">{message}</p>
            </div>

            {/* Input if needed */}
            {type === 'INPUT' && (
              <div className="px-8 pb-4">
                <Input
                  autoFocus
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                  placeholder="Type here..."
                  className="w-full"
                />
              </div>
            )}

            {/* Footer Buttons */}
            <div className="p-6 pt-2 flex flex-col sm:flex-row gap-3">
              {(type === 'CONFIRM' || type === 'INPUT') && (
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 rounded-2xl h-12"
                >
                  {cancelLabel}
                </Button>
              )}
              <Button
                variant={variant === 'danger' ? 'accent' : 'default'} // Mapping for UI color system
                onClick={handleConfirm}
                className={cn(
                  "flex-1 rounded-2xl h-12 font-bold transition-all",
                  variant === 'danger' ? 'bg-rose-600 hover:bg-rose-700 hover:shadow-rose-500/25' : 
                  variant === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-500/25' : 
                  'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/25'
                )}
              >
                {confirmLabel}
              </Button>
            </div>

            {/* Close Cross icon */}
            <button 
              onClick={onClose}
              aria-label="Close"
              title="Close"
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
