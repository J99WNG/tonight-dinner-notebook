import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import type { Translate } from '@/lib/i18n';

/**
 * Molecular visible and assistive progress indicator for short task flows.
 * Step labels describe requested information rather than internal process.
 */
export function FormProgress({
  steps,
  currentStep,
  t,
}: {
  steps: string[];
  currentStep: number;
  t: Translate;
}) {
  return (
    <div className="grid gap-2.5 pb-1.5" aria-label={t('form.progress')}>
      <p
        id="form-progress-status"
        className="font-semibold text-ink-muted"
        aria-live="polite"
      >
        {t('form.step', { current: currentStep, total: steps.length })}
      </p>

      <progress
        className="absolute top-0 left-0 z-4 h-1.5 w-full appearance-none overflow-hidden rounded-t-2xl border-0 bg-muted [&::-moz-progress-bar]:bg-brand-orange-700 [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-brand-orange-700"
        value={currentStep}
        max={steps.length}
        aria-labelledby="form-progress-status"
      />

      <ol className="m-0 flex list-none gap-2 p-0">
        {steps.map((label, index) => {
          const number = index + 1;

          return (
            <li
              key={label}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center justify-start gap-2 text-center leading-tight text-ink-muted [&>span]:grid [&>span]:size-7 [&>span]:shrink-0 [&>span]:place-items-center [&>span]:rounded-full [&>span]:bg-muted [&>span]:font-bold',
                number < currentStep &&
                  '[&>span]:bg-status-ready [&>span]:text-status-ready-foreground',
                number === currentStep &&
                  'font-bold text-brand-orange-800 [&>span]:bg-brand-orange-700 [&>span]:text-paper',
              )}
              aria-current={number === currentStep ? 'step' : undefined}
            >
              <span>{number}</span>
              {label}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Atomic validation message tied to one field through aria-describedby. */
export function FieldError({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  return (
    <span
      id={id}
      className="mt-2 block leading-snug font-semibold text-brand-red-700!"
      role="alert"
    >
      {children}
    </span>
  );
}
