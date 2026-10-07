import type { ButtonHTMLAttributes, HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

/** Molecular vertical list for selectable table or party options in a sheet. */
export function ChoiceList({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-2', className)} {...props} />;
}

/**
 * One large selection target inside ChoiceList. Keep the primary identifier
 * first, supporting information second, and the directional icon last.
 */
export function ChoiceItem({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'flex min-h-20 w-full items-center gap-4 rounded-xl border border-brand-orange-200 bg-brand-orange-50 p-4 text-left [&>span:nth-child(2)]:flex-1 [&_b]:text-base [&_b]:font-semibold [&_small]:mt-1 [&_small]:block [&_small]:text-base [&_small]:text-ink-muted',
        className,
      )}
      {...props}
    />
  );
}
