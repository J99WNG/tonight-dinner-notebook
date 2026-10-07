import type { ReactNode } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Molecular task container: bottom-anchored on compact screens and centered
 * on larger screens. Content stays clipped to the paper surface, with scroll
 * available only when the viewport cannot contain the task.
 */
export function ActionSheet({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="bottom-0 top-auto left-0 max-h-dvh w-full max-w-full translate-none gap-3 overflow-y-auto overscroll-y-contain rounded-t-2xl rounded-b-none bg-paper px-5 py-5 md:top-1/2 md:left-1/2 md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:p-5 [&_[data-slot=dialog-close]]:top-2 [&_[data-slot=dialog-close]]:right-2 [&_[data-slot=dialog-close]]:min-h-11 [&_[data-slot=dialog-close]]:min-w-11">
        <DialogTitle className="pr-5 text-2xl leading-tight font-semibold tracking-tight">
          {title}
        </DialogTitle>

        <DialogDescription>{description}</DialogDescription>
        {children}
      </DialogContent>
    </Dialog>
  );
}
