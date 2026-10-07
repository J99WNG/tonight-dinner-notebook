import { TableCard } from '@/components/service-ui';
import { Button } from '@/components/ui/button';
import { operationalType } from '@/components/operational-ui';

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

// Atom configuration
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

/**
 * One semantic table-status filter. The count remains visible in every state
 * so a designer can compare availability without switching filters.
 */
function StatusFilterButton({
  filter,
  count,
  selected,
  onSelect,
  t,
}: {
  filter: TableFilter;
  count: number;
  selected: boolean;
  onSelect: () => void;
  t: Translate;
}) {
  const label = filter === 'all' ? t('tables.all') : t(`status.${filter}`);

  return (
    <Button
      variant="quinary"
      aria-pressed={selected}
      aria-label={`${label}, ${t('tables.inGroup', { count })}`}
      className={cn(
        'gap-2 px-2.5 text-base md:px-3',
        filterStyles[filter],
        selected && 'border-transparent ring-2 ring-current ring-inset',
      )}
      onClick={onSelect}
    >
      {label}
      <span
        className={cn(
          operationalType,
          'inline-grid size-7 place-items-center rounded-full bg-white/70 px-1.5 font-bold',
        )}
      >
        {count}
      </span>
    </Button>
  );
}

/**
 * Two-option segmented control for changing the information architecture of
 * the table view. It changes grouping only and never filters records.
 */
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
    <fieldset className="m-0 inline-flex gap-1 rounded-xl border-0 bg-muted p-1">
      <legend className="sr-only">{t('tables.organize')}</legend>
      {(['room', 'area'] as const).map((option) => (
        <Button
          key={option}
          variant="quinary"
          aria-pressed={grouping === option}
          className={cn(
            'px-3 text-base',
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

/**
 * Filterable table inventory. Status filters preserve their semantic colors;
 * room/area grouping is supplied separately by TableGroupingSwitch.
 */
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

  // Organism structure stays explicit so rooms can be renamed or reordered
  // without changing the stored table records.
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
      <div className="mb-6 flex flex-col flex-wrap items-start justify-start gap-x-4 gap-y-2.5 md:flex-row md:items-center">
        <fieldset className="m-0 flex flex-wrap gap-1 border-0 p-0">
          <legend className="sr-only">{t('tables.filter')}</legend>
          {statusFilters.map((filter) => {
            const count =
              filter === 'all'
                ? tables.length
                : tables.filter((table) => table.status === filter).length;
            return (
              <StatusFilterButton
                key={filter}
                filter={filter}
                count={count}
                selected={statusFilter === filter}
                onSelect={() => onStatusFilterChange(filter)}
                t={t}
              />
            );
          })}
        </fieldset>
      </div>
      <div className="grid gap-7">
        {groups.map((group) => (
          <section key={group.key}>
            <div className="mb-2.5 flex items-baseline justify-between gap-3">
              <h3 className="text-lg font-semibold">{group.label}</h3>
              <span className="text-base text-ink-muted">
                {t('tables.inGroup', { count: group.tables.length })}
              </span>
            </div>
            {group.tables.length ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {group.tables.map((table) => (
                  <TableCard
                    key={table.id}
                    table={table}
                    now={now}
                    reservation={reservations.find(
                      (reservation) => reservation.id === table.reservationId,
                    )}
                    onClick={() => onOpenTable(table.id)}
                    className="min-h-36 p-5 md:min-h-40"
                    t={t}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-border p-5 text-center text-base text-ink-muted">
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
