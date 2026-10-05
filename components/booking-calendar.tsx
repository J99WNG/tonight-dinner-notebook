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
    <section
      className="booking-calendar"
      aria-label={t('booking.weekSchedule')}
    >
      <div className="week-navigation">
        <Button variant="secondary" onClick={onPreviousWeek}>
          <ChevronLeft aria-hidden="true" />
          {t('booking.previousWeek')}
        </Button>
        <div className="week-navigation-center">
          <b className="operational-type">
            {formatWeekRange(dates[0], language)}
          </b>
          <Button onClick={onToday}>{t('booking.today')}</Button>
        </div>
        <Button variant="secondary" onClick={onNextWeek}>
          {t('booking.nextWeek')}
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
              className={`operational-type ${
                selectedDate === date ? 'selected' : ''
              }`.trim()}
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
