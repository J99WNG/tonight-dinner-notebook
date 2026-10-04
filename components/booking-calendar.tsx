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
  t,
}: {
  dates: string[];
  selectedDate: string;
  reservations: Reservation[];
  language: Language;
  onSelectDate: (date: string) => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  t: Translate;
}) {
  // Navigation and date selection live here; the parent remains responsible
  // for opening forms and deciding which booking records to show.
  return (
    <section
      className="booking-calendar"
      aria-label={t('booking.weekSchedule')}
    >
      <div className="week-navigation">
        <Button
          variant="ghost"
          onClick={onPreviousWeek}
          aria-label={t('booking.previousWeek')}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <b>{formatWeekRange(dates[0], language)}</b>
        <Button
          variant="ghost"
          onClick={onNextWeek}
          aria-label={t('booking.nextWeek')}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
      <div className="week-days">
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
              className={selectedDate === date ? 'selected' : ''}
              aria-pressed={selectedDate === date}
              aria-label={`${fullDate}, ${t('booking.dayCount', { count })}`}
              onClick={() => onSelectDate(date)}
            >
              <span>
                {formatServiceDate(date, language, { weekday: 'short' })}
              </span>
              <strong>
                {formatServiceDate(date, language, { day: 'numeric' })}
              </strong>
              <small>{count}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}
