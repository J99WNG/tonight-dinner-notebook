import { CalendarDays, Check, Clock3, LayoutGrid, Moon, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Language, Translate } from '@/lib/i18n';
import { operationalType } from '@/components/operational-ui';

export type ServiceView = 'Tonight' | 'Bookings' | 'Tables';

const destinations = [
  { name: 'Tonight' as const, icon: Moon },
  { name: 'Bookings' as const, icon: CalendarDays },
  { name: 'Tables' as const, icon: LayoutGrid },
];

/**
 * Product header: restaurant identity, live Hong Kong service context, and
 * language selection. Keep task controls out of this persistent region.
 */
export function ServiceHeader({
  clock,
  language,
  onLanguageChange,
  t,
}: {
  clock: string;
  language: Language;
  onLanguageChange: (language: Language) => void;
  t: Translate;
}) {
  return (
    <header className="mx-5 flex min-h-24 items-center gap-2 border-b border-border md:mx-12 md:min-h-28 md:gap-5">
      <div className="flex min-w-0 items-center gap-2 md:gap-3.5">
        <svg
          className="h-12 w-10 overflow-hidden md:h-20 md:w-16"
          viewBox="0 0 640 700"
          aria-hidden="true"
        >
          <image
            href="supreme-roast-goose-king-logo.svg"
            width="640"
            height="826"
          />
        </svg>
        <strong className="text-xl leading-tight tracking-wide whitespace-nowrap">
          新志興訂位簿
        </strong>
      </div>

      <div className="ml-auto flex items-center gap-2 md:gap-4">
        <span className="hidden items-center gap-2 text-base md:flex">
          <i className="size-2 rounded-full bg-status-ready-border" />
          {t('service.open')}
        </span>

        <div
          className={cn(
            operationalType,
            'inline-flex min-h-11 items-center gap-2 text-foreground [&>svg]:size-6 [&>svg]:text-brand-orange-700',
          )}
          aria-label={`${t('service.hkTime')}: ${clock}`}
        >
          <Clock3 aria-hidden="true" />
          <span className="flex flex-col items-start">
            <small className="sr-only text-base leading-tight text-ink-muted md:not-sr-only">
              {t('service.currentTime')}
            </small>
            <b className="text-lg leading-tight md:text-xl">{clock}</b>
          </span>
        </div>

        <div
          className="flex rounded-lg bg-muted p-1"
          aria-label="Language / 語言 / 语言"
        >
          {(
            [
              ['en', 'EN'],
              ['zh-HK', '繁'],
              ['zh-CN', '简'],
            ] as const
          ).map(([code, label]) => (
            <button
              className="min-h-8 min-w-8 rounded-md border-0 bg-transparent text-base text-ink-muted aria-pressed:bg-paper aria-pressed:font-bold aria-pressed:text-brand-orange-800 aria-pressed:shadow-sm md:min-h-9 md:min-w-9"
              key={code}
              aria-pressed={language === code}
              onClick={() => onLanguageChange(code)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

/** Persistent primary navigation. The dot marks an arrived booking requiring action. */
export function PrimaryNavigation({
  currentView,
  hasArrivedBooking,
  onSelect,
  t,
}: {
  currentView: ServiceView;
  hasArrivedBooking: boolean;
  onSelect: (view: ServiceView) => void;
  t: Translate;
}) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 flex justify-around gap-1.5 border border-b-0 border-border bg-paper px-3.5 py-1.5 shadow-lg md:inset-x-auto md:bottom-5 md:left-1/2 md:-translate-x-1/2 md:rounded-2xl md:border-b md:p-2"
      aria-label="Main navigation"
    >
      {destinations.map(({ name, icon: Icon }) => (
        <button
          key={name}
          aria-current={currentView === name ? 'page' : undefined}
          className={cn(
            'relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl border-0 bg-transparent text-base text-ink-muted md:min-h-12 md:min-w-28 md:flex-row md:gap-2',
            currentView === name &&
              'bg-brand-orange-100 font-bold text-brand-orange-800',
          )}
          onClick={() => onSelect(name)}
        >
          <Icon size={20} />
          <span>{t('nav.' + name.toLowerCase())}</span>
          {name === 'Bookings' && hasArrivedBooking && (
            <i className="size-1.5 rounded-full bg-brand-red-500" />
          )}
        </button>
      ))}
    </nav>
  );
}

/**
 * Temporary action confirmation. Undo is optional; dismissal is always
 * available so the message never blocks the service workflow.
 */
export function ActionToast({
  message,
  canUndo,
  onUndo,
  onDismiss,
  t,
}: {
  message: string;
  canUndo: boolean;
  onUndo: () => void;
  onDismiss: () => void;
  t: Translate;
}) {
  return (
    <output
      className="fixed bottom-24 left-1/2 z-70 flex w-11/12 max-w-sm -translate-x-1/2 items-center gap-2 rounded-xl bg-foreground px-3 py-2 text-base text-white shadow-xl md:bottom-28 md:w-max md:gap-2.5 md:px-3.5 [&>button]:min-h-11 [&>button]:min-w-10 [&>button]:border-0 [&>button]:bg-transparent [&>button]:font-semibold [&>button]:text-brand-orange-100 [&>svg]:text-brand-orange-200 [&>span]:max-w-52 md:[&>span]:max-w-72"
      aria-live="polite"
    >
      <Check size={18} />
      <span>{message}</span>
      {canUndo && <button onClick={onUndo}>{t('action.undo')}</button>}
      <button aria-label="Dismiss notification" onClick={onDismiss}>
        <X size={20} />
      </button>
    </output>
  );
}
