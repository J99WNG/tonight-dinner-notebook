import type { ReactNode } from 'react';

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
    <div className={`section-heading ${className}`.trim()}>
      <div className="section-heading-summary">
        <h2>{heading}</h2>
        <div className="section-context">{context}</div>
      </div>
      {(switcher || action) && (
        <div className="section-heading-actions">
          {switcher}
          {action}
        </div>
      )}
    </div>
  );
}
