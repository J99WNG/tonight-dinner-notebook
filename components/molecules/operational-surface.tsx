import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

/**
 * Molecular paper surface for dense lists. It intentionally has no outer
 * border or elevation so row dividers and status colors carry the hierarchy.
 */
export function OperationalSurface({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-xl bg-paper', className)} {...props} />;
}
