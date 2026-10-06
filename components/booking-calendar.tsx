import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatServiceDate, formatWeekRange } from '@/lib/dates';
import type { Language, Translate } from '@/lib/i18n';
import type { Reservation } from '@/lib/restaurant';
import { cn } from '@/lib/utils';
import { operationalType } from '@/components/operational-ui';

/**
 * Week navigation keeps previous/next actions visually equal and places the
 * arrow on the edge that indicates movement.
 */
function WeekNavigationButton({
  direction,
  children,
  onClick,
}: {
  direction: 'previous' | 'next';
  children: ReactNode;
  onClick: () => void;
}) {
  const Icon = direction === 'previous' ? ChevronLeft : ChevronRight;
  return (
    <Button
      variant="secondary"
      className={cn(
        'row-start-2 min-h-12 gap-2 px-4 md:row-start-1',
        direction === 'previous'
          ? 'col-start-1 justify-self-start'
          : 'col-start-2 justify-self-end md:col-start-3',
      )}
      onClick={onClick}
    >
      {direction === 'previous' && <Icon aria-hidden="true" />}
      {children}
      {direction === 'next' && <Icon aria-hidden="true" />}
    </Button>
  );
}

/**
 * One day in the seven-day selector. The selected treatment is intentionally
 * quiet so booking density remains the most readable information.
 */
function CalendarDay({
  date,
  count,
  selected,
  language,
  onSelect,
  t,
}: {
  date: string;
  count: number;
  selected: boolean;
  language: Language;
  onSelect: () => void;
  t: Translate;
}) {
  const fullDate = formatServiceDate(date, language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <button
      className={cn(
        operationalType,
        'flex min-h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-0 px-1.5 py-2 text-base text-foreground md:min-w-18 md:flex-1',
        selected && 'bg-paper',
      )}
      aria-pressed={selected}
      aria-label={`${fullDate}, ${t('booking.dayCount', { count })}`}
      onClick={onSelect}
    >
      <span>{formatServiceDate(date, language, { weekday: 'short' })}</span>
      <strong className="text-xl leading-none">
        {formatServiceDate(date, language, { day: 'numeric' })}
      </strong>
      <small className="text-base text-ink-muted">{count}</small>
    </button>
  );
}

/**
 * Seven-day booking navigator. It selects dates only; booking creation and
 * booking-list content remain responsibilities of the parent view.
 */
export function BookingCalendar({
  dates,
  selectedDate,
  reservations,
  language,
  onSelectDate,
  onPreviousWeek,
  onNextWeek,
  onToday,
  t,
}: {
  dates: string[];
  selectedDate: string;
  reservations: Reservation[];
  language: Language;
  onSelectDate: (date: string) => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  t: Translate;
}) {
  return (
    <section aria-label={t('booking.weekSchedule')}>
      <div className="mb-6 grid grid-cols-2 items-center gap-4 text-center md:grid-cols-3">
        <WeekNavigationButton direction="previous" onClick={onPreviousWeek}>
          {t('booking.previousWeek')}
        </WeekNavigationButton>
        <div className="col-span-full row-start-1 flex flex-wrap items-center justify-center gap-3 md:col-auto">
          <b className={cn(operationalType, 'text-base break-anywhere')}>
            {formatWeekRange(dates[0], language)}
          </b>
          <Button onClick={onToday}>{t('booking.today')}</Button>
        </div>
        <WeekNavigationButton direction="next" onClick={onNextWeek}>
          {t('booking.nextWeek')}
        </WeekNavigationButton>
      </div>
      <div className="flex gap-2 overflow-x-auto p-0.5">
        {dates.map((date) => {
          const count = reservations.filter(
            (reservation) => reservation.date === date,
          ).length;
          return (
            <CalendarDay
              key={date}
              date={date}
              count={count}
              selected={selectedDate === date}
              language={language}
              onSelect={() => onSelectDate(date)}
              t={t}
            />
          );
        })}
      </div>
    </section>
  );
}
