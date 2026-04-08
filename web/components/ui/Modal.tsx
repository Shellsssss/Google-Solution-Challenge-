'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = 'md',
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
            'w-full mx-4 rounded-2xl border border-border bg-background-card p-6 shadow-2xl',
            'focus:outline-none',
            sizeMap[size]
          )}
        >
          {(title || description) && (
            <div className="mb-4 pr-8">
              {title && (
                <Dialog.Title className="text-lg font-semibold text-white">
                  {title}
                </Dialog.Title>
              )}
              {description && (
                <Dialog.Description className="mt-1 text-sm text-muted">
                  {description}
                </Dialog.Description>
              )}
            </div>
          )}
          <Dialog.Close className="absolute right-4 top-4 text-muted hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
