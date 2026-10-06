import type { ReactNode } from 'react';
import { CalendarDays, Plus, RotateCcw } from 'lucide-react';

import { BookingCalendar } from '@/components/booking-calendar';
import {
  EmptyState,
  OperationalSurface,
  ReadyBadge,
  SupportingText,
} from '@/components/operational-ui';
import { SectionHeading } from '@/components/section-heading';
import {
  TableGroupingSwitch,
  TableOverview,
  type TableFilter,
  type TableGrouping,
} from '@/components/table-overview';
import { Button } from '@/components/ui/button';
import { formatServiceDate } from '@/lib/dates';
import type { Language, Translate } from '@/lib/i18n';
import type { Reservation, RestaurantTable } from '@/lib/restaurant';

/**
 * Full booking-management view. Calendar selection and the selected day's
 * list stay together so the relationship remains obvious in every language.
 */
export function BookingsView({
  dates,
  selectedDate,
  reservations,
  language,
  onSelectDate,
  onPreviousWeek,
  onNextWeek,
  onToday,
  onAddBooking,
  renderBooking,
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
  onAddBooking: () => void;
  renderBooking: (reservation: Reservation) => ReactNode;
  t: Translate;
}) {
  const selectedReservations = reservations
    .filter((reservation) => reservation.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <section className="w-full max-w-none">
      <BookingCalendar
        dates={dates}
        selectedDate={selectedDate}
        reservations={reservations}
        language={language}
        onSelectDate={onSelectDate}
        onPreviousWeek={onPreviousWeek}
        onNextWeek={onNextWeek}
        onToday={onToday}
        t={t}
      />
      <OperationalSurface className="mt-7 p-6">
        <SectionHeading
          className="items-end [&_h2]:mt-1"
          heading={formatServiceDate(selectedDate, language, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
          context={t('booking.dayCount', {
            count: selectedReservations.length,
          })}
          action={
            <Button onClick={onAddBooking}>
              <Plus /> {t('booking.add')}
            </Button>
          }
        />
        <div>{selectedReservations.map(renderBooking)}</div>
        {!selectedReservations.length && (
          <EmptyState
            icon={<CalendarDays />}
            title={t('booking.empty')}
            description={t('booking.walkins')}
          />
        )}
      </OperationalSurface>
      <SupportingText>{t('booking.tap')}</SupportingText>
    </section>
  );
}

/**
 * Full table-management view. Grouping changes structure; status filtering
 * changes visibility. Keeping them separate avoids ambiguous control states.
 */
export function TablesView({
  tables,
  reservations,
  now,
  grouping,
  statusFilter,
  onGroupingChange,
  onStatusFilterChange,
  onOpenTable,
  onReset,
  t,
}: {
  tables: RestaurantTable[];
  reservations: Reservation[];
  now: number;
  grouping: TableGrouping;
  statusFilter: TableFilter;
  onGroupingChange: (grouping: TableGrouping) => void;
  onStatusFilterChange: (filter: TableFilter) => void;
  onOpenTable: (id: string) => void;
  onReset: () => void;
  t: Translate;
}) {
  const readyCount = tables.filter(
    (table) => table.status === 'available',
  ).length;
  return (
    <section className="w-full max-w-none">
      <SectionHeading
        heading={t('tables.every')}
        context={
          <ReadyBadge>{t('tables.ready', { count: readyCount })}</ReadyBadge>
        }
        switcher={
          <TableGroupingSwitch
            grouping={grouping}
            onGroupingChange={onGroupingChange}
            t={t}
          />
        }
      />
      <TableOverview
        tables={tables}
        reservations={reservations}
        now={now}
        grouping={grouping}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
        onOpenTable={onOpenTable}
        t={t}
      />
      <SupportingText>
        {t('tables.count', {
          count: tables.length,
          seats: tables.reduce((sum, table) => sum + table.capacity, 0),
        })}
      </SupportingText>
      <div className="mt-8 border-t border-border pt-6">
        <h3 className="text-base font-semibold">{t('demo.title')}</h3>
        <p className="my-4 flex items-center gap-2.5 text-base">
          {t('demo.flow')}
        </p>
        <small className="text-ink-muted">{t('demo.help')}</small>
      </div>
      <Button
        variant="quinary"
        className="mt-10 mb-2 pl-0 text-base text-ink-muted"
        onClick={onReset}
      >
        <RotateCcw /> {t('action.reset')}
      </Button>
      <p className="text-base leading-relaxed text-ink-muted">
        {t('demo.note')}
        <br />
        {t('demo.clock')}
      </p>
    </section>
  );
}
