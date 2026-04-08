'use client';

import * as ToastPrimitive from '@radix-ui/react-toast';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { create } from 'zustand';

// ─── Toast store ─────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type = 'info', duration = 4000) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, message, type, duration }] }));
    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// ─── Convenience helpers ─────────────────────────────────
export const toast = {
  success: (msg: string) => useToastStore.getState().addToast(msg, 'success'),
  error: (msg: string) => useToastStore.getState().addToast(msg, 'error'),
  info: (msg: string) => useToastStore.getState().addToast(msg, 'info'),
  warning: (msg: string) => useToastStore.getState().addToast(msg, 'warning'),
};

// ─── Toaster component ───────────────────────────────────
const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4 text-success shrink-0" />,
  error: <AlertCircle className="h-4 w-4 text-danger shrink-0" />,
  warning: <AlertCircle className="h-4 w-4 text-warning shrink-0" />,
  info: <Info className="h-4 w-4 text-accent-light shrink-0" />,
};

const bgMap: Record<ToastType, string> = {
  success: 'border-success/30 bg-success/5',
  error: 'border-danger/30 bg-danger/5',
  warning: 'border-warning/30 bg-warning/5',
  info: 'border-accent/30 bg-accent/5',
};

export function Toaster() {
  const { toasts, removeToast } = useToastStore();

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {toasts.map((t) => (
        <ToastPrimitive.Root
          key={t.id}
          open
          onOpenChange={(open) => {
            if (!open) removeToast(t.id);
          }}
          className={cn(
            'fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl border p-4 shadow-xl',
            'backdrop-blur-md bg-background-card',
            bgMap[t.type],
            'animate-fade-in-up data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]',
            'max-w-sm w-full'
          )}
        >
          {iconMap[t.type]}
          <ToastPrimitive.Description className="text-sm text-white flex-1">
            {t.message}
          </ToastPrimitive.Description>
          <ToastPrimitive.Close
            onClick={() => removeToast(t.id)}
            className="text-muted hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </ToastPrimitive.Close>
        </ToastPrimitive.Root>
      ))}
      <ToastPrimitive.Viewport />
    </ToastPrimitive.Provider>
  );
}
