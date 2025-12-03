import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export interface DialogOptions {
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'danger' | 'success' | 'warning';
}

interface DialogProps extends DialogOptions {
  isOpen: boolean;
  onClose: (result: boolean) => void;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  cancelText = 'キャンセル',
  confirmColor,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-green-500" size={32} />;
      case 'warning':
        return <AlertTriangle className="text-amber-500" size={32} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={32} />;
      case 'confirm':
        return <AlertCircle className="text-primary-500" size={32} />;
      default:
        return <Info className="text-blue-500" size={32} />;
    }
  };

  const getConfirmButtonClass = () => {
    const baseClass = "px-6 py-2.5 rounded-xl font-bold text-white transition-all active:scale-95 shadow-lg";
    
    // Explicit color override
    if (confirmColor === 'danger') return `${baseClass} bg-red-500 hover:bg-red-600 shadow-red-500/30`;
    if (confirmColor === 'success') return `${baseClass} bg-green-500 hover:bg-green-600 shadow-green-500/30`;
    if (confirmColor === 'warning') return `${baseClass} bg-amber-500 hover:bg-amber-600 shadow-amber-500/30`;
    if (confirmColor === 'primary') return `${baseClass} bg-primary-600 hover:bg-primary-700 shadow-primary-600/30`;

    // Default based on type
    switch (type) {
      case 'error':
        return `${baseClass} bg-red-500 hover:bg-red-600 shadow-red-500/30`;
      case 'success':
        return `${baseClass} bg-green-500 hover:bg-green-600 shadow-green-500/30`;
      case 'warning':
        return `${baseClass} bg-amber-500 hover:bg-amber-600 shadow-amber-500/30`;
      default:
        return `${baseClass} bg-primary-600 hover:bg-primary-700 shadow-primary-600/30`;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => type !== 'confirm' && onClose(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-sm w-full p-6 relative z-10 border border-slate-100 dark:border-slate-700"
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-full">
                {getIcon()}
              </div>
              
              {title && (
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                  {title}
                </h3>
              )}
              
              <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                {message}
              </p>

              <div className="flex gap-3 w-full">
                {(type === 'confirm' || type === 'warning') && (
                  <button
                    onClick={() => onClose(false)}
                    className="flex-1 px-6 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    {cancelText}
                  </button>
                )}
                <button
                  onClick={() => onClose(true)}
                  className={`flex-1 ${getConfirmButtonClass()}`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
