import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// One hierarchy for operational sections; optional slots avoid page-specific forks.
export function SectionHeading({
  heading,
  context,
  action,
  switcher,
  className = '',
}: {
  heading: ReactNode;
  context: ReactNode;
  action?: ReactNode;
  switcher?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mb-3 flex min-h-11 items-center justify-between gap-x-5 gap-y-3 max-[768px]:flex-wrap min-[769px]:mb-[18px]',
        className,
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="text-[22px] font-semibold tracking-[-0.5px] min-[769px]:text-2xl">
          {heading}
        </h2>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 text-base text-ink-muted">
          {context}
        </div>
      </div>
      {(switcher || action) && (
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          {switcher}
          {action}
        </div>
      )}
    </div>
  );
}
