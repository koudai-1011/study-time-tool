import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Dialog, type DialogOptions } from '../components/Dialog';

interface DialogContextType {
  showDialog: (options: DialogOptions) => Promise<boolean>;
  alert: (message: string, options?: Partial<DialogOptions>) => Promise<void>;
  confirm: (message: string, options?: Partial<DialogOptions>) => Promise<boolean>;
  isOpen: boolean;
  close: () => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<DialogOptions>({ message: '' });
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const showDialog = useCallback((options: DialogOptions) => {
    setOptions(options);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleClose = useCallback((result: boolean) => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(result);
      resolveRef.current = null;
    }
  }, []);

  const alert = useCallback(async (message: string, opts?: Partial<DialogOptions>) => {
    await showDialog({
      message,
      type: 'info',
      confirmText: 'OK',
      ...opts,
    });
  }, [showDialog]);

  const confirm = useCallback(async (message: string, opts?: Partial<DialogOptions>) => {
    return await showDialog({
      message,
      type: 'confirm',
      confirmText: 'OK',
      cancelText: 'キャンセル',
      ...opts,
    });
  }, [showDialog]);

  const close = useCallback(() => {
    handleClose(false);
  }, [handleClose]);

  return (
    <DialogContext.Provider value={{ showDialog, alert, confirm, isOpen, close }}>
      {children}
      <Dialog
        isOpen={isOpen}
        onClose={handleClose}
        {...options}
      />
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (context === undefined) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};
