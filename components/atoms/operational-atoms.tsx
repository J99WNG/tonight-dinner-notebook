import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Atomic typography treatment for changing operational data such as times,
 * dates, queue numbers, and durations. Do not use it for general interface copy.
 */
export const operationalType =
  'font-mono tracking-wide tabular-nums [font-feature-settings:"tnum"_1]';

/** Atomic positive-status badge, reserved for availability counts. */
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

/** Atomic supporting copy placed immediately after a related content group. */
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

/** Atomic low-emphasis helper copy used at the end of a workflow group. */
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
