import { TableCard } from '@/components/service-ui';
import { Button } from '@/components/ui/button';
import {
  roomForTable,
  type Reservation,
  type RestaurantTable,
  type TableStatus,
} from '@/lib/restaurant';
import type { Translate } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export type TableGrouping = 'room' | 'area';
export type TableFilter = 'all' | TableStatus;

const statusFilters: TableFilter[] = [
  'all',
  'available',
  'occupied',
  'reserved',
  'cleaning',
];

const filterStyles: Record<TableFilter, string> = {
  all: 'bg-muted text-foreground',
  available: 'bg-status-ready text-status-ready-foreground',
  occupied: 'bg-status-occupied text-status-occupied-foreground',
  reserved: 'bg-status-reserved text-status-reserved-foreground',
  cleaning: 'bg-status-cleaning text-status-cleaning-foreground',
};

export function TableGroupingSwitch({
  grouping,
  onGroupingChange,
  t,
}: {
  grouping: TableGrouping;
  onGroupingChange: (grouping: TableGrouping) => void;
  t: Translate;
}) {
  return (
    <fieldset className="m-0 inline-flex gap-1 rounded-full border-0 bg-muted p-1">
      <legend className="sr-only">{t('tables.organize')}</legend>
      {(['room', 'area'] as const).map((option) => (
        <Button
          key={option}
          variant="quinary"
          aria-pressed={grouping === option}
          className={cn(
            'px-[13px] text-base',
            grouping === option &&
              'border-brand-orange-700 bg-brand-orange-700 text-white',
          )}
          onClick={() => onGroupingChange(option)}
        >
          {t(option === 'room' ? 'tables.byRoom' : 'tables.byArea')}
        </Button>
      ))}
    </fieldset>
  );
}

export function TableOverview({
  tables,
  reservations,
  now,
  grouping,
  statusFilter,
  onStatusFilterChange,
  onOpenTable,
  t,
}: {
  tables: RestaurantTable[];
  reservations: Reservation[];
  now: number;
  grouping: TableGrouping;
  statusFilter: TableFilter;
  onStatusFilterChange: (status: TableFilter) => void;
  onOpenTable: (id: string) => void;
  t: Translate;
}) {
  const visibleTables = tables.filter(
    (table) => statusFilter === 'all' || table.status === statusFilter,
  );

  // Group definitions stay explicit so the restaurant can rename or reorder
  // rooms later without changing the stored table records.
  const groups =
    grouping === 'room'
      ? (['terrace', 'main', 'side'] as const).map((key) => ({
          key,
          label: t(`room.${key}`),
          tables: visibleTables.filter((table) => roomForTable(table) === key),
        }))
      : (['indoor', 'outdoor'] as const).map((key) => ({
          key,
          label: t(`area.${key}`),
          tables: visibleTables.filter((table) => table.area === key),
        }));

  return (
    <>
      <div className="mb-[22px] flex flex-col flex-wrap items-start justify-start gap-x-4 gap-y-2.5 min-[761px]:flex-row min-[761px]:items-center">
        <fieldset className="m-0 flex flex-wrap gap-0.5 border-0 p-0 min-[761px]:gap-[5px]">
          <legend className="sr-only">{t('tables.filter')}</legend>
          {statusFilters.map((filter) => {
            const label =
              filter === 'all' ? t('tables.all') : t(`status.${filter}`);
            const count =
              filter === 'all'
                ? tables.length
                : tables.filter((table) => table.status === filter).length;
            return (
              <Button
                key={filter}
                variant="quinary"
                aria-pressed={statusFilter === filter}
                aria-label={`${label}, ${t('tables.inGroup', { count })}`}
                className={cn(
                  'gap-2 px-[10px] text-base min-[761px]:pr-[10px] min-[761px]:pl-[13px]',
                  filterStyles[filter],
                  statusFilter === filter &&
                    'border-transparent shadow-[inset_0_0_0_2px_currentColor]',
                )}
                onClick={() => onStatusFilterChange(filter)}
              >
                {label}
                <span className="inline-grid h-[26px] min-w-[26px] place-items-center rounded-full bg-white/70 px-1.5 font-mono font-bold tracking-[0.015em] tabular-nums">
                  {count}
                </span>
              </Button>
            );
          })}
        </fieldset>
      </div>
      <div className="grid gap-[26px]">
        {groups.map((group) => (
          <section key={group.key}>
            <div className="mb-2.5 flex items-baseline justify-between gap-3">
              <h3 className="text-[17px] font-semibold">{group.label}</h3>
              <span className="text-base text-ink-muted">
                {t('tables.inGroup', { count: group.tables.length })}
              </span>
            </div>
            {group.tables.length ? (
              <div className="grid grid-cols-2 gap-3 min-[761px]:grid-cols-4">
                {group.tables.map((table) => (
                  <TableCard
                    key={table.id}
                    table={table}
                    now={now}
                    reservation={reservations.find(
                      (reservation) => reservation.id === table.reservationId,
                    )}
                    onClick={() => onOpenTable(table.id)}
                    className="min-h-[140px] p-5 min-[761px]:min-h-[155px]"
                    t={t}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-[10px] border border-dashed border-border p-5 text-center text-base text-ink-muted">
                {t('tables.emptyStatus', {
                  status:
                    statusFilter === 'all'
                      ? t('tables.all').toLowerCase()
                      : t(`status.${statusFilter}`).toLowerCase(),
                })}
              </p>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
