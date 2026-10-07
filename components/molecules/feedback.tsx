import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Molecular empty state for operational sections. Supply one familiar icon,
 * a direct title, a short recovery hint, and optionally one primary action.
 */
export function EmptyState({
  icon,
  title,
  description,
  children,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-5 py-8 text-center text-ink-muted',
        className,
      )}
    >
      {icon}
      <h3 className="text-lg text-foreground">{title}</h3>
      <p className="max-w-xs text-base leading-relaxed">{description}</p>
      {children}
    </div>
  );
}

/**
 * Molecular information panel used inside sheets. It groups related facts but
 * should not contain the sheet's primary action.
 */
export function DetailPanel({
  compact = false,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { compact?: boolean }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2.5 rounded-xl bg-muted p-6 text-base text-ink-muted [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:text-foreground [&>p]:leading-normal',
        compact && 'p-4',
        className,
      )}
      {...props}
    />
  );
}

/** Atom-like icon-and-copy row scoped to the DetailPanel molecule. */
export function DetailLine({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        'inline-flex items-center gap-1.5 [&>svg]:size-5 [&>svg]:text-brand-orange-700',
        className,
      )}
      {...props}
    />
  );
}
