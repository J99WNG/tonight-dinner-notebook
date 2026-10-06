import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Designer note: use this treatment for changing operational data—times,
 * dates, queue numbers, and durations—not for general interface copy.
 */
export const operationalType =
  'font-mono tracking-wide tabular-nums [font-feature-settings:"tnum"_1]';

/**
 * A quiet paper surface for dense lists. It intentionally has no outer border
 * or elevation so row dividers and status colors carry the hierarchy.
 */
export function OperationalSurface({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-xl bg-paper', className)} {...props} />;
}

/**
 * Standard empty state for operational sections. Supply one familiar icon,
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

/** Supporting copy that follows a card group or operational list. */
export function SupportingText({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        'mt-3 flex items-center gap-1.5 text-base leading-normal text-ink-muted',
        className,
      )}
      {...props}
    />
  );
}

/** Compact positive-status badge, reserved for availability counts. */
export function ReadyBadge({ children }: { children: ReactNode }) {
  return (
    <span
      className={cn(
        operationalType,
        'rounded-full bg-status-ready px-2.5 py-1.5 text-base text-status-ready-foreground',
      )}
    >
      {children}
    </span>
  );
}

/**
 * Neutral information panel used inside sheets. It groups related facts but
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

/** Icon-and-copy row for one fact inside a DetailPanel. */
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

/** Low-emphasis helper copy used at the end of a form or decision group. */
export function FormFootnote({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        'text-center text-base leading-relaxed text-ink-muted',
        className,
      )}
      {...props}
    />
  );
}

/** Vertical list for selectable table or party options in a sheet. */
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
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
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
