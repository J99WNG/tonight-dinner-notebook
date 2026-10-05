import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatServiceDate, formatWeekRange } from '@/lib/dates';
import type { Language, Translate } from '@/lib/i18n';
import type { Reservation } from '@/lib/restaurant';

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
  // Navigation and date selection live here; the parent remains responsible
  // for opening forms and deciding which booking records to show.
  return (
    <section aria-label={t('booking.weekSchedule')}>
      <div className="mb-[22px] grid grid-cols-2 items-center gap-4 text-center min-[761px]:grid-cols-[1fr_auto_1fr]">
        <Button
          variant="secondary"
          className="col-start-1 row-start-2 min-h-12 justify-self-start gap-2 px-4 min-[761px]:row-start-1"
          onClick={onPreviousWeek}
        >
          <ChevronLeft aria-hidden="true" />
          {t('booking.previousWeek')}
        </Button>
        <div className="col-span-full row-start-1 flex flex-wrap items-center justify-center gap-3 min-[761px]:col-auto">
          <b className="font-mono text-base tracking-[0.015em] break-anywhere tabular-nums">
            {formatWeekRange(dates[0], language)}
          </b>
          <Button onClick={onToday}>{t('booking.today')}</Button>
        </div>
        <Button
          variant="secondary"
          className="col-start-2 row-start-2 min-h-12 justify-self-end gap-2 px-4 min-[761px]:col-start-3 min-[761px]:row-start-1"
          onClick={onNextWeek}
        >
          {t('booking.nextWeek')}
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
      <div className="grid grid-cols-[repeat(7,minmax(74px,1fr))] gap-2 overflow-x-auto p-0.5 min-[761px]:grid-cols-[repeat(7,minmax(70px,1fr))]">
        {dates.map((date) => {
          const count = reservations.filter(
            (reservation) => reservation.date === date,
          ).length;
          const fullDate = formatServiceDate(date, language, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
          return (
            <button
              key={date}
              className={`flex min-h-[82px] min-w-[70px] flex-col items-center justify-center gap-[3px] rounded-[10px] border-0 px-1.5 py-[9px] font-mono text-base tracking-[0.015em] text-foreground tabular-nums ${
                selectedDate === date ? 'bg-paper' : ''
              }`}
              aria-pressed={selectedDate === date}
              aria-label={`${fullDate}, ${t('booking.dayCount', { count })}`}
              onClick={() => onSelectDate(date)}
            >
              <span>
                {formatServiceDate(date, language, { weekday: 'short' })}
              </span>
              <strong className="text-xl leading-none">
                {formatServiceDate(date, language, { day: 'numeric' })}
              </strong>
              <small className="text-base text-ink-muted">{count}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}
